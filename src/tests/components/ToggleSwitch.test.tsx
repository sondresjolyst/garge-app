import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ToggleSwitch from '@/components/ToggleSwitch'

describe('ToggleSwitch', () => {
    it('exposes switch role with aria-checked reflecting state', () => {
        render(<ToggleSwitch checked onChange={() => { }} ariaLabel="Keep history" />)
        const sw = screen.getByRole('switch', { name: 'Keep history' })
        expect(sw).toHaveAttribute('aria-checked', 'true')
    })

    it('reports unchecked state', () => {
        render(<ToggleSwitch checked={false} onChange={() => { }} ariaLabel="Keep history" />)
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    it('calls onChange when clicked', () => {
        const onChange = vi.fn()
        render(<ToggleSwitch checked={false} onChange={onChange} ariaLabel="Keep history" />)
        fireEvent.click(screen.getByRole('switch'))
        expect(onChange).toHaveBeenCalledOnce()
    })

    it('does not call onChange when disabled', () => {
        const onChange = vi.fn()
        render(<ToggleSwitch checked={false} onChange={onChange} disabled ariaLabel="Keep history" />)
        const sw = screen.getByRole('switch')
        expect(sw).toBeDisabled()
        fireEvent.click(sw)
        expect(onChange).not.toHaveBeenCalled()
    })
})
