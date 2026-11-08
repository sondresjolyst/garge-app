import React, { useMemo, useState, useEffect, useRef } from 'react';
import echarts from '@/lib/echarts';
import { buildTimeSeriesOptions, effectiveChartType, type ChartPoint } from '@/lib/chartOptions';

interface TimeSeriesChartProps {
    title: string;
    data: ChartPoint[];
    chartType?: 'line' | 'bar';
    integerY?: boolean;
}

type Chart = ReturnType<typeof echarts.init>;

/**
 * ECharts' zoom takes every wheel event over the chart, even ones it does not zoom on, so the page would stop
 * scrolling under the cursor. Stopping a plain wheel before it reaches the chart lets the page scroll. Ctrl and
 * wheel, which a trackpad pinch also sends, still reaches the chart and zooms.
 */
function passWheelToPage(event: React.WheelEvent) {
    if (!event.ctrlKey) event.stopPropagation();
}

/** Turns on box zoom, so dragging over the chart zooms into the marked span. */
function enableBoxZoom(chart: Chart) {
    chart.dispatchAction({ type: 'takeGlobalCursor', key: 'dataZoomSelect', dataZoomSelectActive: true }, { silent: true });
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ title, data, chartType = 'line', integerY = false }) => {
    const [isMobile, setIsMobile] = useState(false);
    // The chart only renders in the browser (pages load it with ssr: false), so window is there.
    const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches);
    const container = useRef<HTMLDivElement>(null);
    const chart = useRef<Chart | null>(null);
    const hasData = data.length > 0;

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // On mobile, always use a line chart regardless of the requested type
    const effectiveType = effectiveChartType(chartType, isMobile);

    const options = useMemo(
        () => buildTimeSeriesOptions({ title, data, type: effectiveType, integerY, touch }),
        [title, data, effectiveType, integerY, touch],
    );

    useEffect(() => {
        if (!hasData || !container.current) return;
        const instance = echarts.init(container.current);
        chart.current = instance;
        const resize = new ResizeObserver(() => instance.resize());
        resize.observe(container.current);
        return () => {
            resize.disconnect();
            instance.dispose();
            chart.current = null;
        };
    }, [hasData]);

    useEffect(() => {
        const instance = chart.current;
        if (!instance) return;
        instance.setOption(options, true);
        // A touch screen keeps a plain drag for scrolling the page, so box zoom stays off there.
        if (touch) return;
        enableBoxZoom(instance);
        // Reset zoom rebuilds the chart from its options and turns box zoom off again.
        const onRestore = () => enableBoxZoom(instance);
        instance.on('restore', onRestore);
        // On unmount the chart is already disposed, and its listeners went with it.
        return () => { if (!instance.isDisposed()) instance.off('restore', onRestore); };
    }, [options, touch, hasData]);

    if (!hasData) {
        return null;
    }

    return (
        <div className="overflow-hidden w-full" onWheelCapture={passWheelToPage}>
            <div ref={container} className="h-[350px] w-full" />
        </div>
    );
};

export default TimeSeriesChart;
