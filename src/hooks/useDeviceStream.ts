'use client';

import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { getSession } from 'next-auth/react';

export interface SwitchEvent {
    id: number;
    switchId: number;
    value: string;
    timestamp: string;
}

export interface SensorEvent {
    id: number;
    sensorId: number;
    value: string;
    timestamp: string;
}

interface Handlers {
    onSwitch?: (e: SwitchEvent) => void;
    onSensor?: (e: SensorEvent) => void;
}

export function useDeviceStream({ onSwitch, onSensor }: Handlers): void {
    const handlersRef = useRef<Handlers>({ onSwitch, onSensor });
    handlersRef.current = { onSwitch, onSensor };

    useEffect(() => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) return;

        let cancelled = false;
        let connection: HubConnection | null = null;

        (async () => {
            const hubUrl = `${apiBase.replace(/\/$/, '')}/hubs/devices`;

            connection = new HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: async () => {
                        const session = await getSession();
                        return session?.accessToken ?? '';
                    },
                })
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Warning)
                .build();

            connection.on('switch', (payload: SwitchEvent) => {
                handlersRef.current.onSwitch?.(payload);
            });
            connection.on('sensor', (payload: SensorEvent) => {
                handlersRef.current.onSensor?.(payload);
            });

            try {
                await connection.start();
                if (cancelled) {
                    await connection.stop();
                }
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('useDeviceStream connect failed:', err);
                }
            }
        })();

        return () => {
            cancelled = true;
            connection?.stop().catch(() => { });
        };
    }, []);
}
