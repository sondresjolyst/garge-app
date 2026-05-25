'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon, SignalIcon } from '@heroicons/react/24/outline';
import { TYPE_CONFIG, DEFAULT_TYPE } from '@/lib/typeConfig';
import { formatSensorValue, typeEmoji } from '@/lib/typeUtils';
import LoadingDots from '@/components/LoadingDots';
import SensorService, { Sensor, BatteryHealthData } from '@/services/sensorService';
import SwitchService, { Switch } from '@/services/switchService';
import GroupService, { Group } from '@/services/groupService';
import DeviceDrawer from './DeviceDrawer';
import SetupWizard from './SetupWizard';
import ConfirmModal from '@/components/ConfirmModal';
import { groupEmoji } from '@/lib/groupIcons';
import { useLocalStorage } from '@/lib/useLocalStorage';
import CollapsibleSection from '@/components/CollapsibleSection';
import { useDeviceStream } from '@/hooks/useDeviceStream';

// ── Type sort order for group cards ───────────────────────────────────────────
const TYPE_ORDER: Record<string, number> = { voltage: 0, temperature: 1, humidity: 2, socket: 3 };

// ── Per-type top border accent ────────────────────────────────────────────────
const CARD_ACCENT: Record<string, string> = {
    temperature: 'border-t-orange-500/20',
    humidity:    'border-t-blue-500/20',
    voltage:     'border-t-yellow-500/20',
    socket:      'border-t-green-500/20',
};

// ── Custom dropdown ────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string }
interface CustomSelectProps {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
}
const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 pl-3 pr-2.5 py-2 bg-gray-800/60 border border-gray-700/40 rounded-xl text-sm text-gray-200 hover:border-gray-600/60 hover:bg-gray-700/60 transition-all backdrop-blur-sm whitespace-nowrap"
            >
                <span>{selected?.label ?? ''}</span>
                <ChevronDownIcon className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1.5 min-w-full bg-gray-900 border border-gray-700/60 rounded-xl shadow-xl z-50 overflow-hidden">
                    {options.map(o => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => { onChange(o.value); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                o.value === value
                                    ? 'bg-sky-600/20 text-sky-300'
                                    : 'text-gray-300 hover:bg-gray-800/80 hover:text-gray-100'
                            }`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export interface UnifiedDevice {
    kind: 'sensor' | 'socket';
    id: number;
    displayName: string;
    sensorName?: string;
    type: string;
    rawSensor?: Sensor;
    rawSwitch?: Switch;
    latestValue?: number;
    latestState?: string;
    latestTimestamp?: string;
    batteryHealth?: BatteryHealthData;
    isActive: boolean;
}

function formatValue(device: UnifiedDevice): string {
    if (device.kind === 'socket') {
        if (device.latestState === 'ON')  return 'On';
        if (device.latestState === 'OFF') return 'Off';
        return '—';
    }
    return formatSensorValue(device.type, device.latestValue);
}

const DeviceCard: React.FC<{ device: UnifiedDevice; onClick: () => void }> = ({ device, onClick }) => {
    const cfg = TYPE_CONFIG[device.type.toLowerCase()] ?? DEFAULT_TYPE;
    const value = formatValue(device);
    const socketOn  = device.kind === 'socket' && device.latestState === 'ON';
    const socketOff = device.kind === 'socket' && device.latestState === 'OFF';
    const accent = CARD_ACCENT[device.type.toLowerCase()] ?? 'border-t-sky-500/20';

    return (
        <button
            onClick={onClick}
            className={`bg-gray-800/60 border border-gray-700/40 border-t-2 ${accent} rounded-2xl backdrop-blur-sm shadow-md p-4 cursor-pointer hover:bg-gray-700/60 hover:border-gray-600/50 hover:shadow-lg transition-all duration-200 active:scale-[0.97] flex flex-col gap-3 text-left w-full min-h-[148px]`}
        >
            {/* Top: icon + active dot */}
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
                    <cfg.Icon className={`h-5 w-5 ${cfg.iconColor}`} />
                </div>
                <div className="flex items-center gap-1 mt-1.5 flex-shrink-0">
                    <span className="relative flex w-2 h-2">
                        {device.isActive && (
                            <span className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping" />
                        )}
                        <span className={`relative w-2 h-2 rounded-full ${
                            device.isActive
                                ? 'bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.35)]'
                                : 'bg-gray-600'
                        }`} />
                    </span>
                    <span className={`text-[10px] font-medium ${device.isActive ? 'text-green-400' : 'text-gray-600'}`}>
                        {device.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Name + type */}
            <div className="flex-1">
                <p className="font-semibold text-gray-100 text-sm leading-snug line-clamp-2">{device.displayName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
            </div>

            {/* Value */}
            <p className={`text-2xl font-bold tabular-nums ${
                socketOn  ? 'text-green-400' :
                socketOff ? 'text-red-400'   : 'text-white'
            }`}>
                {value}
            </p>
        </button>
    );
};

type SortKey = 'name-asc' | 'name-desc' | 'type' | 'value';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'name-asc',  label: 'Name A–Z'  },
    { value: 'name-desc', label: 'Name Z–A'  },
    { value: 'type',      label: 'Type'      },
    { value: 'value',     label: 'Value ↓'   },
];

const DeviceDashboard: React.FC = () => {
    const [devices, setDevices]       = useState<UnifiedDevice[]>([]);
    const [groups, setGroups]         = useState<Group[]>([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [sort, setSort]             = useLocalStorage<SortKey>('device-sort', 'name-asc');
    const [typeFilter, setTypeFilter] = useLocalStorage<string>('device-type-filter', 'all');
    const [selected, setSelected]     = useState<UnifiedDevice | null>(null);
    const selectedRef = useRef<UnifiedDevice | null>(null);
    selectedRef.current = selected;
    const [wizardOpen, setWizardOpen]   = useState(false);
    const [wizardStep, setWizardStep]   = useState(0);
    const [wizardGroupId, setWizardGroupId] = useState<number | undefined>(undefined);
    const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);

    const isStale = (d: UnifiedDevice): boolean => {
        if (d.kind === 'socket') return d.latestState === 'UNKNOWN';
        if (!d.latestTimestamp) return true;
        return (Date.now() - new Date(d.latestTimestamp).getTime()) / 86_400_000 > 14;
    };

    const loadData = useCallback(async () => {
        try {
            const [allSensors, allSwitches, allGroups] = await Promise.all([
                SensorService.getAllSensors(),
                SwitchService.getAllSwitches().catch((): Switch[] => []),
                GroupService.getAllGroups().catch((): Group[] => []),
            ]);

            setGroups(allGroups);

            const displaySensors = allSensors.filter(s => s.type !== 'battery');

            const [latestResp, staleResp, healthResults, switchStates] = await Promise.all([
                displaySensors.length > 0
                    ? SensorService.getMultipleSensorsData(
                        displaySensors.map(s => s.id),
                        undefined, undefined, '1d', '30m', 1, 5000
                      ).catch(() => ({ data: [], totalCount: 0 }))
                    : Promise.resolve({ data: [], totalCount: 0 }),

                displaySensors.length > 0
                    ? SensorService.getMultipleSensorsData(
                        displaySensors.map(s => s.id),
                        undefined, undefined, '14d', '1d', 1, 5000
                      ).catch(() => ({ data: [], totalCount: 0 }))
                    : Promise.resolve({ data: [], totalCount: 0 }),

                Promise.all(
                    displaySensors
                        .filter(s => s.type === 'voltage')
                        .map(s =>
                            SensorService.getBatteryHealthLatest(s.name)
                                .then(h => ({ name: s.name, health: h }))
                                .catch((): null => null)
                        )
                ),

                allSwitches.length > 0
                    ? Promise.all(
                        allSwitches.map(sw =>
                            SwitchService.getSwitchState(sw.id)
                                .then(result => {
                                    let state = 'UNKNOWN';
                                    if (typeof result === 'string') {
                                        state = result;
                                    } else if (Array.isArray(result) && result.length > 0) {
                                        const latest = result.reduce((a, b) =>
                                            new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime() ? a : b
                                        );
                                        state = (latest.value || '').trim().toUpperCase() || 'UNKNOWN';
                                    }
                                    return { id: sw.id, state };
                                })
                                .catch((): { id: number; state: string } => ({ id: sw.id, state: 'UNKNOWN' }))
                        )
                      )
                    : Promise.resolve([] as { id: number; state: string }[]),
            ]);

            const latestMap: Record<number, { value: number; timestamp: string }> = {};
            for (const d of latestResp.data) {
                const ex = latestMap[d.sensorId];
                const ts = new Date(d.timestamp).getTime();
                if (!ex || ts > new Date(ex.timestamp).getTime()) {
                    latestMap[d.sensorId] = { value: Number(d.value), timestamp: d.timestamp };
                }
            }

            const staleMap: Record<number, string> = {};
            for (const d of staleResp.data) {
                const ex = staleMap[d.sensorId];
                const ts = new Date(d.timestamp).getTime();
                if (!ex || ts > new Date(ex).getTime()) {
                    staleMap[d.sensorId] = d.timestamp;
                }
            }
            // Merge: if 1d data exists use that timestamp, otherwise fall back to 14d staleMap

            const activeSensorIds = new Set(Object.keys(latestMap).map(Number));

            const healthMap: Record<string, BatteryHealthData> = {};
            for (const r of healthResults) {
                if (r) healthMap[r.name] = r.health;
            }

            const switchStateMap: Record<number, string> = {};
            for (const r of switchStates) switchStateMap[r.id] = r.state;

            const sensorDevices: UnifiedDevice[] = displaySensors.map(s => ({
                kind: 'sensor' as const,
                id: s.id,
                displayName: s.customName ?? s.defaultName ?? s.name,
                sensorName: s.name,
                type: s.type,
                rawSensor: s,
                latestValue: latestMap[s.id]?.value,
                latestTimestamp: latestMap[s.id]?.timestamp ?? staleMap[s.id],
                batteryHealth: healthMap[s.name],
                isActive: activeSensorIds.has(s.id),
            }));

            const socketDevices: UnifiedDevice[] = allSwitches.map(sw => ({
                kind: 'socket' as const,
                id: sw.id,
                displayName: sw.customName ?? sw.name,
                type: 'socket',
                rawSwitch: sw,
                latestState: switchStateMap[sw.id] ?? 'UNKNOWN',
                isActive: (switchStateMap[sw.id] ?? 'UNKNOWN') !== 'UNKNOWN',
            }));

            setDevices([...sensorDevices, ...socketDevices]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debouncedReload = useCallback(() => {
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(() => { loadData(); }, 500);
    }, [loadData]);

    useDeviceStream({
        onSwitch: (e) => {
            const newState = (e.value || '').trim().toUpperCase() || 'UNKNOWN';
            setDevices(prev => prev.map(d =>
                d.kind === 'socket' && d.id === e.switchId
                    ? { ...d, latestState: newState, isActive: newState !== 'UNKNOWN' }
                    : d
            ));
        },
        onSensor: (e) => {
            const numericValue = Number(e.value);
            setDevices(prev => prev.map(d =>
                d.kind === 'sensor' && d.id === e.sensorId
                    ? {
                        ...d,
                        latestValue: Number.isFinite(numericValue) ? numericValue : d.latestValue,
                        latestTimestamp: e.timestamp,
                        isActive: true,
                    }
                    : d
            ));
        },
        onDeviceCreated: () => {
            // New device appeared in the user's accessible set — re-fetch the
            // full list. Debounced so a burst (e.g., onboarding several
            // devices) collapses to a single network round-trip.
            debouncedReload();
        },
    });

    const handleRename = useCallback((id: number, name: string) => {
        // The drawer only renames the currently selected device. Match the
        // devices list on that device's kind + id to avoid colliding with a
        // sensor and socket that happen to share the same numeric id.
        const kind = selectedRef.current?.id === id ? selectedRef.current.kind : undefined;
        setDevices(prev => prev.map(d =>
            d.id === id && (kind === undefined || d.kind === kind)
                ? { ...d, displayName: name }
                : d
        ));
        setSelected(prev => (prev && prev.id === id ? { ...prev, displayName: name } : prev));
    }, []);

    const filterPills = useMemo(() => {
        const types = [...new Set(devices.map(d => d.type))].sort();
        const labels: Record<string, string> = {
            temperature: 'Temperature',
            humidity:    'Humidity',
            voltage:     'Voltage',
            socket:      'Sockets',
        };
        return [
            { value: 'all', label: 'All devices' },
            ...types.map(t => ({ value: t, label: labels[t] ?? t })),
        ];
    }, [devices]);

    const filtered = useMemo(() => {
        let list = devices;
        if (typeFilter !== 'all') {
            list = list.filter(d => d.type === typeFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d => d.displayName.toLowerCase().includes(q));
        }
        return [...list].sort((a, b) => {
            switch (sort) {
                case 'name-asc':  return a.displayName.localeCompare(b.displayName);
                case 'name-desc': return b.displayName.localeCompare(a.displayName);
                case 'type':      return a.type.localeCompare(b.type) || a.displayName.localeCompare(b.displayName);
                case 'value': {
                    const av = a.kind === 'sensor' ? (a.latestValue ?? -Infinity) : -Infinity;
                    const bv = b.kind === 'sensor' ? (b.latestValue ?? -Infinity) : -Infinity;
                    return bv - av;
                }
                default: return 0;
            }
        });
    }, [devices, search, sort, typeFilter]);

    if (loading) return <LoadingDots height="h-64" />;

    // Compute which sensor IDs are in any group
    const ungroupedDevices = filtered;

    return (
        <>
            <div className="p-4 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-100">My Devices</h1>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => { setWizardStep(2); setWizardOpen(true); }}
                        className="flex items-center gap-1.5 pl-3 pr-3.5 py-2 bg-gray-700/40 hover:bg-gray-700/60 border border-gray-600/30 rounded-xl text-sm text-gray-300 hover:text-gray-100 transition-all"
                    >
                        <span className="text-base leading-none">📁</span>
                        <span className="hidden sm:inline">New group</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setWizardStep(0); setWizardOpen(true); }}
                        className="flex items-center gap-1.5 pl-3 pr-3.5 py-2 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-600/30 rounded-xl text-sm text-sky-300 hover:text-sky-200 transition-all"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Add device</span>
                    </button>
                </div>
                </div>

                {/* Search + Filter + Sort */}
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-800/60 border border-gray-700/40 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-600/50 focus:bg-gray-800/80 transition-all backdrop-blur-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <CustomSelect
                            value={typeFilter}
                            options={filterPills}
                            onChange={setTypeFilter}
                        />
                        <CustomSelect
                            value={sort}
                            options={SORT_OPTIONS}
                            onChange={v => setSort(v as SortKey)}
                        />
                        {(typeFilter !== 'all' || search.trim()) && (
                            <button
                                type="button"
                                onClick={() => { setSearch(''); setTypeFilter('all'); }}
                                aria-label="Clear filters"
                                className="flex items-center gap-1 px-2.5 py-2 bg-gray-700/40 hover:bg-gray-700/60 border border-gray-600/30 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-all whitespace-nowrap"
                            >
                                <XMarkIcon className="h-3.5 w-3.5" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Groups section */}
                {groups.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Groups</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 device-card-grid">
                            {groups.map(group => {
                                const groupDevices = devices
                                    .filter(d =>
                                        (d.kind === 'sensor' && group.sensorIds.includes(d.id)) ||
                                        (d.kind === 'socket' && group.switchIds.includes(d.id))
                                    )
                                    .sort((a, b) =>
                                        (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99) ||
                                        a.displayName.localeCompare(b.displayName)
                                    );
                                const emoji = groupEmoji(group.icon);
                                const anyActive = groupDevices.some(d => d.isActive);
                                const sensorCount = groupDevices.filter(d => d.kind === 'sensor').length;
                                const socketCount = groupDevices.filter(d => d.kind === 'socket').length;
                                const countLabel = [
                                    sensorCount > 0 ? `${sensorCount} sensor${sensorCount !== 1 ? 's' : ''}` : '',
                                    socketCount > 0 ? `${socketCount} socket${socketCount !== 1 ? 's' : ''}` : '',
                                ].filter(Boolean).join(', ') || 'Empty';
                                return (
                                    <div
                                        key={group.id}
                                        className="bg-gray-800/60 border border-gray-700/40 border-t-2 border-t-sky-500/20 rounded-2xl backdrop-blur-sm p-4 flex flex-col gap-3"
                                    >
                                        {/* Group header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{emoji}</span>
                                                <div>
                                                    <p className="font-semibold text-gray-100 text-sm">{group.name}</p>
                                                    <p className="text-xs text-gray-500">{countLabel}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="relative flex w-2 h-2 flex-shrink-0">
                                                    {anyActive && (
                                                        <span className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping" />
                                                    )}
                                                    <span className={`relative w-2 h-2 rounded-full ${
                                                        anyActive
                                                            ? 'bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.35)]'
                                                            : 'bg-gray-600'
                                                    }`} />
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteGroup(group)}
                                                    aria-label="Delete group"
                                                    className="p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Sensor readings inline */}
                                        {groupDevices.length === 0 ? (
                                            <p className="text-xs text-gray-600 italic">No devices assigned yet.</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {groupDevices.map(d => (
                                                    <button
                                                        key={`${d.kind}-${d.id}`}
                                                        type="button"
                                                        onClick={() => setSelected(d)}
                                                        className="flex flex-col items-start bg-gray-900/50 border border-gray-700/30 rounded-xl px-2.5 py-2 hover:bg-gray-700/40 hover:border-gray-600/50 transition-all"
                                                    >
                                                        <div className="flex items-center gap-1 leading-tight">
                                                            <span className="text-xs">{typeEmoji(d.type)}</span>
                                                            <span className="text-sm font-bold text-gray-100 tabular-nums">{formatValue(d)}</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 leading-tight mt-0.5 truncate max-w-[80px]">{d.displayName}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Manage sensors in this group */}
                                        <button
                                            type="button"
                                            onClick={() => { setWizardGroupId(group.id); setWizardStep(2); setWizardOpen(true); }}
                                            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-sky-400 transition-colors mt-auto pt-1"
                                        >
                                            <PencilIcon className="h-3 w-3" />
                                            Manage
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Ungrouped devices */}
                {devices.length === 0 ? (
                    <div className="mt-12 max-w-sm mx-auto">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="relative mb-6 mx-auto w-20">
                                <div className="w-20 h-20 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center">
                                    <SignalIcon className="h-9 w-9 text-sky-500/70" />
                                </div>
                                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-sky-600/30 border border-sky-500/50 flex items-center justify-center">
                                    <PlusIcon className="h-3 w-3 text-sky-400" />
                                </div>
                            </div>
                            <h2 className="text-xl font-display font-semibold text-gray-100 mb-2">No devices yet</h2>
                            <p className="text-sm text-gray-400 leading-relaxed">Get started by adding a sensor or socket.</p>
                        </div>
                        <div className="space-y-2.5 mb-8">
                            {[
                                { step: '1', title: 'Add a device', desc: 'Enter the device code from your sensor or socket' },
                                { step: '2', title: 'Organize into groups', desc: 'Group devices by vehicle or location' },
                                { step: '3', title: 'Set up automations', desc: 'Automatically control sockets based on sensor readings' },
                            ].map(item => (
                                <div key={item.step} className="flex items-start gap-3 p-3 bg-gray-800/40 border border-gray-700/30 rounded-xl">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600/20 border border-sky-500/30 text-sky-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                        {item.step}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-200">{item.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => { setWizardStep(0); setWizardOpen(true); }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-900/30"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add your first device
                        </button>
                    </div>
                ) : (
                    <>
                        {groups.length > 0 && ungroupedDevices.length > 0 && (
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">All devices</h2>
                        )}
                        {ungroupedDevices.length === 0 && filtered.length > 0 ? null : (
                            ungroupedDevices.length === 0 ? (
                                <div className="mt-4 text-center text-gray-500 text-sm">
                                    {search.trim() ? `No devices match "${search}"` : 'No devices in this category'}
                                </div>
                            ) : (() => {
                                const activeDevices   = ungroupedDevices.filter(d => !isStale(d));
                                const inactiveDevices = ungroupedDevices.filter(d => isStale(d));
                                return (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 device-card-grid">
                                            {activeDevices.map(device => (
                                                <DeviceCard
                                                    key={`${device.kind}-${device.id}`}
                                                    device={device}
                                                    onClick={() => setSelected(device)}
                                                />
                                            ))}
                                        </div>
                                        {inactiveDevices.length > 0 && (
                                            <CollapsibleSection
                                                label="No recent data"
                                                count={inactiveDevices.length}
                                                defaultOpen={activeDevices.length === 0}
                                            >
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 device-card-grid">
                                                    {inactiveDevices.map(device => (
                                                        <DeviceCard
                                                            key={`${device.kind}-${device.id}`}
                                                            device={device}
                                                            onClick={() => setSelected(device)}
                                                        />
                                                    ))}
                                                </div>
                                            </CollapsibleSection>
                                        )}
                                    </>
                                );
                            })()
                        )}
                    </>
                )}
            </div>

            {selected && (
                <DeviceDrawer
                    device={selected}
                    onClose={() => setSelected(null)}
                    onRename={handleRename}
                />
            )}

            {deleteGroup && (() => {
                const icon = groupEmoji(deleteGroup.icon);
                return (
                    <ConfirmModal
                        title="Delete group"
                        subtitle="This cannot be undone"
                        message={<>Are you sure you want to delete <span className="font-medium text-gray-100">{icon} {deleteGroup.name}</span>? Your devices won&apos;t be deleted, just removed from this group.</>}
                        confirmLabel="Delete"
                        onConfirm={async () => { await GroupService.deleteGroup(deleteGroup.id); setDeleteGroup(null); loadData(); }}
                        onCancel={() => setDeleteGroup(null)}
                    />
                );
            })()}

            {wizardOpen && (
                <SetupWizard
                    onClose={() => { setWizardOpen(false); setWizardGroupId(undefined); loadData(); }}
                    initialStep={wizardStep}
                    prefillGroupId={wizardGroupId}
                    onComplete={() => { /* loadData already called via onClose */ }}
                />
            )}
        </>
    );
};

export default DeviceDashboard;
