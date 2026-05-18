import { describe, it, expect } from 'vitest'
import { pickCurrentSlot } from '@/lib/electricitySlot'

const slot = (x: number, xEnd: number, y: number) => ({ x, xEnd, y })

describe('pickCurrentSlot', () => {
    const slots = [
        slot(0, 900_000, 1),       // 0..15min
        slot(900_000, 1_800_000, 2),  // 15..30min
        slot(1_800_000, 2_700_000, 3), // 30..45min
        slot(2_700_000, 3_600_000, 4), // 45..60min
    ]

    it('returns the slot that contains "now", not the nearest start', () => {
        // "Now" is at 12 min — closer to the 15-min start than to 0, but
        // the contains-now answer is the 0..15min slot.
        expect(pickCurrentSlot(slots, 720_000)?.y).toBe(1)
    })

    it('picks the slot when now equals the start (inclusive)', () => {
        expect(pickCurrentSlot(slots, 900_000)?.y).toBe(2)
    })

    it('excludes the slot when now equals the end (exclusive)', () => {
        // 1_800_000 is the end of slot 2 and the start of slot 3.
        expect(pickCurrentSlot(slots, 1_800_000)?.y).toBe(3)
    })

    it('returns null when now is before all slots', () => {
        expect(pickCurrentSlot(slots, -1)).toBeNull()
    })

    it('returns null when now is after all slots', () => {
        expect(pickCurrentSlot(slots, 3_600_000)).toBeNull()
    })

    it('returns null when given no slots', () => {
        expect(pickCurrentSlot([], 1000)).toBeNull()
    })
})
