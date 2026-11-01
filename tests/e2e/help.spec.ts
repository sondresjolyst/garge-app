import { test, expect, type Page } from '@playwright/test'
import { mockSession, regularUser } from './helpers/auth'

const PAGES = [
    { path: '/no/help', lang: 'nb', description: 'Oppsett, knapper, lys og feilsøking for Garge Sensor og Garge Voltmeter.', other: '/en/help', switchLabel: 'English', button: 'Last ned kort utskriftsversjon (PDF)', contents: 'Innhold' },
    { path: '/en/help', lang: 'en', description: 'Setup, buttons, light and troubleshooting for Garge Sensor and Garge Voltmeter.', other: '/no/help', switchLabel: 'Norsk', button: 'Download the short print version (PDF)', contents: 'Contents' },
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
                await expect(page.getByRole('link', { name: help.button })).toHaveCount(1)
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
            const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
            expect(heading!.y).toBeLessThan(detailsBox!.y)

            await details.locator('summary').click()
            await details.locator('a[href="#change-wifi"]').click()
            await expect(page).toHaveURL(/#change-wifi$/)
            await expect(page.locator('#change-wifi')).toBeInViewport()
        })

        test('has the PDF at the bottom of the page, below every section', async ({ page }) => {
            await page.goto(help.path)
            const pdf = await page.getByRole('link', { name: help.button }).boundingBox()
            const last = await page.locator('#buttons-and-light').boundingBox()
            expect(pdf!.y).toBeGreaterThan(last!.y + last!.height - 1)
        })

        test('fits the light table on the screen and drops the link icons on touch', async ({ browser }) => {
            const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
            const page = await context.newPage()
            await page.goto(help.path)
            const table = await page.getByRole('table').boundingBox()
            expect(table!.x + table!.width).toBeLessThanOrEqual(390)
            await expect(page.locator('#change-wifi a[href="#change-wifi"]').first()).toBeHidden()
            await context.close()
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
                expect(pdf!.x + pdf!.width).toBeLessThanOrEqual(content!.x)
                expect(pdf!.y).toBeGreaterThan(sidebar!.y + sidebar!.height - 1)
            })

            test('opens directly on setup, after the heading', async ({ page }) => {
                await page.goto(help.path)
                const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
                const setup = await page.locator('#setup').boundingBox()
                expect(setup!.y - (heading!.y + heading!.height)).toBeLessThan(80)
            })

            test('shows the main titles, and the subtitles of the section being read', async ({ page }) => {
                await page.goto(help.path)
                await expect(page.locator('aside a[href="#step-wifi"]')).toBeVisible()
                await expect(page.locator('aside a[href="#change-wifi"]')).toBeHidden()

                await page.locator('#sharing').evaluate(element => element.scrollIntoView())
                await expect(page.locator('aside a[href="#sharing"]')).toBeVisible()
                await expect(page.locator('aside a[href="#step-wifi"]')).toBeHidden()
                await expect(page.locator('aside a[href="#pairing-code-expired"]')).toBeHidden()
            })

            test('holds the list still under the cursor while the page scrolls', async ({ page }) => {
                await page.goto(help.path)
                const link = page.locator('aside a[href="#buttons-and-light"]')
                await link.hover()
                const before = await link.boundingBox()

                await page.evaluate(() => document.getElementById('sharing')?.scrollIntoView())
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#common-tasks')

                expect(await link.boundingBox()).toEqual(before)
            })

            test('keeps a clicked link under the cursor, so a click on a subtitle lands', async ({ page }) => {
                await page.goto(help.path)
                const title = page.locator('aside a[href="#common-tasks"]')
                await title.hover()
                const before = await title.boundingBox()

                await title.click()
                await expect(page).toHaveURL(/#common-tasks$/)
                expect(await title.boundingBox()).toEqual(before)

                const subtitle = page.locator('aside a[href="#selling"]')
                await subtitle.scrollIntoViewIfNeeded()
                await subtitle.click()
                await expect(page).toHaveURL(/#selling$/)
                await expect(page.locator('#selling')).toBeInViewport()

                await page.mouse.move(viewport.width - 5, viewport.height / 2)
                await expect(page.locator('aside a[href="#step-wifi"]')).toBeHidden()
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#selling')
            })

            test('reaches a subtitle in a folded section from a link in the text', async ({ page }) => {
                await page.goto(help.path)
                await expect(page.locator('aside a[href="#light-not-blinking-fast"]')).toBeHidden()
                await page.locator('#step-power a[href="#light-not-blinking-fast"]').click()
                await expect(page.locator('#light-not-blinking-fast')).toBeInViewport()
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#light-not-blinking-fast')
            })

            test('reaches every subtitle with the Tab key, and folds again when the keyboard leaves', async ({ page }) => {
                await page.goto(help.path)
                await expect(page.locator('aside a[href="#blue-light"]')).toBeHidden()

                const inSidebar = () => page.evaluate(() => document.activeElement?.closest('aside nav')?.getAttribute('aria-label') !== undefined && document.activeElement?.closest('aside nav') !== null)
                for (let press = 0; press < 20 && !(await inSidebar()); press++) await page.keyboard.press('Tab')
                expect(await inSidebar()).toBe(true)
                await expect(page.locator('aside a[href="#blue-light"]')).toBeVisible()

                const reached: string[] = []
                for (let press = 0; press < 60 && await inSidebar(); press++) {
                    reached.push(await page.evaluate(() => document.activeElement?.getAttribute('href') ?? ''))
                    await page.keyboard.press('Tab')
                }
                const all = await page.locator('aside nav a').evaluateAll(links => links.map(link => link.getAttribute('href')))
                expect(reached).toEqual(all)

                await expect(page.locator('aside a[href="#blue-light"]')).toBeHidden()
            })

            test('shows the link icon only on hover or keyboard focus', async ({ page }) => {
                await page.goto(help.path)
                const icon = page.locator('#change-wifi a[href="#change-wifi"]').first()
                await expect(icon).toHaveCSS('opacity', '0')
                await page.locator('#change-wifi').hover()
                await expect(icon).toHaveCSS('opacity', '1')
                await page.mouse.move(0, 0)
                await icon.focus()
                await expect(icon).toHaveCSS('opacity', '1')
            })

            test('stays in place below the navbar and clear of the fixed bars while scrolling', async ({ page }) => {
                await page.goto(help.path)
                await page.locator('#troubleshooting').evaluate(element => element.scrollIntoView())
                await expect(page.locator('aside [aria-current]')).toBeVisible()

                const measure = () => page.evaluate(() => {
                    const nav = document.querySelector('aside nav') as HTMLElement
                    const box = nav.getBoundingClientRect()
                    const covered = [...document.querySelectorAll('aside a')].filter(link => {
                        const linkBox = link.getBoundingClientRect()
                        const point = document.elementFromPoint(linkBox.left + 4, linkBox.top + linkBox.height / 2)
                        return linkBox.height > 0 && linkBox.bottom <= window.innerHeight && !link.parentElement?.closest('aside')?.contains(point)
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
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#selling')
                const second = await measure()
                expect(second.scrollY).toBeGreaterThan(first.scrollY)
                expect(second.top).toBe(first.top)
            })

            test('marks nothing at the top of the page, also after scrolling back up', async ({ page }) => {
                await page.goto(help.path)
                await expect(page.locator('aside [aria-current]')).toHaveCount(0)

                await page.locator('#sharing').evaluate(element => element.scrollIntoView())
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

            for (const id of ['troubleshooting', 'change-wifi', 'setup-page-not-opening', 'selling', 'setup-mode']) {
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

    for (const viewport of [{ width: 1920, height: 1080 }, { width: 1280, height: 800 }]) {
        test.describe(`${help.path} mark near the end of the page at ${viewport.width} x ${viewport.height}`, () => {
            test.use({ viewport })

            for (const id of ['blue-light', 'setup-mode']) {
                test(`marks ${id} when the page opens on it`, async ({ page }) => {
                    await page.goto(`${help.path}#${id}`)
                    await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', `#${id}`)
                })
            }

            test('stays in view below the navbar when the page is fully scrolled', async ({ page }) => {
                await page.goto(help.path)
                await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#blue-light')

                const sidebar = await page.locator('aside nav').boundingBox()
                const header = await page.locator('header').boundingBox()
                expect(sidebar!.y).toBeGreaterThanOrEqual(header!.y + header!.height)
                await expect(page.locator('aside').getByRole('link', { name: help.button })).toBeInViewport()
            })

            test('marks the last section after a click on its title', async ({ page }) => {
                await page.goto(help.path)
                await page.locator('aside a[href="#buttons-and-light"]').click()
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#buttons-and-light')
                await page.waitForTimeout(400)
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#buttons-and-light')
            })

            test('marks the last item at the end of the page, and follows the reader back up', async ({ page }) => {
                await page.goto(help.path)
                await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#blue-light')

                await page.locator('#sharing').evaluate(element => element.scrollIntoView())
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#sharing')
            })

            test('leaves a jump behind once the reader scrolls', async ({ page }) => {
                await page.goto(`${help.path}#setup-mode`)
                await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#setup-mode')
                await page.waitForTimeout(400)
                await page.mouse.move(viewport.width - 5, viewport.height / 2)
                await page.mouse.wheel(0, -2000)
                await expect(page.locator('aside [aria-current]')).not.toHaveAttribute('href', '#setup-mode')
            })
        })
    }

    test.describe(`${help.path} sidebar on a touch screen`, () => {
        test('follows the page after a tap, with no list held open', async ({ browser }) => {
            const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true })
            const page = await context.newPage()
            await page.goto(`${help.path}`)

            await page.locator('aside a[href="#common-tasks"]').tap()
            await expect(page.locator('aside a[href="#sharing"]')).toBeVisible()
            await expect(page.locator('aside a[href="#step-wifi"]')).toBeHidden()

            await page.locator('aside a[href="#buttons-and-light"]').tap()
            await expect(page.locator('aside a[href="#blue-light"]')).toBeVisible()
            await expect(page.locator('aside a[href="#sharing"]')).toBeHidden()
            await context.close()
        })
    })

    test(`${help.path} has its metadata`, async ({ page }) => {
        await page.goto(help.path)
        await expect(page).toHaveTitle('Garge')
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

            for (const id of ['step-wifi', 'pairing-code-expired', 'sharing', 'setup-mode', 'blue-light']) {
                await expect(page.locator(`aside a[href="#${id}"]`)).toBeVisible()
            }

            await page.getByRole('link', { name: help.switchLabel, exact: true }).click()
            await expect(page).toHaveURL(new RegExp(`${help.other}$`))
        })
    })
}

/** Answers every call to the API, which runs on a closed port in the specs. */
async function mockAllApi(page: Page) {
    await page.route('**://localhost:5999/**', route => {
        const url = route.request().url()
        const body = url.includes('capacity') ? { capacity: 4, used: 0, bypass: false, canClaim: true } : /sensors|switches|groups/.test(url) ? [] : {}
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
}

for (const { acceptLanguage, target } of [{ acceptLanguage: 'nb-NO', target: '/no/help' }, { acceptLanguage: 'en-US', target: '/en/help' }]) {
    test.describe(`Help links for ${acceptLanguage}`, () => {
        test.use({ locale: acceptLanguage, viewport: { width: 1280, height: 800 } })

        test('keeps #setup through the /help redirect and lands on the section', async ({ page }) => {
            await page.goto('/help#setup')
            await expect(page).toHaveURL(new RegExp(`${target}#setup$`))
            await expect(page.locator('#setup')).toBeInViewport()
        })

        test('keeps #step-power through the /help redirect and lands on the step', async ({ page }) => {
            await page.goto('/help#step-power')
            await expect(page).toHaveURL(new RegExp(`${target}#step-power$`))
            await expect(page.locator('#step-power')).toBeInViewport()
        })

        test('opens the power on step in a new tab from the wizard, and the wizard stays open', async ({ page, context }) => {
            await mockSession(page, regularUser)
            await mockAllApi(page)
            await page.goto('/')
            await page.getByRole('button', { name: /add device/i }).first().click()
            const link = page.getByRole('link', { name: 'Need help?' })
            await expect(link).toHaveAttribute('rel', 'noopener noreferrer')

            const [helpTab] = await Promise.all([context.waitForEvent('page'), link.click()])
            await expect(helpTab).toHaveURL(new RegExp(`${target}#step-power$`))
            await expect(helpTab.locator('#step-power')).toBeInViewport()
            await expect(page.getByRole('heading', { name: 'Add a device' })).toBeVisible()
        })
    })
}

for (const viewport of [{ width: 1280, height: 800 }, { width: 1366, height: 650 }]) {
    test.describe(`Keyboard in the sidebar at ${viewport.width} x ${viewport.height}`, () => {
        test.use({ viewport })

        for (const position of ['top', 'end']) {
            test(`keeps every focused link on screen at the ${position} of the page`, async ({ page }) => {
                await page.goto('/en/help')
                const focusedInNav = () => page.evaluate(() => document.activeElement?.closest('aside nav') !== null && document.activeElement?.closest('aside nav') !== undefined)
                for (let press = 0; press < 20 && !(await focusedInNav()); press++) await page.keyboard.press('Tab')
                expect(await focusedInNav()).toBe(true)
                if (position === 'end') await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))

                let reached = 0
                while (await focusedInNav()) {
                    const box = await page.evaluate(() => {
                        const link = (document.activeElement as HTMLElement).getBoundingClientRect()
                        const header = (document.querySelector('header') as HTMLElement).getBoundingClientRect()
                        return { top: link.top, bottom: link.bottom, headerBottom: header.bottom, height: window.innerHeight }
                    })
                    expect(box.top).toBeGreaterThanOrEqual(box.headerBottom - 1)
                    expect(box.bottom).toBeLessThanOrEqual(box.height)
                    reached++
                    await page.keyboard.press('Tab')
                    if (position === 'end' && reached === 1) await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
                }
                expect(reached).toBeGreaterThan(20)
            })
        }
    })
}

test.describe('The mark and how a link is opened', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('a Ctrl click on a sidebar link does not move the mark', async ({ page, context }) => {
        await page.goto('/en/help#step-wifi')
        await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#step-wifi')

        await page.keyboard.down('Control')
        const [opened] = await Promise.all([context.waitForEvent('page'), page.locator('aside a[href="#common-tasks"]').click()])
        await page.keyboard.up('Control')
        await opened.close()

        await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#step-wifi')
        await expect(page).toHaveURL(/#step-wifi$/)
    })

    test('a scroll that ends right after a jump does not leave a stale mark', async ({ page }) => {
        await page.goto('/en/help')
        await page.waitForLoadState('networkidle')
        await page.evaluate(async () => {
            const frame = () => new Promise(resolve => requestAnimationFrame(resolve))
            window.location.hash = '#step-wifi'
            await frame()
            await frame()
            document.getElementById('sharing')?.scrollIntoView()
            await frame()
            await frame()
            window.scrollBy(0, 1)
        })
        await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#sharing')
    })
})

// On a tall screen these sections never reach the reading line, so only the jump itself can mark them.
test.describe('The mark near the end of a tall page', () => {
    test.use({ viewport: { width: 1920, height: 1080 } })

    test('a link in the text marks its target through the hash change', async ({ page }) => {
        await page.goto('/en/help')
        await page.waitForLoadState('networkidle')
        await page.locator('#voltmeter-not-responding a[href="#setup-mode"]:not([aria-label])').click()
        await expect(page).toHaveURL(/#setup-mode$/)
        await page.waitForTimeout(400)
        await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#setup-mode')
    })

    test('a second click on the current address marks it again', async ({ page }) => {
        await page.goto('/en/help#setup-mode')
        await page.waitForLoadState('networkidle')
        await page.locator('#buttons').evaluate(element => element.scrollIntoView())
        await page.waitForTimeout(400)
        await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#buttons')

        await page.locator('aside a[href="#setup-mode"]').click()
        await page.waitForTimeout(400)
        await expect(page.locator('aside [aria-current]')).toHaveAttribute('href', '#setup-mode')
    })
})

for (const help of PAGES) {
    for (const width of [320, 360, 375, 414, 480, 600, 768, 900, 1023, 1024]) {
        test.describe(`${help.path} fits at ${width} px`, () => {
            test.use({ viewport: { width, height: 700 } })

            test('nothing leaves the screen, and the contents and PDF button work', async ({ page }) => {
                await page.goto(help.path)
                await page.waitForLoadState('networkidle')

                const facts = await page.evaluate(() => {
                    const right = document.documentElement.clientWidth
                    const visible = (element: Element) => element.getBoundingClientRect().width > 0
                    return {
                        scroll: document.documentElement.scrollWidth - right,
                        outside: [...document.querySelectorAll('main *')].filter(element => visible(element) && (element.getBoundingClientRect().right > right + 0.5 || element.getBoundingClientRect().left < -0.5)).map(element => element.tagName),
                        // A word wider than its table cell runs into the next column without moving the page.
                        wideCells: [...document.querySelectorAll('main td, main th')].filter(cell => cell.scrollWidth > cell.clientWidth).map(cell => cell.textContent),
                        wideImages: [...document.querySelectorAll('main img')].filter(image => image.getBoundingClientRect().right > (image.closest('article') as Element).getBoundingClientRect().right + 0.5).length,
                    }
                })
                expect(facts.scroll).toBeLessThanOrEqual(0)
                expect(facts.outside).toEqual([])
                expect(facts.wideCells).toEqual([])
                expect(facts.wideImages).toBe(0)

                const fits = async (name: string) => {
                    const box = await page.getByRole('link', { name, exact: true }).boundingBox()
                    expect(box!.x).toBeGreaterThanOrEqual(0)
                    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
                }
                await fits(help.switchLabel)
                await fits(help.button)

                if (width < 1024) {
                    const details = page.locator('details')
                    await details.locator('summary').click()
                    await details.locator('a[href="#sharing"]').click()
                    await expect(page).toHaveURL(/#sharing$/)
                    await expect(page.locator('#sharing')).toBeInViewport()
                }
            })
        })
    }
}

for (const width of [320, 375]) {
    test.describe(`Links to Help at ${width} px`, () => {
        test.use({ viewport: { width, height: 700 } })

        const staysOnScreen = async (page: Page) => {
            expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
        }

        test('the contact page keeps its line and the email address inside the card', async ({ page }) => {
            await page.goto('/contact')
            await expect(page.getByRole('main').getByRole('link', { name: 'Help', exact: true })).toBeVisible()
            await staysOnScreen(page)
            const email = page.getByRole('main').getByRole('link', { name: /@/ })
            const box = await email.boundingBox()
            const card = await email.locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').boundingBox()
            expect(box!.x + box!.width).toBeLessThanOrEqual(card!.x + card!.width)
        })

        test('the profile row fits', async ({ page }) => {
            await mockSession(page, regularUser)
            await mockAllApi(page)
            await page.goto('/profile')
            const row = page.getByRole('main').getByRole('link', { name: /Setup, troubleshooting and common tasks/ })
            await expect(row).toBeVisible()
            await staysOnScreen(page)
            const box = await row.boundingBox()
            expect(box!.x + box!.width).toBeLessThanOrEqual(width)
        })

        test('the wizard link can be clicked', async ({ page, context }) => {
            await mockSession(page, regularUser)
            await mockAllApi(page)
            await page.goto('/')
            await page.locator('button', { hasText: /device/i }).first().click()
            await staysOnScreen(page)
            const [helpTab] = await Promise.all([context.waitForEvent('page'), page.getByRole('link', { name: 'Need help?' }).click()])
            await expect(helpTab).toHaveURL(/#step-power$/)
        })
    })
}

test.describe('Links to Help from the app', () => {
    test('the contact page links to Help', async ({ page }) => {
        await page.goto('/contact')
        await page.getByRole('main').getByRole('link', { name: 'Help', exact: true }).click()
        await expect(page).toHaveURL(/\/(no|en)\/help$/)
    })

    test('the profile page has a Help row', async ({ page }) => {
        await mockSession(page, regularUser)
        await mockAllApi(page)
        await page.goto('/profile')
        await page.getByRole('main').getByRole('link', { name: /Setup, troubleshooting and common tasks/ }).click()
        await expect(page).toHaveURL(/\/(no|en)\/help$/)
    })
})

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
