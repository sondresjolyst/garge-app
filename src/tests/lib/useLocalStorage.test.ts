import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/lib/useLocalStorage'

beforeEach(() => localStorage.clear())

describe('useLocalStorage', () => {
    it('returns default value when key absent', () => {
        const { result } = renderHook(() => useLocalStorage('key', 'default'))
        expect(result.current[0]).toBe('default')
    })

    it('reads existing value from localStorage', () => {
        localStorage.setItem('key', JSON.stringify('saved'))
        const { result } = renderHook(() => useLocalStorage('key', 'default'))
        expect(result.current[0]).toBe('saved')
    })

    it('updates state and persists to localStorage', () => {
        const { result } = renderHook(() => useLocalStorage('key', 'default'))
        act(() => result.current[1]('updated'))
        expect(result.current[0]).toBe('updated')
        expect(JSON.parse(localStorage.getItem('key')!)).toBe('updated')
    })

    it('falls back to default on corrupt localStorage value', () => {
        localStorage.setItem('key', 'not-json{{{')
        const { result } = renderHook(() => useLocalStorage('key', 'fallback'))
        expect(result.current[0]).toBe('fallback')
    })

    it('works with non-string types', () => {
        const { result } = renderHook(() => useLocalStorage<number>('num', 0))
        act(() => result.current[1](42))
        expect(result.current[0]).toBe(42)
        expect(JSON.parse(localStorage.getItem('num')!)).toBe(42)
    })
})
