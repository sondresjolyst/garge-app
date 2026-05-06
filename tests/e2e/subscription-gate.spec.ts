import { test, expect } from '@playwright/test'
import { mockSession, mockApi, mockNoSession, regularUser } from './helpers/auth'

test.describe('Subscription gate', () => {
    test('unauthenticated user is redirected to login', async ({ page }) => {
        await mockNoSession(page)
        await page.goto('/profile/billing')
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    })

    test('unauthenticated user visiting shop is redirected to login', async ({ page }) => {
        await mockNoSession(page)
        await page.goto('/shop')
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    })

    test('billing page shows empty state for user with no subscriptions', async ({ page }) => {
        await mockSession(page, regularUser)
        await mockApi(page, '/admin/settings', { vatEnabled: false, vippsTestMode: false })
        await mockApi(page, '/subscriptions/my', [])
        await mockApi(page, '/shop/orders/my', [])
        await page.goto('/profile/billing')
        await expect(page.getByText('No active subscription.')).toBeVisible()
    })

    test('billing page shows "Browse plans" link when no subscriptions', async ({ page }) => {
        await mockSession(page, regularUser)
        await mockApi(page, '/admin/settings', { vatEnabled: false, vippsTestMode: false })
        await mockApi(page, '/subscriptions/my', [])
        await mockApi(page, '/shop/orders/my', [])
        await page.goto('/profile/billing')
        await expect(page.getByRole('link', { name: /browse plans/i })).toBeVisible()
    })

    test('shop page renders subscription plans section', async ({ page }) => {
        await mockSession(page, regularUser)
        await mockApi(page, '/admin/settings', { vatEnabled: false, vippsTestMode: false })
        await mockApi(page, '/shop/items', [])
        await mockApi(page, '/products', [])
        await page.goto('/shop')
        await expect(page.getByText(/subscription plans/i)).toBeVisible()
    })

    test('billing page shows active subscription for subscribed user', async ({ page }) => {
        await mockSession(page, regularUser)
        await mockApi(page, '/admin/settings', { vatEnabled: false, vippsTestMode: false })
        await mockApi(page, '/subscriptions/my', [{
            id: 1, productName: 'Garge Basic', productType: 'Primary',
            status: 'Active', priceInOre: 29900, interval: 'Monthly',
            startDate: '2026-01-01', nextChargeDate: '2026-06-01',
        }])
        await mockApi(page, '/shop/orders/my', [])
        await page.goto('/profile/billing')
        await expect(page.getByText('Garge Basic')).toBeVisible()
        await expect(page.getByText('Active')).toBeVisible()
    })
})
