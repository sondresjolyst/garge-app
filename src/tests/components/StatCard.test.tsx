import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard, { StatGrid } from '@/components/StatCard'

describe('StatCard', () => {
    it('renders value and label', () => {
        render(<StatCard label="Users" value={42} />)
        expect(screen.getByText('42')).toBeInTheDocument()
        expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('shows an em dash for nullish values by default', () => {
        render(<StatCard label="Users" value={undefined} />)
        expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('renders an empty value verbatim when placeholderWhenEmpty is false', () => {
        const { container } = render(<StatCard label="Users" value={0} placeholderWhenEmpty={false} />)
        expect(container.querySelector('p')?.textContent).toBe('0')
    })
})

describe('StatGrid', () => {
    it('renders one card per item', () => {
        render(
            <StatGrid items={[
                { label: 'A', value: 1 },
                { label: 'B', value: 2 },
                { label: 'C', value: undefined },
            ]} />
        )
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('—')).toBeInTheDocument()
        expect(screen.getByText('A')).toBeInTheDocument()
    })
})
