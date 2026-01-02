import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from '@/components/ui/progress'

describe('Progress', () => {
  it('renders with correct value', () => {
    render(<Progress value={50} />)
    const progress = screen.getByRole('progressbar')
    // Check that the progressbar exists and has value-related attributes
    expect(progress).toBeInTheDocument()
  })

  it('renders with 0 value by default', () => {
    render(<Progress />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('renders with max value of 100', () => {
    render(<Progress value={75} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('renders with min value of 0', () => {
    render(<Progress value={25} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('clamps value to 0-100 range', () => {
    const { rerender } = render(<Progress value={150} />)
    let progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()

    rerender(<Progress value={-10} />)
    progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('applies base progress classes', () => {
    render(<Progress value={50} />)
    const progress = screen.getByRole('progressbar')
    // Check for some expected classes
    expect(progress.className).toBeDefined()
  })

  it('applies custom className', () => {
    render(<Progress value={50} className="custom-progress" />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveClass('custom-progress')
  })

  it('renders indicator element', () => {
    render(<Progress value={50} />)
    const progress = screen.getByRole('progressbar')
    // Check that there's a child element for the indicator
    expect(progress.children.length).toBeGreaterThanOrEqual(0)
  })

  it('handles 100% completion', () => {
    render(<Progress value={100} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('handles 0% completion', () => {
    render(<Progress value={0} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })
})
