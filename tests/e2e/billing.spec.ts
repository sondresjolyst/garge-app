import { test, expect, Page } from '@playwright/test'
import { mockSession, mockApi, regularUser } from './helpers/auth'

const primarySub = {
    id: 1, productName: 'Garge Basic', productType: 'Primary',
    status: 'Active', priceInOre: 29900, interval: 'Monthly',
    isTest: false,
    startDate: '2026-01-01', nextChargeDate: '2026-06-01',
}
const addonSub = {
    id: 2, productName: 'Extra Sensor', productType: 'AddOn',
    status: 'Active', priceInOre: 4900, interval: 'Monthly',
    isTest: false,
    startDate: '2026-01-01', nextChargeDate: '2026-06-01',
}
const pendingSub = {
    id: 3, productName: 'Garge Basic', productType: 'Primary',
    status: 'Pending', priceInOre: 29900, interval: 'Monthly',
    isTest: false,
    startDate: null, nextChargeDate: null,
}
const stoppedGraceSub = {
    id: 4, productName: 'Garge Basic', productType: 'Primary',
    status: 'Stopped', priceInOre: 29900, interval: 'Monthly',
    isTest: false,
    startDate: '2026-01-01', nextChargeDate: '2099-12-31',
}
const testSub = {
    id: 5, productName: 'Garge Test', productType: 'Primary',
    status: 'Active', priceInOre: 29900, interval: 'Monthly',
    isTest: true,
    startDate: '2026-01-01', nextChargeDate: '2026-06-01',
}

const paidOrder = {
    id: 101, userId: 'user-1', vippsOrderId: '101',
    status: 'Paid', totalInOre: 50000,
    shippingAddress: 'Testgata 1', shippedAt: '2026-04-01',
    hasInvoice: true, isTest: false,
    items: [{ id: 1, shopItemId: 1, shopItemName: 'Sensor', quantity: 1, priceAtPurchaseInOre: 50000 }],
    createdAt: '2026-03-30', updatedAt: '2026-04-01',
}

async function setup(page: Page, subscriptions: unknown[] = [], orders: unknown[] = [], vatEnabled = false) {
    await mockSession(page, regularUser)
    await mockApi(page, '/admin/settings', { vatEnabled, vippsTestMode: false })
    await mockApi(page, '/subscriptions/my', subscriptions)
    await mockApi(page, '/shop/orders/my', orders)
    await page.goto('/profile/billing')
}

test.describe('Billing page', () => {
    test('shows empty state when no subscriptions', async ({ page }) => {
        await setup(page, [])
        await expect(page.getByText('No active subscription.')).toBeVisible()
        await expect(page.getByRole('link', { name: /browse plans/i })).toBeVisible()
    })

    test('shows Primary subscription card', async ({ page }) => {
        await setup(page, [primarySub])
        await expect(page.getByText('Garge Basic')).toBeVisible()
        await expect(page.getByText('Primary', { exact: true })).toBeVisible()
    })

    test('shows Add-on badge for AddOn subscription', async ({ page }) => {
        await setup(page, [addonSub])
        await expect(page.getByText('Extra Sensor')).toBeVisible()
        await expect(page.getByText('Add-on', { exact: true })).toBeVisible()
    })

    test('shows English VAT label when vatEnabled', async ({ page }) => {
        await setup(page, [primarySub], [], true)
        await expect(page.getByText(/incl\. VAT/).first()).toBeVisible()
    })

    test('cancel button opens confirmation modal', async ({ page }) => {
        await setup(page, [primarySub])
        await page.getByRole('button', { name: /^Cancel$/ }).first().click()
        await expect(page.getByRole('heading', { name: 'Cancel subscription' })).toBeVisible()
    })

    test('cancel modal shows keep-access message with date', async ({ page }) => {
        await setup(page, [primarySub])
        await page.getByRole('button', { name: /^Cancel$/ }).first().click()
        await expect(page.getByText(/you keep access until/i)).toBeVisible()
    })

    test('cancel modal warns about cascade for Primary', async ({ page }) => {
        await setup(page, [primarySub])
        await page.getByRole('button', { name: /^Cancel$/ }).first().click()
        await expect(page.getByText(/cancelling primary also cancels.*add-on/i)).toBeVisible()
    })

    test('Pending subscription shows Complete in Vipps button', async ({ page }) => {
        await setup(page, [pendingSub])
        await expect(page.getByRole('button', { name: /complete in vipps/i })).toBeVisible()
    })

    test('Stopped sub in grace shows Cancelled note', async ({ page }) => {
        await setup(page, [stoppedGraceSub])
        await expect(page.getByText(/cancelled\. you keep access until/i)).toBeVisible()
    })

    test('Test subscription shows TEST pill', async ({ page }) => {
        await setup(page, [testSub])
        await expect(page.getByTitle('Test mode')).toBeVisible()
    })

    test('Paid order shows download invoice button', async ({ page }) => {
        await setup(page, [], [paidOrder])
        await expect(page.getByRole('button', { name: /download invoice/i })).toBeVisible()
    })

    test('Order link navigates to detail page', async ({ page }) => {
        await setup(page, [], [paidOrder])
        await page.getByRole('link', { name: /order #101/i }).click()
        await expect(page).toHaveURL(/\/profile\/orders\/101/)
    })

    test('Resume Pending sub fetches confirmation URL', async ({ page }) => {
        await mockSession(page, regularUser)
        await mockApi(page, '/admin/settings', { vatEnabled: false, vippsTestMode: false })
        await mockApi(page, '/subscriptions/my', [pendingSub])
        await mockApi(page, '/shop/orders/my', [])
        await mockApi(page, '/subscriptions/3/confirmation-url', {
            vippsConfirmationUrl: 'https://example.test/vipps-redirect',
        })
        await page.goto('/profile/billing')

        await page.route('https://example.test/vipps-redirect', route =>
            route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Vipps stub</p>' })
        )
        await page.getByRole('button', { name: /complete in vipps/i }).click()
        await expect(page).toHaveURL(/example\.test\/vipps-redirect/, { timeout: 5000 })
    })
})
