export interface ConditionDto {
    sensorType: string;
    sensorId: number;
    condition: string;
    threshold: number;
}

export interface CreateAutomationRuleDto {
    targetType: string;
    targetId: number;
    conditions: ConditionDto[];
    action: string;
}