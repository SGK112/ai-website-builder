'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  title: string
  description: string
}

interface WizardProgressProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  return (
    <div className="w-full">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={cn(
                stepIdx !== steps.length - 1 ? 'flex-1' : '',
                'relative'
              )}
            >
              {step.id < currentStep ? (
                // Completed step
                <div className="group flex w-full flex-col items-center">
                  <span className="flex items-center">
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full bg-primary',
                        onStepClick && 'cursor-pointer hover:bg-primary/80'
                      )}
                      onClick={() => onStepClick?.(step.id)}
                    >
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </span>
                    {stepIdx !== steps.length - 1 && (
                      <div className="hidden sm:block h-0.5 w-full bg-primary" />
                    )}
                  </span>
                  <span className="mt-2 text-xs font-medium text-primary">
                    {step.title}
                  </span>
                </div>
              ) : step.id === currentStep ? (
                // Current step
                <div className="flex w-full flex-col items-center" aria-current="step">
                  <span className="flex items-center">
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </span>
                    {stepIdx !== steps.length - 1 && (
                      <div className="hidden sm:block h-0.5 w-full bg-border" />
                    )}
                  </span>
                  <span className="mt-2 text-xs font-medium text-primary">
                    {step.title}
                  </span>
                </div>
              ) : (
                // Upcoming step
                <div className="group flex w-full flex-col items-center">
                  <span className="flex items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background">
                      <span className="text-sm text-muted-foreground">{step.id}</span>
                    </span>
                    {stepIdx !== steps.length - 1 && (
                      <div className="hidden sm:block h-0.5 w-full bg-border" />
                    )}
                  </span>
                  <span className="mt-2 text-xs font-medium text-muted-foreground">
                    {step.title}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}

export const WIZARD_STEPS: Step[] = [
  { id: 1, title: 'Project Type', description: 'Choose your website type' },
  { id: 2, title: 'Template', description: 'Select a starting template' },
  { id: 3, title: 'Customize', description: 'Personalize your design' },
  { id: 4, title: 'Credentials', description: 'Set up integrations' },
  { id: 5, title: 'Generate', description: 'Build and deploy' },
]
