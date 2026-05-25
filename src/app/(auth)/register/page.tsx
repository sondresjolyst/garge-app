"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import AuthService from '@/services/userService';
import Image from 'next/image';
import Link from 'next/link';
import { inputClass } from '@/components/TextInput';
import PasswordInput from '@/components/PasswordInput';
import Alert from '@/components/Alert';
import { FieldValidationError, type FieldErrors } from '@/lib/errors';
import { registerSchema, zodIssuesToFieldErrors } from '@/lib/validation/registerSchema';

const TERMS_VERSION = 'v1-2026-05';

const Register: React.FC = () => {
    const [userName, setUserName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [confirmAge16Plus, setConfirmAge16Plus] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [apiMessage, setApiMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        getSession().then(s => { if (s) router.push('/profile'); });
    }, [router]);

    // Live client-side validation: re-check a field once the user has touched it,
    // so password-rule feedback appears before the server round trip.
    const validateField = (field: string, values: { userName: string; firstName: string; lastName: string; email: string; password: string }) => {
        const result = registerSchema.safeParse(values);
        setErrors(prev => {
            const next = { ...prev };
            if (result.success) {
                delete next[field];
            } else {
                const fieldErrors = zodIssuesToFieldErrors(result.error.issues);
                if (fieldErrors[field]) next[field] = fieldErrors[field];
                else delete next[field];
            }
            return next;
        });
    };

    const currentValues = () => ({ userName, firstName, lastName, email, password });

    const handleFieldChange = (field: string, setter: (v: string) => void, value: string) => {
        setter(value);
        if (touched[field]) validateField(field, { ...currentValues(), [field]: value });
    };

    const handleFieldBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field, currentValues());
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!agreedToTerms || !confirmAge16Plus) return;
        setLoading(true);
        try {
            await AuthService.register({
                userName, firstName, lastName, email, password,
                confirmAge16Plus,
                acceptTerms: agreedToTerms,
                termsVersion: TERMS_VERSION,
            });
            setErrors({});
            const result = await signIn('credentials', { redirect: true, email, password });
            if (result?.error) { setApiMessage(result.error); setLoading(false); }
            else router.push('/profile');
        } catch (error: unknown) {
            if (error instanceof FieldValidationError) {
                setErrors(error.fieldErrors);
            } else if (error instanceof Error) {
                setApiMessage(error.message);
            } else {
                setApiMessage('An unknown error occurred');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <Image src="/garge-icon-large.png" width={0} height={0} className="h-20 sm:h-28 md:h-36 w-auto" unoptimized alt="Garge" priority />
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-8 shadow-xl">
                    <h1 className="text-xl font-display font-bold text-gray-100 mb-1">Create account</h1>
                    <p className="text-sm text-gray-400 mb-6">
                        Already have one?{' '}
                        <Link href="/login" className="text-sky-400 hover:text-sky-300 transition-colors">Sign in</Link>
                    </p>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
                            <input className={inputClass} type="text" placeholder="username" value={userName} onChange={e => handleFieldChange('userName', setUserName, e.target.value)} onBlur={() => handleFieldBlur('userName')} />
                            {errors.userName?.map((err, i) => <p key={i} className="text-xs text-red-400 mt-1">{err}</p>)}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">First name</label>
                                <input className={inputClass} type="text" placeholder="First" value={firstName} onChange={e => handleFieldChange('firstName', setFirstName, e.target.value)} onBlur={() => handleFieldBlur('firstName')} />
                                {errors.firstName?.map((err, i) => <p key={i} className="text-xs text-red-400 mt-1">{err}</p>)}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Last name</label>
                                <input className={inputClass} type="text" placeholder="Last" value={lastName} onChange={e => handleFieldChange('lastName', setLastName, e.target.value)} onBlur={() => handleFieldBlur('lastName')} />
                                {errors.lastName?.map((err, i) => <p key={i} className="text-xs text-red-400 mt-1">{err}</p>)}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                            <input className={inputClass} type="email" placeholder="you@example.com" value={email} onChange={e => handleFieldChange('email', setEmail, e.target.value)} onBlur={() => handleFieldBlur('email')} />
                            {errors.email?.map((err, i) => <p key={i} className="text-xs text-red-400 mt-1">{err}</p>)}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                            <PasswordInput
                                placeholder="••••••••"
                                value={password}
                                onChange={e => handleFieldChange('password', setPassword, e.target.value)}
                                onBlur={() => handleFieldBlur('password')}
                            />
                            {errors.password?.map((err, i) => <p key={i} className="text-xs text-red-400 mt-1">{err}</p>)}
                        </div>

                        {apiMessage && (
                            <Alert variant="error">{apiMessage}</Alert>
                        )}

                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={confirmAge16Plus}
                                onChange={e => setConfirmAge16Plus(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-gray-900 flex-shrink-0"
                            />
                            <span className="text-xs text-gray-400 leading-relaxed">
                                I confirm I am 16 or older.
                            </span>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={e => setAgreedToTerms(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-gray-900 flex-shrink-0"
                            />
                            <span className="text-xs text-gray-400 leading-relaxed">
                                I have read and agree to the{' '}
                                <Link href="/terms" className="text-sky-400 hover:text-sky-300 transition-colors">Terms of Service</Link>
                                {' '}and{' '}
                                <Link href="/privacy" className="text-sky-400 hover:text-sky-300 transition-colors">Privacy Policy</Link>
                            </span>
                        </label>

                        <button
                            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all text-sm"
                            type="submit"
                            disabled={loading || !agreedToTerms || !confirmAge16Plus}
                        >
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
