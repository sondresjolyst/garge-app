"use client"

import React, { useEffect, useState } from 'react';
import SensorService, { Sensor, SensorData } from '@/services/sensorService';
import TimeSeriesChart from '@/components/TimeSeriesChart';

const SensorsPage: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [sensorData, setSensorData] = useState<Record<number, SensorData[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleCards, setVisibleCards] = useState<Record<number, boolean>>({});
    const [interval, setInterval] = useState<number>(10000);

    useEffect(() => {
        const fetchSensors = async () => {
            try {
                const sensors = await SensorService.getAllSensors();
                setSensors(sensors);

                const dataPromises = sensors.map(sensor =>
                    SensorService.getSensorData(sensor.id).then(data => ({ sensorId: sensor.id, data }))
                );

                const dataResults = await Promise.all(dataPromises);
                const dataMap = dataResults.reduce((acc, { sensorId, data }) => {
                    acc[sensorId] = data;
                    return acc;
                }, {} as Record<number, SensorData[]>);

                setSensorData(dataMap);

                const visibilityMap = sensors.reduce((acc, sensor) => {
                    acc[sensor.id] = dataMap[sensor.id].length > 0;
                    return acc;
                }, {} as Record<number, boolean>);

                setVisibleCards(visibilityMap);
                setLoading(false);
            } catch (error: any) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchSensors();

        const intervalId = window.setInterval(fetchSensors, interval);

        return () => window.clearInterval(intervalId);
    }, [interval]);

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

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="uk-text-danger">{error}</p>;
    }

    const sensorsWithData = sensors.filter(sensor => sensorData[sensor.id]?.length > 0);
    const sensorsWithoutData = sensors.filter(sensor => !sensorData[sensor.id] || sensorData[sensor.id].length === 0);

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
            <div className="uk-child-width-1-3@m uk-grid-small uk-grid-match" uk-grid="true">
                {sensorsWithData.map(sensor => (
                    <div key={sensor.id}>
                        <div className="uk-card uk-card-default uk-card-hover">
                            <div className="uk-card-header">
                                <h3 className="uk-card-title" onClick={() => toggleCardVisibility(sensor.id)}>
                                    {sensor.name}
                                </h3>
                            </div>
                            {visibleCards[sensor.id] && (
                                <div className="uk-card-body">
                                    <TimeSeriesChart sensorName={sensor.name} sensorData={sensorData[sensor.id]} />
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