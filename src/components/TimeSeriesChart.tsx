import React from 'react';
import Chart from 'react-apexcharts';
import { SensorData } from '@/services/sensorService';
import { ApexOptions } from 'apexcharts';

interface TimeSeriesChartProps {
    sensorName: string;
    sensorData: SensorData[];
    interval: number;
    fetchData: () => Promise<void>;
}

const TimeSeriesChart = ({ sensorName, sensorData }: TimeSeriesChartProps) => {
    if (!sensorData || sensorData.length === 0) {
        return null;
    }

    const series = [
        {
            name: sensorName,
            data: sensorData.map((data) => ({
                x: new Date(data.timestamp).toLocaleString(),
                y: parseFloat(data.value)
            }))
        }
    ];

    const options: ApexOptions = {
        chart: {
            type: 'line',
            height: 350,
            animations: {
                enabled: false
            }
        },
        title: {
            text: sensorName,
            align: 'left'
        },
        xaxis: {
            type: 'datetime'
        },
        yaxis: {
            title: {
                text: 'Value'
            }
        }
    };

    return (
        <Chart options={options} series={series} type="line" height={350} />
    );
};

export default TimeSeriesChart;
