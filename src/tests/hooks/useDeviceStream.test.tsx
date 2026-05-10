import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { useDeviceStream } from '@/hooks/useDeviceStream';

const handlers = new Map<string, (payload: unknown) => void>();

const mockConnection = {
    on: vi.fn((event: string, fn: (payload: unknown) => void) => {
        handlers.set(event, fn);
    }),
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
};

const builderInstance = {
    withUrl: vi.fn().mockReturnThis(),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    configureLogging: vi.fn().mockReturnThis(),
    build: vi.fn(() => mockConnection),
};

vi.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: function () {
        return builderInstance;
    },
    LogLevel: { Warning: 3 },
}));

vi.mock('next-auth/react', () => ({
    getSession: vi.fn(() => Promise.resolve({ accessToken: 'test-token' })),
}));

interface ProbeProps {
    onSwitch?: (e: unknown) => void;
    onSensor?: (e: unknown) => void;
}
const Probe: React.FC<ProbeProps> = ({ onSwitch, onSensor }) => {
    useDeviceStream({ onSwitch, onSensor });
    return null;
};

describe('useDeviceStream', () => {
    beforeEach(() => {
        handlers.clear();
        mockConnection.on.mockClear();
        mockConnection.start.mockClear();
        mockConnection.stop.mockClear();
        builderInstance.withUrl.mockClear();
        process.env.NEXT_PUBLIC_API_URL = 'https://api.test';
    });

    afterEach(() => {
        delete process.env.NEXT_PUBLIC_API_URL;
    });

    it('subscribes to switch and sensor events', async () => {
        render(<Probe onSwitch={() => { }} onSensor={() => { }} />);
        await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());
        expect(mockConnection.on).toHaveBeenCalledWith('switch', expect.any(Function));
        expect(mockConnection.on).toHaveBeenCalledWith('sensor', expect.any(Function));
    });

    it('forwards switch payloads to onSwitch', async () => {
        const onSwitch = vi.fn();
        render(<Probe onSwitch={onSwitch} />);
        await waitFor(() => expect(handlers.has('switch')).toBe(true));

        const payload = { id: 1, switchId: 42, value: 'ON', timestamp: 'now' };
        handlers.get('switch')!(payload);

        expect(onSwitch).toHaveBeenCalledWith(payload);
    });

    it('forwards sensor payloads to onSensor', async () => {
        const onSensor = vi.fn();
        render(<Probe onSensor={onSensor} />);
        await waitFor(() => expect(handlers.has('sensor')).toBe(true));

        const payload = { id: 7, sensorId: 12, value: '23.4', timestamp: 'now' };
        handlers.get('sensor')!(payload);

        expect(onSensor).toHaveBeenCalledWith(payload);
    });

    it('builds the hub url from NEXT_PUBLIC_API_URL', async () => {
        render(<Probe onSwitch={() => { }} />);
        await waitFor(() => expect(builderInstance.withUrl).toHaveBeenCalled());
        expect(builderInstance.withUrl).toHaveBeenCalledWith(
            'https://api.test/hubs/devices',
            expect.objectContaining({ accessTokenFactory: expect.any(Function) }),
        );
    });

    it('strips trailing /api when building hub url', async () => {
        process.env.NEXT_PUBLIC_API_URL = 'https://api.test/api';
        render(<Probe onSwitch={() => { }} />);
        await waitFor(() => expect(builderInstance.withUrl).toHaveBeenCalled());
        expect(builderInstance.withUrl).toHaveBeenCalledWith(
            'https://api.test/hubs/devices',
            expect.objectContaining({ accessTokenFactory: expect.any(Function) }),
        );
    });

    it('stops the connection on unmount', async () => {
        const { unmount } = render(<Probe onSwitch={() => { }} />);
        await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());
        unmount();
        expect(mockConnection.stop).toHaveBeenCalled();
    });
});
