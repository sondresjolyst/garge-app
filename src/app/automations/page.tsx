"use client";

import { useEffect, useState } from 'react';
import AutomationService from '@/services/automationService';
import SwitchService, { Switch } from '@/services/switchService';
import SensorService, { Sensor } from '@/services/sensorService';
import { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto';
import { CreateAutomationRuleDto } from '@/dto/Automation/CreateAutomationRuleDto';
import { UpdateAutomationRuleDto } from '@/dto/Automation/UpdateAutomationRuleDto';
import { AutomationConditionDto } from '@/dto/Automation/AutomationConditionDto';
import { AxiosError } from 'axios';

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
    logicalOperator: 'AND' as 'AND' | 'OR',
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

const logicalOperatorOptions = [
    { label: 'AND (All conditions must be true)', value: 'AND' },
    { label: 'OR (Any condition can be true)', value: 'OR' },
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Create extended sensor list including electricity price as a virtual sensor
    const extendedSensorList = [
        ...sortedSensors,
        {
            id: -1, // Special ID for electricity price
            name: 'Electricity Price (NOK/kWh)',
            type: 'electricity_price',
            customName: 'Electricity Price (NOK/kWh)',
            defaultName: 'Electricity Price (NOK/kWh)',
        }
    ];

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
        
        // Validate that all conditions have valid sensor selections
        if (!form.conditions || form.conditions.some(c => c.sensorId === 0)) {
            setError('All conditions must have a sensor selected');
            return;
        }
        
        try {
            await AutomationService.createRule(form);
            setForm({
                targetType: '',
                targetId: 0,
                conditions: [{ ...initialCondition }],
                logicalOperator: 'AND',
                action: 'on',
            });
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
        
        // Handle both legacy single condition and new multiple conditions
        let conditions;
        
        // Handle .NET serialization format with $values wrapper
        const ruleConditions = rule.conditions && typeof rule.conditions === 'object' && '$values' in rule.conditions 
            ? (rule.conditions as { $values: AutomationConditionDto[] }).$values 
            : rule.conditions;
            
        if (ruleConditions && Array.isArray(ruleConditions) && ruleConditions.length > 0) {
            conditions = ruleConditions.map(c => ({
                id: c.id,
                sensorType: c.sensorType || '',
                sensorId: c.sensorId || 0,
                condition: c.condition || '==',
                threshold: c.threshold || 0,
            }));
        } else if (rule.sensorType && rule.sensorId && rule.condition !== undefined && rule.threshold !== undefined) {
            // Convert legacy single condition to new format
            conditions = [{
                sensorType: rule.sensorType,
                sensorId: rule.sensorId,
                condition: rule.condition,
                threshold: rule.threshold,
            }];
        } else {
            conditions = [{ ...initialCondition }];
        }

        setEditForm({
            targetType: rule.targetType,
            targetId: rule.targetId,
            conditions: conditions,
            logicalOperator: rule.logicalOperator || 'AND',
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
            
            // Validate that all conditions have valid sensor selections
            if (!editForm.conditions || editForm.conditions.some(c => c.sensorId === 0)) {
                setError('All conditions must have a sensor selected');
                return;
            }
            
            try {
                await AutomationService.updateRule(editingId, editForm);
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

    const handleConditionChange = (index: number, field: keyof typeof initialCondition, value: string | number) => {
        if (!form.conditions) return;
        const updatedConditions = [...form.conditions];
        if (field === 'sensorId') {
            const numValue = typeof value === 'string' ? Number(value) : value;
            let sensorType = '';
            
            if (numValue === -1) {
                // Special handling for electricity price
                sensorType = 'electricity_price';
            } else {
                const selected = sensors.find(s => s.id === numValue);
                sensorType = selected?.type || '';
            }
            
            updatedConditions[index] = {
                ...updatedConditions[index],
                sensorId: numValue,
                sensorType: sensorType,
            };
        } else if (field === 'threshold') {
            const numValue = typeof value === 'string' ? Number(value) : value;
            updatedConditions[index] = {
                ...updatedConditions[index],
                threshold: numValue,
            };
        } else {
            updatedConditions[index] = {
                ...updatedConditions[index],
                [field]: value as string,
            };
        }
        setForm({ ...form, conditions: updatedConditions });
    };

    const addCondition = () => {
        const newConditions = [...(form.conditions || []), { ...initialCondition }];
        setForm({ ...form, conditions: newConditions });
    };

    const removeCondition = (index: number) => {
        if (!form.conditions || form.conditions.length <= 1) return;
        const updatedConditions = form.conditions.filter((_, i) => i !== index);
        setForm({ ...form, conditions: updatedConditions });
    };

    // Similar functions for edit form
    const handleEditConditionChange = (index: number, field: keyof typeof initialCondition, value: string | number) => {
        if (!editForm?.conditions) return;
        const updatedConditions = [...editForm.conditions];
        if (field === 'sensorId') {
            const numValue = typeof value === 'string' ? Number(value) : value;
            let sensorType = '';
            
            if (numValue === -1) {
                // Special handling for electricity price
                sensorType = 'electricity_price';
            } else {
                const selected = sensors.find(s => s.id === numValue);
                sensorType = selected?.type || '';
            }
            
            updatedConditions[index] = {
                ...updatedConditions[index],
                sensorId: numValue,
                sensorType: sensorType,
            };
        } else if (field === 'threshold') {
            const numValue = typeof value === 'string' ? Number(value) : value;
            updatedConditions[index] = {
                ...updatedConditions[index],
                threshold: numValue,
            };
        } else {
            updatedConditions[index] = {
                ...updatedConditions[index],
                [field]: value as string,
            };
        }
        setEditForm({ ...editForm, conditions: updatedConditions });
    };

    const addEditCondition = () => {
        if (!editForm) return;
        const newConditions = [...(editForm.conditions || []), { ...initialCondition }];
        setEditForm({ ...editForm, conditions: newConditions });
    };

    const removeEditCondition = (index: number) => {
        if (!editForm?.conditions || editForm.conditions.length <= 1) return;
        const updatedConditions = editForm.conditions.filter((_, i) => i !== index);
        setEditForm({ ...editForm, conditions: updatedConditions });
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
                        <div className="flex items-center justify-between mb-2">
                            <label className="block">Conditions</label>
                            <button
                                type="button"
                                className="gargeBtnActive gargeBtnSmall"
                                onClick={addCondition}
                            >
                                Add Condition
                            </button>
                        </div>
                        
                        {form.conditions?.map((condition, index) => (
                            <div key={index} className="bg-gray-700 p-3 rounded mb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Condition {index + 1}</span>
                                    {form.conditions && form.conditions.length > 1 && (
                                        <button
                                            type="button"
                                            className="gargeBtnWarning gargeBtnSmall"
                                            onClick={() => removeCondition(index)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block mb-1 text-sm">Sensor</label>
                                        <select
                                            value={condition.sensorId}
                                            onChange={e => handleConditionChange(index, 'sensorId', Number(e.target.value))}
                                            required
                                            className="gargeDropdown w-full"
                                        >
                                            <option value={0}>Select Sensor</option>
                                            {extendedSensorList.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.customName ?? s.defaultName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block mb-1 text-sm">Condition</label>
                                        <select
                                            value={condition.condition}
                                            onChange={e => handleConditionChange(index, 'condition', e.target.value)}
                                            required
                                            className="gargeDropdown w-full"
                                        >
                                            {conditionOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="sm:col-span-2">
                                        <label className="block mb-1 text-sm">Threshold</label>
                                        <input
                                            className="block w-full p-2 border rounded bg-gray-800 text-gray-200"
                                            type="number"
                                            placeholder={condition.sensorId === -1 ? "e.g., 3.0 (NOK/kWh)" : "Threshold"}
                                            value={condition.threshold}
                                            step="0.1"
                                            onChange={e => handleConditionChange(index, 'threshold', Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {form.conditions && form.conditions.length > 1 && (
                            <div>
                                <label className="block mb-2">Logic Operator</label>
                                <select
                                    value={form.logicalOperator}
                                    onChange={e => setForm({ ...form, logicalOperator: e.target.value as 'AND' | 'OR' })}
                                    required
                                    className="gargeDropdown"
                                >
                                    {logicalOperatorOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <label className="block mb-2">Action</label>
                        <select
                            value={form.action}
                            onChange={e => setForm({ ...form, action: e.target.value })}
                            required
                            className="gargeDropdown"
                        >
                            {actionOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
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
                            const isEditing = editingId === rule.id && editForm;
                            
                            // Handle both legacy single condition and new multiple conditions
                            let displayConditions: AutomationConditionDto[] = [];
                            
                            // Handle .NET serialization format with $values wrapper
                            const ruleConditions = rule.conditions && typeof rule.conditions === 'object' && '$values' in rule.conditions 
                                ? (rule.conditions as { $values: AutomationConditionDto[] }).$values 
                                : rule.conditions;
                            
                            if (ruleConditions && Array.isArray(ruleConditions) && ruleConditions.length > 0) {
                                displayConditions = ruleConditions;
                            } else if (rule.sensorType && rule.sensorId && rule.condition !== undefined && rule.threshold !== undefined) {
                                // Convert legacy single condition to display format
                                displayConditions = [{
                                    sensorType: rule.sensorType,
                                    sensorId: rule.sensorId,
                                    condition: rule.condition,
                                    threshold: rule.threshold,
                                }];
                            }
                            return (
                                <div key={rule.id} className="gargeSecond flex flex-col">
                                    <span className="text-lg font-bold text-gray-100 mb-1">
                                        {switchObj?.name ?? `Switch ${rule.targetId}`} &rarr; {rule.action}
                                    </span>
                                    
                                    <div className="text-gray-400 text-sm mb-2">
                                        {displayConditions.length > 1 && (
                                            <span className="text-blue-400 font-medium mb-1 block">
                                                Logic: {rule.logicalOperator || 'AND'}
                                            </span>
                                        )}
                                        {displayConditions.map((condition, idx) => {
                                            let sensorName;
                                            if (condition.sensorId === -1) {
                                                sensorName = 'Electricity Price (NOK/kWh)';
                                            } else {
                                                const sensorObj = sensors.find(s => s.id === condition.sensorId);
                                                sensorName = sensorObj?.customName ?? sensorObj?.defaultName ?? `Sensor ${condition.sensorId}`;
                                            }
                                            
                                            return (
                                                <div key={idx} className="mb-1">
                                                    <span className="text-gray-300">
                                                        {sensorName}
                                                    </span>
                                                    <span className="text-gray-500 ml-2">
                                                        {conditionOptions.find(opt => opt.value === condition.condition)?.label ?? condition.condition} {condition.threshold}{condition.sensorId === -1 ? ' NOK/kWh' : ''}
                                                    </span>
                                                    {idx < displayConditions.length - 1 && displayConditions.length > 1 && (
                                                        <span className="text-blue-400 ml-2">{rule.logicalOperator || 'AND'}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
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
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="block">Conditions</label>
                                                        <button
                                                            type="button"
                                                            className="gargeBtnActive gargeBtnSmall"
                                                            onClick={addEditCondition}
                                                        >
                                                            Add Condition
                                                        </button>
                                                    </div>
                                                    
                                                    {editForm.conditions?.map((condition, index) => (
                                                        <div key={index} className="bg-gray-700 p-4 rounded mb-2">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">Condition {index + 1}</span>
                                                                {editForm.conditions && editForm.conditions.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        className="gargeBtnWarning gargeBtnSmall"
                                                                        onClick={() => removeEditCondition(index)}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="block mb-1 text-sm">Sensor</label>
                                                                    <select
                                                                        value={condition.sensorId}
                                                                        onChange={e => handleEditConditionChange(index, 'sensorId', Number(e.target.value))}
                                                                        required
                                                                        className="gargeDropdown w-full"
                                                                    >
                                                                        <option value={0}>Select Sensor</option>
                                                                        {extendedSensorList.map(s => (
                                                                            <option key={s.id} value={s.id}>
                                                                                {s.customName ?? s.defaultName}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                
                                                                <div>
                                                                    <label className="block mb-1 text-sm">Condition</label>
                                                                    <select
                                                                        value={condition.condition}
                                                                        onChange={e => handleEditConditionChange(index, 'condition', e.target.value)}
                                                                        required
                                                                        className="gargeDropdown w-full"
                                                                    >
                                                                        {conditionOptions.map(opt => (
                                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                
                                                                <div className="sm:col-span-2">
                                                                    <label className="block mb-1 text-sm">Threshold</label>
                                                                    <input
                                                                        className="block w-full p-2 border rounded bg-gray-800 text-gray-200"
                                                                        type="number"
                                                                        placeholder={condition.sensorId === -1 ? "e.g., 3.0 (NOK/kWh)" : "Threshold"}
                                                                        value={condition.threshold}
                                                                        step="0.1"
                                                                        onChange={e => handleEditConditionChange(index, 'threshold', Number(e.target.value))}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    {editForm.conditions && editForm.conditions.length > 1 && (
                                                        <div>
                                                            <label className="block mb-2">Logic Operator</label>
                                                            <select
                                                                value={editForm.logicalOperator}
                                                                onChange={e => setEditForm({ ...editForm, logicalOperator: e.target.value as 'AND' | 'OR' })}
                                                                required
                                                                className="gargeDropdown"
                                                            >
                                                                {logicalOperatorOptions.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <label className="block mb-2">Action</label>
                                                    <select
                                                        value={editForm.action}
                                                        onChange={e => setEditForm({ ...editForm, action: e.target.value })}
                                                        className="gargeDropdown"
                                                        required
                                                    >
                                                        {actionOptions.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
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
