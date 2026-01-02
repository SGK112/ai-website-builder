import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('Label', () => {
  it('renders with correct text', () => {
    render(<Label>Email Address</Label>)
    expect(screen.getByText('Email Address')).toBeInTheDocument()
  })

  it('associates with input via htmlFor', () => {
    render(<Label htmlFor="email-input">Email</Label>)
    const label = screen.getByText('Email')
    expect(label).toHaveAttribute('for', 'email-input')
  })

  it('applies base label classes', () => {
    render(<Label>Label</Label>)
    const label = screen.getByText('Label')

    expect(label).toHaveClass('text-sm')
    expect(label).toHaveClass('font-medium')
  })

  it('applies custom className', () => {
    render(<Label className="custom-label">Label</Label>)
    const label = screen.getByText('Label')
    expect(label).toHaveClass('custom-label')
  })

  it('renders children correctly', () => {
    render(
      <Label>
        <span>Required</span> Field
      </Label>
    )
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(screen.getByText(/Field/)).toBeInTheDocument()
  })

  it('applies peer-disabled styles', () => {
    render(<Label>Disabled Label</Label>)
    const label = screen.getByText('Disabled Label')
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed')
    expect(label).toHaveClass('peer-disabled:opacity-70')
  })
})
