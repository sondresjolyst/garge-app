import { test, expect, Page } from '@playwright/test'
import { mockSession, mockApi, adminUser } from './helpers/auth'

function reservedOrder(opts: {
    id: number; createdDaysAgo: number; isTest?: boolean;
}): unknown {
    const created = new Date(Date.now() - opts.createdDaysAgo * 24 * 60 * 60 * 1000)
    return {
        id: opts.id, userId: 'user-1', userEmail: 'buyer@example.com', userName: 'Buyer Bob',
        vippsOrderId: String(opts.id), status: 'Reserved', totalInOre: 50000,
        shippingAddress: 'Testgata 1', shippedAt: null,
        hasInvoice: false, isTest: opts.isTest ?? false,
        items: [{ id: 1, shopItemId: 1, shopItemName: 'Sensor', quantity: 1, priceAtPurchaseInOre: 50000 }],
        createdAt: created.toISOString(),
        updatedAt: created.toISOString(),
    }
}

async function setup(page: Page, orders: unknown[]) {
    await mockSession(page, adminUser)
    await mockApi(page, '/shop/orders', orders)
    await page.goto('/admin/orders')
}

test.describe('Admin orders page', () => {
    test('shows empty state when no orders', async ({ page }) => {
        await setup(page, [])
        await expect(page.getByText(/no orders yet/i)).toBeVisible()
    })

    test('renders Reserved order with countdown', async ({ page }) => {
        await setup(page, [reservedOrder({ id: 1, createdDaysAgo: 1 })])
        await expect(page.getByText(/order #1/i)).toBeVisible()
        await expect(page.getByText(/reservation expires in/i)).toBeVisible()
    })

    test('reservation 1 day from expiry shows red warning', async ({ page }) => {
        await setup(page, [reservedOrder({ id: 1, createdDaysAgo: 6 })])
        const text = page.getByText(/reservation expires in 1 day/i)
        await expect(text).toBeVisible()
    })

    test('expired reservation shows red expiry message', async ({ page }) => {
        await setup(page, [reservedOrder({ id: 1, createdDaysAgo: 8 })])
        await expect(page.getByText(/reservation expired/i)).toBeVisible()
    })

    test('test-mode order shows TEST pill', async ({ page }) => {
        await setup(page, [reservedOrder({ id: 1, createdDaysAgo: 1, isTest: true })])
        await expect(page.getByTitle('Test mode')).toBeVisible()
    })

    test('Capture button opens confirm modal', async ({ page }) => {
        await setup(page, [reservedOrder({ id: 1, createdDaysAgo: 1 })])
        await page.getByRole('button', { name: /capture payment/i }).click()
        await expect(page.getByRole('alertdialog')).toBeVisible()
        await expect(page.getByRole('heading', { name: /capture payment/i })).toBeVisible()
    })

    test('Cancel order button opens confirm modal', async ({ page }) => {
        await setup(page, [reservedOrder({ id: 1, createdDaysAgo: 1 })])
        await page.getByRole('button', { name: /cancel order/i }).click()
        await expect(page.getByRole('alertdialog')).toBeVisible()
    })

    test('Escape closes capture confirm modal', async ({ page }) => {
        await setup(page, [reservedOrder({ id: 1, createdDaysAgo: 1 })])
        await page.getByRole('button', { name: /capture payment/i }).click()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('alertdialog')).not.toBeVisible()
    })
})
