import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '@/components/Modal'

afterEach(() => {
    document.body.style.overflow = ''
})

describe('Modal', () => {
    it('renders nothing when closed', () => {
        const { container } = render(
            <Modal open={false} onClose={() => {}}><p>Body</p></Modal>
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('exposes the dialog role with aria-modal and labelledby', () => {
        render(
            <Modal open onClose={() => {}} labelledBy="title"><h2 id="title">Hi</h2></Modal>
        )
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(dialog).toHaveAttribute('aria-labelledby', 'title')
    })

    it('supports the alertdialog role', () => {
        render(<Modal open onClose={() => {}} role="alertdialog"><p>!</p></Modal>)
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    it('closes on Escape and on backdrop click', () => {
        const onClose = vi.fn()
        render(<Modal open onClose={onClose}><p>Body</p></Modal>)
        fireEvent.keyDown(window, { key: 'Escape' })
        expect(onClose).toHaveBeenCalledTimes(1)
        // The backdrop is the aria-hidden element behind the panel.
        const backdrop = document.querySelector('[aria-hidden]') as HTMLElement
        fireEvent.click(backdrop)
        expect(onClose).toHaveBeenCalledTimes(2)
    })

    it('does not close when closable is false', () => {
        const onClose = vi.fn()
        render(<Modal open onClose={onClose} closable={false}><p>Body</p></Modal>)
        fireEvent.keyDown(window, { key: 'Escape' })
        const backdrop = document.querySelector('[aria-hidden]') as HTMLElement
        fireEvent.click(backdrop)
        expect(onClose).not.toHaveBeenCalled()
    })

    it('locks body scroll while open and restores it on close', () => {
        const { rerender } = render(<Modal open onClose={() => {}}><p>Body</p></Modal>)
        expect(document.body.style.overflow).toBe('hidden')
        rerender(<Modal open={false} onClose={() => {}}><p>Body</p></Modal>)
        expect(document.body.style.overflow).toBe('')
    })
})
