import { test, expect, Page } from '@playwright/test'
import { mockSession, mockApi, regularUser } from './helpers/auth'

test.describe.configure({ timeout: 60_000 })

const pendingOrder = {
    id: 201, userId: 'user-1', vippsOrderId: '201', status: 'Pending',
    totalInOre: 50000, shippingAddress: null, shippedAt: null,
    hasInvoice: false, isTest: false, items: [],
    createdAt: '2026-05-01', updatedAt: '2026-05-01',
}
const paidOrder = { ...pendingOrder, id: 202, status: 'Paid' }
const failedOrder = { ...pendingOrder, id: 203, status: 'Failed' }

const pendingSub = {
    id: 301, productName: 'Garge Basic', productType: 'Primary',
    status: 'Pending', priceInOre: 29900, interval: 'Monthly',
    isTest: false, startDate: null, nextChargeDate: null,
}
const activeSub = { ...pendingSub, id: 302, status: 'Active' }
const stoppedSub = { ...pendingSub, id: 303, status: 'Stopped' }

async function setupShopReturn(page: Page, orders: unknown[], orderId: number) {
    await mockSession(page, regularUser)
    await mockApi(page, '/shop/orders/my', orders)
    await page.goto(`/shop/return?orderId=${orderId}`)
}

async function setupBillingReturn(page: Page, subs: unknown[], subscriptionId?: number) {
    await mockSession(page, regularUser)
    await mockApi(page, '/subscriptions/my', subs)
    const query = subscriptionId != null ? `?subscriptionId=${subscriptionId}` : ''
    await page.goto(`/profile/billing/return${query}`)
}

test.describe('Shop return page', () => {
    test('Paid status shows success', async ({ page }) => {
        await setupShopReturn(page, [paidOrder], 202)
        await expect(page.getByText(/payment received/i)).toBeVisible()
        await expect(page.getByRole('link', { name: /back to shop/i })).toBeVisible()
    })

    test('Failed status shows error message', async ({ page }) => {
        await setupShopReturn(page, [failedOrder], 203)
        await expect(page.getByText(/payment failed/i)).toBeVisible()
        await expect(page.getByText(/no charge was made/i)).toBeVisible()
    })

    test('Pending status shows refresh button and email note', async ({ page }) => {
        await setupShopReturn(page, [pendingOrder], 201)
        await expect(page.getByText(/payment pending/i)).toBeVisible({ timeout: 45_000 })
        await expect(page.getByRole('button', { name: /check again/i })).toBeVisible()
        await expect(page.getByText(/we'll email you a receipt/i)).toBeVisible()
    })

    test('Pending shows View billing link', async ({ page }) => {
        await setupShopReturn(page, [pendingOrder], 201)
        await expect(page.getByRole('link', { name: /view billing/i })).toBeVisible({ timeout: 45_000 })
    })
})

test.describe('Billing return page', () => {
    test('Active sub shows success', async ({ page }) => {
        await setupBillingReturn(page, [activeSub])
        await expect(page.getByText(/subscription active/i)).toBeVisible()
        await expect(page.getByRole('link', { name: /go to dashboard/i })).toBeVisible()
    })

    test('Pending sub shows refresh and email note', async ({ page }) => {
        await setupBillingReturn(page, [pendingSub])
        await expect(page.getByText(/pending confirmation/i)).toBeVisible({ timeout: 45_000 })
        await expect(page.getByRole('button', { name: /check again/i })).toBeVisible()
        await expect(page.getByText(/we'll send a confirmation/i)).toBeVisible()
    })

    test('No sub returns failure state', async ({ page }) => {
        await setupBillingReturn(page, [])
        await expect(page.getByText(/subscription not found/i)).toBeVisible({ timeout: 45_000 })
    })

    test('picks the sub named in subscriptionId, not the last in the list', async ({ page }) => {
        // Active sub bought now (302) sits before a later Stopped one (303);
        // the param must win over array position.
        await setupBillingReturn(page, [activeSub, stoppedSub], 302)
        await expect(page.getByText(/subscription active/i)).toBeVisible()
    })

    test('without param falls back to newest sub by id', async ({ page }) => {
        // Newest is the Active 302; an older Stopped 301 must not be picked.
        await setupBillingReturn(page, [{ ...stoppedSub, id: 301 }, activeSub])
        await expect(page.getByText(/subscription active/i)).toBeVisible()
    })
})
