"use client"

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Content({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, logoutUser, user } = useAuth();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    return (
        <div className="uk-width-expand@l">
            <div className="uk-navbar-container tm-navbar-container uk-sticky uk-sticky-fixed uk-box-shadow-medium">
                <div className="uk-container uk-container-expand">
                    <nav className="uk-navbar-container">
                        <div className="uk-container">
                            <div className="uk-navbar">
                                <div className="uk-navbar-right">
                                    {isAuthenticated ? (
                                        <>
                                            <ul className="uk-navbar-nav">
                                                {user && <li><a>{user.firstName}</a></li>}
                                                <li><Link className="uk-button uk-button-link" href={`/profile`}>Profile</Link></li>
                                            </ul>
                                            <div className="uk-navbar-item">
                                                <a className="uk-button uk-button-default" onClick={logoutUser}>Logout</a>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ul className="uk-navbar-nav">
                                                <li><Link className="uk-button uk-button-link" href={`/register`}>Register</Link></li>
                                                <li><Link className="uk-button uk-button-link" href={`/login`}>Login</Link></li>
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
            <div className="uk-section uk-padding">
                {children}
            </div>
        </div>
    );
};