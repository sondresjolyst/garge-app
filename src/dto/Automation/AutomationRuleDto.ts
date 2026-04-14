export interface AutomationRuleDto {
    id: number;
    targetType: string;
    targetId: number;
    sensorType: string;
    sensorId: number;
    condition: string;
    threshold: number;
    action: string;
    isEnabled: boolean;
    lastTriggeredAt: string | null;
    electricityPriceCondition?: string;
    electricityPriceThreshold?: number;
    electricityPriceArea?: string;
    electricityPriceOperator?: string;
}