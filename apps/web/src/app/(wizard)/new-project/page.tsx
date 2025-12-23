'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WizardProgress, WIZARD_STEPS } from '@/components/wizard/WizardProgress'
import { ProjectTypeSelector } from '@/components/wizard/ProjectTypeSelector'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ProjectType = 'business-portfolio' | 'ecommerce' | 'saas'

interface ProjectConfig {
  type?: ProjectType
  name: string
  description: string
  templateId?: string
  businessName?: string
  tagline?: string
  industry?: string
  colorScheme?: {
    primary: string
    secondary: string
    accent: string
  }
}

export default function NewProjectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [config, setConfig] = useState<ProjectConfig>({
    name: '',
    description: '',
    colorScheme: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
    },
  })

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!config.type
      case 2:
        return !!config.name
      case 3:
        return true
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          type: config.type,
          config: {
            businessName: config.businessName,
            tagline: config.tagline,
            industry: config.industry,
            colorScheme: config.colorScheme,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const data = await response.json()
      router.push(`/dashboard/projects/${data.project._id}`)
    } catch (error) {
      console.error('Project generation error:', error)
      alert('Failed to generate project. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container py-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Progress */}
      <div className="container py-8">
        <WizardProgress steps={WIZARD_STEPS} currentStep={currentStep} />
      </div>

      {/* Content */}
      <div className="container pb-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Step Content */}
          <div>
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">What do you want to build?</h2>
                <p className="text-muted-foreground mb-6">
                  Choose the type of website that best fits your needs
                </p>
                <ProjectTypeSelector
                  selected={config.type}
                  onSelect={(type) => setConfig({ ...config, type })}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Name Your Project</h2>
                <p className="text-muted-foreground mb-6">
                  Give your project a name and description
                </p>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        placeholder="My Awesome Website"
                        value={config.name}
                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        placeholder="A brief description of your project"
                        value={config.description}
                        onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      />
                    </div>
                    {config.type === 'business-portfolio' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            placeholder="Your Business Name"
                            value={config.businessName || ''}
                            onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tagline">Tagline</Label>
                          <Input
                            id="tagline"
                            placeholder="Your catchy tagline"
                            value={config.tagline || ''}
                            onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Customize Your Design</h2>
                <p className="text-muted-foreground mb-6">
                  Choose your color scheme and style preferences
                </p>
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                      <Label>Color Scheme</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="primary" className="text-xs">Primary</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              id="primary"
                              value={config.colorScheme?.primary}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  colorScheme: { ...config.colorScheme!, primary: e.target.value },
                                })
                              }
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                              value={config.colorScheme?.primary}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  colorScheme: { ...config.colorScheme!, primary: e.target.value },
                                })
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondary" className="text-xs">Secondary</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              id="secondary"
                              value={config.colorScheme?.secondary}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  colorScheme: { ...config.colorScheme!, secondary: e.target.value },
                                })
                              }
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                              value={config.colorScheme?.secondary}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  colorScheme: { ...config.colorScheme!, secondary: e.target.value },
                                })
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accent" className="text-xs">Accent</Label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              id="accent"
                              value={config.colorScheme?.accent}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  colorScheme: { ...config.colorScheme!, accent: e.target.value },
                                })
                              }
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <Input
                              value={config.colorScheme?.accent}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  colorScheme: { ...config.colorScheme!, accent: e.target.value },
                                })
                              }
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Set Up Integrations</h2>
                <p className="text-muted-foreground mb-6">
                  Connect your services (optional - you can do this later)
                </p>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-1">Stripe Payments</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Accept payments on your website
                        </p>
                        <Button variant="outline" size="sm">Connect Stripe</Button>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-1">MongoDB Database</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Store your application data
                        </p>
                        <Button variant="outline" size="sm">Add Connection String</Button>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-1">GitHub Repository</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Store and version your code
                        </p>
                        <Button variant="outline" size="sm">Connect GitHub</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Review & Generate</h2>
                <p className="text-muted-foreground mb-6">
                  Review your configuration and let AI generate your website
                </p>
                <Card>
                  <CardHeader>
                    <CardTitle>Project Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium capitalize">
                          {config.type?.replace('-', ' ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{config.name}</p>
                      </div>
                      {config.businessName && (
                        <div>
                          <span className="text-muted-foreground">Business:</span>
                          <p className="font-medium">{config.businessName}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Colors:</span>
                        <div className="flex gap-2 mt-1">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: config.colorScheme?.primary }}
                          />
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: config.colorScheme?.secondary }}
                          />
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: config.colorScheme?.accent }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={handleGenerate} 
                        className="w-full" 
                        size="lg"
                        disabled={isGenerating}
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        {isGenerating ? 'Generating...' : 'Generate Website with AI'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {currentStep < 5 && (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Right: AI Chat */}
          <div className="h-[600px]">
            <ChatInterface
              wizardStep={currentStep}
              initialMessage={`Hi! I'm excited to help you create your ${config.type?.replace('-', ' ') || 'new'} website. Let's start by choosing what type of site you want to build.`}
              placeholder="Ask me anything about building your website..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
