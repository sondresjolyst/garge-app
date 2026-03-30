"use client"

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import SensorService, { Sensor, SensorData, BatteryHealthData } from '@/services/sensorService';
import dynamic from 'next/dynamic';
import debounce from 'lodash/debounce';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });

const statusConfig: Record<string, { color: string; label: string }> = {
    good:      { color: 'bg-green-600',  label: 'Battery good' },
    attention: { color: 'bg-yellow-500', label: 'Battery attention' },
    replace:   { color: 'bg-red-600',    label: 'Replace battery' },
    learning:  { color: 'bg-gray-500',   label: 'Battery learning' },
};

const BatteryHealthBadge: React.FC<{ health: BatteryHealthData }> = ({ health }) => {
    const cfg = statusConfig[health.status] ?? statusConfig.learning;
    return (
        <span className={`ml-2 inline-block text-xs font-normal px-2 py-0.5 rounded-full text-white ${cfg.color}`}>
            {cfg.label}{health.status !== 'learning' && health.dropPct > 0 ? ` (${health.dropPct.toFixed(1)}% drop)` : ''}
        </span>
    );
};

const SensorsPage: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [sensorData, setSensorData] = useState<Record<number, SensorData[]>>({});
    const [batteryHealthMap, setBatteryHealthMap] = useState<Record<string, BatteryHealthData>>({});
    const [loading, setLoading] = useState(true);
    const [interval, setInterval] = useState<number>(60000 * 5);
    const [timeRangeError, setTimeRangeError] = useState<string | null>(null);
    const [groupBy, setGroupBy] = useState<string>('5m');

    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState<string>(defaultStartDate);
    const [endDate, setEndDate] = useState<string>(defaultEndDate);
    const [timeRange, setTimeRange] = useState<string>('');

    const [pageNumber] = useState(1);
    const [pageSize] = useState(5000);

    const fetchAllSensorData = async (sensorIds: number[], startDate?: string, endDate?: string, timeRange?: string, groupBy?: string, pageSize: number = 100): Promise<SensorData[]> => {
        let allData: SensorData[] = [];
        let pageNumber = 1;
        let totalCount = 0;

        do {
            const pagedResponse = await SensorService.getMultipleSensorsData(
                sensorIds, startDate, endDate, timeRange, groupBy, pageNumber, pageSize
            );
            const pageData = pagedResponse.data;
            allData = allData.concat(pageData);
            totalCount = pagedResponse.totalCount;
            pageNumber++;

            if (pageData.length === 0) break;
        } while (allData.length < totalCount);

        return allData;
    };

    const fetchSensors = useCallback(async (startDate?: string, endDate?: string, timeRange?: string, groupBy?: string): Promise<void> => {
        try {
            const allSensors = await SensorService.getAllSensors();
            allSensors.sort((a, b) => {
                const nameA = (a.customName ?? a.defaultName ?? '').toLowerCase();
                const nameB = (b.customName ?? b.defaultName ?? '').toLowerCase();
                return nameA.localeCompare(nameB);
            });

            const batterySensors = allSensors.filter(s => s.type === 'battery');
            const displaySensors = allSensors.filter(s => s.type !== 'battery');
            setSensors(displaySensors);

            // Fetch latest battery health per battery sensor, keyed by parentName for badge lookup
            const healthMap: Record<string, BatteryHealthData> = {};
            await Promise.all(batterySensors.map(async s => {
                try {
                    const health = await SensorService.getBatteryHealthLatest(s.name);
                    healthMap[s.parentName] = health;
                } catch {
                    // No health data yet — badge will be omitted
                }
            }));
            setBatteryHealthMap(healthMap);

            const sensorIds = displaySensors.map(sensor => sensor.id);
            const allSensorData = await fetchAllSensorData(sensorIds, startDate, endDate, timeRange, groupBy, pageSize);

            const dataMap: Record<number, SensorData[]> = {};
            allSensorData.forEach((data) => {
                if (!dataMap[data.sensorId]) {
                    dataMap[data.sensorId] = [];
                }
                dataMap[data.sensorId].push(data);
            })

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
        }
    }, [endDate, pageNumber, pageSize]);

    const debouncedFetchSensors = useCallback(
        debounce((startDate?: string, endDate?: string, timeRange?: string, groupBy?: string) => fetchSensors(startDate, endDate, timeRange, groupBy), 500),
        [fetchSensors]
    );

    const fetchData = useCallback((): Promise<void> => {
        return new Promise((resolve) => {
            debouncedFetchSensors(startDate, endDate, timeRange, groupBy);
            resolve();
        });
    }, [debouncedFetchSensors, startDate, endDate, timeRange, groupBy]);

    useEffect(() => {
        fetchData();

        const intervalId = window.setInterval(() => {
            fetchData();
        }, interval);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [interval, startDate, endDate, timeRange, groupBy, fetchData]);

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

    const handleGroupByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGroupBy(e.target.value);
    };

    const sensorsWithData = useMemo(() => sensors.filter(sensor => sensorData[sensor.id]?.length > 0), [sensors, sensorData]);
    const sensorsWithoutData = useMemo(() => sensors.filter(sensor => !sensorData[sensor.id] || sensorData[sensor.id].length === 0), [sensors, sensorData]);

    const processData = (data: SensorData[]) => {
        const MAX_DATA_POINTS = 750;
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

    if (!loading && sensors.length === 0) {
        return (
            <div className="mt-8 text-center text-gray-400">
                <p>No sensors assigned yet.</p>
                <p>
                    You can add your own sensors on the <a href="/profile" className="text-blue-400 underline">profile page</a>.
                </p>
            </div>
        );
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
            <button className="gargeBtnActive" onClick={handleFetchData}>Fetch Data</button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {sensorsWithData.map(sensor => (
                    <div key={sensor.id} className="bg-gray-800 text-gray-200 shadow-md rounded-lg overflow-hidden">
                        <div className="p-4">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                                {sensor.customName ?? sensor.defaultName}
                                {batteryHealthMap[sensor.parentName] && (
                                    <BatteryHealthBadge health={batteryHealthMap[sensor.parentName]} />
                                )}
                            </h3>
                            {batteryHealthMap[sensor.parentName]?.lastChargedAt && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Last charged: {new Date(batteryHealthMap[sensor.parentName].lastChargedAt!).toLocaleString()}
                                </p>
                            )}
                        </div>
                        <div className="p-4">
                            <TimeSeriesChart title="" data={processData(sensorData[sensor.id])} />
                        </div>
                    </div>
                ))}
            </div>
            {sensorsWithoutData.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Sensors without data</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        {sensorsWithoutData.map(sensor => (
                            <li key={sensor.id} className="text-gray-200 overflow-hidden">{sensor.customName ?? sensor.defaultName}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SensorsPage;
