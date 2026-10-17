import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPhotoService } from '@/services/photoServiceFactory';

vi.mock('@/services/axiosInstance', async () => (await import('@/tests/axiosMock')).axiosInstanceMock());

import { resetTestMocks } from '@sjolystinnovation/app-kit/testing';
import { axiosSpies, resetAxiosSpies } from '@/tests/axiosMock';

beforeEach(() => {
    resetTestMocks();
    resetAxiosSpies();
});

describe('createPhotoService', () => {
    const service = createPhotoService(id => `/things/${id}/photo`);

    describe('get', () => {
        it('returns photo on success', async () => {
            const photo = { data: 'YmFzZTY0', contentType: 'image/jpeg' };
            axiosSpies.get.mockResolvedValueOnce({ data: photo });
            const result = await service.get(42);
            expect(result).toEqual(photo);
            expect(axiosSpies.get).toHaveBeenCalledWith('/things/42/photo');
        });

        it('returns null on error (e.g. 404)', async () => {
            axiosSpies.get.mockRejectedValueOnce(new Error('404'));
            const result = await service.get(7);
            expect(result).toBeNull();
        });
    });

    describe('upload', () => {
        it('posts base64 + contentType to path', async () => {
            axiosSpies.post.mockResolvedValueOnce({ data: {} });
            await service.upload(3, 'YmFzZTY0', 'image/png');
            expect(axiosSpies.post).toHaveBeenCalledWith('/things/3/photo', {
                data: 'YmFzZTY0',
                contentType: 'image/png',
            });
        });
    });

    describe('remove', () => {
        it('calls DELETE on path', async () => {
            axiosSpies.delete.mockResolvedValueOnce({ data: {} });
            await service.remove(9);
            expect(axiosSpies.delete).toHaveBeenCalledWith('/things/9/photo');
        });
    });
});

describe('createPhotoService — path builder per service', () => {
    it('builds different paths for different services', async () => {
        const sensorService = createPhotoService(id => `/sensors/${id}/photo`);
        const shopService = createPhotoService(id => `/shop/items/${id}/photo`);

        axiosSpies.get.mockResolvedValue({ data: { data: 'x', contentType: 'image/jpeg' } });
        await sensorService.get(1);
        await shopService.get(2);

        expect(axiosSpies.get).toHaveBeenCalledWith('/sensors/1/photo');
        expect(axiosSpies.get).toHaveBeenCalledWith('/shop/items/2/photo');
    });
});
