interface RenderYamlConfig {
  serviceName: string
  projectType: 'business-portfolio' | 'ecommerce' | 'saas'
  envVariables: Array<{ key: string; value: string; isSecret: boolean }>
  plan?: 'free' | 'starter' | 'standard'
  region?: string
}

export function generateRenderYaml(config: RenderYamlConfig): string {
  const { serviceName, projectType, envVariables, plan = 'free', region = 'oregon' } = config

  const envVarsYaml = envVariables
    .map((v) => {
      if (v.isSecret) {
        return `    - key: ${v.key}\n      sync: false`
      }
      return `    - key: ${v.key}\n      value: ${v.value}`
    })
    .join('\n')

  const needsDatabase = projectType === 'ecommerce' || projectType === 'saas'

  let yaml = `# AI Website Builder - Generated render.yaml
# https://render.com/docs/blueprint-spec

services:
  - type: web
    name: ${serviceName}
    env: node
    plan: ${plan}
    region: ${region}
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
${envVarsYaml}
      - key: NODE_ENV
        value: production
`

  if (needsDatabase) {
    yaml += `
databases:
  - name: ${serviceName}-db
    plan: ${plan}
    databaseName: ${serviceName.replace(/-/g, '_')}_db
    user: ${serviceName.replace(/-/g, '_')}_user
`
  }

  return yaml
}

export function parseRenderYaml(yaml: string): RenderYamlConfig {
  // Simple YAML parser for our specific format
  const lines = yaml.split('\n')
  const config: Partial<RenderYamlConfig> = {
    envVariables: [],
  }

  let inEnvVars = false
  let currentEnvVar: { key: string; value: string; isSecret: boolean } | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('name:') && !inEnvVars) {
      config.serviceName = trimmed.split(':')[1].trim()
    }

    if (trimmed === 'envVars:') {
      inEnvVars = true
      continue
    }

    if (inEnvVars) {
      if (trimmed.startsWith('- key:')) {
        if (currentEnvVar) {
          config.envVariables!.push(currentEnvVar)
        }
        currentEnvVar = {
          key: trimmed.split(':')[1].trim(),
          value: '',
          isSecret: false,
        }
      } else if (trimmed.startsWith('value:') && currentEnvVar) {
        currentEnvVar.value = trimmed.split(':').slice(1).join(':').trim()
      } else if (trimmed.startsWith('sync:') && currentEnvVar) {
        currentEnvVar.isSecret = trimmed.includes('false')
      } else if (trimmed.startsWith('databases:')) {
        if (currentEnvVar) {
          config.envVariables!.push(currentEnvVar)
        }
        inEnvVars = false
      }
    }

    if (trimmed.startsWith('plan:')) {
      const plan = trimmed.split(':')[1].trim() as 'free' | 'starter' | 'standard'
      config.plan = plan
    }

    if (trimmed.startsWith('region:')) {
      config.region = trimmed.split(':')[1].trim()
    }
  }

  if (currentEnvVar) {
    config.envVariables!.push(currentEnvVar)
  }

  return config as RenderYamlConfig
}
