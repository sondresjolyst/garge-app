import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn<() => string | null>() }))
vi.mock('next/navigation', () => ({ usePathname }))

import Content from '@/app/content'

// The refactor replaced a mount effect (`useEffect(() => setIsClient(true))`)
// with useSyncExternalStore. The behaviour that must hold either way:
// - nothing renders on the server
// - children render on the client
// The server assertion is the one that proves the swap is hydration-safe: the
// server markup must still be empty, so the first client render matches it.

describe('Content', () => {
    beforeEach(() => usePathname.mockReturnValue('/contact'))

    it('renders nothing on the server', () => {
        const html = renderToString(<Content><p>hello</p></Content>)
        expect(html).toBe('')
    })

    it.each(['/no/help', '/en/help'])('renders %s on the server, so its links work without JavaScript', pathname => {
        usePathname.mockReturnValue(pathname)
        expect(renderToString(<Content><p>hello</p></Content>)).toContain('hello')
    })

    it('renders children on the client', () => {
        render(<Content><p>hello</p></Content>)
        expect(screen.getByText('hello')).toBeInTheDocument()
    })
})
