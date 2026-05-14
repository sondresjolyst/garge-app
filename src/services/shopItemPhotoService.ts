import { createPhotoService, type Photo } from '@/services/photoServiceFactory';

export type ShopItemPhoto = Photo;

const ShopItemPhotoService = createPhotoService(id => `/shop/items/${id}/photo`);

export default ShopItemPhotoService;
