'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { XMarkIcon, PencilIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import InlineEditField from '@/components/InlineEditField';
import { TYPE_CONFIG as typeConfig, DEFAULT_TYPE as defaultType, BATTERY_STATUS_CONFIG as statusConfig } from '@/lib/typeConfig';
import { unitForType, typeLabel } from '@/lib/typeUtils';
import { RANGE_OPTIONS, type RangeIndex } from '@/lib/constants';
import LoadingDots from '@/components/LoadingDots';
import PhotoUploader from '@/components/PhotoUploader';
import SensorService, { SensorData, BatteryHealthData } from '@/services/sensorService';
import SwitchService, { SwitchData } from '@/services/switchService';
import { formatDateTime, formatRelative } from '@/lib/dateUtils';
import SensorPhotoService from '@/services/sensorPhotoService';
import type { Photo } from '@/services/photoServiceFactory';
import { toast } from 'sonner';
import ActivitiesSection from '@/components/ActivitiesSection';
import type { UnifiedDevice } from './DeviceDashboard';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });

interface DeviceDrawerProps {
    device: UnifiedDevice;
    onClose: () => void;
    /** Notifies the parent that the device was renamed so it can update its state. */
    onRename: (id: number, name: string) => void;
    /** Notifies the parent that the sensor's voltage color thresholds changed (null when cleared). */
    onThresholdsChange?: (sensorId: number, warning: number | null, critical: number | null) => void;
}

function InfoLabel({ children, tooltip }: { children: React.ReactNode; tooltip: string }) {
    const [open, setOpen] = useState(false);
    const ref = React.useRef<HTMLSpanElement>(null);

    useOutsideClick(ref, () => setOpen(false), open);

    return (
        <span ref={ref} className="relative text-gray-500 inline-flex items-center gap-1">
            {children}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-label={tooltip}
                aria-expanded={open}
                className="inline-flex items-center justify-center w-5 h-5 -m-0.5 text-gray-600 hover:text-gray-400 active:text-gray-300"
            >
                <InformationCircleIcon className="w-3.5 h-3.5 shrink-0" />
            </button>
            {open && (
                <span
                    role="tooltip"
                    className="absolute left-0 top-full mt-1 z-20 w-56 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-xs font-normal normal-case leading-snug shadow-lg"
                >
                    {tooltip}
                </span>
            )}
        </span>
    );
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

// ── Voltage color thresholds ──────────────────────────────────────────────────

const inputClass = 'w-full px-3 py-2 bg-gray-900/60 border border-gray-700/40 rounded-xl text-sm text-gray-200 tabular-nums focus:outline-none focus:border-sky-600/50 transition-colors';

const VoltageThresholdConfig: React.FC<{
    sensorId: number;
    warning: number | null;
    critical: number | null;
    onChange: (sensorId: number, warning: number | null, critical: number | null) => void;
}> = ({ sensorId, warning, critical, onChange }) => {
    const [warnInput, setWarnInput] = useState(warning !== null ? String(warning) : '');
    const [critInput, setCritInput] = useState(critical !== null ? String(critical) : '');
    const [saving, setSaving] = useState(false);

    const isSet = warning !== null && critical !== null;
    const warnNum = parseFloat(warnInput);
    const critNum = parseFloat(critInput);
    const filled = warnInput.trim() !== '' && critInput.trim() !== '';
    const valid = Number.isFinite(warnNum) && Number.isFinite(critNum)
        && critNum >= 0 && warnNum <= 100 && warnNum > critNum;
    const dirty = warnInput !== (warning !== null ? String(warning) : '')
        || critInput !== (critical !== null ? String(critical) : '');

    const save = async () => {
        if (!valid || saving) return;
        setSaving(true);
        try {
            await SensorService.updateVoltageThresholds(sensorId, warnNum, critNum);
            onChange(sensorId, warnNum, critNum);
            toast.success('Voltage thresholds saved');
        } catch {
            toast.error('Failed to save voltage thresholds');
        } finally {
            setSaving(false);
        }
    };

    const clear = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await SensorService.clearVoltageThresholds(sensorId);
            onChange(sensorId, null, null);
            setWarnInput('');
            setCritInput('');
            toast.success('Voltage coloring turned off');
        } catch {
            toast.error('Failed to clear voltage thresholds');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl p-4 space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-gray-300">Voltage color thresholds</h3>
                <p className="text-xs text-gray-500 mt-1 leading-snug">
                    Color this reading by voltage. Leave off to show it plain.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" /> Warning below (V)
                    </span>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={warnInput}
                        onChange={e => setWarnInput(e.target.value)}
                        placeholder="12.4"
                        aria-label="Warning voltage"
                        className={inputClass}
                    />
                </label>
                <label className="space-y-1.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400" /> Critical below (V)
                    </span>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={critInput}
                        onChange={e => setCritInput(e.target.value)}
                        placeholder="12.0"
                        aria-label="Critical voltage"
                        className={inputClass}
                    />
                </label>
            </div>

            {filled && !valid && (
                <p className="text-xs text-red-400">Warning must be higher than critical, between 0 and 100 V.</p>
            )}

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={save}
                    disabled={!valid || !dirty || saving}
                    className="flex-1 py-2 rounded-xl text-sm font-medium bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
                {isSet && (
                    <button
                        type="button"
                        onClick={clear}
                        disabled={saving}
                        className="px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 disabled:opacity-40 transition-colors"
                    >
                        Turn off
                    </button>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const DeviceDrawer: React.FC<DeviceDrawerProps> = ({ device, onClose, onRename, onThresholdsChange }) => {
    const [chartData, setChartData] = useState<{ x: number; y: number }[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [activeRange, setActiveRange] = useState<RangeIndex>(0);
    const [visible, setVisible] = useState(false);

    // Socket state
    const [switchEvents, setSwitchEvents] = useState<SwitchData[]>([]);
    const [loadingSwitch, setLoadingSwitch] = useState(false);

    // Photo (sensors only)
    const [photo, setPhoto] = useState<Photo | null | undefined>(undefined);

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

    const isVoltage = device.kind === 'sensor' && device.type === 'voltage';

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
        const trimmed = editName.trim();
        if (!trimmed) return;
        setSavingName(true);
        try {
            if (device.kind === 'sensor') {
                await SensorService.updateCustomName(device.id, trimmed);
            } else {
                await SwitchService.updateCustomName(device.id, trimmed);
            }
            onRename(device.id, trimmed);
            setEditingName(false);
            toast.success(device.kind === 'sensor' ? 'Sensor renamed' : 'Socket renamed');
        } catch {
            toast.error('Failed to rename');
        } finally {
            setSavingName(false);
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
            <div
                role="dialog"
                aria-modal={visible ? 'true' : undefined}
                aria-hidden={!visible}
                className={`fixed right-0 top-0 h-full w-full max-w-md bg-gray-950/98 backdrop-blur-xl border-l border-gray-700/50 z-50 overflow-y-auto shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
            >

                {/* Sticky header */}
                <div className="sticky top-0 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/60 px-5 py-4 flex items-center gap-3 z-20">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        {(device.kind === 'socket' || device.kind === 'sensor') && editingName ? (
                            <InlineEditField
                                compact
                                value={editName}
                                onChange={setEditName}
                                onSave={handleSaveName}
                                onCancel={() => setEditingName(false)}
                                saving={savingName}
                                maxLength={50}
                                autoFocus
                            />
                        ) : (
                            <div className="flex items-center gap-1.5 min-w-0">
                                <h2 className="font-semibold text-gray-100 truncate">{device.displayName}</h2>
                                {(device.kind === 'socket' || device.kind === 'sensor') && (
                                    <button
                                        onClick={() => { setEditName(device.displayName); setEditingName(true); }}
                                        aria-label="Rename"
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
                        aria-label="Close"
                        className="flex-shrink-0 p-1.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-all"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-5 py-5 pb-28 space-y-6">

                    {/* Photo — sensor only */}
                    {device.kind === 'sensor' && photo !== undefined && (
                        <PhotoUploader
                            photo={photo}
                            service={SensorPhotoService}
                            parentId={device.id}
                            alt="Sensor photo"
                            onChange={setPhoto}
                        />
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

                    {/* Last seen */}
                    {device.latestTimestamp && (
                        <p className="text-xs text-gray-600 text-center">
                            Last seen {formatDateTime(device.latestTimestamp)}
                        </p>
                    )}

                    {/* Battery health details — server-side analyzer output */}
                    {health && healthCfg && (
                        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-gray-300">Battery Health</h3>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-sm">
                                    <InfoLabel tooltip="Overall battery health. Needs ≥14 days of data and at least one charge event to assess.">
                                        Status
                                    </InfoLabel>
                                    <span className={`font-medium ${healthCfg.color}`}>{healthCfg.label}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <InfoLabel tooltip="Whether the battery is currently being charged.">
                                        Charger
                                    </InfoLabel>
                                    {health.onChargerNow ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium">
                                            ⚡ On charger
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">Resting</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <InfoLabel tooltip="When the battery was last detected as fully charged.">
                                        Last full charge
                                    </InfoLabel>
                                    <span className="text-gray-200 font-medium text-right">
                                        {health.onChargerNow
                                            ? 'Charging now'
                                            : health.lastFullChargeAt
                                                ? formatRelative(health.lastFullChargeAt)
                                                : 'None detected'}
                                    </span>
                                </div>

                                {health.fullChargesLast30d > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <InfoLabel tooltip="Charge events detected in the last 30 days.">
                                            Full charges (30d)
                                        </InfoLabel>
                                        <span className="text-gray-200 font-medium tabular-nums">{health.fullChargesLast30d}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                    <InfoLabel tooltip="Battery's current rested voltage, smoothed over the last 3 days.">
                                        Resting voltage (3d)
                                    </InfoLabel>
                                    <span className="text-gray-200 font-medium tabular-nums">
                                        {health.restingMedian.toFixed(2)} V
                                    </span>
                                </div>

                                {health.voltageMin24h !== null && (
                                    <div className="flex items-center justify-between text-sm">
                                        <InfoLabel tooltip="Lowest reading in the last 24 hours.">
                                            Min (24h)
                                        </InfoLabel>
                                        <span className="text-gray-200 font-medium tabular-nums">{health.voltageMin24h.toFixed(2)} V</span>
                                    </div>
                                )}

                                {health.status !== 'learning' && (
                                    <>
                                        <div className="flex items-center justify-between text-sm">
                                            <InfoLabel tooltip="Long-term resting voltage baseline observed over the last 90 days.">
                                                Resting voltage (90d)
                                            </InfoLabel>
                                            <span className="text-gray-200 font-medium tabular-nums">
                                                {health.peakResting.toFixed(2)} V
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <InfoLabel tooltip="How the current 3-day resting voltage compares to the 90-day baseline.">
                                                Difference
                                            </InfoLabel>
                                            <span className="text-gray-200 font-medium tabular-nums text-right">
                                                {(() => {
                                                    const delta = health.peakResting > 0
                                                        ? ((health.restingMedian - health.peakResting) / health.peakResting) * 100
                                                        : 0;
                                                    if (Math.abs(delta) < 0.05) return '0.0%';
                                                    return `${Math.abs(delta).toFixed(1)}% ${delta > 0 ? 'above' : 'below'}`;
                                                })()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <InfoLabel tooltip="Trend across post-charge resting voltage over recent charge cycles. Needs at least 3 charge cycles to compute.">
                                                Weekly decline
                                            </InfoLabel>
                                            <span className="text-gray-200 font-medium tabular-nums text-right">
                                                {health.dailyDropPctPerWeek === null
                                                    ? <span className="text-gray-500 text-xs">Needs more charge cycles</span>
                                                    : health.dailyDropPctPerWeek < 0
                                                        ? `${(-health.dailyDropPctPerWeek).toFixed(2)}% / wk`
                                                        : 'stable'}
                                            </span>
                                        </div>
                                    </>
                                )}

                                {health.chargeAcceptanceRatio !== null && (
                                    <div className="flex items-center justify-between text-sm">
                                        <InfoLabel tooltip="How well the battery accepts charge. Healthy ≥1.10×.">
                                            Charge response
                                        </InfoLabel>
                                        <span className="text-gray-200 font-medium tabular-nums">{health.chargeAcceptanceRatio.toFixed(2)}×</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Voltage color thresholds (voltage sensors only) */}
                    {isVoltage && (
                        <VoltageThresholdConfig
                            key={device.id}
                            sensorId={device.id}
                            warning={device.rawSensor?.warningVoltage ?? null}
                            critical={device.rawSensor?.criticalVoltage ?? null}
                            onChange={(id, warning, critical) => onThresholdsChange?.(id, warning, critical)}
                        />
                    )}

                    {/* Activities (sensors only — e.g. log motorcycle activities for a voltmeter) */}
                    {device.kind === 'sensor' && (
                        <ActivitiesSection sensorId={device.id} />
                    )}

                </div>
            </div>
        </>
    );
};

export default DeviceDrawer;
