"use client";

import React, { useEffect, useState } from 'react';
import SwitchService, { Switch } from '@/services/switchService';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const stateIcon = (state: string) => {
    switch (state) {
        case 'ON':
            return <PlusCircleIcon className="h-8 w-8 fill-green-400" title="On" />;
        case 'OFF':
            return <PlusCircleIcon className="h-8 w-8 fill-red-400" title="Off" />;
        default:
            return <PlusCircleIcon className="h-8 w-8 fill-zinc-400" title="Unknown" />;
    }
};

const SocketsPage: React.FC = () => {
    const [switches, setSwitches] = useState<Switch[]>([]);
    const [lastStates, setLastStates] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSwitchesAndLastStates = async () => {
            try {
                const allSwitches = await SwitchService.getAllSwitches();
                setSwitches(allSwitches);

                if (allSwitches.length > 0) {
                    // Fetch each switch's state in parallel
                    const stateResults = await Promise.all(
                        allSwitches.map(async (sw) => {
                            try {
                                const result = await SwitchService.getSwitchState(sw.id);
                                let state: string = 'UNKNOWN';

                                if (typeof result === 'string') {
                                    state = result;
                                } else if (Array.isArray(result) && result.length > 0) {
                                    // Get the latest entry by timestamp
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
                    // Convert array to object: { [id]: state }
                    const states: Record<number, string> = {};
                    stateResults.forEach(({ id, state }) => {
                        states[id] = state;
                    });
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

    if (loading) {
        return <p>Sockets loading...</p>;
    }

    if (switches.length === 0) {
        return (
            <div className="mt-8 text-center text-gray-400">
                <p>No sockets assigned yet.</p>
                <p>Please contact your administrator to get access to sockets.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {switches.map((sw) => (
                    <div key={sw.id} className="bg-gray-800 text-gray-200 shadow-md rounded-lg overflow-hidden flex items-center p-4">
                        <div className="flex-1">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{sw.name}</h3>
                            <span className="block text-sm text-gray-400">Status: {lastStates[sw.id]}</span>
                        </div>
                        <div>
                            {stateIcon(lastStates[sw.id] || 'UNKNOWN')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SocketsPage;
