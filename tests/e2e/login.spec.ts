import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
    })

    test('renders login form', async ({ page }) => {
        await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
        await expect(page.getByRole('textbox', { name: /password/i }).or(page.locator('input[type="password"]'))).toBeVisible()
    })

    test('shows validation error on empty submit', async ({ page }) => {
        await page.getByRole('button', { name: /log in|sign in/i }).click()
        // Either HTML5 validation or custom error message appears
        const emailInput = page.getByRole('textbox', { name: /email/i })
        const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)
        expect(validationMessage.length).toBeGreaterThan(0)
    })

    test('shows error on wrong credentials', async ({ page }) => {
        await page.getByRole('textbox', { name: /email/i }).fill('wrong@example.com')
        await page.locator('input[type="password"]').fill('wrongpassword')
        await page.getByRole('button', { name: /log in|sign in/i }).click()
        await expect(page.getByRole('alert').or(page.locator('[class*="red"]'))).toBeVisible({ timeout: 5000 })
    })
})
