import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'

const { getSensorSecurity, updateSensorSecurity, disableSensorSecurity, getRules, useFeature, toastSuccess, toastError } = vi.hoisted(() => ({
    getSensorSecurity: vi.fn(),
    updateSensorSecurity: vi.fn(),
    disableSensorSecurity: vi.fn(() => Promise.resolve()),
    getRules: vi.fn(),
    useFeature: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
}))

vi.mock('@/services/sensorService', () => ({
    default: {
        getMultipleSensorsData: vi.fn(() => Promise.resolve({ data: [], totalCount: 0 })),
        updateCustomName: vi.fn(() => Promise.resolve({})),
        updateVoltageThresholds: vi.fn(() => Promise.resolve({})),
        clearVoltageThresholds: vi.fn(() => Promise.resolve()),
        getSensorSecurity,
        updateSensorSecurity,
        disableSensorSecurity,
    },
}))
vi.mock('@/services/automationService', () => ({
    default: { getRules },
}))
vi.mock('@/services/sensorPhotoService', () => ({
    default: { get: vi.fn(() => Promise.resolve(null)) },
}))
vi.mock('@/hooks/useFeature', () => ({ useFeature }))
vi.mock('@/components/ActivitiesSection', () => ({ default: () => null }))
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError } }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))

import DeviceDrawer from '@/app/DeviceDrawer'
import type { UnifiedDevice } from '@/app/DeviceDashboard'
import type { SensorSecurity } from '@/services/sensorService'
import type { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto'
import { ApiError } from '@/lib/errors'

function makeVoltage(): UnifiedDevice {
    return {
        kind: 'sensor',
        id: 7,
        displayName: 'Bike battery',
        type: 'voltage',
        latestValue: 12.3,
        isActive: true,
        rawSensor: {
            id: 7,
            name: 'garge_a1b2c3d4e5f6_voltage',
            type: 'voltage',
            role: 'voltage',
            customName: 'Bike battery',
            defaultName: 'Voltage',
            registrationCode: 'x',
            parentName: 'garge_a1b2c3d4e5f6',
            warningVoltage: null,
            criticalVoltage: null,
        },
    }
}

function makeSecurity(overrides: Partial<SensorSecurity> = {}): SensorSecurity {
    return {
        sensorId: 7,
        enabled: false,
        thresholdMinutes: 25,
        requestedSleepSeconds: 3600,
        appliedSleepSeconds: 3600,
        armedAt: null,
        lastReportedAt: null,
        state: 'off',
        reason: null,
        enforcingRule: null,
        isOwner: true,
        ...overrides,
    }
}

function makeRule(overrides: Partial<AutomationRuleDto> = {}): AutomationRuleDto {
    return {
        id: 3,
        targetType: 'relay',
        targetId: 11,
        sensorType: 'voltage',
        sensorId: 7,
        condition: '<',
        threshold: 12.2,
        action: 'on',
        isEnabled: true,
        lastTriggeredAt: null,
        ...overrides,
    }
}

async function findCard(): Promise<HTMLElement> {
    const heading = await screen.findByRole('heading', { name: 'Garge Security' })
    return heading.closest('.rounded-2xl') as HTMLElement
}

beforeEach(() => {
    vi.clearAllMocks()
    useFeature.mockReturnValue(true)
    getSensorSecurity.mockResolvedValue(makeSecurity())
    getRules.mockResolvedValue([makeRule()])
})

afterEach(() => {
    vi.useRealTimers()
})

describe('DeviceDrawer Garge Security', () => {
    it('renders nothing when the user does not have the feature', async () => {
        useFeature.mockReturnValue(false)
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        await screen.findByRole('heading', { name: 'Voltage color thresholds' })

        expect(screen.queryByText(/Garge Security/)).not.toBeInTheDocument()
        expect(getSensorSecurity).not.toHaveBeenCalled()
    })

    it('disables the toggle and links to a charging preset when no charging automation exists', async () => {
        getRules.mockResolvedValue([
            makeRule({ condition: '>' }),
            makeRule({ id: 4, action: 'off' }),
            makeRule({ id: 5, isEnabled: false }),
            makeRule({ id: 6, sensorId: 8 }),
        ])
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        expect(await screen.findByRole('switch', { name: 'Turn on Garge Security' })).toBeDisabled()
        expect(screen.getByText('Requires a charging automation.')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Create charging automation' }))
            .toHaveAttribute('href', '/automations?sensorId=7&preset=charging')
    })

    it.each(['<', '<='])('turns on with a "%s" charging automation', async condition => {
        getRules.mockResolvedValue([makeRule({ condition, action: 'On' })])
        updateSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'pending', reason: 'awaiting_wake' }))
        const onSecurityChange = vi.fn()
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} onSecurityChange={onSecurityChange} />)

        const toggle = await screen.findByRole('switch', { name: 'Turn on Garge Security' })
        await waitFor(() => expect(toggle).toBeEnabled())
        fireEvent.click(toggle)

        await waitFor(() => expect(updateSensorSecurity).toHaveBeenCalledWith(7, { enabled: true, thresholdMinutes: 25 }))
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Garge Security turned on'))
        expect(onSecurityChange).toHaveBeenCalledWith(7, { enabled: true, state: 'pending' })
        expect(screen.getByRole('switch', { name: 'Turn off Garge Security' })).toHaveAttribute('aria-checked', 'true')
    })

    it('sends the chosen alert time when turning on', async () => {
        updateSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, thresholdMinutes: 45, state: 'pending' }))
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        const toggle = await screen.findByRole('switch', { name: 'Turn on Garge Security' })
        fireEvent.change(screen.getByLabelText('Alert after (minutes) without a check-in'), { target: { value: '45' } })
        await waitFor(() => expect(toggle).toBeEnabled())
        fireEvent.click(toggle)

        await waitFor(() => expect(updateSensorSecurity).toHaveBeenCalledWith(7, { enabled: true, thresholdMinutes: 45 }))
    })

    it('blocks turning on with an alert time outside 25-180 minutes', async () => {
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        const toggle = await screen.findByRole('switch', { name: 'Turn on Garge Security' })
        fireEvent.change(screen.getByLabelText('Alert after (minutes) without a check-in'), { target: { value: '20' } })

        expect(toggle).toBeDisabled()
        expect(screen.getByText('Enter a whole number from 25 to 180.')).toBeInTheDocument()
    })

    it('saves a new alert time while on', async () => {
        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'armed' }))
        updateSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, thresholdMinutes: 60, state: 'armed' }))
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        const card = await findCard()
        fireEvent.change(within(card).getByLabelText('Alert after (minutes) without a check-in'), { target: { value: '60' } })
        fireEvent.click(within(card).getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(updateSensorSecurity).toHaveBeenCalledWith(7, { enabled: true, thresholdMinutes: 60 }))
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Alert time saved'))
    })

    it('turns off via the toggle', async () => {
        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'armed' }))
        const onSecurityChange = vi.fn()
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} onSecurityChange={onSecurityChange} />)

        fireEvent.click(await screen.findByRole('switch', { name: 'Turn off Garge Security' }))

        await waitFor(() => expect(disableSensorSecurity).toHaveBeenCalledWith(7))
        expect(onSecurityChange).toHaveBeenCalledWith(7, { enabled: false, state: 'off' })
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Garge Security turned off'))
        expect(screen.getByRole('switch', { name: 'Turn on Garge Security' })).toHaveAttribute('aria-checked', 'false')
    })

    it.each<[Partial<SensorSecurity>, string]>([
        [{ state: 'pending', reason: 'awaiting_wake' }, 'Turns on at the sensor\'s next check-in, within about an hour.'],
        [{ state: 'pending', reason: 'firmware_too_old' }, 'This sensor needs a firmware update before Garge Security can turn on.'],
        [{ state: 'armed' }, 'Watching. The sensor checks in every 10 minutes.'],
        [{ state: 'paused_low_battery', reason: 'low_battery' }, 'Paused because the battery is below its charging level. Resumes once it\'s charged.'],
        [{ state: 'offline' }, 'The sensor has been offline for over a week. Garge Security resumes when it reconnects.'],
    ])('shows the copy for %o', async (overrides, copy) => {
        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, ...overrides }))
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        expect(await screen.findByText(copy)).toBeInTheDocument()
    })

    it('shows a specific toast and stays off when the API requires a charging automation', async () => {
        updateSensorSecurity.mockRejectedValue(new ApiError('Add a charging automation first.', 'charging_automation_required'))
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        const toggle = await screen.findByRole('switch', { name: 'Turn on Garge Security' })
        await waitFor(() => expect(toggle).toBeEnabled())
        fireEvent.click(toggle)

        await waitFor(() => expect(toastError).toHaveBeenCalledWith('Create a charging automation for this sensor first'))
        expect(screen.getByRole('switch', { name: 'Turn on Garge Security' })).toHaveAttribute('aria-checked', 'false')
        expect(screen.getByRole('link', { name: 'Create charging automation' })).toBeInTheDocument()
    })

    it('tells the user to turn on notifications when there is no alert channel', async () => {
        updateSensorSecurity.mockRejectedValue(new ApiError('No alert channel.', 'no_alert_channel'))
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        const toggle = await screen.findByRole('switch', { name: 'Turn on Garge Security' })
        await waitFor(() => expect(toggle).toBeEnabled())
        fireEvent.click(toggle)

        await waitFor(() => expect(toastError).toHaveBeenCalledWith('Turn on push or email notifications in your profile first'))
    })

    it('is read-only for users who do not own the sensor', async () => {
        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'armed', isOwner: false }))
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        expect(await screen.findByText('Watching. The sensor checks in every 10 minutes.')).toBeInTheDocument()
        expect(screen.queryByRole('switch')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Alert after (minutes) without a check-in')).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Create charging automation' })).not.toBeInTheDocument()
    })

    it('treats a failed automation fetch as unknown and leaves the API to decide', async () => {
        getRules.mockRejectedValue(new Error('network down'))
        updateSensorSecurity.mockRejectedValue(new ApiError('Add a charging automation first.', 'charging_automation_required'))
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        const toggle = await screen.findByRole('switch', { name: 'Turn on Garge Security' })
        expect(toggle).toBeEnabled()
        expect(screen.queryByText('Requires a charging automation.')).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Create charging automation' })).not.toBeInTheDocument()

        fireEvent.click(toggle)

        await waitFor(() => expect(toastError).toHaveBeenCalledWith('Create a charging automation for this sensor first'))
        expect(screen.getByRole('link', { name: 'Create charging automation' })).toBeInTheDocument()
    })

    it('re-fetches every 60 seconds while pending, reports the new state and stops on unmount', async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'pending', reason: 'awaiting_wake' }))
        const onSecurityChange = vi.fn()
        const { unmount } = render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} onSecurityChange={onSecurityChange} />)

        await screen.findByText('Turns on at the sensor\'s next check-in, within about an hour.')
        expect(getSensorSecurity).toHaveBeenCalledTimes(1)

        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'armed' }))
        await act(async () => { vi.advanceTimersByTime(60_000) })

        await waitFor(() => expect(getSensorSecurity).toHaveBeenCalledTimes(2))
        expect(await screen.findByText('Watching. The sensor checks in every 10 minutes.', {}, { timeout: 5000 })).toBeInTheDocument()
        expect(onSecurityChange).toHaveBeenCalledWith(7, { enabled: true, state: 'armed' })

        await act(async () => { vi.advanceTimersByTime(120_000) })
        expect(getSensorSecurity).toHaveBeenCalledTimes(2)

        unmount()
    })

    it('ignores a poll that was in flight when the user turned it off', async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'pending', reason: 'awaiting_wake' }))
        const onSecurityChange = vi.fn()
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} onSecurityChange={onSecurityChange} />)

        await screen.findByText('Turns on at the sensor\'s next check-in, within about an hour.')
        const toggle = screen.getByRole('switch', { name: 'Turn off Garge Security', hidden: true })

        let resolvePoll: (value: SensorSecurity) => void = () => {}
        getSensorSecurity.mockReturnValueOnce(new Promise<SensorSecurity>(resolve => { resolvePoll = resolve }))
        await act(async () => { vi.advanceTimersByTime(60_000) })
        await waitFor(() => expect(getSensorSecurity).toHaveBeenCalledTimes(2))

        fireEvent.click(toggle)
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Garge Security turned off'))

        await act(async () => { resolvePoll(makeSecurity({ enabled: true, state: 'pending', reason: 'awaiting_wake' })) })

        expect(screen.getByRole('switch', { name: 'Turn on Garge Security', hidden: true })).toHaveAttribute('aria-checked', 'false')
        expect(screen.queryByText('Turns on at the sensor\'s next check-in, within about an hour.')).not.toBeInTheDocument()
        expect(onSecurityChange).toHaveBeenCalledTimes(1)
        expect(onSecurityChange).toHaveBeenCalledWith(7, { enabled: false, state: 'off' })
    })

    it('ignores a poll that was in flight when the user saved', async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'pending', reason: 'awaiting_wake' }))
        updateSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, thresholdMinutes: 40, state: 'armed' }))
        const onSecurityChange = vi.fn()
        render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} onSecurityChange={onSecurityChange} />)

        const heading = await screen.findByText('Garge Security', { selector: 'h3' })
        const card = heading.closest('.rounded-2xl') as HTMLElement

        let resolvePoll: (value: SensorSecurity) => void = () => {}
        getSensorSecurity.mockReturnValueOnce(new Promise<SensorSecurity>(resolve => { resolvePoll = resolve }))
        await act(async () => { vi.advanceTimersByTime(60_000) })
        await waitFor(() => expect(getSensorSecurity).toHaveBeenCalledTimes(2))

        fireEvent.change(within(card).getByLabelText('Alert after (minutes) without a check-in'), { target: { value: '40' } })
        fireEvent.click(within(card).getByRole('button', { name: 'Save', hidden: true }))
        await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Alert time saved'))

        await act(async () => { resolvePoll(makeSecurity({ enabled: true, state: 'pending', reason: 'awaiting_wake' })) })

        expect(screen.getByText('Watching. The sensor checks in every 10 minutes.')).toBeInTheDocument()
        expect(within(card).getByLabelText('Alert after (minutes) without a check-in')).toHaveValue(40)
        expect(onSecurityChange).toHaveBeenCalledTimes(1)
        expect(onSecurityChange).toHaveBeenCalledWith(7, { enabled: true, state: 'armed' })
    })

    it('stops polling when the drawer closes while pending', async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'pending', reason: 'awaiting_wake' }))
        const { unmount } = render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)

        await screen.findByText('Turns on at the sensor\'s next check-in, within about an hour.')
        unmount()
        await act(async () => { vi.advanceTimersByTime(180_000) })

        expect(getSensorSecurity).toHaveBeenCalledTimes(1)
    })

    it('renders one of each card after repeated re-renders', async () => {
        getSensorSecurity.mockResolvedValue(makeSecurity({ enabled: true, state: 'armed' }))
        const { rerender } = render(<DeviceDrawer device={makeVoltage()} onClose={() => {}} onRename={() => {}} />)
        await findCard()

        for (let i = 0; i < 4; i++) {
            await act(async () => {
                rerender(<DeviceDrawer device={{ ...makeVoltage(), latestValue: 12 + i }} onClose={() => {}} onRename={() => {}} />)
            })
        }

        expect(screen.queryAllByRole('heading', { name: 'Garge Security' })).toHaveLength(1)
        expect(screen.queryAllByRole('heading', { name: 'Voltage color thresholds' })).toHaveLength(1)
    })

})
