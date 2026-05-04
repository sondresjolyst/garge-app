import axiosInstance from '@/services/axiosInstance';

export type BillingInterval = 'Monthly' | 'Yearly';

export interface Product {
    id: number;
    name: string;
    description: string | null;
    priceInOre: number;
    interval: BillingInterval;
    isActive: boolean;
    createdAt: string;
}

export interface CreateProductPayload {
    name: string;
    description?: string;
    priceInOre: number;
    interval: 0 | 1;
}

export interface UpdateProductPayload extends CreateProductPayload {
    isActive: boolean;
}

const ProductService = {
    async getProducts(): Promise<Product[]> {
        const res = await axiosInstance.get<Product[]>('/products');
        return res.data;
    },

    async getProduct(id: number): Promise<Product> {
        const res = await axiosInstance.get<Product>(`/products/${id}`);
        return res.data;
    },

    async createProduct(payload: CreateProductPayload): Promise<Product> {
        const res = await axiosInstance.post<Product>('/products', payload);
        return res.data;
    },

    async updateProduct(id: number, payload: UpdateProductPayload): Promise<void> {
        await axiosInstance.put(`/products/${id}`, payload);
    },

    async deleteProduct(id: number): Promise<void> {
        await axiosInstance.delete(`/products/${id}`);
    },
};

export default ProductService;
