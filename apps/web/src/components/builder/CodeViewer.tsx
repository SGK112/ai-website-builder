'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CodeViewerProps {
  file: {
    path: string
    content: string
    language: string
  } | null
}

export function CodeViewer({ file }: CodeViewerProps) {
  if (!file) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground text-center">
            Select a file to view its contents
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="text-sm font-mono truncate">{file.path}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <pre className="p-4 text-sm font-mono h-full">
          <code className="language-${file.language}">{file.content}</code>
        </pre>
      </CardContent>
    </Card>
  )
}
