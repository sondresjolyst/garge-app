export interface VoltageThresholds {
    warning: number;
    critical: number;
}

export type VoltageStatus = 'normal' | 'warning' | 'critical';

export const VOLTAGE_STATUS_COLOR: Record<VoltageStatus, string> = {
    normal: 'text-white',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
};

export function voltageStatus(value: number | null | undefined, thresholds: VoltageThresholds): VoltageStatus {
    if (value === null || value === undefined || !Number.isFinite(value)) return 'normal';
    if (value < thresholds.critical) return 'critical';
    if (value < thresholds.warning) return 'warning';
    return 'normal';
}

export function voltageColorClass(value: number | null | undefined, thresholds: VoltageThresholds | null | undefined): string {
    if (!thresholds) return 'text-white';
    return VOLTAGE_STATUS_COLOR[voltageStatus(value, thresholds)];
}

/** Builds thresholds from a sensor's stored bounds, or null when either is unset (coloring is opt-in). */
export function thresholdsOrNull(warning: number | null | undefined, critical: number | null | undefined): VoltageThresholds | null {
    if (warning === null || warning === undefined || critical === null || critical === undefined) return null;
    return { warning, critical };
}
