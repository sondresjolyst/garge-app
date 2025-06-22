import axiosInstance from '@/services/axiosInstance';
import { AxiosError } from 'axios';

export interface Switch {
    id: number;
    name: string;
    type: string;
    role: string;
}

export interface SwitchData {
    id: number;
    switchId: number;
    timestamp: string;
    value: string;
}

const parseTimeRange = (timeRange: string): { startDate: string, endDate: string } => {
    const now = new Date();
    const endDate = now.toISOString();
    const value = parseInt(timeRange.slice(0, -1), 10);
    const unit = timeRange.slice(-1);

    switch (unit) {
        case 'm':
            now.setMinutes(now.getMinutes() - value);
            break;
        case 'h':
            now.setHours(now.getHours() - value);
            break;
        case 'd':
            now.setDate(now.getDate() - value);
            break;
        case 'w':
            now.setDate(now.getDate() - value * 7);
            break;
        case 'y':
            now.setFullYear(now.getFullYear() - value);
            break;
        default:
            throw new Error('Invalid time range unit');
    }

    const startDate = now.toISOString();
    return { startDate, endDate };
};

const SwitchService = {
    async getAllSwitches(): Promise<Switch[]> {
        try {
            const response = await axiosInstance.get<{ $values: Switch[] }>('/switches');
            return response.data.$values;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to fetch switches');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },

    async getSwitchData(switchId: number, timeRange: string = '24h'): Promise<SwitchData[]> {
        try {
            const params: Record<string, string> = { timeRange };

            const response = await axiosInstance.get<{ $values: SwitchData[] }>(`/switches/${switchId}/data`, { params });
            return response.data.$values;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to fetch switch data');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },

    async getSwitchState(switchId: number): Promise<SwitchData[]> {
        try {
            const response = await axiosInstance.get<{ value: SwitchData[] }>(`/switches/${switchId}/state`);

            return response.data.value;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to fetch switch state');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },

    async getMultipleSwitchesData(switchIds: number[], timeRange: string = '24h', average?: boolean, groupBy?: string): Promise<Record<number, SwitchData[]>> {
        try {
            const params: Record<string, string> = { timeRange };

            switchIds.forEach((id, index) => {
                params[`switchIds[${index}]`] = id.toString();
            });

            if (average !== undefined) {
                params.average = average.toString();
            }

            if (groupBy) {
                params.groupBy = groupBy;
            }

            const response = await axiosInstance.get<{ $values: SwitchData[] }>('/switches/data', { params });
            const dataMap: Record<number, SwitchData[]> = {};

            response.data.$values.forEach((data) => {
                if (!dataMap[data.switchId]) {
                    dataMap[data.switchId] = [];
                }
                dataMap[data.switchId].push(data);
            });

            return dataMap;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                console.error('API Error:', error.response?.data.message || 'Failed to fetch multiple switches data');
                throw new Error(error.response?.data.message || 'Failed to fetch multiple switches data');
            } else {
                console.error('Unknown Error:', error);
                throw new Error('An unknown error occurred');
            }
        }
    }
};

export default SwitchService;
