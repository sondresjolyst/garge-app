import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render } from '@testing-library/react'

// A stand-in for an ECharts instance. jsdom has no canvas, so the tests check what the component asks of the chart.
const { init, instance } = vi.hoisted(() => {
    const handlers: Record<string, () => void> = {}
    const instance = {
        handlers,
        disposed: false,
        isDisposed: vi.fn(() => instance.disposed),
        setOption: vi.fn(),
        dispatchAction: vi.fn(),
        on: vi.fn((event: string, fn: () => void) => { handlers[event] = fn }),
        off: vi.fn((event: string) => { delete handlers[event] }),
        resize: vi.fn(),
        dispose: vi.fn(() => { instance.disposed = true }),
    }
    return { instance, init: vi.fn(() => instance) }
})
vi.mock('@/lib/echarts', () => ({ default: { init } }))

import TimeSeriesChart from '@/components/TimeSeriesChart'

const data = [
    { x: new Date(2026, 10, 8, 10).getTime(), y: 1 },
    { x: new Date(2026, 10, 8, 11).getTime(), y: 2 },
]

const BOX_ZOOM_ON = { type: 'takeGlobalCursor', key: 'dataZoomSelect', dataZoomSelectActive: true }

function setTouch(touch: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: touch && query === '(pointer: coarse)' }))
}

function setWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lastOption = (): Record<string, any> => instance.setOption.mock.calls.at(-1)![0]

beforeEach(() => {
    vi.clearAllMocks()
    instance.disposed = false
    for (const k of Object.keys(instance.handlers)) delete instance.handlers[k]
    setTouch(false)
    setWidth(1280)
    window.ResizeObserver = class {
        observe = vi.fn()
        disconnect = vi.fn()
    } as unknown as typeof ResizeObserver
})

afterEach(() => {
    setWidth(1024)
})

describe('TimeSeriesChart', () => {
    it('renders nothing and starts no chart without data', () => {
        const { container } = render(<TimeSeriesChart title="" data={[]} />)
        expect(container).toBeEmptyDOMElement()
        expect(init).not.toHaveBeenCalled()
    })

    it('starts one chart and draws the series', () => {
        render(<TimeSeriesChart title="" data={data} />)
        expect(init).toHaveBeenCalledTimes(1)
        expect(lastOption().series[0].data).toEqual(data.map(d => [d.x, d.y]))
        expect(instance.setOption.mock.calls.at(-1)![1]).toBe(true)
    })

    it('requests box zoom with a mouse', () => {
        render(<TimeSeriesChart title="" data={data} />)
        expect(instance.dispatchAction).toHaveBeenCalledWith(BOX_ZOOM_ON, { silent: true })
    })

    it('requests box zoom again after reset zoom', () => {
        render(<TimeSeriesChart title="" data={data} />)
        instance.dispatchAction.mockClear()
        instance.handlers.restore()
        expect(instance.dispatchAction).toHaveBeenCalledWith(BOX_ZOOM_ON, { silent: true })
    })

    it('does not request box zoom or pan on a touch screen', () => {
        setTouch(true)
        render(<TimeSeriesChart title="" data={data} />)
        expect(instance.dispatchAction).not.toHaveBeenCalled()
        expect(instance.on).not.toHaveBeenCalled()
        expect(lastOption().dataZoom[0].moveOnMouseMove).toBe(false)
    })

    it('draws a bar chart as bars on a wide screen', () => {
        render(<TimeSeriesChart title="" data={data} chartType="bar" />)
        expect(lastOption().series[0].type).toBe('bar')
    })

    it('draws a bar chart as a line under 640 px', () => {
        setWidth(400)
        render(<TimeSeriesChart title="" data={data} chartType="bar" />)
        expect(lastOption().series[0].type).toBe('line')
    })

    it('redraws with new data without starting a second chart', () => {
        const { rerender } = render(<TimeSeriesChart title="" data={data} />)
        const next = [...data, { x: new Date(2026, 10, 8, 12).getTime(), y: 3 }]
        rerender(<TimeSeriesChart title="" data={next} />)
        expect(init).toHaveBeenCalledTimes(1)
        expect(lastOption().series[0].data).toHaveLength(3)
    })

    it('does not redraw, and so keeps the zoom, when re-rendered with the same data', () => {
        const { rerender } = render(<TimeSeriesChart title="" data={data} />)
        const calls = instance.setOption.mock.calls.length
        rerender(<TimeSeriesChart title="" data={data} />)
        expect(instance.setOption).toHaveBeenCalledTimes(calls)
    })

    it('keeps a plain wheel from the chart so the page scrolls', () => {
        const { container } = render(<TimeSeriesChart title="" data={data} />)
        const plot = container.firstElementChild!.firstElementChild!
        const seen = vi.fn()
        plot.addEventListener('wheel', seen)
        fireEvent.wheel(plot, { deltaY: 100 })
        expect(seen).not.toHaveBeenCalled()
    })

    it('passes Ctrl and wheel to the chart so it zooms', () => {
        const { container } = render(<TimeSeriesChart title="" data={data} />)
        const plot = container.firstElementChild!.firstElementChild!
        const seen = vi.fn()
        plot.addEventListener('wheel', seen)
        fireEvent.wheel(plot, { deltaY: -100, ctrlKey: true })
        expect(seen).toHaveBeenCalledTimes(1)
    })

    it('starts the chart once data arrives', () => {
        const { rerender } = render(<TimeSeriesChart title="" data={[]} />)
        rerender(<TimeSeriesChart title="" data={data} />)
        expect(init).toHaveBeenCalledTimes(1)
        expect(lastOption().series[0].data).toHaveLength(2)
    })

    it('disposes the chart on unmount without touching it afterwards', () => {
        const { unmount } = render(<TimeSeriesChart title="" data={data} />)
        unmount()
        expect(instance.dispose).toHaveBeenCalledTimes(1)
        expect(instance.off).not.toHaveBeenCalled()
    })

    it('swaps the reset listener when the options change', () => {
        const { rerender } = render(<TimeSeriesChart title="" data={data} />)
        const first = instance.handlers.restore
        rerender(<TimeSeriesChart title="" data={[...data]} />)
        expect(instance.off).toHaveBeenCalledWith('restore', first)
        expect(instance.on).toHaveBeenCalledTimes(2)
    })
})
