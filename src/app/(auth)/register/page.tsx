"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import AuthService from '@/services/userService';
import { getTermsVersion } from '@/services/legalService';
import BrandLogo from '@/components/BrandLogo';
import LoadingDots from '@/components/LoadingDots';
import Link from 'next/link';
import { inputClass } from '@/components/TextInput';
import { PasswordInput } from '@sjolystinnovation/app-kit/ui';
import { Alert } from '@sjolystinnovation/app-kit/ui';
import { FieldValidationError, type FieldErrors } from '@/lib/errors';
import { registerSchema } from '@/lib/validation/registerSchema';
import { zodFieldErrors } from '@sjolystinnovation/app-kit/validation';
import { apiErrorCode } from '@sjolystinnovation/app-kit/api';
import { isTerminalSessionError } from '@sjolystinnovation/app-kit/session';

/** The fields that show their own errors under their input. */
const FIELDS_WITH_INPUT = new Set(['userName', 'firstName', 'lastName', 'email', 'password']);

const TERMS_CHANGED_MESSAGE = 'The terms have changed. Read the new terms and accept them again.';

// next-auth answers a stale CSRF token with its own sign-in page and ?csrf=true, and calls it a success.
function refusedForCsrf(url: string | null | undefined): boolean {
    if (!url) return false;
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname.endsWith('/signin') && parsed.searchParams.get('csrf') === 'true';
}

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
    // The version of the terms the user reads now. Registration sends it back, so it has to load first.
    const [termsVersion, setTermsVersion] = useState<string | null>(null);
    const [termsLoadFailed, setTermsLoadFailed] = useState(false);
    const router = useRouter();

    // The session comes from the provider's own read, so a first visit sends a single session request
    // and the sign-in after registering keeps the CSRF cookie it was given.
    const { data: session, status } = useSession();
    // The first settled session decides what the page shows, so a visitor who is already signed in
    // never sees the form. The sign-in after registering is left to handleRegister.
    const [view, setView] = useState<'form' | 'profile' | null>(null);
    if (view === null && status !== 'loading') {
        setView(status === 'authenticated' && !isTerminalSessionError(session?.error) ? 'profile' : 'form');
    }

    // replace, so Back does not return to a page that only redirects again.
    useEffect(() => {
        if (view === 'profile') router.replace('/profile');
    }, [view, router]);

    // Sets the loaded version, or the failure, unless the page has moved on.
    const fetchTermsVersion = useCallback((isCurrent: () => boolean) => getTermsVersion().then(
        version => { if (isCurrent()) setTermsVersion(version); },
        () => { if (isCurrent()) setTermsLoadFailed(true); },
    ), []);

    useEffect(() => {
        let current = true;
        fetchTermsVersion(() => current);
        return () => { current = false; };
    }, [fetchTermsVersion]);

    const loadTermsVersion = () => {
        setTermsVersion(null);
        setTermsLoadFailed(false);
        fetchTermsVersion(() => true);
    };

    // Live client-side validation: re-check a field once the user has touched it,
    // so password-rule feedback appears before the server round trip.
    const validateField = (field: string, values: { userName: string; firstName: string; lastName: string; email: string; password: string }) => {
        const result = registerSchema.safeParse(values);
        setErrors(prev => {
            const next = { ...prev };
            if (result.success) {
                delete next[field];
            } else {
                const fieldErrors: FieldErrors = zodFieldErrors(result.error, { all: true });
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
        if (!agreedToTerms || !confirmAge16Plus || termsVersion === null) return;
        setLoading(true);
        try {
            await AuthService.register({
                userName, firstName, lastName, email, password,
                confirmAge16Plus,
                acceptTerms: agreedToTerms,
                termsVersion,
            });
            setErrors({});
            const result = await signIn('credentials', { redirect: false, email, password });
            // The account exists now, so a refused sign-in sends the user to sign in by hand.
            if (result?.error || !result?.ok || refusedForCsrf(result.url)) {
                router.push('/login');
                return;
            }
            router.push('/profile');
            router.refresh();
        } catch (error: unknown) {
            if (error instanceof FieldValidationError) {
                setErrors(error.fieldErrors);
                // A field without its own input, such as termsVersion or acceptTerms, shows in the alert instead.
                const leftover = Object.entries(error.fieldErrors).find(([field, messages]) => !FIELDS_WITH_INPUT.has(field) && messages.length > 0);
                setApiMessage(leftover ? leftover[1][0] : '');
            } else if (apiErrorCode(error) === 'termsChanged') {
                // The user has to read and accept the new terms, and the next submit sends their version.
                setAgreedToTerms(false);
                setApiMessage(TERMS_CHANGED_MESSAGE);
                loadTermsVersion();
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
                    <BrandLogo width={0} height={0} className="h-20 sm:h-28 md:h-36 w-auto" unoptimized priority />
                </div>

                <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-8 shadow-xl">
                    {/* The form waits for the session check, so a signed-in visitor does not see it flash. */}
                    {view !== 'form' ? <LoadingDots height="h-131.5" /> : (
                        <>
                            <h1 className="text-xl font-bold text-gray-100 mb-1">Create account</h1>
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
                                    <PasswordInput
                                        label="Password"
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
                                    disabled={loading || !agreedToTerms || !confirmAge16Plus || termsVersion === null}
                                    aria-describedby={termsVersion === null ? 'register-terms-status' : undefined}
                                >
                                    {loading ? 'Creating account…' : 'Create account'}
                                </button>
                                {termsVersion === null && (
                                    <p id="register-terms-status" role="status" className="text-xs text-gray-400 text-center">
                                        {termsLoadFailed ? (
                                            <>
                                                Could not load the terms.{' '}
                                                <button type="button" onClick={loadTermsVersion} className="text-sky-400 hover:text-sky-300 transition-colors">
                                                    Try again
                                                </button>
                                            </>
                                        ) : 'Loading the terms…'}
                                    </p>
                                )}
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
