import { test, expect, type Page } from '@playwright/test'

const PAGES = [
    { path: '/no/help', lang: 'nb', title: 'Hjelp | Garge', description: 'Sett opp Garge-sensoren, bruk den i appen og løs vanlige problemer.', other: '/en/help', switchLabel: 'English', button: 'Last ned kortversjonen (PDF)', note: /kortversjon for utskrift/ },
    { path: '/en/help', lang: 'en', title: 'Help | Garge', description: 'Set up your Garge sensor, use it in the app and solve common problems.', other: '/no/help', switchLabel: 'Norsk', button: 'Download the short version (PDF)', note: /short version for printing/ },
]
const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1280, height: 800 }]

/** Lazy images load only near the viewport, so the page is walked from top to bottom. */
async function loadAllImages(page: Page) {
    await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
            window.scrollTo(0, y)
            await new Promise(resolve => setTimeout(resolve, 50))
        }
        window.scrollTo(0, 0)
    })
    await page.waitForLoadState('networkidle')
}

for (const help of PAGES) {
    for (const viewport of VIEWPORTS) {
        test.describe(`${help.path} at ${viewport.width} px`, () => {
            test.use({ viewport })

            test('renders for a logged-out visitor with its language, images and anchors', async ({ page }) => {
                const errors: string[] = []
                // The specs run with the API on a closed port, so only errors from this site count.
                page.on('console', message => {
                    if (message.type() === 'error' && new URL(message.location().url).port === new URL(page.url()).port) errors.push(message.text())
                })
                page.on('pageerror', error => errors.push(error.message))

                const response = await page.goto(help.path)
                expect(response?.status()).toBe(200)
                expect(new URL(page.url()).pathname).toBe(help.path)

                await expect(page.locator(`div[lang="${help.lang}"]`)).toBeVisible()
                await loadAllImages(page)

                const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
                expect(overflow).toBeLessThanOrEqual(0)

                const broken = await page.locator('main img').evaluateAll(images =>
                    images.filter(image => !(image as HTMLImageElement).naturalWidth).map(image => (image as HTMLImageElement).src))
                expect(broken).toEqual([])
                expect(await page.locator('main img').count()).toBeGreaterThanOrEqual(6)
                expect((await page.request.get('/help/device.png')).status()).toBe(200)

                const missing = await page.locator('main a[href^="#"]').evaluateAll(links =>
                    links.map(link => link.getAttribute('href') as string).filter(href => !document.getElementById(href.slice(1))))
                expect(missing).toEqual([])

                const button = page.getByRole('link', { name: help.button })
                await expect(button).toBeVisible()
                await expect(button.locator('..').getByText(help.note)).toBeVisible()
                const pdf = await page.request.get((await button.getAttribute('href')) as string)
                expect(pdf.status()).toBe(200)
                expect(pdf.headers()['content-type']).toContain('application/pdf')

                expect(errors).toEqual([])
            })

            test('the language switch goes to the other page', async ({ page }) => {
                await page.goto(help.path)
                await page.getByRole('link', { name: help.switchLabel, exact: true }).click()
                await expect(page).toHaveURL(new RegExp(`${help.other}$`))
            })
        })
    }

    test(`${help.path} has its metadata`, async ({ page }) => {
        await page.goto(help.path)
        await expect(page).toHaveTitle(help.title)
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', help.description)
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.garge.no${help.path}`)
        await expect(page.locator('link[rel="alternate"][hreflang="nb"]')).toHaveAttribute('href', 'https://www.garge.no/no/help')
        await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://www.garge.no/en/help')
        await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://www.garge.no/help')
    })

    test.describe(`${help.path} without JavaScript`, () => {
        test.use({ javaScriptEnabled: false })

        test('shows the text, and its links and anchors work', async ({ page }) => {
            await page.goto(`${help.path}#change-wifi`)
            await expect(page.locator(`div[lang="${help.lang}"]`)).toBeVisible()
            await expect(page.locator('#change-wifi')).toBeInViewport()

            await page.getByRole('link', { name: help.switchLabel, exact: true }).click()
            await expect(page).toHaveURL(new RegExp(`${help.other}$`))
        })
    })
}

test.describe('/help', () => {
    for (const [acceptLanguage, target] of [
        ['nb-NO', '/no/help'],
        ['nn', '/no/help'],
        ['en-US', '/en/help'],
        ['de', '/en/help'],
        ['en;q=0.9,nb;q=0.8', '/en/help'],
        ['nb;q=0.9,en;q=0.8', '/no/help'],
    ]) {
        test(`sends ${acceptLanguage} to ${target}`, async ({ request }) => {
            const response = await request.get('/help', { headers: { 'accept-language': acceptLanguage }, maxRedirects: 0 })
            expect(response.status()).toBe(307)
            expect(response.headers().location).toBe(target)
            expect(response.headers().vary).toContain('Accept-Language')
            expect(response.headers()['cache-control']).toBe('private, no-store')
        })
    }

    test('sends a request with no header to English', async ({ playwright, baseURL }) => {
        const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: {} })
        const response = await request.get('/help', { maxRedirects: 0 })
        expect(response.headers().location).toBe('/en/help')
        await request.dispose()
    })

    test('the footer link reaches a help page', async ({ page }) => {
        await page.goto('/contact')
        await page.getByRole('contentinfo').getByRole('link', { name: 'Help' }).click()
        await expect(page).toHaveURL(/\/(no|en)\/help$/)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
})
