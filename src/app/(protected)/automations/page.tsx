"use client";

import React, { useEffect, useMemo, useState } from 'react';
import AutomationService from '@/services/automationService';
import SwitchService, { Switch } from '@/services/switchService';
import SensorService, { Sensor } from '@/services/sensorService';
import UserService from '@/services/userService';
import { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto';
import { CreateAutomationRuleDto } from '@/dto/Automation/CreateAutomationRuleDto';
import { UpdateAutomationRuleDto } from '@/dto/Automation/UpdateAutomationRuleDto';
import { unitForType } from '@/lib/typeUtils';
import { formatDateTime } from '@/lib/dateUtils';
import { sortAutomationRules } from '@/lib/automationSort';
import { formatApiError } from '@/lib/errorMessages';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingDots from '@/components/LoadingDots';
import ToggleSwitch from '@/components/ToggleSwitch';
import AutomationRuleForm from './AutomationRuleForm';
import {
    PlusIcon,
    XMarkIcon,
    ClockIcon,
    PencilSquareIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const initialForm: CreateAutomationRuleDto = {
    targetType: '',
    targetId: 0,
    sensorType: '',
    sensorId: 0,
    condition: '==',
    threshold: 0,
    action: 'on',
    isEnabled: true,
};

const conditionSymbol: Record<string, string> = {
    '==': '=', '<': '<', '>': '>', '<=': '≤', '>=': '≥',
};

const conditionVerb: Record<string, string> = {
    '==': 'equals',
    '<':  'drops below',
    '>':  'rises above',
    '<=': 'is at most',
    '>=': 'reaches',
};

const formatTriggered = (iso: string | null): string | null => {
    if (!iso) return null;
    return formatDateTime(iso);
};

const formatTimerRemaining = (activatedAt: string, durationHours: number): string => {
    const endsAt = new Date(activatedAt).getTime() + durationHours * 3600 * 1000;
    const remainingMs = endsAt - Date.now();
    if (remainingMs <= 0) return 'Expiring…';
    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
};

// ── AutomationsPage ───────────────────────────────────────────────────────────

const AutomationsPage: React.FC = () => {
    const [rules, setRules]                   = useState<AutomationRuleDto[]>([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState<string>('');
    const [form, setForm]                     = useState<CreateAutomationRuleDto>(initialForm);
    const [formOpen, setFormOpen]             = useState(false);
    const [submitting, setSubmitting]         = useState(false);
    const [editingId, setEditingId]           = useState<number | null>(null);
    const [editForm, setEditForm]             = useState<UpdateAutomationRuleDto | null>(null);
    const [switches, setSwitches]             = useState<Switch[]>([]);
    const [sensors, setSensors]               = useState<Sensor[]>([]);
    const [defaultPriceArea, setDefaultPriceArea] = useState<string>('NO2');
    const [deleteTargetId, setDeleteTargetId]     = useState<number | null>(null);
    const [latestValueMap, setLatestValueMap] = useState<Record<number, number>>({});

    const sortedRules = useMemo(
        () => sortAutomationRules(rules, switches, sensors),
        [rules, switches, sensors],
    );

    useEffect(() => {
        Promise.all([fetchRules(), fetchSwitches(), fetchSensors(), fetchUserPriceZone()])
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (sensors.length === 0) return;
        const ids = sensors.map(s => s.id);
        SensorService.getMultipleSensorsData(ids, undefined, undefined, '1d', '30m', 1, 5000)
            .then(resp => {
                const tsMap: Record<number, { value: number; ts: number }> = {};
                for (const d of resp.data) {
                    const ts = new Date(d.timestamp).getTime();
                    const ex = tsMap[d.sensorId];
                    if (!ex || ts > ex.ts) tsMap[d.sensorId] = { value: Number(d.value), ts };
                }
                const map: Record<number, number> = {};
                for (const [id, { value }] of Object.entries(tsMap)) map[Number(id)] = value;
                setLatestValueMap(map);
            })
            .catch(() => {});
    }, [sensors]);

    const sortedSwitches = [...switches].sort((a, b) =>
        (a.customName ?? a.name ?? '').toLowerCase().localeCompare((b.customName ?? b.name ?? '').toLowerCase())
    );
    const sortedSensors = [...sensors].sort((a, b) =>
        (a.customName ?? a.defaultName ?? '').toLowerCase()
            .localeCompare((b.customName ?? b.defaultName ?? '').toLowerCase())
    );

    const fetchRules    = () => AutomationService.getRules()
        .then(data => setRules(Array.isArray(data) ? data : []))
        .catch(handleError);
    const fetchSwitches = async () => {
        try { setSwitches(await SwitchService.getAllSwitches()); }
        catch (e) { handleError(e, 'Failed to fetch sockets'); }
    };
    const fetchSensors  = async () => {
        try { setSensors(await SensorService.getAllSensors()); }
        catch (e) { handleError(e, 'Failed to fetch sensors'); }
    };
    const fetchUserPriceZone = async () => {
        try {
            const profile = await UserService.getUserProfile();
            if (profile.priceZone) setDefaultPriceArea(profile.priceZone);
        } catch { /* ignore */ }
    };

    const handleError = (err: unknown, fallbackMsg?: string) => {
        setError(formatApiError(err, fallbackMsg || 'A network error occurred'));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await AutomationService.createRule(form);
            setForm(initialForm);
            setFormOpen(false);
            fetchRules();
            toast.success('Automation created');
        } catch (e) { handleError(e, 'Failed to create automation'); toast.error('Failed to create automation'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id: number) => {
        setError('');
        try {
            await AutomationService.deleteRule(id);
            setDeleteTargetId(null);
            cancelEdit();
            fetchRules();
            toast.success('Automation deleted');
        } catch (e) { handleError(e, 'Failed to delete automation'); toast.error('Failed to delete automation'); }
    };

    const handleToggleEnabled = async (rule: AutomationRuleDto) => {
        setError('');
        try {
            await AutomationService.updateRule(rule.id, {
                targetType: rule.targetType, targetId: rule.targetId,
                sensorType: rule.sensorType, sensorId: rule.sensorId,
                condition: rule.condition,   threshold: rule.threshold,
                action: rule.action,         isEnabled: !rule.isEnabled,
                electricityPriceCondition:  rule.electricityPriceCondition,
                electricityPriceThreshold:  rule.electricityPriceThreshold,
                electricityPriceArea:       rule.electricityPriceArea,
                electricityPriceOperator:   rule.electricityPriceOperator,
                timerDurationHours:         rule.timerDurationHours,
            });
            fetchRules();
            toast.success(rule.isEnabled ? 'Automation disabled' : 'Automation enabled');
        } catch (e) { handleError(e, 'Failed to update automation'); toast.error('Failed to update automation'); }
    };

    const startEdit = (rule: AutomationRuleDto) => {
        setEditingId(rule.id);
        setEditForm({
            targetType: rule.targetType, targetId: rule.targetId,
            sensorType: rule.sensorType, sensorId: rule.sensorId,
            condition:  rule.condition,  threshold: rule.threshold,
            action:     rule.action,     isEnabled: rule.isEnabled,
            electricityPriceCondition:  rule.electricityPriceCondition,
            electricityPriceThreshold:  rule.electricityPriceThreshold,
            electricityPriceArea:       rule.electricityPriceArea,
            electricityPriceOperator:   rule.electricityPriceOperator,
            timerDurationHours:         rule.timerDurationHours,
        });
        setFormOpen(true);
    };

    const cancelEdit = () => { setEditingId(null); setEditForm(null); setFormOpen(false); };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId || !editForm) return;
        setError('');
        setSubmitting(true);
        try {
            await AutomationService.updateRule(editingId, editForm);
            cancelEdit();
            fetchRules();
            toast.success('Automation updated');
        } catch (e) { handleError(e, 'Failed to update automation'); toast.error('Failed to update automation'); }
        finally { setSubmitting(false); }
    };

    // ── Derived values ─────────────────────────────────────────────────────────
    const isEditMode     = editingId !== null && editForm !== null;

    const openCreateDrawer = () => { setEditingId(null); setEditForm(null); setFormOpen(true); };
    const closeDrawer      = () => { setFormOpen(false); setEditingId(null); setEditForm(null); };

    // ── Form contents (shared between drawer modes) ────────────────────────────

    const createFormContent = (
        <AutomationRuleForm
            mode="create"
            value={form}
            onChange={setForm}
            onSubmit={handleCreate}
            onCancel={closeDrawer}
            submitting={submitting}
            sortedSwitches={sortedSwitches}
            sortedSensors={sortedSensors}
            sensors={sensors}
            latestValueMap={latestValueMap}
            defaultPriceArea={defaultPriceArea}
            priceFormKey="create"
        />
    );

    const editFormContent = editForm && (
        <AutomationRuleForm
            mode="edit"
            value={editForm}
            onChange={setEditForm}
            onSubmit={handleUpdate}
            onCancel={closeDrawer}
            submitting={submitting}
            sortedSwitches={sortedSwitches}
            sortedSensors={sortedSensors}
            sensors={sensors}
            latestValueMap={latestValueMap}
            defaultPriceArea={defaultPriceArea}
            priceFormKey={editingId ?? 'edit'}
            onDelete={() => editingId && setDeleteTargetId(editingId)}
        />
    );

    // ── Empty state ────────────────────────────────────────────────────────────

    const emptyState = (
        <div className="mt-16 flex flex-col items-center text-center max-w-sm mx-auto">
            <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center">
                    <BoltIcon className="h-9 w-9 text-sky-500/70" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-sky-600/30 border border-sky-500/50 flex items-center justify-center">
                    <PlusIcon className="h-3 w-3 text-sky-400" />
                </div>
            </div>
            <h2 className="text-xl font-display font-semibold text-gray-100 mb-2">No automations yet</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Automations watch your sensors and automatically control switches — like turning on a heater when the temperature drops too low.
            </p>
            <div className="w-full space-y-2.5 mb-8 text-left">
                {[
                    { step: '1', title: 'Choose a socket', desc: 'Pick which socket to control' },
                    { step: '2', title: 'Set a trigger',   desc: 'Select a sensor and the condition that fires the rule' },
                    { step: '3', title: 'Define the action', desc: 'Turn the socket on or off when conditions are met' },
                ].map(item => (
                    <div key={item.step} className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
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
                onClick={openCreateDrawer}
                className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-900/30"
            >
                <PlusIcon className="h-5 w-5" />
                Create first automation
            </button>
        </div>
    );

    // ── Rule card ──────────────────────────────────────────────────────────────

    const renderRuleCard = (rule: AutomationRuleDto) => {
        const switchObj  = switches.find(sw => sw.id === rule.targetId);
        const sensorObj  = sensors.find(s => s.id === rule.sensorId);
        const verb       = conditionVerb[rule.condition] ?? rule.condition;
        const unit       = sensorObj ? unitForType(sensorObj.type) : '';
        const triggered  = formatTriggered(rule.lastTriggeredAt);
        const priceSym   = rule.electricityPriceCondition
            ? (conditionSymbol[rule.electricityPriceCondition] ?? rule.electricityPriceCondition)
            : null;
        const switchName = switchObj ? (switchObj.customName ?? switchObj.name) : `Socket ${rule.targetId}`;
        const sensorName = sensorObj?.customName ?? sensorObj?.defaultName ?? `Sensor ${rule.sensorId}`;
        const isOn       = rule.action === 'on';

        return (
            <div
                key={rule.id}
                className={`relative bg-gray-800/60 border border-gray-700/40 border-l-4 rounded-2xl backdrop-blur-sm shadow-lg flex flex-col transition-all duration-300 ${rule.isEnabled ? 'border-l-sky-500' : 'border-l-gray-600 opacity-55'}`}
            >
                {/* Header: name + toggle */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex-1 min-w-0 mr-3">
                        <h3 className="text-sm font-semibold truncate text-gray-100">
                            {switchName}
                        </h3>
                        <span className="inline-flex items-center text-xs font-medium mt-1 text-gray-400">
                            {isOn ? 'Turn on rule' : 'Turn off rule'}
                        </span>
                    </div>
                    <ToggleSwitch
                        checked={rule.isEnabled}
                        onChange={() => handleToggleEnabled(rule)}
                        ariaLabel={rule.isEnabled ? 'Disable rule' : 'Enable rule'}
                    />
                </div>

                {/* IF / THEN logic blocks */}
                <div className="px-4 pb-3 space-y-1.5 flex-1">
                    {/* IF block */}
                    <div className="rounded-lg bg-gray-900/70 border border-gray-700/40 px-3 py-2.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">IF</span>
                        <p className="text-sm text-gray-200 leading-snug">
                            <span className="font-medium text-white">{sensorName}</span>
                            {' '}<span className="text-gray-400">{verb}</span>{' '}
                            <span className="font-semibold text-sky-400 font-mono">{rule.threshold}{unit ? ` ${unit}` : ''}</span>
                        </p>
                    </div>

                    {/* Price condition block */}
                    {priceSym && rule.electricityPriceThreshold !== undefined && (
                        <div className="rounded-lg bg-gray-900/70 border border-gray-700/40 px-3 py-2.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                                {rule.electricityPriceOperator ?? 'AND'}
                            </span>
                            <p className="text-sm text-gray-200 leading-snug">
                                <span className="text-gray-400">Price</span>{' '}
                                <span className="text-sky-400 font-mono">{priceSym}</span>{' '}
                                <span className="font-medium text-white">{rule.electricityPriceThreshold} kr/kWh</span>
                                <span className="text-gray-500 ml-1 text-xs">({rule.electricityPriceArea})</span>
                            </p>
                        </div>
                    )}

                    {/* THEN block */}
                    <div className="rounded-lg bg-gray-900/70 border border-gray-700/40 px-3 py-2.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">THEN</span>
                        <p className="text-sm text-gray-200 leading-snug">
                            <span className={`font-semibold ${isOn ? 'text-green-400' : 'text-rose-400'}`}>Turn {isOn ? 'ON' : 'OFF'}</span>
                            {' '}{switchName}
                        </p>
                    </div>

                    {/* Timer block — shown prominently when set */}
                    {rule.timerDurationHours != null && (
                        <div className={`rounded-lg border px-3 py-2.5 ${rule.timerActivatedAt ? 'bg-sky-500/5 border-sky-500/20' : 'bg-gray-900/70 border-gray-700/40'}`}>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">AUTO-OFF</span>
                            <div className="flex items-center gap-1.5 text-sm text-gray-200">
                                <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>
                                    {rule.timerActivatedAt
                                        ? <><span className="font-medium text-sky-400">Active</span> — {formatTimerRemaining(rule.timerActivatedAt, rule.timerDurationHours)}</>
                                        : <>After <span className="font-semibold text-white">{rule.timerDurationHours}h</span></>
                                    }
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer: meta + edit */}
                <div className="px-4 pb-4 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        {triggered && (
                            <p className="text-xs text-gray-500 truncate">
                                Triggered: <span className="text-gray-400">{triggered}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => startEdit(rule)}
                        className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-700/60 border border-transparent hover:border-gray-600/40"
                    >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        Edit
                    </button>
                </div>
            </div>
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Automations</h1>

                </div>
                <button
                    onClick={openCreateDrawer}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-sky-900/20"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Rule
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <LoadingDots height="h-60" />
            ) : rules.length === 0 ? (
                emptyState
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 device-card-grid">
                    {sortedRules.map(rule => renderRuleCard(rule))}
                </div>
            )}

            {/* ── Slide-in drawer ────────────────────────────────────────────── */}
            <div
                role="dialog"
                aria-modal={formOpen ? 'true' : undefined}
                aria-hidden={!formOpen}
                className={`fixed inset-0 z-50 transition-all duration-300 ${formOpen ? 'visible' : 'invisible pointer-events-none'}`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${formOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={closeDrawer}
                />
                {/* Panel */}
                <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-700/60 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${formOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    {/* Drawer header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700/60 flex-shrink-0">
                        <div>
                            <h2 className="text-base font-semibold text-gray-100">
                                {isEditMode ? 'Edit Rule' : 'New Automation Rule'}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {isEditMode ? 'Modify conditions and action' : 'Set up a sensor-triggered action'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeDrawer}
                            aria-label="Close"
                            className="p-2 text-gray-500 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-all"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {isEditMode ? editFormContent : createFormContent}
                    </div>
                </div>
            </div>

            {/* ── Delete confirmation modal ──────────────────────────────────── */}
            {deleteTargetId !== null && (
                <ConfirmModal
                    title="Delete automation"
                    message="Are you sure you want to delete this rule? This cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={() => handleDelete(deleteTargetId)}
                    onCancel={() => setDeleteTargetId(null)}
                />
            )}
        </div>
    );
};

export default AutomationsPage;
