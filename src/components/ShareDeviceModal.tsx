'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { inputClass } from '@/components/TextInput';
import Modal from '@/components/Modal';
import { SensorShare, SharePermission } from '@/services/sensorService';

interface ShareDeviceModalProps {
    deviceLabel: string;
    deviceName: string;
    deviceId: number;
    listShares: (id: number) => Promise<SensorShare[]>;
    share: (id: number, email: string, permission: SharePermission) => Promise<unknown>;
    revokeShare: (id: number, userId: string) => Promise<unknown>;
    onClose: () => void;
}

const ShareDeviceModal: React.FC<ShareDeviceModalProps> = ({
    deviceLabel, deviceName, deviceId, listShares, share, revokeShare, onClose,
}) => {
    const [shares, setShares] = useState<SensorShare[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<SharePermission>('read');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setShares(await listShares(deviceId));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load shares');
        } finally {
            setLoading(false);
        }
    }, [deviceId, listShares]);

    useEffect(() => { load(); }, [load]);

    const handleShare = async () => {
        const trimmed = email.trim();
        if (!trimmed.includes('@')) { setError('Enter a valid email address.'); return; }
        setSubmitting(true);
        setError(null);
        try {
            await share(deviceId, trimmed, permission);
            setEmail('');
            toast.success(`Shared with ${trimmed}`);
            await load();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to share';
            setError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (userId: string, who: string) => {
        setRevokingId(userId);
        try {
            await revokeShare(deviceId, userId);
            toast.success(`Stopped sharing with ${who}`);
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to revoke');
        } finally {
            setRevokingId(null);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            closable={!submitting}
            labelledBy="share-modal-title"
            containerClassName="fixed inset-0 z-[200] flex items-center justify-center px-4"
            withBackdropElement
            backdropClassName="absolute inset-0 bg-black/60 backdrop-blur-sm"
            panelClassName="relative bg-gray-800 border border-gray-700/60 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <h3 id="share-modal-title" className="text-sm font-semibold text-gray-100">Share {deviceName}</h3>
                        <p className="text-xs text-gray-400">Share this {deviceLabel} with another Garge user by their account email.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all" aria-label="Close">
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-col gap-2 mb-2">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !submitting && handleShare()}
                        placeholder="person@example.com"
                        className={inputClass}
                        disabled={submitting}
                    />
                    <div className="flex gap-2">
                        <select
                            value={permission}
                            onChange={e => setPermission(e.target.value as SharePermission)}
                            disabled={submitting}
                            className="flex-1 bg-gray-900/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60"
                        >
                            <option value="read">Read — view data only</option>
                            <option value="edit">Edit — also control & automate</option>
                        </select>
                        <button
                            onClick={handleShare}
                            disabled={submitting}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all whitespace-nowrap"
                        >
                            <UserPlusIcon className="h-4 w-4" />
                            {submitting ? 'Sharing…' : 'Share'}
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-400">{error}</p>}
                </div>

                <div className="mt-4 border-t border-gray-700/40 pt-3">
                    <p className="text-xs font-medium text-gray-400 mb-2">Shared with</p>
                    {loading ? (
                        <p className="text-xs text-gray-500">Loading…</p>
                    ) : shares.length === 0 ? (
                        <p className="text-xs text-gray-500">Not shared with anyone yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {shares.map(s => {
                                const who = `${s.firstName} ${s.lastName}`.trim() || s.email;
                                return (
                                    <li key={s.userId} className="flex items-center justify-between gap-2 bg-gray-900/40 border border-gray-700/30 rounded-xl px-3 py-2">
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-200 truncate">{who}</p>
                                            <p className="text-xs text-gray-500 truncate">{s.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${s.permission === 'edit' ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-gray-600/20 text-gray-300 border-gray-600/40'}`}>
                                                {s.permission === 'edit' ? 'Edit' : 'Read'}
                                            </span>
                                            <button
                                                onClick={() => handleRevoke(s.userId, who)}
                                                disabled={revokingId === s.userId}
                                                className="p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-700/60 transition-all disabled:opacity-50"
                                                aria-label={`Stop sharing with ${who}`}
                                                title="Stop sharing"
                                            >
                                                <XMarkIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
        </Modal>
    );
};

export default ShareDeviceModal;
