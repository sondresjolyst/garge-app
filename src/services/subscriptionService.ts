import axiosInstance from '@/services/axiosInstance';

export type SubscriptionStatus = 'Pending' | 'Active' | 'Stopped' | 'Expired';

export interface Subscription {
    id: number;
    userId: string;
    productId: number;
    productName: string;
    priceInOre: number;
    interval: string;
    vippsAgreementId: string;
    status: SubscriptionStatus;
    startDate: string | null;
    nextChargeDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface InitiateSubscriptionPayload {
    productId: number;
    phoneNumber: string;
    redirectUrl: string;
}

export interface InitiateSubscriptionResponse {
    subscriptionId: number;
    vippsConfirmationUrl: string;
    vippsAgreementId: string;
}

const SubscriptionService = {
    async getMySubscription(): Promise<Subscription | null> {
        try {
            const res = await axiosInstance.get<Subscription>('/subscriptions/my');
            if (res.status === 204) return null;
            return res.data;
        } catch (e: unknown) {
            if ((e as { response?: { status?: number } })?.response?.status === 204) return null;
            throw e;
        }
    },

    async initiateSubscription(payload: InitiateSubscriptionPayload): Promise<InitiateSubscriptionResponse> {
        const res = await axiosInstance.post<InitiateSubscriptionResponse>('/subscriptions/initiate', payload);
        return res.data;
    },

    async cancelSubscription(): Promise<void> {
        await axiosInstance.post('/subscriptions/cancel');
    },
};

export default SubscriptionService;
