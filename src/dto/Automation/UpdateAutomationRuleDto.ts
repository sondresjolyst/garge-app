export interface UpdateAutomationRuleDto {
    targetType: string;
    targetId: number;
    conditions: {
        sensorType: string;
        sensorId: number;
        condition: string;
        threshold: number;
    }[];
    action: string;
}