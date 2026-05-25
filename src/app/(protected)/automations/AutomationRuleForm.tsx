"use client";

import React, { useState } from 'react';
import { TrashIcon, BoltIcon } from '@heroicons/react/24/outline';
import ToggleSwitch from '@/components/ToggleSwitch';
import { Switch } from '@/services/switchService';
import { Sensor } from '@/services/sensorService';
import { CreateAutomationRuleDto } from '@/dto/Automation/CreateAutomationRuleDto';
import { unitForType } from '@/lib/typeUtils';

const PRICE_AREAS = ['NO1', 'NO2', 'NO3', 'NO4', 'NO5'];

export const conditionOptions = [
    { label: 'Equals',                value: '==' },
    { label: 'Less than',             value: '<'  },
    { label: 'Greater than',          value: '>'  },
    { label: 'Less than or equal',    value: '<=' },
    { label: 'Greater than or equal', value: '>=' },
];

const actionOptions = [
    { label: 'Turn On',  value: 'on'  },
    { label: 'Turn Off', value: 'off' },
];

export const checkCondition = (value: number, condition: string, threshold: number): boolean => {
    switch (condition) {
        case '==': return value === threshold;
        case '<':  return value < threshold;
        case '>':  return value > threshold;
        case '<=': return value <= threshold;
        case '>=': return value >= threshold;
        default:   return false;
    }
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
        onFocus={e => { const el = e.currentTarget; setTimeout(() => el.select(), 0); onFocus?.(e); }}
        {...props}
    />
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
                <ToggleSwitch
                    checked={enabled}
                    onChange={toggle}
                    ariaLabel={enabled ? 'Disable electricity price condition' : 'Enable electricity price condition'}
                />
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

// ── AutomationRuleForm ────────────────────────────────────────────────────────

export interface AutomationRuleFormProps {
    /** Current form values. Shared shape for both create and edit. */
    value: CreateAutomationRuleDto;
    onChange: (next: CreateAutomationRuleDto) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitting: boolean;
    mode: 'create' | 'edit';
    sortedSwitches: Switch[];
    sortedSensors: Sensor[];
    sensors: Sensor[];
    /** Latest reading per sensor id, for the "would trigger now" preview. */
    latestValueMap: Record<number, number>;
    defaultPriceArea: string;
    /** Stable key for the price sub-form so its local enabled state resets per rule. */
    priceFormKey: React.Key;
    /** Edit-mode delete action; required when mode === 'edit'. */
    onDelete?: () => void;
}

const AutomationRuleForm: React.FC<AutomationRuleFormProps> = ({
    value,
    onChange,
    onSubmit,
    onCancel,
    submitting,
    mode,
    sortedSwitches,
    sortedSensors,
    sensors,
    latestValueMap,
    defaultPriceArea,
    priceFormKey,
    onDelete,
}) => {
    const sensorObj = sensors.find(s => s.id === value.sensorId);
    const unit = sensorObj ? unitForType(sensorObj.type) : '';

    const handleTargetChange = (id: number) => {
        onChange({ ...value, targetId: id, targetType: sortedSwitches.find(sw => sw.id === id)?.type || '' });
    };
    const handleSensorChange = (id: number) => {
        onChange({ ...value, sensorId: id, sensorType: sensors.find(s => s.id === id)?.type || '' });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div>
                <FieldLabel>Target socket</FieldLabel>
                <Select value={value.targetId} required onChange={e => handleTargetChange(Number(e.target.value))}>
                    <option value={0}>Select a socket</option>
                    {sortedSwitches.map(sw => <option key={sw.id} value={sw.id}>{sw.customName ?? sw.name}</option>)}
                </Select>
            </div>
            <div>
                <FieldLabel>Trigger sensor</FieldLabel>
                <Select value={value.sensorId} required onChange={e => handleSensorChange(Number(e.target.value))}>
                    <option value={0}>Select a sensor</option>
                    {sortedSensors.map(s => <option key={s.id} value={s.id}>{s.customName ?? s.defaultName}</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <FieldLabel>Condition</FieldLabel>
                    <Select value={value.condition} required onChange={e => onChange({ ...value, condition: e.target.value })}>
                        {conditionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                </div>
                <div>
                    <FieldLabel>Threshold{unit ? ` (${unit})` : ''}</FieldLabel>
                    <NumberInput value={value.threshold} step="0.1" placeholder="0" required
                        onChange={e => onChange({ ...value, threshold: Number(e.target.value) })} />
                </div>
            </div>
            {value.sensorId > 0 && latestValueMap[value.sensorId] !== undefined && (() => {
                const current = latestValueMap[value.sensorId];
                const met = checkCondition(current, value.condition, value.threshold);
                return (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${met ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-gray-800/50 border-gray-700/30 text-gray-500'}`}>
                        <BoltIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        {met ? `Would trigger now — current value: ${current}${unit ? ` ${unit}` : ''}` : `Would not trigger — current value: ${current}${unit ? ` ${unit}` : ''}`}
                    </div>
                );
            })()}
            <div>
                <FieldLabel>Action</FieldLabel>
                <Select value={value.action} required onChange={e => onChange({ ...value, action: e.target.value })}>
                    {actionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
            </div>
            {value.action === 'on' && (
                <div className="pt-4 border-t border-gray-700/60">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-medium text-gray-300">Auto-off timer</p>
                            <p className="text-xs text-gray-500 mt-0.5">Automatically turn off after a set duration</p>
                        </div>
                        <ToggleSwitch
                            checked={!!value.timerDurationHours}
                            onChange={() => onChange({ ...value, timerDurationHours: value.timerDurationHours ? undefined : 2 })}
                            ariaLabel={value.timerDurationHours ? 'Disable auto-off timer' : 'Enable auto-off timer'}
                        />
                    </div>
                    {value.timerDurationHours != null && (
                        <div>
                            <FieldLabel>Duration (hours)</FieldLabel>
                            <NumberInput value={value.timerDurationHours} step="0.5" min="0.5" placeholder="2"
                                onChange={e => onChange({ ...value, timerDurationHours: Number(e.target.value) })} />
                        </div>
                    )}
                </div>
            )}
            <PriceConditionForm
                key={priceFormKey}
                value={value}
                defaultArea={defaultPriceArea}
                onChange={fields => onChange({ ...value, ...fields })}
            />
            <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all">
                    {mode === 'create'
                        ? (submitting ? 'Creating…' : 'Create Rule')
                        : (submitting ? 'Saving…' : 'Save Changes')}
                </button>
                <button type="button" onClick={onCancel}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-all">
                    Cancel
                </button>
            </div>
            {mode === 'edit' && (
                <div className="pt-4 border-t border-gray-700/60">
                    <button
                        type="button"
                        onClick={onDelete}
                        className="w-full px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-600/30 text-rose-400 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <TrashIcon className="h-4 w-4" />
                        Delete Rule
                    </button>
                </div>
            )}
        </form>
    );
};

export default AutomationRuleForm;
