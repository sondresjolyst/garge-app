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

const SensorService = {
    async getAllSensors(): Promise<Sensor[]> {
        try {
            const response = await axiosInstance.get<{ $values: Sensor[] }>('/sensor');
            return response.data.$values;
        } catch (error: Error | any) {
            throw new Error(error.response?.data.message || 'Failed to fetch sensors');
        }
    },

    async getSensorData(sensorId: number): Promise<SensorData[]> {
        try {
            const response = await axiosInstance.get<{ $values: SensorData[] }>(`/sensor/${sensorId}/data`);
            return response.data.$values;
        } catch (error: Error | any) {
            throw new Error(error.response?.data.message || 'Failed to fetch sensor data');
        }
    }
};

export default SensorService;