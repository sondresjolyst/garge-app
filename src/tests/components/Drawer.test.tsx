import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Drawer from '@/components/Drawer'

afterEach(() => {
    document.body.style.overflow = ''
})

describe('Drawer', () => {
    it('renders nothing when closed', () => {
        const { container } = render(
            <Drawer open={false} onClose={() => {}}><p>Panel</p></Drawer>
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('exposes the dialog role with aria-modal', () => {
        render(<Drawer open onClose={() => {}} labelledBy="t"><p>Panel</p></Drawer>)
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(dialog).toHaveAttribute('aria-labelledby', 't')
    })

    it('closes on Escape and backdrop click, and respects closable=false', () => {
        const onClose = vi.fn()
        const { rerender } = render(<Drawer open onClose={onClose}><p>Panel</p></Drawer>)
        fireEvent.keyDown(window, { key: 'Escape' })
        const backdrop = document.querySelector('[aria-hidden]') as HTMLElement
        fireEvent.click(backdrop)
        expect(onClose).toHaveBeenCalledTimes(2)

        onClose.mockClear()
        rerender(<Drawer open onClose={onClose} closable={false}><p>Panel</p></Drawer>)
        fireEvent.keyDown(window, { key: 'Escape' })
        fireEvent.click(document.querySelector('[aria-hidden]') as HTMLElement)
        expect(onClose).not.toHaveBeenCalled()
    })

    it('locks body scroll while open and restores it on close', () => {
        const { rerender } = render(<Drawer open onClose={() => {}}><p>Panel</p></Drawer>)
        expect(document.body.style.overflow).toBe('hidden')
        rerender(<Drawer open={false} onClose={() => {}}><p>Panel</p></Drawer>)
        expect(document.body.style.overflow).toBe('')
    })
})
