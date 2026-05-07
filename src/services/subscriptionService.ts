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
}

export interface InitiateSubscriptionResponse {
    subscriptionId: number;
    vippsConfirmationUrl: string;
    vippsAgreementId: string;
}

const SubscriptionService = {
    async getMySubscriptions(): Promise<Subscription[]> {
        const res = await axiosInstance.get<Subscription[]>('/subscriptions/my');
        return res.data;
    },

    async initiateSubscription(payload: InitiateSubscriptionPayload): Promise<InitiateSubscriptionResponse> {
        const res = await axiosInstance.post<InitiateSubscriptionResponse>('/subscriptions/initiate', payload);
        return res.data;
    },

    async cancelSubscription(id: number): Promise<void> {
        await axiosInstance.post(`/subscriptions/cancel/${id}`);
    },

    async getConfirmationUrl(id: number): Promise<string> {
        const res = await axiosInstance.get<{ vippsConfirmationUrl: string }>(`/subscriptions/${id}/confirmation-url`);
        return res.data.vippsConfirmationUrl;
    },
};

export default SubscriptionService;
