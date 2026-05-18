"use client"

import React, { useState, useEffect, useCallback } from 'react';
import ElectricityService, { type ElectricityData } from '@/services/electricityService';
import UserService from '@/services/userService';
import { pickCurrentSlot } from '@/lib/electricitySlot';
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

interface ChartEntry { x: number; xEnd: number; y: number; }

const toUtcDate = (s: string) => new Date(s.endsWith('Z') ? s : s + 'Z');

const fetchTabData = async (frequency: string, dateType: string, zone: string): Promise<ChartEntry[]> => {
    const tomorrow = getDate('tomorrow');
    const startDate = getDate(dateType);
    const raw = await ElectricityService.getElectricityData(frequency, zone, tomorrow.toISOString());
    return raw
        .filter((d: ElectricityData) => {
            const t = toUtcDate(d.start);
            if (frequency === 'MONTHLY' && t.getUTCDate() !== 1) return false;
            return t >= startDate && t < tomorrow;
        })
        .map((d: ElectricityData) => ({
            x: toUtcDate(d.start).getTime(),
            xEnd: toUtcDate(d.end).getTime(),
            y: d.price,
        }));
};

const ElectricityPage = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('today');
    const [cache, setCache] = useState<Partial<Record<TabKey, ChartEntry[]>>>({});
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
        const slot = pickCurrentSlot(data, Date.now());
        return slot ? slot.y : null;
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
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">

            {/* ── Page header ──────────────────────────────────────────────────── */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-100">Electricity Prices</h1>
            </div>

            <div className="flex flex-col gap-5">

                {/* ── Current price hero + zone meta row ───────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-4">

                    {/* Current price — prominent hero stat, only shown on Today tab */}
                    {currentPrice !== null && (
                        <div className="flex-1 bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[110px]">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current hour</p>
                            <div className="mt-2 flex items-end gap-2">
                                <span className="text-5xl font-bold tabular-nums text-gray-100 leading-none">
                                    {currentPrice.toFixed(2)}
                                </span>
                                <span className="text-base text-gray-400 mb-1">kr/kWh</span>
                            </div>
                            {priceZone && (
                                <span className="mt-2 self-start text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">{priceZone}</span>
                            )}
                        </div>
                    )}

                    {/* Stats — min / avg / max */}
                    {stats && !loading && (
                        <div className="flex-1 bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-5 shadow-lg">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                {activeTab === 'today' ? 'Today' : activeTab === 'week' ? 'Last 7 days' : activeTab === 'month' ? 'This month' : 'This year'}
                                {' '}· NOK / kWh
                            </p>
                            <div className="grid grid-cols-3 divide-x divide-gray-700/50">
                                {([
                                    { label: 'Min', value: stats.min },
                                    { label: 'Avg', value: stats.avg },
                                    { label: 'Max', value: stats.max },
                                ] as const).map(({ label, value }) => (
                                    <div key={label} className="px-4 first:pl-0 last:pr-0 flex flex-col gap-0.5">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                                        <p className="text-2xl font-semibold tabular-nums text-gray-100 leading-tight">
                                            {value.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-600">kr</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* When Today tab but still loading — placeholder keeps layout stable */}
                    {activeTab === 'today' && loading && currentPrice === null && (
                        <div className="flex-1 bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-5 shadow-lg min-h-[110px] flex items-center justify-center">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0ms]" />
                                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:150ms]" />
                                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Chart card ───────────────────────────────────────────────── */}
                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl shadow-lg overflow-hidden">

                    {/* Tab selector */}
                    <div className="px-5 pt-5 pb-4">
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

                    {/* Chart body */}
                    <div className="px-2 pb-4">
                        {loading ? (
                            <LoadingDots />
                        ) : error ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <span className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                                    {error}
                                </span>
                            </div>
                        ) : data.length > 0 ? (
                            <TimeSeriesChart title="" data={data.map(d => ({ x: d.x, y: d.y }))} chartType={TABS.find(t => t.key === activeTab)!.chartType} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">
                                No data available
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Price zone footer ─────────────────────────────────────────── */}
                <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-gray-400">Price zone:</span>
                    {priceZone ? (
                        <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">{priceZone}</span>
                    ) : (
                        <span className="inline-block w-10 h-5 bg-gray-700/60 rounded-full animate-pulse" />
                    )}
                    <Link
                        href="/profile#settings"
                        className="text-xs text-gray-400 bg-gray-700/60 hover:bg-gray-700 border border-gray-600/40 px-2 py-0.5 rounded-full transition-colors"
                    >
                        Change
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default ElectricityPage;
