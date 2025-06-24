"use client"

import { useState } from 'react';
import AuthService from '@/services/userService';

type ApiResponse = {
    message: string;
};

type ErrorResponse = {
    [key: string]: string[];
};

const ResetPassword: React.FC = () => {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [NewPassword, setNewPassword] = useState<string>('');
    const [apiMessage, setApiMessage] = useState<string>('');
    const [apiData, setApiData] = useState<ApiResponse | null>(null);
    const [errors, setErrors] = useState<ErrorResponse>({});

    const handleSendResetCode = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiMessage('');
        setErrors({});
        setApiData(null);
        try {
            const response = await AuthService.requestPasswordReset({ email }) as ApiResponse;
            setApiData(response);
            setApiMessage('');
            setStep(2);
        } catch (error: unknown) {
            setApiData(null);
            if (error instanceof Error) {
                try {
                    const parsedErrors = JSON.parse(error.message);
                    if (typeof parsedErrors === 'object' && parsedErrors !== null) {
                        setErrors(parsedErrors as ErrorResponse);
                    } else {
                        setApiMessage(error.message);
                    }
                } catch {
                    setApiMessage(error.message);
                }
            } else {
                setApiMessage('An unknown error occurred');
            }
        }
    };

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiMessage('');
        setErrors({});
        setApiData(null);
        try {
            const response = await AuthService.resetPassword({ email, code, NewPassword }) as ApiResponse;
            setApiData(response);
            setApiMessage('');
        } catch (error: unknown) {
            setApiData(null);
            if (error instanceof Error) {
                try {
                    const parsedErrors = JSON.parse(error.message);
                    if (typeof parsedErrors === 'object' && parsedErrors !== null) {
                        setErrors(parsedErrors as ErrorResponse);
                    } else {
                        setApiMessage(error.message);
                    }
                } catch {
                    setApiMessage(error.message);
                }
            } else {
                setApiMessage('An unknown error occurred');
            }
        }
    };

    return (
        <div className="flex items-center justify-center bg-gray-900 text-gray-200">
            <div className="w-full max-w-md p-6 rounded-lg mx-auto">
                <h1 className="text-2xl mb-4">Reset Password</h1>
                {step === 1 && (
                    <form onSubmit={handleSendResetCode}>
                        <div className="mb-4">
                            <label className="block text-gray-400">Email</label>
                            <input
                                className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {errors.email && errors.email.map((error, idx) => (
                                <p key={idx} className="text-red-500">{error}</p>
                            ))}
                        </div>
                        <button className="w-full gargeBtnActive" type="submit">Send reset code</button>
                        {apiMessage && <p className="text-red-500 mt-4">{apiMessage}</p>}
                    </form>
                )}

                {step === 2 && (
                    <>
                        {apiData?.message && (
                            <p className="text-green-500 mb-4">{apiData.message}</p>
                        )}
                        <form onSubmit={handleResetPassword}>
                            <div className="mb-4">
                                <label className="block text-gray-400">Email</label>
                                <input
                                    className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-400">Code</label>
                                <input
                                    className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                                    type="text"
                                    placeholder="Reset code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-400">New Password</label>
                                <input
                                    className="w-full p-2 border border-gray-600 rounded mt-1 bg-gray-700 text-gray-200"
                                    type="password"
                                    placeholder="New Password"
                                    value={NewPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <button className="w-full gargeBtnActive" type="submit">Reset</button>
                            {apiMessage && <p className="text-red-500 mt-4">{apiMessage}</p>}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
