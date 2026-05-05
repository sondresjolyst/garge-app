import axiosInstance from '@/services/axiosInstance';

export interface ShopItem {
    id: number;
    name: string;
    description: string | null;
    priceInOre: number;
    stockCount: number;
    isActive: boolean;
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
    redirectUrl: string;
}

export interface CheckoutResponse {
    orderId: number;
    redirectUrl: string;
}

const ShopService = {
    async getShopItems(): Promise<ShopItem[]> {
        const res = await axiosInstance.get<ShopItem[]>('/shop/items');
        return res.data;
    },

    async getShopItem(id: number): Promise<ShopItem> {
        const res = await axiosInstance.get<ShopItem>(`/shop/items/${id}`);
        return res.data;
    },

    async createShopItem(payload: CreateShopItemPayload): Promise<ShopItem> {
        const res = await axiosInstance.post<ShopItem>('/shop/items', payload);
        return res.data;
    },

    async updateShopItem(id: number, payload: UpdateShopItemPayload): Promise<void> {
        await axiosInstance.put(`/shop/items/${id}`, payload);
    },

    async deleteShopItem(id: number): Promise<void> {
        await axiosInstance.delete(`/shop/items/${id}`);
    },

    async checkout(payload: CheckoutPayload): Promise<CheckoutResponse> {
        const res = await axiosInstance.post<CheckoutResponse>('/shop/checkout', payload);
        return res.data;
    },

    async getMyOrders(): Promise<Order[]> {
        const res = await axiosInstance.get<Order[]>('/shop/orders/my');
        return res.data;
    },

    async getAllOrders(): Promise<AdminOrder[]> {
        const res = await axiosInstance.get<AdminOrder[]>('/shop/orders');
        return res.data;
    },

    async captureOrder(id: number): Promise<void> {
        await axiosInstance.post(`/shop/orders/${id}/capture`);
    },

    async cancelOrder(id: number): Promise<void> {
        await axiosInstance.post(`/shop/orders/${id}/cancel`);
    },
};

export default ShopService;
