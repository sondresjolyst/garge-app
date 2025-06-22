import axiosInstance from '@/services/axiosInstance';
import axios from 'axios';

export interface ElectricityData {
    price: number;
    time: string;
    area: string;
    currency: string;
}

const ElectricityService = {
    async getElectricityData(type: string, area: string, date: string, currency = 'NOK') {
        try {
            const params: {
                type: string;
                area: string;
                currency: string;
                date?: string;
            } = {
                type,
                area,
                currency
            };
            if (date) {
                params.date = new Date(date).toISOString();
            }
            const response = await axiosInstance.get('/electricity/prices', { params });
            const data = response.data.areas[area].values.$values;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return data.map((item: any) => {
                let price = item.value;
                if (['NO1', 'NO2', 'NO3', 'NO4'].includes(area)) {
                    price *= 1.25;
                }
                return {
                    price: price,
                    time: item.start,
                    area: area,
                    currency: currency
                };
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data.message || 'Failed to fetch electricity data');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    }
};

export default ElectricityService;
