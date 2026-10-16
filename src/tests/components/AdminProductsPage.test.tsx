import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AxiosError, AxiosHeaders } from 'axios'
import type { Product } from '@/services/productService'
import { makeSession, resetTestMocks, setSession, toastSpies } from '@sjolystinnovation/app-kit/testing'

const { getProducts, updateProduct, getPriceChanges } = vi.hoisted(() => ({
    getProducts: vi.fn(),
    updateProduct: vi.fn(),
    getPriceChanges: vi.fn(),
}))

vi.mock('next-auth/react', async () => (await import('@sjolystinnovation/app-kit/testing')).nextAuthMock())
vi.mock('@sjolystinnovation/app-kit/toast', async () => (await import('@sjolystinnovation/app-kit/testing')).toastMock())
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

beforeEach(() => {
    resetTestMocks()
    setSession(makeSession({ user: { id: 'admin-1', name: 'admin', email: 'a@b.no', roles: ['Admin'] } }))
})

describe('AdminProductsPage', () => {
    beforeEach(() => {
        for (const m of [getProducts, updateProduct, getPriceChanges]) m.mockReset()
        getProducts.mockResolvedValue([product])
        getPriceChanges.mockResolvedValue([])
    })

    it('shows why the API refused an edit', async () => {
        updateProduct.mockRejectedValue(conflict('The price cannot go up at once while the product has subscribers. Schedule a price change with notice instead.'))
        render(<AdminProductsPage />)

        fireEvent.click(await screen.findByTitle('Edit'))
        fireEvent.change(screen.getByLabelText(/Price customers pay/), { target: { value: '59' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith(expect.stringContaining('Schedule a price change')))
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

describe('AdminProductsPage drafts', () => {
    const KEY = 'garge:draft:admin-1:product:7'

    beforeEach(() => {
        localStorage.clear()
        for (const m of [getProducts, updateProduct, getPriceChanges]) m.mockReset()
        getProducts.mockResolvedValue([product])
        getPriceChanges.mockResolvedValue([])
    })

    const editPrice = async (value: string) => {
        fireEvent.click(await screen.findByTitle('Edit'))
        fireEvent.change(screen.getByLabelText(/Price customers pay/), { target: { value } })
    }

    it('stores an edit a moment after it is made', async () => {
        render(<AdminProductsPage />)

        await editPrice('59')

        await waitFor(() => expect(localStorage.getItem(KEY)).not.toBeNull(), { timeout: 2000 })
        expect(JSON.parse(localStorage.getItem(KEY)!).value.priceNok).toBe('59')
    })

    it('offers the draft when the plan is opened again, and restores it', async () => {
        localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), value: { name: 'Garge Plus' } }))
        render(<AdminProductsPage />)

        fireEvent.click(await screen.findByTitle('Edit'))
        fireEvent.click(await screen.findByRole('button', { name: 'Restore draft' }))

        expect(screen.getByDisplayValue('Garge Plus')).toBeInTheDocument()
        // Fields the draft lacks keep their values, so saving sends the plan's own price.
        updateProduct.mockResolvedValue({})
        fireEvent.click(screen.getByRole('button', { name: 'Save' }))
        await waitFor(() => expect(updateProduct).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'Garge Plus', priceInOre: 4900 })))
    })

    it('drops the draft once the plan is saved', async () => {
        updateProduct.mockResolvedValue({})
        render(<AdminProductsPage />)
        await editPrice('59')
        await waitFor(() => expect(localStorage.getItem(KEY)).not.toBeNull(), { timeout: 2000 })

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(updateProduct).toHaveBeenCalled())
        await waitFor(() => expect(localStorage.getItem(KEY)).toBeNull())
    })

    it('keeps the draft when the save is refused', async () => {
        updateProduct.mockRejectedValue(conflict('Refused'))
        render(<AdminProductsPage />)
        await editPrice('59')
        await waitFor(() => expect(localStorage.getItem(KEY)).not.toBeNull(), { timeout: 2000 })

        fireEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(toastSpies.error).toHaveBeenCalled())
        expect(JSON.parse(localStorage.getItem(KEY)!).value.priceNok).toBe('59')
    })
})
