import axiosInstance from '@/services/axiosInstance';
import { formatApiError } from '@/lib/errorMessages';

export interface SensorActivity {
    id: number;
    sensorId: number;
    userId: string;
    title: string;
    notes?: string | null;
    odometerKm?: number | null;
    activityDate: string;
    createdAt: string;
    updatedAt?: string | null;
}

export interface CreateSensorActivityPayload {
    title: string;
    notes?: string | null;
    /** Odometer reading in km. */
    odometerKm?: number | null;
    /** ISO date string. When omitted, the API defaults to the current time. */
    activityDate?: string | null;
}

export type UpdateSensorActivityPayload = CreateSensorActivityPayload;

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
            throw new Error(formatApiError(error, 'Failed to fetch activities'));
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
            throw new Error(formatApiError(error, 'Failed to create activity'));
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
            throw new Error(formatApiError(error, 'Failed to update activity'));
        }
    },

    async remove(sensorId: number, activityId: number): Promise<void> {
        try {
            await axiosInstance.delete(`/sensors/${sensorId}/activities/${activityId}`);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to delete activity'));
        }
    },
};

export default SensorActivityService;
