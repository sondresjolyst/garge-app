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
        <div className="flex-1">
            <div className="sticky top-0 bg-gray-700 shadow-md text-gray-200 p-4 z-50">
                <div className="container mx-auto">
                    <nav className="flex justify-between items-center p-4">
                        <div className="flex items-center space-x-4 ml-auto">
                            {isAuthenticated ? (
                                <>
                                    <ul className="flex space-x-4">
                                        {user && <li>{user.firstName}</li>}
                                        <li><Link className="text-gray-400 hover:text-gray-500" href={`/profile`}>Profile</Link></li>
                                    </ul>
                                    <button className="ml-4 bg-gray-600 text-gray-200 px-4 py-2 rounded" onClick={logoutUser}>Logout</button>
                                </>
                            ) : (
                                <>
                                    <Link className="ml-4 bg-gray-600 text-gray-200 px-4 py-2 rounded" href={`/register`}>Register</Link>
                                    <Link className="ml-4 bg-gray-600 text-gray-200 px-4 py-2 rounded" href={`/login`}>Login</Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
};


