export function unitForType(type: string): string {
    if (type === 'temperature') return '°C';
    if (type === 'humidity')    return '%';
    if (type === 'voltage')     return 'V';
    return '';
}

export function typeLabel(type: string): string {
    if (type === 'temperature') return 'Temperature';
    if (type === 'humidity')    return 'Humidity';
    if (type === 'voltage')     return 'Voltage';
    if (type === 'socket')      return 'Smart Socket';
    return type;
}

export function typeEmoji(type: string): string {
    if (type === 'temperature') return '🌡️';
    if (type === 'humidity')    return '💧';
    if (type === 'voltage')     return '⚡';
    if (type === 'unknown')     return '🔒';
    return '📡';
}

export function formatSensorValue(type: string, value: number | null | undefined): string {
    if (value === undefined || value === null) return '—';
    const t = type.toLowerCase();
    if (t === 'temperature') return `${Number(value).toFixed(1)} °C`;
    if (t === 'humidity')    return `${Number(value).toFixed(0)} %`;
    if (t === 'voltage')     return `${Number(value).toFixed(2)} V`;
    return `${Number(value).toFixed(1)} ${unitForType(t)}`;
}
