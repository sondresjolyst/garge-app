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

let visibility: DocumentVisibilityState = 'visible'
let deviceCreated: ((e: DeviceCreatedEvent) => void) | undefined

const advance = async (ms: number) => {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

const setVisibility = async (value: DocumentVisibilityState) => {
    visibility = value
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
}

/** Renders the wizard and gets a pairing code, so the pairing step is waiting. */
const startPairing = async () => {
    const view = render(<SetupWizard onClose={vi.fn()} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Get pairing code' })) })
    expect(screen.getByText('Waiting for your device…')).toBeInTheDocument()
    return view
}

beforeEach(() => {
    resetTestMocks()
    vi.useFakeTimers()
    visibility = 'visible'
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
    deviceCreated = undefined
    vi.mocked(useDeviceStream).mockReset()
    vi.mocked(useDeviceStream).mockImplementation(handlers => { deviceCreated = handlers.onDeviceCreated })
    vi.mocked(PairingService.mintToken).mockReset()
    vi.mocked(PairingService.mintToken).mockImplementation(() => Promise.resolve({
        token: 'ABC123',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
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
    it('advances to naming the lowest sensor id when the poll says paired', async () => {
        await startPairing()
        await advance(3000)
        expect(PairingService.getStatus).toHaveBeenCalledWith('ABC123')
        expect(screen.getByText('Waiting for your device…')).toBeInTheDocument()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired', [3, 8], [1]))
        await advance(3000)

        expect(screen.getByRole('heading', { name: 'Name your sensor' })).toBeInTheDocument()
        expect(screen.getByRole('textbox')).toHaveValue('Sensor 3')
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

    it('says the device belongs to another account when paired with no devices', async () => {
        await startPairing()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired'))
        await advance(3000)

        expect(screen.getByRole('alert')).toHaveTextContent('This device belongs to another account.')
        expect(screen.queryByText('Waiting for your device…')).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'How to move a device to a new owner' })).toHaveAttribute('href', '/help#selling')
        expect(screen.getByRole('button', { name: 'Get new code' })).toBeInTheDocument()

        const calls = vi.mocked(PairingService.getStatus).mock.calls.length
        await advance(9000)
        expect(PairingService.getStatus).toHaveBeenCalledTimes(calls)

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Get new code' })) })
        expect(screen.getByText('Waiting for your device…')).toBeInTheDocument()
    })

    it('says the device belongs to another account when the poll says ownedByOther', async () => {
        await startPairing()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('ownedByOther'))
        await advance(3000)

        expect(screen.getByRole('alert')).toHaveTextContent('This device belongs to another account.')
        expect(screen.queryByText('Waiting for your device…')).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'How to move a device to a new owner' })).toHaveAttribute('href', '/help#selling')

        const calls = vi.mocked(PairingService.getStatus).mock.calls.length
        await advance(9000)
        expect(PairingService.getStatus).toHaveBeenCalledTimes(calls)
    })

    it('says the device is connecting when the poll says provisioned', async () => {
        await startPairing()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('provisioned'))
        await advance(3000)

        expect(screen.getByText('Your device got the code and is connecting to your account…')).toBeInTheDocument()
        expect(screen.queryByText('Waiting for your device…')).not.toBeInTheDocument()
    })

    it('keeps waiting quietly on a 404 or a network error', async () => {
        await startPairing()

        vi.mocked(PairingService.getStatus).mockResolvedValueOnce(null)
        await advance(3000)
        vi.mocked(PairingService.getStatus).mockRejectedValueOnce(new Error('Network Error'))
        await advance(3000)

        expect(PairingService.getStatus).toHaveBeenCalledTimes(2)
        expect(screen.getByText('Waiting for your device…')).toBeInTheDocument()
        expect(toastSpies.error).not.toHaveBeenCalled()

        vi.mocked(PairingService.getStatus).mockResolvedValue(status('paired', [3]))
        await advance(3000)
        expect(screen.getByRole('heading', { name: 'Name your sensor' })).toBeInTheDocument()
    })

    it('pauses while the tab is hidden and checks at once when it is visible again', async () => {
        await startPairing()
        await setVisibility('hidden')
        await advance(9000)
        expect(PairingService.getStatus).not.toHaveBeenCalled()

        await setVisibility('visible')
        expect(PairingService.getStatus).toHaveBeenCalledTimes(1)
    })

    it('checks at once when the browser goes online', async () => {
        await startPairing()

        await act(async () => { window.dispatchEvent(new Event('online')) })

        expect(PairingService.getStatus).toHaveBeenCalledTimes(1)
    })

    it('does not start a check while one is still running', async () => {
        vi.mocked(PairingService.getStatus).mockImplementation(() => new Promise(() => {}))
        await startPairing()

        await advance(9000)
        await act(async () => { window.dispatchEvent(new Event('online')) })

        expect(PairingService.getStatus).toHaveBeenCalledTimes(1)
    })

    it('stops polling after leaving the pairing step or closing the wizard', async () => {
        const view = await startPairing()
        await advance(3000)
        expect(PairingService.getStatus).toHaveBeenCalledTimes(1)

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Have a device code?' })) })
        await advance(9000)
        expect(PairingService.getStatus).toHaveBeenCalledTimes(1)

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Pair new device' })) })
        await advance(3000)
        expect(PairingService.getStatus).toHaveBeenCalledTimes(2)

        view.unmount()
        await advance(9000)
        expect(PairingService.getStatus).toHaveBeenCalledTimes(2)
    })
})
