import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
}

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

axiosInstance.interceptors.request.use(
    async (config) => {
        const session = await getSession();
        if (session?.error) {
            await signOut({ callbackUrl: '/login' });
            return Promise.reject(new Error('Session expired'));
        }
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
