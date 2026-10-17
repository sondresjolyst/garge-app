import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandingProvider } from '@sjolystinnovation/app-kit/branding'

vi.mock('next/image', () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }))

import BrandLogo from '@/components/BrandLogo'

const load = () => Promise.resolve({})

describe('BrandLogo', () => {
    it('shows the logo an admin uploaded', () => {
        render(
            <BrandingProvider load={load} initial={{ logoData: 'iVBORw0KGgo=', logoContentType: 'image/png' }}>
                <BrandLogo width={32} height={37} className="h-auto w-8" />
            </BrandingProvider>,
        )

        expect(screen.getByAltText('Garge')).toHaveAttribute('src', 'data:image/png;base64,iVBORw0KGgo=')
        expect(screen.getByAltText('Garge')).toHaveClass('h-auto', 'w-8')
    })

    it('shows the bundled logo while none is uploaded', () => {
        render(
            <BrandingProvider load={load} initial={{}}>
                <BrandLogo width={32} height={37} className="h-auto w-8" />
            </BrandingProvider>,
        )

        expect(screen.getByAltText('Garge')).toHaveAttribute('src', '/garge-icon-large.png')
    })

    it('shows the bundled logo outside a provider', () => {
        render(<BrandLogo width={32} height={37} className="h-auto w-8" />)

        expect(screen.getByAltText('Garge')).toHaveAttribute('src', '/garge-icon-large.png')
    })
})
