import axiosInstance from '@/services/axiosInstance';

export interface Photo {
    data: string;
    contentType: string;
}

export interface PhotoService {
    get(parentId: number): Promise<Photo | null>;
    upload(parentId: number, base64: string, contentType: string): Promise<void>;
    remove(parentId: number): Promise<void>;
}

export function createPhotoService(buildPath: (id: number) => string): PhotoService {
    return {
        async get(parentId) {
            try {
                const res = await axiosInstance.get<Photo>(buildPath(parentId));
                return res.data;
            } catch {
                return null;
            }
        },
        async upload(parentId, base64, contentType) {
            await axiosInstance.post(buildPath(parentId), { data: base64, contentType });
        },
        async remove(parentId) {
            await axiosInstance.delete(buildPath(parentId));
        },
    };
}
