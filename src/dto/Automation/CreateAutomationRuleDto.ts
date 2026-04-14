export interface CreateAutomationRuleDto {
    targetType: string;
    targetId: number;
    sensorType: string;
    sensorId: number;
    condition: string;
    threshold: number;
    action: string;
    isEnabled: boolean;
    electricityPriceCondition?: string;
    electricityPriceThreshold?: number;
    electricityPriceArea?: string;
    electricityPriceOperator?: string;
}