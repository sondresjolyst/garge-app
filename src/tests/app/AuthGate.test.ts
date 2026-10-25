// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// A request proxy that sends signed-out visitors to the login page also answers the link prefetches
// on public pages. The router keeps that redirect after sign-in, so the (protected) layout stays the
// only auth gate.
describe('auth gate', () => {
    it.each(['src/proxy.ts', 'src/middleware.ts'])('is not a request proxy in %s', (file) => {
        expect(existsSync(resolve(process.cwd(), file))).toBe(false)
    })
})
