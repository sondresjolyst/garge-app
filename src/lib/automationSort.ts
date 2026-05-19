import { AutomationRuleDto } from '@/dto/Automation/AutomationRuleDto';
import { Switch } from '@/services/switchService';
import { Sensor } from '@/services/sensorService';

const switchDisplayName = (sw: Switch | undefined): string =>
    (sw?.customName ?? sw?.name ?? '').toLowerCase();

const sensorDisplayName = (s: Sensor | undefined): string =>
    (s?.customName ?? s?.defaultName ?? s?.name ?? '').toLowerCase();

export function sortAutomationRules(
    rules: AutomationRuleDto[],
    switches: Switch[],
    sensors: Sensor[],
): AutomationRuleDto[] {
    const switchById = new Map(switches.map(sw => [sw.id, switchDisplayName(sw)]));
    const sensorById = new Map(sensors.map(s => [s.id, sensorDisplayName(s)]));

    return [...rules].sort((a, b) => {
        if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1;

        const switchCmp = (switchById.get(a.targetId) ?? '').localeCompare(switchById.get(b.targetId) ?? '');
        if (switchCmp !== 0) return switchCmp;

        const sensorCmp = (sensorById.get(a.sensorId) ?? '').localeCompare(sensorById.get(b.sensorId) ?? '');
        if (sensorCmp !== 0) return sensorCmp;

        if (a.threshold !== b.threshold) return a.threshold - b.threshold;

        return a.id - b.id;
    });
}
