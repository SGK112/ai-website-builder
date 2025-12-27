'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  MoreVertical,
  Home,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  GripVertical,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Page {
  id: string
  name: string
  slug: string
  isHome: boolean
  elements: any[] // PageElement[]
  createdAt: Date
}

interface PagesPanelProps {
  pages: Page[]
  currentPageId: string
  onSelectPage: (pageId: string) => void
  onAddPage: (name: string, slug: string) => void
  onDeletePage: (pageId: string) => void
  onDuplicatePage: (pageId: string) => void
  onRenamePage: (pageId: string, name: string, slug: string) => void
  onSetHomePage: (pageId: string) => void
}

export function PagesPanel({
  pages,
  currentPageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onRenamePage,
  onSetHomePage,
}: PagesPanelProps) {
  const [isAddingPage, setIsAddingPage] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const handleAddPage = () => {
    if (!newPageName.trim()) return
    const slug = newPageName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    onAddPage(newPageName.trim(), slug || 'page')
    setNewPageName('')
    setIsAddingPage(false)
  }

  const handleStartEdit = (page: Page) => {
    setEditingPageId(page.id)
    setEditName(page.name)
    setMenuOpenId(null)
  }

  const handleSaveEdit = (pageId: string) => {
    if (!editName.trim()) return
    const slug = editName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    onRenamePage(pageId, editName.trim(), slug)
    setEditingPageId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <h3 className="font-medium text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Pages
        </h3>
        <button
          onClick={() => setIsAddingPage(true)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
          title="Add Page"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Page Form */}
      <AnimatePresence>
        {isAddingPage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-800 overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <input
                type="text"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPage()
                  if (e.key === 'Escape') setIsAddingPage(false)
                }}
                placeholder="Page name..."
                autoFocus
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddPage}
                  disabled={!newPageName.trim()}
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-sm rounded-lg transition"
                >
                  Add Page
                </button>
                <button
                  onClick={() => { setIsAddingPage(false); setNewPageName('') }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pages.map((page) => (
          <div
            key={page.id}
            className={cn(
              'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all',
              currentPageId === page.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            )}
            onClick={() => onSelectPage(page.id)}
          >
            {/* Drag Handle */}
            <GripVertical className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 cursor-grab" />

            {/* Home Icon */}
            {page.isHome && (
              <Home className={cn('w-4 h-4 shrink-0', currentPageId === page.id ? 'text-white' : 'text-blue-400')} />
            )}

            {/* Page Name / Edit Input */}
            {editingPageId === page.id ? (
              <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(page.id)
                    if (e.key === 'Escape') setEditingPageId(null)
                  }}
                  autoFocus
                  className="flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSaveEdit(page.id)}
                  className="p-1 text-green-400 hover:bg-slate-700 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setEditingPageId(null)}
                  className="p-1 text-red-400 hover:bg-slate-700 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium truncate">
                  {page.name}
                </span>
                <span className={cn(
                  'text-xs truncate max-w-[80px]',
                  currentPageId === page.id ? 'text-blue-200' : 'text-slate-500'
                )}>
                  /{page.slug}
                </span>
              </>
            )}

            {/* Menu Button */}
            {editingPageId !== page.id && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpenId(menuOpenId === page.id ? null : page.id)
                  }}
                  className={cn(
                    'p-1 rounded opacity-0 group-hover:opacity-100 transition',
                    currentPageId === page.id ? 'hover:bg-blue-500' : 'hover:bg-slate-700'
                  )}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {menuOpenId === page.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-8 z-50 w-40 py-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleStartEdit(page)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                        Rename
                      </button>
                      <button
                        onClick={() => { onDuplicatePage(page.id); setMenuOpenId(null) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      {!page.isHome && (
                        <button
                          onClick={() => { onSetHomePage(page.id); setMenuOpenId(null) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          <Home className="w-4 h-4" />
                          Set as Home
                        </button>
                      )}
                      {pages.length > 1 && (
                        <>
                          <div className="my-1 border-t border-slate-700" />
                          <button
                            onClick={() => { onDeletePage(page.id); setMenuOpenId(null) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          {pages.length} page{pages.length !== 1 ? 's' : ''} in project
        </p>
      </div>
    </div>
  )
}
