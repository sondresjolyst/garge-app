import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { searchParams } = vi.hoisted(() => ({
    searchParams: { current: new URLSearchParams() },
}))

vi.mock('next/navigation', () => ({
    useSearchParams: () => searchParams.current,
}))
vi.mock('@/services/automationService', () => ({
    default: { getRules: vi.fn(() => Promise.resolve([])) },
}))
vi.mock('@/services/switchService', () => ({
    default: {
        getAllSwitches: vi.fn(() => Promise.resolve([
            { id: 11, name: 'garge_0a0b0c0d0e0f_switch', customName: 'Charger', type: 'relay' },
        ])),
    },
}))
vi.mock('@/services/sensorService', () => ({
    default: {
        getAllSensors: vi.fn(() => Promise.resolve([
            { id: 7, name: 'garge_a1b2c3d4e5f6_voltage', customName: 'Bike battery', defaultName: 'Voltage', type: 'voltage' },
            { id: 9, name: 'garge_a1b2c3d4e5f6_temperature', customName: 'Garage temperature', defaultName: 'Temperature', type: 'temperature' },
        ])),
        getMultipleSensorsData: vi.fn(() => Promise.resolve({ data: [], totalCount: 0 })),
    },
}))
vi.mock('@/services/userService', () => ({
    default: { getUserProfile: vi.fn(() => Promise.resolve({ priceZone: 'NO2' })) },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import AutomationsPage from '@/app/(protected)/automations/page'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('AutomationsPage charging preset', () => {
    it('opens the create form for the sensor with condition "<", action "on" and an empty threshold', async () => {
        searchParams.current = new URLSearchParams('sensorId=7&preset=charging')
        render(<AutomationsPage />)

        await waitFor(() => expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true'))

        const sensorSelect = screen.getByDisplayValue('Bike battery') as HTMLSelectElement
        expect(sensorSelect.value).toBe('7')
        expect(sensorSelect).toBeDisabled()
        expect(screen.getByDisplayValue('Less than')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Turn On')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('0')).toHaveValue(null)
    })

    it('unlocks the sensor when starting a new rule', async () => {
        searchParams.current = new URLSearchParams('sensorId=7&preset=charging')
        render(<AutomationsPage />)

        await waitFor(() => expect(screen.getByDisplayValue('Bike battery')).toBeDisabled())
        fireEvent.click(screen.getByRole('button', { name: 'New Rule' }))

        expect(screen.getByDisplayValue('Bike battery')).toBeEnabled()
    })

    it('stays closed without the preset', async () => {
        searchParams.current = new URLSearchParams('sensorId=7')
        render(<AutomationsPage />)

        await screen.findByText('Bike battery')

        expect(screen.getByDisplayValue('Select a sensor')).toBeEnabled()
        expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
    })
})
