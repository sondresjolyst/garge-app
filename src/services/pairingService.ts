import axios from 'axios';
import axiosInstance from '@/services/axiosInstance';
import { formatApiError } from '@/lib/errorMessages';

/**
 * A single-use pairing token (POST /pairing/token). The user enters it in the
 * device's own WiFi-setup captive portal. The backend then claims the device
 * on their behalf and raises the `device-created` SignalR event. Valid until
 * `expiresAt` (about 15 minutes).
 */
export interface PairingToken {
    /** 6-character single-use code. */
    token: string;
    /** ISO timestamp after which the token is no longer accepted. */
    expiresAt: string;
}

/**
 * Progress of a pairing token (GET /pairing/token/{token}).
 * `paired` with both id lists empty means the device belongs to another account.
 */
export interface PairingStatus {
    status: 'waiting' | 'provisioned' | 'paired' | 'expired';
    /** Sensors from this pairing that the caller owns, ascending. */
    sensorIds: number[];
    /** Switches from this pairing that the caller owns, ascending. */
    switchIds: number[];
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

    /** Returns null on 404, which means an unknown token or an API without this endpoint. */
    async getStatus(token: string): Promise<PairingStatus | null> {
        try {
            const response = await axiosInstance.get<PairingStatus>(`/pairing/token/${encodeURIComponent(token)}`);
            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 404) return null;
            throw new Error(formatApiError(error, 'Failed to check pairing status'));
        }
    },
};

export default PairingService;
