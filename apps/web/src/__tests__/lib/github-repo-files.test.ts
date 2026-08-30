import { describe, it, expect } from 'vitest'
import { buildRepoFiles } from '@/lib/project-sidecars'

const page = (slug: string, isHome = false) => ({
  id: slug, name: slug, slug, html: `<h1>${slug}</h1>`, isHome,
})

describe('buildRepoFiles', () => {
  it('writes a single-page website as index.html', () => {
    const files = buildRepoFiles({
      html: '<h1>home</h1>', vfsFiles: {}, pages: [page('index', true)], buildTarget: 'website',
    })
    expect(files).toEqual([{ path: 'index.html', content: '<h1>home</h1>', type: 'html' }])
  })

  it('writes each extra page as <slug>.html so the repo re-imports as pages', () => {
    const files = buildRepoFiles({
      html: '<h1>home</h1>',
      vfsFiles: {},
      pages: [page('index', true), page('about'), page('pricing')],
      buildTarget: 'website',
    })
    expect(files.map(f => f.path)).toEqual(['index.html', 'about.html', 'pricing.html'])
  })

  it('passes a framework project through the VFS untouched', () => {
    const vfsFiles = { 'package.json': '{}', 'app/page.tsx': 'export default () => null' }
    const files = buildRepoFiles({ html: '', vfsFiles, pages: [], buildTarget: 'nextjs' })
    expect(files.map(f => f.path).sort()).toEqual(['app/page.tsx', 'package.json'])
  })

  it('never sends .env files to a repo', () => {
    const vfsFiles = {
      '.env': 'SECRET=1', '.env.local': 'SECRET=2', 'src/.env.production': 'SECRET=3',
      'index.js': 'ok', 'environment.ts': 'not a dotenv',
    }
    const paths = buildRepoFiles({ html: '', vfsFiles, pages: [], buildTarget: 'react' }).map(f => f.path)
    expect(paths).not.toContain('.env')
    expect(paths).not.toContain('.env.local')
    expect(paths).not.toContain('src/.env.production')
    expect(paths).toContain('index.js')
    expect(paths).toContain('environment.ts')
  })

  it('drops Webstew persistence sidecars', () => {
    const vfsFiles = { '_webstew_chat.json': '{}', '_webstew_meta.json': '{}', 'index.js': 'ok' }
    const paths = buildRepoFiles({ html: '', vfsFiles, pages: [], buildTarget: 'react' }).map(f => f.path)
    expect(paths).toEqual(['index.js'])
  })

  it('falls back to the home page html when the editor buffer is empty', () => {
    const files = buildRepoFiles({
      html: '', vfsFiles: {}, pages: [page('index', true)], buildTarget: 'website',
    })
    expect(files[0].content).toBe('<h1>index</h1>')
  })
})
