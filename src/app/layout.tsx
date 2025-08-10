import React from 'react';
import './globals.css';
import Sidebar from './sidebar';
import Content from './content';
import Navbar from './navbar';
import Footer from './footer';
import SessionProviderWrapper from './SessionProviderWrapper';
import type { Metadata } from "next";
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'Garge',
    description: 'Smart garage system',
    manifest: '/manifest.json',
}

export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <Script src='/register-sw.js' />
            <head>
                <title>Garge</title>
            </head>
            <body className="bg-gray-900 text-gray-200">
                <SessionProviderWrapper>
                    <div className="flex h-screen overflow-hidden">
                        <Sidebar />
                        <div className="flex flex-col flex-1 overflow-auto">
                            <Navbar />
                            <div className="flex-grow">
                                <Content>{children}</Content>
                            </div>
                            <Footer />
                        </div>
                    </div>
                </SessionProviderWrapper>
            </body>
        </html>
    );
};
