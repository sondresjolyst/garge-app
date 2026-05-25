import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock the data services so the dashboard mounts with a single socket and no
// real network. The rename path under test only needs SwitchService.
const { updateSwitchName } = vi.hoisted(() => ({
    updateSwitchName: vi.fn(() => Promise.resolve({})),
}))

vi.mock('@/services/sensorService', () => ({
    default: {
        getAllSensors: vi.fn(() => Promise.resolve([])),
        getMultipleSensorsData: vi.fn(() => Promise.resolve({ data: [], totalCount: 0 })),
        getBatteryHealthLatest: vi.fn(() => Promise.resolve(null)),
        updateCustomName: vi.fn(() => Promise.resolve({})),
    },
}))
vi.mock('@/services/switchService', () => ({
    default: {
        getAllSwitches: vi.fn(() => Promise.resolve([
            { id: 7, name: 'socket-7', type: 'relay', role: 'owner', customName: 'Garage socket' },
        ])),
        getSwitchState: vi.fn(() => Promise.resolve('ON')),
        getSwitchData: vi.fn(() => Promise.resolve([])),
        updateCustomName: updateSwitchName,
    },
}))
vi.mock('@/services/groupService', () => ({
    default: { getAllGroups: vi.fn(() => Promise.resolve([])) },
}))
vi.mock('@/services/sensorPhotoService', () => ({
    default: { get: vi.fn(() => Promise.resolve(null)) },
}))

// The realtime stream is irrelevant to the rename flow; stub it to a no-op.
vi.mock('@/hooks/useDeviceStream', () => ({ useDeviceStream: vi.fn() }))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))

import DeviceDashboard from '@/app/DeviceDashboard'

beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
})

describe('DeviceDashboard.handleRename', () => {
    it('updates the rendered device name after the drawer renames it', async () => {
        render(<DeviceDashboard />)

        // Wait for the socket card to appear (loadData resolves).
        await waitFor(() => expect(screen.getByText('Garage socket')).toBeInTheDocument())

        // Open the drawer for the socket.
        fireEvent.click(screen.getByText('Garage socket'))

        // Enter edit mode (drawer becomes visible after a rAF).
        fireEvent.click(await screen.findByRole('button', { name: 'Rename' }))

        // Rename and save.
        const input = screen.getByDisplayValue('Garage socket')
        fireEvent.change(input, { target: { value: 'Workbench socket' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save name' }))

        // The dashboard's devices state updated immutably, so the card now shows
        // the new name. (The drawer header also reflects it.)
        await waitFor(() =>
            expect(screen.getAllByText('Workbench socket').length).toBeGreaterThan(0)
        )
        expect(screen.queryByText('Garage socket')).not.toBeInTheDocument()
        expect(updateSwitchName).toHaveBeenCalledWith(7, 'Workbench socket')
    })
})
