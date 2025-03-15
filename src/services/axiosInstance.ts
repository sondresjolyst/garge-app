import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garge-api.prod.tumogroup.com/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
});

axiosInstance.interceptors.request.use(
    async (config) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session: any = await getSession();
        if (session?.accessToken) {
            config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        return config;
    },
    (error) => {
        if (process.env.NODE_ENV === 'development') {
            console.error('Request error:', error);
        }
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (process.env.NODE_ENV === 'development') {
            console.error('Response error:', error);
        }

        if (error.response && error.response.status === 401) {
            console.error('Unauthorized access - possibly invalid token');
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
