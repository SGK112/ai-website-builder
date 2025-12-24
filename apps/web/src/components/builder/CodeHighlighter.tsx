'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface CodeHighlighterProps {
  code: string
  language?: 'typescript' | 'javascript' | 'jsx' | 'tsx' | 'css' | 'html' | 'json'
  showLineNumbers?: boolean
  className?: string
}

// Token types for syntax highlighting
type TokenType =
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'function'
  | 'operator'
  | 'punctuation'
  | 'tag'
  | 'attribute'
  | 'variable'
  | 'class'
  | 'builtin'
  | 'plain'

interface Token {
  type: TokenType
  content: string
}

// Color map for different token types
const tokenColors: Record<TokenType, string> = {
  keyword: 'text-purple-400',
  string: 'text-green-400',
  number: 'text-orange-400',
  comment: 'text-slate-500 italic',
  function: 'text-blue-400',
  operator: 'text-cyan-400',
  punctuation: 'text-slate-400',
  tag: 'text-red-400',
  attribute: 'text-yellow-400',
  variable: 'text-slate-200',
  class: 'text-yellow-300',
  builtin: 'text-cyan-300',
  plain: 'text-slate-300',
}

// Keywords for different languages
const keywords = {
  typescript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'default', 'throw', 'try', 'catch', 'finally',
    'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'void', 'this', 'super',
    'class', 'extends', 'implements', 'interface', 'type', 'enum', 'namespace', 'module',
    'import', 'export', 'from', 'as', 'default', 'async', 'await', 'yield',
    'public', 'private', 'protected', 'static', 'readonly', 'abstract', 'declare',
    'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  ],
  css: [
    '@media', '@keyframes', '@import', '@font-face', '@supports', '@layer',
    'from', 'to', 'inherit', 'initial', 'unset', 'revert', 'auto', 'none',
    'important', 'px', 'em', 'rem', '%', 'vh', 'vw', 'deg', 's', 'ms',
  ],
}

const builtins = [
  'console', 'document', 'window', 'Array', 'Object', 'String', 'Number', 'Boolean',
  'Date', 'Math', 'JSON', 'Promise', 'Map', 'Set', 'RegExp', 'Error',
  'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext',
  'React', 'Component', 'Fragment',
]

function tokenize(code: string, language: string): Token[][] {
  const lines = code.split('\n')
  return lines.map(line => tokenizeLine(line, language))
}

function tokenizeLine(line: string, language: string): Token[] {
  const tokens: Token[] = []
  let remaining = line
  let pos = 0

  while (remaining.length > 0) {
    let matched = false

    // Try to match different patterns
    const patterns: Array<{ regex: RegExp; type: TokenType }> = [
      // Comments
      { regex: /^(\/\/.*$|\/\*[\s\S]*?\*\/)/, type: 'comment' },
      // JSX tags
      { regex: /^(<\/?[A-Z][a-zA-Z0-9]*|<\/?[a-z][a-z0-9]*-[a-z0-9-]*)/, type: 'tag' },
      { regex: /^(<\/?>|\/>)/, type: 'tag' },
      // Strings
      { regex: /^("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)/, type: 'string' },
      // Template literal expressions
      { regex: /^(\$\{)/, type: 'punctuation' },
      // Numbers
      { regex: /^(\d+\.?\d*(?:e[+-]?\d+)?|0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+)/, type: 'number' },
      // JSX attributes
      { regex: /^([a-zA-Z][\w-]*)(=)/, type: 'attribute' },
      // Class names in className
      { regex: /^(className)/, type: 'attribute' },
      // Arrow functions
      { regex: /^(=>)/, type: 'operator' },
      // Operators
      { regex: /^([+\-*/%&|^~<>=!?:]+|&&|\|\||\?\?|\.{3})/, type: 'operator' },
      // Punctuation
      { regex: /^([{}[\]();,])/, type: 'punctuation' },
      // Function calls
      { regex: /^([a-zA-Z_$][\w$]*)(?=\s*\()/, type: 'function' },
      // Identifiers
      { regex: /^([a-zA-Z_$][\w$]*)/, type: 'variable' },
      // Whitespace
      { regex: /^(\s+)/, type: 'plain' },
      // Any other character
      { regex: /^(.)/, type: 'plain' },
    ]

    for (const { regex, type } of patterns) {
      const match = remaining.match(regex)
      if (match) {
        const content = match[1] || match[0]
        let finalType = type

        // Check if it's a keyword
        if (type === 'variable') {
          const keywordList = language === 'css' ? keywords.css : keywords.typescript
          if (keywordList.includes(content)) {
            finalType = 'keyword'
          } else if (builtins.includes(content)) {
            finalType = 'builtin'
          } else if (/^[A-Z]/.test(content)) {
            finalType = 'class'
          }
        }

        tokens.push({ type: finalType, content })
        remaining = remaining.slice(content.length)
        matched = true
        break
      }
    }

    if (!matched) {
      tokens.push({ type: 'plain', content: remaining[0] })
      remaining = remaining.slice(1)
    }
  }

  return tokens
}

export function CodeHighlighter({
  code,
  language = 'typescript',
  showLineNumbers = true,
  className,
}: CodeHighlighterProps) {
  const tokenizedLines = useMemo(() => tokenize(code, language), [code, language])
  const lineNumberWidth = String(tokenizedLines.length).length

  return (
    <div className={cn('font-mono text-sm overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <tbody>
          {tokenizedLines.map((tokens, lineIndex) => (
            <tr key={lineIndex} className="hover:bg-slate-800/50">
              {showLineNumbers && (
                <td className="select-none text-right pr-4 text-slate-600 align-top w-12 sticky left-0 bg-slate-950">
                  {lineIndex + 1}
                </td>
              )}
              <td className="whitespace-pre">
                {tokens.map((token, tokenIndex) => (
                  <span
                    key={tokenIndex}
                    className={tokenColors[token.type]}
                  >
                    {token.content}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Alternative: Simple pre-styled code block for performance
export function SimpleCodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <pre className={cn('font-mono text-sm text-green-400 whitespace-pre-wrap', className)}>
      <code>{code}</code>
    </pre>
  )
}
