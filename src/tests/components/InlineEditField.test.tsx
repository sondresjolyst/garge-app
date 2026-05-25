import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InlineEditField from '@/components/InlineEditField'

describe('InlineEditField (default layout)', () => {
    it('calls onSave when Save is clicked and onCancel when Cancel is clicked', () => {
        const onSave = vi.fn()
        const onCancel = vi.fn()
        render(
            <InlineEditField value="Garage" onChange={() => {}} onSave={onSave} onCancel={onCancel} />
        )
        fireEvent.click(screen.getByText('Save'))
        expect(onSave).toHaveBeenCalledOnce()
        fireEvent.click(screen.getByText('Cancel'))
        expect(onCancel).toHaveBeenCalledOnce()
    })

    it('forwards typing through onChange', () => {
        const onChange = vi.fn()
        render(<InlineEditField value="Garage" onChange={onChange} onSave={() => {}} onCancel={() => {}} />)
        fireEvent.change(screen.getByDisplayValue('Garage'), { target: { value: 'Garages' } })
        expect(onChange).toHaveBeenCalledWith('Garages')
    })

    it('shows the character counter and caps length when maxLength is set', () => {
        render(<InlineEditField value="abc" onChange={() => {}} onSave={() => {}} onCancel={() => {}} maxLength={50} />)
        expect(screen.getByText('3/50')).toBeInTheDocument()
        expect(screen.getByDisplayValue('abc')).toHaveAttribute('maxlength', '50')
    })

    it('turns the counter amber within 5 of the limit', () => {
        const { rerender } = render(
            <InlineEditField value={'x'.repeat(44)} onChange={() => {}} onSave={() => {}} onCancel={() => {}} maxLength={50} />
        )
        expect(screen.getByText('44/50').className).toContain('text-gray-600')

        rerender(
            <InlineEditField value={'x'.repeat(45)} onChange={() => {}} onSave={() => {}} onCancel={() => {}} maxLength={50} />
        )
        expect(screen.getByText('45/50').className).toContain('text-amber-400')
    })

    it('renders no counter when maxLength is omitted', () => {
        render(<InlineEditField value="abc" onChange={() => {}} onSave={() => {}} onCancel={() => {}} />)
        expect(screen.queryByText(/\/\d+$/)).not.toBeInTheDocument()
    })

    it('shows an error message and disables controls while saving', () => {
        render(
            <InlineEditField value="abc" onChange={() => {}} onSave={() => {}} onCancel={() => {}} error="Required" saving />
        )
        expect(screen.getByText('Required')).toBeInTheDocument()
        expect(screen.getByText('Saving…')).toBeInTheDocument()
        expect(screen.getByDisplayValue('abc')).toBeDisabled()
    })
})

describe('InlineEditField (compact)', () => {
    it('saves on Enter and cancels on Escape', () => {
        const onSave = vi.fn()
        const onCancel = vi.fn()
        render(
            <InlineEditField compact value="Garage" onChange={() => {}} onSave={onSave} onCancel={onCancel} maxLength={50} />
        )
        const input = screen.getByDisplayValue('Garage')
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(onSave).toHaveBeenCalledOnce()
        fireEvent.keyDown(input, { key: 'Escape' })
        expect(onCancel).toHaveBeenCalledOnce()
    })

    it('renders only a single save button (no Cancel) and the counter', () => {
        render(
            <InlineEditField compact value="abc" onChange={() => {}} onSave={() => {}} onCancel={() => {}} maxLength={50} />
        )
        expect(screen.getByText('3/50')).toBeInTheDocument()
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Save name' })).toBeInTheDocument()
    })
})
