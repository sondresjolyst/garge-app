"use client";

import { useEffect, useState } from 'react';
import AutomationService from '@/services/automationService';
import SwitchService, { Switch } from '@/services/switchService';
import SensorService, { Sensor } from '@/services/sensorService';
import { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto';
import { CreateAutomationRuleDto } from '@/dto/Automation/CreateAutomationRuleDto';
import { UpdateAutomationRuleDto } from '@/dto/Automation/UpdateAutomationRuleDto';
import { AxiosError } from 'axios';
import AutomationRuleForm from './AutomationRuleForm';

const initialCondition = {
    sensorType: '',
    sensorId: 0,
    condition: '==',
    threshold: 0,
};

const initialForm: CreateAutomationRuleDto = {
    targetType: '',
    targetId: 0,
    conditions: [initialCondition],
    action: 'on',
};

const conditionOptions = [
    { label: 'Equals', value: '==' },
    { label: 'Less than', value: '<' },
    { label: 'Greater than', value: '>' },
    { label: 'Less than or equal', value: '<=' },
    { label: 'Greater than or equal', value: '>=' },
];

const actionOptions = [
    { label: 'On', value: 'on' },
    { label: 'Off', value: 'off' },
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Creation form handlers
    const addCondition = () => {
        setForm({
            ...form,
            conditions: Array.isArray(form.conditions)
                ? [...form.conditions, { ...initialCondition }]
                : [{ ...initialCondition }],
        });
    };

    const removeCondition = (index: number) => {
        setForm({
            ...form,
            conditions: Array.isArray(form.conditions)
                ? form.conditions.filter((_, i) => i !== index)
                : [],
        });
    };

    const updateCondition = (index: number, updated: Partial<typeof initialCondition>) => {
        setForm({
            ...form,
            conditions: Array.isArray(form.conditions)
                ? form.conditions.map((cond, i) =>
                    i === index ? { ...cond, ...updated } : cond
                )
                : [],
        });
    };

    // Edit form handlers
    const addEditCondition = () => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            conditions: Array.isArray(editForm.conditions)
                ? [...editForm.conditions, { ...initialCondition }]
                : [{ ...initialCondition }],
        });
    };

    const removeEditCondition = (index: number) => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            conditions: Array.isArray(editForm.conditions)
                ? editForm.conditions.filter((_, i) => i !== index)
                : [],
        });
    };

    const updateEditCondition = (index: number, updated: Partial<typeof initialCondition>) => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            conditions: Array.isArray(editForm.conditions)
                ? editForm.conditions.map((cond, i) =>
                    i === index ? { ...cond, ...updated } : cond
                )
                : [],
        });
    };

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
            conditions: Array.isArray(rule.conditions) ? rule.conditions : [],
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
                await AutomationService.updateRule(editingId, editForm);
                cancelEdit();
                fetchRules();
            } catch (error: unknown) {
                handleError(error, 'Failed to update automation');
            }
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">Automations</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="my-4">
                <AutomationRuleForm
                    form={form}
                    setForm={setForm}
                    onSubmit={handleCreate}
                    switches={sortedSwitches}
                    sensors={sortedSensors}
                    conditionOptions={conditionOptions}
                    actionOptions={actionOptions}
                    addCondition={addCondition}
                    removeCondition={removeCondition}
                    updateCondition={updateCondition}
                />
            </div>

            <div className="my-4">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Automations</h2>
                {!rules.length ? (
                    <p className="text-gray-400">No automations found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rules.map(rule => {
                            const switchObj = switches.find(sw => sw.id === rule.targetId);
                            const isEditing = editingId === rule.id && editForm;
                            return (
                                <div key={rule.id} className="bg-gray-800 rounded-lg shadow p-4 flex flex-col">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-lg font-bold text-gray-100">
                                            {switchObj?.name ?? `Switch ${rule.targetId}`} &rarr; {rule.action}
                                        </span>
                                        {!isEditing && (
                                            <button
                                                className="gargeBtnActive gargeBtnSmall ml-2"
                                                onClick={() => startEdit(rule)}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                    {(Array.isArray(rule.conditions) ? rule.conditions : []).map(
                                        (
                                            cond: {
                                                sensorType: string;
                                                sensorId: number;
                                                condition: string;
                                                threshold: number;
                                            },
                                            idx: number
                                        ) => (
                                            <span key={idx} className="text-gray-500 text-xs mb-1 block">
                                                Sensor: {sensors.find(s => s.id === cond.sensorId)?.customName ?? sensors.find(s => s.id === cond.sensorId)?.defaultName} |
                                                Condition: {conditionOptions.find(opt => opt.value === cond.condition)?.label ?? cond.condition} |
                                                Threshold: {cond.threshold}
                                            </span>
                                        )
                                    )}
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <AutomationRuleForm
                                                form={editForm}
                                                setForm={setEditForm}
                                                onSubmit={handleUpdate}
                                                switches={sortedSwitches}
                                                sensors={sortedSensors}
                                                conditionOptions={conditionOptions}
                                                actionOptions={actionOptions}
                                                addCondition={addEditCondition}
                                                removeCondition={removeEditCondition}
                                                updateCondition={updateEditCondition}
                                                isEditing={true}
                                                cancelEdit={cancelEdit}
                                                onDelete={() => handleDelete(rule.id)}
                                            />
                                        </div>
                                    ) : null}
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
