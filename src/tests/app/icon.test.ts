import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const { publicGet } = vi.hoisted(() => ({ publicGet: vi.fn() }))
vi.mock('@/lib/publicApi', () => ({ publicGet }))

import Icon, { dynamic } from '@/app/icon'

beforeEach(() => publicGet.mockReset())

describe('icon', () => {
    it('serves the favicon an admin uploaded', async () => {
        publicGet.mockResolvedValue({ iconData: Buffer.from('png bytes').toString('base64'), iconContentType: 'image/png' })

        const response = await Icon()

        expect(publicGet).toHaveBeenCalledWith('/branding')
        expect(response.headers.get('content-type')).toBe('image/png')
        expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('png bytes')
    })

    it('serves the bundled favicon.ico while none is uploaded', async () => {
        publicGet.mockResolvedValue({})

        const response = await Icon()

        expect(response.headers.get('content-type')).toBe('image/x-icon')
        expect(Buffer.from(await response.arrayBuffer())).toEqual(await readFile(join(process.cwd(), 'public', 'favicon.ico')))
    })

    it('is rendered per request, so a new pod does not serve the build-time icon', () => {
        expect(dynamic).toBe('force-dynamic')
    })
})
