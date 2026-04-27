'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import LoadingDots from '@/components/LoadingDots';
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

const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({ sensorId }) => {
    const [activities, setActivities] = useState<SensorActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [activityDate, setActivityDate] = useState<string>(toDateTimeLocal());
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

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
        setActivityDate(toDateTimeLocal());
        setSubmitError(null);
    };

    const startNew = () => {
        resetForm();
        setShowForm(true);
    };

    const startEdit = (a: SensorActivity) => {
        setEditingId(a.id);
        setTitle(a.title);
        setNotes(a.notes ?? '');
        setActivityDate(toDateTimeLocal(a.activityDate));
        setSubmitError(null);
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

        setSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                title: title.trim(),
                notes: notes.trim() || null,
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

    const handleDelete = async (id: number) => {
        const ok = typeof window !== 'undefined' ? window.confirm('Delete this activity?') : true;
        if (!ok) return;
        try {
            await SensorActivityService.remove(sensorId, id);
            await load();
            if (editingId === id) {
                resetForm();
                setShowForm(false);
            }
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Failed to delete activity');
        }
    };

    return (
        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">Activities</h3>
                {!showForm && (
                    <button
                        type="button"
                        onClick={startNew}
                        className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
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
                        placeholder="Title (e.g. Oil change, ride to the cabin)"
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
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-100 font-medium truncate">{a.title}</p>
                                    <p className="text-[11px] text-gray-500 tabular-nums mt-0.5">
                                        {formatDateTime(a.activityDate)}
                                    </p>
                                    {a.notes && (
                                        <p className="text-xs text-gray-300 mt-1.5 whitespace-pre-wrap break-words">
                                            {a.notes}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(a)}
                                        className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 transition-colors"
                                        aria-label="Edit activity"
                                    >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(a.id)}
                                        className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800/60 transition-colors"
                                        aria-label="Delete activity"
                                    >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ActivitiesSection;
