import axios from 'axios';
import { getSession } from 'next-auth/react';

let API_URL = 'https://garge-api.prod.tumogroup.com/api';

if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    API_URL = (window as any).__RUNTIME_CONFIG__?.API_URL || API_URL;
} else {
    if (process.env.API_URL) {
        API_URL = process.env.API_URL;
    }
}

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
