import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { useDeviceStream } from '@/hooks/useDeviceStream';
import { closeSessionPrompt, getSessionPromptOpen, SESSION_ERRORS } from '@sjolystinnovation/app-kit/session';
import { getSession } from 'next-auth/react';

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

const { HttpError } = vi.hoisted(() => ({
    HttpError: class HttpError extends Error {
        constructor(message: string, public statusCode: number) { super(message); }
    },
}));

vi.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: function () {
        return builderInstance;
    },
    HttpError,
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

    describe('when the session ends', () => {
        const session = vi.mocked(getSession);
        const tokenFactory = async () => {
            await waitFor(() => expect(builderInstance.withUrl).toHaveBeenCalled());
            const options = builderInstance.withUrl.mock.calls.at(-1)![1] as { accessTokenFactory: () => Promise<string> };
            return options.accessTokenFactory;
        };

        beforeEach(() => closeSessionPrompt());
        afterEach(() => {
            session.mockReset();
            session.mockResolvedValue({ accessToken: 'test-token' } as never);
            mockConnection.start.mockReset();
            mockConnection.start.mockResolvedValue(undefined);
        });

        it('hands out the token without a prompt while the session is healthy', async () => {
            render(<Probe onSwitch={() => { }} />);

            expect(await (await tokenFactory())()).toBe('test-token');
            expect(getSessionPromptOpen()).toBe(false);
        });

        it.each(Object.values(SESSION_ERRORS))('opens the prompt instead of connecting after %s', async (error) => {
            render(<Probe onSwitch={() => { }} />);
            const factory = await tokenFactory();
            session.mockResolvedValue({ accessToken: 'stale', error } as never);

            expect(await factory()).toBe('');
            expect(getSessionPromptOpen()).toBe(true);
        });

        it('opens the prompt when there is no session at all', async () => {
            render(<Probe onSwitch={() => { }} />);
            const factory = await tokenFactory();
            session.mockResolvedValue(null as never);

            expect(await factory()).toBe('');
            expect(getSessionPromptOpen()).toBe(true);
        });

        it('opens the prompt when the hub refuses the connection with a 401 and the session has ended', async () => {
            session.mockResolvedValue({ accessToken: 'stale', error: SESSION_ERRORS.refreshRejected } as never);
            mockConnection.start.mockRejectedValue(new HttpError('Unauthorized', 401));

            render(<Probe onSwitch={() => { }} />);

            await waitFor(() => expect(getSessionPromptOpen()).toBe(true));
            expect(session).toHaveBeenCalledWith({ broadcast: false });
        });

        it('keeps the prompt closed after a 401 while the session is still healthy', async () => {
            mockConnection.start.mockRejectedValue(new HttpError('Unauthorized', 401));

            render(<Probe onSwitch={() => { }} />);

            await waitFor(() => expect(session).toHaveBeenCalledWith({ broadcast: false }));
            expect(getSessionPromptOpen()).toBe(false);
        });

        it('leaves other connection failures alone', async () => {
            mockConnection.start.mockRejectedValue(new HttpError('Server error', 500));

            render(<Probe onSwitch={() => { }} />);

            await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());
            await new Promise((r) => setTimeout(r, 20));
            expect(session).not.toHaveBeenCalledWith({ broadcast: false });
            expect(getSessionPromptOpen()).toBe(false);
        });
    });

    it('stops the connection on unmount', async () => {
        const { unmount } = render(<Probe onSwitch={() => { }} />);
        await waitFor(() => expect(mockConnection.start).toHaveBeenCalled());
        unmount();
        expect(mockConnection.stop).toHaveBeenCalled();
    });
});
