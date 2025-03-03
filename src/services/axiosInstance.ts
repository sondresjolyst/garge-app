import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://garge-api.prod.tumogroup.com/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = Cookies.get('jwtToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
            const router = useRouter();

            const errorMessage = error.response.data.message;
            if (errorMessage === 'Token expired' || errorMessage === 'Invalid token') {
                Cookies.remove('jwtToken');
                router.push('/login');
            } else {
                console.error('Access denied:', errorMessage);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
