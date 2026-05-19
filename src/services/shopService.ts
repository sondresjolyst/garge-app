import axiosInstance from '@/services/axiosInstance';
import { formatApiError } from '@/lib/errorMessages';

export interface ShopItem {
    id: number;
    name: string;
    description: string | null;
    priceInOre: number;
    stockCount: number;
    isActive: boolean;
    hasImage?: boolean;
    createdAt: string;
}

export interface CreateShopItemPayload {
    name: string;
    description?: string;
    priceInOre: number;
    stockCount: number;
}

export interface UpdateShopItemPayload extends CreateShopItemPayload {
    isActive: boolean;
}

export interface OrderItem {
    id: number;
    shopItemId: number;
    shopItemName: string;
    quantity: number;
    priceAtPurchaseInOre: number;
}

export type OrderStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Reserved' | 'Cancelled';

export interface Order {
    id: number;
    userId: string;
    vippsOrderId: string | null;
    status: OrderStatus;
    totalInOre: number;
    shippingAddress: string | null;
    shippedAt: string | null;
    hasInvoice: boolean;
    isTest: boolean;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface AdminOrder extends Order {
    userEmail: string;
    userName: string;
}

export interface CheckoutPayload {
    items: { shopItemId: number; quantity: number }[];
    phoneNumber: string;
    shippingAddress?: string;
}

export interface CheckoutResponse {
    orderId: number;
    redirectUrl: string;
}

const ShopService = {
    async getShopItems(): Promise<ShopItem[]> {
        try {
            const res = await axiosInstance.get<ShopItem[]>('/shop/items');
            return res.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch shop items'));
        }
    },

    async getShopItem(id: number): Promise<ShopItem> {
        try {
            const res = await axiosInstance.get<ShopItem>(`/shop/items/${id}`);
            return res.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch shop item'));
        }
    },

    async createShopItem(payload: CreateShopItemPayload): Promise<ShopItem> {
        try {
            const res = await axiosInstance.post<ShopItem>('/shop/items', payload);
            return res.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to create shop item'));
        }
    },

    async updateShopItem(id: number, payload: UpdateShopItemPayload): Promise<void> {
        try {
            await axiosInstance.put(`/shop/items/${id}`, payload);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to update shop item'));
        }
    },

    async deleteShopItem(id: number): Promise<void> {
        try {
            await axiosInstance.delete(`/shop/items/${id}`);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to delete shop item'));
        }
    },

    async checkout(payload: CheckoutPayload): Promise<CheckoutResponse> {
        try {
            const res = await axiosInstance.post<CheckoutResponse>('/shop/checkout', payload);
            return res.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to initiate checkout'));
        }
    },

    async getMyOrders(): Promise<Order[]> {
        try {
            const res = await axiosInstance.get<Order[]>('/shop/orders/my');
            return res.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch orders'));
        }
    },

    async getAllOrders(): Promise<AdminOrder[]> {
        try {
            const res = await axiosInstance.get<AdminOrder[]>('/shop/orders');
            return res.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to fetch orders'));
        }
    },

    async captureOrder(id: number): Promise<void> {
        try {
            await axiosInstance.post(`/shop/orders/${id}/capture`);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to capture order'));
        }
    },

    async cancelOrder(id: number): Promise<void> {
        try {
            await axiosInstance.post(`/shop/orders/${id}/cancel`);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to cancel order'));
        }
    },

    async refundOrder(id: number): Promise<void> {
        try {
            await axiosInstance.post(`/shop/orders/${id}/refund`);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to refund order'));
        }
    },

    async downloadInvoice(orderId: number): Promise<void> {
        try {
            const res = await axiosInstance.get(`/shop/orders/${orderId}/invoice`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data as Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-order-${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to download invoice'));
        }
    },
};

export default ShopService;
