import axiosInstance from '@/services/axiosInstance';

export interface Sensor {
    id: number;
    name: string;
    type: string;
    role: string;
}

export interface SensorData {
    timestamp: string;
    value: number;
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
            const response = await axiosInstance.get<{ $values: Sensor[] }>('/sensor');
            return response.data.$values;
        } catch (error: Error | any) {
            throw new Error(error.response?.data.message || 'Failed to fetch sensors');
        }
    },

    async getSensorData(sensorId: number, startDate?: string, endDate?: string, timeRange?: string): Promise<SensorData[]> {
        try {
            const params: any = {};
            if (timeRange) {
                const { startDate: parsedStartDate, endDate: parsedEndDate } = parseTimeRange(timeRange);
                params.startDate = parsedStartDate;
                params.endDate = parsedEndDate;
            } else {
                if (startDate) params.startDate = new Date(startDate).toISOString();
                if (endDate) params.endDate = new Date(endDate).toISOString();
            }

            const response = await axiosInstance.get<{ $values: SensorData[] }>(`/sensor/${sensorId}/data`, { params });
            return response.data.$values;
        } catch (error: Error | any) {
            throw new Error(error.response?.data.message || 'Failed to fetch sensor data');
        }
    },

    async getMultipleSensorsData(sensorIds: number[], startDate?: string, endDate?: string, timeRange?: string): Promise<Record<number, SensorData[]>> {
        try {
            const params: any = {};
            if (timeRange) {
                const { startDate: parsedStartDate, endDate: parsedEndDate } = parseTimeRange(timeRange);
                params.startDate = parsedStartDate;
                params.endDate = parsedEndDate;
            } else {
                if (startDate) params.startDate = new Date(startDate).toISOString();
                if (endDate) params.endDate = new Date(endDate).toISOString();
            }

            sensorIds.forEach((id, index) => {
                params[`sensorIds[${index}]`] = id;
            });

            const response = await axiosInstance.get<{ $values: SensorData[] }>('/sensor/data', { params });
            const dataMap: Record<number, SensorData[]> = {};

            response.data.$values.forEach((data) => {
                if (!dataMap[data.sensorId]) {
                    dataMap[data.sensorId] = [];
                }
                dataMap[data.sensorId].push(data);
            });

            return dataMap;
        } catch (error: Error | any) {
            throw new Error(error.response?.data.message || 'Failed to fetch multiple sensors data');
        }
    }
};

export default SensorService;
