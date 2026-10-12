import { describe, it, expect } from 'vitest'
import { partialAmountNote } from '@/lib/orderAmounts'
import type { OrderStatus } from '@/services/shopService'

const order = (status: OrderStatus, capturedInOre: number, refundedInOre = 0) => ({ status, totalInOre: 10000, capturedInOre, refundedInOre })

describe('partialAmountNote', () => {
    it('describes a reserved order captured in part', () => {
        expect(partialAmountNote(order('Reserved', 4000))).toBe('Partly captured: NOK 40,00 of NOK 100,00.')
    })

    it('describes a paid order refunded in part', () => {
        expect(partialAmountNote(order('Paid', 10000, 2500))).toBe('Partly refunded: NOK 25,00 of NOK 100,00.')
    })

    it.each([
        ['a reserved order with nothing captured', order('Reserved', 0)],
        ['a reserved order captured in full', order('Reserved', 10000)],
        ['a paid order with nothing refunded', order('Paid', 10000)],
        ['a refunded order', order('Refunded', 10000, 10000)],
        ['a paid order refunded in full', order('Paid', 10000, 10000)],
        ['a cancelled order captured in part', order('Cancelled', 4000)],
    ])('says nothing for %s', (_, o) => {
        expect(partialAmountNote(o)).toBeNull()
    })
})
