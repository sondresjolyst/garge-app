import React, { useMemo } from 'react';
import Chart from "react-apexcharts";
import { ApexOptions } from 'apexcharts';

interface TimeSeriesChartProps {
    title: string;
    data: { x: number, y: number }[];
    chartType?: 'line' | 'bar';
}

// Minimum pixels per bar to keep bars readable on mobile
const MIN_BAR_WIDTH_PX = 24;

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ title, data, chartType = 'line' }) => {
    const series = useMemo(() => [
        {
            name: title,
            data: data
        }
    ], [title, data]);

    // Compute a minimum chart width so bars never get thinner than MIN_BAR_WIDTH_PX.
    // ApexCharts will make the plot area scrollable horizontally when the viewport
    // is narrower than this value.
    const minScrollWidth = useMemo(() => {
        if (chartType !== 'bar' || data.length <= 10) return undefined;
        return data.length * MIN_BAR_WIDTH_PX;
    }, [chartType, data.length]);

    const options: ApexOptions = useMemo(() => ({
        chart: {
            type: chartType,
            height: 350,
            animations: {
                enabled: false
            },
            toolbar: {
                show: true,
                tools: {
                    download: false,
                    zoom: true,
                    pan: true,
                    reset: true,
                    zoomin: true,
                    zoomout: true
                }
            },
            foreColor: '#f0f0f0',
            ...(minScrollWidth ? {
                scrollablePlotArea: {
                    minWidth: minScrollWidth,
                    scrollWidth: minScrollWidth,
                    offsetX: 0
                }
            } : {})
        },
        plotOptions: {
            bar: {
                columnWidth: '70%',
                borderRadius: 2
            }
        },
        title: {
            text: title,
            align: 'left',
            style: {
                color: '#f0f0f0'
            }
        },
        xaxis: {
            type: 'datetime',
            labels: {
                datetimeUTC: false,
                style: {
                    colors: '#f0f0f0'
                },
                // Fewer x-axis labels on small screens to reduce crowding
                hideOverlappingLabels: true,
                rotate: -30,
                rotateAlways: false,
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#f0f0f0'
                },
                formatter: (value) => value.toFixed(2)
            }
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            theme: 'dark',
            style: {
                fontSize: '12px',
                fontFamily: undefined,
                background: '#111827',
                color: '#f0f0f0'
            },
            x: {
                format: 'dd.MM.yyyy HH:mm:ss'
            }
        }
    }), [title, chartType, minScrollWidth]);

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="overflow-x-auto w-full">
            <div style={{ minWidth: minScrollWidth ?? '100%' }}>
                <Chart options={options} series={series} type={chartType} height={350} />
            </div>
        </div>
    );
};

export default TimeSeriesChart;
