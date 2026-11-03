import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { resetTestMocks } from '@sjolystinnovation/app-kit/testing'

vi.mock('@/services/sensorService', () => ({
    default: {
        getMultipleSensorsData: vi.fn(() => Promise.resolve({ data: [], totalCount: 0 })),
        updateCustomName: vi.fn(() => Promise.resolve({})),
    },
}))
vi.mock('@/services/sensorPhotoService', () => ({
    default: { get: vi.fn(() => Promise.resolve(null)) },
}))
vi.mock('@/components/ActivitiesSection', () => ({ default: () => null }))
vi.mock('@/hooks/useFeature', () => ({ useFeature: () => false }))
vi.mock('sonner', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('next/dynamic', () => ({ default: () => () => null }))

import DeviceDrawer from '@/app/DeviceDrawer'
import type { UnifiedDevice } from '@/app/DeviceDashboard'
import type { BatteryHealthData } from '@/services/sensorService'

const base = {
    id: 1,
    sensorId: 7,
    status: 'good',
    currentVoltage: 12.6,
    onChargerNow: false,
    lastFullChargeAt: null,
    lastFullChargePeak: null,
    voltageMin24h: 12.4,
    fullChargesLast30d: 2,
    dailyDropPctPerWeek: -0.12,
    timestamp: '2026-11-01T10:00:00Z',
}

const oldShape = { ...base, restingMedian: 12.55, peakResting: 12.8, chargeAcceptanceRatio: 1.15 }
const newShape = { ...base, restingMedian: 12.55, selfDischargePctPerWeek: 0.42 }
const newNulls = {
    ...base,
    restingMedian: null,
    selfDischargePctPerWeek: null,
    voltageMin24h: null,
    dailyDropPctPerWeek: null,
}

function renderHealth(batteryHealth: unknown) {
    const device: UnifiedDevice = {
        kind: 'sensor',
        id: 7,
        displayName: 'Bike battery',
        type: 'voltage',
        latestValue: 12.6,
        isActive: true,
        batteryHealth: batteryHealth as BatteryHealthData,
    }
    render(<DeviceDrawer device={device} onClose={() => {}} onRename={() => {}} />)
}

beforeEach(resetTestMocks)
beforeEach(() => vi.clearAllMocks())

describe('DeviceDrawer battery health', () => {
    it('leaves out the rows for the older fields when the API sends them', () => {
        renderHealth(oldShape)

        expect(screen.getByText('12.55 V')).toBeInTheDocument()
        expect(screen.queryByText('Resting voltage (90d)')).not.toBeInTheDocument()
        expect(screen.queryByText('Difference')).not.toBeInTheDocument()
        expect(screen.queryByText('Charge response')).not.toBeInTheDocument()
        expect(screen.queryByText('Self-discharge')).not.toBeInTheDocument()
    })

    it('shows self-discharge with its tooltip when the value is a number', async () => {
        renderHealth(newShape)

        expect(screen.getByText('Self-discharge')).toBeInTheDocument()
        expect(screen.getByText('0.42% per week')).toBeInTheDocument()
        expect(await screen.findByRole('button', {
            name: 'Voltage lost per week early in a rest period. For information only. It does not affect battery status.',
        })).toBeInTheDocument()
    })

    it('shows self-discharge for a learning battery', () => {
        renderHealth({ ...newShape, status: 'learning' })

        expect(screen.getByText('0.42% per week')).toBeInTheDocument()
        expect(screen.queryByText('Weekly decline')).not.toBeInTheDocument()
    })

    it('shows a value that rounds to zero without a minus sign', () => {
        renderHealth({ ...newShape, selfDischargePctPerWeek: -0.001 })

        expect(screen.getByText('0.00% per week')).toBeInTheDocument()
    })

    it('shows the empty text for null values and no self-discharge row', () => {
        renderHealth(newNulls)

        expect(screen.getByText('No recent readings')).toBeInTheDocument()
        expect(screen.queryByText(/0\.00 V/)).not.toBeInTheDocument()
        expect(screen.queryByText('Self-discharge')).not.toBeInTheDocument()
        expect(screen.queryByText('Min (24h)')).not.toBeInTheDocument()
        expect(screen.getByText('Needs more charge cycles')).toBeInTheDocument()
    })

    it('renders when the optional values are missing from the response', () => {
        renderHealth({ id: 1, sensorId: 7, status: 'replace', onChargerNow: false, lastFullChargeAt: null })

        expect(screen.getAllByText('Replace').length).toBeGreaterThan(0)
        expect(screen.getByText('No recent readings')).toBeInTheDocument()
        expect(screen.getByText('Needs more charge cycles')).toBeInTheDocument()
        expect(screen.queryByText('Self-discharge')).not.toBeInTheDocument()
    })

    it.each([
        ['Status', 'Compares the voltage the battery settles at after each full charge with its own earlier charges. Shows Learning until there are enough charges to compare.'],
        ['Charger', 'Whether a charge is in progress.'],
        ['Full charges (30d)', 'Full charges detected in the last 30 days.'],
        ['Weekly decline', 'Trend in the voltage the battery settles at after recent full charges. Needs at least 3 full charges to compute.'],
    ])('explains %s in its tooltip', async (label, tooltip) => {
        renderHealth(newShape)

        expect(screen.getByText(label)).toBeInTheDocument()
        expect(await screen.findByRole('button', { name: tooltip })).toBeInTheDocument()
    })
})
