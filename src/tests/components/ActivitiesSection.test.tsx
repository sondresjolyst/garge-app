import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import type { SensorActivity } from '@/services/sensorActivityService'

const list = vi.fn()

vi.mock('@/services/sensorActivityService', () => ({
    default: {
        list: (...a: unknown[]) => list(...a),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
    },
}))
vi.mock('@/components/DatePicker', () => ({ default: () => <div /> }))

import ActivitiesSection from '@/components/ActivitiesSection'

// Locks the per-sensor isolation of the loaded list. The refactor moved the
// fetch into the effect; without keying the result by sensorId, switching
// sensors renders the previous sensor's activities as if they were the new
// sensor's. Pinned rules:
// - the list for the requested sensor is shown
// - switching sensorId never shows the previous sensor's rows
// - switching sensorId refetches for the new sensor

const activity = (id: number, sensorId: number, title: string): SensorActivity => ({
    id,
    sensorId,
    userId: 'u1',
    title,
    activityDate: '2026-02-01T10:00:00Z',
    createdAt: '2026-02-01T10:00:00Z',
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('ActivitiesSection', () => {
    it('shows the activities of the requested sensor', async () => {
        list.mockResolvedValue([activity(1, 7, 'Oil change')])
        render(<ActivitiesSection sensorId={7} />)

        await waitFor(() => expect(screen.getByText('Oil change')).toBeInTheDocument())
        expect(list).toHaveBeenCalledWith(7)
    })

    it('does not show the previous sensor rows while the new sensor loads', async () => {
        list.mockResolvedValueOnce([activity(1, 7, 'Oil change')])
        const { rerender } = render(<ActivitiesSection sensorId={7} />)
        await waitFor(() => expect(screen.getByText('Oil change')).toBeInTheDocument())

        // Second sensor never resolves: nothing from sensor 7 may remain on screen.
        list.mockReturnValueOnce(new Promise<SensorActivity[]>(() => { }))
        rerender(<ActivitiesSection sensorId={9} />)

        expect(screen.queryByText('Oil change')).not.toBeInTheDocument()
        expect(list).toHaveBeenLastCalledWith(9)
    })

    it('shows the new sensor rows once they arrive', async () => {
        list.mockResolvedValueOnce([activity(1, 7, 'Oil change')])
        const { rerender } = render(<ActivitiesSection sensorId={7} />)
        await waitFor(() => expect(screen.getByText('Oil change')).toBeInTheDocument())

        list.mockResolvedValueOnce([activity(2, 9, 'Tyre swap')])
        rerender(<ActivitiesSection sensorId={9} />)

        await waitFor(() => expect(screen.getByText('Tyre swap')).toBeInTheDocument())
        expect(screen.queryByText('Oil change')).not.toBeInTheDocument()
    })

    it('loads under StrictMode, which mounts effects twice', async () => {
        list.mockResolvedValue([activity(1, 7, 'Oil change')])
        render(<StrictMode><ActivitiesSection sensorId={7} /></StrictMode>)

        await waitFor(() => expect(screen.getByText('Oil change')).toBeInTheDocument())
    })

    it('does not leak a failed load from one sensor onto the next', async () => {
        list.mockRejectedValueOnce(new Error('sensor 7 exploded'))
        const { rerender } = render(<ActivitiesSection sensorId={7} />)
        await waitFor(() => expect(screen.getByText('sensor 7 exploded')).toBeInTheDocument())

        list.mockResolvedValueOnce([activity(2, 9, 'Tyre swap')])
        rerender(<ActivitiesSection sensorId={9} />)

        await waitFor(() => expect(screen.getByText('Tyre swap')).toBeInTheDocument())
        expect(screen.queryByText('sensor 7 exploded')).not.toBeInTheDocument()
    })
})
