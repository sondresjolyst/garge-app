import { test, expect, Page } from '@playwright/test'
import { openElectricity, seriesPixels, settled } from './helpers/charts'

// Chromium only offers touch events to a page when started with them, and ECharts checks for them as it loads.
test.use({ viewport: { width: 400, height: 700 }, hasTouch: true, isMobile: true, launchOptions: { args: ['--touch-events=enabled'] } })

test.describe('Charts on a touch screen', () => {

    /** Returns a function that sends touch events. One session keeps the touch going from start to end. */
    async function toucher(page: Page) {
        const cdp = await page.context().newCDPSession(page)
        return (type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]) =>
            cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, id) => ({ ...p, id })) })
    }

    test('a one finger swipe over a zoomed chart scrolls the page', async ({ page }) => {
        const canvas = await openElectricity(page)
        await expect.poll(() => seriesPixels(page)).toBeGreaterThan(500)
        await canvas.scrollIntoViewIfNeeded()
        const touch = await toucher(page)
        let box = (await canvas.boundingBox())!
        // Zoomed in first, because a chart that could pan would take the swipe.
        const cx = box.x + box.width / 2, cy = box.y + box.height / 2
        const at = (d: number) => [{ x: cx - d, y: cy }, { x: cx + d, y: cy }]
        await touch('touchStart', at(20))
        for (let d = 25; d <= 120; d += 5) await touch('touchMove', at(d))
        await touch('touchEnd', [])
        await settled(page)
        const start = await page.evaluate(() => window.scrollY)
        box = (await canvas.boundingBox())!
        const x = box.x + box.width / 2
        const y = box.y + box.height - 20
        await touch('touchStart', [{ x, y }])
        for (let i = 1; i <= 10; i++) await touch('touchMove', [{ x, y: y - i * 25 }])
        await touch('touchEnd', [])
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(start + 50)
    })

    test('a pinch over the chart zooms the chart and not the page', async ({ page }) => {
        const canvas = await openElectricity(page)
        await expect.poll(() => seriesPixels(page)).toBeGreaterThan(500)
        await canvas.scrollIntoViewIfNeeded()
        const whole = await settled(page)
        const touch = await toucher(page)
        const box = (await canvas.boundingBox())!
        const cx = box.x + box.width / 2, cy = box.y + box.height / 2
        const at = (d: number) => [{ x: cx - d, y: cy }, { x: cx + d, y: cy }]
        await touch('touchStart', at(20))
        for (let d = 25; d <= 120; d += 5) await touch('touchMove', at(d))
        await touch('touchEnd', [])
        await expect.poll(async () => (await settled(page)).equals(whole)).toBe(false)
        expect(await page.evaluate(() => window.visualViewport!.scale)).toBe(1)
    })
})
