import React from 'react';
import './globals.css';
import FloatingNav from './FloatingNav';
import Content from './content';
import Navbar from './navbar';
import Footer from './footer';
import SessionProviderWrapper from './SessionProviderWrapper';
import CookieBanner from '@/components/CookieBanner';
import InstallPrompt from '@/components/InstallPrompt';
import type { Metadata } from "next";
import Script from 'next/script';
import { Toaster } from 'sonner';
import { JetBrains_Mono } from 'next/font/google';
import { publicGetOptional } from '@/lib/publicApi';
import type { Branding } from '@/services/brandingService';
import { REVALIDATE_TARGETS } from '@/lib/cacheTags';

const jetMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });

export const metadata: Metadata = {
    title: 'Garge',
    description: 'Smart garage system',
    manifest: '/manifest.json',
}

export default async function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    // Starts the branding provider with the uploaded logo, so the first render shows it. Without the API the bundled logo shows.
    const branding = await publicGetOptional<Branding>('/branding', { tags: [REVALIDATE_TARGETS.branding] });
    return (
        <html lang="en" className="dark">
            <Script src='/register-sw.js' />
            <head>
                <title>Garge</title>
            </head>
            <body className={`bg-gray-900 text-gray-200 font-sans ${jetMono.variable}`}>
                <SessionProviderWrapper initialBranding={branding ?? undefined}>
                    <div className="min-h-screen flex flex-col">
                        <Navbar />
                        <main className="flex-1 pb-28">
                            <Content>{children}</Content>
                        </main>
                        <Footer />
                        <FloatingNav />
                    </div>
                    <CookieBanner />
                    <InstallPrompt />
                    <Toaster position="bottom-center" theme="dark" richColors />
                </SessionProviderWrapper>
            </body>
        </html>
    );
};
