import axiosInstance from '@/services/axiosInstance';
import { AxiosError } from 'axios';

export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    stock: number;
    category?: string;
    manufacturer?: string;
    createdAt: string;
    updatedAt: string;
}

const productService = {
    async getAllProducts(): Promise<Product[]> {
        try {
            const response = await axiosInstance.get<{ $values: Product[] }>('/products');
            return response.data.$values;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to fetch products');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },

    async getProductById(id: number): Promise<Product> {
        try {
            const response = await axiosInstance.get<Product>(`/products/${id}`);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to fetch product');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },
};

export default productService;
