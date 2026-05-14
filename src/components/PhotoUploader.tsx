'use client';

import { useRef, useState } from 'react';
import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageUtils';
import type { Photo, PhotoService } from '@/services/photoServiceFactory';

export interface PhotoUploaderProps {
    photo: Photo | null;
    service: PhotoService;
    parentId: number;
    alt: string;
    onChange?: (photo: Photo | null) => void;
    aspectRatio?: 'video' | 'square' | 'auto';
    addLabel?: string;
}

export default function PhotoUploader({
    photo,
    service,
    parentId,
    alt,
    onChange,
    aspectRatio = 'auto',
    addLabel = 'Add photo',
}: PhotoUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setUploading(true);
        try {
            const { base64, contentType } = await compressImage(file);
            await service.upload(parentId, base64, contentType);
            onChange?.({ data: base64, contentType });
            toast.success('Photo saved');
        } catch {
            toast.error('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await service.remove(parentId);
            onChange?.(null);
            toast.success('Photo deleted');
        } catch {
            toast.error('Failed to delete photo');
        } finally {
            setDeleting(false);
        }
    };

    const previewAspectClass =
        aspectRatio === 'video' ? 'aspect-video'
        : aspectRatio === 'square' ? 'aspect-square'
        : '';
    const imgFitClass = aspectRatio === 'auto' ? 'w-full object-cover max-h-52' : 'w-full h-full object-cover';

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
            />
            {photo ? (
                <div className={`relative rounded-2xl overflow-hidden bg-gray-800/60 border border-gray-700/40 ${previewAspectClass}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`data:${photo.contentType};base64,${photo.data}`} alt={alt} className={imgFitClass} />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                        <button
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            title="Replace photo"
                            className="p-1.5 rounded-lg bg-gray-900/80 text-gray-300 hover:text-white transition-colors"
                        >
                            <CameraIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            title="Delete photo"
                            className="p-1.5 rounded-lg bg-gray-900/80 text-red-400 hover:text-red-300 transition-colors"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className={`w-full flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border border-dashed border-gray-700/60 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors ${previewAspectClass}`}
                >
                    <CameraIcon className="h-6 w-6" />
                    <span className="text-sm">{uploading ? 'Uploading…' : addLabel}</span>
                </button>
            )}
        </div>
    );
}
