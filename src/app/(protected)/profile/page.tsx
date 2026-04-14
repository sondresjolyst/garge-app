"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserService from '@/services/userService';
import { UserDTO } from '@/dto/UserDTO';
import SensorService, { Sensor } from '@/services/sensorService';
import SwitchService, { Switch } from '@/services/switchService';
import { PencilIcon, CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingDots from '@/components/LoadingDots';
import Section from '@/components/Section';
import { inputClass } from '@/components/TextInput';
import Alert from '@/components/Alert';
import { toast } from 'sonner';

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
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [claimCode, setClaimCode] = useState('');
    const [claimType, setClaimType] = useState<'sensor' | 'socket'>('sensor');
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

    const [switches, setSwitches] = useState<Switch[]>([]);
    const [switchesLoading, setSwitchesLoading] = useState(true);
    const [editingSwitchId, setEditingSwitchId] = useState<number | null>(null);
    const [newSwitchName, setNewSwitchName] = useState('');
    const [switchEditLoading, setSwitchEditLoading] = useState(false);
    const [switchEditError, setSwitchEditError] = useState<string | null>(null);
    const [confirmDeleteSwitchId, setConfirmDeleteSwitchId] = useState<number | null>(null);

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

    const refreshSwitches = async () => {
        const allSwitches = await SwitchService.getAllSwitches();
        setSwitches([...allSwitches].sort((a, b) =>
            (a.customName ?? a.name).toLowerCase().localeCompare((b.customName ?? b.name).toLowerCase())
        ));
    };

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        UserService.getUserProfile().then(u => { setUser(u); setPriceZone(u.priceZone ?? 'NO2'); }).catch(console.error).finally(() => setProfileLoading(false));
        setSensorsLoading(true);
        refreshSensors().catch(console.error).finally(() => setSensorsLoading(false));
        setSwitchesLoading(true);
        refreshSwitches().catch(console.error).finally(() => setSwitchesLoading(false));
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
            await UserService.updatePreferences(user.id, zone);
        } catch { /* silent fail — zone is still set locally */ }
        finally { setPriceZoneSaving(false); }
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
                toast.success('Sensor added');
                await refreshSensors();
            } else {
                await SwitchService.claimSwitch(claimCode.trim());
                setClaimMessage('Socket added successfully!');
                toast.success('Socket added');
                await refreshSwitches();
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

    const handleUnclaimSensor = async () => {
        if (confirmDeleteId === null) return;
        await SensorService.unclaimSensor(confirmDeleteId);
        setConfirmDeleteId(null);
        await refreshSensors();
        toast.success('Sensor removed');
    };

    const handleUnclaimSwitch = async () => {
        if (confirmDeleteSwitchId === null) return;
        await SwitchService.unclaimSwitch(confirmDeleteSwitchId);
        setConfirmDeleteSwitchId(null);
        await refreshSwitches();
        toast.success('Socket removed');
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
            toast.success('Sensor renamed');
        } catch (error: unknown) {
            setEditError(error instanceof Error ? error.message : 'Failed to update sensor name.');
        } finally {
            setEditLoading(false);
        }
    };

    const startEditingSwitch = (sw: Switch) => {
        setEditingSwitchId(sw.id);
        setNewSwitchName(sw.customName ?? sw.name);
        setSwitchEditError(null);
    };

    const cancelEditingSwitch = () => { setEditingSwitchId(null); setNewSwitchName(''); setSwitchEditError(null); };

    const handleSaveSwitchName = async (switchId: number) => {
        if (!newSwitchName.trim() || newSwitchName.length > 50) {
            setSwitchEditError('Name is required and must be at most 50 characters.');
            return;
        }
        setSwitchEditLoading(true);
        setSwitchEditError(null);
        try {
            await SwitchService.updateCustomName(switchId, newSwitchName.trim());
            await refreshSwitches();
            setEditingSwitchId(null);
            setNewSwitchName('');
            toast.success('Socket renamed');
        } catch (error: unknown) {
            setSwitchEditError(error instanceof Error ? error.message : 'Failed to update socket name.');
        } finally {
            setSwitchEditLoading(false);
        }
    };

    const confirmSensor = sensors.find(s => s.id === confirmDeleteId);
    const confirmSwitch = switches.find(sw => sw.id === confirmDeleteSwitchId);
    const isUserLoading = status === 'loading' || !user;

    return (
        <>
            {confirmDeleteId !== null && confirmSensor && (
                <ConfirmModal
                    title="Remove sensor"
                    message={<>Are you sure you want to remove <span className="font-medium text-gray-100">{confirmSensor.customName ?? confirmSensor.defaultName}</span> from your account? You can re-add it later using the device code.</>}
                    confirmLabel="Remove"
                    onConfirm={handleUnclaimSensor}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
            {confirmDeleteSwitchId !== null && confirmSwitch && (
                <ConfirmModal
                    title="Remove socket"
                    message={<>Are you sure you want to remove <span className="font-medium text-gray-100">{confirmSwitch.customName ?? confirmSwitch.name}</span> from your account? You can re-add it later using the device code.</>}
                    confirmLabel="Remove"
                    onConfirm={handleUnclaimSwitch}
                    onCancel={() => setConfirmDeleteSwitchId(null)}
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

                {/* Claim Device */}
                <Section title="Add a device">
                    <p className="text-sm text-gray-400 mb-3">Enter the device code to add a sensor or socket to your account.</p>

                    {/* Type toggle */}
                    <div className="flex gap-2 p-1 bg-gray-800/60 rounded-xl mb-3">
                        <button
                            type="button"
                            onClick={() => { setClaimType('sensor'); setClaimCode(''); setClaimMessage(null); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                claimType === 'sensor'
                                    ? 'bg-sky-600 text-white shadow'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            🌡️ Sensor
                        </button>
                        <button
                            type="button"
                            onClick={() => { setClaimType('socket'); setClaimCode(''); setClaimMessage(null); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                claimType === 'socket'
                                    ? 'bg-sky-600 text-white shadow'
                                    : 'text-gray-400 hover:text-gray-200'
                            }`}
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
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={newCustomName}
                                                    onChange={e => setNewCustomName(e.target.value)}
                                                    className={inputClass}
                                                    maxLength={50}
                                                    disabled={editLoading}
                                                    autoFocus
                                                />
                                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums pointer-events-none ${newCustomName.length >= 45 ? 'text-amber-400' : 'text-gray-600'}`}>{newCustomName.length}/50</span>
                                            </div>
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
                                        <p className="text-xs text-gray-500">Device code: {sensor.registrationCode}</p>
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

                {/* Sockets */}
                <Section title="Your sockets">
                    {switchesLoading ? <LoadingDots /> : !switches.length ? (
                        <p className="text-sm text-gray-500">No sockets found.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {switches.map(sw => (
                                <div key={sw.id} className="bg-gray-900/50 border border-gray-700/40 rounded-xl p-4">
                                    {editingSwitchId === sw.id ? (
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={newSwitchName}
                                                    onChange={e => setNewSwitchName(e.target.value)}
                                                    className={inputClass}
                                                    maxLength={50}
                                                    disabled={switchEditLoading}
                                                    autoFocus
                                                />
                                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums pointer-events-none ${newSwitchName.length >= 45 ? 'text-amber-400' : 'text-gray-600'}`}>{newSwitchName.length}/50</span>
                                            </div>
                                            {switchEditError && <p className="text-xs text-red-400">{switchEditError}</p>}
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSaveSwitchName(sw.id)} disabled={switchEditLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all">
                                                    <CheckIcon className="h-3.5 w-3.5" />
                                                    {switchEditLoading ? 'Saving…' : 'Save'}
                                                </button>
                                                <button onClick={cancelEditingSwitch} disabled={switchEditLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-all">
                                                    <XMarkIcon className="h-3.5 w-3.5" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <span className="text-sm font-semibold text-gray-100 leading-tight">
                                                    {sw.customName ?? sw.name}
                                                </span>
                                                <button onClick={() => startEditingSwitch(sw)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all flex-shrink-0" title="Rename">
                                                    <PencilIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <div className="space-y-0.5 mb-4">
                                                <p className="text-xs text-gray-400">Type: {sw.type}</p>
                                                {sw.registrationCode && <p className="text-xs text-gray-500">Device code: {sw.registrationCode}</p>}
                                                {sw.customName && <p className="text-xs text-gray-500">Default: {sw.name}</p>}
                                            </div>
                                            <button
                                                onClick={() => setConfirmDeleteSwitchId(sw.id)}
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

                {/* Settings */}
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
            </div>
        </>
    );
};

export default Profile;
