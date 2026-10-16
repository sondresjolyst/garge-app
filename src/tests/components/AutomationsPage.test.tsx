import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { makeSession, navigation, resetTestMocks, setSession } from '@sjolystinnovation/app-kit/testing'

const { createRule, updateRule, getRules } = vi.hoisted(() => ({
    createRule: vi.fn(),
    updateRule: vi.fn(),
    getRules: vi.fn(),
}))

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())
vi.mock('@/services/automationService', () => ({
    default: {
        getRules: () => getRules(),
        createRule: (...a: unknown[]) => createRule(...a),
        updateRule: (...a: unknown[]) => updateRule(...a),
    },
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
vi.mock('sonner', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())

import AutomationsPage from '@/app/(protected)/automations/page'

beforeEach(() => {
    vi.clearAllMocks()
    resetTestMocks()
    setSession(makeSession({ user: { id: 'u1', name: 'ada', email: 'a@b.no', roles: [] } }))
    localStorage.clear()
    getRules.mockResolvedValue([])
})

describe('AutomationsPage drafts', () => {
    const KEY = 'garge:draft:u1:automation-rule:new'

    const fillAndWait = async () => {
        navigation.searchParams = new URLSearchParams('sensorId=7&preset=charging')
        render(<AutomationsPage />)
        await waitFor(() => expect(screen.getByDisplayValue('Bike battery')).toBeDisabled())
        fireEvent.change(screen.getByDisplayValue('Select a socket'), { target: { value: '11' } })
        fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '12.2' } })
        await waitFor(() => expect(localStorage.getItem(KEY)).not.toBeNull(), { timeout: 2000 })
    }

    it('drops the draft of a new rule once it is created', async () => {
        createRule.mockResolvedValue({})
        await fillAndWait()

        fireEvent.click(screen.getByRole('button', { name: /create rule/i }))

        await waitFor(() => expect(createRule).toHaveBeenCalled())
        await waitFor(() => expect(localStorage.getItem(KEY)).toBeNull())
    })

    it('drops the draft of an edited rule once it is saved, and keeps it when saving fails', async () => {
        const EDIT_KEY = 'garge:draft:u1:automation-rule:3'
        navigation.searchParams = new URLSearchParams()
        getRules.mockResolvedValue([{
            id: 3, targetType: 'relay', targetId: 11, sensorType: 'voltage', sensorId: 7, condition: '<',
            threshold: 12, action: 'on', isEnabled: true, lastTriggeredAt: null,
        }])
        updateRule.mockRejectedValueOnce(new Error('session ended')).mockResolvedValueOnce({})
        render(<AutomationsPage />)

        fireEvent.click(await screen.findByRole('button', { name: 'Edit' }))
        fireEvent.change(screen.getByDisplayValue('12'), { target: { value: '11.8' } })
        await waitFor(() => expect(localStorage.getItem(EDIT_KEY)).not.toBeNull(), { timeout: 2000 })

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
        await waitFor(() => expect(updateRule).toHaveBeenCalledTimes(1))
        await new Promise(r => setTimeout(r, 50))
        expect(localStorage.getItem(EDIT_KEY)).not.toBeNull()

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
        await waitFor(() => expect(updateRule).toHaveBeenCalledTimes(2))
        await waitFor(() => expect(localStorage.getItem(EDIT_KEY)).toBeNull())
    })

    it('keeps the draft when creating the rule fails', async () => {
        createRule.mockRejectedValue(new Error('session ended'))
        await fillAndWait()

        fireEvent.click(screen.getByRole('button', { name: /create rule/i }))

        await waitFor(() => expect(createRule).toHaveBeenCalled())
        await new Promise(r => setTimeout(r, 50))
        expect(JSON.parse(localStorage.getItem(KEY)!).value.threshold).toBe(12.2)
    })
})

describe('AutomationsPage charging preset', () => {
    it('opens the create form for the sensor with condition "<", action "on" and an empty threshold', async () => {
        navigation.searchParams = new URLSearchParams('sensorId=7&preset=charging')
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
        navigation.searchParams = new URLSearchParams('sensorId=7&preset=charging')
        render(<AutomationsPage />)

        await waitFor(() => expect(screen.getByDisplayValue('Bike battery')).toBeDisabled())
        fireEvent.click(screen.getByRole('button', { name: 'New Rule' }))

        expect(screen.getByDisplayValue('Bike battery')).toBeEnabled()
    })

    it('stays closed without the preset', async () => {
        navigation.searchParams = new URLSearchParams('sensorId=7')
        render(<AutomationsPage />)

        await screen.findByText('Bike battery')

        expect(screen.getByDisplayValue('Select a sensor')).toBeEnabled()
        expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
    })
})
