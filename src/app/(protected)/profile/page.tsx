"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import UserService from '@/services/userService';
import { UserDTO } from '@/dto/UserDTO';
import SensorService from '@/services/sensorService';
import SwitchService from '@/services/switchService';
import { ChevronRightIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { normalizeNoPhone } from '@/lib/phone';
import { isPushSupported, isPushSubscribed, subscribeToPush, unsubscribeFromPush, sendTestNotification } from '@/services/pushNotificationService';
import { useCanClaimDevice } from '@/hooks/useCanClaimDevice';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingDots from '@/components/LoadingDots';
import Section from '@/components/Section';
import CapacityMeter from '@/components/CapacityMeter';
import ToggleSwitch from '@/components/ToggleSwitch';
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
    const [retentionKeep, setRetentionKeep] = useState(true);
    const [retentionLoading, setRetentionLoading] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [offlineThreshold, setOfflineThreshold] = useState(4);
    const [thresholdSaving, setThresholdSaving] = useState(false);
    const [testNotifLoading, setTestNotifLoading] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [editingField, setEditingField] = useState<'name' | 'phone' | null>(null);
    const { canClaim, loading: eligibilityLoading, refresh: refreshEligibility, capacity, used, bypass } = useCanClaimDevice();

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        UserService.getUserProfile().then(u => {
            setUser(u);
            setPriceZone(u.priceZone ?? 'NO2');
            setOfflineThreshold(u.offlineAlertThresholdHours > 0 ? u.offlineAlertThresholdHours : 4);
            if (u.id) UserService.getDataRetention(u.id).then(r => setRetentionKeep(!r.optOut)).catch(() => { });
        }).catch(console.error).finally(() => setProfileLoading(false));
        if (isPushSupported()) {
            setPushPermission(Notification.permission);
            isPushSubscribed()
                .then(setPushEnabled)
                .catch(() => setPushEnabled(false));
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

    const startEditName = () => {
        if (!user) return;
        setEditFirstName(user.firstName ?? '');
        setEditLastName(user.lastName ?? '');
        setEditingField('name');
    };

    const startEditPhone = () => {
        if (!user) return;
        setEditPhone(user.phoneNumber ?? '');
        setEditingField('phone');
    };

    const cancelEdit = () => setEditingField(null);

    const handleSaveName = async () => {
        if (!user?.id) return;
        const first = editFirstName.trim();
        const last = editLastName.trim();
        if (!first || !last) {
            toast.error('First name and last name are required.');
            return;
        }
        setProfileSaving(true);
        try {
            await UserService.updateProfile(user.id, {
                firstName: first,
                lastName: last,
                phoneNumber: user.phoneNumber || undefined,
            });
            setUser(prev => prev ? { ...prev, firstName: first, lastName: last } : prev);
            setEditingField(null);
            toast.success('Name updated.');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update name.');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleSavePhone = async () => {
        if (!user?.id) return;
        const raw = editPhone.trim();
        const normalized = raw ? normalizeNoPhone(raw) : '';
        if (raw && normalized === null) {
            toast.error('Enter a valid phone number.');
            return;
        }
        setProfileSaving(true);
        try {
            await UserService.updateProfile(user.id, {
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: normalized || undefined,
            });
            setUser(prev => prev ? { ...prev, phoneNumber: normalized || '' } : prev);
            setEditingField(null);
            toast.success('Phone number updated.');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update phone number.');
        } finally {
            setProfileSaving(false);
        }
    };

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
                await UserService.updatePreferences(user.id, {
                    priceZone,
                    pushNotificationsEnabled: true,
                    offlineAlertThresholdHours: offlineThreshold,
                });
                setPushEnabled(true);
                setPushPermission(Notification.permission);
                toast.success('Offline alerts enabled on this device');
            } else {
                await unsubscribeFromPush();
                setPushEnabled(false);
                toast.success('Offline alerts disabled on this device');
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
            refreshEligibility();
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

    const handleToggleRetention = async () => {
        if (!user?.id || retentionLoading) return;
        const nextKeep = !retentionKeep;
        setRetentionLoading(true);
        try {
            await UserService.updateDataRetention(user.id, !nextKeep); // store opt-out = !keep
            setRetentionKeep(nextKeep);
            toast.success(nextKeep
                ? 'We\'ll keep your sensor history'
                : 'History will be deleted 6 months after your subscription ends');
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to update retention preference');
        } finally {
            setRetentionLoading(false);
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
                            <div className="py-2 border-b border-gray-700/40">
                                {editingField === 'name' ? (
                                    <div className="space-y-2">
                                        <span className="text-sm text-gray-400">Name</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={editFirstName}
                                                onChange={e => setEditFirstName(e.target.value)}
                                                placeholder="First name"
                                                className={inputClass}
                                                autoFocus
                                                disabled={profileSaving}
                                            />
                                            <input
                                                type="text"
                                                value={editLastName}
                                                onChange={e => setEditLastName(e.target.value)}
                                                placeholder="Last name"
                                                className={inputClass}
                                                disabled={profileSaving}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveName} disabled={profileSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all">
                                                <CheckIcon className="h-3.5 w-3.5" />
                                                {profileSaving ? 'Saving…' : 'Save'}
                                            </button>
                                            <button onClick={cancelEdit} disabled={profileSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-all">
                                                <XMarkIcon className="h-3.5 w-3.5" />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Name</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-100">{user.firstName} {user.lastName}</span>
                                            <button onClick={startEditName} aria-label="Edit name" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all">
                                                <PencilIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-700/40">
                                <span className="text-sm text-gray-400">Email</span>
                                <span className="text-sm text-gray-100">{user.email}</span>
                            </div>
                            <div className="py-2 border-b border-gray-700/40">
                                {editingField === 'phone' ? (
                                    <div className="space-y-2">
                                        <span className="text-sm text-gray-400">Phone</span>
                                        <input
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            value={editPhone}
                                            onChange={e => setEditPhone(e.target.value)}
                                            placeholder="91 23 45 67"
                                            className={inputClass}
                                            autoFocus
                                            disabled={profileSaving}
                                        />
                                        {editPhone.trim() && normalizeNoPhone(editPhone) === null && (
                                            <p className="text-[11px] text-red-400">Enter a valid phone number.</p>
                                        )}
                                        <div className="flex gap-2">
                                            <button onClick={handleSavePhone} disabled={profileSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all">
                                                <CheckIcon className="h-3.5 w-3.5" />
                                                {profileSaving ? 'Saving…' : 'Save'}
                                            </button>
                                            <button onClick={cancelEdit} disabled={profileSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-all">
                                                <XMarkIcon className="h-3.5 w-3.5" />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Phone</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-100">{user.phoneNumber || '—'}</span>
                                            <button onClick={startEditPhone} aria-label="Edit phone" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all">
                                                <PencilIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
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

                <Section title="Billing">
                    <Link
                        href="/profile/billing"
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-700/40 hover:border-gray-600/60 hover:bg-gray-800/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">💳</span>
                            <div>
                                <p className="text-sm font-medium text-gray-100">Subscription & orders</p>
                                <p className="text-xs text-gray-500">Manage plan and view purchase history</p>
                            </div>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </Link>
                </Section>

                <Section title="Devices">
                    <div className="space-y-4">
                        <CapacityMeter used={used} capacity={capacity} bypass={bypass} loading={eligibilityLoading} />
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
                            {!eligibilityLoading && !canClaim ? (
                                <Alert variant="warning">
                                    You need an active subscription to add more devices. Your existing ones keep working.{' '}
                                    <Link href="/shop" className="underline font-medium">See plans →</Link>
                                </Alert>
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={claimCode}
                                            onChange={e => setClaimCode(e.target.value.toUpperCase())}
                                            onKeyDown={e => e.key === 'Enter' && handleClaimDevice()}
                                            placeholder="e.g. A1B2C3D4E5"
                                            className={inputClass}
                                            disabled={claimLoading || eligibilityLoading}
                                        />
                                        <button
                                            onClick={handleClaimDevice}
                                            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap"
                                            disabled={claimLoading || eligibilityLoading}
                                        >
                                            {claimLoading ? 'Adding…' : 'Add device'}
                                        </button>
                                    </div>
                                    {claimMessage && (
                                        claimError
                                            ? <Alert variant="error" className="mt-3">{claimMessage}</Alert>
                                            : <Alert variant="success" className="mt-3">{claimMessage}</Alert>
                                    )}
                                </>
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
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-100 font-medium">Electricity price zone</p>
                            <p className="text-xs text-gray-500 mt-0.5">Used on the Electricity page. Norway price zones NO1–NO5.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-100 font-medium">Offline alerts on this device</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Receive a push notification here when a sensor stops reporting. Toggle is per-device — enable on each browser or installed app where you want alerts.</p>
                                </div>
                                <ToggleSwitch
                                    checked={pushEnabled}
                                    onChange={handleTogglePush}
                                    disabled={pushLoading || profileLoading}
                                    ariaLabel={pushEnabled ? 'Disable offline alerts on this device' : 'Enable offline alerts on this device'}
                                />
                            </div>
                            {pushEnabled && (
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-100 font-medium">Alert after</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Hours of no data before notifying (1–168).</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
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
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-100 font-medium">Test notification</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Send a test to confirm notifications are working.</p>
                                    </div>
                                    <button
                                        onClick={handleSendTestNotification}
                                        disabled={testNotifLoading}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap flex-shrink-0"
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
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-100 font-medium">Download your data</p>
                                <p className="text-xs text-gray-500 mt-0.5">Export your account and device data as JSON (GDPR Article 20).</p>
                            </div>
                            <button
                                onClick={handleExportData}
                                disabled={!user?.id || exportLoading}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                            >
                                {exportLoading ? 'Exporting…' : 'Download'}
                            </button>
                        </div>
                        <div className="border-t border-gray-700/40 pt-4 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-100 font-medium">Keep my history after my subscription ends</p>
                                <p className="text-xs text-gray-500 mt-0.5">On (default): we keep your sensor history for as long as you own the device, so you can resume and compare year over year when you return. Off: once your subscription lapses, suspended devices are removed and their data deleted or anonymized after 6 months.</p>
                            </div>
                            <ToggleSwitch
                                checked={retentionKeep}
                                onChange={handleToggleRetention}
                                disabled={retentionLoading || profileLoading || !user?.id}
                                ariaLabel={retentionKeep ? 'Stop keeping history after subscription ends' : 'Keep history after subscription ends'}
                            />
                        </div>
                        <div className="border-t border-gray-700/40 pt-4 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-red-400 font-medium">Delete account</p>
                                <p className="text-xs text-gray-500 mt-0.5">Permanently deletes your account and personal data.</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteAccount(true)}
                                disabled={!user?.id || deleteAccountLoading}
                                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 text-sm font-medium rounded-xl transition-all whitespace-nowrap flex-shrink-0"
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