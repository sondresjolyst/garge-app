"use client"

import SwitchService, { Switch } from '@/services/switchService';
import { DeviceManagePage, DevicePageConfig } from '@/components/DeviceManagePage';

const config: DevicePageConfig<Switch> = {
    title: 'Sockets',
    itemLabel: 'socket',
    emoji: '🔌',
    fetchAll: () => SwitchService.getAllSwitches(),
    claim: (code) => SwitchService.claimSwitch(code),
    unclaim: (id) => SwitchService.unclaimSwitch(id),
    updateName: (id, name) => SwitchService.updateCustomName(id, name),
    getDisplayName: (sw) => sw.customName ?? sw.name,
    getDefaultName: (sw) => sw.name,
    listShares: (id) => SwitchService.getSwitchShares(id),
    share: (id, email, permission) => SwitchService.shareSwitch(id, email, permission),
    revokeShare: (id, userId) => SwitchService.revokeSwitchShare(id, userId),
};

export default function SocketsPage() {
    return <DeviceManagePage config={config} />;
}
