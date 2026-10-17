import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatOrgNumber, type CompanyInfo } from '@sjolystinnovation/app-kit/api'

const { getCompanyInfo } = vi.hoisted(() => ({ getCompanyInfo: vi.fn() }))
vi.mock('@/services/companyService', () => ({ getCompanyInfo: () => getCompanyInfo() }))

import { COMPANY, getCompany } from '@/lib/company'

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

describe('COMPANY', () => {
    it('carries the registered legal name and organisation number', () => {
        expect(COMPANY.legalName).toBe('Sjølyst Innovation AS')
        expect(COMPANY.orgNumber).toBe('938 517 789')
    })
})

describe('getCompany', () => {
    it('uses what the API answers', async () => {
        getCompanyInfo.mockResolvedValue(FROM_API)

        expect(await getCompany()).toEqual(FROM_API)
    })

    it('falls back to COMPANY, without VAT, when the API cannot answer', async () => {
        getCompanyInfo.mockResolvedValue(null)

        const company = await getCompany()

        expect(company).toMatchObject({ ...COMPANY, vatRegistered: false })
    })

    it('fills fields the API left blank from COMPANY', async () => {
        getCompanyInfo.mockResolvedValue({ ...FROM_API, orgNumber: '', address: '', email: '' })

        const company = await getCompany()

        expect(company.orgNumber).toBe(COMPANY.orgNumber)
        expect(company.address).toBe(COMPANY.address)
        expect(company.email).toBe(COMPANY.email)
        expect(company.legalName).toBe('Garge Holding AS')
    })
})

describe('formatOrgNumber', () => {
    it('appends MVA when the business is VAT-registered', () => {
        expect(formatOrgNumber({ orgNumber: COMPANY.orgNumber, vatRegistered: true })).toBe('938 517 789 MVA')
    })

    it('leaves the number bare when it is not', () => {
        expect(formatOrgNumber({ orgNumber: COMPANY.orgNumber, vatRegistered: false })).toBe('938 517 789')
    })
})
