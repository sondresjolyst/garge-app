import { test, expect, type Page } from '@playwright/test'

const PAGES = [
    { path: '/no/help', lang: 'nb', title: 'Hjelp | Garge', description: 'Oppsett, knapper, lys og feilsøking for Garge Sensor og Garge Voltmeter.', other: '/en/help', switchLabel: 'English', button: 'Last ned kort utskriftsversjon (PDF)', note: 'Inneholder ikke alt som står på denne siden.', contents: 'Innhold' },
    { path: '/en/help', lang: 'en', title: 'Help | Garge', description: 'Setup, buttons, light and troubleshooting for Garge Sensor and Garge Voltmeter.', other: '/no/help', switchLabel: 'Norsk', button: 'Download the short print version (PDF)', note: 'Does not include everything on this page.', contents: 'Contents' },
]
const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 1280, height: 800 }]

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

    test.describe(`${help.path} contents at 390 px`, () => {
        test.use({ viewport: { width: 390, height: 844 } })

        test('is collapsed above the sections, opens, and its links work', async ({ page }) => {
            await page.goto(help.path)
            await expect(page.locator('aside')).toBeHidden()

            const details = page.locator('details')
            await expect(details.locator('summary')).toHaveText(help.contents)
            await expect(details).not.toHaveAttribute('open')
            await expect(details.getByRole('link').first()).toBeHidden()

            const detailsBox = await details.boundingBox()
            const setupBox = await page.locator('#setup').boundingBox()
            expect(detailsBox!.y).toBeLessThan(setupBox!.y)
            const pdfBox = await page.getByRole('link', { name: help.button }).boundingBox()
            expect(pdfBox!.y).toBeLessThan(detailsBox!.y)

            await details.locator('summary').click()
            await details.locator('a[href="#change-wifi"]').click()
            await expect(page).toHaveURL(/#change-wifi$/)
            await expect(page.locator('#change-wifi')).toBeInViewport()
        })
    })

    for (const viewport of [{ width: 1024, height: 768 }, { width: 1280, height: 800 }]) {
        test.describe(`${help.path} sidebar at ${viewport.width} px`, () => {
            test.use({ viewport })

            test('replaces the collapsed list and sits left of the content', async ({ page }) => {
                await page.goto(help.path)
                await expect(page.locator('details')).toBeHidden()
                const sidebar = await page.locator('aside nav').boundingBox()
                const content = await page.locator('#setup').boundingBox()
                expect(sidebar!.x + sidebar!.width).toBeLessThanOrEqual(content!.x)
                expect(content!.width).toBeLessThanOrEqual(768)

                const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
                expect(heading!.x).toBeGreaterThanOrEqual(content!.x)
                const pdf = await page.getByRole('link', { name: help.button }).boundingBox()
                expect(pdf!.x).toBeGreaterThanOrEqual(content!.x)
            })

            test('stays in place below the navbar and clear of the fixed bars while scrolling', async ({ page }) => {
                await page.goto(help.path)
                await page.locator('#troubleshooting').evaluate(element => element.scrollIntoView())
                await expect(page.locator('aside [aria-current]')).toBeVisible()

                const measure = () => page.evaluate(() => {
                    const nav = document.querySelector('aside nav') as HTMLElement
                    const box = nav.getBoundingClientRect()
                    const covered = [...nav.querySelectorAll('a')].filter(link => {
                        const linkBox = link.getBoundingClientRect()
                        const point = document.elementFromPoint(linkBox.left + 4, linkBox.top + linkBox.height / 2)
                        return linkBox.bottom <= box.bottom && !nav.contains(point)
                    })
                    return {
                        top: box.top,
                        bottom: box.bottom,
                        headerBottom: (document.querySelector('header') as HTMLElement).getBoundingClientRect().bottom,
                        covered: covered.length,
                        scrollY: window.scrollY,
                    }
                })

                const first = await measure()
                expect(first.scrollY).toBeGreaterThan(500)
                expect(first.top).toBeGreaterThanOrEqual(first.headerBottom)
                expect(first.bottom).toBeLessThanOrEqual(viewport.height)
                expect(first.covered).toBe(0)

                await page.locator('#selling').evaluate(element => element.scrollIntoView())
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', /#(selling|sell-sensor)$/)
                const second = await measure()
                expect(second.scrollY).toBeGreaterThan(first.scrollY)
                expect(second.top).toBe(first.top)
            })

            test('marks nothing at the top of the page, also after scrolling back up', async ({ page }) => {
                await page.goto(help.path)
                await expect(page.locator('aside [aria-current]')).toHaveCount(0)

                await page.locator('#selling').evaluate(element => element.scrollIntoView())
                await expect(page.locator('aside [aria-current]')).toHaveCount(1)

                await page.evaluate(() => window.scrollTo(0, 0))
                await expect(page.locator('aside [aria-current]')).toHaveCount(0)
            })

            test('scrolls on its own when the screen is short', async ({ page }) => {
                await page.setViewportSize({ width: viewport.width, height: 480 })
                await page.goto(help.path)
                const sizes = await page.locator('aside nav').evaluate(nav => ({ scroll: nav.scrollHeight, client: nav.clientHeight, overflow: getComputedStyle(nav).overflowY }))
                expect(sizes.overflow).toBe('auto')
                expect(sizes.scroll).toBeGreaterThan(sizes.client)
            })

            for (const id of ['troubleshooting', 'change-wifi', 'setup-page-not-opening']) {
                test(`marks ${id} as current after a jump to it`, async ({ page }) => {
                    await page.goto(`${help.path}#${id}`)
                    await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', `#${id}`)
                })
            }

            test('lands an anchor below the navbar', async ({ page }) => {
                await page.goto(`${help.path}#change-wifi`)
                const heading = await page.locator('#change-wifi h3').boundingBox()
                const header = await page.locator('header').boundingBox()
                expect(heading!.y).toBeGreaterThanOrEqual(header!.y + header!.height)
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

            await page.locator('aside a[href="#selling"]').click()
            await expect(page.locator('#selling')).toBeInViewport()

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
