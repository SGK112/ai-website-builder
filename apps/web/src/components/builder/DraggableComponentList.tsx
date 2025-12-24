'use client'

import { useState, useCallback, DragEvent } from 'react'
import {
  GripVertical,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ChevronRight,
  ChevronDown,
  Code2,
  Image,
  Type,
  Layout,
  Box,
  List,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComponentNode {
  id: string
  name: string
  type: 'section' | 'component' | 'element'
  tagName: string
  visible: boolean
  children?: ComponentNode[]
  collapsed?: boolean
}

interface DraggableComponentListProps {
  components: ComponentNode[]
  onReorder: (components: ComponentNode[]) => void
  onSelect: (componentId: string) => void
  onToggleVisibility: (componentId: string) => void
  onDuplicate: (componentId: string) => void
  onDelete: (componentId: string) => void
  selectedId?: string
}

const getComponentIcon = (type: string, tagName: string) => {
  const tag = tagName.toLowerCase()
  if (tag === 'section' || tag === 'main' || tag === 'header' || tag === 'footer') return Layout
  if (tag === 'img' || tag === 'picture') return Image
  if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'p' || tag === 'span') return Type
  if (tag === 'ul' || tag === 'ol' || tag === 'li') return List
  if (tag === 'div' || tag === 'article') return Box
  return Code2
}

export function DraggableComponentList({
  components,
  onReorder,
  onSelect,
  onToggleVisibility,
  onDuplicate,
  onDelete,
  selectedId,
}: DraggableComponentListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']))

  const handleDragStart = useCallback((e: DragEvent, componentId: string) => {
    setDraggedId(componentId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', componentId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
  }, [])

  const handleDragOver = useCallback((e: DragEvent, componentId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(componentId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback((e: DragEvent, targetId: string) => {
    e.preventDefault()

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    // Find indices and reorder
    const findIndex = (items: ComponentNode[], id: string): number => {
      return items.findIndex(item => item.id === id)
    }

    const draggedIndex = findIndex(components, draggedId)
    const targetIndex = findIndex(components, targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const newComponents = [...components]
    const [removed] = newComponents.splice(draggedIndex, 1)
    newComponents.splice(targetIndex, 0, removed)

    onReorder(newComponents)
    setDraggedId(null)
    setDragOverId(null)
  }, [draggedId, components, onReorder])

  const toggleExpanded = useCallback((componentId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(componentId)) {
        next.delete(componentId)
      } else {
        next.add(componentId)
      }
      return next
    })
  }, [])

  const renderComponent = (component: ComponentNode, depth: number = 0) => {
    const isSelected = selectedId === component.id
    const isDragged = draggedId === component.id
    const isDragOver = dragOverId === component.id
    const isExpanded = expandedIds.has(component.id)
    const hasChildren = component.children && component.children.length > 0
    const Icon = getComponentIcon(component.type, component.tagName)

    return (
      <div key={component.id} className="select-none">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, component.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, component.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, component.id)}
          onClick={() => onSelect(component.id)}
          className={cn(
            'group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-all',
            isSelected
              ? 'bg-blue-600/20 text-blue-300'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
            isDragged && 'opacity-50',
            isDragOver && 'bg-blue-500/30 ring-2 ring-blue-500/50',
            !component.visible && 'opacity-50'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3 h-3" />
          </div>

          {/* Expand/Collapse */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(component.id)
              }}
              className="p-0.5 hover:bg-slate-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Icon */}
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />

          {/* Name */}
          <span className="flex-1 text-sm truncate">{component.name}</span>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleVisibility(component.id)
              }}
              className="p-1 hover:bg-slate-700 rounded"
              title={component.visible ? 'Hide' : 'Show'}
            >
              {component.visible ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate(component.id)
              }}
              className="p-1 hover:bg-slate-700 rounded"
              title="Duplicate"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(component.id)
              }}
              className="p-1 hover:bg-red-900/50 hover:text-red-400 rounded"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l border-slate-800">
            {component.children!.map(child => renderComponent(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0.5 p-2">
      {components.length === 0 ? (
        <div className="p-4 text-center text-slate-500 text-sm">
          No components yet. Add components from the library.
        </div>
      ) : (
        components.map(component => renderComponent(component))
      )}
    </div>
  )
}

// Helper function to parse JSX/HTML into ComponentNode structure
export function parseComponentTree(content: string): ComponentNode[] {
  // This is a simplified parser - in production you'd use a proper AST parser
  const components: ComponentNode[] = []

  // Match top-level sections/components
  const sectionRegex = /<(section|header|footer|main|nav|aside)[^>]*(?:className=["']([^"']*)["'])?[^>]*>/gi
  let match
  let id = 0

  while ((match = sectionRegex.exec(content)) !== null) {
    const tagName = match[1]
    const className = match[2] || ''

    // Extract a meaningful name from className or use tagName
    let name = tagName.charAt(0).toUpperCase() + tagName.slice(1)
    if (className.includes('hero')) name = 'Hero Section'
    else if (className.includes('feature')) name = 'Features'
    else if (className.includes('testimonial')) name = 'Testimonials'
    else if (className.includes('pricing')) name = 'Pricing'
    else if (className.includes('contact')) name = 'Contact'
    else if (className.includes('footer')) name = 'Footer'
    else if (className.includes('header') || className.includes('nav')) name = 'Navigation'

    components.push({
      id: `component-${id++}`,
      name,
      type: 'section',
      tagName,
      visible: true,
    })
  }

  return components
}
