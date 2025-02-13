"use client";

import { useState } from 'react';
import AuthService from '../../../services/auth.service';

const Register: React.FC = () => {
    const [username, setusername] = useState<string>('');
    const [email, setemail] = useState<string>('');
    const [password, setpassword] = useState<string>('');

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
        <form onSubmit={handleRegister}>
            <input type="text" placeholder="username" value={username} onChange={(e) => setusername(e.target.value)} />
            <input type="email" placeholder="email" value={email} onChange={(e) => setemail(e.target.value)} />
            <input type="password" placeholder="password" value={password} onChange={(e) => setpassword(e.target.value)} />
            <button type="submit">Register</button>
        </form>
    );
};

export default Register;
