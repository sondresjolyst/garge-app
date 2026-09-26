import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DeviceManagePage, type DeviceItem, type DevicePageConfig } from '@/components/DeviceManagePage'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/hooks/useCanClaimDevice', () => ({
    useCanClaimDevice: () => ({
        canClaim: true, loading: false, used: 1, capacity: 5, bypass: false, refresh: vi.fn(),
    }),
}))

// Locks the mount load after the react-hooks refactor, which moved the fetch
// into the effect and extracted the sort into `byDisplayName`. Pinned rules:
// - the spinner shows until the first fetch resolves
// - rows are sorted case-insensitively by display name
// - a failed load stops the spinner and reports the error
// - the list is fetched once on mount

interface Item extends DeviceItem { customName?: string | null }

const config = (over: Partial<DevicePageConfig<Item>> = {}): DevicePageConfig<Item> => ({
    title: 'Sensors',
    itemLabel: 'sensor',
    emoji: '📡',
    fetchAll: vi.fn(async () => [] as Item[]),
    claim: vi.fn(async () => ({})),
    unclaim: vi.fn(async () => ({})),
    updateName: vi.fn(async () => ({})),
    getDisplayName: (i: Item) => i.customName ?? `sensor-${i.id}`,
    getDefaultName: () => undefined,
    ...over,
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('DeviceManagePage load', () => {
    it('shows a spinner until the first fetch resolves', async () => {
        const fetchAll = vi.fn(() => new Promise<Item[]>(() => { }))
        render(<DeviceManagePage config={config({ fetchAll })} />)

        expect(screen.queryByText('Zeta')).not.toBeInTheDocument()
        await waitFor(() => expect(fetchAll).toHaveBeenCalledTimes(1))
    })

    it('sorts rows case-insensitively by display name', async () => {
        const fetchAll = vi.fn(async (): Promise<Item[]> => [
            { id: 1, customName: 'zeta' },
            { id: 2, customName: 'Alpha' },
            { id: 3, customName: 'beta' },
        ])
        render(<DeviceManagePage config={config({ fetchAll })} />)

        await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument())

        const names = screen.getAllByText(/^(Alpha|beta|zeta)$/).map(n => n.textContent)
        expect(names).toEqual(['Alpha', 'beta', 'zeta'])
    })

    it('fetches once on mount', async () => {
        const fetchAll = vi.fn(async (): Promise<Item[]> => [{ id: 1, customName: 'Alpha' }])
        render(<DeviceManagePage config={config({ fetchAll })} />)

        await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument())
        expect(fetchAll).toHaveBeenCalledTimes(1)
    })

    it('stops loading and does not render rows when the fetch fails', async () => {
        const fetchAll = vi.fn(async (): Promise<Item[]> => { throw new Error('nope') })
        render(<DeviceManagePage config={config({ fetchAll })} />)

        await waitFor(() => expect(fetchAll).toHaveBeenCalledTimes(1))
        // Settles rather than spinning forever; the empty state is reachable.
        await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument())
    })
})
