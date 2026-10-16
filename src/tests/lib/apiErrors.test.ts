import { describe, it, expect } from 'vitest'
import { AxiosError } from 'axios'
import { parseErrorCode } from '@/lib/apiErrors'

function axiosErrorWith(status: number, data: unknown): AxiosError {
    const err = new AxiosError('Request failed')
    err.response = { data, status, statusText: '', headers: {}, config: { headers: {} } as never }
    return err
}

describe('parseErrorCode', () => {
    it('returns the code from the response body', () => {
        const err = axiosErrorWith(400, { code: 'charging_automation_required', message: 'Add a rule.' })
        expect(parseErrorCode(err)).toBe('charging_automation_required')
    })

    it('returns null when the body has no string code', () => {
        expect(parseErrorCode(axiosErrorWith(400, { message: 'Bad.' }))).toBeNull()
        expect(parseErrorCode(axiosErrorWith(400, { code: 42 }))).toBeNull()
        expect(parseErrorCode(axiosErrorWith(400, 'plain text'))).toBeNull()
    })

    it('returns null for non-axios errors', () => {
        expect(parseErrorCode(new Error('network down'))).toBeNull()
        expect(parseErrorCode(undefined)).toBeNull()
    })
})

