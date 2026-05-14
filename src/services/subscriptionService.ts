import axiosInstance from '@/services/axiosInstance';

export type SubscriptionStatus = 'Pending' | 'Active' | 'Stopped' | 'Expired';
export type SubscriptionProductType = 'Primary' | 'AddOn';

export interface Subscription {
    id: number;
    userId: string;
    productId: number;
    productName: string;
    productType: SubscriptionProductType;
    priceInOre: number;
    quantity: number;
    interval: string;
    vippsAgreementId: string;
    status: SubscriptionStatus;
    isTest: boolean;
    startDate: string | null;
    nextChargeDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface InitiateSubscriptionPayload {
    productId: number;
    phoneNumber: string;
    consentToWaiveWithdrawal: boolean;
    quantity?: number;
}

export interface InitiateSubscriptionResponse {
    subscriptionId: number;
    vippsConfirmationUrl: string;
    vippsAgreementId: string;
}

export interface AdminSubscription {
    id: number;
    userId: string;
    userEmail: string;
    userName: string;
    productName: string;
    productType: SubscriptionProductType;
    priceInOre: number;
    quantity: number;
    interval: string;
    status: SubscriptionStatus;
    isTest: boolean;
    startDate: string | null;
    nextChargeDate: string | null;
    invoiceCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionInvoice {
    id: number;
    issuedAt: string;
    amountInOre: number;
    vippsChargeId: string | null;
}

const SubscriptionService = {
    async getMySubscriptions(): Promise<Subscription[]> {
        const res = await axiosInstance.get<Subscription[]>('/subscriptions/my');
        return res.data;
    },

    async getAllSubscriptions(): Promise<AdminSubscription[]> {
        const res = await axiosInstance.get<AdminSubscription[]>('/subscriptions/all');
        return res.data;
    },

    async getSubscriptionInvoices(subscriptionId: number): Promise<SubscriptionInvoice[]> {
        const res = await axiosInstance.get<SubscriptionInvoice[]>(`/subscriptions/${subscriptionId}/invoices`);
        return res.data;
    },

    async downloadSubscriptionInvoice(invoiceId: number): Promise<void> {
        const res = await axiosInstance.get(`/subscriptions/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId.toString().padStart(4, '0')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },

    async initiateSubscription(payload: InitiateSubscriptionPayload): Promise<InitiateSubscriptionResponse> {
        const res = await axiosInstance.post<InitiateSubscriptionResponse>('/subscriptions/initiate', payload);
        return res.data;
    },

    async cancelSubscription(id: number): Promise<void> {
        await axiosInstance.post(`/subscriptions/cancel/${id}`);
    },

    async updateSubscriptionQuantity(id: number, quantity: number): Promise<{ subscription: Subscription; message: string }> {
        const res = await axiosInstance.patch<{ subscription: Subscription; message: string }>(
            `/subscriptions/${id}/quantity`,
            { quantity }
        );
        return res.data;
    },

    async getConfirmationUrl(id: number): Promise<string> {
        const res = await axiosInstance.get<{ vippsConfirmationUrl: string }>(`/subscriptions/${id}/confirmation-url`);
        return res.data.vippsConfirmationUrl;
    },
};

export default SubscriptionService;
