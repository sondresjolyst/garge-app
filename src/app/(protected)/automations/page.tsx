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
import ConfirmModal from '@/components/ConfirmModal';
import {
    PlusIcon,
    XMarkIcon,
    ClockIcon,
    PencilSquareIcon,
    TrashIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';
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
    { label: 'Equals',                value: '==' },
    { label: 'Less than',             value: '<'  },
    { label: 'Greater than',          value: '>'  },
    { label: 'Less than or equal',    value: '<=' },
    { label: 'Greater than or equal', value: '>=' },
];

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

// ── Shared field components ───────────────────────────────────────────────────

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
        {children}
    </label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...props }) => (
    <select
        className={`block w-full px-3 py-2.5 bg-gray-800 border border-gray-600/60 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all ${className}`}
        {...props}
    />
);

const NumberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', onFocus, ...props }) => (
    <input
        type="number"
        className={`block w-full px-3 py-2.5 bg-gray-800 border border-gray-600/60 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all ${className}`}
        onFocus={e => { e.currentTarget.select(); onFocus?.(e); }}
        {...props}
    />
);

const LoadingDots = () => (
    <div className="h-60 flex items-center justify-center">
        <div className="flex gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-bounce [animation-delay:300ms]" />
        </div>
    </div>
);

const Toggle: React.FC<{ enabled: boolean; onClick: () => void; title?: string }> = ({ enabled, onClick, title }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${enabled ? 'bg-sky-600' : 'bg-gray-600'}`}
    >
        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
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
        <div className="pt-4 border-t border-gray-700/60">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-sm font-medium text-gray-300">Electricity price condition</p>
                    <p className="text-xs text-gray-500 mt-0.5">Also check current electricity price</p>
                </div>
                <Toggle enabled={enabled} onClick={toggle} />
            </div>
            {enabled && (
                <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-3">
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

    useEffect(() => {
        Promise.all([fetchRules(), fetchSwitches(), fetchSensors(), fetchUserPriceZone()])
            .finally(() => setLoading(false));
    }, []);

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
        catch (e) { handleError(e, 'Failed to fetch switches'); }
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
        if (err instanceof AxiosError)  setError(err.response?.data?.message || fallbackMsg || 'A network error occurred');
        else if (err instanceof Error)  setError(err.message);
        else                            setError(fallbackMsg || 'An unknown error occurred');
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

    const handleTargetChange = (id: number) => {
        const selected = switches.find(sw => sw.id === id);
        setForm({ ...form, targetId: id, targetType: selected?.type || '' });
    };
    const handleSensorChange = (id: number) => {
        const selected = sensors.find(s => s.id === id);
        setForm({ ...form, sensorId: id, sensorType: selected?.type || '' });
    };

    // ── Derived values ─────────────────────────────────────────────────────────
    const isEditMode     = editingId !== null && editForm !== null;
    const editSensorObj  = sensors.find(s => s.id === editForm?.sensorId);
    const editUnit       = editSensorObj ? unitForType(editSensorObj.type) : '';
    const createSensorObj = sensors.find(s => s.id === form.sensorId);
    const createUnit      = createSensorObj ? unitForType(createSensorObj.type) : '';

    const openCreateDrawer = () => { setEditingId(null); setEditForm(null); setFormOpen(true); };
    const closeDrawer      = () => { setFormOpen(false); setEditingId(null); setEditForm(null); };

    // ── Form contents (shared between drawer modes) ────────────────────────────

    const createFormContent = (
        <form onSubmit={handleCreate} className="space-y-5">
            <div>
                <FieldLabel>Target socket</FieldLabel>
                <Select value={form.targetId} required onChange={e => handleTargetChange(Number(e.target.value))}>
                    <option value={0}>Select a switch or socket</option>
                    {sortedSwitches.map(sw => <option key={sw.id} value={sw.id}>{sw.customName ?? sw.name}</option>)}
                </Select>
            </div>
            <div>
                <FieldLabel>Trigger sensor</FieldLabel>
                <Select value={form.sensorId} required onChange={e => handleSensorChange(Number(e.target.value))}>
                    <option value={0}>Select a sensor</option>
                    {sortedSensors.map(s => <option key={s.id} value={s.id}>{s.customName ?? s.defaultName}</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <div className="pt-4 border-t border-gray-700/60">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-medium text-gray-300">Auto-off timer</p>
                            <p className="text-xs text-gray-500 mt-0.5">Automatically turn off after a set duration</p>
                        </div>
                        <Toggle
                            enabled={!!form.timerDurationHours}
                            onClick={() => setForm({ ...form, timerDurationHours: form.timerDurationHours ? undefined : 2 })}
                        />
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
                key="create"
                value={form}
                defaultArea={defaultPriceArea}
                onChange={fields => setForm({ ...form, ...fields })}
            />
            <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all">
                    {submitting ? 'Creating…' : 'Create Rule'}
                </button>
                <button type="button" onClick={closeDrawer}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-all">
                    Cancel
                </button>
            </div>
        </form>
    );

    const editFormContent = editForm && (
        <form onSubmit={handleUpdate} className="space-y-5">
            <div>
                <FieldLabel>Target socket</FieldLabel>
                <Select value={editForm.targetId} required onChange={e => {
                    const id = Number(e.target.value);
                    setEditForm({ ...editForm, targetId: id, targetType: switches.find(sw => sw.id === id)?.type || '' });
                }}>
                    <option value={0}>Select a switch or socket</option>
                    {sortedSwitches.map(sw => <option key={sw.id} value={sw.id}>{sw.customName ?? sw.name}</option>)}
                </Select>
            </div>
            <div>
                <FieldLabel>Trigger sensor</FieldLabel>
                <Select value={editForm.sensorId} required onChange={e => {
                    const id = Number(e.target.value);
                    setEditForm({ ...editForm, sensorId: id, sensorType: sensors.find(s => s.id === id)?.type || '' });
                }}>
                    <option value={0}>Select a sensor</option>
                    {sortedSensors.map(s => <option key={s.id} value={s.id}>{s.customName ?? s.defaultName}</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <FieldLabel>Condition</FieldLabel>
                    <Select value={editForm.condition} required onChange={e => setEditForm({ ...editForm, condition: e.target.value })}>
                        {conditionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                </div>
                <div>
                    <FieldLabel>Threshold{editUnit ? ` (${editUnit})` : ''}</FieldLabel>
                    <NumberInput value={editForm.threshold} step="0.1" required
                        onChange={e => setEditForm({ ...editForm, threshold: Number(e.target.value) })} />
                </div>
            </div>
            <div>
                <FieldLabel>Action</FieldLabel>
                <Select value={editForm.action} required onChange={e => setEditForm({ ...editForm, action: e.target.value })}>
                    {actionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
            </div>
            {editForm.action === 'on' && (
                <div className="pt-4 border-t border-gray-700/60">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-medium text-gray-300">Auto-off timer</p>
                            <p className="text-xs text-gray-500 mt-0.5">Automatically turn off after a set duration</p>
                        </div>
                        <Toggle
                            enabled={!!editForm.timerDurationHours}
                            onClick={() => setEditForm({ ...editForm, timerDurationHours: editForm.timerDurationHours ? undefined : 2 })}
                        />
                    </div>
                    {editForm.timerDurationHours != null && (
                        <div>
                            <FieldLabel>Duration (hours)</FieldLabel>
                            <NumberInput value={editForm.timerDurationHours} step="0.5" min="0.5" placeholder="2"
                                onChange={e => setEditForm({ ...editForm, timerDurationHours: Number(e.target.value) })} />
                        </div>
                    )}
                </div>
            )}
            <PriceConditionForm
                key={editingId ?? 'edit'}
                value={editForm}
                defaultArea={defaultPriceArea}
                onChange={fields => setEditForm({ ...editForm, ...fields })}
            />
            <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all">
                    {submitting ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeDrawer}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-all">
                    Cancel
                </button>
            </div>
            <div className="pt-4 border-t border-gray-700/60">
                <button
                    type="button"
                    onClick={() => editingId && setDeleteTargetId(editingId)}
                    className="w-full px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-600/30 text-rose-400 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    <TrashIcon className="h-4 w-4" />
                    Delete Rule
                </button>
            </div>
        </form>
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
                    { step: '1', title: 'Choose a switch', desc: 'Pick which socket or relay to control' },
                    { step: '2', title: 'Set a trigger',   desc: 'Select a sensor and the condition that fires the rule' },
                    { step: '3', title: 'Define the action', desc: 'Turn the switch on or off when conditions are met' },
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
        const switchName = switchObj ? (switchObj.customName ?? switchObj.name) : `Switch ${rule.targetId}`;
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
                    <Toggle
                        enabled={rule.isEnabled}
                        onClick={() => handleToggleEnabled(rule)}
                        title={rule.isEnabled ? 'Disable rule' : 'Enable rule'}
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
                <LoadingDots />
            ) : rules.length === 0 ? (
                emptyState
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 device-card-grid">
                    {[...rules]
                        .sort((a, b) => {
                            if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1;
                            const nameA = (switches.find(sw => sw.id === a.targetId)?.customName ?? switches.find(sw => sw.id === a.targetId)?.name ?? '').toLowerCase();
                            const nameB = (switches.find(sw => sw.id === b.targetId)?.customName ?? switches.find(sw => sw.id === b.targetId)?.name ?? '').toLowerCase();
                            return nameA.localeCompare(nameB);
                        })
                        .map(rule => renderRuleCard(rule))}
                </div>
            )}

            {/* ── Slide-in drawer ────────────────────────────────────────────── */}
            <div className={`fixed inset-0 z-50 transition-all duration-300 ${formOpen ? 'visible' : 'invisible pointer-events-none'}`}>
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
