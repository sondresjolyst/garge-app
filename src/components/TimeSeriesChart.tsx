import React, { useMemo } from 'react';
import Chart from "react-apexcharts";
import { SensorData } from '@/services/sensorService';
import { ApexOptions } from 'apexcharts';

interface TimeSeriesChartProps {
    sensorName: string;
    sensorData: SensorData[];
    fetchData: () => Promise<void>;
}

const MAX_DATA_POINTS = 1000;

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ sensorName, sensorData }) => {

    const processedData = useMemo(() => {
        if (sensorData.length > MAX_DATA_POINTS) {
            const step = Math.ceil(sensorData.length / MAX_DATA_POINTS);
            return sensorData.filter((_, index) => index % step === 0).map(data => ({
                x: new Date(data.timestamp).getTime(),
                y: data.value
            }));
        }
        return sensorData.map(data => ({
            x: new Date(data.timestamp).getTime(),
            y: data.value
        }));
    }, [sensorData]);

    const series = useMemo(() => [
        {
            name: sensorName,
            data: processedData
        }
    ], [sensorName, processedData]);

    const options: ApexOptions = useMemo(() => ({
        chart: {
            type: 'line',
            height: 350,
            animations: {
                enabled: false
            },
            foreColor: '#f0f0f0'
        },
        title: {
            text: sensorName,
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
                }
            }
        },
        yaxis: {
            title: {
                text: 'Value',
                style: {
                    color: '#f0f0f0'
                }
            },
            labels: {
                style: {
                    colors: '#f0f0f0'
                },
                formatter: (value) => value.toFixed(2)
            }
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
                format: 'dd MMM yyyy HH:mm:ss'
            }
        }
    }), [sensorName]);

    if (!processedData || processedData.length === 0) {
        return null;
    }

    return (
        <Chart options={options} series={series} type="line" height={350} />
    );
};

export default TimeSeriesChart;
