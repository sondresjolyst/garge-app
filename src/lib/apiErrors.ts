export function parseValidationErrors(data: unknown): Record<string, string[]> | null {
    if (!data || typeof data !== 'object') return null;
    const errors = (data as { errors?: unknown }).errors;
    if (!errors || typeof errors !== 'object') return null;
    const normalized: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
        const fieldKey = key.charAt(0).toLowerCase() + key.slice(1);
        normalized[fieldKey] = Array.isArray(value) ? value.map(String) : [String(value)];
    }
    return Object.keys(normalized).length > 0 ? normalized : null;
}
