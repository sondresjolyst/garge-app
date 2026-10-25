import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { auth, makeSession, navigation, resetTestMocks, setSession } from '@sjolystinnovation/app-kit/testing'
import { SESSION_ERRORS } from '@sjolystinnovation/app-kit/session'
import { FieldValidationError } from '@/lib/errors'

const { register, getTermsVersion } = vi.hoisted(() => ({
    register: vi.fn(),
    getTermsVersion: vi.fn(),
}))

vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())
vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())
vi.mock('@/services/userService', () => ({ default: { register } }))
vi.mock('@/services/legalService', () => ({ getTermsVersion: () => getTermsVersion() }))

// next/image and next/link render fine in jsdom but mock them lean to avoid
// optimization/runtime noise.
vi.mock('next/image', () => ({ default: (props: Record<string, unknown>) => <img alt={String(props.alt ?? '')} /> }))
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }))

import Register from '@/app/(auth)/register/page'

// The version garge-api gives the terms page, 27 characters.
const CURRENT_VERSION = '2026-10-25T10:00:00.000000Z'
const NEW_VERSION = '2026-10-25T12:30:00.000000Z'

beforeEach(() => {
    vi.clearAllMocks()
    resetTestMocks()
    getTermsVersion.mockResolvedValue(CURRENT_VERSION)
})

describe('Register session check', () => {
    it('holds the form back while the session loads', () => {
        setSession('loading')
        render(<Register />)
        expect(screen.queryByRole('heading', { name: 'Create account' })).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    it('sends a signed-in visitor to the profile once without rendering the form', async () => {
        setSession(makeSession({ roles: [] }))
        render(<Register />)
        await waitFor(() => expect(navigation.router.replace).toHaveBeenCalledWith('/profile'))
        expect(navigation.router.replace).toHaveBeenCalledTimes(1)
        expect(navigation.router.push).not.toHaveBeenCalled()
        expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument()
    })

    it('goes to the profile once the loading session turns out signed in', () => {
        setSession('loading')
        const { rerender } = render(<Register />)
        setSession(makeSession({ roles: [] }))
        rerender(<Register />)
        expect(navigation.router.replace).toHaveBeenCalledWith('/profile')
        expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument()
    })

    it('shows the form when the session has ended', async () => {
        setSession(makeSession({ roles: [], error: SESSION_ERRORS.refreshRejected }))
        render(<Register />)
        expect(await screen.findByRole('button', { name: 'Create account' })).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    // next-auth reports a failed session read as no session.
    it('shows the form to a signed-out visitor', async () => {
        render(<Register />)
        expect(await screen.findByRole('button', { name: 'Create account' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
        expect(navigation.router.push).not.toHaveBeenCalled()
    })

    it('keeps the form when the session changes after it is shown', async () => {
        const { rerender } = render(<Register />)
        expect(await screen.findByRole('button', { name: 'Create account' })).toBeInTheDocument()
        setSession(makeSession({ roles: [] }))
        rerender(<Register />)
        expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    it('loads the terms version while the session loads', async () => {
        setSession('loading')
        const { rerender } = render(<Register />)
        await waitFor(() => expect(getTermsVersion).toHaveBeenCalled())
        setSession(null)
        rerender(<Register />)
        expect(await screen.findByRole('button', { name: 'Create account' })).toBeInTheDocument()
        expect(screen.queryByText('Loading the terms…')).not.toBeInTheDocument()
    })

    it('sends no session read of its own, the provider reads the session', async () => {
        render(<Register />)
        expect(await screen.findByRole('button', { name: 'Create account' })).toBeInTheDocument()
        expect(auth.getSession).not.toHaveBeenCalled()
    })
})

describe('Register — live client-side validation', () => {
    it('shows a password-rule error on blur before any submit', async () => {
        render(<Register />)
        const password = screen.getByPlaceholderText('••••••••')

        fireEvent.change(password, { target: { value: 'short' } })
        fireEvent.blur(password)

        // Validation feedback from the shared registerSchema appears live.
        await waitFor(() =>
            expect(screen.getByText('Be at least 8 characters long.')).toBeInTheDocument()
        )
        // It surfaces every failing rule, not just the first.
        expect(screen.getByText('Contain at least one number (0-9).')).toBeInTheDocument()
        expect(screen.getByText('Contain at least one uppercase letter (A-Z).')).toBeInTheDocument()

        // No network call yet — this is pure client-side feedback.
        expect(register).not.toHaveBeenCalled()
    })

    it('clears the error as the user types a value that satisfies the rules', async () => {
        render(<Register />)
        const password = screen.getByPlaceholderText('••••••••')

        fireEvent.change(password, { target: { value: 'short' } })
        fireEvent.blur(password)
        await waitFor(() =>
            expect(screen.getByText('Be at least 8 characters long.')).toBeInTheDocument()
        )

        // Once touched, onChange re-validates live.
        fireEvent.change(password, { target: { value: 'Sup3r!secret' } })
        await waitFor(() =>
            expect(screen.queryByText('Be at least 8 characters long.')).not.toBeInTheDocument()
        )
    })

    it('validates email live on blur', async () => {
        render(<Register />)
        const email = screen.getByPlaceholderText('you@example.com')
        fireEvent.change(email, { target: { value: 'nope' } })
        fireEvent.blur(email)
        await waitFor(() =>
            expect(screen.getByText('Please enter a valid email.')).toBeInTheDocument()
        )
    })
})

/** Waits for the terms version, fills the form with valid values and ticks both required consent boxes. */
async function fillValidForm() {
    await waitFor(() => expect(screen.queryByText('Loading the terms…')).not.toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText('username'), { target: { value: 'ada' } })
    fireEvent.change(screen.getByPlaceholderText('First'), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByPlaceholderText('Last'), { target: { value: 'Lovelace' } })
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Sup3r!secret' } })
    const [age, terms] = screen.getAllByRole('checkbox')
    fireEvent.click(age)
    fireEvent.click(terms)
}

describe('Register — typed error surfacing on submit', () => {
    it('renders per-field errors from a FieldValidationError, not a raw JSON string', async () => {
        register.mockRejectedValueOnce(
            new FieldValidationError({
                email: ['Email already taken.'],
                userName: ['Username already taken.'],
            })
        )
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() => expect(register).toHaveBeenCalledTimes(1))

        // Field-level messages render under their inputs.
        await waitFor(() => {
            expect(screen.getByText('Email already taken.')).toBeInTheDocument()
            expect(screen.getByText('Username already taken.')).toBeInTheDocument()
        })

        // The error must not have leaked as a serialized object/JSON anywhere.
        expect(screen.queryByText(/fieldErrors/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument()
        expect(screen.queryByText(/\{.*email.*\}/)).not.toBeInTheDocument()

        // signIn is not attempted when registration fails.
        expect(auth.signIn).not.toHaveBeenCalled()
    })

    it.each([
        ['termsVersion', 'The terms version is required.'],
        ['acceptTerms', 'You must accept the terms.'],
        ['confirmAge16Plus', 'You must be 16 or older.'],
        ['somethingNew', 'Something new is wrong.'],
    ])('shows a field error for %s, which has no input, in the alert', async (field, message) => {
        register.mockRejectedValueOnce(new FieldValidationError({ email: ['Email already taken.'], [field]: [message] }))
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        expect(await screen.findByText(message)).toBeInTheDocument()
        expect(screen.getByText('Email already taken.')).toBeInTheDocument()
    })

    it('clears the alert when every field error has its own input', async () => {
        register
            .mockRejectedValueOnce(new FieldValidationError({ acceptTerms: ['You must accept the terms.'] }))
            .mockRejectedValueOnce(new FieldValidationError({ email: ['Email already taken.'] }))
        render(<Register />)
        await fillValidForm()
        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
        expect(await screen.findByText('You must accept the terms.')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
        expect(await screen.findByText('Email already taken.')).toBeInTheDocument()
        expect(screen.queryByText('You must accept the terms.')).not.toBeInTheDocument()
    })

    it('shows a generic alert message when a plain Error is thrown', async () => {
        register.mockRejectedValueOnce(new Error('Service unavailable'))
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() =>
            expect(screen.getByText('Service unavailable')).toBeInTheDocument()
        )
    })

    it('signs in after a successful registration and goes to the profile once', async () => {
        register.mockResolvedValueOnce({ message: 'ok' })
        auth.signIn.mockResolvedValueOnce({ ok: true, error: null, status: 200, url: 'http://localhost:3000/register' })
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith('/profile'))
        expect(auth.signIn).toHaveBeenCalledWith('credentials', {
            redirect: false,
            email: 'ada@example.com',
            password: 'Sup3r!secret',
        })
        expect(auth.signIn).toHaveBeenCalledTimes(1)
        expect(navigation.router.push).toHaveBeenCalledTimes(1)
        expect(navigation.router.refresh).toHaveBeenCalledTimes(1)
        expect(navigation.router.replace).not.toHaveBeenCalled()
    })

    it('does not redirect again when the session turns signed in after the sign-in', async () => {
        register.mockResolvedValueOnce({ message: 'ok' })
        auth.signIn.mockResolvedValueOnce({ ok: true, error: null, status: 200, url: 'http://localhost:3000/register' })
        const { rerender } = render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
        await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith('/profile'))
        setSession(makeSession({ roles: [] }))
        rerender(<Register />)

        expect(navigation.router.replace).not.toHaveBeenCalled()
        expect(navigation.router.push).toHaveBeenCalledTimes(1)
    })

    const csrfRefusal = { ok: true, error: null, status: 200, url: 'http://localhost:3000/api/auth/signin?csrf=true' }
    const signedIn = { ok: true, error: null, status: 200, url: 'http://localhost:3000/register' }

    it('sends the user to sign in by hand when the sign-in after registering is refused for wrong credentials', async () => {
        register.mockResolvedValueOnce({ message: 'ok' })
        auth.signIn.mockResolvedValueOnce({ ok: false, error: 'CredentialsSignin', status: 401, url: null })
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith('/login'))
        expect(auth.signIn).toHaveBeenCalledTimes(1)
        expect(navigation.router.push).toHaveBeenCalledTimes(1)
        expect(navigation.router.refresh).not.toHaveBeenCalled()
    })

    it('sends the user to sign in by hand when the sign-in gives no answer', async () => {
        register.mockResolvedValueOnce({ message: 'ok' })
        auth.signIn.mockResolvedValueOnce(undefined)
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith('/login'))
        expect(auth.signIn).toHaveBeenCalledTimes(1)
        expect(navigation.router.push).toHaveBeenCalledTimes(1)
        expect(navigation.router.refresh).not.toHaveBeenCalled()
    })

    it('sends the user to sign in by hand when the sign-in is refused for CSRF twice', async () => {
        register.mockResolvedValueOnce({ message: 'ok' })
        auth.signIn.mockResolvedValueOnce(csrfRefusal).mockResolvedValueOnce(csrfRefusal)
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith('/login'))
        expect(auth.signIn).toHaveBeenCalledTimes(2)
        expect(navigation.router.push).toHaveBeenCalledTimes(1)
        expect(navigation.router.refresh).not.toHaveBeenCalled()
    })

    it('retries a sign-in refused for CSRF once and goes to the profile when the retry works', async () => {
        register.mockResolvedValueOnce({ message: 'ok' })
        auth.signIn.mockResolvedValueOnce(csrfRefusal).mockResolvedValueOnce(signedIn)
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() => expect(navigation.router.push).toHaveBeenCalledWith('/profile'))
        expect(auth.signIn).toHaveBeenCalledTimes(2)
        expect(auth.signIn).toHaveBeenNthCalledWith(2, 'credentials', {
            redirect: false,
            email: 'ada@example.com',
            password: 'Sup3r!secret',
        })
        expect(navigation.router.push).toHaveBeenCalledTimes(1)
        expect(navigation.router.refresh).toHaveBeenCalledTimes(1)
    })
})

describe('Register terms version', () => {
    const termsChanged = () => Object.assign(
        new Error('The terms have changed. Read the new terms and accept them again.'),
        { errorCode: 'termsChanged' },
    )

    it('sends the version of the current terms page', async () => {
        register.mockResolvedValueOnce({ message: 'ok' })
        auth.signIn.mockResolvedValueOnce({ ok: true })
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() => expect(register).toHaveBeenCalledWith(expect.objectContaining({
            acceptTerms: true,
            termsVersion: CURRENT_VERSION,
        })))
    })

    it('keeps the submit disabled with a reason until the version has loaded', async () => {
        let resolve: (v: string) => void = () => undefined
        getTermsVersion.mockReturnValueOnce(new Promise<string>(r => { resolve = r }))
        render(<Register />)
        const [age, terms] = screen.getAllByRole('checkbox')
        fireEvent.click(age)
        fireEvent.click(terms)

        const button = screen.getByRole('button', { name: 'Create account' })
        expect(button).toBeDisabled()
        expect(button).toHaveAccessibleDescription('Loading the terms…')

        resolve(CURRENT_VERSION)
        await waitFor(() => expect(button).toBeEnabled())
        expect(screen.queryByText('Loading the terms…')).not.toBeInTheDocument()
    })

    it('says when the terms could not load and tries again on request', async () => {
        getTermsVersion.mockRejectedValueOnce(new Error('Failed to load the terms'))
        render(<Register />)
        const [age, terms] = screen.getAllByRole('checkbox')
        fireEvent.click(age)
        fireEvent.click(terms)

        expect(await screen.findByText(/Could not load the terms/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled()

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled())
        expect(getTermsVersion).toHaveBeenCalledTimes(2)
    })

    it('on termsChanged unticks the terms, says so and sends the new version next time', async () => {
        register.mockRejectedValueOnce(termsChanged()).mockResolvedValueOnce({ message: 'ok' })
        auth.signIn.mockResolvedValueOnce({ ok: true })
        render(<Register />)
        await fillValidForm()
        getTermsVersion.mockResolvedValueOnce(NEW_VERSION)

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        expect(await screen.findByText('The terms have changed. Read the new terms and accept them again.')).toBeInTheDocument()
        const terms = screen.getAllByRole('checkbox')[1]
        expect(terms).not.toBeChecked()
        expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled()
        await waitFor(() => expect(getTermsVersion).toHaveBeenCalledTimes(2))
        await waitFor(() => expect(screen.queryByText('Loading the terms…')).not.toBeInTheDocument())
        expect(auth.signIn).not.toHaveBeenCalled()

        fireEvent.click(terms)
        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
        await waitFor(() => expect(register).toHaveBeenCalledTimes(2))
        expect(register.mock.calls[0][0].termsVersion).toBe(CURRENT_VERSION)
        expect(register.mock.calls[1][0].termsVersion).toBe(NEW_VERSION)
    })

    it('sends what the legal service gives when there is no terms page', async () => {
        getTermsVersion.mockResolvedValueOnce('no-terms-page')
        register.mockResolvedValueOnce({ message: 'ok' })
        auth.signIn.mockResolvedValueOnce({ ok: true })
        render(<Register />)
        await fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
        await waitFor(() => expect(register).toHaveBeenCalledWith(expect.objectContaining({ termsVersion: 'no-terms-page' })))
    })
})
