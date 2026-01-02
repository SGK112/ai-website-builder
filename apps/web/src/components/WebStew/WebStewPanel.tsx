'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Image as ImageIcon,
  FileText,
  File,
  X,
  Plus,
  Trash2,
  ChefHat,
  Sparkles,
  FolderOpen,
  Tag,
  Link2,
  Loader2,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Eye,
  ZoomIn,
  Maximize2,
  RefreshCw,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WebStewRecipeManager } from './WebStewRecipeManager'

// Types for WebStew ingredients
export interface StewIngredient {
  id: string
  type: 'image' | 'document' | 'text' | 'link' | 'spreadsheet'
  name: string
  content: string // URL for images, text content for docs/text, URL for links
  preview?: string // Thumbnail or preview text
  metadata?: {
    width?: number
    height?: number
    size?: number
    mimeType?: string
    extractedText?: string
    originalSize?: number
    compressedSize?: number
    rows?: number
    columns?: number
  }
  category?: string // logo, hero, product, team, content, etc.
  tags?: string[]
  // Image validation status
  validation?: {
    isValid: boolean
    tested: boolean
    error?: string
  }
}

export interface WebStewRecipe {
  id: string
  name: string
  description: string
  ingredients: StewIngredient[]
  createdAt: Date
  updatedAt: Date
}

interface WebStewPanelProps {
  ingredients: StewIngredient[]
  onIngredientsChange: (ingredients: StewIngredient[]) => void
  onGenerateWithStew: (ingredients: StewIngredient[]) => void
  isDark?: boolean
}

const ingredientCategories = [
  { id: 'logo', label: 'Logo', icon: Tag, color: 'from-violet-500 to-purple-500', description: 'Brand logo for header' },
  { id: 'hero', label: 'Hero', icon: ImageIcon, color: 'from-blue-500 to-cyan-500', description: 'Main hero section image' },
  { id: 'product', label: 'Products', icon: FileSpreadsheet, color: 'from-amber-500 to-orange-500', description: 'Product images' },
  { id: 'team', label: 'Team', icon: ImageIcon, color: 'from-pink-500 to-rose-500', description: 'Team member photos' },
  { id: 'content', label: 'Content', icon: FileText, color: 'from-emerald-500 to-teal-500', description: 'Text and documents' },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon, color: 'from-indigo-500 to-violet-500', description: 'Gallery images' },
  { id: 'background', label: 'Background', icon: ImageIcon, color: 'from-slate-500 to-gray-500', description: 'Background images' },
]

// Validate base64 image format
function isValidBase64Image(dataUrl: string): { valid: boolean; error?: string } {
  if (!dataUrl) {
    return { valid: false, error: 'Empty data URL' }
  }

  // Check for proper data URL format
  const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i
  if (!dataUrlPattern.test(dataUrl)) {
    return { valid: false, error: 'Invalid image format - must be data:image/TYPE;base64' }
  }

  // Check base64 portion
  const base64Part = dataUrl.split(',')[1]
  if (!base64Part || base64Part.length < 100) {
    return { valid: false, error: 'Base64 data too short or missing' }
  }

  // Basic base64 character validation
  const base64Pattern = /^[A-Za-z0-9+/=]+$/
  if (!base64Pattern.test(base64Part)) {
    return { valid: false, error: 'Invalid base64 characters' }
  }

  return { valid: true }
}

// Test if an image actually loads
async function testImageLoad(dataUrl: string): Promise<{ success: boolean; width: number; height: number; error?: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    const timeout = setTimeout(() => {
      resolve({ success: false, width: 0, height: 0, error: 'Image load timeout' })
    }, 5000)

    img.onload = () => {
      clearTimeout(timeout)
      resolve({ success: true, width: img.width, height: img.height })
    }
    img.onerror = () => {
      clearTimeout(timeout)
      resolve({ success: false, width: 0, height: 0, error: 'Image failed to load' })
    }
    img.src = dataUrl
  })
}

// Compress image to reduce size while maintaining quality
async function compressImage(dataUrl: string, maxWidth: number = 1200, quality: number = 0.8): Promise<{ dataUrl: string; width: number; height: number; error?: string }> {
  return new Promise((resolve) => {
    // Validate before processing
    const validation = isValidBase64Image(dataUrl)
    if (!validation.valid) {
      resolve({ dataUrl: '', width: 0, height: 0, error: validation.error })
      return
    }

    const img = new Image()
    const timeout = setTimeout(() => {
      resolve({ dataUrl: '', width: 0, height: 0, error: 'Compression timeout' })
    }, 10000)

    img.onload = () => {
      clearTimeout(timeout)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // Scale down if needed
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', quality)
        resolve({ dataUrl: compressed, width, height })
      } else {
        resolve({ dataUrl, width: img.width, height: img.height })
      }
    }
    img.onerror = () => {
      clearTimeout(timeout)
      resolve({ dataUrl: '', width: 0, height: 0, error: 'Failed to load image for compression' })
    }
    img.src = dataUrl
  })
}

// Get image dimensions
async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = dataUrl
  })
}

// Parse CSV content
function parseCSV(content: string): { headers: string[]; rows: string[][]; preview: string } {
  const lines = content.trim().split('\n')
  const headers = lines[0]?.split(',').map(h => h.trim().replace(/^"|"$/g, '')) || []
  const rows = lines.slice(1).map(line =>
    line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  )

  const preview = headers.slice(0, 4).join(', ') + (headers.length > 4 ? '...' : '') +
    '\n' + rows.slice(0, 3).map(r => r.slice(0, 4).join(', ')).join('\n') +
    (rows.length > 3 ? '\n...' : '')

  return { headers, rows, preview }
}

export function WebStewPanel({
  ingredients,
  onIngredientsChange,
  onGenerateWithStew,
  isDark = true,
}: WebStewPanelProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [linkInput, setLinkInput] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [previewImage, setPreviewImage] = useState<StewIngredient | null>(null)
  const [processingStatus, setProcessingStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload with compression and validation
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    setIsUploading(true)
    setUploadProgress(0)
    const newIngredients: StewIngredient[] = []
    const fileArray = Array.from(files)

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      setProcessingStatus(`Processing ${file.name}...`)
      setUploadProgress(Math.round((i / fileArray.length) * 100))

      try {
        const id = `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        if (file.type.startsWith('image/')) {
          // Handle image with compression and validation
          setProcessingStatus(`Reading ${file.name}...`)

          const reader = new FileReader()
          const originalDataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsDataURL(file)
          })

          // Validate the image first
          setProcessingStatus(`Validating ${file.name}...`)
          const validation = isValidBase64Image(originalDataUrl)

          if (!validation.valid) {
            console.warn(`Image validation failed for ${file.name}: ${validation.error}`)
            // Skip invalid images
            continue
          }

          // Test if the image actually loads
          setProcessingStatus(`Testing ${file.name}...`)
          const loadTest = await testImageLoad(originalDataUrl)
          if (!loadTest.success) {
            console.warn(`Image load test failed for ${file.name}: ${loadTest.error}`)
            continue
          }

          setProcessingStatus(`Optimizing ${file.name}...`)

          // Compress if larger than 500KB
          let finalDataUrl = originalDataUrl
          let dimensions = { width: loadTest.width, height: loadTest.height }

          if (file.size > 500 * 1024) {
            const compressed = await compressImage(originalDataUrl, 1200, 0.85)
            if (compressed.error) {
              console.warn(`Compression failed for ${file.name}: ${compressed.error}`)
              // Use original if compression fails
            } else {
              finalDataUrl = compressed.dataUrl
              dimensions = { width: compressed.width, height: compressed.height }
            }
          }

          // Create thumbnail for preview
          const thumbnail = await compressImage(originalDataUrl, 200, 0.7)
          const thumbnailUrl = thumbnail.error ? originalDataUrl : thumbnail.dataUrl

          // Final validation of processed image
          const finalValidation = isValidBase64Image(finalDataUrl)
          const finalLoadTest = await testImageLoad(finalDataUrl)

          newIngredients.push({
            id,
            type: 'image',
            name: file.name,
            content: finalDataUrl,
            preview: thumbnailUrl,
            metadata: {
              size: finalDataUrl.length,
              originalSize: file.size,
              compressedSize: finalDataUrl.length,
              mimeType: file.type,
              width: dimensions.width,
              height: dimensions.height,
            },
            category: selectedCategory || 'gallery',
            validation: {
              isValid: finalValidation.valid && finalLoadTest.success,
              tested: true,
              error: finalValidation.error || finalLoadTest.error,
            },
          })
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          // Handle CSV (Google Sheets export)
          setProcessingStatus(`Parsing spreadsheet ${file.name}...`)
          const content = await file.text()
          const { headers, rows, preview } = parseCSV(content)

          newIngredients.push({
            id,
            type: 'spreadsheet',
            name: file.name,
            content: content,
            preview: preview,
            metadata: {
              size: file.size,
              mimeType: 'text/csv',
              extractedText: `Spreadsheet with ${rows.length} rows and ${headers.length} columns:\nHeaders: ${headers.join(', ')}\n\nData:\n${rows.slice(0, 10).map(r => r.join(' | ')).join('\n')}`,
              rows: rows.length,
              columns: headers.length,
            },
            category: 'content',
          })
        } else if (
          file.type === 'application/pdf' ||
          file.type === 'application/msword' ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'text/plain' ||
          file.type === 'text/markdown'
        ) {
          // Handle document
          setProcessingStatus(`Reading ${file.name}...`)
          let textContent = ''

          if (file.type === 'text/plain' || file.type === 'text/markdown') {
            textContent = await file.text()
          } else if (file.type === 'application/pdf') {
            // For PDF, store as base64 for potential server-side processing
            const reader = new FileReader()
            const base64 = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(file)
            })
            textContent = `[PDF Document: ${file.name}]\nThis PDF will be processed for text extraction.\nBase64 data available for processing.`
          } else {
            textContent = `[Document: ${file.name}] - Word document ready for processing`
          }

          newIngredients.push({
            id,
            type: 'document',
            name: file.name,
            content: textContent,
            preview: textContent.slice(0, 300) + (textContent.length > 300 ? '...' : ''),
            metadata: {
              size: file.size,
              mimeType: file.type,
              extractedText: textContent,
            },
            category: 'content',
          })
        }
      } catch (error) {
        console.error('Error processing file:', file.name, error)
      }
    }

    if (newIngredients.length > 0) {
      onIngredientsChange([...ingredients, ...newIngredients])
    }

    setIsUploading(false)
    setUploadProgress(100)
    setProcessingStatus('')
  }, [ingredients, onIngredientsChange, selectedCategory])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])

  // Add text content
  const addTextContent = useCallback(() => {
    if (!textInput.trim()) return

    const newIngredient: StewIngredient = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      name: 'Text Content',
      content: textInput,
      preview: textInput.slice(0, 150) + (textInput.length > 150 ? '...' : ''),
      metadata: {
        extractedText: textInput,
      },
      category: 'content',
    }

    onIngredientsChange([...ingredients, newIngredient])
    setTextInput('')
    setShowTextInput(false)
  }, [textInput, ingredients, onIngredientsChange])

  // Add link
  const addLink = useCallback(() => {
    if (!linkInput.trim()) return

    const newIngredient: StewIngredient = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'link',
      name: new URL(linkInput).hostname,
      content: linkInput,
      preview: linkInput,
      category: 'content',
    }

    onIngredientsChange([...ingredients, newIngredient])
    setLinkInput('')
    setShowLinkInput(false)
  }, [linkInput, ingredients, onIngredientsChange])

  // Remove ingredient
  const removeIngredient = useCallback((id: string) => {
    onIngredientsChange(ingredients.filter(ing => ing.id !== id))
  }, [ingredients, onIngredientsChange])

  // Update ingredient category
  const updateIngredientCategory = useCallback((id: string, category: string) => {
    onIngredientsChange(
      ingredients.map(ing =>
        ing.id === id ? { ...ing, category } : ing
      )
    )
  }, [ingredients, onIngredientsChange])

  // Revalidate an image
  const revalidateImage = useCallback(async (id: string) => {
    const ingredient = ingredients.find(ing => ing.id === id)
    if (!ingredient || ingredient.type !== 'image') return

    const validation = isValidBase64Image(ingredient.content)
    const loadTest = await testImageLoad(ingredient.content)

    onIngredientsChange(
      ingredients.map(ing =>
        ing.id === id
          ? {
              ...ing,
              validation: {
                isValid: validation.valid && loadTest.success,
                tested: true,
                error: validation.error || loadTest.error,
              },
            }
          : ing
      )
    )
  }, [ingredients, onIngredientsChange])

  // Revalidate all images
  const revalidateAllImages = useCallback(async () => {
    setIsUploading(true)
    setProcessingStatus('Validating all images...')

    const imageIngredients = ingredients.filter(i => i.type === 'image')
    const updatedIngredients = [...ingredients]

    for (let i = 0; i < imageIngredients.length; i++) {
      const img = imageIngredients[i]
      setProcessingStatus(`Validating ${img.name} (${i + 1}/${imageIngredients.length})...`)

      const validation = isValidBase64Image(img.content)
      const loadTest = await testImageLoad(img.content)

      const idx = updatedIngredients.findIndex(ing => ing.id === img.id)
      if (idx >= 0) {
        updatedIngredients[idx] = {
          ...updatedIngredients[idx],
          validation: {
            isValid: validation.valid && loadTest.success,
            tested: true,
            error: validation.error || loadTest.error,
          },
        }
      }
    }

    onIngredientsChange(updatedIngredients)
    setIsUploading(false)
    setProcessingStatus('')
  }, [ingredients, onIngredientsChange])

  // Count ingredients by type
  const imageCount = ingredients.filter(i => i.type === 'image').length
  const validImageCount = ingredients.filter(i => i.type === 'image' && i.validation?.isValid === true).length
  const invalidImageCount = ingredients.filter(i => i.type === 'image' && i.validation?.isValid === false).length
  const textCount = ingredients.filter(i => i.type === 'text' || i.type === 'document').length
  const spreadsheetCount = ingredients.filter(i => i.type === 'spreadsheet').length

  const bgClass = isDark ? 'bg-zinc-900' : 'bg-white'
  const textClass = isDark ? 'text-white' : 'text-slate-900'
  const mutedClass = isDark ? 'text-zinc-400' : 'text-slate-500'
  const borderClass = isDark ? 'border-zinc-700' : 'border-slate-200'
  const cardClass = isDark ? 'bg-zinc-800/50' : 'bg-slate-50'

  return (
    <div className={cn('flex flex-col h-full', bgClass, textClass)}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">WebStew</h2>
            <p className={cn('text-xs', mutedClass)}>Upload images, content & data</p>
          </div>
        </div>

        {/* Ingredient stats */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full",
            invalidImageCount > 0 ? "bg-red-500/10 text-red-400" :
            validImageCount === imageCount && imageCount > 0 ? "bg-emerald-500/10 text-emerald-400" :
            "bg-blue-500/10 text-blue-400"
          )}>
            <ImageIcon className="w-3 h-3" />
            <span>
              {imageCount} images
              {validImageCount > 0 && ` (${validImageCount} ✓)`}
              {invalidImageCount > 0 && ` (${invalidImageCount} ✗)`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
            <FileText className="w-3 h-3" />
            <span>{textCount} docs</span>
          </div>
          {spreadsheetCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">
              <FileSpreadsheet className="w-3 h-3" />
              <span>{spreadsheetCount} sheets</span>
            </div>
          )}
          {imageCount > 0 && (
            <button
              onClick={revalidateAllImages}
              disabled={isUploading}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition disabled:opacity-50"
              title="Re-check all images"
            >
              <RefreshCw className={cn("w-3 h-3", isUploading && "animate-spin")} />
              <span>Check</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={cn(
          'mx-4 mt-4 p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer relative overflow-hidden',
          dragOver
            ? 'border-orange-500 bg-orange-500/10'
            : cn(borderClass, 'hover:border-orange-500/50'),
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv"
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />

        {/* Upload progress bar */}
        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <div className="text-center">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-orange-500" />
              <p className="text-sm font-medium mb-1">{processingStatus || 'Processing...'}</p>
            </>
          ) : (
            <>
              <Upload className={cn('w-8 h-8 mx-auto mb-2', mutedClass)} />
              <p className="text-sm font-medium mb-1">
                {dragOver ? 'Drop your ingredients!' : 'Drop files or click to upload'}
              </p>
            </>
          )}
          <p className={cn('text-xs', mutedClass)}>
            Images, PDFs, Word, CSV (Google Sheets), Text
          </p>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="flex gap-2 px-4 mt-3">
        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition',
            showTextInput ? 'bg-violet-500/20 text-violet-400' : cn(cardClass, 'hover:bg-zinc-700/50')
          )}
        >
          <FileText className="w-4 h-4" />
          Text
        </button>
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition',
            showLinkInput ? 'bg-blue-500/20 text-blue-400' : cn(cardClass, 'hover:bg-zinc-700/50')
          )}
        >
          <Link2 className="w-4 h-4" />
          Link
        </button>
      </div>

      {/* Recipe Manager */}
      <div className="px-4 mt-3">
        <WebStewRecipeManager
          currentIngredients={ingredients}
          onLoadRecipe={onIngredientsChange}
          isDark={isDark}
        />
      </div>

      {/* Text Input */}
      <AnimatePresence>
        {showTextInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 mt-3 overflow-hidden"
          >
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your content here (about us, services, product descriptions, company info...)"
              className={cn(
                'w-full h-32 p-3 rounded-lg text-sm resize-none',
                cardClass,
                'border',
                borderClass,
                'focus:outline-none focus:ring-2 focus:ring-orange-500/50'
              )}
            />
            <button
              onClick={addTextContent}
              disabled={!textInput.trim()}
              className="mt-2 w-full py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              Add Content
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Input */}
      <AnimatePresence>
        {showLinkInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 mt-3 overflow-hidden"
          >
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://example.com"
              className={cn(
                'w-full p-3 rounded-lg text-sm',
                cardClass,
                'border',
                borderClass,
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50'
              )}
            />
            <button
              onClick={addLink}
              disabled={!linkInput.trim()}
              className="mt-2 w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              Add Link
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Quick Select */}
      <div className="px-4 mt-4">
        <p className={cn('text-xs font-medium mb-2', mutedClass)}>ASSIGN UPLOADS TO</p>
        <div className="flex flex-wrap gap-1.5">
          {ingredientCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              title={cat.description}
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-medium transition flex items-center gap-1',
                selectedCategory === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : cn(cardClass, 'hover:bg-zinc-700/50')
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients List - Image Grid for images */}
      <div className="flex-1 overflow-y-auto px-4 mt-4 pb-4">
        {ingredients.length === 0 ? (
          <div className={cn('text-center py-8', mutedClass)}>
            <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No ingredients yet</p>
            <p className="text-xs mt-1">Add images, content, or data to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Images Grid */}
            {imageCount > 0 && (
              <div>
                <p className={cn('text-xs font-medium mb-2 flex items-center gap-2', mutedClass)}>
                  <ImageIcon className="w-3 h-3" />
                  IMAGES ({imageCount})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {ingredients.filter(i => i.type === 'image').map((ingredient) => (
                    <motion.div
                      key={ingredient.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "relative group aspect-square rounded-lg overflow-hidden border",
                        ingredient.validation?.isValid === false
                          ? "border-red-500/50 ring-1 ring-red-500/30"
                          : ingredient.validation?.isValid === true
                          ? "border-emerald-500/50"
                          : "border-zinc-700/50"
                      )}
                    >
                      <img
                        src={ingredient.preview || ingredient.content}
                        alt={ingredient.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Show fallback for broken images
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJub25lIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzNmM2Y0NiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2EzYTNhMyIgZm9udC1zaXplPSIxMiI+RXJyb3I8L3RleHQ+PC9zdmc+'
                        }}
                      />

                      {/* Category badge */}
                      <div className="absolute top-1 left-1">
                        <span className="px-1.5 py-0.5 text-[8px] font-medium bg-black/60 text-white rounded">
                          {ingredient.category || 'gallery'}
                        </span>
                      </div>

                      {/* Validation status indicator */}
                      <div className="absolute top-1 right-1">
                        {ingredient.validation?.isValid === true ? (
                          <span className="w-4 h-4 flex items-center justify-center bg-emerald-500/80 rounded-full" title="Image verified">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        ) : ingredient.validation?.isValid === false ? (
                          <span className="w-4 h-4 flex items-center justify-center bg-red-500/80 rounded-full" title={ingredient.validation.error || 'Invalid image'}>
                            <AlertCircle className="w-2.5 h-2.5 text-white" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 flex items-center justify-center bg-amber-500/80 rounded-full" title="Not validated">
                            <RefreshCw className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </div>

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewImage(ingredient)
                            }}
                            className="p-1.5 bg-white/20 rounded-full hover:bg-white/30"
                            title="Preview"
                          >
                            <ZoomIn className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              revalidateImage(ingredient.id)
                            }}
                            className="p-1.5 bg-white/20 rounded-full hover:bg-white/30"
                            title="Re-check image"
                          >
                            <RefreshCw className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <select
                          value={ingredient.category || ''}
                          onChange={(e) => {
                            e.stopPropagation()
                            updateIngredientCategory(ingredient.id, e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] px-1.5 py-0.5 bg-black/50 text-white rounded border-0 focus:outline-none"
                        >
                          {ingredientCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeIngredient(ingredient.id)
                          }}
                          className="p-1.5 bg-red-500/50 rounded-full hover:bg-red-500/70"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>

                      {/* Dimensions and size */}
                      {ingredient.metadata?.width && (
                        <div className="absolute bottom-1 right-1 flex gap-1">
                          <span className="px-1 py-0.5 text-[8px] bg-black/60 text-white rounded">
                            {ingredient.metadata.width}x{ingredient.metadata.height}
                          </span>
                          {ingredient.metadata.size && (
                            <span className="px-1 py-0.5 text-[8px] bg-black/60 text-zinc-400 rounded">
                              {Math.round(ingredient.metadata.size / 1024)}KB
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Text & Documents */}
            {ingredients.filter(i => i.type === 'text' || i.type === 'document').length > 0 && (
              <div>
                <p className={cn('text-xs font-medium mb-2 flex items-center gap-2', mutedClass)}>
                  <FileText className="w-3 h-3" />
                  CONTENT
                </p>
                <div className="space-y-2">
                  {ingredients.filter(i => i.type === 'text' || i.type === 'document').map((ingredient) => (
                    <motion.div
                      key={ingredient.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-3 rounded-lg flex items-start gap-3 group',
                        cardClass,
                        'border',
                        borderClass
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500/20">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ingredient.name}</p>
                        <p className={cn('text-xs mt-0.5 line-clamp-2', mutedClass)}>
                          {ingredient.preview}
                        </p>
                      </div>
                      <button
                        onClick={() => removeIngredient(ingredient.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Spreadsheets */}
            {ingredients.filter(i => i.type === 'spreadsheet').length > 0 && (
              <div>
                <p className={cn('text-xs font-medium mb-2 flex items-center gap-2', mutedClass)}>
                  <FileSpreadsheet className="w-3 h-3" />
                  SPREADSHEETS
                </p>
                <div className="space-y-2">
                  {ingredients.filter(i => i.type === 'spreadsheet').map((ingredient) => (
                    <motion.div
                      key={ingredient.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-3 rounded-lg flex items-start gap-3 group',
                        cardClass,
                        'border',
                        borderClass
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-500/20">
                        <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ingredient.name}</p>
                        <p className={cn('text-xs mt-0.5', mutedClass)}>
                          {ingredient.metadata?.rows} rows × {ingredient.metadata?.columns} columns
                        </p>
                        <pre className={cn('text-[10px] mt-1 p-2 rounded bg-black/20 overflow-x-auto', mutedClass)}>
                          {ingredient.preview}
                        </pre>
                      </div>
                      <button
                        onClick={() => removeIngredient(ingredient.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {ingredients.filter(i => i.type === 'link').length > 0 && (
              <div>
                <p className={cn('text-xs font-medium mb-2 flex items-center gap-2', mutedClass)}>
                  <Link2 className="w-3 h-3" />
                  LINKS
                </p>
                <div className="space-y-2">
                  {ingredients.filter(i => i.type === 'link').map((ingredient) => (
                    <motion.div
                      key={ingredient.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-3 rounded-lg flex items-center gap-3 group',
                        cardClass,
                        'border',
                        borderClass
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/20">
                        <Link2 className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{ingredient.content}</p>
                      </div>
                      <button
                        onClick={() => removeIngredient(ingredient.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage.content}
                alt={previewImage.name}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 bg-black/50 rounded-full hover:bg-black/70"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/70 rounded-lg">
                <p className="text-white font-medium">{previewImage.name}</p>
                <p className="text-zinc-400 text-sm">
                  {previewImage.metadata?.width}x{previewImage.metadata?.height} •
                  Category: {previewImage.category || 'gallery'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button (sticky at bottom) */}
      {ingredients.length > 0 && (
        <div className="p-4 border-t border-zinc-700/50 bg-zinc-900/95 backdrop-blur">
          {invalidImageCount > 0 && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{invalidImageCount} image{invalidImageCount > 1 ? 's' : ''} failed validation and will be skipped</span>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onGenerateWithStew(ingredients)}
            disabled={validImageCount === 0 && imageCount > 0}
            className={cn(
              "w-full py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg transition",
              validImageCount === 0 && imageCount > 0
                ? "bg-zinc-700 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 shadow-orange-500/25"
            )}
          >
            <ChefHat className="w-5 h-5" />
            Start Cooking ({ingredients.length} ingredients)
            <Sparkles className="w-5 h-5" />
          </motion.button>
          <p className={cn('text-center text-xs mt-2', mutedClass)}>
            {validImageCount > 0 ? `${validImageCount} valid images` : `${imageCount} images`} • {textCount} docs • {validImageCount === 0 && imageCount > 0 ? 'No valid images!' : 'Ready to cook!'}
          </p>
        </div>
      )}
    </div>
  )
}

export default WebStewPanel
