'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer2,
  Move,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Copy,
  Grid3X3,
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
  rect?: DOMRect
}

interface LivePreviewProps {
  html: string
  deviceMode: 'desktop' | 'tablet' | 'mobile'
  onElementSelect?: (element: SelectedElement | null) => void
  onContentChange?: (changes: { selector: string; property: string; value: string }) => void
  className?: string
}

const DEVICE_WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

export function LivePreview({
  html,
  deviceMode,
  onElementSelect,
  onContentChange,
  className,
}: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [inspectMode, setInspectMode] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [showOutlines, setShowOutlines] = useState(false)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)
  const [updateCount, setUpdateCount] = useState(0)
  const lastHtmlRef = useRef<string>('')

  // Inject interactive scripts into the preview
  const getEnhancedHTML = useCallback(() => {
    const gridStyles = showGrid
      ? `
      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
        z-index: 9998;
      }
    `
      : ''

    const outlineStyles = showOutlines
      ? `
      * {
        outline: 1px dashed rgba(59, 130, 246, 0.3) !important;
      }
      *:hover {
        outline: 2px solid rgba(59, 130, 246, 0.5) !important;
      }
    `
      : ''

    const interactiveScript = `
    <script>
      (function() {
        let inspectMode = ${inspectMode};
        let selectedPath = ${selectedPath ? `"${selectedPath}"` : 'null'};
        let hoveredPath = null;

        // Generate unique path for element
        function getElementPath(el) {
          if (!el || el === document.body) return 'body';
          const parent = el.parentElement;
          if (!parent) return el.tagName.toLowerCase();
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(el);
          const tag = el.tagName.toLowerCase();
          const id = el.id ? '#' + el.id : '';
          const cls = el.className && typeof el.className === 'string'
            ? '.' + el.className.split(' ').filter(c => c).slice(0, 2).join('.')
            : '';
          return getElementPath(parent) + ' > ' + tag + id + cls + ':nth-child(' + (index + 1) + ')';
        }

        // Get computed styles
        function getElementStyles(el) {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            padding: computed.padding,
            margin: computed.margin,
            width: computed.width,
            height: computed.height,
            display: computed.display,
            position: computed.position,
          };
        }

        // Get attributes
        function getElementAttributes(el) {
          const attrs = {};
          for (const attr of el.attributes) {
            if (attr.name !== 'data-preview-hover' && attr.name !== 'data-preview-selected') {
              attrs[attr.name] = attr.value;
            }
          }
          return attrs;
        }

        // Highlight element
        function highlightElement(el, type) {
          document.querySelectorAll('[data-preview-hover]').forEach(e => {
            e.removeAttribute('data-preview-hover');
            e.style.removeProperty('outline');
            e.style.removeProperty('outline-offset');
          });

          if (el && type === 'hover') {
            el.setAttribute('data-preview-hover', 'true');
            el.style.outline = '2px dashed #8b5cf6';
            el.style.outlineOffset = '2px';
          }
        }

        // Select element
        function selectElement(el) {
          document.querySelectorAll('[data-preview-selected]').forEach(e => {
            e.removeAttribute('data-preview-selected');
            e.style.removeProperty('box-shadow');
          });

          if (el) {
            el.setAttribute('data-preview-selected', 'true');
            el.style.boxShadow = '0 0 0 2px #8b5cf6, 0 0 0 4px rgba(139, 92, 246, 0.3)';
          }
        }

        // Mouse move handler
        document.addEventListener('mousemove', function(e) {
          if (!inspectMode) return;

          const el = e.target;
          if (el === document.body || el === document.documentElement) return;

          highlightElement(el, 'hover');

          const path = getElementPath(el);
          if (path !== hoveredPath) {
            hoveredPath = path;
            window.parent.postMessage({
              type: 'ELEMENT_HOVER',
              path: path,
              tagName: el.tagName.toLowerCase(),
              className: el.className,
              rect: el.getBoundingClientRect(),
            }, '*');
          }
        });

        // Click handler
        document.addEventListener('click', function(e) {
          if (!inspectMode) return;
          e.preventDefault();
          e.stopPropagation();

          const el = e.target;
          if (el === document.body || el === document.documentElement) return;

          selectElement(el);

          const path = getElementPath(el);
          selectedPath = path;

          window.parent.postMessage({
            type: 'ELEMENT_SELECT',
            element: {
              id: el.id || path,
              type: el.dataset.component || el.tagName.toLowerCase(),
              tagName: el.tagName.toLowerCase(),
              className: typeof el.className === 'string' ? el.className : '',
              textContent: el.textContent?.slice(0, 100),
              styles: getElementStyles(el),
              attributes: getElementAttributes(el),
              rect: el.getBoundingClientRect(),
            }
          }, '*');
        }, true);

        // Double click for inline editing
        document.addEventListener('dblclick', function(e) {
          const el = e.target;
          if (el.tagName === 'P' || el.tagName === 'H1' || el.tagName === 'H2' ||
              el.tagName === 'H3' || el.tagName === 'SPAN' || el.tagName === 'A' ||
              el.tagName === 'BUTTON' || el.tagName === 'LI') {
            el.contentEditable = 'true';
            el.focus();
            el.style.outline = '2px solid #22c55e';
            el.style.outlineOffset = '2px';

            el.addEventListener('blur', function onBlur() {
              el.contentEditable = 'false';
              el.style.removeProperty('outline');
              el.style.removeProperty('outline-offset');

              window.parent.postMessage({
                type: 'CONTENT_CHANGE',
                selector: getElementPath(el),
                property: 'textContent',
                value: el.textContent,
              }, '*');

              el.removeEventListener('blur', onBlur);
            });
          }
        });

        // Keyboard handler for escape
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            document.querySelectorAll('[data-preview-hover]').forEach(el => {
              el.removeAttribute('data-preview-hover');
              el.style.removeProperty('outline');
            });
            document.querySelectorAll('[data-preview-selected]').forEach(el => {
              el.removeAttribute('data-preview-selected');
              el.style.removeProperty('box-shadow');
            });
            window.parent.postMessage({ type: 'ELEMENT_DESELECT' }, '*');
          }
        });

        // Listen for messages from parent
        window.addEventListener('message', function(e) {
          if (e.data.type === 'SET_INSPECT_MODE') {
            inspectMode = e.data.enabled;
            if (!inspectMode) {
              document.querySelectorAll('[data-preview-hover]').forEach(el => {
                el.removeAttribute('data-preview-hover');
                el.style.removeProperty('outline');
              });
            }
          }
          if (e.data.type === 'UPDATE_STYLE') {
            const el = document.querySelector(e.data.selector);
            if (el) {
              el.style[e.data.property] = e.data.value;
            }
          }
          if (e.data.type === 'HIGHLIGHT_ELEMENT') {
            const el = document.querySelector(e.data.selector);
            if (el) {
              selectElement(el);
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        });

        // Signal ready
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
      })();
    </script>
    `

    // Inject styles and script before closing body tag
    const enhancedHTML = html.replace(
      '</head>',
      `<style>
        ${gridStyles}
        ${outlineStyles}
        [data-preview-selected] {
          position: relative;
        }
        [contenteditable="true"] {
          min-width: 20px;
          min-height: 1em;
        }
        * {
          transition: outline 0.15s ease, box-shadow 0.15s ease;
        }
      </style>
      </head>`
    ).replace('</body>', `${interactiveScript}</body>`)

    return enhancedHTML
  }, [html, inspectMode, selectedPath, showGrid, showOutlines])

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PREVIEW_READY') {
        setIsLoading(false)
      }
      if (event.data.type === 'ELEMENT_SELECT' && onElementSelect) {
        onElementSelect(event.data.element)
        setSelectedPath(event.data.element.id)
      }
      if (event.data.type === 'ELEMENT_DESELECT' && onElementSelect) {
        onElementSelect(null)
        setSelectedPath(null)
      }
      if (event.data.type === 'ELEMENT_HOVER') {
        setHoveredElement(event.data.path)
      }
      if (event.data.type === 'CONTENT_CHANGE' && onContentChange) {
        onContentChange(event.data)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onElementSelect, onContentChange])

  // Update inspect mode in iframe
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'SET_INSPECT_MODE', enabled: inspectMode },
      '*'
    )
  }, [inspectMode])

  // Detect HTML changes and show loading
  useEffect(() => {
    if (html !== lastHtmlRef.current) {
      setIsLoading(true)
      setUpdateCount((c) => c + 1)
      lastHtmlRef.current = html
    }
  }, [html])

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 25))
  const handleResetZoom = () => setZoom(100)

  // Refresh preview
  const handleRefresh = () => {
    setIsLoading(true)
    setUpdateCount((c) => c + 1)
  }

  // Send style update to iframe
  const updateElementStyle = useCallback(
    (selector: string, property: string, value: string) => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'UPDATE_STYLE', selector, property, value },
        '*'
      )
    },
    []
  )

  // Highlight element in iframe
  const highlightElement = useCallback((selector: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'HIGHLIGHT_ELEMENT', selector },
      '*'
    )
  }, [])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-mono transition-colors min-w-[48px]"
            title="Reset zoom"
          >
            {zoom}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setInspectMode(!inspectMode)}
            className={cn(
              'p-1.5 rounded transition-colors',
              inspectMode
                ? 'bg-purple-600 text-white'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            )}
            title={inspectMode ? 'Exit inspect mode' : 'Inspect elements'}
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showGrid
                ? 'bg-purple-600 text-white'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            )}
            title={showGrid ? 'Hide grid' : 'Show grid overlay'}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowOutlines(!showOutlines)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showOutlines
                ? 'bg-purple-600 text-white'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            )}
            title={showOutlines ? 'Hide outlines' : 'Show element outlines'}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="text-xs text-purple-400 animate-pulse">
              Updating...
            </span>
          )}
          {hoveredElement && inspectMode && (
            <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
              {hoveredElement.split(' > ').pop()}
            </span>
          )}
        </div>
      </div>

      {/* Preview Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950 p-4"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          className="mx-auto bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 relative"
          style={{
            width: DEVICE_WIDTHS[deviceMode],
            maxWidth: '100%',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            minHeight: 'calc(100vh - 200px)',
          }}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                <span className="text-sm text-purple-300">Updating preview...</span>
              </div>
            </div>
          )}

          {/* Inspect Mode Indicator */}
          {inspectMode && (
            <div className="absolute top-2 left-2 z-40 px-2 py-1 bg-purple-600 text-white text-xs rounded-full flex items-center gap-1.5 shadow-lg">
              <MousePointer2 className="w-3 h-3" />
              Inspect Mode
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={updateCount}
            srcDoc={getEnhancedHTML()}
            className="w-full h-full min-h-[600px] border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-3 text-slate-500">
          <span>{deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)}</span>
          <span>{DEVICE_WIDTHS[deviceMode]}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          {selectedPath && (
            <span className="text-purple-400 font-mono truncate max-w-[300px]">
              {selectedPath}
            </span>
          )}
          <span>Updates: {updateCount}</span>
        </div>
      </div>
    </div>
  )
}

// Export helper for parent components
export type { SelectedElement, LivePreviewProps }
