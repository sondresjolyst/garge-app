export function normalizeNoPhone(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 8) return `47${digits}`;
    if (digits.length === 10 && digits.startsWith('47')) return digits;
    return null;
}
