import { describe, it, expect } from 'vitest'
import { unitForType, typeLabel, typeEmoji, formatSensorValue } from '@/lib/typeUtils'

describe('unitForType', () => {
    it('returns °C for temperature', () => expect(unitForType('temperature')).toBe('°C'))
    it('returns % for humidity', () => expect(unitForType('humidity')).toBe('%'))
    it('returns V for voltage', () => expect(unitForType('voltage')).toBe('V'))
    it('returns empty string for unknown', () => expect(unitForType('unknown')).toBe(''))
})

describe('typeLabel', () => {
    it('labels temperature', () => expect(typeLabel('temperature')).toBe('Temperature'))
    it('labels humidity', () => expect(typeLabel('humidity')).toBe('Humidity'))
    it('labels voltage', () => expect(typeLabel('voltage')).toBe('Voltage'))
    it('labels socket', () => expect(typeLabel('socket')).toBe('Smart Socket'))
    it('returns raw string for unknown type', () => expect(typeLabel('foobar')).toBe('foobar'))
})

describe('typeEmoji', () => {
    it('returns thermometer for temperature', () => expect(typeEmoji('temperature')).toBe('🌡️'))
    it('returns droplet for humidity', () => expect(typeEmoji('humidity')).toBe('💧'))
    it('returns bolt for voltage', () => expect(typeEmoji('voltage')).toBe('⚡'))
    it('returns lock for unknown', () => expect(typeEmoji('unknown')).toBe('🔒'))
    it('returns antenna for anything else', () => expect(typeEmoji('foobar')).toBe('📡'))
})

describe('formatSensorValue', () => {
    it('returns — for null', () => expect(formatSensorValue('temperature', null)).toBe('—'))
    it('returns — for undefined', () => expect(formatSensorValue('temperature', undefined)).toBe('—'))
    it('formats temperature to 1 decimal', () => expect(formatSensorValue('temperature', 22.567)).toBe('22.6 °C'))
    it('formats humidity to 1 decimal', () => expect(formatSensorValue('humidity', 54)).toBe('54.0 %'))
    it('formats voltage to 2 decimals', () => expect(formatSensorValue('voltage', 12.1)).toBe('12.10 V'))
    it('handles zero value', () => expect(formatSensorValue('temperature', 0)).toBe('0.0 °C'))
})
