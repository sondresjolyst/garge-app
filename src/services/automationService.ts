import axiosInstance from '@/services/axiosInstance';
import { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto';
import { CreateAutomationRuleDto } from '@/dto/Automation/CreateAutomationRuleDto';
import { UpdateAutomationRuleDto } from '@/dto/Automation/UpdateAutomationRuleDto';
import { formatApiError } from '@/lib/errorMessages';

const AutomationService = {
    async getRules(): Promise<AutomationRuleDto[]> {
        try {
            const response = await axiosInstance.get<AutomationRuleDto[]>('/automation');
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch automation rules'));
        }
    },

    async createRule(dto: CreateAutomationRuleDto): Promise<AutomationRuleDto> {
        try {
            const response = await axiosInstance.post<AutomationRuleDto>('/automation', dto);
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to create rule'));
        }
    },

    async updateRule(id: number, dto: UpdateAutomationRuleDto): Promise<AutomationRuleDto> {
        try {
            const response = await axiosInstance.put<AutomationRuleDto>(`/automation/${id}`, dto);
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to update rule'));
        }
    },

    async deleteRule(id: number): Promise<void> {
        try {
            await axiosInstance.delete(`/automation/${id}`);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to delete rule'));
        }
    },
};

export default AutomationService;
