"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PencilIcon, CheckIcon, XMarkIcon, TrashIcon, ClipboardDocumentIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingDots from '@/components/LoadingDots';
import Section from '@/components/Section';
import { inputClass } from '@/components/TextInput';
import Alert from '@/components/Alert';
import { toast } from 'sonner';
import Link from 'next/link';
import { useCanClaimDevice } from '@/hooks/useCanClaimDevice';

export interface DeviceItem {
    id: number;
    customName?: string | null;
    type?: string;
    registrationCode?: string | null;
}

export interface DevicePageConfig<T extends DeviceItem> {
    title: string;
    itemLabel: string;
    emoji: string;
    fetchAll: () => Promise<T[]>;
    claim: (code: string) => Promise<unknown>;
    unclaim: (id: number) => Promise<unknown>;
    updateName: (id: number, name: string) => Promise<unknown>;
    getDisplayName: (item: T) => string;
    getDefaultName: (item: T) => string | undefined;
}

interface Props<T extends DeviceItem> {
    config: DevicePageConfig<T>;
}

export function DeviceManagePage<T extends DeviceItem>({ config }: Props<T>) {
    const { status } = useSession();
    const router = useRouter();
    const isAuthenticated = status === 'authenticated';

    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [claimCode, setClaimCode] = useState('');
    const [claimLoading, setClaimLoading] = useState(false);
    const [claimMessage, setClaimMessage] = useState<string | null>(null);
    const [claimError, setClaimError] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const { canClaim, loading: eligibilityLoading, refresh: refreshEligibility } = useCanClaimDevice();

    const { title, itemLabel, emoji, fetchAll, claim, unclaim, updateName, getDisplayName, getDefaultName } = config;
    const label = itemLabel;
    const Label = label.charAt(0).toUpperCase() + label.slice(1);

    const refresh = async () => {
        const all = await fetchAll();
        setItems([...all].sort((a, b) => getDisplayName(a).toLowerCase().localeCompare(getDisplayName(b).toLowerCase())));
    };

    useEffect(() => {
        if (!isAuthenticated) { router.push('/login'); return; }
        setLoading(true);
        refresh().catch(console.error).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, router]);

    const handleClaim = async () => {
        if (!claimCode.trim()) { setClaimMessage('Please enter a device code.'); setClaimError(true); return; }
        setClaimLoading(true);
        setClaimMessage(null);
        setClaimError(false);
        try {
            await claim(claimCode.trim());
            setClaimMessage(`${Label} added successfully!`);
            setClaimError(false);
            setClaimCode('');
            toast.success(`${Label} added`);
            await Promise.all([refresh(), refreshEligibility()]);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : `Failed to add ${label}.`;
            setClaimMessage(msg);
            setClaimError(true);
            toast.error(msg);
        } finally {
            setClaimLoading(false);
        }
    };

    const handleUnclaim = async () => {
        if (confirmDeleteId === null) return;
        await unclaim(confirmDeleteId);
        setConfirmDeleteId(null);
        await refresh();
        toast.success(`${Label} removed`);
    };

    const startEditing = (item: T) => {
        setEditingId(item.id);
        setEditName(getDisplayName(item));
        setEditError(null);
    };

    const cancelEditing = () => { setEditingId(null); setEditName(''); setEditError(null); };

    const handleSaveName = async (id: number) => {
        if (!editName.trim() || editName.length > 50) {
            setEditError('Name is required and must be at most 50 characters.');
            return;
        }
        setEditLoading(true);
        setEditError(null);
        try {
            await updateName(id, editName.trim());
            await refresh();
            setEditingId(null);
            setEditName('');
            toast.success(`${Label} renamed`);
        } catch (error: unknown) {
            setEditError(error instanceof Error ? error.message : `Failed to update ${label} name.`);
        } finally {
            setEditLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => toast.success('Copied')).catch(() => toast.error('Failed to copy'));
    };

    const confirmItem = items.find(i => i.id === confirmDeleteId);

    return (
        <>
            {confirmDeleteId !== null && confirmItem && (
                <ConfirmModal
                    title={`Remove ${label}`}
                    message={<>Are you sure you want to remove <span className="font-medium text-gray-100">{getDisplayName(confirmItem)}</span> from your account? You can re-add it later using the device code.</>}
                    confirmLabel="Remove"
                    onConfirm={handleUnclaim}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
                <div className="flex items-center gap-3">
                    <Link href="/profile" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all">
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Link>
                    <h1 className="text-2xl font-display font-bold text-gray-100">{title}</h1>
                </div>

                <Section title={`Add a ${label}`}>
                    {!eligibilityLoading && !canClaim ? (
                        <Alert variant="warning">
                            You need an active subscription to add more devices. Your existing ones keep working.{' '}
                            <Link href="/shop" className="underline font-medium">See plans →</Link>
                        </Alert>
                    ) : (
                        <>
                            <p className="text-sm text-gray-400 mb-3">Enter the device code to add a {label} to your account.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={claimCode}
                                    onChange={e => setClaimCode(e.target.value.toUpperCase())}
                                    onKeyDown={e => e.key === 'Enter' && handleClaim()}
                                    placeholder="e.g. A1B2C3D4E5"
                                    className={inputClass}
                                    disabled={claimLoading || eligibilityLoading}
                                />
                                <button
                                    onClick={handleClaim}
                                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap"
                                    disabled={claimLoading || eligibilityLoading}
                                >
                                    {claimLoading ? 'Adding…' : `Add ${label}`}
                                </button>
                            </div>
                            {claimMessage && (
                                claimError
                                    ? <Alert variant="error" className="mt-3">{claimMessage}</Alert>
                                    : <Alert variant="success" className="mt-3">{claimMessage}</Alert>
                            )}
                        </>
                    )}
                </Section>

                <Section title={`Your ${title.toLowerCase()}`}>
                    {loading ? <LoadingDots /> : !items.length ? (
                        <p className="text-sm text-gray-500">No {title.toLowerCase()} yet. Add one above.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {items.map(item => {
                                const displayName = getDisplayName(item);
                                const defaultName = getDefaultName(item);
                                return (
                                    <div key={item.id} className="bg-gray-900/50 border border-gray-700/40 rounded-xl p-4">
                                        {editingId === item.id ? (
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        className={inputClass}
                                                        maxLength={50}
                                                        disabled={editLoading}
                                                        autoFocus
                                                    />
                                                    <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tabular-nums pointer-events-none ${editName.length >= 45 ? 'text-amber-400' : 'text-gray-600'}`}>{editName.length}/50</span>
                                                </div>
                                                {editError && <p className="text-xs text-red-400">{editError}</p>}
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleSaveName(item.id)} disabled={editLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all">
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
                                                    <span className="text-sm font-semibold text-gray-100 leading-tight">{displayName}</span>
                                                    <button onClick={() => startEditing(item)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all flex-shrink-0" title="Rename">
                                                        <PencilIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="space-y-0.5 mb-4">
                                                    {item.type && <p className="text-xs text-gray-400">Type: {item.type}</p>}
                                                    {item.registrationCode && (
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-xs text-gray-500">Device code: <span className="font-mono">{item.registrationCode}</span></p>
                                                            <button
                                                                onClick={() => copyToClipboard(item.registrationCode!)}
                                                                aria-label="Copy device code"
                                                                className="p-0.5 rounded text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
                                                            >
                                                                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {item.customName && defaultName && <p className="text-xs text-gray-500">Default: {defaultName}</p>}
                                                </div>
                                                <button
                                                    onClick={() => setConfirmDeleteId(item.id)}
                                                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors"
                                                    title="Remove from account"
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                    Remove from account
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Section>
            </div>
        </>
    );
}
