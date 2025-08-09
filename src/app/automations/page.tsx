"use client";

import { useEffect, useState } from 'react';
import AutomationService from '@/services/automationService';
import SwitchService, { Switch } from '@/services/switchService';
import SensorService, { Sensor } from '@/services/sensorService';
import { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto';
import { CreateAutomationRuleDto } from '@/dto/Automation/CreateAutomationRuleDto';
import { UpdateAutomationRuleDto } from '@/dto/Automation/UpdateAutomationRuleDto';
import { AxiosError } from 'axios';

const initialForm: CreateAutomationRuleDto = {
    targetType: '',
    targetId: 0,
    sensorType: '',
    sensorId: 0,
    condition: 'Turn on',
    threshold: 0,
    action: 'on',
};

const conditionOptions = [
    { label: 'Turn on', value: 'on' },
    { label: 'Turn off', value: 'off' },
];

const AutomationsPage: React.FC = () => {
    const [rules, setRules] = useState<AutomationRuleDto[]>([]);
    const [error, setError] = useState<string>('');
    const [form, setForm] = useState<CreateAutomationRuleDto>(initialForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<UpdateAutomationRuleDto | null>(null);

    const [switches, setSwitches] = useState<Switch[]>([]);
    const [sensors, setSensors] = useState<Sensor[]>([]);

    useEffect(() => {
        fetchRules();
        fetchSwitches();
        fetchSensors();
    }, []);

    const sortedSwitches = [...switches].sort((a, b) => {
        const nameA = (a.name ?? `Switch ${a.id}`).toLowerCase();
        const nameB = (b.name ?? `Switch ${b.id}`).toLowerCase();
        return nameA.localeCompare(nameB);
    });

    const sortedSensors = [...sensors].sort((a, b) => {
        const nameA = (a.customName ?? a.defaultName ?? `Sensor ${a.id}`).toLowerCase();
        const nameB = (b.customName ?? b.defaultName ?? `Sensor ${b.id}`).toLowerCase();
        return nameA.localeCompare(nameB);
    });

    const fetchRules = () => {
        AutomationService.getRules()
            .then(data => setRules(Array.isArray(data) ? data : []))
            .catch(handleError);
    };

    const fetchSwitches = async () => {
        try {
            const data = await SwitchService.getAllSwitches();
            setSwitches(Array.isArray(data) ? data : []);
        } catch (error: unknown) {
            handleError(error, 'Failed to fetch switches');
        }
    };

    const fetchSensors = async () => {
        try {
            const data = await SensorService.getAllSensors();
            setSensors(Array.isArray(data) ? data : []);
        } catch (error: unknown) {
            handleError(error, 'Failed to fetch sensors');
        }
    };

    const handleError = (error: unknown, fallbackMsg?: string) => {
        if (error instanceof AxiosError) {
            setError(error.response?.data?.message || fallbackMsg || 'A network error occurred');
        } else if (error instanceof Error) {
            setError(error.message);
        } else {
            setError(fallbackMsg || 'An unknown error occurred');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await AutomationService.createRule(form);
            setForm(initialForm);
            fetchRules();
        } catch (error: unknown) {
            handleError(error, 'Failed to create automation');
        }
    };

    const handleDelete = async (id: number) => {
        setError('');
        try {
            await AutomationService.deleteRule(id);
            fetchRules();
        } catch (error: unknown) {
            handleError(error, 'Failed to delete automation');
        }
    };

    const startEdit = (rule: AutomationRuleDto) => {
        setEditingId(rule.id);
        setEditForm({
            targetType: rule.targetType,
            targetId: rule.targetId,
            sensorType: rule.sensorType,
            sensorId: rule.sensorId,
            condition: conditionOptions.find(opt => opt.value === rule.action)?.label || 'Turn on',
            threshold: rule.threshold,
            action: rule.action,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId && editForm) {
            setError('');
            try {
                const updatedForm = {
                    ...editForm,
                    action: conditionOptions.find(opt => opt.label === editForm.condition)?.value || 'on',
                };
                await AutomationService.updateRule(editingId, updatedForm);
                cancelEdit();
                fetchRules();
            } catch (error: unknown) {
                handleError(error, 'Failed to update automation');
            }
        }
    };

    const handleTargetChange = (id: number) => {
        const selected = switches.find(sw => sw.id === id);
        setForm({
            ...form,
            targetId: id,
            targetType: selected?.type || '',
        });
    };

    const handleSensorChange = (id: number) => {
        const selected = sensors.find(s => s.id === id);
        setForm({
            ...form,
            sensorId: id,
            sensorType: selected?.type || '',
        });
    };

    const handleConditionChange = (label: string) => {
        const value = conditionOptions.find(opt => opt.label === label)?.value || 'on';
        setForm({
            ...form,
            condition: label,
            action: value,
        });
    };

    return (
        <div className="p-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">Automations</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="my-4">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block mb-2">Target</label>
                        <select
                            value={form.targetId}
                            onChange={e => handleTargetChange(Number(e.target.value))}
                            required
                            className="gargeDropdown"
                        >
                            <option value={0}>Select Target</option>
                            {sortedSwitches.map(sw => (
                                <option key={sw.id} value={sw.id}>
                                    {sw.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2">Sensor</label>
                        <select
                            value={form.sensorId}
                            onChange={e => handleSensorChange(Number(e.target.value))}
                            required
                            className="gargeDropdown"
                        >
                            <option value={0}>Select Sensor</option>
                            {sortedSensors.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.customName ?? s.defaultName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2">Condition</label>
                        <select
                            value={form.condition}
                            onChange={e => handleConditionChange(e.target.value)}
                            required
                            className="gargeDropdown"
                        >
                            {conditionOptions.map(opt => (
                                <option key={opt.value} value={opt.label}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2">Threshold</label>
                        <input
                            className="block w-full p-2 border rounded bg-gray-800 text-gray-200"
                            type="number"
                            placeholder="Threshold"
                            value={form.threshold}
                            onChange={e => setForm({ ...form, threshold: Number(e.target.value) })}
                            required
                        />
                    </div>
                    <button type="submit" className="gargeBtnActive w-full">Create</button>
                </form>
            </div>

            <div className="my-4">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Automations</h2>
                {!rules.length ? (
                    <p className="text-gray-400">No automations found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rules.map(rule => {
                            const switchObj = switches.find(sw => sw.id === rule.targetId);
                            const sensorObj = sensors.find(s => s.id === rule.sensorId);
                            const isEditing = editingId === rule.id && editForm;
                            return (
                                <div key={rule.id} className="bg-gray-800 rounded-lg shadow p-4 flex flex-col">
                                    <span className="text-lg font-bold text-gray-100 mb-1">
                                        {switchObj?.name ?? `Switch ${rule.targetId}`} &rarr; {rule.action}
                                    </span>
                                    <span className="text-gray-400 text-sm mb-2">
                                        Sensor: {sensorObj?.customName ?? sensorObj?.defaultName}
                                    </span>
                                    <span className="text-gray-500 text-xs mb-1">
                                        Condition: {rule.condition}
                                    </span>
                                    <span className="text-gray-500 text-xs mb-1">
                                        Threshold: {rule.threshold}
                                    </span>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <form onSubmit={handleUpdate} className="space-y-2">
                                                <div>
                                                    <label className="block mb-2">Target</label>
                                                    <select
                                                        value={editForm.targetId}
                                                        onChange={e => {
                                                            const id = Number(e.target.value);
                                                            const selected = switches.find(sw => sw.id === id);
                                                            setEditForm({
                                                                ...editForm,
                                                                targetId: id,
                                                                targetType: selected?.type || '',
                                                            });
                                                        }}
                                                        className="gargeDropdown"
                                                        required
                                                    >
                                                        <option value={0}>Select Target</option>
                                                        {sortedSwitches.map(sw => (
                                                            <option key={sw.id} value={sw.id}>
                                                                {sw.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block mb-2">Sensor</label>
                                                    <select
                                                        value={editForm.sensorId}
                                                        onChange={e => {
                                                            const id = Number(e.target.value);
                                                            const selected = sensors.find(s => s.id === id);
                                                            setEditForm({
                                                                ...editForm,
                                                                sensorId: id,
                                                                sensorType: selected?.type || '',
                                                            });
                                                        }}
                                                        className="gargeDropdown"
                                                        required
                                                    >
                                                        <option value={0}>Select Sensor</option>
                                                        {sortedSensors.map(s => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.customName ?? s.defaultName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block mb-2">Condition</label>
                                                    <select
                                                        value={editForm.condition}
                                                        onChange={e => {
                                                            const label = e.target.value;
                                                            const value = conditionOptions.find(opt => opt.label === label)?.value || 'on';
                                                            setEditForm({
                                                                ...editForm,
                                                                condition: label,
                                                                action: value,
                                                            });
                                                        }}
                                                        className="gargeDropdown"
                                                        required
                                                    >
                                                        {conditionOptions.map(opt => (
                                                            <option key={opt.value} value={opt.label}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block mb-2">Threshold</label>
                                                    <input
                                                        className="block w-full p-2 border rounded bg-gray-800 text-gray-200"
                                                        type="number"
                                                        value={editForm.threshold}
                                                        onChange={e => setEditForm({ ...editForm, threshold: Number(e.target.value) })}
                                                        required
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex gap-2">
                                                        <button type="submit" className="gargeBtnActive gargeBtnSmall">Save</button>
                                                        <button type="button" className="gargeBtnWarning gargeBtnSmall" onClick={cancelEdit}>Cancel</button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="gargeBtnWarning gargeBtnSmall"
                                                        onClick={() => handleDelete(rule.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 mt-2">
                                            <button className="gargeBtnActive gargeBtnSmall" onClick={() => startEdit(rule)}>Edit</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutomationsPage;
