"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserService from '@/services/userService';
import { UserDTO } from '@/dto/UserDTO';

const Profile: React.FC = () => {
    const { status } = useSession();
    const router = useRouter();
    const isAuthenticated = status === 'authenticated';
    const [user, setUser] = useState<UserDTO | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [verificationCode, setVerificationCode] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else {
            const fetchUserProfile = async () => {
                try {
                    const userProfile = await UserService.getUserProfile();
                    setUser(userProfile);
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                }
            };
            fetchUserProfile();
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else {
            setIsButtonDisabled(false);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResendConfirmation = async () => {
        if (user) {
            try {
                const response = await UserService.resendEmailConfirmation(user.email);
                setMessage(response.message);
                setIsButtonDisabled(true);
                setCountdown(60);
            } catch (error) {
                console.error('Failed to resend email confirmation:', error);
                setMessage('Failed to resend email confirmation');
            }
        }
    };

    const handleConfirmEmail = async () => {
        if (user) {
            try {
                const response = await UserService.confirmEmail(user.email, verificationCode);
                setMessage(response.message);
                setUser({ ...user, emailConfirmed: true });
            } catch (error) {
                console.error('Failed to confirm email:', error);
                setMessage('Failed to confirm email');
            }
        }
    };

    if (status === 'loading' || !user) {
        return <p>Loading...</p>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            <p className="mb-2"><strong>Email:</strong> {user.email}</p>
            <p className="mb-2"><strong>First Name:</strong> {user.firstName}</p>
            <p className="mb-2"><strong>Last Name:</strong> {user.lastName}</p>
            <div className="mb-2">
                <strong>Email Confirmed:</strong>
                <input
                    type="checkbox"
                    checked={user.emailConfirmed}
                    readOnly
                    className="ml-2"
                />
            </div>
            {!user.emailConfirmed && (
                <>
                    <div className="mt-4">
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="Enter verification code"
                            className="border p-2 rounded"
                        />
                        <button
                            onClick={handleConfirmEmail}
                            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Confirm Email
                        </button>
                    </div>
                    <button
                        onClick={handleResendConfirmation}
                        className="bg-gray-600 text-gray-200 px-4 py-2 rounded mt-4"
                        disabled={isButtonDisabled}
                    >
                        Resend Confirmation
                    </button>
                    {isButtonDisabled && (
                        <span className="ml-2 text-gray-500">{countdown}s</span>
                    )}
                </>
            )}
            {message && <p className="mt-4 text-green-500">{message}</p>}
        </div>
    );
};

export default Profile;
