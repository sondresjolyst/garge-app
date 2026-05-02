import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Alert from '@/components/Alert'

describe('Alert', () => {
    it('renders children', () => {
        render(<Alert variant="error">Something went wrong</Alert>)
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('applies error styles', () => {
        render(<Alert variant="error">Error</Alert>)
        const el = screen.getByText('Error')
        expect(el.className).toContain('text-red-400')
        expect(el.className).toContain('bg-red-500/10')
    })

    it('applies success styles', () => {
        render(<Alert variant="success">Done</Alert>)
        const el = screen.getByText('Done')
        expect(el.className).toContain('text-green-400')
        expect(el.className).toContain('bg-green-500/10')
    })

    it('merges custom className', () => {
        render(<Alert variant="error" className="mt-4">Oops</Alert>)
        expect(screen.getByText('Oops').className).toContain('mt-4')
    })
})
