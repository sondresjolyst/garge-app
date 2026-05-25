import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock the services the drawer imports so no real HTTP happens. The socket
// device exercised below only touches SwitchService; the others are stubbed to
// keep the module graph happy. Mock fns are declared with vi.hoisted so the
// hoisted vi.mock factories can reference them.
const { updateSwitchName, getSwitchData, toastSuccess, toastError } = vi.hoisted(() => ({
    updateSwitchName: vi.fn(() => Promise.resolve({})),
    getSwitchData: vi.fn(() => Promise.resolve([])),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
}))

vi.mock('@/services/switchService', () => ({
    default: {
        getSwitchData,
        updateCustomName: updateSwitchName,
    },
}))
vi.mock('@/services/sensorService', () => ({
    default: {
        getMultipleSensorsData: vi.fn(() => Promise.resolve({ data: [], totalCount: 0 })),
        updateCustomName: vi.fn(() => Promise.resolve({})),
    },
}))
vi.mock('@/services/sensorPhotoService', () => ({
    default: { get: vi.fn(() => Promise.resolve(null)) },
}))

vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError } }))

// Avoid pulling ApexCharts into jsdom; sockets don't render it anyway.
vi.mock('next/dynamic', () => ({ default: () => () => null }))

import DeviceDrawer from '@/app/DeviceDrawer'
import type { UnifiedDevice } from '@/app/DeviceDashboard'

function makeSocket(overrides: Partial<UnifiedDevice> = {}): UnifiedDevice {
    return {
        kind: 'socket',
        id: 7,
        displayName: 'Garage socket',
        type: 'socket',
        latestState: 'ON',
        isActive: true,
        ...overrides,
    }
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('DeviceDrawer rename', () => {
    it('calls onRename(id, trimmedName) and does NOT mutate the device prop', async () => {
        const device = makeSocket()
        const onRename = vi.fn()
        render(<DeviceDrawer device={device} onClose={() => {}} onRename={onRename} />)

        // The drawer mounts with aria-hidden until a requestAnimationFrame flips
        // it visible; findByRole retries until the accessibility tree exposes it.
        fireEvent.click(await screen.findByRole('button', { name: 'Rename' }))

        // Type a new name with surrounding whitespace to verify trimming.
        const input = screen.getByDisplayValue('Garage socket')
        fireEvent.change(input, { target: { value: '  New Socket Name  ' } })

        // Save via the compact check button.
        fireEvent.click(screen.getByRole('button', { name: 'Save name' }))

        await waitFor(() => expect(onRename).toHaveBeenCalledTimes(1))
        expect(onRename).toHaveBeenCalledWith(7, 'New Socket Name')

        // The persisted name must flow through the callback, not by mutating the
        // prop object. The passed-in device's displayName stays untouched.
        expect(device.displayName).toBe('Garage socket')

        // Service was asked to persist the trimmed name, and a success toast fired.
        expect(updateSwitchName).toHaveBeenCalledWith(7, 'New Socket Name')
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Socket renamed'))
    })

    it('does not call onRename for an empty/whitespace-only name', async () => {
        const device = makeSocket()
        const onRename = vi.fn()
        render(<DeviceDrawer device={device} onClose={() => {}} onRename={onRename} />)

        fireEvent.click(await screen.findByRole('button', { name: 'Rename' }))
        fireEvent.change(screen.getByDisplayValue('Garage socket'), { target: { value: '   ' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save name' }))

        // Whitespace-only is rejected before any persistence.
        expect(onRename).not.toHaveBeenCalled()
        expect(updateSwitchName).not.toHaveBeenCalled()
    })

    it('surfaces a failure toast and leaves the device prop unchanged when the service throws', async () => {
        updateSwitchName.mockRejectedValueOnce(new Error('boom'))
        const device = makeSocket()
        const onRename = vi.fn()
        render(<DeviceDrawer device={device} onClose={() => {}} onRename={onRename} />)

        fireEvent.click(await screen.findByRole('button', { name: 'Rename' }))
        fireEvent.change(screen.getByDisplayValue('Garage socket'), { target: { value: 'Other' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save name' }))

        await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to rename'))
        expect(onRename).not.toHaveBeenCalled()
        expect(device.displayName).toBe('Garage socket')
    })
})
