"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';

const Register: React.FC = () => {
    const [userName, setUserName] = useState<string>('');
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errors, setErrors] = useState<{ userName?: string[]; firstName?: string[]; lastName?: string[]; email?: string[]; password?: string[] }>({});
    const [apiMessage, setApiMessage] = useState<string>('');
    const router = useRouter();
    const { loginUser } = useAuth();

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await AuthService.register({ userName, firstName, lastName, email, password });
            setApiMessage(response.message);
            setErrors({});

            const loginResponse = await AuthService.login({ email, password });
            const token = loginResponse.token;
            loginUser(token);

            router.push('/profile');
        } catch (error: any) {
            try {
                const parsedErrors = JSON.parse(error.message);
                setErrors(parsedErrors);
            } catch {
                setApiMessage(error.message);
            }
        }
    };

    return (
        <div className="flex items-center justify-center bg-gray-900 text-gray-200">
            <div className="w-full max-w-md p-6 rounded-lg shadow-md mx-auto">
                <h1 className="text-2xl mb-4">Register account</h1>
                <p className="mb-4">Already a customer? <a href="/login" className="text-blue-500">Login</a></p>
                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label className="block text-gray-400">Username</label>
                        <input
                            className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                            type="text"
                            placeholder="Username"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                        />
                        {errors.userName && errors.userName.map((error, index) => <p key={index} className="text-red-500">{error}</p>)}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-400">First Name</label>
                        <input
                            className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        {errors.firstName && errors.firstName.map((error, index) => <p key={index} className="text-red-500">{error}</p>)}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-400">Last Name</label>
                        <input
                            className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                        {errors.lastName && errors.lastName.map((error, index) => <p key={index} className="text-red-500">{error}</p>)}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-400">Email</label>
                        <input
                            className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {errors.email && errors.email.map((error, index) => <p key={index} className="text-red-500">{error}</p>)}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-400">Password</label>
                        <input
                            className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {errors.password && errors.password.map((error, index) => <p key={index} className="text-red-500">{error}</p>)}
                    </div>

                    <div>
                        <button className="w-full bg-gray-600 text-gray-200 p-2 rounded hover:bg-gray-500" type="submit">Register</button>
                    </div>

                    {apiMessage && <p className="text-red-500 mt-4">{apiMessage}</p>}
                </form>
            </div>
        </div>
    );
};

export default Register;
