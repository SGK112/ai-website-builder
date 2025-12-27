'use client'

import { useState, useCallback } from 'react'
import {
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2,
  GripVertical,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Unlock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Breakpoint {
  id: string
  name: string
  width: number
  icon: 'desktop' | 'tablet' | 'mobile' | 'custom'
  isDefault?: boolean
  isLocked?: boolean
}

interface ResponsiveStyle {
  breakpointId: string
  selector: string
  styles: Record<string, string>
}

interface ResponsiveEditorProps {
  currentBreakpoint: string
  onBreakpointChange: (breakpointId: string) => void
  onWidthChange: (width: number) => void
  currentWidth: number
  className?: string
}

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: 'desktop', name: 'Desktop', width: 1440, icon: 'desktop', isDefault: true },
  { id: 'laptop', name: 'Laptop', width: 1024, icon: 'desktop', isDefault: true },
  { id: 'tablet', name: 'Tablet', width: 768, icon: 'tablet', isDefault: true },
  { id: 'mobile-lg', name: 'Mobile L', width: 425, icon: 'mobile', isDefault: true },
  { id: 'mobile', name: 'Mobile', width: 375, icon: 'mobile', isDefault: true },
  { id: 'mobile-sm', name: 'Mobile S', width: 320, icon: 'mobile', isDefault: true },
]

const COMMON_DEVICES = [
  { name: 'iPhone 14 Pro', width: 393, height: 852 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Pro 11"', width: 834, height: 1194 },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
  { name: 'MacBook Air', width: 1280, height: 800 },
  { name: 'MacBook Pro 14"', width: 1512, height: 982 },
  { name: 'MacBook Pro 16"', width: 1728, height: 1117 },
  { name: 'iMac 24"', width: 2240, height: 1260 },
  { name: 'Samsung Galaxy S23', width: 360, height: 780 },
  { name: 'Samsung Galaxy Tab', width: 800, height: 1280 },
  { name: 'Surface Pro', width: 912, height: 1368 },
]

export function ResponsiveEditor({
  currentBreakpoint,
  onBreakpointChange,
  onWidthChange,
  currentWidth,
  className,
}: ResponsiveEditorProps) {
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>(DEFAULT_BREAKPOINTS)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDevices, setShowDevices] = useState(false)
  const [showAddBreakpoint, setShowAddBreakpoint] = useState(false)
  const [newBreakpoint, setNewBreakpoint] = useState({ name: '', width: 600 })
  const [isDragging, setIsDragging] = useState(false)
  const [responsiveStyles, setResponsiveStyles] = useState<ResponsiveStyle[]>([])

  const getIcon = (icon: Breakpoint['icon']) => {
    switch (icon) {
      case 'desktop':
        return Monitor
      case 'tablet':
        return Tablet
      case 'mobile':
        return Smartphone
      default:
        return Monitor
    }
  }

  const handleBreakpointSelect = useCallback(
    (breakpoint: Breakpoint) => {
      onBreakpointChange(breakpoint.id)
      onWidthChange(breakpoint.width)
    },
    [onBreakpointChange, onWidthChange]
  )

  const handleAddBreakpoint = useCallback(() => {
    if (!newBreakpoint.name.trim()) return

    const id = `custom-${Date.now()}`
    const newBp: Breakpoint = {
      id,
      name: newBreakpoint.name,
      width: newBreakpoint.width,
      icon: newBreakpoint.width >= 1024 ? 'desktop' : newBreakpoint.width >= 768 ? 'tablet' : 'mobile',
      isDefault: false,
    }

    setBreakpoints((prev) => [...prev, newBp].sort((a, b) => b.width - a.width))
    setShowAddBreakpoint(false)
    setNewBreakpoint({ name: '', width: 600 })
  }, [newBreakpoint])

  const handleDeleteBreakpoint = useCallback((id: string) => {
    setBreakpoints((prev) => prev.filter((bp) => bp.id !== id))
    setResponsiveStyles((prev) => prev.filter((s) => s.breakpointId !== id))
  }, [])

  const handleDeviceSelect = useCallback(
    (device: (typeof COMMON_DEVICES)[0]) => {
      onWidthChange(device.width)
      setShowDevices(false)
    },
    [onWidthChange]
  )

  const handleWidthDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)

      const startX = e.clientX
      const startWidth = currentWidth

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX
        const newWidth = Math.max(320, Math.min(2560, startWidth + deltaX * 2))
        onWidthChange(Math.round(newWidth))
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [currentWidth, onWidthChange]
  )

  const getCurrentBreakpointName = () => {
    const bp = breakpoints.find((b) => b.id === currentBreakpoint)
    if (bp) return bp.name

    // Find closest breakpoint
    const closest = breakpoints.reduce((prev, curr) =>
      Math.abs(curr.width - currentWidth) < Math.abs(prev.width - currentWidth) ? curr : prev
    )
    return `~${closest.name}`
  }

  return (
    <div className={cn('bg-slate-900 border-b border-slate-800', className)}>
      {/* Main Toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Breakpoint Switcher */}
        <div className="flex items-center gap-1">
          {breakpoints.slice(0, 6).map((bp) => {
            const Icon = getIcon(bp.icon)
            const isActive = bp.id === currentBreakpoint || bp.width === currentWidth
            return (
              <button
                key={bp.id}
                onClick={() => handleBreakpointSelect(bp)}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors',
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
                title={`${bp.name} (${bp.width}px)`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{bp.name}</span>
              </button>
            )
          })}

          <button
            onClick={() => setShowDevices(!showDevices)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Device presets"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', showDevices && 'rotate-180')} />
          </button>
        </div>

        {/* Width Control */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full cursor-ew-resize',
              isDragging && 'ring-2 ring-purple-500'
            )}
            onMouseDown={handleWidthDrag}
          >
            <GripVertical className="w-3 h-3 text-slate-500" />
            <input
              type="number"
              value={currentWidth}
              onChange={(e) => onWidthChange(Math.max(320, Math.min(2560, parseInt(e.target.value) || 320)))}
              className="w-16 bg-transparent text-white text-sm text-center font-mono focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-slate-500 text-xs">px</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Current Breakpoint Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Breakpoint:</span>
          <span className="text-purple-400 font-medium">{getCurrentBreakpointName()}</span>
        </div>
      </div>

      {/* Device Presets Dropdown */}
      {showDevices && (
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50">
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {COMMON_DEVICES.map((device) => (
              <button
                key={device.name}
                onClick={() => handleDeviceSelect(device)}
                className={cn(
                  'flex flex-col items-start px-3 py-2 rounded text-left transition-colors',
                  device.width === currentWidth
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                )}
              >
                <span className="text-xs font-medium truncate w-full">{device.name}</span>
                <span className="text-xs opacity-60">
                  {device.width} x {device.height}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="border-t border-slate-800">
          {/* Width Slider */}
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 w-12">320px</span>
              <input
                type="range"
                min={320}
                max={2560}
                value={currentWidth}
                onChange={(e) => onWidthChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-purple-500
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-125"
              />
              <span className="text-xs text-slate-500 w-12 text-right">2560px</span>
            </div>

            {/* Breakpoint markers */}
            <div className="relative h-4 mt-1">
              {breakpoints.map((bp) => {
                const position = ((bp.width - 320) / (2560 - 320)) * 100
                return (
                  <button
                    key={bp.id}
                    onClick={() => handleBreakpointSelect(bp)}
                    className={cn(
                      'absolute top-0 w-1 h-3 rounded-full transform -translate-x-1/2 transition-all',
                      bp.id === currentBreakpoint || bp.width === currentWidth
                        ? 'bg-purple-500 scale-150'
                        : 'bg-slate-600 hover:bg-slate-500'
                    )}
                    style={{ left: `${position}%` }}
                    title={`${bp.name} (${bp.width}px)`}
                  />
                )
              })}
            </div>
          </div>

          {/* Custom Breakpoints */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">Custom Breakpoints</h3>
              <button
                onClick={() => setShowAddBreakpoint(!showAddBreakpoint)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>

            {showAddBreakpoint && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-slate-800 rounded-lg">
                <input
                  type="text"
                  value={newBreakpoint.name}
                  onChange={(e) => setNewBreakpoint((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Breakpoint name"
                  className="flex-1 px-2 py-1 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="number"
                  value={newBreakpoint.width}
                  onChange={(e) => setNewBreakpoint((prev) => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:border-purple-500 focus:outline-none"
                />
                <span className="text-xs text-slate-500">px</span>
                <button
                  onClick={handleAddBreakpoint}
                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-500 transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            <div className="space-y-1 max-h-32 overflow-y-auto">
              {breakpoints
                .filter((bp) => !bp.isDefault)
                .map((bp) => (
                  <div
                    key={bp.id}
                    className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg group"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleBreakpointSelect(bp)}
                        className={cn(
                          'p-1 rounded transition-colors',
                          bp.id === currentBreakpoint ? 'text-purple-400' : 'text-slate-400 hover:text-white'
                        )}
                      >
                        {(() => {
                          const Icon = getIcon(bp.icon)
                          return <Icon className="w-4 h-4" />
                        })()}
                      </button>
                      <span className="text-sm text-slate-300">{bp.name}</span>
                      <span className="text-xs text-slate-500 font-mono">{bp.width}px</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onWidthChange(bp.width)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Apply width"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteBreakpoint(bp.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete breakpoint"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {breakpoints.filter((bp) => !bp.isDefault).length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">No custom breakpoints yet</p>
            )}
          </div>

          {/* Responsive Styles Quick Edit */}
          <div className="px-4 py-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">Media Query Preview</h3>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 font-mono text-xs text-slate-400">
              <code>
                @media (max-width: {currentWidth}px) {'{'}
                <br />
                {'  '}/* Your responsive styles */
                <br />
                {'}'}
              </code>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Current viewport: <span className="text-purple-400">{currentWidth}px</span> matches{' '}
              <span className="text-purple-400">
                {currentWidth >= 1280
                  ? '2xl+'
                  : currentWidth >= 1024
                  ? 'xl'
                  : currentWidth >= 768
                  ? 'lg'
                  : currentWidth >= 640
                  ? 'md'
                  : 'sm'}
              </span>{' '}
              in Tailwind
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
