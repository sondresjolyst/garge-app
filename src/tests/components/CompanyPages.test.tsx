import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { CompanyInfo } from '@sjolystinnovation/app-kit/api'

const { getCompanyInfo } = vi.hoisted(() => ({ getCompanyInfo: vi.fn() }))
vi.mock('@/services/companyService', () => ({ getCompanyInfo: () => getCompanyInfo() }))
vi.mock('next/image', () => ({ default: () => null }))

import Footer from '@/app/footer'
import TermsPage from '@/app/terms/page'
import ContactPage from '@/app/contact/page'

const FROM_API: CompanyInfo = {
    name: 'Garge',
    legalName: 'Garge Holding AS',
    orgNumber: '923 202 374',
    vatRegistered: true,
    address: 'Storgata 1, 0155 Oslo',
    streetAddress: 'Storgata 1',
    postalCode: '0155',
    addressLocality: 'Oslo',
    addressRegion: 'Oslo',
    email: 'hei@garge.no',
    phone: '+47 400 00 000',
}

beforeEach(() => getCompanyInfo.mockReset())

describe('Footer', () => {
    it('shows the legal name and the org number with MVA from the API', async () => {
        getCompanyInfo.mockResolvedValue(FROM_API)
        render(await Footer())

        expect(screen.getByText('Garge Holding AS')).toBeInTheDocument()
        expect(screen.getByText(/Org\. nr\. 923 202 374 MVA/)).toBeInTheDocument()
    })

    it('still renders the built-in details when the API is down', async () => {
        getCompanyInfo.mockResolvedValue(null)
        render(await Footer())

        expect(screen.getByText('Sjølyst Innovation AS')).toBeInTheDocument()
        expect(screen.getByText(/Org\. nr\. 938 517 789$/)).toBeInTheDocument()
    })
})

describe('TermsPage', () => {
    it('names the seller from the API', async () => {
        getCompanyInfo.mockResolvedValue(FROM_API)
        render(await TermsPage())

        expect(screen.getByText('Company name:').parentElement).toHaveTextContent('Company name: Garge Holding AS')
        expect(screen.getByText('Organisation number:').parentElement).toHaveTextContent('Organisation number: 923 202 374 MVA')
        expect(screen.getByText('Address:').parentElement).toHaveTextContent('Address: Storgata 1, 0155 Oslo')
        expect(screen.getByText('Email:').parentElement).toHaveTextContent('Email: hei@garge.no')
    })
})

describe('ContactPage', () => {
    it('links the public email', async () => {
        getCompanyInfo.mockResolvedValue(FROM_API)
        render(await ContactPage())

        expect(screen.getByRole('link', { name: 'hei@garge.no' })).toHaveAttribute('href', 'mailto:hei@garge.no')
    })
})
