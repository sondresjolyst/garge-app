import React from 'react';
import './globals.css';
import FloatingNav from './FloatingNav';
import Content from './content';
import Navbar from './navbar';
import Footer from './footer';
import SessionProviderWrapper from './SessionProviderWrapper';
import type { Metadata } from "next";
import Script from 'next/script';
import { Toaster } from 'sonner';
import { Outfit, Syne, JetBrains_Mono } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const syne   = Syne({ subsets: ['latin'], variable: '--font-syne',   display: 'swap' });
const jetMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

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
            <body className={`bg-gray-900 text-gray-200 font-sans ${outfit.variable} ${syne.variable} ${jetMono.variable}`}>
                <SessionProviderWrapper>
                    <div className="min-h-screen flex flex-col">
                        <Navbar />
                        <main className="flex-1 pb-28">
                            <Content>{children}</Content>
                        </main>
                        <Footer />
                        <FloatingNav />
                    </div>
                    <Toaster position="bottom-center" theme="dark" richColors />
                </SessionProviderWrapper>
            </body>
        </html>
    );
};
