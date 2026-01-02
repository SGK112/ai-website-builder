'use client'

import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DeviceMode, SelectedElement } from '../types'
import { deviceDimensions } from '../constants'

interface PreviewPanelProps {
  html: string
  deviceMode: DeviceMode
  theme: string
  onElementSelect?: (element: SelectedElement | null) => void
  onConsoleLog?: (type: string, message: string) => void
}

export function PreviewPanel({
  html,
  deviceMode,
  theme,
  onElementSelect,
  onConsoleLog,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Generate the full HTML document with console capture
  const generateFullHtml = useCallback(() => {
    const consoleCapture = `
      <script>
        (function() {
          const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
          };

          function sendToParent(type, args) {
            try {
              window.parent.postMessage({
                type: 'console',
                level: type,
                message: Array.from(args).map(arg =>
                  typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ')
              }, '*');
            } catch (e) {}
          }

          console.log = function() { sendToParent('log', arguments); originalConsole.log.apply(console, arguments); };
          console.info = function() { sendToParent('info', arguments); originalConsole.info.apply(console, arguments); };
          console.warn = function() { sendToParent('warn', arguments); originalConsole.warn.apply(console, arguments); };
          console.error = function() { sendToParent('error', arguments); originalConsole.error.apply(console, arguments); };

          window.onerror = function(message, source, lineno, colno, error) {
            sendToParent('error', [message + ' at line ' + lineno]);
            return false;
          };
        })();
      </script>
    `

    const elementSelection = `
      <script>
        // Prevent all link navigation in preview
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }, true);

        document.addEventListener('click', function(e) {
          e.preventDefault();
          const target = e.target;
          const rect = target.getBoundingClientRect();

          // Get element path
          let path = [];
          let el = target;
          while (el && el !== document.body) {
            let selector = el.tagName.toLowerCase();
            if (el.id) selector += '#' + el.id;
            else if (el.className) selector += '.' + el.className.split(' ')[0];
            path.unshift(selector);
            el = el.parentElement;
          }

          window.parent.postMessage({
            type: 'elementSelected',
            element: {
              tagName: target.tagName,
              className: target.className,
              id: target.id,
              textContent: target.textContent?.substring(0, 100),
              outerHTML: target.outerHTML.substring(0, 500),
              path: path.join(' > '),
              rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
            }
          }, '*');
        });
      </script>
    `

    // Check if html is a full document
    if (html.includes('<!DOCTYPE') || html.includes('<html')) {
      return html
        .replace('</head>', `${consoleCapture}</head>`)
        .replace('</body>', `${elementSelection}</body>`)
    }

    // Wrap in full document
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Inter', system-ui, sans-serif; }
          body { margin: 0; padding: 0; }
        </style>
        ${consoleCapture}
      </head>
      <body>
        ${html}
        ${elementSelection}
      </body>
      </html>
    `
  }, [html])

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console' && onConsoleLog) {
        onConsoleLog(event.data.level, event.data.message)
      }
      if (event.data?.type === 'elementSelected' && onElementSelect) {
        onElementSelect(event.data.element)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onConsoleLog, onElementSelect])

  // Update iframe content
  useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(generateFullHtml())
        doc.close()
      }
    }
  }, [html, generateFullHtml])

  const { width, maxWidth } = deviceDimensions[deviceMode]

  return (
    <div className={cn(
      "flex-1 flex items-start justify-center p-4 overflow-auto",
      theme === 'dark' ? "bg-slate-950" : "bg-slate-100"
    )}>
      <motion.div
        layout
        className={cn(
          "relative shadow-2xl rounded-lg overflow-hidden",
          deviceMode !== 'desktop' && "border-8 border-slate-800 rounded-[2rem]"
        )}
        style={{
          width,
          maxWidth,
          minHeight: deviceMode === 'mobile' ? '667px' : deviceMode === 'tablet' ? '500px' : '100%',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Device frame notch for mobile */}
        {deviceMode === 'mobile' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10" />
        )}

        <iframe
          ref={iframeRef}
          className="w-full h-full bg-white"
          style={{
            minHeight: deviceMode === 'mobile' ? '667px' : deviceMode === 'tablet' ? '500px' : '600px',
          }}
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Preview"
        />

        {/* Empty state */}
        {!html && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            theme === 'dark' ? "bg-slate-900" : "bg-slate-50"
          )}>
            <div className="text-center p-8">
              <div className={cn(
                "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                theme === 'dark' ? "bg-slate-800" : "bg-slate-200"
              )}>
                <svg
                  className={cn(
                    "w-8 h-8",
                    theme === 'dark' ? "text-slate-600" : "text-slate-400"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className={cn(
                "text-lg font-semibold mb-2",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>
                No Preview Yet
              </h3>
              <p className={cn(
                "text-sm max-w-xs",
                theme === 'dark' ? "text-slate-400" : "text-slate-600"
              )}>
                Start by describing what you want to build, or choose a template to get started.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default PreviewPanel
