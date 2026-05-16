import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPhotoService } from '@/services/photoServiceFactory';

vi.mock('@/services/axiosInstance', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

import axiosInstance from '@/services/axiosInstance';

const mockGet = axiosInstance.get as ReturnType<typeof vi.fn>;
const mockPost = axiosInstance.post as ReturnType<typeof vi.fn>;
const mockDelete = axiosInstance.delete as ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('createPhotoService', () => {
    const service = createPhotoService(id => `/things/${id}/photo`);

    describe('get', () => {
        it('returns photo on success', async () => {
            const photo = { data: 'YmFzZTY0', contentType: 'image/jpeg' };
            mockGet.mockResolvedValueOnce({ data: photo });
            const result = await service.get(42);
            expect(result).toEqual(photo);
            expect(mockGet).toHaveBeenCalledWith('/things/42/photo');
        });

        it('returns null on error (e.g. 404)', async () => {
            mockGet.mockRejectedValueOnce(new Error('404'));
            const result = await service.get(7);
            expect(result).toBeNull();
        });
    });

    describe('upload', () => {
        it('posts base64 + contentType to path', async () => {
            mockPost.mockResolvedValueOnce({ data: {} });
            await service.upload(3, 'YmFzZTY0', 'image/png');
            expect(mockPost).toHaveBeenCalledWith('/things/3/photo', {
                data: 'YmFzZTY0',
                contentType: 'image/png',
            });
        });
    });

    describe('remove', () => {
        it('calls DELETE on path', async () => {
            mockDelete.mockResolvedValueOnce({ data: {} });
            await service.remove(9);
            expect(mockDelete).toHaveBeenCalledWith('/things/9/photo');
        });
    });
});

describe('createPhotoService — path builder per service', () => {
    it('builds different paths for different services', async () => {
        const sensorService = createPhotoService(id => `/sensors/${id}/photo`);
        const shopService = createPhotoService(id => `/shop/items/${id}/photo`);

        mockGet.mockResolvedValue({ data: { data: 'x', contentType: 'image/jpeg' } });
        await sensorService.get(1);
        await shopService.get(2);

        expect(mockGet).toHaveBeenCalledWith('/sensors/1/photo');
        expect(mockGet).toHaveBeenCalledWith('/shop/items/2/photo');
    });
});
