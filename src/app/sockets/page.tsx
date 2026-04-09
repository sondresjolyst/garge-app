"use client";

import React, { useEffect, useState } from 'react';
import SwitchService, { Switch } from '@/services/switchService';

const STATE_STYLES: Record<string, { dot: string; label: string; ring: string; bg: string }> = {
    ON:      { dot: 'bg-green-400', label: 'On',      ring: 'shadow-[0_0_10px_3px_rgba(74,222,128,0.35)]', bg: 'bg-green-500/10' },
    OFF:     { dot: 'bg-red-500',   label: 'Off',     ring: '',                                              bg: 'bg-red-500/10'   },
    UNKNOWN: { dot: 'bg-gray-500',  label: 'Unknown', ring: '',                                              bg: 'bg-gray-700/40'  },
};

const LoadingDots = () => (
    <div className="h-64 flex items-center justify-center">
        <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:300ms]" />
        </div>
    </div>
);

const SocketsPage: React.FC = () => {
    const [switches, setSwitches] = useState<Switch[]>([]);
    const [lastStates, setLastStates] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSwitchesAndLastStates = async () => {
            try {
                const allSwitches = await SwitchService.getAllSwitches();
                allSwitches.sort((a, b) =>
                    (a.name ?? '').toLowerCase().localeCompare((b.name ?? '').toLowerCase())
                );
                setSwitches(allSwitches);

                if (allSwitches.length > 0) {
                    const stateResults = await Promise.all(
                        allSwitches.map(async (sw) => {
                            try {
                                const result = await SwitchService.getSwitchState(sw.id);
                                let state = 'UNKNOWN';
                                if (typeof result === 'string') {
                                    state = result;
                                } else if (Array.isArray(result) && result.length > 0) {
                                    const latest = result.reduce((a, b) =>
                                        new Date(a.timestamp).getTime() > new Date(b.timestamp).getTime() ? a : b
                                    );
                                    state = (latest.value || '').trim().toUpperCase() || 'UNKNOWN';
                                }
                                return { id: sw.id, state };
                            } catch {
                                return { id: sw.id, state: 'UNKNOWN' };
                            }
                        })
                    );
                    const states: Record<number, string> = {};
                    stateResults.forEach(({ id, state }) => { states[id] = state; });
                    setLastStates(states);
                }
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch switches or their last states:', error);
                setLoading(false);
            }
        };

        fetchSwitchesAndLastStates();
    }, []);

    if (loading) return <LoadingDots />;

    if (switches.length === 0) {
        return (
            <div className="mt-12 text-center text-gray-400 space-y-2">
                <p>No sockets assigned yet.</p>
                <p>Please contact your administrator to get access to sockets.</p>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Sockets</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {switches.map((sw) => {
                    const state = lastStates[sw.id] || 'UNKNOWN';
                    const { dot, label, ring, bg } = STATE_STYLES[state] ?? STATE_STYLES.UNKNOWN;
                    return (
                        <div
                            key={sw.id}
                            className="bg-gray-800/60 border border-gray-700/40 rounded-2xl backdrop-blur-sm shadow-lg p-5 flex items-center gap-4"
                        >
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
                                <span className={`w-4 h-4 rounded-full ${dot} ${ring}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-100 truncate">{sw.name}</h3>
                                <span className={`text-sm font-medium ${
                                    state === 'ON' ? 'text-green-400' : state === 'OFF' ? 'text-red-400' : 'text-gray-500'
                                }`}>{label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SocketsPage;

