import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPassword from '@/app/(auth)/reset-password/page'

const { resetPassword, requestPasswordReset, link } = vi.hoisted(() => ({
    resetPassword: vi.fn(),
    requestPasswordReset: vi.fn(),
    link: { search: '' },
}))

vi.mock('@/services/userService', () => ({ default: { resetPassword, requestPasswordReset } }))
vi.mock('next/image', () => ({ default: () => null }))
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(link.search) }))

const toStepTwo = async () => {
    render(<ResetPassword />)
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'a@b.no' } })
    fireEvent.submit(screen.getByPlaceholderText('you@example.com').closest('form')!)
    fireEvent.change(await screen.findByPlaceholderText('Code from email'), { target: { value: '123456' } })
}

describe('reset password page', () => {
    beforeEach(() => {
        resetPassword.mockReset().mockResolvedValue({ message: 'Password reset.' })
        requestPasswordReset.mockReset().mockResolvedValue({ message: 'sent' })
        link.search = ''
    })

    it('opens on the last step with the email and code from the emailed link', async () => {
        link.search = 'email=kari%2Btest%40example.no&code=AB12CD'
        render(<ResetPassword />)

        expect(screen.getByPlaceholderText('Code from email')).toHaveValue('AB12CD')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'Password1')
        fireEvent.submit(screen.getByPlaceholderText('••••••••').closest('form')!)

        expect(requestPasswordReset).not.toHaveBeenCalled()
        expect(resetPassword).toHaveBeenCalledWith({ email: 'kari+test@example.no', code: 'AB12CD', NewPassword: 'Password1' })
    })

    it('names each rule a new password breaks, without sending it', async () => {
        await toStepTwo()
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'PASSWORD1')
        fireEvent.submit(screen.getByPlaceholderText('••••••••').closest('form')!)

        expect(resetPassword).not.toHaveBeenCalled()
        expect(await screen.findByText(/Contain at least one lowercase letter \(a-z\)\./)).toBeInTheDocument()
    })

    it('sends a password without a special character, as the API allows', async () => {
        await toStepTwo()
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'Password1')
        fireEvent.submit(screen.getByPlaceholderText('••••••••').closest('form')!)

        expect(resetPassword).toHaveBeenCalledWith({ email: 'a@b.no', code: '123456', NewPassword: 'Password1' })
    })
})
