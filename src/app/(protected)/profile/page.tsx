"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import UserService from '@/services/userService';
import { UserDTO } from '@/dto/UserDTO';
import SensorService from '@/services/sensorService';
import SwitchService from '@/services/switchService';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { isPushSupported, isPushSubscribed, subscribeToPush, unsubscribeFromPush, sendTestNotification } from '@/services/pushNotificationService';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingDots from '@/components/LoadingDots';
import Section from '@/components/Section';
import { inputClass } from '@/components/TextInput';
import Alert from '@/components/Alert';
import { toast } from 'sonner';
import Link from 'next/link';

const Profile: React.FC = () => {
    const { status } = useSession();
    const router = useRouter();
    const isAuthenticated = status === 'authenticated';

    const [user, setUser] = useState<UserDTO | null>(null);
    const [priceZone, setPriceZone] = useState<string>('NO2');
    const [priceZoneSaving, setPriceZoneSaving] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [verificationCode, setVerificationCode] = useState('');
    const [sensorCount, setSensorCount] = useState<number | null>(null);
    const [socketCount, setSocketCount] = useState<number | null>(null);
    const [claimCode, setClaimCode] = useState('');
    const [claimType, setClaimType] = useState<'sensor' | 'socket'>('sensor');
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimMessage, setClaimMessage] = useState<string | null>(null);
    const [claimError, setClaimError] = useState(false);
    const [emailMessage, setEmailMessage] = useState<string | null>(null);
    const [emailError, setEmailError] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [offlineThreshold, setOfflineThreshold] = useState(4);
    const [thresholdSaving, setThresholdSaving] = useState(false);
    const [testNotifLoading, setTestNotifLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        UserService.getUserProfile().then(u => {
            setUser(u);
            setPriceZone(u.priceZone ?? 'NO2');
            setPushEnabled(u.pushNotificationsEnabled ?? false);
            setOfflineThreshold(u.offlineAlertThresholdHours > 0 ? u.offlineAlertThresholdHours : 4);
        }).catch(console.error).finally(() => setProfileLoading(false));
        if (isPushSupported()) {
            setPushPermission(Notification.permission);
            isPushSubscribed().then((subscribed: boolean) => setPushEnabled(prev => prev && subscribed)).catch(() => {});
        }
        SensorService.getAllSensors().then(s => setSensorCount(s.length)).catch(() => setSensorCount(0));
        SwitchService.getAllSwitches().then(s => setSocketCount(s.length)).catch(() => setSocketCount(0));
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

    const handlePriceZoneChange = async (zone: string) => {
        if (!user?.id) return;
        setPriceZone(zone);
        setPriceZoneSaving(true);
        try {
            await UserService.updatePreferences(user.id, { priceZone: zone });
        } catch { /* silent fail */ }
        finally { setPriceZoneSaving(false); }
    };

    const handleTogglePush = async () => {
        if (!user?.id || pushLoading) return;
        setPushLoading(true);
        try {
            if (!pushEnabled) {
                await subscribeToPush();
                await UserService.updatePreferences(user.id, { priceZone, pushNotificationsEnabled: true, offlineAlertThresholdHours: offlineThreshold });
                setPushEnabled(true);
                setPushPermission(Notification.permission);
                toast.success('Offline alerts enabled');
            } else {
                await unsubscribeFromPush();
                await UserService.updatePreferences(user.id, { priceZone });
                setPushEnabled(false);
                toast.success('Offline alerts disabled');
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update notification settings';
            toast.error(msg);
            setPushPermission(Notification.permission);
        } finally {
            setPushLoading(false);
        }
    };

    const handleSendTestNotification = async () => {
        setTestNotifLoading(true);
        try {
            await sendTestNotification();
            toast.success('Test notification sent');
        } catch {
            toast.error('Failed to send test notification');
        } finally {
            setTestNotifLoading(false);
        }
    };

    const handleThresholdChange = async (hours: number) => {
        if (!user?.id) return;
        const clamped = Math.min(168, Math.max(1, hours));
        setOfflineThreshold(clamped);
        setThresholdSaving(true);
        try {
            await UserService.updatePreferences(user.id, { priceZone, offlineAlertThresholdHours: clamped });
        } catch { /* silent */ }
        finally { setThresholdSaving(false); }
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

    const handleClaimDevice = async () => {
        if (!claimCode.trim()) { setClaimMessage('Please enter a device code.'); setClaimError(true); return; }
        setClaimLoading(true);
        setClaimMessage(null);
        setClaimError(false);
        try {
            if (claimType === 'sensor') {
                await SensorService.claimSensor(claimCode.trim());
                setClaimMessage('Sensor added successfully!');
                setSensorCount(c => (c ?? 0) + 1);
                toast.success('Sensor added');
            } else {
                await SwitchService.claimSwitch(claimCode.trim());
                setClaimMessage('Socket added successfully!');
                setSocketCount(c => (c ?? 0) + 1);
                toast.success('Socket added');
            }
            setClaimError(false);
            setClaimCode('');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : `Failed to add ${claimType}.`;
            setClaimMessage(msg);
            setClaimError(true);
            toast.error(msg);
        } finally {
            setClaimLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user?.id) return;
        setDeleteAccountLoading(true);
        try {
            await UserService.deleteAccount(user.id);
            await signOut({ callbackUrl: '/' });
        } catch {
            toast.error('Failed to delete account. Please try again.');
            setDeleteAccountLoading(false);
            setShowDeleteAccount(false);
        }
    };

    const handleExportData = async () => {
        if (!user?.id) return;
        setExportLoading(true);
        try {
            const data = await UserService.exportData(user.id);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'garge-my-data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Data downloaded');
        } catch {
            toast.error('Failed to export data. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    const isUserLoading = status === 'loading' || !user;

    return (
        <>
            {showDeleteAccount && (
                <ConfirmModal
                    title="Delete account"
                    message={<>This will permanently delete your account and all associated personal data. <span className="font-medium text-red-400">This cannot be undone.</span></>}
                    confirmLabel="Delete my account"
                    onConfirm={handleDeleteAccount}
                    onCancel={() => setShowDeleteAccount(false)}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
                <h1 className="text-2xl font-display font-bold text-gray-100">Profile</h1>

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

                <Section title="Devices">
                    <div className="space-y-4">
                        <div>
                            <div className="flex gap-2 p-1 bg-gray-800/60 rounded-xl mb-3">
                                <button
                                    type="button"
                                    onClick={() => { setClaimType('sensor'); setClaimCode(''); setClaimMessage(null); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${claimType === 'sensor' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                >
                                    🌡️ Sensor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setClaimType('socket'); setClaimCode(''); setClaimMessage(null); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${claimType === 'socket' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                                >
                                    🔌 Socket
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={claimCode}
                                    onChange={e => setClaimCode(e.target.value.toUpperCase())}
                                    onKeyDown={e => e.key === 'Enter' && handleClaimDevice()}
                                    placeholder="e.g. A1B2C3D4E5"
                                    className={inputClass}
                                    disabled={claimLoading}
                                />
                                <button
                                    onClick={handleClaimDevice}
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
                        </div>
                        <div className="border-t border-gray-700/40 pt-3 space-y-2">
                            <Link
                                href="/profile/sensors"
                                className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-700/40 hover:border-gray-600/60 hover:bg-gray-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">🌡️</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-100">Manage sensors</p>
                                        <p className="text-xs text-gray-500">
                                            {sensorCount === null ? 'Loading…' : `${sensorCount} sensor${sensorCount !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                            </Link>
                            <Link
                                href="/profile/sockets"
                                className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-700/40 hover:border-gray-600/60 hover:bg-gray-800/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">🔌</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-100">Manage sockets</p>
                                        <p className="text-xs text-gray-500">
                                            {socketCount === null ? 'Loading…' : `${socketCount} socket${socketCount !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                            </Link>
                        </div>
                    </div>
                </Section>

                <div id="settings">
                <Section title="Settings">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-100 font-medium">Electricity price zone</p>
                            <p className="text-xs text-gray-500 mt-0.5">Used on the Electricity page. Norway price zones NO1–NO5.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {profileLoading ? (
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <svg className="animate-spin h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                </div>
                            ) : (
                                <>
                                    <select
                                        value={priceZone}
                                        onChange={e => handlePriceZoneChange(e.target.value)}
                                        disabled={priceZoneSaving}
                                        className="bg-gray-900/70 border border-gray-700/60 rounded-xl text-gray-200 text-sm px-3 py-2 focus:outline-none focus:border-sky-500 transition-colors disabled:opacity-50"
                                    >
                                        {['NO1', 'NO2', 'NO3', 'NO4', 'NO5'].map(z => (
                                            <option key={z} value={z}>{z}</option>
                                        ))}
                                    </select>
                                    {priceZoneSaving && <span className="text-xs text-gray-500">Saving…</span>}
                                </>
                            )}
                        </div>
                    </div>
                </Section>
                </div>

                <Section title="Notifications">
                    {!isPushSupported() ? (
                        <p className="text-sm text-gray-500">Push notifications are not supported in this browser.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-100 font-medium">Offline alerts</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Notify when a sensor has not reported for a while. Requires the app to be installed.</p>
                                </div>
                                <button
                                    onClick={handleTogglePush}
                                    disabled={pushLoading || profileLoading}
                                    aria-label={pushEnabled ? 'Disable offline alerts' : 'Enable offline alerts'}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${pushEnabled ? 'bg-sky-600' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {pushEnabled && (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-100 font-medium">Alert after</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Hours of no data before notifying (1–168).</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={168}
                                            value={offlineThreshold}
                                            onChange={e => handleThresholdChange(Number(e.target.value))}
                                            className="w-20 bg-gray-900/70 border border-gray-700/60 rounded-xl text-gray-200 text-sm px-3 py-2 focus:outline-none focus:border-sky-500 transition-colors"
                                        />
                                        <span className="text-sm text-gray-500">h{thresholdSaving && <span className="ml-1 text-xs text-gray-600">saving…</span>}</span>
                                    </div>
                                </div>
                            )}
                            {pushEnabled && (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-100 font-medium">Test notification</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Send a test to confirm notifications are working.</p>
                                    </div>
                                    <button
                                        onClick={handleSendTestNotification}
                                        disabled={testNotifLoading}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap"
                                    >
                                        {testNotifLoading ? 'Sending…' : 'Send test'}
                                    </button>
                                </div>
                            )}
                            {pushPermission === 'denied' && (
                                <Alert variant="error">Notifications blocked in browser settings. Enable them to use offline alerts.</Alert>
                            )}
                        </div>
                    )}
                </Section>

                <Section title="Your data">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-100 font-medium">Download your data</p>
                                <p className="text-xs text-gray-500 mt-0.5">Export your account and device data as JSON (GDPR Article 20).</p>
                            </div>
                            <button
                                onClick={handleExportData}
                                disabled={!user?.id || exportLoading}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap"
                            >
                                {exportLoading ? 'Exporting…' : 'Download'}
                            </button>
                        </div>
                        <div className="border-t border-gray-700/40 pt-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-400 font-medium">Delete account</p>
                                <p className="text-xs text-gray-500 mt-0.5">Permanently deletes your account and personal data.</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteAccount(true)}
                                disabled={!user?.id || deleteAccountLoading}
                                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 text-sm font-medium rounded-xl transition-all whitespace-nowrap"
                            >
                                Delete account
                            </button>
                        </div>
                    </div>
                </Section>
            </div>
        </>
    );
};

export default Profile;