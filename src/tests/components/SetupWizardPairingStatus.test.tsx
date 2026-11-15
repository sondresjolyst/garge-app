import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { resetTestMocks, toastSpies } from '@sjolystinnovation/app-kit/testing'
import type { Sensor } from '@/services/sensorService'
import type { DeviceCreatedEvent } from '@/hooks/useDeviceStream'

vi.mock('sonner', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@/services/sensorService', () => ({ default: { getAllSensors: vi.fn() } }))
vi.mock('@/services/switchService', () => ({ default: { getAllSwitches: vi.fn() } }))
vi.mock('@/services/groupService', () => ({ default: { getAllGroups: vi.fn(() => Promise.resolve([])) } }))
vi.mock('@/services/pairingService', () => ({ default: { mintToken: vi.fn(), getStatus: vi.fn() } }))
vi.mock('@/hooks/useCanClaimDevice', () => ({
    useCanClaimDevice: () => ({ canClaim: true, loading: false, refresh: vi.fn(() => Promise.resolve()), capacity: 2, used: 1, bypass: false }),
}))
vi.mock('@/hooks/useDeviceStream', () => ({ useDeviceStream: vi.fn() }))

import SetupWizard from '@/app/SetupWizard'
import SensorService from '@/services/sensorService'
import SwitchService from '@/services/switchService'
import PairingService, { PairingStatus } from '@/services/pairingService'
import { useDeviceStream } from '@/hooks/useDeviceStream'

const sensor = (id: number): Sensor => ({
    id,
    name: `sensor-${id}`,
    type: 'temperature',
    role: '',
    customName: `Sensor ${id}`,
    defaultName: `Garge ${id} temperature`,
    registrationCode: '',
    parentName: '',
})

const status = (s: PairingStatus['status'], sensorIds: number[] = [], switchIds: number[] = []): PairingStatus =>
    ({ status: s, sensorIds, switchIds })

const WAITING = 'Waiting for your device…'
const CHECKING = 'Checking if your device is paired…'
const EXPIRED = 'This pairing code has expired.'
const OTHER_ACCOUNT = 'This device belongs to another account. The owner must select “Remove from account” on every card for this device. Then get a new code.'

let visibility: DocumentVisibilityState = 'visible'
let deviceCreated: ((e: DeviceCreatedEvent) => void) | undefined
let expiresInMs = 15 * 60 * 1000

const advance = async (ms: number) => {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

const setVisibility = async (value: DocumentVisibilityState) => {
    visibility = value
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
}

const calls = () => vi.mocked(PairingService.getStatus).mock.calls.length

/** Renders the wizard and gets a pairing code, which also runs the first status check. */
const startPairing = async () => {
    const view = render(<SetupWizard onClose={vi.fn()} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Get pairing code' })) })
    return view
}

const expectNamingSensor = (name: string) => {
    expect(screen.getByRole('heading', { name: 'Name your sensor' })).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue(name)
}

beforeEach(() => {
    resetTestMocks()
    vi.useFakeTimers()
    visibility = 'visible'
    expiresInMs = 15 * 60 * 1000
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
    deviceCreated = undefined
    vi.mocked(useDeviceStream).mockReset()
    vi.mocked(useDeviceStream).mockImplementation(handlers => { deviceCreated = handlers.onDeviceCreated })
    vi.mocked(PairingService.mintToken).mockReset()
    vi.mocked(PairingService.mintToken).mockImplementation(() => Promise.resolve({
        token: 'ABC123',
        expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    }))
    vi.mocked(PairingService.getStatus).mockReset()
    vi.mocked(PairingService.getStatus).mockResolvedValue(status('waiting'))
    vi.mocked(SensorService.getAllSensors).mockReset()
    vi.mocked(SensorService.getAllSensors).mockResolvedValue([sensor(3), sensor(8)])
    vi.mocked(SwitchService.getAllSwitches).mockReset()
    vi.mocked(SwitchService.getAllSwitches).mockResolvedValue([])
})

afterEach(() => {
    vi.useRealTimers()
})

describe('SetupWizard pairing status', () => {
    it('checks the status at once when a code is shown', async () => {
        await startPairing()

        expect(PairingService.getStatus).toHaveBeenCalledTimes(1)
        expect(PairingService.getStatus).toHaveBeenCalledWith('ABC123')
        expect(screen.getByText(WAITING)).toBeInTheDocument()
    })

    it('advances to naming the lowest sensor id when the poll says paired', async () => {
        await startPairing()
        await advance(3000)
        expect(calls()).toBe(2)
        expect(screen.getByText(WAITING)).toBeInTheDocument()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired', [3, 8], [1]))
        await advance(3000)

        expectNamingSensor('Sensor 3')
        expect(SwitchService.getAllSwitches).not.toHaveBeenCalled()
    })

    it('picks the lowest switch id when the pairing has no sensors', async () => {
        vi.mocked(SwitchService.getAllSwitches).mockResolvedValue([
            { id: 4, name: 'switch-4', type: 'socket', role: '', customName: 'Heater 4' },
            { id: 9, name: 'switch-9', type: 'socket', role: '', customName: 'Heater 9' },
        ])
        await startPairing()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired', [], [4, 9]))
        await advance(3000)

        expect(screen.getByRole('heading', { name: 'Name your socket' })).toBeInTheDocument()
        expect(screen.getByRole('textbox')).toHaveValue('Heater 4')
    })

    it('advances once when the SignalR event and a poll result both arrive', async () => {
        let resolveSensors: (value: Sensor[]) => void = () => {}
        vi.mocked(SensorService.getAllSensors).mockImplementation(() => new Promise(resolve => { resolveSensors = resolve }))
        await startPairing()

        await act(async () => { deviceCreated?.({ kind: 'sensor', id: 3 }) })
        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired', [3, 8]))
        await advance(3000)
        await act(async () => { resolveSensors([sensor(3), sensor(8)]) })

        expect(SensorService.getAllSensors).toHaveBeenCalledTimes(1)
        expect(screen.getByRole('heading', { name: 'Name your sensor' })).toBeInTheDocument()
    })

    it('ignores the SignalR event after a poll result advanced', async () => {
        let resolveSensors: (value: Sensor[]) => void = () => {}
        vi.mocked(SensorService.getAllSensors).mockImplementation(() => new Promise(resolve => { resolveSensors = resolve }))
        await startPairing()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired', [3]))
        await advance(3000)
        await act(async () => { deviceCreated?.({ kind: 'sensor', id: 3 }) })
        await act(async () => { resolveSensors([sensor(3)]) })

        expect(SensorService.getAllSensors).toHaveBeenCalledTimes(1)
    })

    it('says the device belongs to another account when paired with no devices, and keeps polling', async () => {
        await startPairing()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired'))
        await advance(3000)

        expect(screen.getByRole('alert')).toHaveTextContent(OTHER_ACCOUNT)
        expect(screen.queryByText(WAITING)).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'How to sell or give away a sensor' })).toHaveAttribute('href', '/help#selling')
        expect(screen.getByRole('button', { name: 'Get new code' })).toBeInTheDocument()

        const before = calls()
        await advance(3000)
        expect(calls()).toBe(before + 1)
        expect(screen.getByRole('alert')).toHaveTextContent(OTHER_ACCOUNT)
    })

    it('advances when a poll says paired with devices after ownedByOther', async () => {
        vi.mocked(PairingService.getStatus).mockResolvedValue(status('ownedByOther'))
        await startPairing()

        expect(screen.getByRole('alert')).toHaveTextContent(OTHER_ACCOUNT)
        expect(screen.getByRole('link', { name: 'How to sell or give away a sensor' })).toHaveAttribute('href', '/help#selling')

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired', [8]))
        await advance(3000)

        expectNamingSensor('Sensor 8')
    })

    it('advances on the SignalR event after ownedByOther', async () => {
        vi.mocked(PairingService.getStatus).mockResolvedValue(status('ownedByOther'))
        await startPairing()
        expect(screen.getByRole('alert')).toHaveTextContent(OTHER_ACCOUNT)

        await act(async () => { deviceCreated?.({ kind: 'sensor', id: 3 }) })

        expectNamingSensor('Sensor 3')
    })

    it('polls the new code after you get a new code from the other-account message', async () => {
        vi.mocked(PairingService.getStatus).mockResolvedValue(status('ownedByOther'))
        await startPairing()
        vi.mocked(PairingService.mintToken).mockResolvedValue({
            token: 'NEW456',
            expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
        })
        vi.mocked(PairingService.getStatus).mockResolvedValue(status('waiting'))

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Get new code' })) })

        expect(screen.getByText(WAITING)).toBeInTheDocument()
        expect(PairingService.getStatus).toHaveBeenLastCalledWith('NEW456')
        await advance(3000)
        expect(PairingService.getStatus).toHaveBeenLastCalledWith('NEW456')
    })

    it('ignores a late result for the old code after you get a new code', async () => {
        let resolveOld: (value: PairingStatus) => void = () => {}
        let oldCalls = 0
        vi.mocked(PairingService.getStatus).mockImplementation(token => {
            if (token !== 'ABC123') return Promise.resolve(status('waiting'))
            oldCalls += 1
            if (oldCalls === 1) return Promise.resolve(status('ownedByOther'))
            return new Promise(resolve => { resolveOld = resolve })
        })
        await startPairing()
        await advance(3000)
        expect(oldCalls).toBe(2)

        vi.mocked(PairingService.mintToken).mockResolvedValue({
            token: 'NEW456',
            expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
        })
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Get new code' })) })
        await act(async () => { resolveOld(status('paired', [3])) })

        expect(SensorService.getAllSensors).not.toHaveBeenCalled()
        expect(screen.getByText(WAITING)).toBeInTheDocument()
    })

    it('says the device is connecting when the poll says provisioned', async () => {
        await startPairing()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('provisioned'))
        await advance(3000)

        expect(screen.getByText('Your device got the code and is connecting to your account…')).toBeInTheDocument()
        expect(screen.queryByText(WAITING)).not.toBeInTheDocument()
    })

    it('keeps waiting quietly on a 404 or a network error before the code expires', async () => {
        vi.mocked(PairingService.getStatus).mockResolvedValueOnce(null)
        await startPairing()
        vi.mocked(PairingService.getStatus).mockRejectedValueOnce(new Error('Network Error'))
        await advance(3000)

        expect(calls()).toBe(2)
        expect(screen.getByText(WAITING)).toBeInTheDocument()
        expect(toastSpies.error).not.toHaveBeenCalled()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired', [3]))
        await advance(3000)
        expectNamingSensor('Sensor 3')
    })

    it('keeps checking after the code expires and advances when the poll says paired', async () => {
        expiresInMs = 10_000
        await startPairing()
        await advance(10_500)

        expect(screen.getByText(CHECKING)).toBeInTheDocument()
        expect(screen.queryByText(EXPIRED)).not.toBeInTheDocument()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired', [3]))
        await advance(3000)
        expectNamingSensor('Sensor 3')
    })

    it('checks at once when the countdown reaches zero', async () => {
        expiresInMs = 10_000
        await startPairing()
        await advance(9500)
        expect(calls()).toBe(4)

        await advance(1000)
        expect(calls()).toBe(5)
    })

    it('stops polling and shows the expired state when the API says expired', async () => {
        await startPairing()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('expired'))
        await advance(3000)
        expect(screen.getByText(EXPIRED)).toBeInTheDocument()

        const before = calls()
        await advance(9000)
        expect(calls()).toBe(before)
    })

    it('stops polling on a 404 after the code expired', async () => {
        expiresInMs = 10_000
        await startPairing()
        vi.mocked(PairingService.getStatus).mockResolvedValue(null)
        await advance(10_500)

        expect(screen.getByText(EXPIRED)).toBeInTheDocument()
        const before = calls()
        await advance(9000)
        expect(calls()).toBe(before)
    })

    it('stops checking 5 minutes after the code expired', async () => {
        expiresInMs = 10_000
        await startPairing()
        await advance(10_000 + 5 * 60 * 1000 - 1000)
        expect(screen.getByText(CHECKING)).toBeInTheDocument()

        await advance(2000)
        expect(screen.getByText(EXPIRED)).toBeInTheDocument()
        const before = calls()
        await advance(9000)
        expect(calls()).toBe(before)
    })

    it('pauses while the tab is hidden and checks at once when it is visible again', async () => {
        await startPairing()
        await setVisibility('hidden')
        await advance(9000)
        expect(calls()).toBe(1)

        await setVisibility('visible')
        expect(calls()).toBe(2)
    })

    it('checks at once when the browser goes online', async () => {
        await startPairing()

        await act(async () => { window.dispatchEvent(new Event('online')) })

        expect(calls()).toBe(2)
    })

    it('does not start a check while one is still running', async () => {
        vi.mocked(PairingService.getStatus).mockImplementation(() => new Promise(() => {}))
        await startPairing()

        await advance(9000)
        await act(async () => { window.dispatchEvent(new Event('online')) })

        expect(calls()).toBe(1)
    })

    it('stops polling after leaving the pairing step or closing the wizard', async () => {
        const view = await startPairing()
        expect(calls()).toBe(1)

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Have a device code?' })) })
        await advance(9000)
        expect(calls()).toBe(1)

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Pair new device' })) })
        expect(calls()).toBe(2)

        view.unmount()
        await advance(9000)
        expect(calls()).toBe(2)
    })
})
