import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Locks the keyed-entry loading behaviour the react-hooks refactor introduced in
// DeviceDrawer: chartData/loadingChart/switchEvents/loadingSwitch are derived
// from an entry tagged with `${kind}:${id}:${range}` instead of being set from
// inside the effect. Pinned rules:
// - the chart for the requested sensor and range is fetched once
// - changing range refetches and does not show the previous range's series
// - changing device does not show the previous device's series
// - a socket fetches switch data, a sensor does not

const { getMultipleSensorsData, getSwitchData } = vi.hoisted(() => ({
    getMultipleSensorsData: vi.fn(),
    getSwitchData: vi.fn(),
}))

vi.mock('@/services/sensorService', () => ({
    default: {
        getMultipleSensorsData,
        updateCustomName: vi.fn(() => Promise.resolve({})),
    },
}))
vi.mock('@/services/switchService', () => ({
    default: {
        getSwitchData,
        updateCustomName: vi.fn(() => Promise.resolve({})),
    },
}))
vi.mock('@/services/sensorPhotoService', () => ({
    default: { get: vi.fn(() => Promise.resolve(null)) },
}))
vi.mock('@/components/ActivitiesSection', () => ({ default: () => null }))
vi.mock('@/hooks/useFeature', () => ({ useFeature: () => false }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// Render the series as plain text so assertions do not depend on ApexCharts.
vi.mock('next/dynamic', () => ({
    default: () => function Chart({ data }: { data: { x: number; y: number }[] }) {
        return <div data-testid="series">{data.map(p => p.y).join(',')}</div>
    },
}))

import DeviceDrawer from '@/app/DeviceDrawer'
import type { UnifiedDevice } from '@/app/DeviceDashboard'

const sensor = (overrides: Partial<UnifiedDevice> = {}): UnifiedDevice => ({
    kind: 'sensor',
    id: 3,
    displayName: 'Garage temp',
    sensorName: 'garage_temp',
    type: 'temperature',
    isActive: true,
    ...overrides,
})

const socket = (): UnifiedDevice => ({
    kind: 'socket',
    id: 7,
    displayName: 'Garage socket',
    type: 'socket',
    latestState: 'ON',
    isActive: true,
})

const reading = (value: number) => ({
    sensorId: 3,
    value,
    timestamp: '2026-02-01T10:00:00Z',
})

const props = { onClose: () => { }, onRename: () => { } }

beforeEach(() => {
    vi.clearAllMocks()
    getMultipleSensorsData.mockResolvedValue({ data: [reading(11)], totalCount: 1 })
    getSwitchData.mockResolvedValue([])
})

describe('DeviceDrawer chart loading', () => {
    it('fetches and renders the series for a sensor', async () => {
        render(<DeviceDrawer device={sensor()} {...props} />)

        await waitFor(() => expect(screen.getByTestId('series')).toHaveTextContent('11'))
        expect(getMultipleSensorsData).toHaveBeenCalledTimes(1)
    })

    it('refetches on a range change and never shows the previous range series', async () => {
        render(<DeviceDrawer device={sensor()} {...props} />)
        await waitFor(() => expect(screen.getByTestId('series')).toHaveTextContent('11'))

        // The next range never resolves: the old series must not linger.
        getMultipleSensorsData.mockReturnValueOnce(new Promise(() => { }))
        fireEvent.click(screen.getByText('Week'))

        await waitFor(() => expect(screen.queryByTestId('series')).not.toBeInTheDocument())
        expect(getMultipleSensorsData).toHaveBeenCalledTimes(2)
    })

    it('shows the new range series once it arrives', async () => {
        render(<DeviceDrawer device={sensor()} {...props} />)
        await waitFor(() => expect(screen.getByTestId('series')).toHaveTextContent('11'))

        getMultipleSensorsData.mockResolvedValueOnce({ data: [reading(22)], totalCount: 1 })
        fireEvent.click(screen.getByText('Week'))

        await waitFor(() => expect(screen.getByTestId('series')).toHaveTextContent('22'))
    })

    it('does not show the previous device series after switching device', async () => {
        const { rerender } = render(<DeviceDrawer device={sensor()} {...props} />)
        await waitFor(() => expect(screen.getByTestId('series')).toHaveTextContent('11'))

        getMultipleSensorsData.mockReturnValueOnce(new Promise(() => { }))
        rerender(<DeviceDrawer device={sensor({ id: 4, displayName: 'Other temp' })} {...props} />)

        await waitFor(() => expect(screen.queryByTestId('series')).not.toBeInTheDocument())
    })

    // Dev runs under StrictMode, which mounts effects twice; a mounted/active
    // guard that survives the remount would discard the result entirely.
    it('loads under StrictMode', async () => {
        render(<StrictMode><DeviceDrawer device={sensor()} {...props} /></StrictMode>)

        await waitFor(() => expect(screen.getByTestId('series')).toHaveTextContent('11'))
    })

    it('fetches switch data for a socket and no sensor series', async () => {
        render(<DeviceDrawer device={socket()} {...props} />)

        await waitFor(() => expect(getSwitchData).toHaveBeenCalledWith(7, '1d'))
        expect(getMultipleSensorsData).not.toHaveBeenCalled()
    })
})
