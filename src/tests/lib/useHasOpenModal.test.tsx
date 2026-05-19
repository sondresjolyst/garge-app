import { describe, it, expect, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useHasOpenModal } from '@/lib/useHasOpenModal'

function Probe({ onChange }: { onChange: (v: boolean) => void }) {
    const has = useHasOpenModal()
    onChange(has)
    return null
}

async function flush() {
    await act(async () => {
        await Promise.resolve()
    })
}

afterEach(() => {
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild)
    }
})

describe('useHasOpenModal', () => {
    it('returns false when no modal is in the DOM', () => {
        let observed = true
        render(<Probe onChange={v => { observed = v }} />)
        expect(observed).toBe(false)
    })

    it('returns true when an aria-modal element is already in the DOM at mount', () => {
        const dialog = document.createElement('div')
        dialog.setAttribute('aria-modal', 'true')
        document.body.appendChild(dialog)

        let observed = false
        render(<Probe onChange={v => { observed = v }} />)
        expect(observed).toBe(true)
    })

    it('detects a modal added after mount', async () => {
        let observed = true
        render(<Probe onChange={v => { observed = v }} />)
        expect(observed).toBe(false)

        await act(async () => {
            const dialog = document.createElement('div')
            dialog.setAttribute('aria-modal', 'true')
            document.body.appendChild(dialog)
            await Promise.resolve()
        })
        await flush()
        expect(observed).toBe(true)
    })

    it('detects a modal closing (aria-modal removed)', async () => {
        const dialog = document.createElement('div')
        dialog.setAttribute('aria-modal', 'true')
        document.body.appendChild(dialog)

        let observed = false
        render(<Probe onChange={v => { observed = v }} />)
        expect(observed).toBe(true)

        await act(async () => {
            dialog.removeAttribute('aria-modal')
            await Promise.resolve()
        })
        await flush()
        expect(observed).toBe(false)
    })
})
