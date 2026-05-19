import { describe, it, expect } from 'vitest'
import { sortAutomationRules } from '@/lib/automationSort'
import { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto'
import { Switch } from '@/services/switchService'
import { Sensor } from '@/services/sensorService'

function rule(partial: Partial<AutomationRuleDto> & { id: number }): AutomationRuleDto {
    return {
        targetType: 'switch',
        targetId: 0,
        sensorType: 'temperature',
        sensorId: 0,
        condition: '<',
        threshold: 0,
        action: 'on',
        isEnabled: true,
        lastTriggeredAt: null,
        ...partial,
    }
}

function sw(id: number, name: string, customName?: string): Switch {
    return { id, name, customName } as Switch
}

function sensor(id: number, name: string, customName?: string, defaultName?: string): Sensor {
    return { id, name, customName: customName ?? '', defaultName: defaultName ?? '' } as Sensor
}

describe('sortAutomationRules', () => {
    it('puts enabled rules before disabled ones', () => {
        const rules = [
            rule({ id: 1, isEnabled: false, targetId: 1 }),
            rule({ id: 2, isEnabled: true,  targetId: 1 }),
        ]
        const switches = [sw(1, 'heater')]
        const result = sortAutomationRules(rules, switches, [])
        expect(result.map(r => r.id)).toEqual([2, 1])
    })

    it('sorts by target switch name (customName preferred)', () => {
        const rules = [
            rule({ id: 1, targetId: 3 }),
            rule({ id: 2, targetId: 1 }),
            rule({ id: 3, targetId: 2 }),
        ]
        const switches = [
            sw(1, 'sw-a', 'Charlie'),
            sw(2, 'sw-b', 'Alpha'),
            sw(3, 'sw-c', 'Bravo'),
        ]
        const result = sortAutomationRules(rules, switches, [])
        expect(result.map(r => r.id)).toEqual([3, 1, 2])
    })

    it('breaks ties on same switch by sensor name', () => {
        const rules = [
            rule({ id: 1, targetId: 1, sensorId: 2 }),
            rule({ id: 2, targetId: 1, sensorId: 1 }),
        ]
        const switches = [sw(1, 'heater')]
        const sensors = [
            sensor(1, 's-1', 'Zebra'),
            sensor(2, 's-2', 'Apple'),
        ]
        const result = sortAutomationRules(rules, switches, sensors)
        expect(result.map(r => r.id)).toEqual([1, 2])
    })

    it('breaks ties on same switch + sensor by threshold ascending', () => {
        const rules = [
            rule({ id: 1, targetId: 1, sensorId: 1, threshold: 20 }),
            rule({ id: 2, targetId: 1, sensorId: 1, threshold: 10 }),
        ]
        const switches = [sw(1, 'heater')]
        const sensors = [sensor(1, 's-1', 'Apple')]
        const result = sortAutomationRules(rules, switches, sensors)
        expect(result.map(r => r.id)).toEqual([2, 1])
    })

    it('falls back to id when all keys equal', () => {
        const rules = [
            rule({ id: 5, targetId: 1, sensorId: 1, threshold: 10 }),
            rule({ id: 2, targetId: 1, sensorId: 1, threshold: 10 }),
            rule({ id: 8, targetId: 1, sensorId: 1, threshold: 10 }),
        ]
        const switches = [sw(1, 'heater')]
        const sensors = [sensor(1, 's-1', 'Apple')]
        const result = sortAutomationRules(rules, switches, sensors)
        expect(result.map(r => r.id)).toEqual([2, 5, 8])
    })

    it('handles missing switch or sensor lookup gracefully', () => {
        const rules = [
            rule({ id: 1, targetId: 999, sensorId: 999 }),
            rule({ id: 2, targetId: 1, sensorId: 1 }),
        ]
        const switches = [sw(1, 'heater')]
        const sensors = [sensor(1, 's-1', 'Apple')]
        const result = sortAutomationRules(rules, switches, sensors)
        expect(result.map(r => r.id)).toEqual([1, 2])
    })

    it('does not mutate the input array', () => {
        const rules = [
            rule({ id: 1, isEnabled: false }),
            rule({ id: 2, isEnabled: true }),
        ]
        const original = rules.map(r => r.id)
        sortAutomationRules(rules, [], [])
        expect(rules.map(r => r.id)).toEqual(original)
    })
})
