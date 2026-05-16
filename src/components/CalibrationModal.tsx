'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useEscapeKey } from '@/lib/useEscapeKey';
import SensorService from '@/services/sensorService';

export interface CalibrationModalProps {
    sensorName: string;
    currentSensorReading: number;
    existingOffset: number | null;
    onClose: () => void;
    onSaved: () => void;
}

export default function CalibrationModal({
    sensorName,
    currentSensorReading,
    existingOffset,
    onClose,
    onSaved,
}: CalibrationModalProps) {
    const [value, setValue] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    useEscapeKey(!submitting, onClose);

    const parsed = parseFloat(value);
    const valid = !Number.isNaN(parsed) && parsed > 0 && parsed < 100;

    async function handleSave() {
        if (!valid || submitting) return;
        setSubmitting(true);
        try {
            await SensorService.calibrateBattery(sensorName, parsed);
            toast.success('Calibration saved');
            onSaved();
        } catch {
            toast.error('Failed to save calibration');
            setSubmitting(false);
        }
    }

    async function handleClear() {
        setSubmitting(true);
        try {
            await SensorService.clearCalibration(sensorName);
            toast.success('Calibration cleared');
            onSaved();
        } catch {
            toast.error('Failed to clear calibration');
            setSubmitting(false);
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <div className="absolute inset-0" aria-hidden onClick={() => { if (!submitting) onClose(); }} />
            <div className="relative bg-gray-900 border border-gray-700/60 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
                <div>
                    <p id="cal-title" className="text-sm font-semibold text-gray-100">Calibrate voltage</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Sensor reads <span className="text-gray-300 tabular-nums">{currentSensorReading.toFixed(2)}V</span> right now.
                        Measure the battery with a multimeter and enter the actual voltage below.
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                        Multimeter reading (V)
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        max="30"
                        autoFocus
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                        disabled={submitting}
                        placeholder="12.45"
                        className="w-full bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-sky-500/60 transition-colors disabled:opacity-50"
                    />
                </div>

                {existingOffset !== null && (
                    <p className="text-[11px] text-gray-500">
                        Current offset: <span className="text-gray-300 tabular-nums">{existingOffset.toFixed(2)}V</span>
                    </p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!valid || submitting}
                        className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {submitting ? 'Saving…' : 'Save'}
                    </button>
                    {existingOffset !== null && (
                        <button
                            onClick={handleClear}
                            disabled={submitting}
                            className="px-4 py-2 bg-gray-700/60 hover:bg-red-900/40 hover:border-red-700/50 border border-gray-600/40 text-gray-400 hover:text-red-400 text-sm rounded-lg transition-all disabled:opacity-50"
                        >
                            Remove
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-700/60 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
