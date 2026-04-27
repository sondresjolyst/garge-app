import axiosInstance from '@/services/axiosInstance';

export interface SensorPhoto {
    data: string;
    contentType: string;
}

const SensorPhotoService = {
    async get(sensorId: number): Promise<SensorPhoto | null> {
        try {
            const res = await axiosInstance.get<SensorPhoto>(`/sensors/${sensorId}/photo`);
            return res.data;
        } catch {
            return null;
        }
    },

    async upload(sensorId: number, base64: string, contentType: string): Promise<void> {
        await axiosInstance.post(`/sensors/${sensorId}/photo`, { data: base64, contentType });
    },

    async remove(sensorId: number): Promise<void> {
        await axiosInstance.delete(`/sensors/${sensorId}/photo`);
    },
};

export default SensorPhotoService;
