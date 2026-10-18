import axiosInstance from '@/services/axiosInstance';

/**
 * A ticket from POST /hub-tickets. It opens one connection to the device hub
 * and expires after `expiresIn` seconds, which is about a minute.
 */
export interface DeviceHubTicket {
    ticket: string;
    expiresIn: number;
}

const DeviceHubService = {
    /**
     * Gets a fresh ticket for the device hub. A failed call rejects with the
     * axios error, so the caller can read the status.
     */
    async getTicket(): Promise<string> {
        const response = await axiosInstance.post<DeviceHubTicket>('/hub-tickets');
        return response.data.ticket;
    },
};

export default DeviceHubService;
