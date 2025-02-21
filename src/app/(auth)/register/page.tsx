"use client"

import { useState } from 'react';
import AuthService from '@/services/userService';

const Register: React.FC = () => {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errors, setErrors] = useState<{ name?: string[]; email?: string[]; password?: string[] }>({});
    const [apiMessage, setApiMessage] = useState<string>('');

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await AuthService.register({ name, email, password });
            setApiMessage(response.message);
            setErrors({});
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
        <form className="uk-form-stacked" onSubmit={handleRegister}>
            <div className="uk-margin">
                <label className="uk-form-label" htmlFor="form-stacked-text">Name</label>
                <div className="uk-form-controls">
                    <input
                        className="uk-input"
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    {errors.name && errors.name.map((error, index) => <p key={index} className="uk-text-danger">{error}</p>)}
                </div>
            </div>

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
                    {errors.email && errors.email.map((error, index) => <p key={index} className="uk-text-danger">{error}</p>)}
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
                    {errors.password && errors.password.map((error, index) => <p key={index} className="uk-text-danger">{error}</p>)}
                </div>
            </div>

            <div className="uk-margin">
                <button className="uk-button uk-button-primary" type="submit">Register</button>
            </div>

            {apiMessage && <p className="uk-text-danger">{apiMessage}</p>}
        </form>
    );
};

export default Register;