import axiosInstance from '@/services/axiosInstance';
import { formatApiError } from '@/lib/errorMessages';

export type BillingInterval = 'Monthly' | 'Yearly';
export type ProductType = 'Primary' | 'AddOn';

export interface Product {
    id: number;
    name: string;
    description: string | null;
    priceInOre: number;
    interval: BillingInterval;
    type: ProductType;
    isActive: boolean;
    createdAt: string;
}

export interface CreateProductPayload {
    name: string;
    description?: string;
    priceInOre: number;
    interval: 0 | 1;
    type: 0 | 1;
}

export interface UpdateProductPayload extends CreateProductPayload {
    isActive: boolean;
}

/** A scheduled price increase and how far its notices to subscribers got. */
export interface PriceChange {
    id: number;
    productId: number;
    oldPriceInOre: number;
    newPriceInOre: number;
    /** The first charge due date, a UTC date, that pays the new price. */
    effectiveFrom: string;
    createdAt: string;
    cancelledAt: string | null;
    appliedAt: string | null;
    noticeCount: number;
    notifiedCount: number;
    appliedCount: number;
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

    async getPriceChanges(productId: number): Promise<PriceChange[]> {
        try {
            return (await axiosInstance.get<PriceChange[]>(`/products/${productId}/price-changes`)).data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to load price changes'));
        }
    },

    /** `effectiveFrom` is a date as `yyyy-MM-dd`, read as UTC by the API. */
    async schedulePriceChange(productId: number, newPriceInOre: number, effectiveFrom: string): Promise<PriceChange> {
        try {
            return (await axiosInstance.post<PriceChange>(`/products/${productId}/price-changes`, { newPriceInOre, effectiveFrom })).data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to schedule the price change'));
        }
    },

    async cancelPriceChange(productId: number, changeId: number): Promise<void> {
        try {
            await axiosInstance.delete(`/products/${productId}/price-changes/${changeId}`);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to cancel the price change'));
        }
    },
};

export default ProductService;
