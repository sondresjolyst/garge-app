import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
    const { isAuthenticated, logoutUser, user } = useAuth();

    return (
        <div className="sticky top-0 bg-gray-700 shadow-md text-gray-200 p-4 z-50">
            <div className="container mx-auto">
                <nav className="flex justify-between items-center p-4">
                    <div className="flex items-center space-x-4">
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
                                <ul className="flex space-x-4">
                                    <li><Link className="text-gray-400 hover:text-gray-500" href={`/register`}>Register</Link></li>
                                    <li><Link className="text-gray-400 hover:text-gray-500" href={`/login`}>Login</Link></li>
                                </ul>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </div>
    );
};
