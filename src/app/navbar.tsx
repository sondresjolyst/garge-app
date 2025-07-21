"use client"

import React from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function Navbar() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';

    return (
        <div className="sticky top-0 bg-gray-700 shadow-md text-gray-200 p-4 z-40">
            <div className="container ml-auto flex">
                <nav className="flex items-center space-x-4 ml-auto">
                    {isAuthenticated ? (
                        <>
                            <ul className="flex space-x-4">
                                {session?.user && <li>{session.user.name}</li>}
                                <li><Link className="text-gray-400 hover:text-gray-500" href={`/profile`}>Profile</Link></li>
                            </ul>
                            <button className="ml-4 gargeBtnActive" onClick={() => signOut()}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link className="ml-4 gargeBtnActive" href={`/register`}>Register</Link>
                            <Link className="ml-4 gargeBtnActive" href={`/login`}>Login</Link>
                        </>
                    )}
                </nav>
            </div>
        </div>
    );
};
