import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CartDrawer, { type CartDrawerProps } from '@/components/CartDrawer'
import type { ShopItem } from '@/services/shopService'

// Locks the phone-field seeding behaviour across the react-hooks refactor, which
// replaced `useEffect(() => { if (open) setPhone(initialPhone) }, [open, initialPhone])`
// with an adjust-during-render equivalent. The rules being pinned:
// - the field starts at initialPhone
// - it is re-seeded when the drawer opens
// - it is re-seeded when initialPhone changes while open
// - a value the user typed survives unrelated re-renders
// - a value the user typed is discarded on the next open

const item: ShopItem = {
    id: 1,
    name: 'Voltmeter',
    description: null,
    priceInOre: 49900,
    stockCount: 10,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
}

function renderDrawer(overrides: Partial<CartDrawerProps> = {}) {
    const props: CartDrawerProps = {
        open: true,
        cart: [{ shopItemId: 1, quantity: 1 }],
        items: [item],
        vatEnabled: false,
        initialPhone: '91234567',
        submitting: false,
        onChange: vi.fn(),
        onClose: vi.fn(),
        onCheckout: vi.fn(),
        ...overrides,
    }
    const view = render(<CartDrawer {...props} />)
    return { ...view, props }
}

const phoneField = () => screen.getByPlaceholderText('91 23 45 67') as HTMLInputElement

describe('CartDrawer phone seeding', () => {
    it('seeds the field from initialPhone when open', () => {
        renderDrawer()
        expect(phoneField().value).toBe('91234567')
    })

    it('seeds the field when the drawer transitions from closed to open', () => {
        const { rerender, props } = renderDrawer({ open: false })
        rerender(<CartDrawer {...props} open={true} />)
        expect(phoneField().value).toBe('91234567')
    })

    it('re-seeds when initialPhone changes while open', () => {
        const { rerender, props } = renderDrawer()
        expect(phoneField().value).toBe('91234567')

        rerender(<CartDrawer {...props} initialPhone="40404040" />)
        expect(phoneField().value).toBe('40404040')
    })

    it('keeps what the user typed across an unrelated re-render', () => {
        const { rerender, props } = renderDrawer()
        fireEvent.change(phoneField(), { target: { value: '99887766' } })
        expect(phoneField().value).toBe('99887766')

        rerender(<CartDrawer {...props} submitting={true} />)
        expect(phoneField().value).toBe('99887766')
    })

    it('discards what the user typed when the drawer is reopened', () => {
        const { rerender, props } = renderDrawer()
        fireEvent.change(phoneField(), { target: { value: '99887766' } })

        rerender(<CartDrawer {...props} open={false} />)
        rerender(<CartDrawer {...props} open={true} />)

        expect(phoneField().value).toBe('91234567')
    })
})
