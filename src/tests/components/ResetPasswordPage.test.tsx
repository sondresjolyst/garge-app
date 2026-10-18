import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { navigation, resetTestMocks } from '@sjolystinnovation/app-kit/testing'
import ResetPassword from '@/app/(auth)/reset-password/page'

const { resetPassword, requestPasswordReset } = vi.hoisted(() => ({
    resetPassword: vi.fn(),
    requestPasswordReset: vi.fn(),
}))

vi.mock('@/services/userService', () => ({ default: { resetPassword, requestPasswordReset } }))
vi.mock('next/image', () => ({ default: () => null }))
vi.mock('next/navigation', async () => (await import('@sjolystinnovation/app-kit/testing')).nextNavigationMock())
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))

const PASSWORD_RULES = 'Use at least 8 characters, with at least one lowercase and one uppercase letter from A to Z and one digit from 0 to 9.'

const toStepTwo = async () => {
    render(<ResetPassword />)
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'a@b.no' } })
    fireEvent.submit(screen.getByLabelText(/^Email/).closest('form')!)
    fireEvent.change(await screen.findByLabelText(/^Reset code/), { target: { value: '123456' } })
}

describe('reset password page', () => {
    beforeEach(() => {
        resetTestMocks()
        resetPassword.mockReset().mockResolvedValue({ message: 'Password reset.' })
        requestPasswordReset.mockReset().mockResolvedValue({ message: 'sent' })
    })

    it('opens on the last step with the email and code from the emailed link', async () => {
        navigation.searchParams = new URLSearchParams('email=kari%2Btest%40example.no&code=AB12CD')
        render(<ResetPassword />)

        expect(screen.getByLabelText(/^Reset code/)).toHaveValue('AB12CD')
        await userEvent.type(screen.getByLabelText(/^New password/), 'Password1')
        fireEvent.submit(screen.getByLabelText(/^New password/).closest('form')!)

        expect(requestPasswordReset).not.toHaveBeenCalled()
        expect(resetPassword).toHaveBeenCalledWith({ email: 'kari+test@example.no', code: 'AB12CD', newPassword: 'Password1' })
    })

    it('says what to enter on the first step', () => {
        render(<ResetPassword />)

        expect(screen.getByText('Enter your email address and we will send you a code.')).toBeInTheDocument()
    })

    it('states the password rules under the new password field', async () => {
        await toStepTwo()

        expect(screen.getByText(PASSWORD_RULES)).toBeInTheDocument()
    })

    it('refuses a password that breaks a rule with the rules, without sending it', async () => {
        await toStepTwo()
        await userEvent.type(screen.getByLabelText(/^New password/), 'PASSWORD1')
        fireEvent.submit(screen.getByLabelText(/^New password/).closest('form')!)

        expect(resetPassword).not.toHaveBeenCalled()
        expect(await screen.findByText(`The password does not meet the requirements. ${PASSWORD_RULES}`)).toBeInTheDocument()
    })

    it('says the password changed once the reset is done', async () => {
        await toStepTwo()
        await userEvent.type(screen.getByLabelText(/^New password/), 'Password1')
        fireEvent.submit(screen.getByLabelText(/^New password/).closest('form')!)

        expect(await screen.findByText('Your password has been changed. You can sign in now.')).toBeInTheDocument()
    })

    // garge-app#592: the API's password errors show under the field, not as one message above the form.
    it('shows the API refusal of a new password under the field', async () => {
        resetPassword.mockRejectedValue(Object.assign(new Error('Password too weak.'), {
            fieldErrors: { newPassword: ['Passwords must be at least 8 characters.'] },
            fieldErrorDetails: { newPassword: [{ message: 'Passwords must be at least 8 characters.', code: 'passwordTooShort', limit: 8 }] },
        }))
        await toStepTwo()
        await userEvent.type(screen.getByLabelText(/^New password/), 'Password1')
        fireEvent.submit(screen.getByLabelText(/^New password/).closest('form')!)

        const field = screen.getByLabelText(/^New password/)
        await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'))
        expect(screen.queryByText('Password too weak.')).not.toBeInTheDocument()
    })

    it('shows its own text for a wrong reset code', async () => {
        resetPassword.mockRejectedValue(Object.assign(new Error('Invalid or expired reset code.'), { errorCode: 'invalidResetCode' }))
        await toStepTwo()
        await userEvent.type(screen.getByLabelText(/^New password/), 'Password1')
        fireEvent.submit(screen.getByLabelText(/^New password/).closest('form')!)

        expect(await screen.findByText('Invalid or expired reset code.')).toBeInTheDocument()
    })

    it('sends a password without a special character, as the API allows', async () => {
        await toStepTwo()
        await userEvent.type(screen.getByLabelText(/^New password/), 'Password1')
        fireEvent.submit(screen.getByLabelText(/^New password/).closest('form')!)

        expect(resetPassword).toHaveBeenCalledWith({ email: 'a@b.no', code: '123456', newPassword: 'Password1' })
    })
})
