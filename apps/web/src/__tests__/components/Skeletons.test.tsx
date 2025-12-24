import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  CardSkeleton,
  ProjectCardSkeleton,
  TableRowSkeleton,
  FormSkeleton,
  DashboardStatsSkeleton,
  BuilderSkeleton,
} from '@/components/skeletons'

describe('Skeleton', () => {
  it('renders with animation class', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')

    expect(skeleton).toHaveClass('animate-pulse')
    expect(skeleton).toHaveClass('bg-muted')
    expect(skeleton).toHaveClass('rounded-md')
  })

  it('applies custom className', () => {
    render(<Skeleton className="h-10 w-full" data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')

    expect(skeleton).toHaveClass('h-10')
    expect(skeleton).toHaveClass('w-full')
  })
})

describe('CardSkeleton', () => {
  it('renders card skeleton structure', () => {
    const { container } = render(<CardSkeleton />)

    // Should have a card-like container
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('rounded-lg')
    expect(card).toHaveClass('border')

    // Should contain skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

describe('ProjectCardSkeleton', () => {
  it('renders project card skeleton with image placeholder', () => {
    const { container } = render(<ProjectCardSkeleton />)

    // Should have image placeholder (h-40)
    const imageSkeleton = container.querySelector('.h-40')
    expect(imageSkeleton).toBeInTheDocument()

    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(2)
  })
})

describe('TableRowSkeleton', () => {
  it('renders table row with avatar and content', () => {
    const { container } = render(<TableRowSkeleton />)

    // Should have avatar skeleton (rounded-full)
    const avatar = container.querySelector('.rounded-full')
    expect(avatar).toBeInTheDocument()

    // Should have flex layout
    const row = container.firstChild as HTMLElement
    expect(row).toHaveClass('flex')
    expect(row).toHaveClass('items-center')
  })
})

describe('FormSkeleton', () => {
  it('renders form skeleton with multiple fields', () => {
    const { container } = render(<FormSkeleton />)

    // Form should have space-y-4 spacing
    const form = container.firstChild as HTMLElement
    expect(form).toHaveClass('space-y-4')

    // Should have input field skeletons (h-10)
    const inputs = container.querySelectorAll('.h-10')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })
})

describe('DashboardStatsSkeleton', () => {
  it('renders 4 stat cards', () => {
    const { container } = render(<DashboardStatsSkeleton />)

    // Should have grid layout
    const grid = container.firstChild as HTMLElement
    expect(grid).toHaveClass('grid')
    expect(grid).toHaveClass('gap-4')

    // Should have 4 stat cards
    const cards = container.querySelectorAll('.rounded-lg.border')
    expect(cards.length).toBe(4)
  })
})

describe('BuilderSkeleton', () => {
  it('renders FileTree skeleton', () => {
    const { container } = render(<BuilderSkeleton.FileTree />)

    // Should have file tree width
    const tree = container.firstChild as HTMLElement
    expect(tree).toHaveClass('w-60')
    expect(tree).toHaveClass('border-r')
  })

  it('renders Editor skeleton with line numbers', () => {
    const { container } = render(<BuilderSkeleton.Editor />)

    // Should have dark background
    const editor = container.firstChild as HTMLElement
    expect(editor).toHaveClass('bg-slate-900')
  })

  it('renders Preview skeleton', () => {
    const { container } = render(<BuilderSkeleton.Preview />)

    // Should have white background
    const preview = container.firstChild as HTMLElement
    expect(preview).toHaveClass('bg-white')
  })

  it('renders Chat skeleton', () => {
    const { container } = render(<BuilderSkeleton.Chat />)

    // Should have chat panel width
    const chat = container.firstChild as HTMLElement
    expect(chat).toHaveClass('w-80')
    expect(chat).toHaveClass('border-l')
  })

  it('renders Full builder skeleton with all panels', () => {
    const { container } = render(<BuilderSkeleton.Full />)

    // Should have full height flex container
    const builder = container.firstChild as HTMLElement
    expect(builder).toHaveClass('flex')
    expect(builder).toHaveClass('h-screen')

    // Should contain file tree, editor, preview, and chat
    expect(container.querySelector('.w-60')).toBeInTheDocument() // file tree
    expect(container.querySelector('.bg-slate-900')).toBeInTheDocument() // editor
    expect(container.querySelector('.bg-white')).toBeInTheDocument() // preview
    expect(container.querySelector('.w-80')).toBeInTheDocument() // chat
  })
})
