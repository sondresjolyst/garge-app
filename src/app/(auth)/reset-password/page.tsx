"use client"

import { useState } from 'react';
import AuthService from '@/services/userService';
import Image from 'next/image';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const inputClass = "w-full px-3 py-2.5 bg-gray-900/60 border border-gray-700/50 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm";

const ResetPassword: React.FC = () => {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [NewPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [apiMessage, setApiMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendResetCode = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiMessage('');
        setLoading(true);
        try {
            await AuthService.requestPasswordReset({ email });
            setStep(2);
        } catch (error: unknown) {
            setApiMessage(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiMessage('');
        setLoading(true);
        try {
            const response = await AuthService.resetPassword({ email, code, NewPassword });
            setSuccessMessage(response.message);
        } catch (error: unknown) {
            setApiMessage(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <Image src="/garge-icon-large.png" width={0} height={0} className="h-20 sm:h-28 md:h-36 w-auto" unoptimized alt="Garge" priority />
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-8 shadow-xl">
                    <h1 className="text-xl font-semibold text-gray-100 mb-1">Reset password</h1>
                    <p className="text-sm text-gray-400 mb-6">
                        Remembered it?{' '}
                        <Link href="/login" className="text-sky-400 hover:text-sky-300 transition-colors">Sign in</Link>
                    </p>

                    {successMessage ? (
                        <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-3">
                            {successMessage}
                            <Link href="/login" className="block mt-3 text-sky-400 hover:text-sky-300 transition-colors">Back to sign in →</Link>
                        </div>
                    ) : step === 1 ? (
                        <form onSubmit={handleSendResetCode} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                                <input className={inputClass} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            {apiMessage && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{apiMessage}</p>}
                            <button className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all text-sm" type="submit" disabled={loading}>
                                {loading ? 'Sending…' : 'Send reset code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <p className="text-sm text-sky-400">Check your email for the reset code.</p>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                                <input className={inputClass} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Reset code</label>
                                <input className={inputClass} type="text" placeholder="Code from email" value={code} onChange={e => setCode(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">New password</label>
                                <div className="relative">
                                    <input
                                        className={`${inputClass} pr-10`}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={NewPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors" tabIndex={-1}>
                                        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            {apiMessage && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{apiMessage}</p>}
                            <button className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all text-sm" type="submit" disabled={loading}>
                                {loading ? 'Resetting…' : 'Reset password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
