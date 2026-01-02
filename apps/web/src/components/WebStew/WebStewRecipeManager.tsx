'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChefHat,
  Save,
  FolderOpen,
  Trash2,
  Clock,
  Plus,
  X,
  Check,
  Loader2,
  Download,
  Upload,
  Share2,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StewIngredient, WebStewRecipe } from './WebStewPanel'

interface WebStewRecipeManagerProps {
  currentIngredients: StewIngredient[]
  onLoadRecipe: (ingredients: StewIngredient[]) => void
  isDark?: boolean
}

const STORAGE_KEY = 'webstew-recipes'

export function WebStewRecipeManager({
  currentIngredients,
  onLoadRecipe,
  isDark = true,
}: WebStewRecipeManagerProps) {
  const [recipes, setRecipes] = useState<WebStewRecipe[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [newRecipeName, setNewRecipeName] = useState('')
  const [newRecipeDescription, setNewRecipeDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load recipes from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setRecipes(parsed.map((r: WebStewRecipe) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        })))
      }
    } catch (e) {
      console.error('Failed to load recipes:', e)
    }
  }, [])

  // Save recipes to localStorage
  const saveRecipesToStorage = (updatedRecipes: WebStewRecipe[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecipes))
      setRecipes(updatedRecipes)
    } catch (e) {
      console.error('Failed to save recipes:', e)
    }
  }

  // Save current ingredients as a recipe
  const handleSaveRecipe = () => {
    if (!newRecipeName.trim() || currentIngredients.length === 0) return

    setIsSaving(true)

    const newRecipe: WebStewRecipe = {
      id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newRecipeName.trim(),
      description: newRecipeDescription.trim(),
      ingredients: currentIngredients,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updatedRecipes = [...recipes, newRecipe]
    saveRecipesToStorage(updatedRecipes)

    setTimeout(() => {
      setIsSaving(false)
      setShowSaveDialog(false)
      setNewRecipeName('')
      setNewRecipeDescription('')
    }, 500)
  }

  // Delete a recipe
  const handleDeleteRecipe = (id: string) => {
    const updatedRecipes = recipes.filter(r => r.id !== id)
    saveRecipesToStorage(updatedRecipes)
  }

  // Load a recipe
  const handleLoadRecipe = (recipe: WebStewRecipe) => {
    onLoadRecipe(recipe.ingredients)
    setShowLoadDialog(false)
  }

  // Export recipe as JSON
  const handleExportRecipe = (recipe: WebStewRecipe) => {
    const exportData = JSON.stringify(recipe, null, 2)
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${recipe.name.replace(/\s+/g, '-').toLowerCase()}-recipe.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import recipe from JSON
  const handleImportRecipe = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as WebStewRecipe
        imported.id = `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        imported.createdAt = new Date()
        imported.updatedAt = new Date()
        const updatedRecipes = [...recipes, imported]
        saveRecipesToStorage(updatedRecipes)
      } catch (err) {
        console.error('Failed to import recipe:', err)
      }
    }
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }

  // Copy recipe to clipboard
  const handleCopyRecipe = async (recipe: WebStewRecipe) => {
    const exportData = JSON.stringify(recipe, null, 2)
    await navigator.clipboard.writeText(exportData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bgClass = isDark ? 'bg-zinc-900' : 'bg-white'
  const textClass = isDark ? 'text-white' : 'text-slate-900'
  const mutedClass = isDark ? 'text-zinc-400' : 'text-slate-500'
  const borderClass = isDark ? 'border-zinc-700' : 'border-slate-200'
  const cardClass = isDark ? 'bg-zinc-800/50' : 'bg-slate-50'

  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={currentIngredients.length === 0}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition',
            currentIngredients.length === 0
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-zinc-700/50',
            cardClass
          )}
        >
          <Save className="w-4 h-4" />
          Save Recipe
        </button>
        <button
          onClick={() => setShowLoadDialog(true)}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition hover:bg-zinc-700/50',
            cardClass
          )}
        >
          <FolderOpen className="w-4 h-4" />
          Load ({recipes.length})
        </button>
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full max-w-md rounded-2xl p-6',
                bgClass,
                'border',
                borderClass
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={cn('font-bold text-lg', textClass)}>Save Recipe</h3>
                  <p className={cn('text-xs', mutedClass)}>
                    {currentIngredients.length} ingredients
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', mutedClass)}>
                    Recipe Name
                  </label>
                  <input
                    type="text"
                    value={newRecipeName}
                    onChange={(e) => setNewRecipeName(e.target.value)}
                    placeholder="My Awesome Website"
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500/50',
                      cardClass,
                      borderClass,
                      textClass
                    )}
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', mutedClass)}>
                    Description (optional)
                  </label>
                  <textarea
                    value={newRecipeDescription}
                    onChange={(e) => setNewRecipeDescription(e.target.value)}
                    placeholder="E-commerce site with product images..."
                    rows={2}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none',
                      cardClass,
                      borderClass,
                      textClass
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition',
                    cardClass,
                    'hover:bg-zinc-700/50'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRecipe}
                  disabled={!newRecipeName.trim() || isSaving}
                  className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load Dialog */}
      <AnimatePresence>
        {showLoadDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowLoadDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden flex flex-col',
                bgClass,
                'border',
                borderClass
              )}
            >
              <div className="p-4 border-b border-zinc-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={cn('font-bold text-lg', textClass)}>Load Recipe</h3>
                    <p className={cn('text-xs', mutedClass)}>
                      {recipes.length} saved recipes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className={cn('p-2 rounded-lg transition', 'hover:bg-zinc-700/50')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Import button */}
              <div className="p-4 border-b border-zinc-700/50">
                <label className={cn(
                  'flex items-center justify-center gap-2 py-2 px-4 rounded-lg cursor-pointer transition',
                  cardClass,
                  'hover:bg-zinc-700/50',
                  'border border-dashed',
                  borderClass
                )}>
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Import Recipe File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportRecipe}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {recipes.length === 0 ? (
                  <div className={cn('text-center py-8', mutedClass)}>
                    <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No saved recipes</p>
                    <p className="text-xs mt-1">Save your first recipe to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recipes.map((recipe) => (
                      <motion.div
                        key={recipe.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'p-4 rounded-xl border group',
                          cardClass,
                          borderClass,
                          'hover:border-orange-500/50 transition'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={cn('font-semibold', textClass)}>
                              {recipe.name}
                            </h4>
                            {recipe.description && (
                              <p className={cn('text-sm mt-1 line-clamp-2', mutedClass)}>
                                {recipe.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className={mutedClass}>
                                {recipe.ingredients.length} ingredients
                              </span>
                              <span className={mutedClass}>
                                <Clock className="w-3 h-3 inline mr-1" />
                                {new Date(recipe.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-700/30">
                          <button
                            onClick={() => handleLoadRecipe(recipe)}
                            className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleExportRecipe(recipe)}
                            className={cn(
                              'p-2 rounded-lg transition',
                              'hover:bg-zinc-700/50'
                            )}
                            title="Export"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopyRecipe(recipe)}
                            className={cn(
                              'p-2 rounded-lg transition',
                              copied ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-zinc-700/50'
                            )}
                            title="Copy to clipboard"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteRecipe(recipe.id)}
                            className={cn(
                              'p-2 rounded-lg transition text-red-400',
                              'hover:bg-red-500/20'
                            )}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default WebStewRecipeManager
