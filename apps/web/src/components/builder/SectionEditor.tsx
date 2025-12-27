'use client'

import { useState, useCallback, useRef } from 'react'
import {
  GripVertical,
  Settings,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Plus,
  Edit3,
  Palette,
  Layout,
  Image,
  Type,
  Code,
  Sparkles,
  Check,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SectionStyle {
  backgroundColor?: string
  backgroundImage?: string
  padding?: string
  margin?: string
  maxWidth?: string
  textAlign?: 'left' | 'center' | 'right'
  [key: string]: string | undefined
}

export type SectionType = 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'footer' | 'header' | 'content' | 'gallery' | 'contact' | 'custom'

export interface Section {
  id: string
  type: SectionType
  name: string
  content: string
  visible: boolean
  locked: boolean
  style: SectionStyle
}

interface SectionEditorProps {
  sections: Section[]
  onUpdateSections: (sections: Section[]) => void
  onSelectSection: (sectionId: string) => void
  onEditSection: (sectionId: string) => void
  selectedSection: string | null
  onInsertSection: (type: Section['type'], afterId?: string) => void
}

const SECTION_TYPES: { type: Section['type']; name: string; icon: React.ElementType; description: string }[] = [
  { type: 'hero', name: 'Hero', icon: Layout, description: 'Large banner with heading and CTA' },
  { type: 'features', name: 'Features', icon: Layout, description: 'Feature cards or list' },
  { type: 'pricing', name: 'Pricing', icon: Layout, description: 'Pricing plans comparison' },
  { type: 'testimonials', name: 'Testimonials', icon: Type, description: 'Customer quotes and reviews' },
  { type: 'cta', name: 'Call to Action', icon: Layout, description: 'Conversion focused section' },
  { type: 'gallery', name: 'Gallery', icon: Image, description: 'Image or project gallery' },
  { type: 'contact', name: 'Contact', icon: Type, description: 'Contact form and info' },
  { type: 'content', name: 'Content', icon: Type, description: 'Rich text content block' },
  { type: 'custom', name: 'Custom', icon: Code, description: 'Custom HTML/code section' },
]

const SECTION_ICONS: Record<Section['type'], React.ElementType> = {
  hero: Layout,
  features: Layout,
  pricing: Layout,
  testimonials: Type,
  cta: Layout,
  footer: Layout,
  header: Layout,
  content: Type,
  gallery: Image,
  contact: Type,
  custom: Code,
}

export function SectionEditor({
  sections,
  onUpdateSections,
  onSelectSection,
  onEditSection,
  selectedSection,
  onInsertSection,
}: SectionEditorProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedId(sectionId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(sectionId)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const draggedIndex = sections.findIndex(s => s.id === draggedId)
    const targetIndex = sections.findIndex(s => s.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const newSections = [...sections]
    const [removed] = newSections.splice(draggedIndex, 1)
    newSections.splice(targetIndex, 0, removed)

    onUpdateSections(newSections)
    setDraggedId(null)
    setDragOverId(null)
  }

  // Section actions
  const toggleVisibility = (sectionId: string) => {
    onUpdateSections(sections.map(s =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    ))
  }

  const duplicateSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    const index = sections.findIndex(s => s.id === sectionId)
    const newSection: Section = {
      ...section,
      id: `${section.id}-copy-${Date.now()}`,
      name: `${section.name} (Copy)`,
    }

    const newSections = [...sections]
    newSections.splice(index + 1, 0, newSection)
    onUpdateSections(newSections)
  }

  const deleteSection = (sectionId: string) => {
    if (confirm('Delete this section?')) {
      onUpdateSections(sections.filter(s => s.id !== sectionId))
    }
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sections.length - 1) return

    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const [removed] = newSections.splice(index, 1)
    newSections.splice(targetIndex, 0, removed)

    onUpdateSections(newSections)
  }

  // Name editing
  const startEditingName = (section: Section) => {
    setEditingName(section.id)
    setEditValue(section.name)
  }

  const saveNameEdit = () => {
    if (editingName && editValue.trim()) {
      onUpdateSections(sections.map(s =>
        s.id === editingName ? { ...s, name: editValue.trim() } : s
      ))
    }
    setEditingName(null)
    setEditValue('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Add Section Button at Top */}
      <div className="p-2 border-b border-slate-800">
        <button
          onClick={() => setShowAddMenu('top')}
          className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-purple-500 hover:text-purple-400 transition"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Section</span>
        </button>
      </div>

      {/* Section List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sections.map((section, index) => {
          const Icon = SECTION_ICONS[section.type] || Layout
          const isSelected = selectedSection === section.id
          const isExpanded = expandedSection === section.id
          const isDragged = draggedId === section.id
          const isDragOver = dragOverId === section.id

          return (
            <div key={section.id}>
              {/* Section Item */}
              <div
                draggable={!section.locked}
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, section.id)}
                onDrop={(e) => handleDrop(e, section.id)}
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  "group relative rounded-lg border transition",
                  isSelected
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-slate-700 hover:border-slate-600",
                  isDragged && "opacity-50",
                  isDragOver && "border-purple-400 bg-purple-500/20",
                  !section.visible && "opacity-50"
                )}
              >
                {/* Main Row */}
                <div className="flex items-center gap-2 p-2">
                  {/* Drag Handle */}
                  {!section.locked && (
                    <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "p-1.5 rounded",
                    isSelected ? "bg-purple-500/20" : "bg-slate-800"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      isSelected ? "text-purple-400" : "text-slate-400"
                    )} />
                  </div>

                  {/* Name */}
                  {editingName === section.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveNameEdit()
                          if (e.key === 'Escape') setEditingName(null)
                        }}
                        className="h-6 text-xs bg-slate-700 border-slate-600"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button onClick={saveNameEdit} className="p-1">
                        <Check className="w-3 h-3 text-green-400" />
                      </button>
                      <button onClick={() => setEditingName(null)} className="p-1">
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{section.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{section.type}</p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleVisibility(section.id)
                      }}
                      className="p-1 hover:bg-slate-700 rounded"
                      title={section.visible ? 'Hide' : 'Show'}
                    >
                      {section.visible ? (
                        <Eye className="w-3 h-3 text-slate-400" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditSection(section.id)
                      }}
                      className="p-1 hover:bg-slate-700 rounded"
                      title="Edit"
                    >
                      <Edit3 className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedSection(isExpanded ? null : section.id)
                      }}
                      className="p-1 hover:bg-slate-700 rounded"
                      title="Options"
                    >
                      <Settings className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Expanded Options */}
                {isExpanded && (
                  <div className="px-2 pb-2 space-y-2 border-t border-slate-700 mt-1 pt-2">
                    {/* Move buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                        className="flex-1 flex items-center justify-center gap-1 p-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-3 h-3" />
                        Move Up
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === sections.length - 1}
                        className="flex-1 flex items-center justify-center gap-1 p-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Move Down
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditingName(section)}
                        className="flex-1 flex items-center justify-center gap-1 p-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded"
                      >
                        <Type className="w-3 h-3" />
                        Rename
                      </button>
                      <button
                        onClick={() => duplicateSection(section.id)}
                        className="flex-1 flex items-center justify-center gap-1 p-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded"
                      >
                        <Copy className="w-3 h-3" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="flex-1 flex items-center justify-center gap-1 p-1.5 text-xs bg-red-900/50 hover:bg-red-900 text-red-300 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>

                    {/* AI Enhance */}
                    <button
                      onClick={() => {
                        // Trigger AI to enhance this section
                        console.log('Enhance section:', section.id)
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      Enhance with AI
                    </button>
                  </div>
                )}
              </div>

              {/* Add Section After Button */}
              {showAddMenu === section.id && (
                <div className="p-2 bg-slate-800 rounded-lg mt-1 mb-1 space-y-2">
                  <p className="text-xs text-slate-400 mb-2">Choose section type:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {SECTION_TYPES.map(type => (
                      <button
                        key={type.type}
                        onClick={() => {
                          onInsertSection(type.type, section.id)
                          setShowAddMenu(null)
                        }}
                        className="flex items-center gap-2 p-2 text-left text-xs bg-slate-700 hover:bg-slate-600 rounded transition"
                      >
                        <type.icon className="w-3 h-3 text-slate-400" />
                        <span className="text-white">{type.name}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAddMenu(null)}
                    className="w-full p-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Add button between sections */}
              {index < sections.length - 1 && showAddMenu !== section.id && (
                <button
                  onClick={() => setShowAddMenu(section.id)}
                  className="w-full py-1 my-1 opacity-0 hover:opacity-100 transition flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-purple-400"
                >
                  <Plus className="w-3 h-3" />
                  Add section
                </button>
              )}
            </div>
          )
        })}

        {sections.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Layout className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No sections yet</p>
            <p className="text-xs mt-1">Add sections to build your page</p>
          </div>
        )}
      </div>

      {/* Add Menu for Top */}
      {showAddMenu === 'top' && (
        <div className="absolute top-16 left-2 right-2 p-3 bg-slate-800 rounded-lg shadow-xl z-10 space-y-2">
          <p className="text-xs text-slate-400 mb-2">Choose section type:</p>
          <div className="grid grid-cols-2 gap-2">
            {SECTION_TYPES.map(type => (
              <button
                key={type.type}
                onClick={() => {
                  onInsertSection(type.type)
                  setShowAddMenu(null)
                }}
                className="flex items-center gap-2 p-2 text-left bg-slate-700 hover:bg-slate-600 rounded transition"
              >
                <type.icon className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-white">{type.name}</p>
                  <p className="text-xs text-slate-500">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddMenu(null)}
            className="w-full p-2 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
