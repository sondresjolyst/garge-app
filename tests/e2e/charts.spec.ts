import { test, expect } from '@playwright/test'
import { openElectricity, resetButtonCentre, seriesPixels, settled } from './helpers/charts'

test.describe('Charts', () => {
    test('electricity prices draw as bars', async ({ page }) => {
        await openElectricity(page)
        await expect.poll(() => seriesPixels(page)).toBeGreaterThan(1000)
    })

    test('dragging a box zooms in and reset zoom shows the whole day again', async ({ page }) => {
        const canvas = await openElectricity(page)
        await expect.poll(() => seriesPixels(page)).toBeGreaterThan(1000)
        const box = (await canvas.boundingBox())!
        const whole = await settled(page)

        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 10 })
        await page.mouse.up()
        await page.mouse.move(box.x + box.width + 20, box.y - 20)
        await expect.poll(async () => (await canvas.screenshot()).equals(whole)).toBe(false)

        const reset = await resetButtonCentre(page)
        await page.mouse.click(reset.x, reset.y)
        await page.mouse.move(box.x + box.width + 20, box.y - 20)
        await expect.poll(async () => (await settled(page)).equals(whole)).toBe(true)

        // Box zoom still works after a reset.
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 10 })
        await page.mouse.up()
        await page.mouse.move(box.x + box.width + 20, box.y - 20)
        await expect.poll(async () => (await canvas.screenshot()).equals(whole)).toBe(false)
    })

    test('a plain mouse wheel over the chart scrolls the page and leaves the zoom', async ({ page }) => {
        const canvas = await openElectricity(page)
        await expect.poll(() => seriesPixels(page)).toBeGreaterThan(1000)
        await page.setViewportSize({ width: 1280, height: 600 })
        const whole = await settled(page)
        // Scrolled down first, so a wheel up has page to scroll back. On a chart it would zoom in.
        const top = (await canvas.boundingBox())!.y
        await page.evaluate(y => window.scrollBy(0, y), top - 100)
        const box = (await canvas.boundingBox())!
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        const start = await page.evaluate(() => window.scrollY)
        await page.mouse.wheel(0, -100)
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(start)
        await page.evaluate(() => window.scrollTo(0, 0))
        expect((await settled(page)).equals(whole)).toBe(true)
    })

    test('Ctrl and the mouse wheel zoom the chart', async ({ page }) => {
        const canvas = await openElectricity(page)
        await expect.poll(() => seriesPixels(page)).toBeGreaterThan(1000)
        const whole = await settled(page)
        const box = (await canvas.boundingBox())!
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.keyboard.down('Control')
        await page.mouse.wheel(0, -300)
        await page.keyboard.up('Control')
        await page.mouse.move(box.x + box.width + 20, box.y - 20)
        await expect.poll(async () => (await settled(page)).equals(whole)).toBe(false)
    })
})
