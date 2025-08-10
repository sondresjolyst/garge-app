export interface CreateAutomationRuleDto {
    targetType: string;
    targetId: number;
    sensorType: string;
    sensorId: number;
    condition: string;
    threshold: number;
    action: string;
}