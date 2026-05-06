import { useCallback, useEffect, useRef, useState } from 'react';

export interface PollResult<T> {
    data: T | null;
    loading: boolean;
    refresh: () => void;
}

export function usePollUntilFinal<T>(
    fetcher: () => Promise<T | null>,
    isFinal: (value: T | null) => boolean,
    options: { retries?: number; delayMs?: number } = {},
): PollResult<T> {
    const { retries = 8, delayMs = 4000 } = options;
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const cancelled = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const tickRef = useRef<() => Promise<void>>(async () => {});

    const start = useCallback(() => {
        cancelled.current = false;
        setLoading(true);
        let attempt = 0;

        const tick = async () => {
            try {
                const value = await fetcher();
                if (cancelled.current) return;
                setData(value);
                if (isFinal(value) || attempt >= retries) {
                    setLoading(false);
                    return;
                }
                attempt += 1;
                timer.current = setTimeout(tick, delayMs);
            } catch {
                if (!cancelled.current) setLoading(false);
            }
        };
        tickRef.current = tick;
        tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retries, delayMs]);

    useEffect(() => {
        start();
        return () => {
            cancelled.current = true;
            if (timer.current) clearTimeout(timer.current);
        };
    }, [start]);

    const refresh = useCallback(() => {
        cancelled.current = true;
        if (timer.current) clearTimeout(timer.current);
        start();
    }, [start]);

    return { data, loading, refresh };
}
