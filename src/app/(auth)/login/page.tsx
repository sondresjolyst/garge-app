"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { inputClass } from '@/components/TextInput';
import Alert from '@/components/Alert';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [apiMessage, setApiMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        getSession().then(s => { if (s) router.push('/'); });
    }, [router]);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiMessage('');
        setLoading(true);
        const result = await signIn('credentials', { redirect: false, email, password });
        if (result?.error) {
            setApiMessage(result.error);
            setLoading(false);
        } else {
            let session = await getSession();
            let retries = 0;
            while (!session && retries < 5) {
                await new Promise(res => setTimeout(res, 200));
                session = await getSession();
                retries++;
            }
            if (session) { router.push('/'); router.refresh(); }
            else setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <Image src="/garge-icon-large.png" width={0} height={0} className="h-20 sm:h-28 md:h-36 w-auto" unoptimized alt="Garge" priority />
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-8 shadow-xl">
                    <h1 className="text-xl font-semibold text-gray-100 mb-1">Welcome back</h1>
                    <p className="text-sm text-gray-400 mb-6">
                        No account?{' '}
                        <Link href="/register" className="text-sky-400 hover:text-sky-300 transition-colors">Create one</Link>
                    </p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                            <input
                                className={inputClass}
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    className={`${inputClass} pr-10`}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {apiMessage && (
                            <Alert variant="error">{apiMessage}</Alert>
                        )}

                        <Link href="/reset-password" className="block text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            Forgot your password?
                        </Link>

                        <button
                            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all text-sm"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
