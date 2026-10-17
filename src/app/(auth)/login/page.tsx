"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import Image from 'next/image';
import { LoginPage } from '@sjolystinnovation/app-kit/session/react';
import { isTerminalSessionError } from '@sjolystinnovation/app-kit/session';

const Login: React.FC = () => {
    const router = useRouter();

    // LoginPage shows the form to anyone, so a user who is still signed in goes to the start page here.
    useEffect(() => {
        getSession().then(s => { if (s && !isTerminalSessionError(s.error)) router.push('/'); });
    }, [router]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <Image src="/garge-icon-large.png" width={0} height={0} className="h-20 sm:h-28 md:h-36 w-auto" unoptimized alt="Garge" priority />
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-8 shadow-xl">
                    <LoginPage
                        redirectTo="/"
                        resetHref="/reset-password"
                        registerHref="/register"
                        strings={{ title: 'Welcome back' }}
                        className=""
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
