/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import ElectricityService from '@/services/electricityService';
import dynamic from 'next/dynamic';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });

const getDate = (type: string) => {
    const date = new Date();
    switch (type) {
        case 'last7Days':
            date.setDate(date.getDate() - 7);
            date.setHours(0, 0, 0, 0);
            break;
        case 'today':
            date.setHours(0, 0, 0, 0);
            break;
        case 'tomorrow':
            date.setDate(date.getDate() + 1);
            date.setHours(0, 0, 0, 0);
            break;
        case 'firstDayOfMonth':
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            break;
        case 'firstDayOfYear':
            date.setMonth(0);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            break;
        default:
            break;
    }
    return date;
};

const ElectricityPage = () => {
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [hourlyData, setHourlyData] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [yearlyData, setYearlyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (type: string, frequency: string, setData: React.Dispatch<React.SetStateAction<any[]>>, dateType: string) => {
        try {
            const startDate = getDate(dateType);
            const endDate = getDate('tomorrow');
            const fetchedData = await ElectricityService.getElectricityData(frequency, 'NO2', endDate.toISOString());
            const filteredData = fetchedData.filter((d: any) => new Date(d.time) >= startDate && new Date(d.time) < endDate);
            const processedData = filteredData.map((d: any) => {
                const ts = d.time.endsWith('Z') ? d.time : d.time + 'Z';
                return {
                    x: new Date(ts).getTime(),
                    y: d.price / 1000
                }
            });
            setData(processedData);
            console.log('Processed data:', processedData);
        } catch {
            setError(`Failed to fetch ${type} electricity data`);
        }
    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            await fetchData('daily', 'DAILY', setDailyData, 'last7Days');
            await fetchData('hourly', 'HOURLY', setHourlyData, 'today');
            await fetchData('monthly', 'DAILY', setMonthlyData, 'firstDayOfMonth');
            await fetchData('yearly', 'MONTHLY', setYearlyData, 'firstDayOfYear');
            setLoading(false);
        };
        fetchAllData();
    }, [fetchData]);

    if (loading) {
        return <p>Electricity Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div className="p-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Electricity Prices</h1>
            <div className="my-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Today</h2>
                <TimeSeriesChart title="Today" data={hourlyData} chartType="bar" />
            </div>
            <div className="my-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Last 7 Days</h2>
                <TimeSeriesChart title="Electricity Prices for the Last 7 Days" data={dailyData} chartType="bar" />
            </div>
            <div className="my-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">This Month</h2>
                <TimeSeriesChart title="Electricity Prices for This Month" data={monthlyData} chartType="bar" />
            </div>
            <div className="my-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">This Year</h2>
                <TimeSeriesChart title="Electricity Prices for This Year" data={yearlyData} chartType="bar" />
            </div>
        </div>
    );
};

export default ElectricityPage;
