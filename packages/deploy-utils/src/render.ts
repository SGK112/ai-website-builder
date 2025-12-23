import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface RenderDeployOptions {
  serviceName: string
  repoUrl: string
  branch?: string
  envVars?: Array<{ key: string; value: string }>
  renderYaml?: string
}

export class RenderDeployService {
  private workspaceId: string

  constructor(workspaceId?: string) {
    this.workspaceId = workspaceId || 'default'
  }

  async createService(options: RenderDeployOptions): Promise<{
    serviceId: string
    dashboardUrl: string
    deployUrl?: string
  }> {
    // Use Render CLI to create service
    const createCommand = `render services create \
      --name="${options.serviceName}" \
      --type=web \
      --env=node \
      --repo="${options.repoUrl}" \
      --branch="${options.branch || 'main'}" \
      --build-command="npm install && npm run build" \
      --start-command="npm start" \
      --format=json`

    try {
      const { stdout } = await execAsync(createCommand)
      const result = JSON.parse(stdout)

      // Set environment variables
      if (options.envVars?.length) {
        await this.setEnvVars(result.id, options.envVars)
      }

      return {
        serviceId: result.id,
        dashboardUrl: `https://dashboard.render.com/web/${result.id}`,
        deployUrl: result.service?.url,
      }
    } catch (error) {
      console.error('Render service creation failed:', error)
      throw new Error(
        `Failed to create Render service: ${(error as Error).message}`
      )
    }
  }

  async setEnvVars(
    serviceId: string,
    envVars: Array<{ key: string; value: string }>
  ): Promise<void> {
    for (const { key, value } of envVars) {
      const command = `render services env set ${serviceId} ${key}="${value}"`
      await execAsync(command)
    }
  }

  async triggerDeploy(serviceId: string): Promise<{
    deployId: string
    status: string
  }> {
    const command = `render deploys create ${serviceId} --format=json`
    const { stdout } = await execAsync(command)
    const result = JSON.parse(stdout)

    return {
      deployId: result.id,
      status: result.status,
    }
  }

  async getDeployStatus(deployId: string): Promise<{
    status: 'building' | 'live' | 'failed' | 'canceled'
    logs?: string[]
    url?: string
  }> {
    const command = `render deploys show ${deployId} --format=json`
    const { stdout } = await execAsync(command)
    const result = JSON.parse(stdout)

    return {
      status: result.status,
      logs: result.logs,
      url: result.service?.url,
    }
  }

  async getLogs(serviceId: string, lines = 100): Promise<string[]> {
    const command = `render logs ${serviceId} --tail=${lines}`
    const { stdout } = await execAsync(command)
    return stdout.split('\n').filter(Boolean)
  }

  async deleteService(serviceId: string): Promise<void> {
    const command = `render services delete ${serviceId} --yes`
    await execAsync(command)
  }

  async listServices(): Promise<
    Array<{
      id: string
      name: string
      type: string
      status: string
    }>
  > {
    const command = 'render services list --format=json'
    const { stdout } = await execAsync(command)
    return JSON.parse(stdout)
  }
}
