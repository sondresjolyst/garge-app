import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

axiosInstance.interceptors.request.use(
    async (config) => {
        const session = await getSession();
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
    async (error) => {
        if (process.env.NODE_ENV === 'development') {
            console.error('Response error:', error);
        }

        if (error.response?.status === 401) {
            const session = await getSession();
            if (session?.error) {
                await signOut({ callbackUrl: '/login' });
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
