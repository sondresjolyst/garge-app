import { UserDTO } from '@/dto/UserDTO';
import axiosInstance from '@/services/axiosInstance';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { DecodedToken } from '@/types/types';

interface RegisterData extends LoginData {
    firstName: string;
    lastName: string;
    userName: string;
}

interface LoginData {
    email: string;
    password: string;
}

const decodeToken = (): DecodedToken | null => {
    const token = Cookies.get('jwtToken');
    if (!token) {
        return null;
    }

    return jwt.decode(token) as DecodedToken;
};

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
        const decodedToken = decodeToken();
        if (!decodedToken) {
            throw new Error('No token found or token is invalid');
        }

        const sub = decodedToken.sub;
        try {
            const response = await axiosInstance.get<UserDTO>(`/user/profile/${sub}`);
            return response.data;
        } catch (error: Error | any) {
            console.log(error);
            throw new Error(error.response?.data.message || 'Failed to fetch user profile');
        }
    },
    async login(data: LoginData): Promise<{ token: string }> {
        try {
            const response = await axiosInstance.post<{ token: string }>('/auth/login', data);
            return response.data;
        } catch (error: Error | any) {
            const errorMessage = error.response?.data.message || 'Failed to login';
            throw new Error(errorMessage);
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
        } catch (error: Error | any) {
            throw new Error(error.response?.data.message || 'Failed to register');
        }
    }
};

export default UserService;
export { decodeToken };
