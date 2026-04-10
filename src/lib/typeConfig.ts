import { FireIcon, CloudIcon, BoltIcon, CpuChipIcon, PowerIcon } from '@heroicons/react/24/outline';
import { Battery0Icon, Battery50Icon, Battery100Icon } from '@heroicons/react/24/outline';
import type React from 'react';

type SvgIcon = React.FC<React.SVGProps<SVGSVGElement>>;

export interface TypeEntry {
    Icon: SvgIcon;
    iconBg: string;
    iconColor: string;
    label: string;
}

export const TYPE_CONFIG: Record<string, TypeEntry> = {
    temperature: { Icon: FireIcon,  iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400', label: 'Temperature' },
    humidity:    { Icon: CloudIcon, iconBg: 'bg-blue-500/15',   iconColor: 'text-blue-400',   label: 'Humidity'    },
    voltage:     { Icon: BoltIcon,  iconBg: 'bg-yellow-500/15', iconColor: 'text-yellow-400', label: 'Voltage'     },
    socket:      { Icon: PowerIcon, iconBg: 'bg-green-500/15',  iconColor: 'text-green-400',  label: 'Socket'      },
};

export const DEFAULT_TYPE: TypeEntry = {
    Icon: CpuChipIcon,
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    label: 'Device',
};

export interface StatusEntry {
    color: string;
    label: string;
    Icon: SvgIcon;
}

export const BATTERY_STATUS_CONFIG: Record<string, StatusEntry> = {
    good:      { color: 'text-green-400',  label: 'Good',      Icon: Battery100Icon },
    attention: { color: 'text-yellow-400', label: 'Attention', Icon: Battery50Icon  },
    replace:   { color: 'text-red-400',    label: 'Replace',   Icon: Battery0Icon   },
    learning:  { color: 'text-gray-500',   label: 'Learning',  Icon: Battery50Icon  },
};
