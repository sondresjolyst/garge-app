"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react';
import SensorService, { Sensor, SensorData, BatteryHealthData } from '@/services/sensorService';
import dynamic from 'next/dynamic';
import { formatDateTime } from '@/lib/dateUtils';
import { ChevronRightIcon, Battery0Icon, Battery50Icon, Battery100Icon } from '@heroicons/react/24/outline';

const TimeSeriesChart = dynamic(() => import('@/components/TimeSeriesChart'), { ssr: false });

// ── Battery badge ──────────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }> = {
    good:      { color: 'text-green-400',  label: 'Good',      Icon: Battery100Icon },
    attention: { color: 'text-yellow-400', label: 'Attention', Icon: Battery50Icon  },
    replace:   { color: 'text-red-400',    label: 'Replace',   Icon: Battery0Icon   },
    learning:  { color: 'text-gray-500',   label: 'Learning',  Icon: Battery50Icon  },
};

const BatteryHealthIcon: React.FC<{ health: BatteryHealthData }> = ({ health }) => {
    const cfg = statusConfig[health.status] ?? statusConfig.learning;
    const Icon = cfg.Icon;
    const chargedText = health.lastChargedAt
        ? `Charged ${formatDateTime(health.lastChargedAt)}`
        : 'No charge recorded yet';
    const dropText = health.status !== 'learning' && health.dropPct > 0
        ? ` · ${health.dropPct.toFixed(1)}% drop`
        : '';

    return (
        <div className="relative group flex-shrink-0">
            <Icon className={`h-5 w-5 ${cfg.color}`} />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-20">
                <div className="bg-gray-900 border border-gray-700/60 rounded-xl px-3 py-2 shadow-xl text-xs whitespace-nowrap space-y-0.5">
                    <p className={`font-semibold ${cfg.color}`}>{cfg.label}{dropText}</p>
                    <p className="text-gray-400">{chargedText}</p>
                </div>
                <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700/60 rotate-45 -mt-1" />
            </div>
        </div>
    );
};

// ── Range presets ──────────────────────────────────────────────────────────────
const RANGE_OPTIONS = [
    { label: 'Day',   timeRange: '1d',   groupBy: '30m' },
    { label: 'Week',  timeRange: '1w',   groupBy: '2h'  },
    { label: 'Month', timeRange: '30d',  groupBy: '1d'  },
    { label: 'Year',  timeRange: '365d', groupBy: '1d'  },
] as const;

type RangeIndex = 0 | 1 | 2 | 3;

// Default display range for each card
const DEFAULT_RANGE: RangeIndex = 2; // Month

const unitForType = (type: string) => {
    if (type === 'temperature') return '°C';
    if (type === 'humidity')    return '%';
    if (type === 'voltage')     return 'V';
    return '';
};

// ── Loading dots ───────────────────────────────────────────────────────────────
const LoadingDots: React.FC<{ height?: string }> = ({ height = 'h-[220px]' }) => (
    <div className={`${height} flex items-center justify-center`}>
        <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:300ms]" />
        </div>
    </div>
);

// ── SensorCard ─────────────────────────────────────────────────────────────────
interface SensorCardProps {
    sensor: Sensor;
    batteryHealth?: BatteryHealthData;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensor, batteryHealth }) => {
    const [activeRange, setActiveRange] = useState<RangeIndex>(DEFAULT_RANGE);
    const [data, setData] = useState<{ x: number; y: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (rangeIdx: RangeIndex) => {
        setLoading(true);
        const { timeRange, groupBy } = RANGE_OPTIONS[rangeIdx];
        try {
            let allData: SensorData[] = [];
            let page = 1;
            let total = 0;
            do {
                const resp = await SensorService.getMultipleSensorsData(
                    [sensor.id], undefined, undefined, timeRange, groupBy, page, 5000
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
            setData(
                unique
                    .filter((_, i) => i % step === 0)
                    .map(d => ({ x: new Date(d.timestamp).getTime(), y: Number(d.value) }))
            );
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [sensor.id]);

    useEffect(() => {
        fetchData(activeRange);
    }, [activeRange, fetchData]);

    const latestValue = data.length > 0 ? data[data.length - 1].y : null;
    const unit = unitForType(sensor.type);

    return (
        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl backdrop-blur-sm shadow-lg flex flex-col">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-100 truncate">
                            {sensor.customName ?? sensor.defaultName}
                        </h3>
                        {batteryHealth && <BatteryHealthIcon health={batteryHealth} />}
                    </div>
                </div>
                {latestValue !== null && (
                    <div className="text-right flex-shrink-0">
                        <span className="text-2xl font-bold text-white tabular-nums">
                            {latestValue.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-400 ml-0.5">{unit}</span>
                    </div>
                )}
            </div>

            {/* Day / Week / Month / Year selector */}
            <div className="px-5 pb-3">
                <div className="flex gap-1 bg-gray-900/60 rounded-xl p-1">
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
            </div>

            {/* Chart */}
            <div className="px-2 pb-4 flex-1">
                {loading ? (
                    <LoadingDots />
                ) : data.length > 0 ? (
                    <TimeSeriesChart title="" data={data} />
                ) : (
                    <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">
                        No data for this period
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Collapsible section ────────────────────────────────────────────────────────
interface CollapsibleSectionProps {
    label: string;
    count: number;
    children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ label, count, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-8">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors w-full text-left group"
            >
                <ChevronRightIcon
                    className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                />
                <span className="text-sm font-medium">{label}</span>
                <span className="ml-1 text-xs bg-gray-700 text-gray-400 rounded-full px-2 py-0.5 group-hover:bg-gray-600 transition-colors">
                    {count}
                </span>
            </button>
            {open && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                    {children}
                </div>
            )}
        </div>
    );
};

// ── Main page ──────────────────────────────────────────────────────────────────
const SensorsPage: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [batteryHealthMap, setBatteryHealthMap] = useState<Record<string, BatteryHealthData>>({});
    const [activeSensorIds, setActiveSensorIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const allSensors = await SensorService.getAllSensors();
                allSensors.sort((a, b) =>
                    (a.customName ?? a.defaultName ?? '').toLowerCase()
                        .localeCompare((b.customName ?? b.defaultName ?? '').toLowerCase())
                );

                const displaySensors = allSensors.filter(s => s.type !== 'battery');
                setSensors(displaySensors);

                // Battery health for voltage sensors
                const voltageSensors = allSensors.filter(s => s.type === 'voltage');
                const healthMap: Record<string, BatteryHealthData> = {};
                await Promise.all(voltageSensors.map(async s => {
                    try { healthMap[s.name] = await SensorService.getBatteryHealthLatest(s.name); }
                    catch { /* ignore */ }
                }));
                setBatteryHealthMap(healthMap);

                // Bulk month check — one call to determine grouping before any card renders
                if (displaySensors.length > 0) {
                    try {
                        const resp = await SensorService.getMultipleSensorsData(
                            displaySensors.map(s => s.id),
                            undefined, undefined, '30d', '1d', 1, 5000
                        );
                        setActiveSensorIds(new Set(resp.data.map(d => d.sensorId)));
                    } catch {
                        // On error, treat all sensors as active
                        setActiveSensorIds(new Set(displaySensors.map(s => s.id)));
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return <LoadingDots height="h-64" />;
    }

    if (sensors.length === 0) {
        return (
            <div className="mt-12 text-center text-gray-400 space-y-2">
                <p>No sensors assigned yet.</p>
                <p>
                    You can add your own sensors on the{' '}
                    <a href="/profile" className="text-sky-400 hover:text-sky-300 underline transition-colors">
                        profile page
                    </a>.
                </p>
            </div>
        );
    }

    const activeSensors  = sensors.filter(s => activeSensorIds.has(s.id));
    const inactiveSensors = sensors.filter(s => !activeSensorIds.has(s.id));

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Sensors</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeSensors.map(sensor => (
                    <SensorCard
                        key={sensor.id}
                        sensor={sensor}
                        batteryHealth={batteryHealthMap[sensor.name]}
                    />
                ))}
            </div>

            {inactiveSensors.length > 0 && (
                <CollapsibleSection label="No recent data" count={inactiveSensors.length}>
                    {inactiveSensors.map(sensor => (
                        <SensorCard
                            key={sensor.id}
                            sensor={sensor}
                            batteryHealth={batteryHealthMap[sensor.name]}
                        />
                    ))}
                </CollapsibleSection>
            )}
        </div>
    );
};

export default SensorsPage;
