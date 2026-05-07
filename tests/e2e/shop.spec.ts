import { test, expect, Page } from '@playwright/test'
import { mockSession, mockApi, regularUser } from './helpers/auth'

const sensorItem = {
    id: 1, name: 'Garge Sensor', description: 'Bike battery monitor',
    priceInOre: 50000, stockCount: 10, isActive: true,
    createdAt: '2026-01-01',
}
const lowStockItem = {
    id: 2, name: 'Almost Gone', description: null,
    priceInOre: 12000, stockCount: 2, isActive: true,
    createdAt: '2026-01-01',
}
const outOfStockItem = {
    id: 3, name: 'Sold Out', description: null,
    priceInOre: 9900, stockCount: 0, isActive: true,
    createdAt: '2026-01-01',
}
const primaryProduct = {
    id: 1, name: 'Garge Basic', description: 'Monthly plan',
    priceInOre: 29900, interval: 'Monthly', type: 'Primary',
    isActive: true, createdAt: '2026-01-01',
}

async function setup(page: Page, opts: {
    items?: unknown[]; products?: unknown[]; vatEnabled?: boolean; vippsTestMode?: boolean;
    mySubscriptions?: unknown[];
} = {}) {
    await mockSession(page, regularUser)
    await mockApi(page, '/admin/settings', {
        vatEnabled: opts.vatEnabled ?? false,
        vippsTestMode: opts.vippsTestMode ?? false,
    })
    await mockApi(page, '/shop/items', opts.items ?? [])
    await mockApi(page, '/products', opts.products ?? [])
    await mockApi(page, '/subscriptions/my', opts.mySubscriptions ?? [])
    await page.goto('/shop')
}

const addOnProduct = {
    id: 2, name: 'Garge Extra Sensor', description: 'Add another vehicle',
    priceInOre: 4900, interval: 'Monthly', type: 'AddOn',
    isActive: true, createdAt: '2026-01-01',
}

const activePrimarySubscription = {
    id: 1, userId: 'user-1', productId: 1, productName: 'Garge Basic',
    productType: 'Primary', priceInOre: 29900, interval: 'Monthly',
    vippsAgreementId: 'agr-1', status: 'Active', isTest: false,
    startDate: '2026-01-01', nextChargeDate: '2026-02-01',
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
}

test.describe('Shop page — items', () => {
    test('renders product card with name and price', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await expect(page.getByText('Garge Sensor')).toBeVisible()
        await expect(page.getByText('Bike battery monitor')).toBeVisible()
        await expect(page.getByText('NOK 500,00')).toBeVisible()
    })

    test('shows VAT-inclusive price when VatEnabled', async ({ page }) => {
        await setup(page, { items: [sensorItem], vatEnabled: true })
        await expect(page.getByText('NOK 625,00')).toBeVisible()
        await expect(page.getByText(/incl\. VAT/i).first()).toBeVisible()
    })

    test('shows "Only N left" warning when stock low', async ({ page }) => {
        await setup(page, { items: [lowStockItem] })
        await expect(page.getByText(/only 2 left/i)).toBeVisible()
    })

    test('out-of-stock item shows ribbon and hides Buy button', async ({ page }) => {
        await setup(page, { items: [outOfStockItem] })
        await expect(page.getByText(/out of stock/i)).toBeVisible()
        await expect(page.getByRole('button', { name: /^Buy$/ })).toHaveCount(0)
    })

    test('quantity stepper increments and updates total', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await expect(page.getByText('NOK 500,00').first()).toBeVisible()

        await page.getByRole('button', { name: /increase quantity/i }).click()
        await expect(page.getByText('NOK 1000,00')).toBeVisible()

        await page.getByRole('button', { name: /increase quantity/i }).click()
        await expect(page.getByText('NOK 1500,00')).toBeVisible()

        await page.getByRole('button', { name: /decrease quantity/i }).click()
        await expect(page.getByText('NOK 1000,00')).toBeVisible()
    })

    test('decrease disabled at quantity 1', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await expect(page.getByRole('button', { name: /decrease quantity/i })).toBeDisabled()
    })

    test('test mode banner appears when enabled', async ({ page }) => {
        await setup(page, { items: [sensorItem], vippsTestMode: true })
        await expect(page.getByText(/vipps test mode is active/i)).toBeVisible()
    })

    test('test mode banner hidden when disabled', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await expect(page.getByText(/vipps test mode is active/i)).not.toBeVisible()
    })
})

test.describe('Shop page — payment modal', () => {
    test('Buy opens payment modal with item summary', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await page.getByRole('button', { name: /^Buy$/ }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByText(/pay with vipps/i)).toBeVisible()
    })

    test('phone input auto-focuses when modal opens', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await page.getByRole('button', { name: /^Buy$/ }).click()
        const phone = page.locator('input[type="tel"]')
        await expect(phone).toBeFocused()
    })

    test('phone validates as user types — invalid then valid', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await page.getByRole('button', { name: /^Buy$/ }).click()
        const phone = page.locator('input[type="tel"]')

        await phone.fill('123')
        await expect(page.getByText(/enter a valid phone number/i)).toBeVisible()

        await phone.fill('91234567')
        await expect(page.getByText(/enter a valid phone number/i)).not.toBeVisible()
    })

    test('Continue button disabled when phone invalid', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await page.getByRole('button', { name: /^Buy$/ }).click()
        await page.locator('input[type="tel"]').fill('123')
        await expect(page.getByRole('button', { name: /continue to vipps/i })).toBeDisabled()
    })

    test('Escape closes modal', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await page.getByRole('button', { name: /^Buy$/ }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('Cancel button closes modal', async ({ page }) => {
        await setup(page, { items: [sensorItem] })
        await page.getByRole('button', { name: /^Buy$/ }).click()
        await page.getByRole('button', { name: /cancel payment/i }).click()
        await expect(page.getByRole('dialog')).not.toBeVisible()
    })
})

test.describe('Shop page — subscription modal', () => {
    test('Subscribe opens modal with consent checkbox', async ({ page }) => {
        await setup(page, { products: [primaryProduct] })
        await page.getByRole('button', { name: /subscribe/i }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByText(/14-day right of withdrawal/i)).toBeVisible()
    })

    test('Continue disabled until consent checked', async ({ page }) => {
        await setup(page, { products: [primaryProduct] })
        await page.getByRole('button', { name: /subscribe/i }).click()
        await page.locator('input[type="tel"]').fill('91234567')
        const continueBtn = page.getByRole('button', { name: /continue to vipps/i })
        await expect(continueBtn).toBeDisabled()
        await page.getByRole('checkbox').check()
        await expect(continueBtn).toBeEnabled()
    })

    test('Terms link in modal opens in new tab', async ({ page }) => {
        await setup(page, { products: [primaryProduct] })
        await page.getByRole('button', { name: /subscribe/i }).click()
        const terms = page.getByRole('dialog').getByRole('link', { name: /terms of service/i })
        await expect(terms).toHaveAttribute('target', '_blank')
    })

    test('AddOn locked when user has no active core subscription', async ({ page }) => {
        await setup(page, { products: [primaryProduct, addOnProduct], mySubscriptions: [] })
        await expect(page.getByText(/requires an active core subscription/i)).toBeVisible()

        const subscribeButtons = page.getByRole('button', { name: /^Subscribe$/ })
        await expect(subscribeButtons.nth(0)).toBeEnabled()   // Primary
        await expect(subscribeButtons.nth(1)).toBeDisabled()  // AddOn
    })

    test('AddOn unlocked when user has active core subscription', async ({ page }) => {
        await setup(page, {
            products: [primaryProduct, addOnProduct],
            mySubscriptions: [activePrimarySubscription],
        })
        await expect(page.getByText(/requires an active core subscription/i)).not.toBeVisible()

        const subscribeButtons = page.getByRole('button', { name: /^Subscribe$/ })
        await expect(subscribeButtons.nth(0)).toBeEnabled()
        await expect(subscribeButtons.nth(1)).toBeEnabled()
    })
})
