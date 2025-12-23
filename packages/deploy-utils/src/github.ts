import { Octokit } from '@octokit/rest'

interface CreateRepoOptions {
  name: string
  description?: string
  isPrivate?: boolean
  files: Array<{ path: string; content: string }>
}

export class GitHubDeployService {
  private octokit: Octokit
  private owner: string

  constructor(accessToken: string, owner: string) {
    this.octokit = new Octokit({ auth: accessToken })
    this.owner = owner
  }

  async createRepository(
    options: CreateRepoOptions
  ): Promise<{ url: string; cloneUrl: string }> {
    // Create the repository
    const { data: repo } = await this.octokit.repos.createForAuthenticatedUser({
      name: options.name,
      description: options.description,
      private: options.isPrivate ?? true,
      auto_init: true,
    })

    // Wait for repo initialization
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Push initial files
    await this.pushFiles(
      options.name,
      options.files,
      'Initial commit from AI Website Builder'
    )

    return {
      url: repo.html_url,
      cloneUrl: repo.clone_url,
    }
  }

  async pushFiles(
    repoName: string,
    files: Array<{ path: string; content: string }>,
    message: string
  ): Promise<string> {
    // Get the current commit SHA
    const { data: ref } = await this.octokit.git.getRef({
      owner: this.owner,
      repo: repoName,
      ref: 'heads/main',
    })
    const currentCommitSha = ref.object.sha

    // Get the current tree
    const { data: currentCommit } = await this.octokit.git.getCommit({
      owner: this.owner,
      repo: repoName,
      commit_sha: currentCommitSha,
    })

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data } = await this.octokit.git.createBlob({
          owner: this.owner,
          repo: repoName,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        })
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: data.sha,
        }
      })
    )

    // Create new tree
    const { data: newTree } = await this.octokit.git.createTree({
      owner: this.owner,
      repo: repoName,
      base_tree: currentCommit.tree.sha,
      tree: blobs,
    })

    // Create commit
    const { data: newCommit } = await this.octokit.git.createCommit({
      owner: this.owner,
      repo: repoName,
      message,
      tree: newTree.sha,
      parents: [currentCommitSha],
    })

    // Update reference
    await this.octokit.git.updateRef({
      owner: this.owner,
      repo: repoName,
      ref: 'heads/main',
      sha: newCommit.sha,
    })

    return newCommit.sha
  }

  async deleteRepository(repoName: string): Promise<void> {
    await this.octokit.repos.delete({
      owner: this.owner,
      repo: repoName,
    })
  }
}
