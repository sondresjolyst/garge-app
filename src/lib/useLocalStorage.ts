import { useCallback, useState } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
    const [stored, setStored] = useState<T>(() => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const item = localStorage.getItem(key);
            return item !== null ? (JSON.parse(item) as T) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    const setValue = useCallback((value: T) => {
        setStored(value);
        localStorage.setItem(key, JSON.stringify(value));
    }, [key]);

    return [stored, setValue];
}
