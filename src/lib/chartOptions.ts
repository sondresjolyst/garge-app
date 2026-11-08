import { format } from 'date-fns';
import type { EChartsCoreOption } from 'echarts/core';

export type ChartType = 'line' | 'bar';

export interface ChartPoint {
    x: number;
    y: number;
}

export interface TimeSeriesOptionsInput {
    title: string;
    data: ChartPoint[];
    type: ChartType;
    integerY: boolean;
    /** True on touch screens. Dragging there scrolls the page, and pinching zooms the chart. */
    touch: boolean;
}

export const SERIES_COLOR = '#008ffb';
const TEXT_COLOR = '#f0f0f0';
const MUTED_COLOR = '#9ca3af';
const GRID_COLOR = 'rgba(240, 240, 240, 0.12)';

/** On a narrow screen a bar chart is drawn as a line, because the bars get too thin to read. */
export function effectiveChartType(type: ChartType, isMobile: boolean): ChartType {
    return isMobile && type === 'bar' ? 'line' : type;
}

export function formatChartValue(value: number, integerY: boolean): string {
    return integerY ? Math.round(value).toString() : value.toFixed(2);
}

export function formatChartTime(timestamp: number): string {
    return format(timestamp, 'dd.MM.yyyy HH:mm');
}

const DAY_MS = 86_400_000;

/**
 * Labels a tick on the time axis. Charts that span two months or more show month names, with the year
 * on January. Shorter charts show the date at midnight and the time of day otherwise.
 */
export function formatAxisTime(tick: number, spanMs: number): string {
    const d = new Date(tick);
    const midnight = d.getHours() === 0 && d.getMinutes() === 0;
    if (spanMs >= 60 * DAY_MS && midnight && d.getDate() === 1) {
        return format(d, d.getMonth() === 0 ? 'MMM yyyy' : 'MMM');
    }
    return format(d, midnight ? 'dd MMM' : 'HH:mm');
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** The tooltip is HTML, so a series name is escaped before it goes in. */
function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, c => HTML_ESCAPES[c]);
}

interface AxisTooltipParam {
    marker: string;
    seriesName: string;
    value: [number, number];
}

export function buildTimeSeriesOptions({ title, data, type, integerY, touch }: TimeSeriesOptionsInput): EChartsCoreOption {
    const xs = data.map(d => d.x);
    const isLine = type === 'line';
    // Bars are centred on their time, so the axis reaches half a step past the first and last bar.
    const gaps = xs.slice(1).map((x, i) => x - xs[i]).filter(g => g > 0);
    const pad = isLine || gaps.length === 0 ? 0 : Math.min(...gaps) / 2;
    // A single point leaves the axis range to ECharts, which centres it.
    const range = xs.length > 1 ? { min: Math.min(...xs) - pad, max: Math.max(...xs) + pad } : {};

    return {
        animation: false,
        backgroundColor: 'transparent',
        color: [SERIES_COLOR],
        textStyle: { color: TEXT_COLOR },
        title: { show: title !== '', text: title, left: 4, top: 4, textStyle: { color: TEXT_COLOR, fontSize: 14 } },
        grid: { left: 8, right: 16, top: title ? 64 : 40, bottom: 8, containLabel: true },
        toolbox: [
            // ECharts only offers box zoom through a toolbox button. This toolbox is placed off screen,
            // and TimeSeriesChart switches the zoom on, so dragging a box always zooms.
            { left: -1000, top: -1000, feature: { dataZoom: { yAxisIndex: 'none' } } },
            {
                right: 8,
                top: 4,
                iconStyle: { borderColor: MUTED_COLOR },
                emphasis: { iconStyle: { borderColor: TEXT_COLOR } },
                feature: { restore: { title: 'Reset zoom' } },
            },
        ],
        // Shift and drag pans on a mouse. On a touch screen a plain drag is left to scroll the page.
        // The wheel zooms only with Ctrl, which is also what a trackpad pinch sends. TimeSeriesChart keeps a plain
        // wheel from reaching the chart, so it scrolls the page.
        dataZoom: [{ type: 'inside', xAxisIndex: 0, filterMode: 'none', moveOnMouseMove: touch ? false : 'shift', zoomOnMouseWheel: 'ctrl' }],
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#111827',
            borderColor: '#374151',
            textStyle: { color: TEXT_COLOR, fontSize: 12 },
            axisPointer: { type: isLine ? 'line' : 'shadow' },
            formatter: (params: AxisTooltipParam[]) => {
                const [p] = params;
                if (!p) return '';
                const [x, y] = p.value;
                return `${formatChartTime(x)}<br/>${p.marker}${escapeHtml(p.seriesName)}: <b>${formatChartValue(y, integerY)}</b>`;
            },
        },
        xAxis: {
            type: 'time',
            ...range,
            axisLabel: {
                color: TEXT_COLOR,
                hideOverlap: true,
                formatter: (tick: number) => formatAxisTime(tick, xs.length > 0 ? Math.max(...xs) - Math.min(...xs) : 0),
            },
            axisLine: { lineStyle: { color: '#4b5563' } },
            splitLine: { show: false },
        },
        yAxis: {
            type: 'value',
            // A line follows its data. Without scale, bars keep zero on the axis, below negative prices too.
            min: integerY ? 0 : undefined,
            scale: isLine && !integerY,
            minInterval: integerY ? 1 : undefined,
            axisLabel: { color: TEXT_COLOR, formatter: (v: number) => formatChartValue(v, integerY) },
            splitLine: { lineStyle: { color: GRID_COLOR } },
        },
        series: [{
            name: title || 'Value',
            type,
            data: data.map(d => [d.x, d.y]),
            smooth: isLine,
            showSymbol: false,
            symbolSize: 10,
            lineStyle: { width: 3 },
            barWidth: '70%',
            itemStyle: { borderRadius: [2, 2, 0, 0] },
        }],
    };
}
