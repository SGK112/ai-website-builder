import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Project, Deployment } from '@ai-website-builder/database'
import { GitHubDeployService } from '@ai-website-builder/deploy-utils'
import mongoose from 'mongoose'

// POST /api/projects/[id]/deploy - Deploy a project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const body = await req.json()
    const { githubToken, renderApiKey, repositoryName } = body

    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const project = await Project.findOne({
      _id: params.id,
      userId: session.user.id,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'ready') {
      return NextResponse.json(
        { error: 'Project must be in ready status to deploy' },
        { status: 400 }
      )
    }

    // Create deployment record
    const deployment = await Deployment.create({
      projectId: project._id,
      userId: session.user.id,
      platform: 'render',
      status: 'pending',
      logs: [],
    })

    try {
      // Initialize GitHub service
      // Get GitHub username first
      const githubUser = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }).then((res) => res.json())

      if (!githubUser.login) {
        throw new Error('Failed to get GitHub user information')
      }

      const githubService = new GitHubDeployService(githubToken, githubUser.login)

      // Create repository
      const repoName = repositoryName || `${project.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

      // Prepare files for commit
      const files = project.files.map((f: any) => ({
        path: f.path,
        content: f.content,
      }))

      // Add package.json if not present
      if (!files.find((f: any) => f.path === 'package.json')) {
        files.push({
          path: 'package.json',
          content: JSON.stringify(
            {
              name: repoName,
              version: '1.0.0',
              private: true,
              scripts: {
                dev: 'next dev',
                build: 'next build',
                start: 'next start',
              },
              dependencies: {
                next: '^14.1.0',
                react: '^18.2.0',
                'react-dom': '^18.2.0',
              },
              devDependencies: {
                '@types/node': '^20',
                '@types/react': '^18',
                '@types/react-dom': '^18',
                typescript: '^5',
              },
            },
            null,
            2
          ),
        })
      }

      deployment.logs.push({
        timestamp: new Date(),
        message: `Creating GitHub repository: ${repoName}`,
        level: 'info',
      })
      await deployment.save()

      const repoResult = await githubService.createRepository({
        name: repoName,
        description: project.description || `Generated ${project.type} website`,
        isPrivate: false,
        files: files,
      })

      project.repositoryUrl = repoResult.cloneUrl
      
      deployment.logs.push({
        timestamp: new Date(),
        message: `Repository created: ${repoResult.url}`,
        level: 'info',
      })
      await deployment.save()

      // For Render deployment, we'd integrate with Render API here
      // For now, we'll mark as success and provide manual deployment instructions
      deployment.status = 'success'
      deployment.deploymentUrl = repoResult.url
      deployment.logs.push({
        timestamp: new Date(),
        message: 'Deployment preparation complete. Connect to Render manually.',
        level: 'info',
      })
      await deployment.save()

      project.status = 'deployed'
      project.deploymentId = deployment._id
      await project.save()

      return NextResponse.json({
        success: true,
        deployment: {
          id: deployment._id,
          status: deployment.status,
          repositoryUrl: repoResult.url,
          deploymentUrl: deployment.deploymentUrl,
        },
      })
    } catch (deployError) {
      console.error('Deployment error:', deployError)
      
      deployment.status = 'failed'
      deployment.logs.push({
        timestamp: new Date(),
        message: `Deployment failed: ${deployError instanceof Error ? deployError.message : 'Unknown error'}`,
        level: 'error',
      })
      await deployment.save()

      return NextResponse.json(
        {
          error: 'Deployment failed',
          message: deployError instanceof Error ? deployError.message : 'Unknown error',
          deploymentId: deployment._id,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Deploy API error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate deployment' },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/deploy - Get deployment status
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    await connectDB()

    const project = await Project.findOne({
      _id: params.id,
      userId: session.user.id,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.deploymentId) {
      return NextResponse.json({ deployment: null })
    }

    const deployment = await Deployment.findById(project.deploymentId).lean()

    return NextResponse.json({ deployment })
  } catch (error) {
    console.error('GET deployment error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployment' },
      { status: 500 }
    )
  }
}
