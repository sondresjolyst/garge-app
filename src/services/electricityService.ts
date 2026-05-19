import axiosInstance from '@/services/axiosInstance';
import { formatApiError } from '@/lib/errorMessages';

export interface ElectricityData {
    price: number;
    spotPrice: number;
    start: string;
    end: string;
    area: string;
    currency: string;
}

interface ElectricityApiItem {
    value: number;
    spotValue: number;
    start: string;
    end: string;
}

const ElectricityService = {
    async getElectricityData(type: string, area: string, date: string, currency = 'NOK'): Promise<ElectricityData[]> {
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
            const data: ElectricityApiItem[] = response.data.areas[area].values;
            return data.map((item) => ({
                price: item.value,
                spotPrice: item.spotValue,
                start: item.start,
                end: item.end,
                area,
                currency,
            }));
        } catch (error) {
            throw new Error(formatApiError(error, 'Failed to fetch electricity data'));
        }
    }
};

export default ElectricityService;
