import React from 'react';
import '../app/globals.css';
import Link from 'next/link';

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <html lang="en">
            <head>
                <title>My Next.js App</title>
            </head>
            <body>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <Link href="/auth/register">Register</Link>
                        </li>
                        <li>
                            <Link href="/auth/login">Login</Link>
                        </li>
                    </ul>
                </nav>
                {children}
            </body>
        </html>
    );
};

export default Layout;
