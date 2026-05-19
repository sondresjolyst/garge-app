import axiosInstance from '@/services/axiosInstance';
import { formatApiError } from '@/lib/errorMessages';

export interface Switch {
    id: number;
    name: string;
    type: string;
    role: string;
    customName?: string;
    registrationCode?: string;
}

export interface SwitchData {
    id: number;
    switchId: number;
    timestamp: string;
    value: string;
}

const SwitchService = {
    async getAllSwitches(): Promise<Switch[]> {
        try {
            const response = await axiosInstance.get<Switch[]>('/switches');
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch sockets'));
        }
    },

    async getSwitchData(switchId: number, timeRange: string = '24h'): Promise<SwitchData[]> {
        try {
            const params: Record<string, string> = { timeRange };

            const response = await axiosInstance.get<SwitchData[]>(`/switches/${switchId}/data`, { params });
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch socket data'));
        }
    },

    async getSwitchState(switchId: number): Promise<SwitchData[]> {
        try {
            const response = await axiosInstance.get<{ value: SwitchData[] }>(`/switches/${switchId}/state`);

            return response.data.value;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch socket state'));
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

            const response = await axiosInstance.get<SwitchData[]>('/switches/data', { params });
            const dataMap: Record<number, SwitchData[]> = {};

            response.data.forEach((data) => {
                if (!dataMap[data.switchId]) {
                    dataMap[data.switchId] = [];
                }
                dataMap[data.switchId].push(data);
            });

            return dataMap;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch multiple sockets data'));
        }
    },

    async updateCustomName(switchId: number, customName: string): Promise<Switch> {
        try {
            const response = await axiosInstance.patch<Switch>(`/switches/${switchId}/custom-name`, { customName });
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to update socket name'));
        }
    },

    async claimSwitch(registrationCode: string): Promise<{ switchId: number; registrationCode: string }> {
        try {
            const response = await axiosInstance.post<{ switchId: number; registrationCode: string }>('/switches/claim', { registrationCode });
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to claim socket'));
        }
    },

    async unclaimSwitch(switchId: number): Promise<void> {
        try {
            await axiosInstance.delete(`/switches/${switchId}/claim`);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to unclaim socket'));
        }
    }
};

export default SwitchService;
