import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CapacityMeter from '@/components/CapacityMeter'

describe('CapacityMeter', () => {
    it('shows used of capacity', () => {
        render(<CapacityMeter used={3} capacity={6} primaryActive />)
        expect(screen.getByText('3 of 6 used')).toBeInTheDocument()
    })

    it('shows the no-subscription state with a shop link when capacity is 0', () => {
        render(<CapacityMeter used={0} capacity={0} primaryActive={false} />)
        expect(screen.getByText(/no active subscription/i)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /see plans/i })).toHaveAttribute('href', '/shop')
    })

    it('warns when at capacity', () => {
        render(<CapacityMeter used={6} capacity={6} primaryActive />)
        expect(screen.getByText('6 of 6 used')).toBeInTheDocument()
        expect(screen.getByText(/at capacity/i)).toBeInTheDocument()
    })

    it('does not warn below capacity', () => {
        render(<CapacityMeter used={2} capacity={6} primaryActive />)
        expect(screen.queryByText(/at capacity/i)).not.toBeInTheDocument()
    })

    it('renders a loading skeleton', () => {
        const { container } = render(<CapacityMeter used={0} capacity={0} primaryActive loading />)
        expect(container.querySelector('.animate-pulse')).toBeTruthy()
    })
})
