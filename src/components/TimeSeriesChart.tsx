import React, { useMemo, useState, useEffect } from 'react';
import Chart from "react-apexcharts";
import { ApexOptions } from 'apexcharts';

interface TimeSeriesChartProps {
    title: string;
    data: { x: number, y: number }[];
    chartType?: 'line' | 'bar';
    integerY?: boolean;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ title, data, chartType = 'line', integerY = false }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // On mobile, always use a line chart regardless of the requested type
    const effectiveType = isMobile && chartType === 'bar' ? 'line' : chartType;

    const series = useMemo(() => [
        {
            name: title,
            data: data
        }
    ], [title, data]);

    const options: ApexOptions = useMemo(() => ({
        chart: {
            type: effectiveType,
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
            foreColor: '#f0f0f0'
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
                hideOverlappingLabels: true
            },
            crosshairs: {
                show: true
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#f0f0f0'
                },
                formatter: (value) => integerY ? Math.round(value).toString() : value.toFixed(2)
            },
            ...(integerY && { min: 0, forceNiceScale: true }),
        },
        stroke: {
            curve: 'smooth',
            width: effectiveType === 'line' ? 3 : 0
        },
        markers: {
            size: effectiveType === 'line' ? 0 : 0,
            hover: {
                size: effectiveType === 'line' ? 5 : 0
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            theme: 'dark',
            shared: true,
            intersect: false,
            style: {
                fontSize: '12px',
                fontFamily: undefined,
                background: '#111827',
                color: '#f0f0f0'
            },
            x: {
                format: 'dd.MM.yyyy HH:mm'
            }
        }
    }), [title, effectiveType]);

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="overflow-hidden w-full">
            <Chart options={options} series={series} type={effectiveType} height={350} />
        </div>
    );
};

export default TimeSeriesChart;
