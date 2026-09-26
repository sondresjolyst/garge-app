import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePollUntilFinal } from '@/lib/usePollUntilFinal'

// Locks the contract the hook had before the react-hooks refactor:
// - loading is true from the first render, before any fetch resolves
// - it polls until isFinal, then stops
// - refresh() shows the spinner again and restarts
// - polling stops on unmount
//
// Real timers with a short delay: RTL's waitFor does not co-operate with
// vitest's partial fake-timer set.

const settle = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('usePollUntilFinal', () => {
    it('is loading on the very first render, before the fetcher resolves', () => {
        const fetcher = vi.fn(() => new Promise<string | null>(() => { }))
        const { result } = renderHook(() => usePollUntilFinal(fetcher, v => v === 'done'))

        expect(result.current.loading).toBe(true)
        expect(result.current.data).toBeNull()
    })

    it('stops loading once the value is final', async () => {
        const fetcher = vi.fn(async () => 'done')
        const { result } = renderHook(() => usePollUntilFinal(fetcher, v => v === 'done'))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.data).toBe('done')
        expect(fetcher).toHaveBeenCalledTimes(1)
    })

    it('keeps polling while the value is not final', async () => {
        const fetcher = vi.fn()
            .mockResolvedValueOnce('pending')
            .mockResolvedValueOnce('done')
        const { result } = renderHook(() =>
            usePollUntilFinal(fetcher as () => Promise<string | null>, v => v === 'done', { delayMs: 10 }))

        await waitFor(() => expect(result.current.data).toBe('done'))
        expect(result.current.loading).toBe(false)
        expect(fetcher).toHaveBeenCalledTimes(2)
    })

    it('gives up after the retry budget and clears loading', async () => {
        const fetcher = vi.fn(async () => 'pending')
        const { result } = renderHook(() =>
            usePollUntilFinal(fetcher, v => v === 'done', { retries: 2, delayMs: 10 }))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(fetcher).toHaveBeenCalledTimes(3)
        expect(result.current.data).toBe('pending')
    })

    it('clears loading when the fetcher rejects', async () => {
        const fetcher = vi.fn(async () => { throw new Error('boom') })
        const { result } = renderHook(() => usePollUntilFinal(fetcher, () => true))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.data).toBeNull()
    })

    it('refresh() shows the spinner again and refetches', async () => {
        const fetcher = vi.fn(async () => 'done')
        const { result } = renderHook(() => usePollUntilFinal(fetcher, v => v === 'done'))

        await waitFor(() => expect(result.current.loading).toBe(false))

        act(() => { result.current.refresh() })
        expect(result.current.loading).toBe(true)

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(fetcher).toHaveBeenCalledTimes(2)
    })

    it('stops polling after unmount', async () => {
        const fetcher = vi.fn(async () => 'pending')
        const { unmount } = renderHook(() =>
            usePollUntilFinal(fetcher, v => v === 'done', { delayMs: 10 }))

        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
        unmount()
        const callsAtUnmount = fetcher.mock.calls.length
        await act(async () => { await settle(60) })

        expect(fetcher.mock.calls.length).toBe(callsAtUnmount)
    })
})
