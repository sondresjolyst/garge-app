import { AutomationConditionDto } from './AutomationConditionDto';

export interface UpdateAutomationRuleDto {
    targetType: string;
    targetId: number;
    // Legacy fields for backward compatibility
    sensorType?: string;
    sensorId?: number;
    condition?: string;
    threshold?: number;
    // New fields for multiple conditions
    conditions?: Omit<AutomationConditionDto, 'id'>[];
    logicalOperator?: 'AND' | 'OR';
    action: string;
}