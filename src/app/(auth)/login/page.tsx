"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';

const Login: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [apiMessage, setApiMessage] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const session = await getSession();
            if (session) {
                router.push('/profile');
            }
        };
        checkSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const result = await signIn('credentials', {
            redirect: true,
            email,
            password,
        });

        if (result?.error) {
            setApiMessage(result.error);
        } else {
            router.push('/profile');
        }
    };

    return (
        <div className="flex items-center justify-center bg-gray-900 text-gray-200">
            <div className="w-full max-w-md p-6 rounded-lg mx-auto">
                <h1 className="text-2xl mb-4">Login</h1>
                <p className="mb-4">New customer? <a href="/register" className="text-blue-500">Register account</a></p>
                <form onSubmit={handleLogin}>
                    {apiMessage && <p className="text-red-500">{apiMessage}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-400">Email</label>
                        <input
                            className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
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
                    </div>

                    <p className="mb-4">Forgot password? <a href="/reset-password" className="text-blue-500">Reset password</a></p>
                    <div>
                        <button className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-gray-200 p-2 rounded" type="submit">Login</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
