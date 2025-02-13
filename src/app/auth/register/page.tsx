"use client";

import { useState } from 'react';
import AuthService from '../../../services/auth.service';

const Register: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await AuthService.register({ username, email, password });
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
        <form className="uk-form-stacked" onSubmit={handleRegister}>
            <div className="uk-margin">
                <label className="uk-form-label" htmlFor="form-stacked-text">Username</label>
                <div className="uk-form-controls">
                    <input className="uk-input" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
            </div>

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
                <button className="uk-button uk-button-default" type="submit">Register</button>
            </div>
        </form>
    );
};

export default Register;
