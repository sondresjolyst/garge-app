'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, PlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import LoadingDots from '@/components/LoadingDots';
import ConfirmModal from '@/components/ConfirmModal';
import SensorActivityService, { SensorActivity } from '@/services/sensorActivityService';
import { formatDateTime } from '@/lib/dateUtils';

interface ActivitiesSectionProps {
    sensorId: number;
}

const toDateTimeLocal = (iso?: string | null): string => {
    const d = iso ? new Date(iso) : new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatOdometer = (km: number): string => {
    return km.toLocaleString('nb-NO') + ' km';
};

const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({ sensorId }) => {
    const [activities, setActivities] = useState<SensorActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [odometerKm, setOdometerKm] = useState<string>('');
    const [activityDate, setActivityDate] = useState<string>(toDateTimeLocal());
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showMore, setShowMore] = useState(false);

    // Delete-confirmation state: stores the activity the user clicked the trash icon on,
    // or null when the modal is closed.
    const [deleteTarget, setDeleteTarget] = useState<SensorActivity | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const list = await SensorActivityService.list(sensorId);
            setActivities(list);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Failed to load activities');
        } finally {
            setLoading(false);
        }
    }, [sensorId]);

    useEffect(() => {
        load();
    }, [load]);

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setNotes('');
        setOdometerKm('');
        setActivityDate(toDateTimeLocal());
        setSubmitError(null);
        setShowMore(false);
    };

    const startNew = () => {
        resetForm();
        setShowForm(true);
    };

    const startEdit = (a: SensorActivity) => {
        setEditingId(a.id);
        setTitle(a.title);
        setNotes(a.notes ?? '');
        setOdometerKm(a.odometerKm != null ? String(a.odometerKm) : '');
        setActivityDate(toDateTimeLocal(a.activityDate));
        setSubmitError(null);
        // Auto-expand "More details" if odometer was set
        setShowMore(a.odometerKm != null);
        setShowForm(true);
    };

    const cancel = () => {
        resetForm();
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setSubmitError('Title is required');
            return;
        }

        const parsedOdometer = odometerKm.trim() ? parseInt(odometerKm.trim(), 10) : null;
        if (odometerKm.trim() && (parsedOdometer === null || isNaN(parsedOdometer) || parsedOdometer < 0)) {
            setSubmitError('Odometer must be a positive number');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                title: title.trim(),
                notes: notes.trim() || null,
                odometerKm: parsedOdometer,
                activityDate: activityDate ? new Date(activityDate).toISOString() : null,
            };

            if (editingId != null) {
                await SensorActivityService.update(sensorId, editingId, payload);
            } else {
                await SensorActivityService.create(sensorId, payload);
            }

            await load();
            resetForm();
            setShowForm(false);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to save activity');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget.id;
        try {
            await SensorActivityService.remove(sensorId, id);
            setDeleteTarget(null);
            await load();
            if (editingId === id) {
                resetForm();
                setShowForm(false);
            }
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Failed to delete activity');
            // Close the modal even on error so the user sees the inline error message.
            setDeleteTarget(null);
        }
    };

    // Find the latest odometer reading across all activities
    const latestOdometer = activities.find(a => a.odometerKm != null)?.odometerKm;

    return (
        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-300">Activities</h3>
                    {latestOdometer != null && (
                        <p className="text-xs text-gray-500 mt-0.5">
                            Last odometer: {formatOdometer(latestOdometer)}
                        </p>
                    )}
                </div>
                {!showForm && (
                    <button
                        type="button"
                        onClick={startNew}
                        className="flex items-center gap-1.5 pl-3 pr-3.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-600/30 rounded-xl text-xs text-sky-300 hover:text-sky-200 transition-all"
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-2.5 pt-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title (e.g. Oil change, washing, new tires)"
                        maxLength={100}
                        autoFocus
                        className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg px-2.5 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60"
                    />
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Notes (optional)"
                        className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg px-2.5 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60 resize-none"
                    />
                    <input
                        type="datetime-local"
                        value={activityDate}
                        onChange={(e) => setActivityDate(e.target.value)}
                        className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg px-2.5 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-sky-500/60"
                    />

                    {/* Expandable "More details" section */}
                    <button
                        type="button"
                        onClick={() => setShowMore(o => !o)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors pt-0.5"
                    >
                        <ChevronRightIcon
                            className={`h-3 w-3 transition-transform duration-200 ${showMore ? 'rotate-90' : ''}`}
                        />
                        More details
                    </button>

                    {showMore && (
                        <div className="space-y-2 pl-0.5">
                            <div className="relative">
                                <input
                                    type="number"
                                    value={odometerKm}
                                    onChange={(e) => setOdometerKm(e.target.value)}
                                    placeholder="Odometer reading"
                                    min={0}
                                    className="w-full bg-gray-900/60 border border-gray-700/60 rounded-lg px-2.5 py-1.5 pr-10 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-600 pointer-events-none">
                                    km
                                </span>
                            </div>
                        </div>
                    )}

                    {submitError && <p className="text-xs text-red-400">{submitError}</p>}

                    <div className="flex gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                        >
                            <CheckIcon className="h-3.5 w-3.5" />
                            {submitting ? 'Saving...' : editingId != null ? 'Update' : 'Add'}
                        </button>
                        <button
                            type="button"
                            onClick={cancel}
                            disabled={submitting}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700/60 hover:bg-gray-700 text-gray-200 text-sm rounded-lg transition-colors"
                        >
                            <XMarkIcon className="h-3.5 w-3.5" />
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {loading && <LoadingDots />}
            {loadError && <p className="text-xs text-red-400">{loadError}</p>}

            {!loading && !loadError && activities.length === 0 && !showForm && (
                <p className="text-xs text-gray-500">No activities logged yet.</p>
            )}

            {!loading && activities.length > 0 && (
                <ul className="space-y-2 pt-1">
                    {activities.map((a) => (
                        <li key={a.id} className="bg-gray-900/40 border border-gray-700/30 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                <p className="text-xs text-gray-500 tabular-nums leading-tight">
                                    {formatDateTime(a.activityDate)}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => startEdit(a)}
                                    className="-mt-1 -mr-1 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 transition-all flex-shrink-0"
                                    title="Edit"
                                >
                                    <PencilIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <p className="text-sm font-semibold text-gray-100 leading-tight">
                                {a.title}
                            </p>
                            {a.odometerKm != null && (
                                <p className="mt-1.5 text-xs text-gray-400 tabular-nums">
                                    {formatOdometer(a.odometerKm)}
                                </p>
                            )}
                            {a.notes && (
                                <p className="mt-2 text-xs text-gray-300 whitespace-pre-wrap break-words">
                                    {a.notes}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(a)}
                                className="mt-4 flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors"
                                title="Delete activity"
                            >
                                <TrashIcon className="h-3.5 w-3.5" />
                                Delete activity
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {deleteTarget && (
                <ConfirmModal
                    title="Delete activity"
                    message={<>Are you sure you want to delete <span className="font-medium text-gray-100">{deleteTarget.title}</span>?</>}
                    confirmLabel="Delete"
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
};

export default ActivitiesSection;
