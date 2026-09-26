import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import InstallPrompt from '@/components/InstallPrompt'

// Locks the state machine across the react-hooks refactor, which replaced
// `useState<State>('hidden')` + a mount effect with a useSyncExternalStore
// platform read plus derived state. Pinned rules:
// - dismissed in localStorage -> nothing renders
// - already installed (standalone) -> nothing renders
// - iOS -> the Share/Add to Home Screen copy, no Install button
// - other platforms -> nothing until beforeinstallprompt fires, then Install
// - dismissing hides it and records the dismissal

const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120'

function setUserAgent(ua: string) {
    Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true })
}

function setStandalone(standalone: boolean) {
    window.matchMedia = vi.fn().mockReturnValue({
        matches: standalone,
        media: '(display-mode: standalone)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia
}

const IOS_COPY = /Add to Home Screen/
const ANDROID_COPY = /Add to your home screen for the best experience/

beforeEach(() => {
    localStorage.clear()
    setStandalone(false)
    setUserAgent(ANDROID_UA)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('InstallPrompt', () => {
    it('renders nothing once dismissed in a previous session', () => {
        localStorage.setItem('install-dismissed', '1')
        setUserAgent(IOS_UA)
        render(<InstallPrompt />)

        expect(screen.queryByText('Install Garge')).not.toBeInTheDocument()
    })

    it('renders nothing when already running standalone', () => {
        setStandalone(true)
        setUserAgent(IOS_UA)
        render(<InstallPrompt />)

        expect(screen.queryByText('Install Garge')).not.toBeInTheDocument()
    })

    it('shows the iOS instructions on iOS, with no Install button', () => {
        setUserAgent(IOS_UA)
        render(<InstallPrompt />)

        expect(screen.getByText('Install Garge')).toBeInTheDocument()
        expect(screen.getByText(IOS_COPY)).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
    })

    it('stays hidden on other platforms until beforeinstallprompt fires', () => {
        render(<InstallPrompt />)
        expect(screen.queryByText('Install Garge')).not.toBeInTheDocument()

        act(() => {
            window.dispatchEvent(new Event('beforeinstallprompt'))
        })

        expect(screen.getByText('Install Garge')).toBeInTheDocument()
        expect(screen.getByText(ANDROID_COPY)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()
    })

    it('records the dismissal and hides itself', () => {
        setUserAgent(IOS_UA)
        render(<InstallPrompt />)

        fireEvent.click(screen.getAllByRole('button')[0])

        expect(screen.queryByText('Install Garge')).not.toBeInTheDocument()
        expect(localStorage.getItem('install-dismissed')).toBe('1')
    })

    it('stays hidden for an ineligible client even if beforeinstallprompt fires', () => {
        localStorage.setItem('install-dismissed', '1')
        render(<InstallPrompt />)

        act(() => {
            window.dispatchEvent(new Event('beforeinstallprompt'))
        })

        expect(screen.queryByText('Install Garge')).not.toBeInTheDocument()
    })

    it('can come back if the browser offers the prompt again after an install', async () => {
        render(<InstallPrompt />)
        const fire = () => act(() => {
            const e = new Event('beforeinstallprompt') as Event & { prompt?: () => Promise<void> }
            e.prompt = () => Promise.resolve()
            window.dispatchEvent(e)
        })

        fire()
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Install' }))
        })
        expect(screen.queryByText('Install Garge')).not.toBeInTheDocument()

        fire()
        expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()
    })

    it('hides itself after the native install prompt is accepted', async () => {
        render(<InstallPrompt />)
        act(() => {
            const e = new Event('beforeinstallprompt') as Event & { prompt?: () => Promise<void> }
            e.prompt = () => Promise.resolve()
            window.dispatchEvent(e)
        })
        expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Install' }))
        })

        expect(screen.queryByText('Install Garge')).not.toBeInTheDocument()
    })
})
