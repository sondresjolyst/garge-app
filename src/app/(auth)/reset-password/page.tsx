"use client"

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ResetPasswordFlow } from '@sjolystinnovation/app-kit/ui';
import AuthService from '@/services/userService';
import { gargePasswordStrings } from '@/lib/validation/registerSchema';

// The emailed link carries the email and code, so the flow opens on its last step.
const ResetPasswordForm: React.FC = () => {
    const params = useSearchParams();
    return (
        <ResetPasswordFlow
            requestReset={AuthService.requestPasswordReset}
            reset={({ email, code, newPassword }) => AuthService.resetPassword({ email, code, NewPassword: newPassword })}
            loginHref="/login"
            initialEmail={params.get('email') ?? ''}
            initialCode={params.get('code') ?? ''}
            className=""
            passwordStrings={gargePasswordStrings}
        />
    );
};

const ResetPassword: React.FC = () => (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
            <div className="flex justify-center mb-8">
                <Image src="/garge-icon-large.png" width={0} height={0} className="h-20 sm:h-28 md:h-36 w-auto" unoptimized alt="Garge" priority />
            </div>

            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-8 shadow-xl">
                <Suspense fallback={null}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    </div>
);

export default ResetPassword;
