import axiosInstance from '@/services/axiosInstance';
import { UserDTO } from '@/dto/UserDTO';
import { AxiosError } from 'axios';
import { getSession } from 'next-auth/react';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

interface RegisterData extends LoginData {
    firstName: string;
    lastName: string;
    userName: string;
}

interface LoginData {
    email: string;
    password: string;
}

const registerSchema = z.object({
    firstName: z
        .string()
        .min(2, { message: 'First Name must be at least 2 characters long.' })
        .trim(),
    lastName: z
        .string()
        .min(2, { message: 'Last Name must be at least 2 characters long.' })
        .trim(),
    userName: z
        .string()
        .min(2, { message: 'Username must be at least 2 characters long.' })
        .trim(),
    email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
    password: z
        .string()
        .min(8, { message: 'Be at least 8 characters long' })
        .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
        .regex(/[0-9]/, { message: 'Contain at least one number.' })
        .regex(/[^a-zA-Z0-9]/, {
            message: 'Contain at least one special character.',
        })
        .trim(),
});

const UserService = {
    async getUserProfile(): Promise<UserDTO> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session: any = await getSession();
        if (!session?.accessToken) {
            throw new Error('No access token found');
        }

        const decodedToken = jwt.decode(session.accessToken) as { sub: string, unique_name: string };
        if (!decodedToken || !decodedToken.sub || !decodedToken.unique_name) {
            throw new Error('Failed to decode access token');
        }

        const sub = decodedToken.sub;
        try {
            const response = await axiosInstance.get<UserDTO>(`/users/${sub}/profile`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                console.log(error);
                throw new Error(error.response?.data.message || 'Failed to fetch user profile');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },
    async login(data: LoginData): Promise<{ token: string }> {
        try {
            const response = await axiosInstance.post<{ token: string }>('/auth/login', data);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data.message || 'Failed to login';
                throw new Error(errorMessage);
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },
    async register(data: RegisterData): Promise<{ message: string }> {
        const result = registerSchema.safeParse(data);

        if (!result.success) {
            const errors = result.error.errors.reduce((acc, error) => {
                const path = error.path[0] as string;
                if (!acc[path]) {
                    acc[path] = [];
                }
                acc[path].push(error.message);
                return acc;
            }, {} as Record<string, string[]>);
            throw new Error(JSON.stringify(errors));
        }

        try {
            const response = await axiosInstance.post<{ message: string }>('/auth/register', data);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to register');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },

    async resendEmailConfirmation(email: string): Promise<{ message: string }> {
        try {
            const response = await axiosInstance.post<{ message: string }>('/auth/resend-email-verification', { email });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to resend email confirmation');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    },

    async confirmEmail(email: string, code: string): Promise<{ message: string }> {
        try {
            const response = await axiosInstance.post<{ message: string }>('/auth/verify-email', { email, code });
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data.message || 'Failed to confirm email');
            } else {
                throw new Error('An unknown error occurred');
            }
        }
    }
};

export default UserService;

