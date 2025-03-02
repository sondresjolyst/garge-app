"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import SensorService, { Sensor, SensorData } from '@/services/sensorService';
import dynamic from 'next/dynamic';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });

const SensorsPage: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [sensorData, setSensorData] = useState<Record<number, SensorData[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleCards, setVisibleCards] = useState<Record<number, boolean>>({});
    const [interval, setInterval] = useState<number>(30000);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [timeRangeError, setTimeRangeError] = useState<string | null>(null);

    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(defaultStartDate);
    const [endDate, setEndDate] = useState<string>(defaultEndDate);
    const [timeRange, setTimeRange] = useState<string>('');

    const fetchSensors = useCallback(async (startDate?: string, endDate?: string, timeRange?: string) => {
        if (isFetching) return;
        setIsFetching(true);
        try {
            setError(null);
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

            const visibilityMap = sensors.reduce((acc, sensor) => {
                acc[sensor.id] = validDataMap[sensor.id]?.length > 0;
                return acc;
            }, {} as Record<number, boolean>);

            setVisibleCards(visibilityMap);
            setLoading(false);
        } catch (error: any) {
            setError(error.message);
            setLoading(false);
        } finally {
            setIsFetching(false);
        }
    }, [isFetching, startDate, endDate, timeRange]);

    useEffect(() => {
        fetchSensors(startDate, endDate, timeRange);

        const intervalId = window.setInterval(() => {
            fetchSensors(startDate, endDate, timeRange);
        }, interval);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [interval, startDate, endDate, timeRange]);

    const toggleCardVisibility = (sensorId: number) => {
        setVisibleCards(prevState => ({
            ...prevState,
            [sensorId]: !prevState[sensorId],
        }));
    };

    const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newInterval = parseInt(e.target.value, 10);
        setInterval(newInterval);
    };

    const handleFetchData = () => {
        const isValid = /^(\d+)([mhdwy])$/.test(timeRange);
        if (isValid || timeRange === '') {
            setTimeRangeError(null);
            fetchSensors(startDate, endDate, timeRange);
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
        <div>
            <h1>Sensors</h1>
            <div className="uk-margin">
                <label htmlFor="interval-select">Update Interval:</label>
                <select id="interval-select" className="uk-select" onChange={handleIntervalChange} value={interval}>
                    <option value={10000}>10 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={300000}>5 minutes</option>
                </select>
            </div>
            <div className="uk-margin">
                <label htmlFor="start-date">Start Date:</label>
                <input
                    type="date"
                    id="start-date"
                    className="uk-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>
            <div className="uk-margin">
                <label htmlFor="end-date">End Date:</label>
                <input
                    type="date"
                    id="end-date"
                    className="uk-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
            <div className="uk-margin">
                <label htmlFor="time-range">Time Range:</label>
                <input
                    type="text"
                    id="time-range"
                    className="uk-input"
                    placeholder="e.g., 1h, 30m, 1d"
                    value={timeRange}
                    onChange={handleTimeRangeChange}
                />
                {timeRangeError && <p className="uk-text-danger">{timeRangeError}</p>}
            </div>
            <button className="uk-button uk-button-primary" onClick={handleFetchData}>Fetch Data</button>
            <div className="uk-child-width-1-3@m uk-grid-small uk-grid-match" uk-grid="true">
                {sensorsWithData.map(sensor => (
                    <div key={sensor.id}>
                        <div className="uk-card uk-card-default uk-card-hover">
                            <div className="uk-card-header">
                                <h3 className="uk-card-title uk-text-truncate" onClick={() => toggleCardVisibility(sensor.id)}>
                                    {sensor.name}
                                </h3>
                            </div>
                            {visibleCards[sensor.id] && (
                                <div className="uk-card-body">
                                    <TimeSeriesChart sensorData={sensorData[sensor.id]} fetchData={handleFetchData} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {sensorsWithoutData.length > 0 && (
                <div className="uk-margin-top">
                    <h2>Sensors without data</h2>
                    <ul className="uk-list uk-list-divider">
                        {sensorsWithoutData.map(sensor => (
                            <li key={sensor.id}>{sensor.name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SensorsPage;
