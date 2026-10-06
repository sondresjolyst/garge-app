import axios from 'axios';
import { formatApiError as formatWithKit, type StatusMessages } from '@sjolystinnovation/app-kit';

const STATUS_MESSAGES: StatusMessages = {
    401: 'Not authorized.',
    403: 'Not authorized.',
    404: 'Not found.',
    409: 'Conflict — already exists.',
    429: 'Too many requests. Wait a moment.',
    502: 'Vipps unreachable. Try again in a moment.',
    503: 'Vipps unreachable. Try again in a moment.',
};

/**
 * Formats a failed API call with app-kit's rules and Garge's own wording per status. An error that
 * did not come from axios gives the fallback, so a bug's message never ends up in a toast.
 */
export function formatApiError(err: unknown, fallback: string): string {
    if (!axios.isAxiosError(err)) return fallback;
    return formatWithKit(err, fallback, STATUS_MESSAGES);
}
