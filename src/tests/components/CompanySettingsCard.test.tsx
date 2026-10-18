import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { resetTestMocks, toastSpies } from '@sjolystinnovation/app-kit/testing'
import type { SiteSettings } from '@/services/adminService'

// What app-kit's request throws for a validation problem: one message, with the field messages kept.
const validationFailure = (fieldErrors: Record<string, string[]>) =>
    Object.assign(new Error('One or more validation errors occurred.'), {
        fieldErrors,
        fieldErrorDetails: Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v.map(message => ({ message }))])),
    })

const { getSiteSettings, updateSiteSettings } = vi.hoisted(() => ({
    getSiteSettings: vi.fn(),
    updateSiteSettings: vi.fn(),
}))

vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@/services/adminService', () => ({
    default: {
        getSiteSettings: () => getSiteSettings(),
        updateSiteSettings: (...a: unknown[]) => updateSiteSettings(...a),
    },
}))

import CompanySettingsCard from '@/components/admin/CompanySettingsCard'

const STORED: SiteSettings = {
    contactRecipientEmail: 'post@garge.no',
    companyName: 'Garge',
    companyLegalName: 'Sjølyst Innovation AS',
    orgNumber: '938 517 789',
    vatRegistered: false,
    streetAddress: 'Mårvegen 21a',
    postalCode: '4347',
    addressLocality: 'Lye',
    addressRegion: 'Rogaland',
    publicEmail: 'hei@garge.no',
    publicPhone: '+47 400 00 000',
}

beforeEach(resetTestMocks)
beforeEach(() => {
    vi.clearAllMocks()
    getSiteSettings.mockResolvedValue(STORED)
    updateSiteSettings.mockImplementation((s: SiteSettings) => Promise.resolve(s))
})

const field = (label: RegExp) => screen.getByLabelText(label)

describe('CompanySettingsCard', () => {
    it('shows every company field as stored', async () => {
        render(<CompanySettingsCard />)

        expect(await screen.findByLabelText(/Company name/)).toHaveValue('Garge')
        expect(field(/Legal name/)).toHaveValue('Sjølyst Innovation AS')
        expect(field(/Organisation number/)).toHaveValue('938 517 789')
        expect(field(/Street address/)).toHaveValue('Mårvegen 21a')
        expect(field(/Postal code/)).toHaveValue('4347')
        expect(field(/Place/)).toHaveValue('Lye')
        expect(field(/County/)).toHaveValue('Rogaland')
        expect(field(/Public email/)).toHaveValue('hei@garge.no')
        expect(field(/Public phone/)).toHaveValue('+47 400 00 000')
        expect(field(/Contact form recipient/)).toHaveValue('post@garge.no')
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('saves the full body with the VAT registration the API holds now', async () => {
        render(<CompanySettingsCard />)
        fireEvent.change(await screen.findByLabelText(/Public phone/), { target: { value: ' +47 900 00 000 ' } })
        // VAT was turned on in Site Settings after the card loaded.
        getSiteSettings.mockResolvedValue({ ...STORED, vatRegistered: true })

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(updateSiteSettings).toHaveBeenCalledWith({ ...STORED, publicPhone: '+47 900 00 000', vatRegistered: true }))
        expect(toastSpies.success).toHaveBeenCalledWith('Company details saved')
        expect(field(/Public phone/)).toHaveValue('+47 900 00 000')
    })

    it('shows the API validation problems beside their fields', async () => {
        updateSiteSettings.mockRejectedValue(validationFailure({
            orgNumber: ['An organisation number is required when the business is VAT registered.'],
        }))
        render(<CompanySettingsCard />)
        fireEvent.change(await screen.findByLabelText(/Organisation number/), { target: { value: '' } })

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        expect(await screen.findByText('An organisation number is required when the business is VAT registered.')).toBeInTheDocument()
        expect(field(/Organisation number/)).toHaveAttribute('aria-invalid', 'true')
        expect(toastSpies.error).toHaveBeenCalledWith('Check the highlighted fields')
    })

    it('says a problem on a field it does not show', async () => {
        updateSiteSettings.mockRejectedValue(validationFailure({ vatRegistered: ['Not allowed.'] }))
        render(<CompanySettingsCard />)
        fireEvent.change(await screen.findByLabelText(/County/), { target: { value: 'Agder' } })

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('Not allowed.'))
    })

    it('checks the form before it calls the API', async () => {
        render(<CompanySettingsCard />)
        fireEvent.change(await screen.findByLabelText(/Postal code/), { target: { value: '43' } })
        fireEvent.change(field(/Public email/), { target: { value: 'not an email' } })

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        expect(await screen.findByText('A Norwegian postal code is four digits.')).toBeInTheDocument()
        expect(screen.getByText('Not a valid email address.')).toBeInTheDocument()
        expect(updateSiteSettings).not.toHaveBeenCalled()
    })

    it('clears a field error once the field changes', async () => {
        render(<CompanySettingsCard />)
        fireEvent.change(await screen.findByLabelText(/Company name/), { target: { value: '' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        expect(await screen.findByText('Required.')).toBeInTheDocument()

        fireEvent.change(field(/Company name/), { target: { value: 'Garge' } })

        expect(screen.queryByText('Required.')).not.toBeInTheDocument()
    })

    it('shows the message of a failed save', async () => {
        updateSiteSettings.mockRejectedValue(new Error('Not authorized.'))
        render(<CompanySettingsCard />)
        fireEvent.change(await screen.findByLabelText(/County/), { target: { value: 'Agder' } })

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('Not authorized.'))
    })

    it('shows no form when the details cannot load, so a save cannot blank them', async () => {
        getSiteSettings.mockRejectedValue(new Error('Failed to load settings'))
        render(<CompanySettingsCard />)

        expect(await screen.findByText('Could not load the company details.')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
        expect(toastSpies.error).toHaveBeenCalledWith('Failed to load settings')
    })
})
