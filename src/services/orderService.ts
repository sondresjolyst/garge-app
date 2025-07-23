import axiosInstance from '@/services/axiosInstance';
import { AxiosError } from 'axios';

export interface OrderProduct {
    productId: number;
    quantity: number;
}

export interface OrderSubscription {
    subscriptionId: number;
}

export interface CreateOrderRequest {
    name: string;
    email: string;
    mobile: string;
    street: string;
    postalCode: string;
    city: string;
    products: OrderProduct[];
    subscriptions: OrderSubscription[];
}

const orderService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createOrder(order: CreateOrderRequest): Promise<any> {
        try {
            const response = await axiosInstance.post('/orders', order);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to create order');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },
};

export default orderService;
