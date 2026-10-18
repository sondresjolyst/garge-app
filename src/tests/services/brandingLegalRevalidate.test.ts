import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axiosSpies } from '@/tests/axiosMock'

const { revalidateTarget } = vi.hoisted(() => ({ revalidateTarget: vi.fn() }))
vi.mock('@/lib/cacheTags', async (original) => ({
    ...(await original<typeof import('@/lib/cacheTags')>()),
    revalidateTarget,
}))
vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock())

import BrandingService from '@/services/brandingService'
import LegalService from '@/services/legalService'
import AdminService, { type SiteSettings } from '@/services/adminService'

beforeEach(() => {
    revalidateTarget.mockReset().mockResolvedValue(undefined)
    axiosSpies.put.mockReset().mockResolvedValue({ data: {} })
})

const COMPANY: SiteSettings = {
    contactRecipientEmail: 'post@garge.no',
    companyName: 'Garge',
    companyLegalName: '',
    orgNumber: '938 517 789',
    vatRegistered: false,
    streetAddress: 'Mårvegen 21a',
    postalCode: '4347',
    addressLocality: 'Lye',
    addressRegion: '',
    publicEmail: 'hei@garge.no',
    publicPhone: '',
}

describe('admin saves purge the public pages', () => {
    it('a branding save purges the branding target', async () => {
        await BrandingService.update(new FormData())

        expect(revalidateTarget).toHaveBeenCalledWith('branding')
    })

    it('a legal page save purges the legal target', async () => {
        await LegalService.save({ key: 'terms', locale: 'en', title: 'Terms of Service', bodyMarkdown: '## 1.' })

        expect(axiosSpies.put).toHaveBeenCalledWith('/content/legal/terms/en', { title: 'Terms of Service', bodyMarkdown: '## 1.' })
        expect(revalidateTarget).toHaveBeenCalledWith('legal')
    })

    it('a company details save purges the company target', async () => {
        await AdminService.updateSiteSettings(COMPANY)

        expect(axiosSpies.put).toHaveBeenCalledWith('/settings', COMPANY)
        expect(revalidateTarget).toHaveBeenCalledWith('company')
    })

    it('turning VAT on or off purges the company target', async () => {
        await AdminService.updateAppSettings({ vatEnabled: true })
        await AdminService.updateAppSettings({ vatEnabled: false })

        expect(revalidateTarget.mock.calls).toEqual([['company'], ['company']])
    })

    it('setting the VAT registration date purges the company target', async () => {
        await AdminService.updateAppSettings({ vatRegisteredFrom: '2026-10-01' })

        expect(revalidateTarget).toHaveBeenCalledWith('company')
    })

    it('a settings save that leaves VAT alone purges nothing', async () => {
        await AdminService.updateAppSettings({ cookieBannerEnabled: true })
        await AdminService.updateAppSettings({ vippsTestMode: false })

        expect(revalidateTarget).not.toHaveBeenCalled()
    })

    it('a failed save purges nothing', async () => {
        axiosSpies.put.mockRejectedValue(new Error('down'))

        await expect(AdminService.updateAppSettings({ vatEnabled: true })).rejects.toThrow()
        await expect(AdminService.updateSiteSettings(COMPANY)).rejects.toThrow()
        expect(revalidateTarget).not.toHaveBeenCalled()
    })
})
