'use client'

import { useState, useCallback } from 'react'
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Edit3,
  ChevronRight,
  Home,
  Settings,
  GripVertical,
  ExternalLink,
  Check,
  X,
  FileCode,
  Layout,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Page {
  id: string
  name: string
  path: string
  title: string
  description?: string
  isHome?: boolean
  template?: string
  sections: string[]
  createdAt: Date
  updatedAt: Date
}

interface PageManagerProps {
  pages: Page[]
  activePage: string | null
  onSelectPage: (pageId: string) => void
  onCreatePage: (page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdatePage: (pageId: string, updates: Partial<Page>) => void
  onDeletePage: (pageId: string) => void
  onDuplicatePage: (pageId: string) => void
  onReorderPages: (pages: Page[]) => void
}

const PAGE_TEMPLATES = [
  { id: 'blank', name: 'Blank Page', icon: FileText },
  { id: 'landing', name: 'Landing Page', icon: Layout },
  { id: 'about', name: 'About Page', icon: FileText },
  { id: 'contact', name: 'Contact Page', icon: FileText },
  { id: 'pricing', name: 'Pricing Page', icon: FileText },
  { id: 'blog', name: 'Blog Page', icon: FileCode },
]

export function PageManager({
  pages,
  activePage,
  onSelectPage,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  onDuplicatePage,
  onReorderPages,
}: PageManagerProps) {
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [newPagePath, setNewPagePath] = useState('')
  const [newPageTemplate, setNewPageTemplate] = useState('blank')
  const [editingPage, setEditingPage] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Create new page
  const handleCreatePage = () => {
    if (!newPageName.trim()) return

    const path = newPagePath.trim() || `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`

    onCreatePage({
      name: newPageName.trim(),
      path,
      title: newPageName.trim(),
      template: newPageTemplate,
      sections: [],
      isHome: pages.length === 0,
    })

    setNewPageName('')
    setNewPagePath('')
    setNewPageTemplate('blank')
    setShowNewPage(false)
  }

  // Start editing page name
  const startEditing = (page: Page) => {
    setEditingPage(page.id)
    setEditValue(page.name)
  }

  // Save page name edit
  const saveEdit = (pageId: string) => {
    if (editValue.trim()) {
      onUpdatePage(pageId, { name: editValue.trim() })
    }
    setEditingPage(null)
    setEditValue('')
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingPage(null)
    setEditValue('')
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedId(pageId)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const draggedIndex = pages.findIndex(p => p.id === draggedId)
    const targetIndex = pages.findIndex(p => p.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null)
      return
    }

    const newPages = [...pages]
    const [removed] = newPages.splice(draggedIndex, 1)
    newPages.splice(targetIndex, 0, removed)

    onReorderPages(newPages)
    setDraggedId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-sm font-medium text-white">Pages</span>
        <Button
          onClick={() => setShowNewPage(true)}
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-slate-400 hover:text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* New Page Form */}
      {showNewPage && (
        <div className="p-3 border-b border-slate-800 space-y-3 bg-slate-800/50">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Page Name</label>
            <Input
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              placeholder="About Us"
              className="bg-slate-800 border-slate-700 text-sm h-8"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">URL Path</label>
            <Input
              value={newPagePath}
              onChange={(e) => setNewPagePath(e.target.value)}
              placeholder="/about"
              className="bg-slate-800 border-slate-700 text-sm h-8"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Template</label>
            <div className="grid grid-cols-2 gap-1">
              {PAGE_TEMPLATES.slice(0, 4).map(template => (
                <button
                  key={template.id}
                  onClick={() => setNewPageTemplate(template.id)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded text-xs transition",
                    newPageTemplate === template.id
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  <template.icon className="w-3 h-3" />
                  {template.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreatePage}
              disabled={!newPageName.trim()}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Create Page
            </Button>
            <Button
              onClick={() => setShowNewPage(false)}
              size="sm"
              variant="outline"
              className="border-slate-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No pages yet</p>
            <p className="text-xs mt-1">Create your first page to get started</p>
          </div>
        ) : (
          pages.map(page => (
            <div
              key={page.id}
              draggable
              onDragStart={(e) => handleDragStart(e, page.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, page.id)}
              className={cn(
                "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition",
                activePage === page.id
                  ? "bg-purple-600/20 border border-purple-500/50"
                  : "hover:bg-slate-800 border border-transparent",
                draggedId === page.id && "opacity-50"
              )}
              onClick={() => onSelectPage(page.id)}
            >
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing text-slate-600 opacity-0 group-hover:opacity-100 transition">
                <GripVertical className="w-3 h-3" />
              </div>

              {/* Icon */}
              {page.isHome ? (
                <Home className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}

              {/* Name */}
              {editingPage === page.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(page.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="h-6 text-xs bg-slate-700 border-slate-600"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      saveEdit(page.id)
                    }}
                    className="p-1 hover:bg-slate-700 rounded"
                  >
                    <Check className="w-3 h-3 text-green-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      cancelEdit()
                    }}
                    className="p-1 hover:bg-slate-700 rounded"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{page.name}</p>
                    <p className="text-xs text-slate-500 truncate">{page.path}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(page)
                      }}
                      className="p-1 hover:bg-slate-700 rounded"
                      title="Rename"
                    >
                      <Edit3 className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicatePage(page.id)
                      }}
                      className="p-1 hover:bg-slate-700 rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                    {!page.isHome && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Delete this page?')) {
                            onDeletePage(page.id)
                          }
                        }}
                        className="p-1 hover:bg-red-900/50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
          <button className="flex items-center gap-1 hover:text-white transition">
            <Settings className="w-3 h-3" />
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
