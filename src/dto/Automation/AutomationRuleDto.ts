import { AutomationConditionDto } from './AutomationConditionDto';

export interface AutomationRuleDto {
    id: number;
    targetType: string;
    targetId: number;
    // Legacy fields for backward compatibility
    sensorType?: string;
    sensorId?: number;
    condition?: string;
    threshold?: number;
    // New fields for multiple conditions
    conditions?: AutomationConditionDto[];
    logicalOperator?: 'AND' | 'OR';
    action: string;
}