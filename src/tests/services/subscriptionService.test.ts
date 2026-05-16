import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubscriptionService from '@/services/subscriptionService';

vi.mock('@/services/axiosInstance', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

import axiosInstance from '@/services/axiosInstance';

const mockPatch = axiosInstance.patch as ReturnType<typeof vi.fn>;
const mockPost = axiosInstance.post as ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('SubscriptionService.initiateSubscription', () => {
    it('passes quantity when provided', async () => {
        mockPost.mockResolvedValueOnce({ data: { subscriptionId: 1, vippsConfirmationUrl: 'x', vippsAgreementId: 'a' } });
        await SubscriptionService.initiateSubscription({
            productId: 7, phoneNumber: '4791234567', consentToWaiveWithdrawal: true, quantity: 3,
        });
        expect(mockPost).toHaveBeenCalledWith('/subscriptions/initiate', {
            productId: 7, phoneNumber: '4791234567', consentToWaiveWithdrawal: true, quantity: 3,
        });
    });
});

describe('SubscriptionService.updateSubscriptionQuantity', () => {
    it('PATCHes /subscriptions/{id}/quantity with new qty', async () => {
        mockPatch.mockResolvedValueOnce({ data: { subscription: { id: 5, quantity: 4 }, message: 'ok' } });
        const res = await SubscriptionService.updateSubscriptionQuantity(5, 4);
        expect(mockPatch).toHaveBeenCalledWith('/subscriptions/5/quantity', { quantity: 4 });
        expect(res.message).toBe('ok');
    });
});
