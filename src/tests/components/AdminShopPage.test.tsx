import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { makeSession, resetTestMocks, setSession, toastSpies } from '@sjolystinnovation/app-kit/testing'

const { getShopItems, createShopItem } = vi.hoisted(() => ({
    getShopItems: vi.fn(),
    createShopItem: vi.fn(),
}))

vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())
vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
vi.mock('@/components/MarkdownEditor', () => ({ default: () => null }))
vi.mock('@/services/shopService', () => ({
    default: {
        getShopItems: () => getShopItems(),
        createShopItem: (payload: unknown) => createShopItem(payload),
    },
}))

import AdminShopPage from '@/app/(protected)/admin/shop/page'

beforeEach(() => {
    resetTestMocks()
    setSession(makeSession({ user: { id: 'admin-1', name: 'admin', email: 'a@b.no', roles: ['Admin'] } }))
    getShopItems.mockReset()
    createShopItem.mockReset()
    getShopItems.mockResolvedValue([])
    createShopItem.mockResolvedValue({})
})

async function fillAndSave(price: string) {
    render(<AdminShopPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Add/ }))
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'Sticker' } })
    fireEvent.change(screen.getByLabelText(/Price customers pay/), { target: { value: price } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

describe('AdminShopPage price', () => {
    it.each([['59', 5900], ['59.50', 5950], ['59,50', 5950]])('saves %s kr as %i ore', async (value, ore) => {
        await fillAndSave(value)

        await waitFor(() => expect(createShopItem).toHaveBeenCalledWith(expect.objectContaining({ priceInOre: ore })))
    })

    it.each(['', '0', 'abc', '59,505'])('refuses the price "%s" without calling the API', async (value) => {
        await fillAndSave(value)

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith('Name and valid price required'))
        expect(createShopItem).not.toHaveBeenCalled()
    })
})
