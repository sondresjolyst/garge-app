import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'

const getElectricityData = vi.fn()
const getUserProfile = vi.fn()

vi.mock('@/services/electricityService', () => ({
    default: { getElectricityData: (...a: unknown[]) => getElectricityData(...a) },
}))
vi.mock('@/services/userService', () => ({
    default: { getUserProfile: () => getUserProfile() },
}))
vi.mock('next/dynamic', () => ({
    default: () => function Chart() { return <div data-testid="chart" /> },
}))

import ElectricityPage from '@/app/(protected)/electricity/page'

// Locks the loading/error behaviour across the react-hooks refactor, which
// replaced `loading` and `error` state with values derived from the cache and a
// per-tab failure marker. Pinned rules:
// - a spinner shows until the active tab has data or has failed
// - the error message shows after a failed fetch, and not before
// - a cached tab shows neither spinner nor error
// - each tab is fetched once and the result is cached
// - a fetch failure stops the spinner rather than leaving it forever

const slot = (hoursFromMidnight: number, price: number) => {
    const start = new Date()
    start.setHours(hoursFromMidnight, 0, 0, 0)
    const end = new Date(start)
    end.setHours(start.getHours() + 1)
    return { start: start.toISOString(), end: end.toISOString(), price }
}

beforeEach(() => {
    vi.clearAllMocks()
    getUserProfile.mockResolvedValue({ priceZone: 'NO2' })
})

describe('ElectricityPage loading and error states', () => {
    it('shows the spinner until the first tab resolves, then the chart', async () => {
        getElectricityData.mockResolvedValue([slot(0, 1), slot(1, 2)])
        render(<ElectricityPage />)

        await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument())
        expect(screen.queryByText('Failed to fetch electricity data')).not.toBeInTheDocument()
    })

    it('shows the error message when the fetch fails, and stops loading', async () => {
        getElectricityData.mockRejectedValue(new Error('boom'))
        render(<ElectricityPage />)

        await waitFor(() =>
            expect(screen.getByText('Failed to fetch electricity data')).toBeInTheDocument())
        expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
    })

    it('does not refetch a tab that is already cached', async () => {
        getElectricityData.mockResolvedValue([slot(0, 1)])
        render(<ElectricityPage />)

        await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument())
        const afterFirst = getElectricityData.mock.calls.length

        fireEvent.click(screen.getByRole('button', { name: 'Week' }))
        await waitFor(() => expect(getElectricityData.mock.calls.length).toBe(afterFirst + 1))

        fireEvent.click(screen.getByRole('button', { name: 'Today' }))
        await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument())
        expect(getElectricityData.mock.calls.length).toBe(afterFirst + 1)
    })

    // StrictMode mounts, unmounts and remounts effects. A mounted-flag that is
    // only cleared in cleanup stays false after that remount and silently
    // discards every result, so the page spins forever in dev.
    it('loads under StrictMode, which mounts effects twice', async () => {
        getElectricityData.mockResolvedValue([slot(0, 1)])
        render(<StrictMode><ElectricityPage /></StrictMode>)

        await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument())
    })

    it('keeps a fetch that finishes after the user switched tabs', async () => {
        let resolveToday: (v: unknown[]) => void = () => { }
        getElectricityData
            .mockImplementationOnce(() => new Promise(resolve => { resolveToday = resolve }))
            .mockResolvedValue([slot(0, 2)])
        render(<ElectricityPage />)

        await waitFor(() => expect(getElectricityData.mock.calls.length).toBe(1))

        // Leave the Today tab while its request is still in flight, then let it land.
        fireEvent.click(screen.getByRole('button', { name: 'Week' }))
        await waitFor(() => expect(getElectricityData.mock.calls.length).toBe(2))
        await act(async () => { resolveToday([slot(0, 1)]) })

        const callsBeforeReturn = getElectricityData.mock.calls.length
        fireEvent.click(screen.getByRole('button', { name: 'Today' }))
        await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument())

        // The in-flight result was cached, so returning costs no second request.
        expect(getElectricityData.mock.calls.length).toBe(callsBeforeReturn)
    })

    it('does not retry a failed tab while it stays selected', async () => {
        getElectricityData.mockRejectedValue(new Error('boom'))
        render(<ElectricityPage />)

        await waitFor(() =>
            expect(screen.getByText('Failed to fetch electricity data')).toBeInTheDocument())
        const calls = getElectricityData.mock.calls.length

        // Give any stray re-render a chance to refire the effect.
        await new Promise(resolve => setTimeout(resolve, 50))
        expect(getElectricityData.mock.calls.length).toBe(calls)
    })

    it('retries a failed tab when the user comes back to it', async () => {
        getElectricityData
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValue([slot(0, 5)])
        render(<ElectricityPage />)

        await waitFor(() =>
            expect(screen.getByText('Failed to fetch electricity data')).toBeInTheDocument())

        fireEvent.click(screen.getByRole('button', { name: 'Week' }))
        await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument())
        expect(screen.queryByText('Failed to fetch electricity data')).not.toBeInTheDocument()

        // Back to the tab that failed: it refetches and now succeeds.
        fireEvent.click(screen.getByRole('button', { name: 'Today' }))
        await waitFor(() => expect(screen.getByTestId('chart')).toBeInTheDocument())
        expect(screen.queryByText('Failed to fetch electricity data')).not.toBeInTheDocument()
    })
})
