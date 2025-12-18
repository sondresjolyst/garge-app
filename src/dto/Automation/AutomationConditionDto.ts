export interface AutomationConditionDto {
    id?: number;
    sensorType: string;
    sensorId: number;
    condition: string;
    threshold: number;
}
