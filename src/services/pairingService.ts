import axiosInstance from '@/services/axiosInstance';
import { formatApiError } from '@/lib/errorMessages';

/**
 * A single-use pairing token (POST /pairing/token). The user enters it in the
 * device's own WiFi-setup captive portal; the backend then claims the device
 * on their behalf and raises the `device-created` SignalR event. Valid until
 * `expiresAt` (about 15 minutes).
 */
export interface PairingToken {
    /** 6-character single-use code. */
    token: string;
    /** ISO timestamp after which the token is no longer accepted. */
    expiresAt: string;
}

const PairingService = {
    async mintToken(): Promise<PairingToken> {
        try {
            const response = await axiosInstance.post<PairingToken>('/pairing/token');
            return response.data;
        } catch (error: unknown) {
            throw new Error(formatApiError(error, 'Failed to get pairing code'));
        }
    },
};

export default PairingService;
