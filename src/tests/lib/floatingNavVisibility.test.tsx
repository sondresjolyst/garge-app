import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { FloatingNavVisibilityProvider, useFloatingNavVisibility } from '@/lib/floatingNavVisibility'
import { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => (
    <FloatingNavVisibilityProvider>{children}</FloatingNavVisibilityProvider>
)

describe('useFloatingNavVisibility', () => {
    it('defaults hidden to false', () => {
        const { result } = renderHook(() => useFloatingNavVisibility(), { wrapper })
        expect(result.current.hidden).toBe(false)
    })

    it('setHidden(true) flips value seen by consumer', () => {
        const { result } = renderHook(() => useFloatingNavVisibility(), { wrapper })
        act(() => result.current.setHidden(true))
        expect(result.current.hidden).toBe(true)
    })

    it('setHidden(false) restores visibility', () => {
        const { result } = renderHook(() => useFloatingNavVisibility(), { wrapper })
        act(() => result.current.setHidden(true))
        act(() => result.current.setHidden(false))
        expect(result.current.hidden).toBe(false)
    })

    it('throws when used outside provider', () => {
        const originalError = console.error
        console.error = () => {}
        try {
            expect(() => renderHook(() => useFloatingNavVisibility())).toThrow(
                /must be used within FloatingNavVisibilityProvider/
            )
        } finally {
            console.error = originalError
        }
    })
})
