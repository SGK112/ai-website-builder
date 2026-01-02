import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('renders with correct type', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('renders with text type by default', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    // Input may not have explicit type attribute if text is default
    const type = input.getAttribute('type')
    expect(type === 'text' || type === null).toBe(true)
  })

  it('handles onChange events', () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })

    expect(onChange).toHaveBeenCalled()
  })

  it('displays placeholder text', () => {
    render(<Input placeholder="Enter email" />)
    const input = screen.getByPlaceholderText('Enter email')
    expect(input).toBeInTheDocument()
  })

  it('accepts value prop', () => {
    render(<Input value="test value" readOnly />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('test value')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('applies base input classes', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')

    expect(input).toHaveClass('flex')
    expect(input).toHaveClass('h-10')
    expect(input).toHaveClass('w-full')
    expect(input).toHaveClass('rounded-md')
    expect(input).toHaveClass('border')
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Input ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('supports required attribute', () => {
    render(<Input required />)
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('supports readonly attribute', () => {
    render(<Input readOnly />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('readonly')
  })

  it('supports maxLength attribute', () => {
    render(<Input maxLength={100} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('maxLength', '100')
  })

  it('supports name attribute', () => {
    render(<Input name="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('name', 'email')
  })

  it('supports autoComplete attribute', () => {
    render(<Input autoComplete="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('autoComplete', 'email')
  })

  it('applies focus styles', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')

    expect(input).toHaveClass('focus-visible:outline-none')
    expect(input).toHaveClass('focus-visible:ring-2')
  })

  it('applies disabled styles', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')

    expect(input).toHaveClass('disabled:cursor-not-allowed')
    expect(input).toHaveClass('disabled:opacity-50')
  })
})
