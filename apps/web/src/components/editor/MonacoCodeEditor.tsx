'use client'

import { useRef, useCallback } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import type { editor, Position, IRange } from 'monaco-editor'

interface MonacoCodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  height?: string
  theme?: 'vs-dark' | 'light'
  fileName?: string
  onSave?: () => void
}

export function MonacoCodeEditor({
  value,
  onChange,
  language = 'html',
  readOnly = false,
  height = '100%',
  theme = 'vs-dark',
  fileName,
  onSave,
}: MonacoCodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    // Custom theme matching our dark UI
    monaco.editor.defineTheme('webstew-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'tag', foreground: 'f472b6' },
        { token: 'attribute.name', foreground: '60a5fa' },
        { token: 'attribute.value', foreground: '34d399' },
        { token: 'delimiter', foreground: '9ca3af' },
      ],
      colors: {
        'editor.background': '#0a0a0b',
        'editor.foreground': '#e4e4e7',
        'editor.lineHighlightBackground': '#18181b',
        'editor.selectionBackground': '#3b0764',
        'editor.inactiveSelectionBackground': '#27272a',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editorCursor.foreground': '#a78bfa',
        'editor.selectionHighlightBackground': '#7c3aed33',
        'editorIndentGuide.background': '#27272a',
        'editorIndentGuide.activeBackground': '#3f3f46',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#27272a80',
        'scrollbarSlider.hoverBackground': '#3f3f4680',
        'scrollbarSlider.activeBackground': '#52525b80',
      },
    })

    monaco.editor.setTheme('webstew-dark')

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.()
    })

    // Configure HTML formatting
    monaco.languages.html.htmlDefaults.setOptions({
      format: {
        tabSize: 2,
        insertSpaces: true,
        wrapLineLength: 120,
        unformatted: 'wbr',
        contentUnformatted: 'pre,code,textarea',
        indentInnerHtml: true,
        preserveNewLines: true,
        indentHandlebars: false,
        endWithNewline: false,
        extraLiners: 'head,body,/html',
        wrapAttributes: 'auto',
      },
    })

    // Auto-complete for Tailwind classes
    monaco.languages.registerCompletionItemProvider('html', {
      triggerCharacters: ['"', "'", ' '],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        })

        // Check if we're inside a class attribute
        if (!textUntilPosition.match(/class=["'][^"']*$/)) {
          return { suggestions: [] }
        }

        const tailwindClasses = [
          // Layout
          'flex', 'grid', 'block', 'inline', 'hidden',
          'items-center', 'items-start', 'items-end',
          'justify-center', 'justify-between', 'justify-start', 'justify-end',
          'gap-1', 'gap-2', 'gap-4', 'gap-6', 'gap-8',
          // Spacing
          'p-1', 'p-2', 'p-4', 'p-6', 'p-8', 'px-4', 'py-2', 'px-6', 'py-4',
          'm-1', 'm-2', 'm-4', 'm-auto', 'mx-auto', 'my-4',
          // Sizing
          'w-full', 'w-1/2', 'w-auto', 'h-full', 'h-screen', 'min-h-screen',
          'max-w-7xl', 'max-w-4xl', 'max-w-2xl', 'max-w-lg', 'max-w-md',
          // Typography
          'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-4xl',
          'font-normal', 'font-medium', 'font-semibold', 'font-bold',
          'text-white', 'text-black', 'text-zinc-400', 'text-zinc-500',
          // Colors
          'bg-white', 'bg-black', 'bg-zinc-900', 'bg-slate-950',
          'bg-violet-500', 'bg-indigo-600', 'bg-gradient-to-r',
          'from-violet-500', 'to-fuchsia-500', 'via-purple-500',
          // Borders
          'rounded', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
          'border', 'border-white/10', 'border-zinc-800',
          // Effects
          'shadow-lg', 'shadow-xl', 'shadow-2xl',
          'backdrop-blur-xl', 'backdrop-blur-sm',
          'opacity-50', 'opacity-75',
          // Transitions
          'transition', 'transition-all', 'duration-300',
          'hover:scale-105', 'hover:bg-white/10',
        ]

        return {
          suggestions: tailwindClasses.map((className) => ({
            label: className,
            kind: monaco.languages.CompletionItemKind.Value,
            insertText: className,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          })),
        }
      },
    })
  }, [onSave])

  const handleChange: OnChange = useCallback((value) => {
    if (value !== undefined) {
      onChange?.(value)
    }
  }, [onChange])

  // Detect language from file extension
  const getLanguage = () => {
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase()
      const langMap: Record<string, string> = {
        'html': 'html',
        'htm': 'html',
        'css': 'css',
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'json': 'json',
        'md': 'markdown',
      }
      return langMap[ext || ''] || language
    }
    return language
  }

  return (
    <Editor
      height={height}
      language={getLanguage()}
      value={value}
      onChange={handleChange}
      onMount={handleEditorMount}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        lineNumbersMinChars: 4,
        glyphMargin: false,
        folding: true,
        foldingStrategy: 'indentation',
        lineDecorationsWidth: 8,
        lineHeight: 20,
        letterSpacing: 0.3,
        renderLineHighlight: 'line',
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        padding: { top: 12, bottom: 12 },
        wordWrap: 'on',
        wrappingIndent: 'indent',
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
      }}
      loading={
        <div className="flex items-center justify-center h-full bg-zinc-950">
          <div className="flex items-center gap-3 text-zinc-500">
            <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <span className="text-sm">Loading editor...</span>
          </div>
        </div>
      }
    />
  )
}

export default MonacoCodeEditor
