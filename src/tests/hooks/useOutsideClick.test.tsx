import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRef } from 'react'
import { useOutsideClick } from '@/hooks/useOutsideClick'

function Probe({ onOutside, enabled = true }: { onOutside: () => void; enabled?: boolean }) {
    const ref = useRef<HTMLDivElement>(null)
    useOutsideClick(ref, onOutside, enabled)
    return (
        <div>
            <div ref={ref} data-testid="inside">inside</div>
            <div data-testid="outside">outside</div>
        </div>
    )
}

afterEach(() => {
    while (document.body.firstChild) document.body.removeChild(document.body.firstChild)
})

describe('useOutsideClick', () => {
    it('fires when a mousedown lands outside the ref element', () => {
        const onOutside = vi.fn()
        render(<Probe onOutside={onOutside} />)
        fireEvent.mouseDown(screen.getByTestId('outside'))
        expect(onOutside).toHaveBeenCalledOnce()
    })

    it('does not fire when the click is inside the ref element', () => {
        const onOutside = vi.fn()
        render(<Probe onOutside={onOutside} />)
        fireEvent.mouseDown(screen.getByTestId('inside'))
        expect(onOutside).not.toHaveBeenCalled()
    })

    it('also fires on touchstart outside', () => {
        const onOutside = vi.fn()
        render(<Probe onOutside={onOutside} />)
        fireEvent.touchStart(screen.getByTestId('outside'))
        expect(onOutside).toHaveBeenCalledOnce()
    })

    it('does nothing when disabled', () => {
        const onOutside = vi.fn()
        render(<Probe onOutside={onOutside} enabled={false} />)
        fireEvent.mouseDown(screen.getByTestId('outside'))
        expect(onOutside).not.toHaveBeenCalled()
    })

    it('detaches its listeners on unmount', () => {
        const onOutside = vi.fn()
        const { unmount } = render(<Probe onOutside={onOutside} />)
        unmount()
        fireEvent.mouseDown(document.body)
        expect(onOutside).not.toHaveBeenCalled()
    })
})
