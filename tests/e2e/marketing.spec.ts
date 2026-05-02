import { test, expect } from '@playwright/test'

test.describe('Marketing / home page', () => {
    test('loads without error', async ({ page }) => {
        await page.goto('/')
        await expect(page).not.toHaveURL(/error/)
        // No JS errors that crash the page
        const title = await page.title()
        expect(title.length).toBeGreaterThan(0)
    })

    test('has link to login', async ({ page }) => {
        await page.goto('/')
        const loginLink = page.getByRole('link', { name: /log in|sign in|login/i })
        await expect(loginLink).toBeVisible()
    })
})
