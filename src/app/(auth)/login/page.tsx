"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BrandLogo from '@/components/BrandLogo';
import LoadingDots from '@/components/LoadingDots';
import { LoginPage } from '@sjolystinnovation/app-kit/session/react';
import { isTerminalSessionError } from '@sjolystinnovation/app-kit/session';

const Login: React.FC = () => {
    const router = useRouter();
    // The session comes from the provider's own read. On a first visit every auth request without a
    // CSRF cookie is handed a new one, so a second read here could replace the token a quick sign-in sends.
    const { data: session, status } = useSession();
    // The first settled session decides what the page shows. The sign-in itself is left to LoginPage.
    const [view, setView] = useState<'form' | 'profile' | null>(null);
    if (view === null && status !== 'loading') {
        setView(status === 'authenticated' && !isTerminalSessionError(session?.error) ? 'profile' : 'form');
    }

    // LoginPage shows the form to anyone, so a user who is still signed in goes to the profile here.
    // replace, so Back does not return to a page that only redirects again.
    useEffect(() => {
        if (view === 'profile') router.replace('/profile');
    }, [view, router]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <BrandLogo width={0} height={0} className="h-20 sm:h-28 md:h-36 w-auto" unoptimized priority />
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-8 shadow-xl">
                    {/* The form waits for the session check, so a signed-in visitor does not see it flash. */}
                    {view !== 'form' ? <LoadingDots height="h-82" /> : (
                        <LoginPage
                            redirectTo="/profile"
                            resetHref="/reset-password"
                            registerHref="/register"
                            strings={{ title: 'Welcome back' }}
                            className=""
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
