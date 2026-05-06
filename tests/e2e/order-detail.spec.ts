import { test, expect, Page } from '@playwright/test'
import { mockSession, mockApi, regularUser } from './helpers/auth'

const paidOrder = {
    id: 101, userId: 'user-1', vippsOrderId: '101',
    status: 'Paid', totalInOre: 50000,
    shippingAddress: 'Testgata 1, 0001 Oslo', shippedAt: '2026-04-01T12:00:00Z',
    hasInvoice: true, isTest: false,
    items: [
        { id: 1, shopItemId: 1, shopItemName: 'Garge Sensor', quantity: 1, priceAtPurchaseInOre: 50000 },
    ],
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-03-31T08:00:00Z',
}

const failedOrder = {
    ...paidOrder,
    id: 102, status: 'Failed', shippedAt: null, hasInvoice: false,
}

const reservedOrder = {
    ...paidOrder,
    id: 103, status: 'Reserved', shippedAt: null, hasInvoice: false,
}

async function setup(page: Page, orders: unknown[], orderId: number) {
    await mockSession(page, regularUser)
    await mockApi(page, '/shop/orders/my', orders)
    await page.goto(`/profile/orders/${orderId}`)
}

test.describe('Order detail page', () => {
    test('renders order header with status', async ({ page }) => {
        await setup(page, [paidOrder], 101)
        await expect(page.getByRole('heading', { name: /order #101/i })).toBeVisible()
        await expect(page.getByText('Paid', { exact: true })).toBeVisible()
    })

    test('renders item list and total', async ({ page }) => {
        await setup(page, [paidOrder], 101)
        await expect(page.getByText('Garge Sensor × 1')).toBeVisible()
        await expect(page.getByText('NOK 500,00').first()).toBeVisible()
    })

    test('renders shipping address', async ({ page }) => {
        await setup(page, [paidOrder], 101)
        await expect(page.getByText('Testgata 1, 0001 Oslo')).toBeVisible()
    })

    test('renders Vipps payment reference section', async ({ page }) => {
        await setup(page, [paidOrder], 101)
        await expect(page.getByRole('heading', { name: /payment reference/i })).toBeVisible()
    })

    test('shows download invoice button for Paid order', async ({ page }) => {
        await setup(page, [paidOrder], 101)
        await expect(page.getByRole('button', { name: /download invoice/i })).toBeVisible()
    })

    test('hides invoice download for Reserved order', async ({ page }) => {
        await setup(page, [reservedOrder], 103)
        await expect(page.getByRole('button', { name: /download invoice/i })).toHaveCount(0)
    })

    test('shows failure step in timeline for Failed order', async ({ page }) => {
        await setup(page, [failedOrder], 102)
        await expect(page.getByText('Failed').first()).toBeVisible()
    })

    test('renders not-found state for unknown order ID', async ({ page }) => {
        await setup(page, [paidOrder], 999)
        await expect(page.getByText(/order not found/i)).toBeVisible()
        await expect(page.getByRole('link', { name: /back to billing/i })).toBeVisible()
    })

    test('timeline shows reached steps as active', async ({ page }) => {
        await setup(page, [paidOrder], 101)
        await expect(page.getByText('Order placed')).toBeVisible()
        await expect(page.getByText('Payment reserved')).toBeVisible()
        await expect(page.getByText('Payment captured')).toBeVisible()
        await expect(page.getByText('Shipped')).toBeVisible()
    })
})
