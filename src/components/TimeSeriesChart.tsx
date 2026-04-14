import React, { useMemo } from 'react';
import Chart from "react-apexcharts";
import { ApexOptions } from 'apexcharts';

interface TimeSeriesChartProps {
    title: string;
    data: { x: number, y: number }[];
    chartType?: 'line' | 'bar';
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ title, data, chartType = 'line' }) => {
    const series = useMemo(() => [
        {
            name: title,
            data: data
        }
    ], [title, data]);

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
            foreColor: '#f0f0f0'
        },
        plotOptions: {
            bar: {
                columnWidth: '70%',
                borderRadius: 2
            }
        },
        responsive: [
            {
                breakpoint: 640,
                options: {
                    plotOptions: {
                        bar: {
                            columnWidth: '20%',
                            borderRadius: 1
                        }
                    }
                }
            }
        ],
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
    }), [title, chartType]);

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <Chart options={options} series={series} type={chartType} height={350} />
    );
};

export default TimeSeriesChart;
