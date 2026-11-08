import { expect, Page } from '@playwright/test'
import { mockSession, mockApi, regularUser } from './auth'

// Today's hourly prices in NO2, shaped like the API answer: a morning and an evening peak.
export function todaysPrices() {
    const midnight = new Date()
    midnight.setHours(0, 0, 0, 0)
    const values = Array.from({ length: 24 }, (_, h) => {
        const start = new Date(midnight.getTime() + h * 3_600_000)
        const end = new Date(start.getTime() + 3_600_000)
        const value = 0.6 + Math.exp(-((h - 8) ** 2) / 4) * 0.5 + Math.exp(-((h - 18) ** 2) / 5) * 0.7
        return { value, spotValue: value, start: start.toISOString(), end: end.toISOString() }
    })
    return { areas: { NO2: { values } } }
}

export async function openElectricity(page: Page) {
    await mockSession(page, regularUser)
    await mockApi(page, '/users/*/profile', { id: regularUser.id, email: regularUser.email, priceZone: 'NO2' })
    await page.route('**/electricity/prices?*', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(todaysPrices()) }))
    await page.goto('/electricity')
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()
    return canvas
}

/** Counts the pixels drawn in the series colour, #008ffb, to tell whether bars are on the canvas. */
export async function seriesPixels(page: Page) {
    return page.locator('canvas').first().evaluate((c: HTMLCanvasElement) => {
        const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
        let n = 0
        for (let i = 0; i < data.length; i += 4) {
            if (Math.abs(data[i] - 0x00) < 10 && Math.abs(data[i + 1] - 0x8f) < 10 && Math.abs(data[i + 2] - 0xfb) < 10) n++
        }
        return n
    })
}

/** Waits until two canvas screenshots in a row match, so the chart has finished drawing, and returns the last one. */
export async function settled(page: Page) {
    const canvas = page.locator('canvas').first()
    let last = await canvas.screenshot()
    for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(100)
        const next = await canvas.screenshot()
        if (next.equals(last)) return next
        last = next
    }
    throw new Error('chart kept changing')
}

/** Finds the reset zoom button, drawn on the canvas in grey in the top right corner, and returns its centre. */
export async function resetButtonCentre(page: Page) {
    const canvas = page.locator('canvas').first()
    const box = (await canvas.boundingBox())!
    const centre = await canvas.evaluate((c: HTMLCanvasElement) => {
        const ratio = c.width / c.getBoundingClientRect().width
        const w = Math.round(80 * ratio), h = Math.round(60 * ratio)
        const { data } = c.getContext('2d')!.getImageData(c.width - w, 0, w, h)
        let sx = 0, sy = 0, n = 0
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 100 && Math.abs(data[i] - 0x9c) < 30 && Math.abs(data[i + 1] - 0xa3) < 30 && Math.abs(data[i + 2] - 0xaf) < 30) {
                const p = i / 4
                sx += p % w
                sy += Math.floor(p / w)
                n++
            }
        }
        return n ? { x: (c.width - w + sx / n) / ratio, y: sy / n / ratio } : null
    })
    expect(centre, 'reset zoom button is drawn').not.toBeNull()
    return { x: box.x + centre!.x, y: box.y + centre!.y }
}
