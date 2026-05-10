'use client';

import Link from 'next/link';
import { ArrowPathIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

export type ReturnVariant = 'success' | 'pending' | 'failed';

export interface ReturnStatusPageProps {
    variant: ReturnVariant;
    successTitle: string;
    successBody: string;
    successHref: string;
    successCta: string;
    successExtra?: React.ReactNode;
    pendingTitle: string;
    pendingBody: string;
    pendingHref: string;
    pendingCta: string;
    pendingEmailNote?: string;
    onRefresh?: () => void;
    failedTitle: string;
    failedBody: string;
    failedHref: string;
    failedCta: string;
}

export default function ReturnStatusPage(props: ReturnStatusPageProps) {
    return (
        <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center gap-5 text-center pb-32">
            {props.variant === 'success' && (
                <>
                    <CheckCircleIcon className="h-16 w-16 text-green-400" aria-hidden />
                    <p className="text-xl font-display font-bold text-gray-100">{props.successTitle}</p>
                    <p className="text-sm text-gray-500">{props.successBody}</p>
                    {props.successExtra}
                    <Link href={props.successHref} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors">
                        {props.successCta}
                    </Link>
                </>
            )}
            {props.variant === 'pending' && (
                <>
                    <ClockIcon className="h-16 w-16 text-amber-400" aria-hidden />
                    <p className="text-xl font-display font-bold text-gray-100">{props.pendingTitle}</p>
                    <p className="text-sm text-gray-500">{props.pendingBody}</p>
                    {props.pendingEmailNote && (
                        <p className="text-xs text-gray-600">{props.pendingEmailNote}</p>
                    )}
                    <div className="flex gap-2">
                        {props.onRefresh && (
                            <button
                                onClick={props.onRefresh}
                                aria-label="Check again"
                                className="px-4 py-2.5 bg-sky-600/80 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                <ArrowPathIcon className="h-4 w-4" aria-hidden />
                                Check again
                            </button>
                        )}
                        <Link href={props.pendingHref} className="px-4 py-2.5 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                            {props.pendingCta}
                        </Link>
                    </div>
                </>
            )}
            {props.variant === 'failed' && (
                <>
                    <XCircleIcon className="h-16 w-16 text-red-400" aria-hidden />
                    <p className="text-xl font-display font-bold text-gray-100">{props.failedTitle}</p>
                    <p className="text-sm text-gray-500">{props.failedBody}</p>
                    <Link href={props.failedHref} className="px-5 py-2.5 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
                        {props.failedCta}
                    </Link>
                </>
            )}
        </div>
    );
}
