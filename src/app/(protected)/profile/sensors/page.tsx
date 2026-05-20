"use client"

import SensorService, { Sensor } from '@/services/sensorService';
import { DeviceManagePage, DevicePageConfig } from '@/components/DeviceManagePage';

const config: DevicePageConfig<Sensor> = {
    title: 'Sensors',
    itemLabel: 'sensor',
    emoji: '🌡️',
    fetchAll: () => SensorService.getAllSensors(),
    claim: (code) => SensorService.claimSensor(code),
    unclaim: (id) => SensorService.unclaimSensor(id),
    updateName: (id, name) => SensorService.updateCustomName(id, name),
    getDisplayName: (s) => s.customName ?? s.defaultName ?? '',
    getDefaultName: (s) => s.defaultName ?? undefined,
    suspend: (id) => SensorService.suspendSensor(id),
    activate: (id) => SensorService.activateSensor(id),
};

export default function SensorsPage() {
    return <DeviceManagePage config={config} />;
}
