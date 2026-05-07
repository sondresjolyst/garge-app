'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { normalizeNoPhone } from '@/lib/phone';
import { useEscapeKey } from '@/lib/useEscapeKey';

export interface PaymentPhoneModalProps {
    title: string;
    summary: React.ReactNode;
    requireConsent?: boolean;
    extraField?: React.ReactNode;
    submitting: boolean;
    initialPhone?: string;
    onSubmit: (phoneMsisdn: string) => void;
    onCancel: () => void;
}

export default function PaymentPhoneModal({
    title,
    summary,
    requireConsent = false,
    extraField,
    submitting,
    initialPhone = '',
    onSubmit,
    onCancel,
}: PaymentPhoneModalProps) {
    const [phone, setPhone] = useState(initialPhone);
    const [agreed, setAgreed] = useState(false);
    const phoneRef = useRef<HTMLInputElement>(null);

    useEscapeKey(!submitting, onCancel);

    useEffect(() => {
        phoneRef.current?.focus();
    }, []);

    const normalized = normalizeNoPhone(phone);
    const phoneValid = normalized !== null;
    const phoneTouched = phone.length > 0;

    const consentOk = !requireConsent || agreed;
    const canSubmit = phoneValid && consentOk && !submitting;

    function handleSubmit() {
        if (!canSubmit || !normalized) return;
        onSubmit(normalized);
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <div className="absolute inset-0" aria-hidden onClick={() => { if (!submitting) onCancel(); }} />
            <div className="relative bg-gray-900 border border-gray-700/60 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
                <p id="payment-modal-title" className="text-sm font-semibold text-gray-100">{title}</p>
                <div className="text-xs text-gray-500">{summary}</div>

                <div className="space-y-1">
                    <div className="relative">
                        <input
                            ref={phoneRef}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                            placeholder="91 23 45 67"
                            aria-invalid={phoneTouched && !phoneValid}
                            aria-describedby="phone-hint"
                            className={`w-full bg-gray-800/60 border rounded-lg pl-3 pr-9 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-colors ${
                                phoneTouched && !phoneValid
                                    ? 'border-red-600/60 focus:border-red-500'
                                    : phoneValid
                                        ? 'border-green-600/40 focus:border-green-500'
                                        : 'border-gray-700/60 focus:border-sky-500/60'
                            }`}
                        />
                        {phoneValid && (
                            <CheckIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-green-400" aria-hidden />
                        )}
                    </div>
                    {phoneTouched && !phoneValid && (
                        <p id="phone-hint" role="alert" className="text-[11px] text-red-400">
                            Enter a valid phone number.
                        </p>
                    )}
                </div>

                {extraField}

                {requireConsent && (
                    <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={e => setAgreed(e.target.checked)}
                            className="mt-0.5 accent-sky-500 shrink-0"
                        />
                        <span className="text-xs text-gray-500 leading-relaxed">
                            I request immediate access and waive my 14-day right of withdrawal.
                        </span>
                    </label>
                )}
                {requireConsent && (
                    <p className="text-xs text-gray-600">
                        By continuing you accept our{' '}
                        <Link href="/terms" target="_blank" className="text-sky-500 hover:text-sky-400 transition-colors">Terms of Service</Link>.
                    </p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {submitting ? 'Redirecting…' : 'Continue to Vipps'}
                    </button>
                    <button
                        onClick={onCancel}
                        aria-label="Cancel payment"
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
