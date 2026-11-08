import { describe, it, expect } from 'vitest'
import {
    buildTimeSeriesOptions,
    effectiveChartType,
    formatChartTime,
    formatChartValue,
    formatAxisTime,
    SERIES_COLOR,
    type TimeSeriesOptionsInput,
} from '@/lib/chartOptions'

// Loose shape of the option object, enough to read the parts the tests check.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Options = Record<string, any>

const data = [
    { x: new Date(2026, 10, 8, 10, 0).getTime(), y: 12.345 },
    { x: new Date(2026, 10, 8, 11, 0).getTime(), y: 3 },
    { x: new Date(2026, 10, 8, 12, 0).getTime(), y: 7.5 },
]

function build(overrides: Partial<TimeSeriesOptionsInput> = {}): Options {
    return buildTimeSeriesOptions({ title: '', data, type: 'line', integerY: false, touch: false, ...overrides }) as Options
}

describe('effectiveChartType', () => {
    it('draws a bar chart as a line on a narrow screen', () => {
        expect(effectiveChartType('bar', true)).toBe('line')
    })

    it('keeps a bar chart on a wide screen', () => {
        expect(effectiveChartType('bar', false)).toBe('bar')
    })

    it('keeps a line chart on a narrow screen', () => {
        expect(effectiveChartType('line', true)).toBe('line')
    })
})

describe('formatChartValue', () => {
    it('shows two decimals', () => {
        expect(formatChartValue(12.345, false)).toBe('12.35')
        expect(formatChartValue(3, false)).toBe('3.00')
    })

    it('rounds to a whole number with integerY', () => {
        expect(formatChartValue(12.6, true)).toBe('13')
    })
})

describe('formatChartTime', () => {
    it('formats as dd.MM.yyyy HH:mm in local time', () => {
        expect(formatChartTime(new Date(2026, 0, 5, 7, 3).getTime())).toBe('05.01.2026 07:03')
    })
})

describe('formatAxisTime', () => {
    const DAY = 86_400_000

    it('shows the time of day within a day', () => {
        expect(formatAxisTime(new Date(2026, 10, 8, 14, 30).getTime(), DAY)).toBe('14:30')
    })

    it('shows the date at midnight', () => {
        expect(formatAxisTime(new Date(2026, 10, 8).getTime(), DAY)).toBe('08 Nov')
    })

    it('shows the date on the first of a month in a short chart', () => {
        expect(formatAxisTime(new Date(2026, 10, 1).getTime(), 7 * DAY)).toBe('01 Nov')
    })

    it('shows the month name in a chart of two months or more', () => {
        expect(formatAxisTime(new Date(2026, 1, 1).getTime(), 60 * DAY)).toBe('Feb')
    })

    it('adds the year to January in a long chart', () => {
        expect(formatAxisTime(new Date(2026, 0, 1).getTime(), 300 * DAY)).toBe('Jan 2026')
    })

    it('shows the date for a mid-month tick in a long chart', () => {
        expect(formatAxisTime(new Date(2026, 1, 15).getTime(), 300 * DAY)).toBe('15 Feb')
    })
})

describe('buildTimeSeriesOptions', () => {
    it('plots each point as [time, value] in the series colour', () => {
        const o = build()
        expect(o.color).toEqual([SERIES_COLOR])
        expect(o.series[0].data).toEqual(data.map(d => [d.x, d.y]))
    })

    it('draws the requested chart type', () => {
        expect(build({ type: 'bar' }).series[0].type).toBe('bar')
        expect(build({ type: 'line' }).series[0].type).toBe('line')
    })

    it('smooths a line and leaves bars square', () => {
        expect(build({ type: 'line' }).series[0].smooth).toBe(true)
        expect(build({ type: 'bar' }).series[0].smooth).toBe(false)
    })

    it('fits the time axis to the first and last point', () => {
        const o = build()
        expect(o.xAxis.type).toBe('time')
        expect(o.xAxis.min).toBe(data[0].x)
        expect(o.xAxis.max).toBe(data[2].x)
    })

    it('widens the time axis by half a step on each side of a bar chart', () => {
        const o = build({ type: 'bar' })
        expect(o.xAxis.min).toBe(data[0].x - 1_800_000)
        expect(o.xAxis.max).toBe(data[2].x + 1_800_000)
    })

    it('leaves the time axis to ECharts for a single point', () => {
        for (const type of ['line', 'bar'] as const) {
            const o = build({ type, data: [data[0]] })
            expect(o.xAxis.min).toBeUndefined()
            expect(o.xAxis.max).toBeUndefined()
        }
    })

    it('labels the time axis from the span of the data', () => {
        const f = build().xAxis.axisLabel.formatter
        expect(f(new Date(2026, 10, 8, 11, 0).getTime())).toBe('11:00')
        expect(f(new Date(2026, 10, 9).getTime())).toBe('09 Nov')
    })

    it('leaves the time axis open when there is no data', () => {
        const o = build({ data: [] })
        expect(o.xAxis.min).toBeUndefined()
        expect(o.xAxis.max).toBeUndefined()
    })

    it('lets a line chart scale to its data', () => {
        const o = build({ type: 'line' })
        expect(o.yAxis.min).toBeUndefined()
        expect(o.yAxis.scale).toBe(true)
    })

    it('keeps zero on a bar chart axis without cutting off negative values', () => {
        const o = build({ type: 'bar' })
        expect(o.yAxis.min).toBeUndefined()
        expect(o.yAxis.scale).toBe(false)
    })

    it('uses whole steps from zero with integerY', () => {
        const o = build({ integerY: true })
        expect(o.yAxis.min).toBe(0)
        expect(o.yAxis.minInterval).toBe(1)
        expect(o.yAxis.scale).toBe(false)
        expect(o.yAxis.axisLabel.formatter(4.6)).toBe('5')
    })

    it('labels the y axis with two decimals by default', () => {
        expect(build().yAxis.axisLabel.formatter(4.6)).toBe('4.60')
    })

    it('shows the title only when one is given', () => {
        expect(build({ title: '' }).title.show).toBe(false)
        const o = build({ title: 'Users over time' })
        expect(o.title.show).toBe(true)
        expect(o.title.text).toBe('Users over time')
        expect(o.series[0].name).toBe('Users over time')
    })

    it('places the box zoom toolbox off screen and shows only the reset button', () => {
        const [hidden, visible] = build().toolbox
        expect(Object.keys(hidden.feature)).toEqual(['dataZoom'])
        expect(hidden.left).toBeLessThan(0)
        expect(hidden.top).toBeLessThan(0)
        expect(Object.keys(visible.feature)).toEqual(['restore'])
        expect(visible.feature.restore.title).toBe('Reset zoom')
    })

    it('pans with Shift and drag on a mouse', () => {
        expect(build({ touch: false }).dataZoom[0].moveOnMouseMove).toBe('shift')
    })

    it('zooms with the wheel only while Ctrl is held, so the page still scrolls', () => {
        expect(build().dataZoom[0].zoomOnMouseWheel).toBe('ctrl')
    })

    it('leaves a plain drag to scroll the page on a touch screen', () => {
        expect(build({ touch: true }).dataZoom[0].moveOnMouseMove).toBe(false)
    })

    it('shows the time and the formatted value in the tooltip', () => {
        const o = build({ title: 'Price' })
        const html = o.tooltip.formatter([{ marker: '<i></i>', seriesName: 'Price', value: [data[0].x, 12.345] }])
        expect(html).toBe('08.11.2026 10:00<br/><i></i>Price: <b>12.35</b>')
    })

    it('escapes the series name in the tooltip', () => {
        const html = build().tooltip.formatter([{ marker: '', seriesName: '<img src=x onerror=alert(1)>', value: [data[0].x, 1] }])
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
        expect(html).not.toContain('<img')
    })

    it('rounds the tooltip value with integerY', () => {
        const o = build({ integerY: true })
        expect(o.tooltip.formatter([{ marker: '', seriesName: 'Value', value: [data[0].x, 12.6] }])).toContain('<b>13</b>')
    })

    it('returns an empty tooltip when no series is under the pointer', () => {
        expect(build().tooltip.formatter([])).toBe('')
    })
})
