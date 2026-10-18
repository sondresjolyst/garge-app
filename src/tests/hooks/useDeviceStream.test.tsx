import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { useDeviceStream } from '@/hooks/useDeviceStream';
import { closeSessionPrompt, getSessionPromptOpen, SESSION_ERRORS } from '@sjolystinnovation/app-kit/session';
import { auth, resetTestMocks } from '@sjolystinnovation/app-kit/testing';
import { AxiosError, AxiosHeaders } from 'axios';

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

const { getTicket } = vi.hoisted(() => ({ getTicket: vi.fn() }));
vi.mock('@/services/deviceHubService', () => ({ default: { getTicket } }));

/** An axios failure with the given status, like the API client rejects with. */
function apiFailure(status: number): AxiosError {
    const config = { headers: new AxiosHeaders() };
    return new AxiosError('failed', String(status), config, undefined, { status, statusText: '', data: {}, headers: {}, config });
}

vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock());

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
        resetTestMocks();
        auth.getSession.mockResolvedValue({ accessToken: 'test-token' });
        getTicket.mockReset();
        getTicket.mockResolvedValueOnce('ticket-1').mockResolvedValueOnce('ticket-2');
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
        const session = auth.getSession;
        const tokenFactory = async () => {
            await waitFor(() => expect(builderInstance.withUrl).toHaveBeenCalled());
            const options = builderInstance.withUrl.mock.calls.at(-1)![1] as { accessTokenFactory: () => Promise<string> };
            return options.accessTokenFactory;
        };

        beforeEach(() => closeSessionPrompt());
        afterEach(() => {
            mockConnection.start.mockReset();
            mockConnection.start.mockResolvedValue(undefined);
        });

        it('hands out a hub ticket, not the session token, while the session is healthy', async () => {
            render(<Probe onSwitch={() => { }} />);

            expect(await (await tokenFactory())()).toBe('ticket-1');
            expect(getTicket).toHaveBeenCalledTimes(1);
            expect(getSessionPromptOpen()).toBe(false);
        });

        it('asks for a fresh ticket every time, so a reconnect never reuses one', async () => {
            render(<Probe onSwitch={() => { }} />);
            const factory = await tokenFactory();

            expect(await factory()).toBe('ticket-1');
            expect(await factory()).toBe('ticket-2');
            expect(getTicket).toHaveBeenCalledTimes(2);
        });

        it.each(Object.values(SESSION_ERRORS))('opens the prompt instead of connecting after %s', async (error) => {
            render(<Probe onSwitch={() => { }} />);
            const factory = await tokenFactory();
            session.mockResolvedValue({ accessToken: 'stale', error } as never);

            await expect(factory()).rejects.toThrow();
            expect(getTicket).not.toHaveBeenCalled();
            expect(getSessionPromptOpen()).toBe(true);
        });

        it('opens the prompt when there is no session at all', async () => {
            render(<Probe onSwitch={() => { }} />);
            const factory = await tokenFactory();
            session.mockResolvedValue(null as never);

            await expect(factory()).rejects.toThrow();
            expect(getTicket).not.toHaveBeenCalled();
            expect(getSessionPromptOpen()).toBe(true);
        });

        it('opens the prompt when the ticket request answers 401', async () => {
            render(<Probe onSwitch={() => { }} />);
            const factory = await tokenFactory();
            getTicket.mockReset();
            getTicket.mockRejectedValue(apiFailure(401));

            await expect(factory()).rejects.toThrow();
            expect(getSessionPromptOpen()).toBe(true);
        });

        it('keeps the prompt closed when the ticket request fails for another reason', async () => {
            render(<Probe onSwitch={() => { }} />);
            const factory = await tokenFactory();
            getTicket.mockReset();
            getTicket.mockRejectedValue(apiFailure(500));

            await expect(factory()).rejects.toThrow();
            expect(getSessionPromptOpen()).toBe(false);
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
