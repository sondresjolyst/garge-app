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

export interface DeviceCreatedEvent {
    kind: 'switch' | 'sensor';
    id: number;
}

interface Handlers {
    onSwitch?: (e: SwitchEvent) => void;
    onSensor?: (e: SensorEvent) => void;
    onDeviceCreated?: (e: DeviceCreatedEvent) => void;
    onForceLogout?: () => void;
}

/**
 * Opens a SignalR connection to garge-api's DeviceHub for the current
 * authenticated user and forwards events to the supplied handlers.
 *
 * Dependency array is intentionally `[]`: the connection lifecycle is tied
 * to the component lifetime, not to handler identity. The latest handlers
 * are captured into a ref on every render so consumers don't need to
 * memoize callbacks; the ref is read inside the connection-event closures.
 */
export function useDeviceStream(handlers: Handlers): void {
    const handlersRef = useRef<Handlers>(handlers);

    useEffect(() => {
        // Refresh the ref each effect run so closures see latest handlers
        // without re-creating the SignalR connection.
        handlersRef.current = handlers;

        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) return;

        let cancelled = false;
        let connection: HubConnection | null = null;

        (async () => {
            // NEXT_PUBLIC_API_URL is the REST root (e.g. https://host/api).
            // The SignalR hub is mapped at /hubs/devices on the api host —
            // outside the /api segment — so strip a trailing /api before
            // appending the hub path. Tolerates trailing slashes either way.
            const hubUrl =
                `${apiBase.replace(/\/?api\/?$/, '').replace(/\/$/, '')}/hubs/devices`;

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
            connection.on('device-created', (payload: DeviceCreatedEvent) => {
                handlersRef.current.onDeviceCreated?.(payload);
            });
            connection.on('forceLogout', () => {
                handlersRef.current.onForceLogout?.();
            });

            try {
                await connection.start();
                if (cancelled) {
                    await connection.stop();
                }
            } catch (err) {
                // React StrictMode mounts twice in dev; the first cleanup
                // aborts the in-flight start(). Treat that abort as expected
                // and stay quiet so it doesn't pollute the console.
                if (cancelled) return;
                if (process.env.NODE_ENV === 'development') {
                    console.error('useDeviceStream connect failed:', err);
                }
            }
        })();

        return () => {
            cancelled = true;
            // Suppress AbortError from stopping a connection that is still
            // negotiating — see comment above on StrictMode double-mount.
            connection?.stop().catch(() => { });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
