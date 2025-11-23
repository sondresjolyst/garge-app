export interface AutomationRuleDto {
    id: number;
    targetType: string;
    targetId: number;
    conditions: {
        sensorType: string;
        sensorId: number;
        condition: string;
        threshold: number;
    }[];
    action: string;
    sensorType: string;
    sensorId: number;
    threshold: number;
}
