import { test, expect } from '@playwright/test'
import { mockSession, mockApi, adminUser, regularUser } from './helpers/auth'

const monthlyPrimary = {
    id: 1, name: 'Garge Basic', type: 'Primary',
    priceInOre: 29900, interval: 'Monthly', isActive: true, description: '',
}
const yearlyPrimary = {
    id: 2, name: 'Garge Pro Annual', type: 'Primary',
    priceInOre: 299000, interval: 'Yearly', isActive: true, description: '',
}
const addonProduct = {
    id: 3, name: 'Extra Sensor', type: 'AddOn',
    priceInOre: 4900, interval: 'Monthly', isActive: true, description: '',
}

test.describe('Admin products page', () => {
    test('non-admin is redirected away from /admin/products', async ({ page }) => {
        await mockSession(page, regularUser)
        await page.goto('/admin/products')
        await expect(page).not.toHaveURL(/admin\/products/, { timeout: 5000 })
    })

    test('renders product list for admin', async ({ page }) => {
        await mockSession(page, adminUser)
        await mockApi(page, '/api/products', [monthlyPrimary])
        await page.goto('/admin/products')
        await expect(page.getByText('Garge Basic')).toBeVisible()
    })

    test('shows Primary type badge', async ({ page }) => {
        await mockSession(page, adminUser)
        await mockApi(page, '/api/products', [monthlyPrimary])
        await page.goto('/admin/products')
        await expect(page.getByText('Primary')).toBeVisible()
    })

    test('shows Add-on type badge', async ({ page }) => {
        await mockSession(page, adminUser)
        await mockApi(page, '/api/products', [addonProduct])
        await page.goto('/admin/products')
        await expect(page.getByText('Add-on')).toBeVisible()
    })

    test('shows "mo" for Monthly interval, not Norwegian "mnd"', async ({ page }) => {
        await mockSession(page, adminUser)
        await mockApi(page, '/api/products', [monthlyPrimary])
        await page.goto('/admin/products')
        await expect(page.getByText(/\/ mo/)).toBeVisible()
        await expect(page.getByText(/mnd/i)).not.toBeVisible()
    })

    test('shows "yr" for Yearly interval, not Norwegian "år"', async ({ page }) => {
        await mockSession(page, adminUser)
        await mockApi(page, '/api/products', [yearlyPrimary])
        await page.goto('/admin/products')
        await expect(page.getByText(/\/ yr/)).toBeVisible()
        await expect(page.getByText(/\bår\b/i)).not.toBeVisible()
    })

    test('form has Primary and Add-on type options', async ({ page }) => {
        await mockSession(page, adminUser)
        await mockApi(page, '/api/products', [])
        await page.goto('/admin/products')
        await page.getByRole('button', { name: /add plan/i }).click()
        await expect(page.getByRole('option', { name: 'Primary' })).toBeAttached()
        await expect(page.getByRole('option', { name: 'Add-on' })).toBeAttached()
    })
})
