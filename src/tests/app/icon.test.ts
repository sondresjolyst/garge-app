import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const { publicGet } = vi.hoisted(() => ({ publicGet: vi.fn() }))
vi.mock('@/lib/publicApi', () => ({ publicGet }))

import Icon, { contentType, dynamic } from '@/app/icon'

beforeEach(() => publicGet.mockReset())

describe('icon', () => {
    it('serves the favicon an admin uploaded', async () => {
        publicGet.mockResolvedValue({ iconData: Buffer.from('png bytes').toString('base64'), iconContentType: 'image/png' })

        const response = await Icon()

        expect(publicGet).toHaveBeenCalledWith('/branding', { tags: ['branding'] })
        expect(response.headers.get('content-type')).toBe('image/png')
        expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('png bytes')
    })

    it('serves the PNG frame of favicon.ico while none is uploaded, matching the image/png link', async () => {
        publicGet.mockResolvedValue({})

        const response = await Icon()

        expect(contentType).toBe('image/png')
        expect(response.headers.get('content-type')).toBe(contentType)
        const body = Buffer.from(await response.arrayBuffer())
        expect(body).toEqual(await readFile(join(process.cwd(), 'public', 'favicon.png')))
        expect(body.subarray(1, 4).toString()).toBe('PNG')
        expect((await readFile(join(process.cwd(), 'public', 'favicon.ico'))).includes(body)).toBe(true)
    })

    it('is rendered per request, so a new pod does not serve the build-time icon', () => {
        expect(dynamic).toBe('force-dynamic')
    })
})
