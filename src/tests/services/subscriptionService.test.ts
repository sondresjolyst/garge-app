import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubscriptionService from '@/services/subscriptionService';

vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock());

import { resetTestMocks } from '@sjolystinnovation/app-kit/testing';
import { axiosSpies, resetAxiosSpies } from '@/tests/axiosMock';

beforeEach(() => {
    resetTestMocks();
    resetAxiosSpies();
});

describe('SubscriptionService.initiateSubscription', () => {
    it('passes quantity when provided', async () => {
        axiosSpies.post.mockResolvedValueOnce({ data: { subscriptionId: 1, vippsConfirmationUrl: 'x', vippsAgreementId: 'a' } });
        await SubscriptionService.initiateSubscription({
            productId: 7, phoneNumber: '4791234567', consentToWaiveWithdrawal: true, quantity: 3,
        });
        expect(axiosSpies.post).toHaveBeenCalledWith('/subscriptions/initiate', {
            productId: 7, phoneNumber: '4791234567', consentToWaiveWithdrawal: true, quantity: 3,
        });
    });
});

describe('SubscriptionService.updateSubscriptionQuantity', () => {
    it('PATCHes /subscriptions/{id}/quantity with new qty', async () => {
        axiosSpies.patch.mockResolvedValueOnce({ data: { subscription: { id: 5, quantity: 4 }, message: 'ok' } });
        const res = await SubscriptionService.updateSubscriptionQuantity(5, 4);
        expect(axiosSpies.patch).toHaveBeenCalledWith('/subscriptions/5/quantity', { quantity: 4 });
        expect(res.message).toBe('ok');
    });
});
