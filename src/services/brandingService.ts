import { createBrandingService } from '@sjolystinnovation/app-kit/api';
import type { Branding } from '@sjolystinnovation/app-kit/branding';
import axiosInstance from './axiosInstance';
import publicClient from './publicClient';

export type { Branding };

/** The logo and favicon set in admin settings, from garge-api's `/branding`. */
const BrandingService = createBrandingService(axiosInstance, publicClient);

export default BrandingService;
