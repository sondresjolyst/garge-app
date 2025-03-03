import React, { useMemo } from 'react';
import Chart from "react-apexcharts";
import { SensorData } from '@/services/sensorService';
import { ApexOptions } from 'apexcharts';

interface TimeSeriesChartProps {
    sensorName: string;
    sensorData: SensorData[];
    fetchData: () => Promise<void>;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ sensorName, sensorData }) => {
    const series = useMemo(() => [
        {
            name: sensorName,
            data: sensorData.map((data) => ({
                x: new Date(data.timestamp).toLocaleString(),
                y: data.value
            }))
        }
    ], [sensorName, sensorData]);

    const options: ApexOptions = useMemo(() => ({
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
    }), [sensorName]);

    if (!sensorData || sensorData.length === 0) {
        return null;
    }

    return (
        <Chart options={options} series={series} type="line" height={350} />
    );
};

export default TimeSeriesChart;
