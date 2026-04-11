'use client';

import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import SensorService, { Sensor } from '@/services/sensorService';
import SwitchService, { Switch } from '@/services/switchService';
import GroupService, { Group } from '@/services/groupService';
import { GROUP_ICONS as ICONS, groupEmoji } from '@/lib/groupIcons';
import { typeEmoji } from '@/lib/typeUtils';

// ── Types & constants ──────────────────────────────────────────────────────────

interface WizardProps {
    onClose: () => void;
    /** If passed, wizard starts at step 1 (name) with this sensor pre-selected */
    prefillSensor?: Sensor;
    /** Override starting step (default 0) */
    initialStep?: number;
    /** Pre-select an existing group in step 2 */
    prefillGroupId?: number;
    onComplete?: () => void;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="flex gap-2 justify-center mb-6">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                    i < current
                        ? 'w-6 bg-sky-500'
                        : i === current
                            ? 'w-8 bg-sky-400'
                            : 'w-4 bg-gray-700'
                }`}
            />
        ))}
    </div>
);

const Btn: React.FC<{
    children: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'ghost';
    disabled?: boolean;
    loading?: boolean;
}> = ({ children, onClick, variant = 'primary', disabled, loading }) => (
    <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2
            ${variant === 'primary'
                ? 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white disabled:opacity-40'
                : 'bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/40 text-gray-300 hover:text-gray-100 disabled:opacity-40'
            }
        `}
    >
        {loading && (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
    </button>
);

// ── Main wizard ────────────────────────────────────────────────────────────────

const SetupWizard: React.FC<WizardProps> = ({ onClose, prefillSensor, initialStep, prefillGroupId, onComplete }) => {
    const [step, setStep]               = useState(initialStep ?? (prefillSensor ? 1 : 0));
    const [regCode, setRegCode]         = useState('');
    const [claimError, setClaimError]   = useState('');
    const [claiming, setClaiming]       = useState(false);
    const [claimedSensor, setClaimedSensor] = useState<Sensor | null>(prefillSensor ?? null);

    const [customName, setCustomName]   = useState(prefillSensor?.customName ?? prefillSensor?.defaultName ?? '');
    const [saving, setSaving]           = useState(false);

    const [groups, setGroups]           = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | 'new' | null>(prefillGroupId ?? null);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupIcon, setNewGroupIcon] = useState('other');
    const [assigning, setAssigning]     = useState(false);
    const [assignError, setAssignError] = useState('');

    const [allSensors, setAllSensors]           = useState<Sensor[]>([]);
    const [allSwitches, setAllSwitches]         = useState<Switch[]>([]);
    const [sensorSearch, setSensorSearch]       = useState('');
    const [selectedSensorIds, setSelectedSensorIds] = useState<Set<number>>(
        prefillSensor ? new Set([prefillSensor.id]) : new Set()
    );
    const [selectedSwitchIds, setSelectedSwitchIds] = useState<Set<number>>(new Set());

    const overlayRef = useRef<HTMLDivElement>(null);

    const TOTAL_STEPS = 4; // 0: claim, 1: name, 2: group, 3: done

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Load groups + all sensors + all switches when reaching step 2
    useEffect(() => {
        if (step === 2) {
            Promise.all([
                GroupService.getAllGroups(),
                SensorService.getAllSensors(),
                SwitchService.getAllSwitches(),
            ]).then(([fetchedGroups, fetchedSensors, fetchedSwitches]) => {
                setGroups(fetchedGroups);
                setAllSwitches(fetchedSwitches);
                const accessible = fetchedSensors.filter(x => x.type !== 'battery');

                // If managing an existing group, pre-check its current sensors + switches
                // and add ghost placeholders for any IDs not accessible in this environment
                if (prefillGroupId) {
                    const existing = fetchedGroups.find(g => g.id === prefillGroupId);
                    if (existing) {
                        setSelectedSensorIds(new Set(existing.sensorIds));
                        setSelectedSwitchIds(new Set(existing.switchIds));
                        const accessibleIds = new Set(accessible.map(s => s.id));
                        const ghosts: Sensor[] = existing.sensorIds
                            .filter(id => !accessibleIds.has(id))
                            .map(id => ({
                                id,
                                name: `sensor-${id}`,
                                type: 'unknown',
                                role: '',
                                customName: `Sensor #${id}`,
                                defaultName: `Sensor #${id}`,
                                registrationCode: '',
                                parentName: '',
                            }));
                        setAllSensors([...accessible, ...ghosts]);
                        return;
                    }
                }
                setAllSensors(accessible);
            }).catch(() => {});
        }
    }, [step, prefillGroupId]);

    // Step 0: Claim sensor
    const handleClaim = async () => {
        if (!regCode.trim()) return;
        setClaiming(true);
        setClaimError('');
        try {
            await SensorService.claimSensor(regCode.trim());
            // Fetch updated sensor list to find the newly claimed one
            const all = await SensorService.getAllSensors();
            const found = all.find(s => s.registrationCode === regCode.trim());
            setClaimedSensor(found ?? null);
            setCustomName(found?.customName ?? found?.defaultName ?? found?.name ?? '');
            if (found) setSelectedSensorIds(new Set([found.id]));
            setStep(1);
        } catch (e: unknown) {
            setClaimError(e instanceof Error ? e.message : 'Failed to claim sensor.');
        } finally {
            setClaiming(false);
        }
    };

    // Step 1: Save name
    const handleSaveName = async () => {
        if (!claimedSensor) { setStep(2); return; }
        setSaving(true);
        try {
            await SensorService.updateCustomName(claimedSensor.id, customName.trim() || claimedSensor.defaultName);
            setStep(2);
        } catch {
            setStep(2); // non-fatal — proceed anyway
        } finally {
            setSaving(false);
        }
    };

    // Step 2: Assign to group
    const handleAssign = async () => {
        if (selectedGroupId === null) { setStep(3); return; }
        setAssigning(true);
        setAssignError('');
        try {
            let groupId: number;
            let originalSensorIds: Set<number> = new Set();
            let originalSwitchIds: Set<number> = new Set();

            if (selectedGroupId === 'new') {
                if (!newGroupName.trim()) { setAssignError('Please enter a group name.'); setAssigning(false); return; }
                const created = await GroupService.createGroup(newGroupName.trim(), newGroupIcon);
                groupId = created.id;
            } else {
                groupId = selectedGroupId;
                const existing = groups.find(g => g.id === groupId);
                originalSensorIds = new Set(existing?.sensorIds ?? []);
                originalSwitchIds = new Set(existing?.switchIds ?? []);
            }

            const sensorsToAdd    = [...selectedSensorIds].filter(id => !originalSensorIds.has(id));
            const sensorsToRemove = [...originalSensorIds].filter(id => !selectedSensorIds.has(id));
            const switchesToAdd    = [...selectedSwitchIds].filter(id => !originalSwitchIds.has(id));
            const switchesToRemove = [...originalSwitchIds].filter(id => !selectedSwitchIds.has(id));

            await Promise.all([
                ...sensorsToAdd.map(id    => GroupService.addSensor(groupId, id)),
                ...sensorsToRemove.map(id => GroupService.removeSensor(groupId, id)),
                ...switchesToAdd.map(id    => GroupService.addSwitch(groupId, id)),
                ...switchesToRemove.map(id => GroupService.removeSwitch(groupId, id)),
            ]);
            setStep(3);
        } catch {
            setAssignError('Failed to save group changes. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    const typeLabel = (type: string) => {
        const map: Record<string, string> = {
            temperature: '🌡️ Temperature',
            humidity:    '💧 Humidity',
            voltage:     '⚡ Voltage',
        };
        return map[type] ?? type;
    };

    // ── Render steps ──────────────────────────────────────────────────────────

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-5">
                        <div>
                            <h2 className="text-xl font-bold text-gray-100 mb-1">Add a sensor</h2>
                            <p className="text-sm text-gray-400">Enter the device code for your sensor.</p>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="text"
                                autoFocus
                                value={regCode}
                                onChange={e => { setRegCode(e.target.value.toUpperCase()); setClaimError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleClaim()}
                                placeholder="e.g. A1B2C3D4E5"
                                maxLength={10}
                                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/40 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-600/50 font-mono tracking-widest text-sm transition-all uppercase"
                            />
                            {claimError && <p className="text-red-400 text-xs">{claimError}</p>}
                        </div>
                        <Btn onClick={handleClaim} loading={claiming} disabled={!regCode.trim()}>
                            Claim sensor
                            <ChevronRightIcon className="h-4 w-4" />
                        </Btn>
                        <Btn variant="ghost" onClick={() => setStep(2)}>
                            Skip — just create a group
                        </Btn>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-5">
                        <div>
                            <h2 className="text-xl font-bold text-gray-100 mb-1">Name your sensor</h2>
                            {claimedSensor && (
                                <span className="inline-block mt-1 text-xs bg-sky-500/15 text-sky-300 border border-sky-500/20 rounded-full px-2.5 py-0.5">
                                    {typeLabel(claimedSensor.type)}
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            autoFocus
                            value={customName}
                            onChange={e => setCustomName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                            placeholder="e.g. Honda CB500 Battery"
                            className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/40 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-sky-600/50 text-sm transition-all"
                        />
                        <Btn onClick={handleSaveName} loading={saving}>
                            Continue
                            <ChevronRightIcon className="h-4 w-4" />
                        </Btn>
                        <Btn variant="ghost" onClick={() => setStep(2)}>Skip</Btn>
                    </div>
                );

            case 2: {
                const filteredSensors = allSensors.filter(s =>
                    (s.customName ?? s.defaultName ?? s.name)
                        .toLowerCase().includes(sensorSearch.toLowerCase())
                );
                const filteredSwitches = allSwitches.filter(sw =>
                    (sw.customName ?? sw.name)
                        .toLowerCase().includes(sensorSearch.toLowerCase())
                );
                const toggleSensor = (id: number) => {
                    setSelectedSensorIds(prev => {
                        const next = new Set(prev);
                        next.has(id) ? next.delete(id) : next.add(id);
                        return next;
                    });
                };
                const toggleSwitch = (id: number) => {
                    setSelectedSwitchIds(prev => {
                        const next = new Set(prev);
                        next.has(id) ? next.delete(id) : next.add(id);
                        return next;
                    });
                };
                const totalSelected = selectedSensorIds.size + selectedSwitchIds.size;

                return (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-100 mb-1">Assign to a group</h2>
                            <p className="text-sm text-gray-400">Pick a group and the devices to include.</p>
                        </div>

                        {/* Group picker */}
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {groups.map(g => {
                                return (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedGroupId(g.id);
                                            // Seed selection with this group's current members + any already-claimed sensor
                                            setSelectedSensorIds(new Set([
                                                ...g.sensorIds,
                                                ...(claimedSensor ? [claimedSensor.id] : []),
                                            ]));
                                            setSelectedSwitchIds(new Set(g.switchIds));
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all text-sm ${
                                            selectedGroupId === g.id
                                                ? 'bg-sky-600/15 border-sky-500/40 text-sky-200'
                                                : 'bg-gray-800/40 border-gray-700/30 text-gray-300 hover:bg-gray-700/40 hover:border-gray-600/50'
                                        }`}
                                    >
                                        <span className="text-lg">{groupEmoji(g.icon)}</span>
                                        <span className="font-medium">{g.name}</span>
                                        {selectedGroupId === g.id && <CheckIcon className="h-4 w-4 ml-auto text-sky-400 flex-shrink-0" />}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedGroupId('new');
                                    // Reset to just the newly claimed sensor (if any)
                                    setSelectedSensorIds(new Set(claimedSensor ? [claimedSensor.id] : []));
                                    setSelectedSwitchIds(new Set());
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all text-sm ${
                                    selectedGroupId === 'new'
                                        ? 'bg-sky-600/15 border-sky-500/40 text-sky-200'
                                        : 'bg-gray-800/40 border-gray-700/30 text-gray-300 hover:bg-gray-700/40 hover:border-gray-600/50'
                                }`}
                            >
                                <span className="text-lg">➕</span>
                                <span className="font-medium">Create new group</span>
                            </button>
                        </div>

                        {/* New group form */}
                        {selectedGroupId === 'new' && (
                            <div className="space-y-3 p-3 bg-gray-800/40 border border-gray-700/30 rounded-xl">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Group name (e.g. Storage Room)"
                                    className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700/40 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-600/50 text-sm"
                                />
                                <div className="grid grid-cols-4 gap-2">
                                    {ICONS.map(icon => (
                                        <button
                                            key={icon.key}
                                            type="button"
                                            onClick={() => setNewGroupIcon(icon.key)}
                                            className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition-all ${
                                                newGroupIcon === icon.key
                                                    ? 'bg-sky-600/20 border-sky-500/50'
                                                    : 'bg-gray-900/40 border-gray-700/30 hover:bg-gray-700/40'
                                            }`}
                                        >
                                            <span className="text-xl">{icon.emoji}</span>
                                            <span className="text-[10px] text-gray-400 leading-none">{icon.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Device search */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                                type="text"
                                value={sensorSearch}
                                onChange={e => setSensorSearch(e.target.value)}
                                placeholder="Search devices..."
                                className="w-full pl-8 pr-3 py-2 bg-gray-800/60 border border-gray-700/40 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-sky-600/50 transition-all"
                            />
                        </div>

                        {/* Sensors section */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                Sensors
                                {selectedSensorIds.size > 0 && (
                                    <span className="ml-2 text-sky-400 normal-case font-normal tracking-normal">
                                        {selectedSensorIds.size} selected
                                    </span>
                                )}
                            </p>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {filteredSensors.length === 0 ? (
                                    <p className="text-xs text-gray-600 italic py-1 text-center">No sensors found</p>
                                ) : filteredSensors.map(s => {
                                    const name = s.customName ?? s.defaultName ?? s.name;
                                    const checked = selectedSensorIds.has(s.id);
                                    const isGhost = s.type === 'unknown';
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => toggleSensor(s.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all text-sm ${
                                                checked
                                                    ? 'bg-sky-600/10 border-sky-500/30 text-sky-100'
                                                    : 'bg-gray-800/30 border-gray-700/20 text-gray-400 hover:bg-gray-700/40 hover:text-gray-200 hover:border-gray-600/40'
                                            }`}
                                        >
                                            <span className="text-base w-5 text-center flex-shrink-0">{typeEmoji(s.type)}</span>
                                            <span className="flex-1 truncate font-medium">
                                                {name}
                                                {isGhost && <span className="ml-1.5 text-xs text-gray-500 font-normal">no access</span>}
                                            </span>
                                            <div className={`w-4 h-4 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
                                                checked ? 'bg-sky-500 border-sky-500' : 'border-gray-600'
                                            }`}>
                                                {checked && <CheckIcon className="h-3 w-3 text-white" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sockets section */}
                        {allSwitches.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                    Sockets
                                    {selectedSwitchIds.size > 0 && (
                                        <span className="ml-2 text-sky-400 normal-case font-normal tracking-normal">
                                            {selectedSwitchIds.size} selected
                                        </span>
                                    )}
                                </p>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {filteredSwitches.length === 0 ? (
                                        <p className="text-xs text-gray-600 italic py-1 text-center">No sockets found</p>
                                    ) : filteredSwitches.map(sw => {
                                        const name = sw.customName ?? sw.name;
                                        const checked = selectedSwitchIds.has(sw.id);
                                        return (
                                            <button
                                                key={sw.id}
                                                type="button"
                                                onClick={() => toggleSwitch(sw.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all text-sm ${
                                                    checked
                                                        ? 'bg-sky-600/10 border-sky-500/30 text-sky-100'
                                                        : 'bg-gray-800/30 border-gray-700/20 text-gray-400 hover:bg-gray-700/40 hover:text-gray-200 hover:border-gray-600/40'
                                                }`}
                                            >
                                                <span className="text-base w-5 text-center flex-shrink-0">🔌</span>
                                                <span className="flex-1 truncate font-medium">{name}</span>
                                                <div className={`w-4 h-4 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
                                                    checked ? 'bg-sky-500 border-sky-500' : 'border-gray-600'
                                                }`}>
                                                    {checked && <CheckIcon className="h-3 w-3 text-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {assignError && <p className="text-red-400 text-xs">{assignError}</p>}

                        <Btn
                            onClick={handleAssign}
                            loading={assigning}
                            disabled={selectedGroupId === null}
                        >
                            {selectedGroupId === null ? 'Select a group' : `Save group${totalSelected > 0 ? ` · ${totalSelected} device${totalSelected !== 1 ? 's' : ''}` : ''}`}
                            <ChevronRightIcon className="h-4 w-4" />
                        </Btn>
                        <Btn variant="ghost" onClick={() => setStep(3)}>Skip</Btn>
                    </div>
                );
            }

            case 3:
                return (
                    <div className="space-y-5 text-center">
                        <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto">
                            <CheckIcon className="h-8 w-8 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-100 mb-1">All set!</h2>
                            {claimedSensor ? (
                                <p className="text-sm text-gray-400">
                                    <span className="text-gray-200 font-medium">{customName || claimedSensor.defaultName}</span> is ready.
                                    {' '}Head to your dashboard to see live data.
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400">Your group has been created. Add sensors to it anytime.</p>
                            )}
                        </div>
                        <Btn onClick={() => { onComplete?.(); onClose(); }}>
                            Go to dashboard
                        </Btn>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className="relative w-full sm:max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-gray-900 border border-gray-700/50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
                {/* Drag handle — mobile only */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-700" />
                </div>

                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 transition-colors z-10"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>

                <div className="overflow-y-auto flex-1 p-6 pb-8 sm:pb-6">
                    <StepIndicator current={step} total={TOTAL_STEPS} />

                    {renderStep()}
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
