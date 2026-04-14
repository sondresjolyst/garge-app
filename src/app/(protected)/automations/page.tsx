"use client";

import React, { useEffect, useState } from 'react';
import AutomationService from '@/services/automationService';
import SwitchService, { Switch } from '@/services/switchService';
import SensorService, { Sensor } from '@/services/sensorService';
import UserService from '@/services/userService';
import { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto';
import { CreateAutomationRuleDto } from '@/dto/Automation/CreateAutomationRuleDto';
import { UpdateAutomationRuleDto } from '@/dto/Automation/UpdateAutomationRuleDto';
import { unitForType } from '@/lib/typeUtils';
import { formatDateTime } from '@/lib/dateUtils';
import { AxiosError } from 'axios';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const PRICE_AREAS = ['NO1', 'NO2', 'NO3', 'NO4', 'NO5'];

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

const conditionOptions = [
    { label: 'Equals',               value: '==' },
    { label: 'Less than',            value: '<'  },
    { label: 'Greater than',         value: '>'  },
    { label: 'Less than or equal',   value: '<=' },
    { label: 'Greater than or equal',value: '>=' },
];

const conditionSymbol: Record<string, string> = {
    '==': '=', '<': '<', '>': '>', '<=': '≤', '>=': '≥',
};

const actionOptions = [
    { label: 'Turn On',  value: 'on'  },
    { label: 'Turn Off', value: 'off' },
];

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

// ── Field components ──────────────────────────────────────────────────────────
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
        {children}
    </label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...props }) => (
    <select
        className={`block w-full px-3 py-2 bg-gray-900/70 border border-gray-700/60 rounded-xl text-gray-200 text-sm focus:outline-none focus:border-sky-500 transition-colors ${className}`}
        {...props}
    />
);

const NumberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
    <input
        type="number"
        className={`block w-full px-3 py-2 bg-gray-900/70 border border-gray-700/60 rounded-xl text-gray-200 text-sm focus:outline-none focus:border-sky-500 transition-colors ${className}`}
        {...props}
    />
);

const LoadingDots = () => (
    <div className="h-40 flex items-center justify-center">
        <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:300ms]" />
        </div>
    </div>
);

// ── Electricity price sub-form ────────────────────────────────────────────────
interface PriceConditionFields {
    electricityPriceCondition?: string;
    electricityPriceThreshold?: number;
    electricityPriceArea?: string;
    electricityPriceOperator?: string;
}

interface PriceConditionFormProps {
    value: PriceConditionFields;
    defaultArea: string;
    onChange: (v: PriceConditionFields) => void;
}

const PriceConditionForm: React.FC<PriceConditionFormProps> = ({ value, defaultArea, onChange }) => {
    const [enabled, setEnabled] = useState(!!value.electricityPriceCondition);

    const toggle = () => {
        const next = !enabled;
        setEnabled(next);
        if (!next) {
            onChange({
                electricityPriceCondition: undefined,
                electricityPriceThreshold: undefined,
                electricityPriceArea: undefined,
                electricityPriceOperator: undefined,
            });
        } else {
            onChange({
                electricityPriceCondition: '<',
                electricityPriceThreshold: 0,
                electricityPriceArea: value.electricityPriceArea || defaultArea,
                electricityPriceOperator: 'AND',
            });
        }
    };

    return (
        <div className="pt-2 border-t border-gray-700/40">
            <div className="flex items-center gap-2 mb-2">
                <button
                    type="button"
                    onClick={toggle}
                    className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none ${enabled ? 'bg-sky-600' : 'bg-gray-600'}`}
                >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Electricity price condition</span>
            </div>
            {enabled && (
                <div className="space-y-2">
                    <div>
                        <FieldLabel>Combine with sensor condition using</FieldLabel>
                        <Select value={value.electricityPriceOperator ?? 'AND'} onChange={e => onChange({ ...value, electricityPriceOperator: e.target.value })}>
                            <option value="AND">AND (both must be true)</option>
                            <option value="OR">OR (either can be true)</option>
                        </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <FieldLabel>Condition</FieldLabel>
                            <Select value={value.electricityPriceCondition ?? '<'} onChange={e => onChange({ ...value, electricityPriceCondition: e.target.value })}>
                                {conditionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Select>
                        </div>
                        <div>
                            <FieldLabel>Price (kr/kWh)</FieldLabel>
                            <NumberInput value={value.electricityPriceThreshold ?? 0} step="0.1" placeholder="0"
                                onChange={e => onChange({ ...value, electricityPriceThreshold: Number(e.target.value) })} />
                        </div>
                        <div>
                            <FieldLabel>Area</FieldLabel>
                            <Select value={value.electricityPriceArea ?? defaultArea} onChange={e => onChange({ ...value, electricityPriceArea: e.target.value })}>
                                {PRICE_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                            </Select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── AutomationsPage ───────────────────────────────────────────────────────────
const AutomationsPage: React.FC = () => {
    const [rules, setRules] = useState<AutomationRuleDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [form, setForm] = useState<CreateAutomationRuleDto>(initialForm);
    const [formOpen, setFormOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<UpdateAutomationRuleDto | null>(null);
    const [switches, setSwitches] = useState<Switch[]>([]);
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [defaultPriceArea, setDefaultPriceArea] = useState<string>('NO2');

    useEffect(() => {
        Promise.all([fetchRules(), fetchSwitches(), fetchSensors(), fetchUserPriceZone()])
            .finally(() => setLoading(false));
    }, []);

    const sortedSwitches = [...switches].sort((a, b) =>
        (a.name ?? '').toLowerCase().localeCompare((b.name ?? '').toLowerCase())
    );
    const sortedSensors = [...sensors].sort((a, b) =>
        (a.customName ?? a.defaultName ?? '').toLowerCase()
            .localeCompare((b.customName ?? b.defaultName ?? '').toLowerCase())
    );

    const fetchRules   = () => AutomationService.getRules()
        .then(data => setRules(Array.isArray(data) ? data : []))
        .catch(handleError);
    const fetchSwitches = async () => {
        try { setSwitches(await SwitchService.getAllSwitches()); }
        catch (e) { handleError(e, 'Failed to fetch switches'); }
    };
    const fetchSensors = async () => {
        try { setSensors(await SensorService.getAllSensors()); }
        catch (e) { handleError(e, 'Failed to fetch sensors'); }
    };
    const fetchUserPriceZone = async () => {
        try {
            const profile = await UserService.getUserProfile();
            if (profile.priceZone) setDefaultPriceArea(profile.priceZone);
        } catch { /* ignore */ }
    };

    const handleError = (error: unknown, fallbackMsg?: string) => {
        if (error instanceof AxiosError)   setError(error.response?.data?.message || fallbackMsg || 'A network error occurred');
        else if (error instanceof Error)   setError(error.message);
        else                               setError(fallbackMsg || 'An unknown error occurred');
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
                condition: rule.condition, threshold: rule.threshold,
                action: rule.action, isEnabled: !rule.isEnabled,
                electricityPriceCondition: rule.electricityPriceCondition,
                electricityPriceThreshold: rule.electricityPriceThreshold,
                electricityPriceArea: rule.electricityPriceArea,
                electricityPriceOperator: rule.electricityPriceOperator,
                timerDurationHours: rule.timerDurationHours,
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
            condition: rule.condition, threshold: rule.threshold,
            action: rule.action, isEnabled: rule.isEnabled,
            electricityPriceCondition: rule.electricityPriceCondition,
            electricityPriceThreshold: rule.electricityPriceThreshold,
            electricityPriceArea: rule.electricityPriceArea,
            electricityPriceOperator: rule.electricityPriceOperator,
            timerDurationHours: rule.timerDurationHours,
        });
    };

    const cancelEdit = () => { setEditingId(null); setEditForm(null); };

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

    const handleTargetChange = (id: number) => {
        const selected = switches.find(sw => sw.id === id);
        setForm({ ...form, targetId: id, targetType: selected?.type || '' });
    };
    const handleSensorChange = (id: number) => {
        const selected = sensors.find(s => s.id === id);
        setForm({ ...form, sensorId: id, sensorType: selected?.type || '' });
    };

    // ── Inline edit form ─────────────────────────────────────────────────────
    const editSensorObj = sensors.find(s => s.id === editForm?.sensorId);
    const editUnit = editSensorObj ? unitForType(editSensorObj.type) : '';

    const renderEditForm = (rule: AutomationRuleDto) => (
        <form onSubmit={handleUpdate} className="space-y-3 mt-3 pt-3 border-t border-gray-700/50">
            <div>
                <FieldLabel>Target</FieldLabel>
                <Select value={editForm!.targetId} required onChange={e => {
                    const id = Number(e.target.value);
                    setEditForm({ ...editForm!, targetId: id, targetType: switches.find(sw => sw.id === id)?.type || '' });
                }}>
                    <option value={0}>Select Target</option>
                    {sortedSwitches.map(sw => <option key={sw.id} value={sw.id}>{sw.name}</option>)}
                </Select>
            </div>
            <div>
                <FieldLabel>Sensor</FieldLabel>
                <Select value={editForm!.sensorId} required onChange={e => {
                    const id = Number(e.target.value);
                    setEditForm({ ...editForm!, sensorId: id, sensorType: sensors.find(s => s.id === id)?.type || '' });
                }}>
                    <option value={0}>Select Sensor</option>
                    {sortedSensors.map(s => <option key={s.id} value={s.id}>{s.customName ?? s.defaultName}</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <FieldLabel>Condition</FieldLabel>
                    <Select value={editForm!.condition} required onChange={e => setEditForm({ ...editForm!, condition: e.target.value })}>
                        {conditionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                </div>
                <div>
                    <FieldLabel>Threshold{editUnit ? ` (${editUnit})` : ''}</FieldLabel>
                    <NumberInput value={editForm!.threshold} step="0.1" required
                        onChange={e => setEditForm({ ...editForm!, threshold: Number(e.target.value) })} />
                </div>
            </div>
            <div>
                <FieldLabel>Action</FieldLabel>
                <Select value={editForm!.action} required onChange={e => setEditForm({ ...editForm!, action: e.target.value })}>
                    {actionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
            </div>
            {editForm!.action === 'on' && (
                <div className="pt-2 border-t border-gray-700/40">
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm!, timerDurationHours: editForm!.timerDurationHours ? undefined : 2 })}
                            className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none ${editForm!.timerDurationHours ? 'bg-sky-600' : 'bg-gray-600'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editForm!.timerDurationHours ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Auto-off timer</span>
                    </div>
                    {editForm!.timerDurationHours != null && (
                        <div>
                            <FieldLabel>Duration (hours)</FieldLabel>
                            <NumberInput value={editForm!.timerDurationHours} step="0.5" min="0.5" placeholder="2"
                                onChange={e => setEditForm({ ...editForm!, timerDurationHours: Number(e.target.value) })} />
                        </div>
                    )}
                </div>
            )}
            <PriceConditionForm
                value={editForm!}
                defaultArea={defaultPriceArea}
                onChange={fields => setEditForm({ ...editForm!, ...fields })}
            />
            <div className="flex items-center gap-2 pt-1">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all">{submitting ? 'Saving…' : 'Save'}</button>
                <button type="button" className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-xl transition-all" onClick={cancelEdit}>Cancel</button>
                <button type="button" className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-sm font-medium rounded-xl transition-all" onClick={() => handleDelete(rule.id)}>Delete</button>
            </div>
        </form>
    );

    // ── Threshold unit for create form ────────────────────────────────────────
    const createSensorObj = sensors.find(s => s.id === form.sensorId);
    const createUnit = createSensorObj ? unitForType(createSensorObj.type) : '';

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Automations</h1>
                <button
                    onClick={() => setFormOpen(o => !o)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm font-medium rounded-xl transition-all"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Rule
                </button>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* ── Create form ── */}
            {formOpen && (
                <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl backdrop-blur-sm shadow-lg p-5 mb-6">
                    <h2 className="text-base font-semibold text-gray-100 mb-4">New Automation Rule</h2>
                    <form onSubmit={handleCreate} className="space-y-3">
                        <div>
                            <FieldLabel>Target socket</FieldLabel>
                            <Select value={form.targetId} required onChange={e => handleTargetChange(Number(e.target.value))}>
                                <option value={0}>Select target</option>
                                {sortedSwitches.map(sw => <option key={sw.id} value={sw.id}>{sw.name}</option>)}
                            </Select>
                        </div>
                        <div>
                            <FieldLabel>Trigger sensor</FieldLabel>
                            <Select value={form.sensorId} required onChange={e => handleSensorChange(Number(e.target.value))}>
                                <option value={0}>Select sensor</option>
                                {sortedSensors.map(s => <option key={s.id} value={s.id}>{s.customName ?? s.defaultName}</option>)}
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <FieldLabel>Condition</FieldLabel>
                                <Select value={form.condition} required onChange={e => setForm({ ...form, condition: e.target.value })}>
                                    {conditionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </Select>
                            </div>
                            <div>
                                <FieldLabel>Threshold{createUnit ? ` (${createUnit})` : ''}</FieldLabel>
                                <NumberInput value={form.threshold} step="0.1" placeholder="0" required
                                    onChange={e => setForm({ ...form, threshold: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Action</FieldLabel>
                            <Select value={form.action} required onChange={e => setForm({ ...form, action: e.target.value })}>
                                {actionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Select>
                        </div>
                        {form.action === 'on' && (
                            <div className="pt-2 border-t border-gray-700/40">
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, timerDurationHours: form.timerDurationHours ? undefined : 2 })}
                                        className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none ${form.timerDurationHours ? 'bg-sky-600' : 'bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.timerDurationHours ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Auto-off timer</span>
                                </div>
                                {form.timerDurationHours != null && (
                                    <div>
                                        <FieldLabel>Duration (hours)</FieldLabel>
                                        <NumberInput value={form.timerDurationHours} step="0.5" min="0.5" placeholder="2"
                                            onChange={e => setForm({ ...form, timerDurationHours: Number(e.target.value) })} />
                                    </div>
                                )}
                            </div>
                        )}
                        <PriceConditionForm
                            value={form}
                            defaultArea={defaultPriceArea}
                            onChange={fields => setForm({ ...form, ...fields })}
                        />
                        <div className="flex gap-2 pt-1">
                            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all">{submitting ? 'Creating…' : 'Create'}</button>
                            <button type="button" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-xl transition-all" onClick={() => setFormOpen(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Rules ── */}
            {loading ? (
                <LoadingDots />
            ) : rules.length === 0 ? (
                <div className="mt-12 text-center text-gray-400 space-y-2">
                    <p>No automation rules yet.</p>
                    <p>Click <span className="text-sky-400">New Rule</span> to create one.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rules.map(rule => {
                        const switchObj = switches.find(sw => sw.id === rule.targetId);
                        const sensorObj = sensors.find(s => s.id === rule.sensorId);
                        const isEditing = editingId === rule.id && editForm;
                        const sym = conditionSymbol[rule.condition] ?? rule.condition;
                        const unit = sensorObj ? unitForType(sensorObj.type) : '';
                        const triggered = formatTriggered(rule.lastTriggeredAt);
                        const priceSym = rule.electricityPriceCondition ? (conditionSymbol[rule.electricityPriceCondition] ?? rule.electricityPriceCondition) : null;

                        return (
                            <div
                                key={rule.id}
                                className={`bg-gray-800/60 border rounded-2xl backdrop-blur-sm shadow-lg p-5 flex flex-col transition-opacity ${
                                    rule.isEnabled ? 'border-gray-700/40' : 'border-gray-700/20 opacity-60'
                                }`}
                            >
                                {/* Rule summary */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-base font-semibold truncate ${rule.isEnabled ? 'text-gray-100' : 'text-gray-400'}`}>
                                            {switchObj?.name ?? `Switch ${rule.targetId}`}
                                        </h3>
                                        <span className={`inline-flex items-center text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${
                                            rule.action === 'on'
                                                ? 'bg-green-500/15 text-green-400'
                                                : 'bg-red-500/15 text-red-400'
                                        }`}>
                                            Turn {rule.action}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                        {/* Enable/disable toggle */}
                                        <button
                                            title={rule.isEnabled ? 'Disable rule' : 'Enable rule'}
                                            onClick={() => handleToggleEnabled(rule)}
                                            className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none ${
                                                rule.isEnabled ? 'bg-sky-600' : 'bg-gray-600'
                                            }`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                                rule.isEnabled ? 'translate-x-4' : 'translate-x-0'
                                            }`} />
                                        </button>
                                        {!isEditing && (
                                            <button
                                                className="text-xs text-gray-500 hover:text-gray-200 transition-colors px-2 py-1 rounded-lg hover:bg-gray-700/50"
                                                onClick={() => startEdit(rule)}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Sensor condition pill */}
                                <div className="bg-gray-900/60 rounded-xl px-3 py-2 text-sm text-gray-300">
                                    When{' '}
                                    <span className="text-white font-medium">
                                        {sensorObj?.customName ?? sensorObj?.defaultName ?? `Sensor ${rule.sensorId}`}
                                    </span>{' '}
                                    <span className="text-sky-400 font-mono">{sym}</span>{' '}
                                    <span className="text-white font-medium">{rule.threshold}{unit ? ` ${unit}` : ''}</span>
                                </div>

                                {/* Electricity price condition pill */}
                                {priceSym && rule.electricityPriceThreshold !== undefined && (
                                    <div className="mt-1.5 bg-gray-900/60 rounded-xl px-3 py-2 text-sm text-gray-300">
                                        <span className="text-amber-400 font-medium text-xs uppercase tracking-wide">
                                            {rule.electricityPriceOperator ?? 'AND'}
                                        </span>{' '}price{' '}
                                        <span className="text-sky-400 font-mono">{priceSym}</span>{' '}
                                        <span className="text-white font-medium">{rule.electricityPriceThreshold} kr/kWh</span>
                                        <span className="text-gray-500 ml-1">({rule.electricityPriceArea})</span>
                                    </div>
                                )}

                                {/* Last triggered */}
                                {triggered && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        Last triggered: <span className="text-gray-400">{triggered}</span>
                                    </p>
                                )}

                                {/* Timer status pill */}
                                {rule.timerDurationHours != null && (
                                    <div className={`mt-1.5 rounded-xl px-3 py-2 text-sm ${rule.timerActivatedAt ? 'bg-amber-500/10 text-amber-300' : 'bg-gray-900/60 text-gray-400'}`}>
                                        {rule.timerActivatedAt
                                            ? <>⏱ Timer active &mdash; {formatTimerRemaining(rule.timerActivatedAt, rule.timerDurationHours)}</>
                                            : <>⏱ Auto-off after <span className="text-white font-medium">{rule.timerDurationHours}h</span></>
                                        }
                                    </div>
                                )}

                                {isEditing && renderEditForm(rule)}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AutomationsPage;
