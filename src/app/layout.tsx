import React from 'react';
import './globals.css';
import Sidebar from './sidebar';
import Content from './content';
import Navbar from './navbar';
import SessionProviderWrapper from './SessionProviderWrapper';

export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <title>Garge</title>
            </head>
            <body className="bg-gray-900 text-gray-200">
                <SessionProviderWrapper>
                    <div className="flex h-screen overflow-hidden">
                        <Sidebar />
                        <div className="flex-1 overflow-auto">
                            <Navbar />
                            <Content>{children}</Content>
                        </div>
                    </div>
                </SessionProviderWrapper>
            </body>
        </html>
    );
};
