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
    const [fetching, setFetching] = useState(false);
    const [interval, setInterval] = useState<number>(60000 * 5);
    const [timeRangeError, setTimeRangeError] = useState<string | null>(null);
    const [average, setAverage] = useState<boolean>(true);
    const [groupBy, setGroupBy] = useState<string>('5m');

    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(defaultStartDate);
    const [endDate, setEndDate] = useState<string>(defaultEndDate);
    const [timeRange, setTimeRange] = useState<string>('');

    const fetchSensors = useCallback(async (startDate?: string, endDate?: string, timeRange?: string, average?: boolean, groupBy?: string): Promise<void> => {
        try {
            setFetching(true);
            const sensors = await SensorService.getAllSensors();
            setSensors(sensors);

            const sensorIds = sensors.map(sensor => sensor.id);
            const dataMap = await SensorService.getMultipleSensorsData(sensorIds, startDate, endDate, timeRange, average, groupBy);

            const validDataMap = Object.fromEntries(
                Object.entries(dataMap).map(([key, dataArray]) => [
                    key,
                    dataArray.filter(data => data.timestamp != null && data.value != null),
                ])
            );

            const filteredDataMap = Object.fromEntries(
                Object.entries(validDataMap).map(([key, dataArray]) => [
                    key,
                    dataArray.filter((data, index, self) =>
                        index === self.findIndex((t) => (
                            t.timestamp === data.timestamp
                        ))
                    )
                ])
            );

            setSensorData(filteredDataMap);
            setLoading(false);
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'An unknown error occurred');
            setLoading(false);
        } finally {
            setFetching(false);
        }
    }, [endDate]);

    const debouncedFetchSensors = useCallback(
        debounce((startDate?: string, endDate?: string, timeRange?: string, average?: boolean, groupBy?: string) => fetchSensors(startDate, endDate, timeRange, average, groupBy), 500),
        [fetchSensors]
    );

    const fetchData = useCallback((): Promise<void> => {
        return new Promise((resolve) => {
            debouncedFetchSensors(startDate, endDate, timeRange, average, groupBy);
            resolve();
        });
    }, [debouncedFetchSensors, startDate, endDate, timeRange, average, groupBy]);

    useEffect(() => {
        fetchData();

        const intervalId = window.setInterval(() => {
            fetchData();
        }, interval);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [interval, startDate, endDate, timeRange, average, groupBy, fetchData]);

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
        const value = e.target.value;
        setTimeRange(value);

        const isValid = /^(\d+)([mhdwy])$/.test(value);
        if (isValid || value === '') {
            setTimeRangeError(null);
        } else {
            setTimeRangeError('Invalid time range format. Use format like 1h, 30m, 1d, etc.');
        }
    };

    const handleAverageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setAverage(e.target.value === 'true');
    };

    const handleGroupByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGroupBy(e.target.value);
    };

    const sensorsWithData = useMemo(() => sensors.filter(sensor => sensorData[sensor.id]?.length > 0), [sensors, sensorData]);
    const sensorsWithoutData = useMemo(() => sensors.filter(sensor => !sensorData[sensor.id] || sensorData[sensor.id].length === 0), [sensors, sensorData]);

    const processData = (data: SensorData[]) => {
        const MAX_DATA_POINTS = 1000;
        if (data.length > MAX_DATA_POINTS) {
            const step = Math.ceil(data.length / MAX_DATA_POINTS);
            return data.filter((_, index) => index % step === 0).map(d => ({
                x: new Date(d.timestamp).getTime(),
                y: d.value
            }));
        }
        return data.map(d => ({
            x: new Date(d.timestamp).getTime(),
            y: d.value
        }));
    };

    if (loading) {
        return <p>Sensors loading...</p>;
    }

    return (
        <div className="p-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Sensors</h1>
            <div className="my-4">
                <label htmlFor="interval-select" className="block mb-2">Update Interval:</label>
                <select id="interval-select" className="block w-full p-2 border rounded bg-gray-800 text-gray-200" onChange={handleIntervalChange} value={interval}>
                    <option value={60000}>1 minute</option>
                    <option value={300000}>5 minutes</option>
                    <option value={600000}>10 minutes</option>
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
            <div className="my-4">
                <label htmlFor="average-select" className="block mb-2">Enable average:</label>
                <select id="average-select" className="block w-full p-2 border rounded bg-gray-800 text-gray-200" onChange={handleAverageChange} value={average ? 'true' : 'false'}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            </div>
            <div className="my-4">
                <label htmlFor="groupby-select" className="block mb-2">Group by:</label>
                <select id="groupby-select" className="block w-full p-2 border rounded bg-gray-800 text-gray-200" onChange={handleGroupByChange} value={groupBy}>
                    <option value="">None</option>
                    <option value="5m">5 minutes</option>
                    <option value="10m">10 minutes</option>
                    <option value="30m">30 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="2h">2 hours</option>
                    <option value="1d">1 day</option>
                </select>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    className={`bg-gray-600 text-gray-200 px-4 py-2 rounded ${fetching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleFetchData}
                    disabled={fetching}
                >
                    Fetch Data
                </button>
                {fetching && (
                    <svg className="text-gray-300 animate-spin ml-4" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                        <path
                            d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                            stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path
                            d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                            stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
                        </path>
                    </svg>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {sensorsWithData.map(sensor => (
                    <div key={sensor.id} className="bg-gray-800 text-gray-200 shadow-md rounded-lg overflow-hidden">
                        <div className="p-4">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                                {sensor.name}
                            </h3>
                        </div>
                        <div className="p-4">
                            <TimeSeriesChart title={sensor.name} data={processData(sensorData[sensor.id])} />
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
