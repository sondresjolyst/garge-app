import React from "react";
import { CreateAutomationRuleDto } from "@/dto/Automation/CreateAutomationRuleDto";
import { UpdateAutomationRuleDto } from "@/dto/Automation/UpdateAutomationRuleDto";
import { Switch } from "@/services/switchService";
import { Sensor } from "@/services/sensorService";

type ConditionOption = { label: string; value: string };
type ActionOption = { label: string; value: string };

type Condition = {
    sensorType: string;
    sensorId: number;
    condition: string;
    threshold: number;
};

type AutomationRuleFormProps = {
    form: CreateAutomationRuleDto | UpdateAutomationRuleDto;
    setForm: (form: CreateAutomationRuleDto | UpdateAutomationRuleDto) => void;
    onSubmit: (e: React.FormEvent) => void;
    switches: Switch[];
    sensors: Sensor[];
    conditionOptions: ConditionOption[];
    actionOptions: ActionOption[];
    addCondition: () => void;
    removeCondition: (idx: number) => void;
    updateCondition: (idx: number, updated: Partial<Condition>) => void;
    isEditing?: boolean;
    cancelEdit?: () => void;
    onDelete?: () => void;
};

export default function AutomationRuleForm({
    form,
    setForm,
    onSubmit,
    switches,
    sensors,
    conditionOptions,
    actionOptions,
    addCondition,
    removeCondition,
    updateCondition,
    isEditing = false,
    cancelEdit,
    onDelete
}: AutomationRuleFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block mb-2">Target</label>
                <select
                    value={form.targetId}
                    onChange={e => {
                        const id = Number(e.target.value);
                        const selected = switches.find(sw => sw.id === id);
                        setForm({
                            ...form,
                            targetId: id,
                            targetType: selected?.type || '',
                        });
                    }}
                    required
                    className="gargeDropdown"
                >
                    <option value={0}>Select Target</option>
                    {switches.map(sw => (
                        <option key={sw.id} value={sw.id}>{sw.name}</option>
                    ))}
                </select>
            </div>
            {form.conditions.map((cond, idx) => (
                <div key={idx} className="mb-4 border-b pb-2">
                    <label>Sensor</label>
                    <select
                        value={cond.sensorId}
                        onChange={e => updateCondition(idx, {
                            sensorId: Number(e.target.value),
                            sensorType: sensors.find(s => s.id === Number(e.target.value))?.type || ''
                        })}
                        required
                        className="gargeDropdown"
                    >
                        <option value={0}>Select Sensor</option>
                        {sensors.map(s => (
                            <option key={s.id} value={s.id}>{s.customName ?? s.defaultName}</option>
                        ))}
                    </select>
                    <label>Condition</label>
                    <select
                        value={cond.condition}
                        onChange={e => updateCondition(idx, { condition: e.target.value })}
                        required
                        className="gargeDropdown"
                    >
                        {conditionOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <label>Threshold</label>
                    <input
                        className="block w-full p-2 border rounded bg-gray-800 text-gray-200"
                        type="number"
                        value={cond.threshold}
                        onChange={e => updateCondition(idx, { threshold: Number(e.target.value) })}
                        required
                    />
                    {form.conditions.length > 1 && (
                        <button type="button" className="gargeBtnWarning mt-4" onClick={() => removeCondition(idx)}>Remove</button>
                    )}
                </div>
            ))}
            <button type="button" className="gargeBtnActive" onClick={addCondition}>Add Condition</button>
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
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                    <button type="submit" className={`gargeBtnActive${isEditing ? ' gargeBtnSmall' : ''}`}>{isEditing ? "Save" : "Create"}</button>
                    {isEditing && cancelEdit && (
                        <button type="button" className="gargeBtnWarning gargeBtnSmall" onClick={cancelEdit}>Cancel</button>
                    )}
                </div>
                {isEditing && onDelete && (
                    <button type="button" className="gargeBtnWarning gargeBtnSmall" onClick={onDelete}>Delete</button>
                )}
            </div>
        </form>
    );
}
