import { AxiosError } from 'axios';

export function parseErrorCode(err: unknown): string | null {
    if (!(err instanceof AxiosError)) return null;
    const data = err.response?.data;
    if (!data || typeof data !== 'object') return null;
    const code = (data as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
}

