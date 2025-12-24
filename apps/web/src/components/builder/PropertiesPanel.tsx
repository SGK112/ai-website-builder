'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Type,
  Palette,
  Layout,
  Box,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  ChevronDown,
  RotateCcw,
  Copy,
  Trash2,
  Move,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectedElement {
  id: string
  type: string
  tagName: string
  className: string
  textContent?: string
  styles: Record<string, string>
  attributes: Record<string, string>
}

interface PropertiesPanelProps {
  selectedElement: SelectedElement | null
  onUpdateElement: (updates: Partial<SelectedElement>) => void
  onDeleteElement: () => void
  onDuplicateElement: () => void
  onClose: () => void
}

const colorPresets = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
  '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#000000', '#ffffff', '#6b7280',
]

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px', '72px']
const fontWeights = ['300', '400', '500', '600', '700', '800', '900']
const spacingSizes = ['0', '0.25rem', '0.5rem', '0.75rem', '1rem', '1.5rem', '2rem', '3rem', '4rem', '6rem', '8rem']

export function PropertiesPanel({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onClose,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'layout' | 'advanced'>('style')
  const [localStyles, setLocalStyles] = useState<Record<string, string>>({})

  useEffect(() => {
    if (selectedElement) {
      setLocalStyles(selectedElement.styles)
    }
  }, [selectedElement])

  if (!selectedElement) {
    return (
      <div className="w-72 bg-slate-900 border-l border-slate-700 p-4">
        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
          Select an element to edit
        </div>
      </div>
    )
  }

  const updateStyle = (property: string, value: string) => {
    const newStyles = { ...localStyles, [property]: value }
    setLocalStyles(newStyles)
    onUpdateElement({ styles: newStyles })
  }

  const updateText = (text: string) => {
    onUpdateElement({ textContent: text })
  }

  return (
    <div className="w-72 bg-slate-900 border-l border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white capitalize">
            {selectedElement.tagName.toLowerCase()}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-slate-700 flex gap-1">
        <button
          onClick={onDuplicateElement}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          title="Duplicate"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Duplicate</span>
        </button>
        <button
          onClick={onDeleteElement}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {(['style', 'layout', 'advanced'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 text-xs font-medium capitalize transition',
              activeTab === tab
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-white'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'style' && (
          <>
            {/* Text Content */}
            {selectedElement.textContent !== undefined && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Text Content
                </label>
                <textarea
                  value={selectedElement.textContent}
                  onChange={(e) => updateText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* Typography */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Type className="w-3 h-3" />
                Typography
              </label>

              {/* Font Size */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 mb-1 block">Size</label>
                  <select
                    value={localStyles.fontSize || '16px'}
                    onChange={(e) => updateStyle('fontSize', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  >
                    {fontSizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 mb-1 block">Weight</label>
                  <select
                    value={localStyles.fontWeight || '400'}
                    onChange={(e) => updateStyle('fontWeight', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                  >
                    {fontWeights.map((weight) => (
                      <option key={weight} value={weight}>{weight}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Alignment</label>
                <div className="flex gap-1">
                  {[
                    { icon: AlignLeft, value: 'left' },
                    { icon: AlignCenter, value: 'center' },
                    { icon: AlignRight, value: 'right' },
                    { icon: AlignJustify, value: 'justify' },
                  ].map(({ icon: Icon, value }) => (
                    <button
                      key={value}
                      onClick={() => updateStyle('textAlign', value)}
                      className={cn(
                        'flex-1 py-1.5 rounded flex items-center justify-center',
                        localStyles.textAlign === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Decorations */}
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Style</label>
                <div className="flex gap-1">
                  {[
                    { icon: Bold, style: 'fontWeight', value: '700', checkValue: '700' },
                    { icon: Italic, style: 'fontStyle', value: 'italic', checkValue: 'italic' },
                    { icon: Underline, style: 'textDecoration', value: 'underline', checkValue: 'underline' },
                  ].map(({ icon: Icon, style, value, checkValue }) => (
                    <button
                      key={style + value}
                      onClick={() => updateStyle(style, localStyles[style] === checkValue ? 'normal' : value)}
                      className={cn(
                        'flex-1 py-1.5 rounded flex items-center justify-center',
                        localStyles[style] === checkValue
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Colors
              </label>

              {/* Text Color */}
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Text Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={localStyles.color || '#000000'}
                    onChange={(e) => updateStyle('color', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-700"
                  />
                  <input
                    type="text"
                    value={localStyles.color || '#000000'}
                    onChange={(e) => updateStyle('color', e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white font-mono"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {colorPresets.slice(0, 10).map((color) => (
                    <button
                      key={color}
                      onClick={() => updateStyle('color', color)}
                      className="w-5 h-5 rounded border border-slate-600 hover:scale-110 transition"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Background</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={localStyles.backgroundColor || '#ffffff'}
                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-700"
                  />
                  <input
                    type="text"
                    value={localStyles.backgroundColor || 'transparent'}
                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white font-mono"
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {colorPresets.slice(10, 20).map((color) => (
                    <button
                      key={color}
                      onClick={() => updateStyle('backgroundColor', color)}
                      className="w-5 h-5 rounded border border-slate-600 hover:scale-110 transition"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'layout' && (
          <>
            {/* Spacing */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Layout className="w-3 h-3" />
                Padding
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const).map((prop) => (
                  <div key={prop}>
                    <label className="text-[10px] text-slate-500 mb-1 block capitalize">
                      {prop.replace('padding', '')}
                    </label>
                    <select
                      value={localStyles[prop] || '0'}
                      onChange={(e) => updateStyle(prop, e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    >
                      {spacingSizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Margin */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Margin
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const).map((prop) => (
                  <div key={prop}>
                    <label className="text-[10px] text-slate-500 mb-1 block capitalize">
                      {prop.replace('margin', '')}
                    </label>
                    <select
                      value={localStyles[prop] || '0'}
                      onChange={(e) => updateStyle(prop, e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    >
                      {spacingSizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Width</label>
                  <input
                    type="text"
                    value={localStyles.width || 'auto'}
                    onChange={(e) => updateStyle('width', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    placeholder="auto"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Height</label>
                  <input
                    type="text"
                    value={localStyles.height || 'auto'}
                    onChange={(e) => updateStyle('height', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    placeholder="auto"
                  />
                </div>
              </div>
            </div>

            {/* Border */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Border
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Radius</label>
                  <input
                    type="text"
                    value={localStyles.borderRadius || '0'}
                    onChange={(e) => updateStyle('borderRadius', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    placeholder="0px"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Width</label>
                  <input
                    type="text"
                    value={localStyles.borderWidth || '0'}
                    onChange={(e) => updateStyle('borderWidth', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    placeholder="0px"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Border Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={localStyles.borderColor || '#000000'}
                    onChange={(e) => updateStyle('borderColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-700"
                  />
                  <input
                    type="text"
                    value={localStyles.borderColor || '#000000'}
                    onChange={(e) => updateStyle('borderColor', e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'advanced' && (
          <>
            {/* Display */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Display
              </label>
              <select
                value={localStyles.display || 'block'}
                onChange={(e) => updateStyle('display', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
              >
                <option value="block">Block</option>
                <option value="flex">Flex</option>
                <option value="grid">Grid</option>
                <option value="inline">Inline</option>
                <option value="inline-block">Inline Block</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Flex Properties (shown when display is flex) */}
            {localStyles.display === 'flex' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Flex Properties
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Direction</label>
                    <select
                      value={localStyles.flexDirection || 'row'}
                      onChange={(e) => updateStyle('flexDirection', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    >
                      <option value="row">Row</option>
                      <option value="column">Column</option>
                      <option value="row-reverse">Row Reverse</option>
                      <option value="column-reverse">Column Reverse</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Wrap</label>
                    <select
                      value={localStyles.flexWrap || 'nowrap'}
                      onChange={(e) => updateStyle('flexWrap', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    >
                      <option value="nowrap">No Wrap</option>
                      <option value="wrap">Wrap</option>
                      <option value="wrap-reverse">Wrap Reverse</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Justify</label>
                    <select
                      value={localStyles.justifyContent || 'flex-start'}
                      onChange={(e) => updateStyle('justifyContent', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    >
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                      <option value="space-between">Space Between</option>
                      <option value="space-around">Space Around</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Align</label>
                    <select
                      value={localStyles.alignItems || 'stretch'}
                      onChange={(e) => updateStyle('alignItems', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    >
                      <option value="stretch">Stretch</option>
                      <option value="flex-start">Start</option>
                      <option value="center">Center</option>
                      <option value="flex-end">End</option>
                      <option value="baseline">Baseline</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Gap</label>
                    <select
                      value={localStyles.gap || '0'}
                      onChange={(e) => updateStyle('gap', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                    >
                      {spacingSizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Position */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Position
              </label>
              <select
                value={localStyles.position || 'static'}
                onChange={(e) => updateStyle('position', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
              >
                <option value="static">Static</option>
                <option value="relative">Relative</option>
                <option value="absolute">Absolute</option>
                <option value="fixed">Fixed</option>
                <option value="sticky">Sticky</option>
              </select>
            </div>

            {/* Overflow */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Overflow
              </label>
              <select
                value={localStyles.overflow || 'visible'}
                onChange={(e) => updateStyle('overflow', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="scroll">Scroll</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Opacity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localStyles.opacity || '1'}
                onChange={(e) => updateStyle('opacity', e.target.value)}
                className="w-full"
              />
              <span className="text-xs text-slate-500">{localStyles.opacity || '1'}</span>
            </div>

            {/* Shadow */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Shadow
              </label>
              <select
                value={localStyles.boxShadow || 'none'}
                onChange={(e) => updateStyle('boxShadow', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white"
              >
                <option value="none">None</option>
                <option value="0 1px 2px 0 rgb(0 0 0 / 0.05)">Small</option>
                <option value="0 1px 3px 0 rgb(0 0 0 / 0.1)">Medium</option>
                <option value="0 4px 6px -1px rgb(0 0 0 / 0.1)">Large</option>
                <option value="0 10px 15px -3px rgb(0 0 0 / 0.1)">XL</option>
                <option value="0 25px 50px -12px rgb(0 0 0 / 0.25)">2XL</option>
              </select>
            </div>

            {/* Class Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                CSS Classes
              </label>
              <input
                type="text"
                value={selectedElement.className}
                onChange={(e) => onUpdateElement({ className: e.target.value })}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white font-mono"
                placeholder="tailwind classes..."
              />
            </div>
          </>
        )}
      </div>

      {/* Reset Button */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={() => {
            setLocalStyles({})
            onUpdateElement({ styles: {} })
          }}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Styles
        </button>
      </div>
    </div>
  )
}
