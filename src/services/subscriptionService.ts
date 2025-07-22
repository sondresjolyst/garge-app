import axiosInstance from '@/services/axiosInstance';
import { AxiosError } from 'axios';

export interface Subscription {
    id: number;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    durationMonths: number;
    isRecurring: boolean;
    createdAt: string;
    updatedAt: string;
}

const subscriptionService = {
    async getAllSubscriptions(): Promise<Subscription[]> {
        try {
            const response = await axiosInstance.get<{ $values: Subscription[] }>('/subscriptions');
            return response.data.$values;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to fetch subscriptions');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },
    async getSubscriptionById(id: number): Promise<Subscription> {
        try {
            const response = await axiosInstance.get<Subscription>(`/subscriptions/${id}`);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to fetch subscription');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },
};

export default subscriptionService;
