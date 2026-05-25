import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PasswordInput from '@/components/PasswordInput'

describe('PasswordInput', () => {
    it('renders as a password field by default', () => {
        render(<PasswordInput placeholder="pw" />)
        const input = screen.getByPlaceholderText('pw')
        expect(input).toHaveAttribute('type', 'password')
    })

    it('toggles between password and text when the eye button is clicked', () => {
        render(<PasswordInput placeholder="pw" />)
        const input = screen.getByPlaceholderText('pw')
        const toggle = screen.getByRole('button')

        expect(input).toHaveAttribute('type', 'password')
        fireEvent.click(toggle)
        expect(input).toHaveAttribute('type', 'text')
        fireEvent.click(toggle)
        expect(input).toHaveAttribute('type', 'password')
    })

    it('keeps the pr-10 spacing and forwards extra className', () => {
        render(<PasswordInput placeholder="pw" className="extra-class" />)
        const input = screen.getByPlaceholderText('pw')
        expect(input.className).toContain('pr-10')
        expect(input.className).toContain('extra-class')
    })

    it('forwards value and onChange', () => {
        const onChange = vi.fn()
        render(<PasswordInput placeholder="pw" value="secret" onChange={onChange} />)
        const input = screen.getByPlaceholderText('pw') as HTMLInputElement
        expect(input.value).toBe('secret')
        fireEvent.change(input, { target: { value: 'next' } })
        expect(onChange).toHaveBeenCalledOnce()
    })

    it('the toggle is excluded from tab order', () => {
        render(<PasswordInput placeholder="pw" />)
        expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1')
    })
})
