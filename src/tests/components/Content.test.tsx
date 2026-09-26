import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import Content from '@/app/content'

// The refactor replaced a mount effect (`useEffect(() => setIsClient(true))`)
// with useSyncExternalStore. The behaviour that must hold either way:
// - nothing renders on the server
// - children render on the client
// The server assertion is the one that proves the swap is hydration-safe: the
// server markup must still be empty, so the first client render matches it.

describe('Content', () => {
    it('renders nothing on the server', () => {
        const html = renderToString(<Content><p>hello</p></Content>)
        expect(html).toBe('')
    })

    it('renders children on the client', () => {
        render(<Content><p>hello</p></Content>)
        expect(screen.getByText('hello')).toBeInTheDocument()
    })
})
