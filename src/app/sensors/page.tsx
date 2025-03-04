"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import SensorService, { Sensor, SensorData } from '@/services/sensorService';
import dynamic from 'next/dynamic';
import debounce from 'lodash/debounce';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });

const SensorsPage: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [sensorData, setSensorData] = useState<Record<number, SensorData[]>>({});
    const [loading, setLoading] = useState(true);
    const [interval, setInterval] = useState<number>(60000); // Default to 1 minute
    const [timeRangeError, setTimeRangeError] = useState<string | null>(null);

    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(defaultStartDate);
    const [endDate, setEndDate] = useState<string>(defaultEndDate);
    const [timeRange, setTimeRange] = useState<string>('');

    const fetchSensors = useCallback(async (startDate?: string, endDate?: string, timeRange?: string): Promise<void> => {
        try {
            const sensors = await SensorService.getAllSensors();
            setSensors(sensors);

            const sensorIds = sensors.map(sensor => sensor.id);
            const dataMap = await SensorService.getMultipleSensorsData(sensorIds, startDate, endDate, timeRange);

            const validDataMap = Object.fromEntries(
                Object.entries(dataMap).map(([key, dataArray]) => [
                    key,
                    dataArray.filter(data => data.timestamp != null && data.value != null),
                ])
            );

            setSensorData(validDataMap);
            setLoading(false);
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'An unknown error occurred');
            setLoading(false);
        }
    }, []);

    const debouncedFetchSensors = useCallback(
        debounce((startDate?: string, endDate?: string, timeRange?: string) => fetchSensors(startDate, endDate, timeRange), 500),
        [fetchSensors]
    );

    const fetchData = useCallback((): Promise<void> => {
        return new Promise((resolve) => {
            debouncedFetchSensors(startDate, endDate, timeRange);
            resolve();
        });
    }, [debouncedFetchSensors, startDate, endDate, timeRange]);

    useEffect(() => {
        fetchData();

        const intervalId = window.setInterval(() => {
            fetchData();
        }, interval);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [interval, startDate, endDate, timeRange, fetchData]);

    const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newInterval = parseInt(e.target.value, 10);
        setInterval(newInterval);
    };

    const handleFetchData = () => {
        const isValid = /^(\d+)([mhdwy])$/.test(timeRange);
        if (isValid || timeRange === '') {
            setTimeRangeError(null);
            fetchData();
        } else {
            setTimeRangeError('Invalid time range format. Use format like 1h, 30m, 1d, etc.');
        }
    };

    const handleTimeRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTimeRange(e.target.value);
    };

    const sensorsWithData = useMemo(() => sensors.filter(sensor => sensorData[sensor.id]?.length > 0), [sensors, sensorData]);
    const sensorsWithoutData = useMemo(() => sensors.filter(sensor => !sensorData[sensor.id] || sensorData[sensor.id].length === 0), [sensors, sensorData]);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="p-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Sensors</h1>
            <div className="my-4">
                <label htmlFor="interval-select" className="block mb-2">Update Interval:</label>
                <select id="interval-select" className="block w-full p-2 border rounded bg-gray-800 text-gray-200" onChange={handleIntervalChange} value={interval}>
                    <option value={10000}>10 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={300000}>5 minutes</option>
                </select>
            </div>
            <div className="my-4">
                <label htmlFor="start-date" className="block mb-2">Start Date:</label>
                <input
                    type="date"
                    id="start-date"
                    className="block w-full p-2 border rounded bg-gray-800 text-gray-200"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>
            <div className="my-4">
                <label htmlFor="end-date" className="block mb-2">End Date:</label>
                <input
                    type="date"
                    id="end-date"
                    className="block w-full p-2 border rounded bg-gray-800 text-gray-200"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
            <div className="my-4">
                <label htmlFor="time-range" className="block mb-2">Time Range:</label>
                <input
                    type="text"
                    id="time-range"
                    className="block w-full p-2 border rounded bg-gray-800 text-gray-200"
                    placeholder="e.g., 1h, 30m, 1d"
                    value={timeRange}
                    onChange={handleTimeRangeChange}
                />
                {timeRangeError && <p className="text-red-500">{timeRangeError}</p>}
            </div>
            <button className="bg-gray-600 text-gray-200 px-4 py-2 rounded" onClick={handleFetchData}>Fetch Data</button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {sensorsWithData.map(sensor => (
                    <div key={sensor.id} className="bg-gray-800 text-gray-200 shadow-md rounded-lg overflow-auto">
                        <div className="p-4">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                                {sensor.name}
                            </h3>
                        </div>
                        <div className="p-4">
                            <TimeSeriesChart sensorName={sensor.name} sensorData={sensorData[sensor.id]} fetchData={fetchData} />
                        </div>
                    </div>
                ))}
            </div>
            {sensorsWithoutData.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Sensors without data</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        {sensorsWithoutData.map(sensor => (
                            <li key={sensor.id} className="text-gray-200">{sensor.name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SensorsPage;
