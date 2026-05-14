import { createPhotoService, type Photo } from '@/services/photoServiceFactory';

export type SensorPhoto = Photo;

const SensorPhotoService = createPhotoService(id => `/sensors/${id}/photo`);

export default SensorPhotoService;
