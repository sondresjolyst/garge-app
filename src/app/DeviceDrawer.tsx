'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { XMarkIcon, PencilIcon, CheckIcon, CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TYPE_CONFIG as typeConfig, DEFAULT_TYPE as defaultType, BATTERY_STATUS_CONFIG as statusConfig } from '@/lib/typeConfig';
import { unitForType, typeLabel } from '@/lib/typeUtils';
import { RANGE_OPTIONS, type RangeIndex } from '@/lib/constants';
import LoadingDots from '@/components/LoadingDots';
import SensorService, { SensorData, BatteryHealthData } from '@/services/sensorService';
import SwitchService, { SwitchData } from '@/services/switchService';
import { formatDateTime } from '@/lib/dateUtils';
import SensorPhotoService from '@/services/sensorPhotoService';
import { compressImage } from '@/lib/imageUtils';
import { toast } from 'sonner';
import ActivitiesSection from '@/components/ActivitiesSection';
import type { UnifiedDevice } from './DeviceDashboard';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });

interface DeviceDrawerProps {
    device: UnifiedDevice;
    onClose: () => void;
}

// ── Socket timeline helpers ───────────────────────────────────────────────────

interface Segment { start: number; end: number; on: boolean; }

function buildSegments(events: SwitchData[], rangeStart: number, rangeEnd: number): Segment[] {
    if (events.length === 0) return [];
    const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const segments: Segment[] = [];
    for (let i = 0; i < sorted.length; i++) {
        const start = Math.max(new Date(sorted[i].timestamp).getTime(), rangeStart);
        const end = i + 1 < sorted.length
            ? Math.min(new Date(sorted[i + 1].timestamp).getTime(), rangeEnd)
            : rangeEnd;
        if (end > start) {
            segments.push({ start, end, on: (sorted[i].value || '').trim().toUpperCase() === 'ON' });
        }
    }
    return segments;
}

function totalOnMs(segments: Segment[]): number {
    return segments.filter(s => s.on).reduce((acc, s) => acc + (s.end - s.start), 0);
}

function formatDuration(ms: number): string {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '<1m';
}

const TimelineBar: React.FC<{ segments: Segment[]; rangeStart: number; rangeEnd: number }> = ({ segments, rangeStart, rangeEnd }) => {
    const total = rangeEnd - rangeStart;
    const [activeIdx, setActiveIdx] = useState<number | null>(null);
    if (total <= 0) return null;

    const active = activeIdx !== null ? segments[activeIdx] : null;

    return (
        <div>
            <div className="relative h-8 rounded-xl overflow-hidden bg-gray-800/60 flex">
                {segments.map((seg, i) => {
                    const left = ((seg.start - rangeStart) / total) * 100;
                    const width = ((seg.end - seg.start) / total) * 100;
                    return (
                        <div
                            key={i}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            className={`absolute top-0 h-full cursor-pointer ${seg.on ? 'bg-green-500/70' : 'bg-gray-700/50'}`}
                            onMouseEnter={() => setActiveIdx(i)}
                            onMouseLeave={() => setActiveIdx(null)}
                            onClick={() => setActiveIdx(prev => prev === i ? null : i)}
                        />
                    );
                })}
            </div>
            <div className="h-5 mt-1">
                {active && (
                    <p className="text-[11px] text-gray-400 tabular-nums">
                        <span className={active.on ? 'text-green-400 font-medium' : 'text-gray-500 font-medium'}>{active.on ? 'ON' : 'OFF'}</span>
                        {' — '}
                        {formatDateTime(new Date(active.start).toISOString())}
                        {' → '}
                        {formatDateTime(new Date(active.end).toISOString())}
                    </p>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const DeviceDrawer: React.FC<DeviceDrawerProps> = ({ device, onClose }) => {
    const [chartData, setChartData] = useState<{ x: number; y: number }[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [activeRange, setActiveRange] = useState<RangeIndex>(0);
    const [visible, setVisible] = useState(false);

    // Socket state
    const [switchEvents, setSwitchEvents] = useState<SwitchData[]>([]);
    const [loadingSwitch, setLoadingSwitch] = useState(false);

    // Photo (sensors only)
    const [photo, setPhoto] = useState<{ data: string; contentType: string } | null | undefined>(undefined);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const photoInputRef = React.useRef<HTMLInputElement>(null);

    // Inline name editing (sensors + sockets)
    const [editingName, setEditingName] = useState(false);
    const [editName, setEditName] = useState(device.displayName);
    const [savingName, setSavingName] = useState(false);

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

    const fetchSwitchData = useCallback(async (rangeIdx: RangeIndex) => {
        if (device.kind !== 'socket') return;
        setLoadingSwitch(true);
        const { timeRange } = RANGE_OPTIONS[rangeIdx];
        try {
            const data = await SwitchService.getSwitchData(device.id, timeRange);
            setSwitchEvents(data);
        } catch {
            setSwitchEvents([]);
        } finally {
            setLoadingSwitch(false);
        }
    }, [device.id, device.kind]);

    useEffect(() => {
        if (device.kind === 'sensor') fetchChart(activeRange);
        if (device.kind === 'socket') fetchSwitchData(activeRange);
    }, [device, activeRange, fetchChart, fetchSwitchData]);

    useEffect(() => {
        if (device.kind !== 'sensor') return;
        SensorPhotoService.get(device.id).then(setPhoto);
    }, [device.id, device.kind]);

    const { Icon, iconBg, iconColor } = typeConfig[device.type.toLowerCase()] ?? defaultType;
    const health = device.batteryHealth as BatteryHealthData | undefined;
    const healthCfg = health ? (statusConfig[health.status] ?? statusConfig.learning) : null;

    const latestValueStr = device.kind === 'sensor' && device.latestValue !== undefined
        ? `${Number(device.latestValue).toFixed(device.type === 'voltage' ? 2 : 1)} ${unitForType(device.type)}`
        : null;

    // Socket computed values
    const now = Date.now();
    const rangeMs: Record<RangeIndex, number> = { 0: 86_400_000, 1: 7 * 86_400_000, 2: 30 * 86_400_000, 3: 365 * 86_400_000 };
    const rangeStart = now - rangeMs[activeRange];
    const segments = device.kind === 'socket' ? buildSegments(switchEvents, rangeStart, now) : [];
    const onMs = totalOnMs(segments);
    const lastEvent = switchEvents.length > 0
        ? [...switchEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null;
    const handleSaveName = async () => {
        if (!editName.trim()) return;
        setSavingName(true);
        try {
            if (device.kind === 'sensor') {
                await SensorService.updateCustomName(device.id, editName.trim());
            } else {
                await SwitchService.updateCustomName(device.id, editName.trim());
            }
            device.displayName = editName.trim();
            setEditingName(false);
            toast.success(device.kind === 'sensor' ? 'Sensor renamed' : 'Socket renamed');
        } catch {
            toast.error('Failed to rename');
        } finally {
            setSavingName(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setUploadingPhoto(true);
        try {
            const { base64, contentType } = await compressImage(file);
            await SensorPhotoService.upload(device.id, base64, contentType);
            setPhoto({ data: base64, contentType });
            toast.success('Photo saved');
        } catch {
            toast.error('Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handlePhotoDelete = async () => {
        setDeletingPhoto(true);
        try {
            await SensorPhotoService.remove(device.id);
            setPhoto(null);
            toast.success('Photo deleted');
        } catch {
            toast.error('Failed to delete photo');
        } finally {
            setDeletingPhoto(false);
        }
    };

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
                        {(device.kind === 'socket' || device.kind === 'sensor') && editingName ? (
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1 min-w-0">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleSaveName();
                                            if (e.key === 'Escape') setEditingName(false);
                                        }}
                                        maxLength={50}
                                        className="w-full bg-gray-800/80 border border-gray-600/50 rounded-lg px-2 py-1 pr-10 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60"
                                    />
                                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums pointer-events-none ${editName.length >= 45 ? 'text-amber-400' : 'text-gray-600'}`}>{editName.length}/50</span>
                                </div>
                                <button
                                    onClick={handleSaveName}
                                    disabled={savingName}
                                    className="p-1 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors flex-shrink-0"
                                >
                                    <CheckIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 min-w-0">
                                <h2 className="font-semibold text-gray-100 truncate">{device.displayName}</h2>
                                {(device.kind === 'socket' || device.kind === 'sensor') && (
                                    <button
                                        onClick={() => { setEditName(device.displayName); setEditingName(true); }}
                                        className="p-0.5 rounded text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                                    >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
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

                    {/* Photo — sensor only */}
                    {device.kind === 'sensor' && (
                        <div className="relative">
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoUpload}
                            />
                            {photo ? (
                                <div className="relative rounded-2xl overflow-hidden bg-gray-800/60 border border-gray-700/40">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`data:${photo.contentType};base64,${photo.data}`}
                                        alt="Sensor photo"
                                        className="w-full object-cover max-h-52"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1.5">
                                        <button
                                            onClick={() => photoInputRef.current?.click()}
                                            disabled={uploadingPhoto}
                                            title="Replace photo"
                                            className="p-1.5 rounded-lg bg-gray-900/80 text-gray-300 hover:text-white transition-colors"
                                        >
                                            <CameraIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={handlePhotoDelete}
                                            disabled={deletingPhoto}
                                            title="Delete photo"
                                            className="p-1.5 rounded-lg bg-gray-900/80 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : photo === null ? (
                                <button
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={uploadingPhoto}
                                    className="w-full flex flex-col items-center gap-2 py-6 rounded-2xl border border-dashed border-gray-700/60 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
                                >
                                    <CameraIcon className="h-6 w-6" />
                                    <span className="text-sm">{uploadingPhoto ? 'Uploading…' : 'Add photo'}</span>
                                </button>
                            ) : null /* loading — render nothing */}
                        </div>
                    )}

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

                    {/* Range selector — both sensor and socket */}
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

                    {/* Sensor chart */}
                    {device.kind === 'sensor' && (
                        loadingChart ? (
                            <LoadingDots />
                        ) : chartData.length > 0 ? (
                            <TimeSeriesChart title="" data={chartData} />
                        ) : (
                            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                                No data for this period
                            </div>
                        )
                    )}

                    {/* Socket timeline */}
                    {device.kind === 'socket' && (
                        loadingSwitch ? (
                            <LoadingDots />
                        ) : (
                            <div className="space-y-4">
                                {/* Timeline bar */}
                                {segments.length > 0 ? (
                                    <>
                                        <TimelineBar segments={segments} rangeStart={rangeStart} rangeEnd={now} />
                                        <div className="flex justify-between text-xs text-gray-600">
                                            <span>{RANGE_OPTIONS[activeRange].label === 'Day' ? '24h ago' : RANGE_OPTIONS[activeRange].label === 'Week' ? '7d ago' : RANGE_OPTIONS[activeRange].label === 'Month' ? '30d ago' : '1y ago'}</span>
                                            <span>Now</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-8 flex items-center justify-center text-gray-500 text-sm">
                                        No activity this period
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Time on</span>
                                        <span className="text-gray-200 font-medium">{onMs > 0 ? formatDuration(onMs) : '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Last state change</span>
                                        <span className="text-gray-200 font-medium text-right">
                                            {lastEvent ? formatDateTime(lastEvent.timestamp) : '—'}
                                        </span>
                                    </div>
                                    {lastEvent && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Changed to</span>
                                            <span className={`font-medium ${(lastEvent.value || '').trim().toUpperCase() === 'ON' ? 'text-green-400' : 'text-red-400'}`}>
                                                {(lastEvent.value || '').trim().toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
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
                                        <span className="text-gray-500" title="Number of times the battery has been detected as charged based on voltage rise patterns">
                                            Charge cycles detected
                                        </span>
                                        <span className="text-gray-200 font-medium">{health.chargesRecorded}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Activities (sensors only — e.g. log motorcycle activities for a voltmeter) */}
                    {device.kind === 'sensor' && (
                        <ActivitiesSection sensorId={device.id} />
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
