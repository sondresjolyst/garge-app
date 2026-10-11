import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AxiosError, AxiosHeaders } from 'axios'
import type { Product } from '@/services/productService'

const { getProducts, updateProduct, getPriceChanges, toastError } = vi.hoisted(() => ({
    getProducts: vi.fn(),
    updateProduct: vi.fn(),
    getPriceChanges: vi.fn(),
    toastError: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { roles: ['Admin'] } } }) }))
vi.mock('@sjolystinnovation/app-kit/toast', () => ({ toast: { success: vi.fn(), error: toastError } }))
vi.mock('@/components/MarkdownEditor', () => ({ default: () => null }))
vi.mock('@/services/productService', () => ({
    default: {
        getProducts: () => getProducts(),
        updateProduct: (id: number, payload: unknown) => updateProduct(id, payload),
        getPriceChanges: (id: number) => getPriceChanges(id),
    },
}))

import AdminProductsPage from '@/app/(protected)/admin/products/page'

const product: Product = {
    id: 7, name: 'Garge Basic', description: null, priceInOre: 4900, interval: 'Monthly',
    type: 'Primary', isActive: true, createdAt: '2026-01-01T00:00:00Z',
}

function conflict(message: string): AxiosError {
    const headers = new AxiosHeaders()
    const err = new AxiosError('request failed', '409')
    err.response = { status: 409, statusText: '', headers, config: { headers } as never, data: message }
    return err
}

describe('AdminProductsPage', () => {
    beforeEach(() => {
        for (const m of [getProducts, updateProduct, getPriceChanges, toastError]) m.mockReset()
        getProducts.mockResolvedValue([product])
        getPriceChanges.mockResolvedValue([])
    })

    it('shows why the API refused an edit', async () => {
        updateProduct.mockRejectedValue(conflict('The price cannot go up at once while the product has subscribers. Schedule a price change with notice instead.'))
        render(<AdminProductsPage />)

        fireEvent.click(await screen.findByTitle('Edit'))
        fireEvent.change(screen.getByLabelText(/Price customers pay/), { target: { value: '59' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(toastError).toHaveBeenCalledWith(expect.stringContaining('Schedule a price change')))
    })

    it('opens and closes the price changes of a plan', async () => {
        render(<AdminProductsPage />)

        const toggle = await screen.findByRole('button', { name: 'Price changes for Garge Basic' })
        expect(toggle).toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(toggle)

        expect(await screen.findByText('No price changes yet.')).toBeInTheDocument()
        expect(getPriceChanges).toHaveBeenCalledWith(7)
        expect(toggle).toHaveAttribute('aria-expanded', 'true')

        fireEvent.click(toggle)
        expect(screen.queryByText('No price changes yet.')).not.toBeInTheDocument()
    })
})
