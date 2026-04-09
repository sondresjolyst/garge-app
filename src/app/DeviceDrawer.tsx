'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TYPE_CONFIG as typeConfig, DEFAULT_TYPE as defaultType, BATTERY_STATUS_CONFIG as statusConfig } from '@/lib/typeConfig';
import { unitForType, typeLabel } from '@/lib/typeUtils';
import { RANGE_OPTIONS, type RangeIndex } from '@/lib/constants';
import LoadingDots from '@/components/LoadingDots';
import SensorService, { SensorData, BatteryHealthData } from '@/services/sensorService';
import { formatDateTime } from '@/lib/dateUtils';
import type { UnifiedDevice } from './DeviceDashboard';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });

interface DeviceDrawerProps {
    device: UnifiedDevice;
    onClose: () => void;
}

const DeviceDrawer: React.FC<DeviceDrawerProps> = ({ device, onClose }) => {
    const [chartData, setChartData] = useState<{ x: number; y: number }[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [activeRange, setActiveRange] = useState<RangeIndex>(2);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 280);
    }, [onClose]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [handleClose]);

    const fetchChart = useCallback(async (rangeIdx: RangeIndex) => {
        if (device.kind !== 'sensor') return;
        setLoadingChart(true);
        const { timeRange, groupBy } = RANGE_OPTIONS[rangeIdx];
        try {
            let allData: SensorData[] = [];
            let page = 1;
            let total = 0;
            do {
                const resp = await SensorService.getMultipleSensorsData(
                    [device.id], undefined, undefined, timeRange, groupBy, page, 5000
                );
                allData = allData.concat(resp.data);
                total = resp.totalCount;
                page++;
                if (resp.data.length === 0) break;
            } while (allData.length < total);

            const unique = allData.filter(
                (d, i, self) =>
                    d.timestamp != null && d.value != null &&
                    i === self.findIndex(t => t.timestamp === d.timestamp)
            );
            const MAX = 750;
            const step = unique.length > MAX ? Math.ceil(unique.length / MAX) : 1;
            setChartData(
                unique
                    .filter((_, i) => i % step === 0)
                    .map(d => ({ x: new Date(d.timestamp).getTime(), y: Number(d.value) }))
            );
        } catch {
            setChartData([]);
        } finally {
            setLoadingChart(false);
        }
    }, [device.id, device.kind]);

    useEffect(() => {
        if (device.kind === 'sensor') fetchChart(activeRange);
    }, [device, activeRange, fetchChart]);

    const { Icon, iconBg, iconColor } = typeConfig[device.type.toLowerCase()] ?? defaultType;
    const health = device.batteryHealth as BatteryHealthData | undefined;
    const healthCfg = health ? (statusConfig[health.status] ?? statusConfig.learning) : null;

    const latestValueStr = device.kind === 'sensor' && device.latestValue !== undefined
        ? `${Number(device.latestValue).toFixed(device.type === 'voltage' ? 2 : 1)} ${unitForType(device.type)}`
        : null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />

            {/* Drawer */}
            <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-gray-950/98 backdrop-blur-xl border-l border-gray-700/50 z-50 overflow-y-auto shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Sticky header */}
                <div className="sticky top-0 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/60 px-5 py-4 flex items-center gap-3 z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-100 truncate">{device.displayName}</h2>
                        <p className="text-xs text-gray-500">{typeLabel(device.type)}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 p-1.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-all"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-5 py-5 pb-28 space-y-6">

                    {/* Current value — sensor */}
                    {device.kind === 'sensor' && latestValueStr && (
                        <div className="flex items-end gap-3 flex-wrap">
                            <span className="text-5xl font-bold text-white tabular-nums">{latestValueStr}</span>
                            {healthCfg && (
                                <div className="mb-1.5 flex items-center gap-1.5">
                                    <healthCfg.Icon className={`h-5 w-5 ${healthCfg.color}`} />
                                    <span className={`text-sm font-medium ${healthCfg.color}`}>{healthCfg.label}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Current state — socket */}
                    {device.kind === 'socket' && (
                        <div className="flex items-center gap-3">
                            <span className={`text-5xl font-bold tabular-nums ${
                                device.latestState === 'ON'  ? 'text-green-400' :
                                device.latestState === 'OFF' ? 'text-red-400'   : 'text-gray-500'
                            }`}>
                                {device.latestState === 'ON' ? 'On' : device.latestState === 'OFF' ? 'Off' : 'Unknown'}
                            </span>
                            <span className={`w-3 h-3 rounded-full ${
                                device.latestState === 'ON'
                                    ? 'bg-green-400 shadow-[0_0_8px_3px_rgba(74,222,128,0.4)]'
                                    : 'bg-gray-600'
                            }`} />
                        </div>
                    )}

                    {/* Sensor: range selector + chart */}
                    {device.kind === 'sensor' && (
                        <>
                            <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1">
                                {RANGE_OPTIONS.map((opt, idx) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => setActiveRange(idx as RangeIndex)}
                                        className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-all duration-200 ${
                                            activeRange === idx
                                                ? 'bg-sky-600 text-white shadow-sm'
                                                : 'text-gray-400 hover:text-gray-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {loadingChart ? (
                                <LoadingDots />
                            ) : chartData.length > 0 ? (
                                <TimeSeriesChart title="" data={chartData} />
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                                    No data for this period
                                </div>
                            )}
                        </>
                    )}

                    {/* Battery health details */}
                    {health && healthCfg && (
                        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-gray-300">Battery Health</h3>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`font-medium ${healthCfg.color}`}>{healthCfg.label}</span>
                                </div>
                                {health.status !== 'learning' && health.dropPct > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Daily drop</span>
                                        <span className="text-gray-200 font-medium">{health.dropPct.toFixed(1)}%</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Last charged</span>
                                    <span className="text-gray-200 font-medium text-right">
                                        {health.lastChargedAt
                                            ? formatDateTime(health.lastChargedAt)
                                            : 'No charge recorded yet'}
                                    </span>
                                </div>
                                {health.chargesRecorded > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Charges recorded</span>
                                        <span className="text-gray-200 font-medium">{health.chargesRecorded}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Last seen */}
                    {device.latestTimestamp && (
                        <p className="text-xs text-gray-600 text-center pb-2">
                            Last seen {formatDateTime(device.latestTimestamp)}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default DeviceDrawer;
