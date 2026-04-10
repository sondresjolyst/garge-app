/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import ElectricityService from '@/services/electricityService';
import UserService from '@/services/userService';
import dynamic from 'next/dynamic';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });

const LoadingDots = () => (
    <div className="h-[300px] flex items-center justify-center">
        <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:300ms]" />
        </div>
    </div>
);

const TABS = [
    { label: 'Today', key: 'today',  frequency: 'HOURLY',  dateType: 'today'          },
    { label: 'Week',  key: 'week',   frequency: 'DAILY',   dateType: 'last7Days'      },
    { label: 'Month', key: 'month',  frequency: 'DAILY',   dateType: 'firstDayOfMonth' },
    { label: 'Year',  key: 'year',   frequency: 'MONTHLY', dateType: 'firstDayOfYear' },
] as const;

type TabKey = typeof TABS[number]['key'];

const getDate = (type: string) => {
    const date = new Date();
    switch (type) {
        case 'last7Days':        date.setDate(date.getDate() - 7); date.setHours(0, 0, 0, 0); break;
        case 'today':            date.setHours(0, 0, 0, 0);        break;
        case 'tomorrow':         date.setDate(date.getDate() + 1);  date.setHours(0, 0, 0, 0); break;
        case 'firstDayOfMonth':  date.setDate(1);                   date.setHours(0, 0, 0, 0); break;
        case 'firstDayOfYear':   date.setMonth(0); date.setDate(1); date.setHours(0, 0, 0, 0); break;
    }
    return date;
};

const fetchTabData = async (frequency: string, dateType: string, zone: string): Promise<{ x: number; y: number }[]> => {
    const tomorrow = getDate('tomorrow');
    const startDate = getDate(dateType);
    const raw = await ElectricityService.getElectricityData(frequency, zone, tomorrow.toISOString());
    return raw
        .filter((d: any) => {
            const ts = d.time.endsWith('Z') ? d.time : d.time + 'Z';
            const t = new Date(ts);
            return t >= startDate && t < tomorrow;
        })
        .map((d: any) => {
            const ts = d.time.endsWith('Z') ? d.time : d.time + 'Z';
            return { x: new Date(ts).getTime(), y: d.price / 1000 };
        });
};

const ElectricityPage = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('today');
    const [cache, setCache] = useState<Partial<Record<TabKey, { x: number; y: number }[]>>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [priceZone, setPriceZone] = useState<string>('NO2');

    useEffect(() => {
        UserService.getUserProfile().then(u => {
            if (u.priceZone) setPriceZone(u.priceZone);
        }).catch(() => {});
    }, []);

    const loadTab = useCallback(async (tab: TabKey) => {
        if (cache[tab]) return;
        setLoading(true);
        setError(null);
        try {
            const { frequency, dateType } = TABS.find(t => t.key === tab)!;
            const data = await fetchTabData(frequency, dateType, priceZone);
            setCache(prev => ({ ...prev, [tab]: data }));
        } catch {
            setError('Failed to fetch electricity data');
        } finally {
            setLoading(false);
        }
    }, [cache, priceZone]);

    useEffect(() => {
        setCache({});
    }, [priceZone]);

    useEffect(() => {
        loadTab(activeTab);
    }, [activeTab, loadTab]);

    const data = cache[activeTab] ?? [];

    const currentPrice = (() => {
        if (activeTab !== 'today' || data.length === 0) return null;
        const now = Date.now();
        return data.reduce((prev, curr) =>
            Math.abs(curr.x - now) < Math.abs(prev.x - now) ? curr : prev
        ).y;
    })();

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Electricity Prices</h1>

            <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl backdrop-blur-sm shadow-lg">
                {/* Header */}
                <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-100">{priceZone} · NOK / kWh</h2>
                        {currentPrice !== null && (
                            <p className="text-xs text-gray-500 mt-0.5">Current hour</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">Norwegian price zone · change in Profile → Settings</p>
                    </div>
                    {currentPrice !== null && (
                        <div className="text-right">
                            <span className="text-2xl font-bold text-white tabular-nums">
                                {currentPrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-400 ml-0.5">kr</span>
                        </div>
                    )}
                </div>

                {/* Tab selector */}
                <div className="px-5 pb-3">
                    <div className="flex gap-1 bg-gray-900/60 rounded-xl p-1">
                        {TABS.map(({ label, key }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === key
                                        ? 'bg-sky-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart */}
                <div className="px-2 pb-4">
                    {loading ? (
                        <LoadingDots />
                    ) : error ? (
                        <div className="h-[300px] flex items-center justify-center text-red-400 text-sm">{error}</div>
                    ) : data.length > 0 ? (
                        <TimeSeriesChart title="" data={data} chartType="bar" />
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">
                            No data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ElectricityPage;
