/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import ElectricityService from '@/services/electricityService';
import UserService from '@/services/userService';
import Link from 'next/link';
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
    { label: 'Today', key: 'today',  frequency: 'HOURLY',  dateType: 'today',           chartType: 'bar'  as const },
    { label: 'Week',  key: 'week',   frequency: 'DAILY',   dateType: 'last7Days',        chartType: 'bar'  as const },
    { label: 'Month', key: 'month',  frequency: 'DAILY',   dateType: 'firstDayOfMonth',  chartType: 'bar'  as const },
    { label: 'Year',  key: 'year',   frequency: 'MONTHLY', dateType: 'firstDayOfYear',   chartType: 'bar'  as const },
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
            return { x: new Date(ts).getTime(), y: d.price };
        });
};

const ElectricityPage = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('today');
    const [cache, setCache] = useState<Partial<Record<TabKey, { x: number; y: number }[]>>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [priceZone, setPriceZone] = useState<string | null>(null);

    useEffect(() => {
        UserService.getUserProfile().then(u => {
            setPriceZone(u.priceZone || 'NO2');
        }).catch(() => { setPriceZone('NO2'); });
    }, []);

    const loadTab = useCallback(async (tab: TabKey) => {
        if (!priceZone || cache[tab]) return;
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

    const stats = (() => {
        if (data.length === 0) return null;
        const values = data.map(d => d.y);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        return { min, max, avg };
    })();

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Electricity Prices</h1>

            <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl backdrop-blur-sm shadow-lg">
                {/* Header */}
                <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-100">
                            {priceZone
                                ? <>{priceZone} · NOK / kWh</>
                                : <span className="inline-block w-24 h-4 bg-gray-700/60 rounded animate-pulse" />
                            }
                        </h2>
                        {currentPrice !== null && (
                            <p className="text-xs text-gray-500 mt-0.5">Current hour</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">Norwegian price zone · <Link href="/profile#settings" className="text-sky-500 hover:text-sky-400 transition-colors">change in Profile → Settings</Link></p>
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

                {/* Stats bar */}
                {stats && !loading && (
                    <div className="px-5 pb-3 flex gap-3">
                        {[
                            { label: 'Min', value: stats.min },
                            { label: 'Avg', value: stats.avg },
                            { label: 'Max', value: stats.max },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex-1 bg-gray-900/50 rounded-xl px-3 py-2 text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
                                <p className="text-sm font-bold tabular-nums text-gray-100">{value.toFixed(2)}</p>
                                <p className="text-[10px] text-gray-600">kr</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Chart */}
                <div className="px-2 pb-4">
                    {loading ? (
                        <LoadingDots />
                    ) : error ? (
                        <div className="h-[300px] flex items-center justify-center text-red-400 text-sm">{error}</div>
                    ) : data.length > 0 ? (
                        <TimeSeriesChart title="" data={data} chartType={TABS.find(t => t.key === activeTab)!.chartType} />
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
