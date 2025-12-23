'use client'

import { useState } from 'react'
import { FileCode, Folder, ChevronRight, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileTreeNode[]
}

interface FileTreeProps {
  files: Array<{ path: string; language: string }>
  selectedFile: string | null
  onFileSelect: (path: string) => void
}

export function FileTree({ files, selectedFile, onFileSelect }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))

  // Build tree structure from flat file list
  const tree = buildFileTree(files)

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFile === node.path

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded cursor-pointer`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm truncate">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div
        key={node.path}
        className={`flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded cursor-pointer ${
          isSelected ? 'bg-primary/10 text-primary' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 28}px` }}
        onClick={() => onFileSelect(node.path)}
      >
        <FileCode className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm truncate">{node.name}</span>
      </div>
    )
  }

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardContent className="p-0 overflow-auto flex-1">
        <div className="p-2">{tree.children?.map((node) => renderNode(node))}</div>
      </CardContent>
    </Card>
  )
}

function buildFileTree(files: Array<{ path: string; language: string }>): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    path: '/',
    type: 'folder',
    children: [],
  }

  files.forEach((file) => {
    const parts = file.path.split('/').filter(Boolean)
    let currentNode = root

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1
      const currentPath = '/' + parts.slice(0, index + 1).join('/')

      if (!currentNode.children) {
        currentNode.children = []
      }

      let childNode = currentNode.children.find((n) => n.name === part)

      if (!childNode) {
        childNode = {
          name: part,
          path: currentPath,
          type: isLastPart ? 'file' : 'folder',
          children: isLastPart ? undefined : [],
        }
        currentNode.children.push(childNode)
      }

      if (!isLastPart) {
        currentNode = childNode
      }
    })
  })

  // Sort: folders first, then files, both alphabetically
  const sortChildren = (node: FileTreeNode) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
      node.children.forEach(sortChildren)
    }
  }
  sortChildren(root)

  return root
}
