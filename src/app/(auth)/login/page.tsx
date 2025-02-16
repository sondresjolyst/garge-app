"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserService from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';

const Login: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [apiMessage, setApiMessage] = useState<string>('');
    const { isAuthenticated, loginUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/profile');
        }
    }, [isAuthenticated, router]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await UserService.login({ email, password });
            const token = response.token;
            loginUser(token);
            router.push('/profile');
        } catch (error: any) {
            setApiMessage(error.message);
        }
    };

    return (
        <div>
            {isAuthenticated ? (
                <div>
                    <p>You are logged in!</p>
                </div>
            ) : (
                <form className="uk-form-stacked" onSubmit={handleLogin}>
                    {apiMessage && <p className="uk-text-danger">{apiMessage}</p>}
                    <div className="uk-margin">
                        <label className="uk-form-label" htmlFor="form-stacked-text">Email</label>
                        <div className="uk-form-controls">
                            <input
                                className="uk-input"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="uk-margin">
                        <label className="uk-form-label" htmlFor="form-stacked-select">Password</label>
                        <div className="uk-form-controls">
                            <input
                                className="uk-input"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="uk-margin">
                        <button className="uk-button uk-button-default" type="submit">Login</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Login;