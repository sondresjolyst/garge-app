import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { updateVoltageThresholds, clearVoltageThresholds, getMultipleSensorsData, toastSuccess, toastError } = vi.hoisted(() => ({
    updateVoltageThresholds: vi.fn(() => Promise.resolve({})),
    clearVoltageThresholds: vi.fn(() => Promise.resolve()),
    getMultipleSensorsData: vi.fn(() => Promise.resolve({ data: [], totalCount: 0 })),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
}))

vi.mock('@/services/sensorService', () => ({
    default: {
        getMultipleSensorsData,
        updateCustomName: vi.fn(() => Promise.resolve({})),
        updateVoltageThresholds,
        clearVoltageThresholds,
    },
}))
vi.mock('@/services/sensorPhotoService', () => ({
    default: { get: vi.fn(() => Promise.resolve(null)) },
}))
vi.mock('@/components/ActivitiesSection', () => ({ default: () => null }))
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError } }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))

import DeviceDrawer from '@/app/DeviceDrawer'
import type { UnifiedDevice } from '@/app/DeviceDashboard'
import type { Sensor } from '@/services/sensorService'

function makeVoltage(overrides: Partial<Sensor> = {}): UnifiedDevice {
    return {
        kind: 'sensor',
        id: 7,
        displayName: 'Bike battery',
        type: 'voltage',
        latestValue: 12.3,
        isActive: true,
        rawSensor: {
            id: 7,
            name: 'garge_b43a4536a89c_voltage',
            type: 'voltage',
            role: 'voltage',
            customName: 'Bike battery',
            defaultName: 'Voltage',
            registrationCode: 'x',
            parentName: 'garge_b43a4536a89c',
            warningVoltage: null,
            criticalVoltage: null,
            ...overrides,
        },
    }
}

beforeEach(() => vi.clearAllMocks())

describe('DeviceDrawer voltage thresholds', () => {
    it('saves warning + critical thresholds and notifies the parent', async () => {
        const onThresholdsChange = vi.fn()
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} onThresholdsChange={onThresholdsChange} />)

        const saveBtn = await screen.findByRole('button', { name: 'Save' })
        fireEvent.change(screen.getByLabelText('Warning voltage'), { target: { value: '12.4' } })
        fireEvent.change(screen.getByLabelText('Critical voltage'), { target: { value: '12.0' } })

        fireEvent.click(saveBtn)

        await waitFor(() => expect(updateVoltageThresholds).toHaveBeenCalledWith(7, 12.4, 12.0))
        expect(onThresholdsChange).toHaveBeenCalledWith(7, 12.4, 12.0)
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Voltage thresholds saved'))
    })

    it('blocks saving when warning is not above critical', async () => {
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        const saveBtn = await screen.findByRole('button', { name: 'Save' })
        fireEvent.change(screen.getByLabelText('Warning voltage'), { target: { value: '11.0' } })
        fireEvent.change(screen.getByLabelText('Critical voltage'), { target: { value: '12.0' } })

        expect(saveBtn).toBeDisabled()
        expect(updateVoltageThresholds).not.toHaveBeenCalled()
    })

    it('clears thresholds via Turn off when already set', async () => {
        const onThresholdsChange = vi.fn()
        render(
            <DeviceDrawer
                device={makeVoltage({ warningVoltage: 12.4, criticalVoltage: 12.0 })}
                onClose={() => {}}
                onRename={() => {}}
                onThresholdsChange={onThresholdsChange}
            />,
        )

        fireEvent.click(await screen.findByRole('button', { name: 'Turn off' }))

        await waitFor(() => expect(clearVoltageThresholds).toHaveBeenCalledWith(7))
        expect(onThresholdsChange).toHaveBeenCalledWith(7, null, null)
    })
})
