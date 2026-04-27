import axiosInstance from '@/services/axiosInstance';
import { AxiosError } from 'axios';

export interface SensorActivity {
    id: number;
    sensorId: number;
    userId: string;
    title: string;
    notes?: string | null;
    activityDate: string;
    createdAt: string;
    updatedAt?: string | null;
}

export interface CreateSensorActivityPayload {
    title: string;
    notes?: string | null;
    /** ISO date string. If omitted, the API uses now. */
    activityDate?: string | null;
}

export type UpdateSensorActivityPayload = CreateSensorActivityPayload;

const handleError = (error: unknown, fallback: string): never => {
    if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.message || fallback);
    }
    throw new Error('An unknown error occurred');
};

const SensorActivityService = {
    async list(sensorId: number): Promise<SensorActivity[]> {
        try {
            const response = await axiosInstance.get<SensorActivity[] | { $values: SensorActivity[] }>(
                `/sensors/${sensorId}/activities`
            );
            // .NET serialization can wrap arrays in { $values: [...] }
            const data = response.data as SensorActivity[] | { $values: SensorActivity[] };
            if (Array.isArray(data)) return data;
            return data?.$values ?? [];
        } catch (error: unknown) {
            return handleError(error, 'Failed to fetch activities');
        }
    },

    async create(sensorId: number, payload: CreateSensorActivityPayload): Promise<SensorActivity> {
        try {
            const response = await axiosInstance.post<SensorActivity>(
                `/sensors/${sensorId}/activities`,
                payload
            );
            return response.data;
        } catch (error: unknown) {
            return handleError(error, 'Failed to create activity');
        }
    },

    async update(sensorId: number, activityId: number, payload: UpdateSensorActivityPayload): Promise<SensorActivity> {
        try {
            const response = await axiosInstance.put<SensorActivity>(
                `/sensors/${sensorId}/activities/${activityId}`,
                payload
            );
            return response.data;
        } catch (error: unknown) {
            return handleError(error, 'Failed to update activity');
        }
    },

    async remove(sensorId: number, activityId: number): Promise<void> {
        try {
            await axiosInstance.delete(`/sensors/${sensorId}/activities/${activityId}`);
        } catch (error: unknown) {
            handleError(error, 'Failed to delete activity');
        }
    },
};

export default SensorActivityService;
