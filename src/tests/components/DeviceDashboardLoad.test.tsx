import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'

// Locks the dashboard data load after the react-hooks refactor moved the whole
// fetch-and-map into a module-level `fetchDashboardData` and made the mount
// effect own the state writes. Pinned rules:
// - sensors and sockets both reach the grid, mapped to their display names
// - battery-type sensors are excluded
// - staleness is measured against the load time, so a recent reading is active
//   and a 20-day-old one is not
// - the load runs once on mount

const {
    getAllSensors, getMultipleSensorsData, getBatteryHealthLatest,
    getAllSwitches, getSwitchState, getAllGroups,
} = vi.hoisted(() => ({
    getAllSensors: vi.fn(),
    getMultipleSensorsData: vi.fn(),
    getBatteryHealthLatest: vi.fn(),
    getAllSwitches: vi.fn(),
    getSwitchState: vi.fn(),
    getAllGroups: vi.fn(),
}))

vi.mock('@/services/sensorService', () => ({
    default: {
        getAllSensors: () => getAllSensors(),
        getMultipleSensorsData: (...a: unknown[]) => getMultipleSensorsData(...a),
        getBatteryHealthLatest: (...a: unknown[]) => getBatteryHealthLatest(...a),
        updateCustomName: vi.fn(() => Promise.resolve({})),
    },
}))
vi.mock('@/services/switchService', () => ({
    default: {
        getAllSwitches: () => getAllSwitches(),
        getSwitchState: (...a: unknown[]) => getSwitchState(...a),
        getSwitchData: vi.fn(() => Promise.resolve([])),
        updateCustomName: vi.fn(() => Promise.resolve({})),
    },
}))
vi.mock('@/services/groupService', () => ({ default: { getAllGroups: () => getAllGroups() } }))
vi.mock('@/services/sensorPhotoService', () => ({ default: { get: vi.fn(() => Promise.resolve(null)) } }))
vi.mock('@/hooks/useDeviceStream', () => ({ useDeviceStream: vi.fn() }))
vi.mock('@/hooks/useFeature', () => ({ useFeature: () => false }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))

import DeviceDashboard from '@/app/DeviceDashboard'

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getAllSensors.mockResolvedValue([
        { id: 1, name: 'garage_temp', type: 'temperature', customName: 'Garage temp' },
        { id: 2, name: 'bike_volt', type: 'voltage', customName: 'Bike battery' },
        { id: 3, name: 'hidden_batt', type: 'battery', customName: 'Should not show' },
    ])
    getMultipleSensorsData.mockResolvedValue({
        data: [
            { sensorId: 1, value: 21.5, timestamp: daysAgo(0) },
            { sensorId: 2, value: 12.8, timestamp: daysAgo(0) },
        ],
        totalCount: 2,
    })
    getBatteryHealthLatest.mockResolvedValue(null)
    getAllSwitches.mockResolvedValue([
        { id: 7, name: 'socket-7', type: 'relay', role: 'owner', customName: 'Garage socket' },
    ])
    getSwitchState.mockResolvedValue('ON')
    getAllGroups.mockResolvedValue([])
})

describe('DeviceDashboard load', () => {
    it('renders sensors and sockets from one load, excluding battery sensors', async () => {
        render(<DeviceDashboard />)

        await waitFor(() => expect(screen.getByText('Garage temp')).toBeInTheDocument())
        expect(screen.getByText('Bike battery')).toBeInTheDocument()
        expect(screen.getByText('Garage socket')).toBeInTheDocument()
        expect(screen.queryByText('Should not show')).not.toBeInTheDocument()
    })

    it('loads once on mount', async () => {
        render(<DeviceDashboard />)

        await waitFor(() => expect(screen.getByText('Garage temp')).toBeInTheDocument())
        expect(getAllSensors).toHaveBeenCalledTimes(1)
        expect(getAllSwitches).toHaveBeenCalledTimes(1)
        expect(getAllGroups).toHaveBeenCalledTimes(1)
    })

    it('loads under StrictMode, which mounts effects twice', async () => {
        render(<StrictMode><DeviceDashboard /></StrictMode>)

        await waitFor(() => expect(screen.getByText('Garage temp')).toBeInTheDocument())
    })

    it('renders the latest sensor value it was given', async () => {
        render(<DeviceDashboard />)

        await waitFor(() => expect(screen.getByText(/21\.5/)).toBeInTheDocument())
        expect(screen.getByText(/12\.80/)).toBeInTheDocument()
    })

    it('groups a sensor whose only reading is 20 days old as having no recent data', async () => {
        // No 1d readings; the 14d call supplies a 20-day-old timestamp, which is
        // past the staleness threshold measured against the load time.
        getMultipleSensorsData.mockImplementation((_ids, _a, _b, range: string) =>
            Promise.resolve(range === '1d'
                ? { data: [], totalCount: 0 }
                : {
                    data: [
                        { sensorId: 1, value: 21.5, timestamp: daysAgo(20) },
                        { sensorId: 2, value: 12.8, timestamp: daysAgo(20) },
                    ],
                    totalCount: 2,
                }))

        render(<DeviceDashboard />)

        await waitFor(() => expect(screen.getByText('No recent data')).toBeInTheDocument())
    })

    it('does not group a sensor with a fresh reading as having no recent data', async () => {
        render(<DeviceDashboard />)

        await waitFor(() => expect(screen.getByText('Garage temp')).toBeInTheDocument())
        expect(screen.queryByText('No recent data')).not.toBeInTheDocument()
    })
})
