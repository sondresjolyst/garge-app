"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserService from '@/services/userService';
import { UserDTO } from '@/dto/UserDTO';
import SensorService, { Sensor } from '@/services/sensorService';

const Profile: React.FC = () => {
    const { status } = useSession();
    const { update: updateSession } = useSession();
    const router = useRouter();
    const isAuthenticated = status === 'authenticated';
    const [user, setUser] = useState<UserDTO | null>(null);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [verificationCode, setVerificationCode] = useState('');
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [claimCode, setClaimCode] = useState('');
    const [claimLoading, setClaimLoading] = useState(false);
    const [emailMessage, setEmailMessage] = useState<string | null>(null);
    const [emailError, setEmailError] = useState(false);
    const [claimMessage, setClaimMessage] = useState<string | null>(null);
    const [claimError, setClaimError] = useState(false);
    const [editingSensorId, setEditingSensorId] = useState<number | null>(null);
    const [newCustomName, setNewCustomName] = useState<string>('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

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

            const fetchSensors = async () => {
                try {
                    const userSensors = await SensorService.getAllSensors();
                    setSensors(userSensors);
                } catch (error) {
                    console.error('Failed to fetch sensors:', error);
                }
            };
            fetchSensors();
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
                setEmailMessage(response.message);
                setEmailError(false);
                setIsButtonDisabled(true);
                setCountdown(60);
            } catch (error) {
                console.error('Failed to resend email confirmation:', error);
                setEmailMessage('Failed to resend email confirmation');
                setEmailError(true);
            }
        }
    };

    const handleConfirmEmail = async () => {
        if (user) {
            try {
                const response = await UserService.confirmEmail(user.email, verificationCode);
                setEmailMessage(response.message);
                setEmailError(false);
                setUser({ ...user, emailConfirmed: true });
            } catch (error) {
                console.error('Failed to confirm email:', error);
                setEmailMessage('Failed to confirm email');
                setEmailError(true);
            }
        }
    };

    const handleClaimSensor = async () => {
        if (!claimCode.trim()) {
            setClaimMessage('Please enter a registration code.');
            setClaimError(true);
            return;
        }
        setClaimLoading(true);
        setClaimMessage(null);
        setClaimError(false);
        try {
            await SensorService.claimSensor(claimCode.trim());
            setClaimMessage('Sensor claimed successfully!');
            setClaimError(false);
            setClaimCode('');
            await updateSession();
            // Refresh sensor list
            const userSensors = await SensorService.getAllSensors();
            setSensors(userSensors);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setClaimMessage(error.message || 'Failed to claim sensor.');
            } else {
                setClaimMessage('Failed to claim sensor.');
            }
            setClaimError(true);
        } finally {
            setClaimLoading(false);
        }
    };

    const startEditing = (sensor: Sensor) => {
        setEditingSensorId(sensor.id);
        setNewCustomName(sensor.customName ?? sensor.defaultName ?? '');
        setEditError(null);
    };

    const cancelEditing = () => {
        setEditingSensorId(null);
        setNewCustomName('');
        setEditError(null);
    };

    const handleSaveCustomName = async (sensorId: number) => {
        if (!newCustomName.trim() || newCustomName.length > 50) {
            setEditError('Custom name is required and must be at most 50 characters.');
            return;
        }
        setEditLoading(true);
        setEditError(null);
        try {
            await SensorService.updateCustomName(sensorId, newCustomName.trim());
            // Refresh sensor list
            const userSensors = await SensorService.getAllSensors();
            setSensors(userSensors);
            setEditingSensorId(null);
            setNewCustomName('');
        } catch (error: unknown) {
            if (error instanceof Error) {
                setEditError(error.message || 'Failed to update sensor name.');
            } else {
                setEditError('Failed to update sensor name.');
            }
        } finally {
            setEditLoading(false);
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
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="Enter verification code"
                            className="p-2 border border-gray-600 rounded bg-gray-700 text-gray-200"
                        />
                        <button
                            onClick={handleConfirmEmail}
                            className="gargeBtnActive"
                        >
                            Confirm Email
                        </button>
                    </div>
                    <button
                        onClick={handleResendConfirmation}
                        className={`mt-4 ${isButtonDisabled ? 'gargeBtnDisabled' : 'gargeBtnActive'}`}
                        disabled={isButtonDisabled}
                    >
                        Resend Confirmation
                    </button>
                    {isButtonDisabled && (
                        <span className="ml-2 text-gray-500">{countdown}s</span>
                    )}
                </>
            )}
            {emailMessage && (
                <p className={`mt-4 ${emailError ? 'text-red-500' : 'text-green-500'}`}>
                    {emailMessage}
                </p>
            )}

            <div className="mb-6 mt-4">
                <h2 className="text-lg font-semibold mb-2">Claim a New Sensor</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={claimCode}
                        onChange={e => setClaimCode(e.target.value)}
                        placeholder="Enter registration code"
                        className="p-2 border border-gray-600 rounded bg-gray-700 text-gray-200"
                        disabled={claimLoading}
                    />
                    <button
                        onClick={handleClaimSensor}
                        className="gargeBtnActive "
                        disabled={claimLoading}
                    >
                        {claimLoading ? 'Claiming...' : 'Claim Sensor'}
                    </button>
                </div>
                {claimMessage && (
                    <p className={`mt-4 ${claimError ? 'text-red-500' : 'text-green-500'}`}>
                        {claimMessage}
                    </p>
                )}
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-2">Your Sensors</h2>
            {!sensors.length ? (
                <p>No sensors found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sensors.map(sensor => (
                        <div
                            key={sensor.id}
                            className="bg-gray-800 rounded-lg shadow p-4 flex flex-col"
                        >
                            <span className="text-lg font-bold text-gray-100 mb-1">
                                {editingSensorId === sensor.id ? (
                                    <div className="flex flex-col xs:flex-row flex-wrap items-stretch gap-2 w-full">
                                        <input
                                            type="text"
                                            value={newCustomName}
                                            onChange={e => setNewCustomName(e.target.value)}
                                            className="p-1 border border-gray-600 rounded bg-gray-700 text-gray-200 flex-1 min-w-0"
                                            maxLength={50}
                                            disabled={editLoading}
                                        />
                                        <div className="flex flex-row gap-2">
                                            <button
                                                onClick={() => handleSaveCustomName(sensor.id)}
                                                className="gargeBtnActive gargeBtnSmall"
                                                disabled={editLoading}
                                            >
                                                {editLoading ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="gargeBtnWarning gargeBtnSmall"
                                                disabled={editLoading}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                        {editError && (
                                            <span className="text-red-500 text-xs w-full">{editError}</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {sensor.customName ?? sensor.defaultName}
                                        <button
                                            onClick={() => startEditing(sensor)}
                                                className="gargeBtnActive gargeBtnSmall"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </span>
                            <span className="text-gray-400 text-sm mb-2">
                                Type: {sensor.type}
                            </span>
                            <span className="text-gray-500 text-xs">
                                Registration Code: {sensor.registrationCode}
                            </span>
                            <span className="text-gray-500 text-xs">
                                Original Name: {sensor.defaultName}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Profile;

