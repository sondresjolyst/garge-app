import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FieldValidationError } from '@/lib/errors'

const { push, register, signIn, getSession } = vi.hoisted(() => ({
    push: vi.fn(),
    register: vi.fn(),
    signIn: vi.fn(),
    getSession: vi.fn(() => Promise.resolve(null)),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next-auth/react', () => ({ signIn, getSession }))
vi.mock('@/services/userService', () => ({ default: { register } }))

// next/image and next/link render fine in jsdom but mock them lean to avoid
// optimization/runtime noise.
vi.mock('next/image', () => ({ default: (props: Record<string, unknown>) => <img alt={String(props.alt ?? '')} /> }))
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }))

import Register from '@/app/(auth)/register/page'

beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockResolvedValue(null)
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
        expect(screen.getByText('Contain at least one number.')).toBeInTheDocument()
        expect(screen.getByText('Contain at least one uppercase letter.')).toBeInTheDocument()

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

describe('Register — typed error surfacing on submit', () => {
    /** Fills the form with valid values and ticks both required consent boxes. */
    function fillValidForm() {
        fireEvent.change(screen.getByPlaceholderText('username'), { target: { value: 'ada' } })
        fireEvent.change(screen.getByPlaceholderText('First'), { target: { value: 'Ada' } })
        fireEvent.change(screen.getByPlaceholderText('Last'), { target: { value: 'Lovelace' } })
        fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'ada@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Sup3r!secret' } })
        const [age, terms] = screen.getAllByRole('checkbox')
        fireEvent.click(age)
        fireEvent.click(terms)
    }

    it('renders per-field errors from a FieldValidationError, not a raw JSON string', async () => {
        register.mockRejectedValueOnce(
            new FieldValidationError({
                email: ['Email already taken.'],
                userName: ['Username already taken.'],
            })
        )
        render(<Register />)
        fillValidForm()

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
        expect(signIn).not.toHaveBeenCalled()
    })

    it('shows a generic alert message when a plain Error is thrown', async () => {
        register.mockRejectedValueOnce(new Error('Service unavailable'))
        render(<Register />)
        fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() =>
            expect(screen.getByText('Service unavailable')).toBeInTheDocument()
        )
    })

    it('signs in after a successful registration', async () => {
        register.mockResolvedValueOnce({ message: 'ok' })
        signIn.mockResolvedValueOnce({ ok: true })
        render(<Register />)
        fillValidForm()

        fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

        await waitFor(() => expect(register).toHaveBeenCalledTimes(1))
        await waitFor(() =>
            expect(signIn).toHaveBeenCalledWith('credentials', {
                redirect: true,
                email: 'ada@example.com',
                password: 'Sup3r!secret',
            })
        )
    })
})
