"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserService from '@/services/userService';
import { UserDTO } from '@/dto/UserDTO';
import SensorService, { Sensor } from '@/services/sensorService';
import { PencilIcon, CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingDots from '@/components/LoadingDots';
import Section from '@/components/Section';
import { inputClass } from '@/components/TextInput';
import Alert from '@/components/Alert';

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
    const [newCustomName, setNewCustomName] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [sensorsLoading, setSensorsLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    function sortSensorsByName(sensors: Sensor[]): Sensor[] {
        return [...sensors].sort((a, b) =>
            (a.customName ?? a.defaultName ?? '').toLowerCase()
                .localeCompare((b.customName ?? b.defaultName ?? '').toLowerCase())
        );
    }

    const refreshSensors = async () => {
        const userSensors = await SensorService.getAllSensors();
        setSensors(sortSensorsByName(userSensors));
    };

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        UserService.getUserProfile().then(setUser).catch(console.error);
        setSensorsLoading(true);
        refreshSensors().catch(console.error).finally(() => setSensorsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (countdown <= 0) { setIsButtonDisabled(false); return; }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResendConfirmation = async () => {
        if (!user) return;
        try {
            const response = await UserService.resendEmailConfirmation(user.email);
            setEmailMessage(response.message);
            setEmailError(false);
            setIsButtonDisabled(true);
            setCountdown(60);
        } catch {
            setEmailMessage('Failed to resend email confirmation');
            setEmailError(true);
        }
    };

    const handleConfirmEmail = async () => {
        if (!user) return;
        try {
            const response = await UserService.confirmEmail(user.email, verificationCode);
            setEmailMessage(response.message);
            setEmailError(false);
            setUser({ ...user, emailConfirmed: true });
        } catch {
            setEmailMessage('Failed to confirm email');
            setEmailError(true);
        }
    };

    const handleClaimSensor = async () => {
        if (!claimCode.trim()) { setClaimMessage('Please enter a registration code.'); setClaimError(true); return; }
        setClaimLoading(true);
        setClaimMessage(null);
        setClaimError(false);
        try {
            await SensorService.claimSensor(claimCode.trim());
            setClaimMessage('Sensor added successfully!');
            setClaimError(false);
            setClaimCode('');
            await updateSession();
            await refreshSensors();
        } catch (error: unknown) {
            setClaimMessage(error instanceof Error ? error.message : 'Failed to add sensor.');
            setClaimError(true);
        } finally {
            setClaimLoading(false);
        }
    };

    const handleUnclaimSensor = async () => {
        if (confirmDeleteId === null) return;
        await SensorService.unclaimSensor(confirmDeleteId);
        setConfirmDeleteId(null);
        await refreshSensors();
    };

    const startEditing = (sensor: Sensor) => {
        setEditingSensorId(sensor.id);
        setNewCustomName(sensor.customName ?? sensor.defaultName ?? '');
        setEditError(null);
    };

    const cancelEditing = () => { setEditingSensorId(null); setNewCustomName(''); setEditError(null); };

    const handleSaveCustomName = async (sensorId: number) => {
        if (!newCustomName.trim() || newCustomName.length > 50) {
            setEditError('Name is required and must be at most 50 characters.');
            return;
        }
        setEditLoading(true);
        setEditError(null);
        try {
            await SensorService.updateCustomName(sensorId, newCustomName.trim());
            await refreshSensors();
            setEditingSensorId(null);
            setNewCustomName('');
        } catch (error: unknown) {
            setEditError(error instanceof Error ? error.message : 'Failed to update sensor name.');
        } finally {
            setEditLoading(false);
        }
    };

    const confirmSensor = sensors.find(s => s.id === confirmDeleteId);
    const isUserLoading = status === 'loading' || !user;

    return (
        <>
            {confirmDeleteId !== null && confirmSensor && (
                <ConfirmModal
                    title="Remove sensor"
                    message={<>Are you sure you want to remove <span className="font-medium text-gray-100">{confirmSensor.customName ?? confirmSensor.defaultName}</span> from your account? You can re-add it later using the registration code.</>}
                    confirmLabel="Remove"
                    onConfirm={handleUnclaimSensor}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                <h1 className="text-2xl font-bold text-gray-100">Profile</h1>

                {/* Account Info */}
                <Section title="Account">
                    {isUserLoading ? <LoadingDots /> : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-700/40">
                                <span className="text-sm text-gray-400">Name</span>
                                <span className="text-sm text-gray-100">{user.firstName} {user.lastName}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-700/40">
                                <span className="text-sm text-gray-400">Email</span>
                                <span className="text-sm text-gray-100">{user.email}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-400">Email confirmed</span>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.emailConfirmed ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>
                                    {user.emailConfirmed ? 'Confirmed' : 'Pending'}
                                </span>
                            </div>

                            {!user.emailConfirmed && (
                                <div className="pt-2 space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={e => setVerificationCode(e.target.value)}
                                            placeholder="Verification code"
                                            className={inputClass}
                                        />
                                        <button onClick={handleConfirmEmail} className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap">
                                            Confirm
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleResendConfirmation}
                                            disabled={isButtonDisabled}
                                            className="text-sm text-sky-400 hover:text-sky-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Resend confirmation email
                                        </button>
                                        {isButtonDisabled && <span className="text-xs text-gray-500">{countdown}s</span>}
                                    </div>
                                </div>
                            )}

                            {emailMessage && (
                                emailError
                                    ? <Alert variant="error">{emailMessage}</Alert>
                                    : <Alert variant="success">{emailMessage}</Alert>
                            )}
                        </div>
                    )}
                </Section>

                {/* Claim Sensor */}
                <Section title="Add a device">
                    <p className="text-sm text-gray-400 mb-3">Enter the registration code found on your device to add it to your account.</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={claimCode}
                            onChange={e => setClaimCode(e.target.value)}
                            placeholder="Registration code"
                            className={inputClass}
                            disabled={claimLoading}
                        />
                        <button
                            onClick={handleClaimSensor}
                            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap"
                            disabled={claimLoading}
                        >
                            {claimLoading ? 'Adding…' : 'Add device'}
                        </button>
                    </div>
                    {claimMessage && (
                        claimError
                            ? <Alert variant="error" className="mt-3">{claimMessage}</Alert>
                            : <Alert variant="success" className="mt-3">{claimMessage}</Alert>
                    )}
                </Section>

                {/* Sensors */}
                <Section title="Your sensors">
                    {sensorsLoading ? <LoadingDots /> : !sensors.length ? (
                        <p className="text-sm text-gray-500">No sensors found. Add one above.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sensors.map(sensor => (
                                <div key={sensor.id} className="bg-gray-900/50 border border-gray-700/40 rounded-xl p-4">
                                    {editingSensorId === sensor.id ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={newCustomName}
                                                onChange={e => setNewCustomName(e.target.value)}
                                                className={inputClass}
                                                maxLength={50}
                                                disabled={editLoading}
                                                autoFocus
                                            />
                                            {editError && <p className="text-xs text-red-400">{editError}</p>}
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSaveCustomName(sensor.id)} disabled={editLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all">
                                                    <CheckIcon className="h-3.5 w-3.5" />
                                                    {editLoading ? 'Saving…' : 'Save'}
                                                </button>
                                                <button onClick={cancelEditing} disabled={editLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-all">
                                                    <XMarkIcon className="h-3.5 w-3.5" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <span className="text-sm font-semibold text-gray-100 leading-tight">
                                                    {sensor.customName ?? sensor.defaultName}
                                                </span>
                                                <button onClick={() => startEditing(sensor)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all flex-shrink-0" title="Rename">
                                                    <PencilIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <div className="space-y-0.5 mb-4">
                                                <p className="text-xs text-gray-400">Type: {sensor.type}</p>
                                                <p className="text-xs text-gray-500">Code: {sensor.registrationCode}</p>
                                                {sensor.customName && <p className="text-xs text-gray-500">Default: {sensor.defaultName}</p>}
                                            </div>
                                            <button
                                                onClick={() => setConfirmDeleteId(sensor.id)}
                                                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors"
                                                title="Remove from account"
                                            >
                                                <TrashIcon className="h-3.5 w-3.5" />
                                                Remove from account
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>
        </>
    );
};

export default Profile;
