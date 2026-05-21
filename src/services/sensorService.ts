import axiosInstance from '@/services/axiosInstance';
import { AxiosError } from 'axios';
import { formatApiError } from '@/lib/errorMessages';

export interface Sensor {
    id: number;
    name: string;
    type: string;
    role: string;
    customName: string;
    defaultName: string;
    registrationCode: string;
    parentName: string;
    /** True when the owner has turned this sensor off / it was auto-suspended for being over quota. Its data reads are blocked. */
    suspended?: boolean;
}

export interface SensorData {
    id: number;
    sensorId: number;
    timestamp: string;
    value: number;
}

export interface BatteryHealthData {
    id: number;
    sensorId: number;
    status: string;
    currentVoltage: number;
    restingMedian: number;
    peakResting: number;
    onChargerNow: boolean;
    lastFullChargeAt: string | null;
    lastFullChargePeak: number | null;
    voltageMin24h: number | null;
    fullChargesLast30d: number;
    dailyDropPctPerWeek: number | null;
    chargeAcceptanceRatio: number | null;
    calibrationOffsetV: number | null;
    timestamp: string;
}

export interface BatteryChargeEvent {
    id: number;
    sensorId: number;
    startedAt: string;
    endedAt: string;
    peakVoltage: number;
    restingAtTime: number;
    peakRatio: number;
    durationMinutes: number;
}

export interface PagedResponse<T> {
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    data: T[];
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

const SensorService = {
    async getAllSensors(): Promise<Sensor[]> {
        try {
            const response = await axiosInstance.get<Sensor[]>('/sensors');
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch sensors'));
        }
    },

    async getSensorData(sensorId: number, startDate?: string, endDate?: string, timeRange?: string, pageNumber: number = 1, pageSize: number = 100): Promise<PagedResponse<SensorData>> {
        try {
            const params: Record<string, string | number> = { pageNumber, pageSize };
            if (timeRange) {
                const { startDate: parsedStartDate, endDate: parsedEndDate } = parseTimeRange(timeRange);
                params.startDate = parsedStartDate;
                params.endDate = parsedEndDate;
            } else {
                if (startDate) params.startDate = new Date(startDate).toISOString();
                if (endDate) params.endDate = new Date(endDate).toISOString();
            }

            const response = await axiosInstance.get<PagedResponse<SensorData>>(`/sensors/${sensorId}/data`, { params });
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch sensor data'));
        }
    },

    async getMultipleSensorsData( sensorIds: number[], startDate?: string, endDate?: string, timeRange?: string, groupBy?: string, pageNumber: number = 1, pageSize: number = 100): Promise<PagedResponse<SensorData>> {
        try {
            const urlParams = new URLSearchParams();
            urlParams.set('pageNumber', String(pageNumber));
            urlParams.set('pageSize', String(pageSize));

            if (timeRange) {
                const { startDate: parsedStartDate, endDate: parsedEndDate } = parseTimeRange(timeRange);
                urlParams.set('startDate', parsedStartDate);
                urlParams.set('endDate', parsedEndDate);
            } else {
                if (startDate) urlParams.set('startDate', new Date(startDate).toISOString());
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(24, 0, 0, 0);
                    urlParams.set('endDate', end.toISOString());
                }
            }

            sensorIds.forEach(id => urlParams.append('sensorIds', String(id)));

            if (groupBy) urlParams.set('groupBy', groupBy);

            const response = await axiosInstance.get<PagedResponse<SensorData>>(`/sensors/data?${urlParams.toString()}`);
            return response.data;
        } catch (error: unknown) {
            // 404 means no data exists for the given parameters — return empty page
            if (error instanceof AxiosError && error.response?.status === 404) {
                return { totalCount: 0, pageNumber, pageSize, data: [] };
            }
            throw new Error(formatApiError(error, 'Failed to fetch multiple sensors data'));
        }
    },

    async claimSensor(registrationCode: string ): Promise<{message: string}> {
        try {
            const response = await axiosInstance.post<{ message: string }>('/sensors/claim', { registrationCode });
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to claim sensor'));
        }
    },

    async updateCustomName(id: number, customName: string): Promise<Sensor> {
        try {
            const response = await axiosInstance.patch<Sensor>(`/sensors/${id}/custom-name`, { customName });
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to update custom name'));
        }
    },

    async unclaimSensor(id: number): Promise<{ message: string }> {
        try {
            const response = await axiosInstance.delete<{ message: string }>(`/sensors/${id}/claim`);
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to remove sensor'));
        }
    },

    async suspendSensor(id: number): Promise<{ message: string; suspended: boolean }> {
        try {
            const response = await axiosInstance.post<{ message: string; suspended: boolean }>(`/sensors/${id}/suspend`);
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to turn off sensor'));
        }
    },

    async activateSensor(id: number): Promise<{ message: string; suspended: boolean }> {
        try {
            const response = await axiosInstance.post<{ message: string; suspended: boolean }>(`/sensors/${id}/activate`);
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to turn on sensor'));
        }
    },

    async getBatteryHealthLatest(sensorName: string): Promise<BatteryHealthData> {
        try {
            const response = await axiosInstance.get<BatteryHealthData>(`/battery-health/name/${encodeURIComponent(sensorName)}/latest`);
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch battery health'));
        }
    },

    async getBatteryChargeEvents(sensorName: string, since?: string): Promise<BatteryChargeEvent[]> {
        const params = since ? { since } : undefined;
        const response = await axiosInstance.get<BatteryChargeEvent[]>(
            `/battery-health/name/${encodeURIComponent(sensorName)}/events`,
            { params }
        );
        return response.data;
    },

    async calibrateBattery(sensorName: string, multimeterVoltage: number): Promise<{ calibrationOffsetV: number }> {
        const response = await axiosInstance.post<{ calibrationOffsetV: number }>(
            `/battery-health/name/${encodeURIComponent(sensorName)}/calibration`,
            { multimeterVoltage }
        );
        return response.data;
    },

    async clearCalibration(sensorName: string): Promise<void> {
        await axiosInstance.delete(`/battery-health/name/${encodeURIComponent(sensorName)}/calibration`);
    },

    async reanalyzeBatteryHealth(): Promise<{ processed: number; failed: number; total: number }> {
        const response = await axiosInstance.post<{ processed: number; failed: number; total: number }>(
            '/battery-health/admin/reanalyze'
        );
        return response.data;
    },
};

export default SensorService;
