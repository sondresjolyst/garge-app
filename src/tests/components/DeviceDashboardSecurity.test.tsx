import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const { useFeature } = vi.hoisted(() => ({
    useFeature: vi.fn(),
}))

vi.mock('@/services/sensorService', () => {
    const sensor = (id: number, mac: string, customName: string, state: string) => ({
        id,
        name: `garge_${mac}_voltage`,
        type: 'voltage',
        role: 'voltage',
        customName,
        defaultName: 'Voltage',
        registrationCode: 'x',
        parentName: `garge_${mac}`,
        security: { enabled: true, state },
    })
    return {
        default: {
            getAllSensors: vi.fn(() => Promise.resolve([
                sensor(7, 'a1b2c3d4e5f6', 'Bike battery', 'armed'),
                sensor(8, 'f6e5d4c3b2a1', 'Car battery', 'pending'),
            ])),
            getMultipleSensorsData: vi.fn(() => Promise.resolve({ data: [], totalCount: 0 })),
            getBatteryHealthLatest: vi.fn(() => Promise.reject(new Error('none'))),
        },
    }
})
vi.mock('@/services/switchService', () => ({
    default: { getAllSwitches: vi.fn(() => Promise.resolve([])) },
}))
vi.mock('@/services/groupService', () => ({
    default: { getAllGroups: vi.fn(() => Promise.resolve([])) },
}))
vi.mock('@/hooks/useDeviceStream', () => ({ useDeviceStream: vi.fn() }))
vi.mock('@/hooks/useFeature', () => ({ useFeature }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))

import DeviceDashboard from '@/app/DeviceDashboard'

beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
})

describe('DeviceDashboard Garge Security badge', () => {
    it('shows the shield only on armed sensors when the user has the feature', async () => {
        useFeature.mockReturnValue(true)
        render(<DeviceDashboard />)

        await waitFor(() => expect(screen.getByText('Bike battery')).toBeInTheDocument())

        expect(screen.getAllByRole('img', { name: 'Garge Security is watching' })).toHaveLength(1)
        expect(screen.getByText('Bike battery').closest('button')).toContainElement(
            screen.getByRole('img', { name: 'Garge Security is watching' }),
        )
    })

    it('shows no shield when the user does not have the feature', async () => {
        useFeature.mockReturnValue(false)
        render(<DeviceDashboard />)

        await waitFor(() => expect(screen.getByText('Bike battery')).toBeInTheDocument())

        expect(screen.queryByRole('img', { name: 'Garge Security is watching' })).not.toBeInTheDocument()
    })
})
