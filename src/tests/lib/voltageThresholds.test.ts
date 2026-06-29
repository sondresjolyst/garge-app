import { describe, it, expect } from 'vitest'
import {
    voltageStatus,
    voltageColorClass,
    thresholdsOrNull,
    VOLTAGE_STATUS_COLOR,
} from '@/lib/voltageThresholds'

const thresholds = { warning: 12.4, critical: 12.0 }

describe('voltageStatus', () => {
    it('is normal at or above the warning threshold', () => {
        expect(voltageStatus(12.4, thresholds)).toBe('normal')
        expect(voltageStatus(13.8, thresholds)).toBe('normal')
    })

    it('is warning between critical and warning', () => {
        expect(voltageStatus(12.39, thresholds)).toBe('warning')
        expect(voltageStatus(12.0, thresholds)).toBe('warning')
    })

    it('is critical below the critical threshold', () => {
        expect(voltageStatus(11.99, thresholds)).toBe('critical')
        expect(voltageStatus(0, thresholds)).toBe('critical')
    })

    it('treats missing or non-finite values as normal', () => {
        expect(voltageStatus(null, thresholds)).toBe('normal')
        expect(voltageStatus(undefined, thresholds)).toBe('normal')
        expect(voltageStatus(NaN, thresholds)).toBe('normal')
    })

    it('lets critical win when thresholds are misconfigured (warning <= critical)', () => {
        expect(voltageStatus(12.2, { warning: 12.0, critical: 12.4 })).toBe('critical')
    })
})

describe('voltageColorClass', () => {
    it('returns white when thresholds are unset (opt-in coloring)', () => {
        expect(voltageColorClass(11.0, null)).toBe('text-white')
        expect(voltageColorClass(11.0, undefined)).toBe('text-white')
    })

    it('maps each status to its color', () => {
        expect(voltageColorClass(12.6, thresholds)).toBe(VOLTAGE_STATUS_COLOR.normal)
        expect(voltageColorClass(12.2, thresholds)).toBe(VOLTAGE_STATUS_COLOR.warning)
        expect(voltageColorClass(11.5, thresholds)).toBe(VOLTAGE_STATUS_COLOR.critical)
    })
})

describe('thresholdsOrNull', () => {
    it('builds thresholds when both bounds are present', () => {
        expect(thresholdsOrNull(12.4, 12.0)).toEqual({ warning: 12.4, critical: 12.0 })
    })

    it('returns null when either bound is missing', () => {
        expect(thresholdsOrNull(12.4, null)).toBeNull()
        expect(thresholdsOrNull(null, 12.0)).toBeNull()
        expect(thresholdsOrNull(undefined, undefined)).toBeNull()
    })
})
