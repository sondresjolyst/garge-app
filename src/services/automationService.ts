import axiosInstance from './axiosInstance';
import { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto';
import { CreateAutomationRuleDto } from '@/dto/Automation/CreateAutomationRuleDto';
import { UpdateAutomationRuleDto } from '@/dto/Automation/UpdateAutomationRuleDto';
import { AxiosError } from 'axios';

const AutomationService = {
    async getRules(): Promise<AutomationRuleDto[]> {
        try {
            const response = await axiosInstance.get<{ $values: AutomationRuleDto[] }>('/automation');
            return response.data.$values;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data?.message || 'Failed to fetch automation rules');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },

    async createRule(dto: CreateAutomationRuleDto): Promise<AutomationRuleDto> {
        try {
            const response = await axiosInstance.post<AutomationRuleDto>('/automation', dto);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data?.message || 'Failed to create rule');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },

    async updateRule(id: number, dto: UpdateAutomationRuleDto): Promise<AutomationRuleDto> {
        try {
            const response = await axiosInstance.put<AutomationRuleDto>(`/automation/${id}`, dto);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data?.message || 'Failed to update rule');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },

    async deleteRule(id: number): Promise<void> {
        try {
            await axiosInstance.delete(`/automation/${id}`);
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data?.message || 'Failed to delete rule');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },
};

export default AutomationService;
