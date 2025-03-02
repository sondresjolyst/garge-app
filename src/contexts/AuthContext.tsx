"use client"

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { UserDTO } from '@/dto/UserDTO';
import UserService, { decodeToken } from '@/services/userService';
import { DecodedToken } from '@/types/types';
import jwt from 'jsonwebtoken';

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserDTO | null;
    loginUser: (token: string) => void;
    logoutUser: () => void;
    decodedToken: DecodedToken | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserDTO | null>(null);
    const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);

    useEffect(() => {
        const token = Cookies.get('jwtToken');
        if (token) {
            setIsAuthenticated(true);
            const decoded = decodeToken();
            if (decoded) {
                setDecodedToken(decoded);
                UserService.getUserProfile().then(setUser).catch(() => {
                    setIsAuthenticated(false);
                    setUser(null);
                });
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        }
    }, []);

    const loginUser = (token: string) => {
        const decoded = jwt.decode(token) as DecodedToken;
        if (decoded && decoded.exp) {
            const expires = new Date(decoded.exp * 1000);
            Cookies.set('jwtToken', token, { expires, secure: true, sameSite: 'none', path: '/' });
            setIsAuthenticated(true);
            setDecodedToken(decoded);
            UserService.getUserProfile().then(setUser);
        }
    };

    const logoutUser = () => {
        Cookies.remove('jwtToken');
        setIsAuthenticated(false);
        setUser(null);
        setDecodedToken(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, loginUser, logoutUser, decodedToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };