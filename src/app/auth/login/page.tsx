"use client";

import { useState } from 'react';
import AuthService from '../../../services/auth.service';

const Login: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await AuthService.login({ email, password });
            console.log(response.data.message);
        } catch (error: any) {
            if (error.response) {
                console.log(error.response.data.message);
            } else {
                console.log(error.message);
            }
        }
    };

    return (
        <form className="uk-form-stacked" onSubmit={handleLogin}>
            <div className="uk-margin">
                <label className="uk-form-label" htmlFor="form-stacked-text">Email</label>
                <div className="uk-form-controls">
                    <input className="uk-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
            </div>

            <div className="uk-margin">
                <label className="uk-form-label" htmlFor="form-stacked-select">Password</label>
                <div className="uk-form-controls">
                    <input className="uk-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
            </div>

            <div className="uk-margin">
                <button className="uk-button uk-button-default" type="submit">Login</button>
            </div>
        </form>
    );
};

export default Login;
