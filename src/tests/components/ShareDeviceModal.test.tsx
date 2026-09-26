import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { SensorShare } from '@/services/sensorService'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import ShareDeviceModal from '@/components/ShareDeviceModal'

// Locks the share list load after the react-hooks refactor moved the fetch into
// the effect (the `load` callback is now only used to refresh after a mutation).
// Pinned rules:
// - existing shares are listed for the given device
// - a failed load surfaces the error instead of an empty list rendered as success
// - adding a share refreshes the list
// - a new deviceId refetches

const share1: SensorShare = {
    userId: 'u2',
    email: 'friend@example.com',
    firstName: 'Fri',
    lastName: 'End',
    permission: 'read',
    sharedAt: '2026-02-01T10:00:00Z',
}

function renderModal(over: Partial<React.ComponentProps<typeof ShareDeviceModal>> = {}) {
    const props = {
        deviceLabel: 'sensor',
        deviceName: 'garage_temp',
        deviceId: 3,
        listShares: vi.fn(async () => [share1]),
        share: vi.fn(async () => ({})),
        revokeShare: vi.fn(async () => ({})),
        onClose: vi.fn(),
        ...over,
    }
    return { ...render(<ShareDeviceModal {...props} />), props }
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('ShareDeviceModal', () => {
    it('lists the existing shares for the device', async () => {
        const { props } = renderModal()

        await waitFor(() => expect(screen.getByText('friend@example.com')).toBeInTheDocument())
        expect(props.listShares).toHaveBeenCalledWith(3)
        expect(props.listShares).toHaveBeenCalledTimes(1)
    })

    it('shows the error when the share list fails to load', async () => {
        renderModal({ listShares: vi.fn(async () => { throw new Error('no access') }) })

        await waitFor(() => expect(screen.getByText('no access')).toBeInTheDocument())
    })

    it('refreshes the list after adding a share', async () => {
        const listShares = vi.fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([share1])
        const shareFn = vi.fn(async () => ({}))
        renderModal({ listShares, share: shareFn })

        await waitFor(() => expect(listShares).toHaveBeenCalledTimes(1))

        fireEvent.change(screen.getByPlaceholderText('person@example.com'), {
            target: { value: 'friend@example.com' },
        })
        fireEvent.click(screen.getByText('Share'))

        await waitFor(() => expect(shareFn).toHaveBeenCalledWith(3, 'friend@example.com', 'read'))
        await waitFor(() => expect(screen.getByText('friend@example.com')).toBeInTheDocument())
        expect(listShares).toHaveBeenCalledTimes(2)
    })

    it('refetches when the device changes', async () => {
        const listShares = vi.fn(async () => [share1])
        const { rerender, props } = renderModal({ listShares })
        await waitFor(() => expect(listShares).toHaveBeenCalledWith(3))

        rerender(<ShareDeviceModal {...props} deviceId={9} />)

        await waitFor(() => expect(listShares).toHaveBeenCalledWith(9))
    })
})
