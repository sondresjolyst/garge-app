export const GROUP_ICONS: { key: string; emoji: string; label: string }[] = [
    { key: 'motorcycle', emoji: '🏍️', label: 'Motorcycle' },
    { key: 'car',        emoji: '🚗', label: 'Car'        },
    { key: 'boat',       emoji: '🚤', label: 'Boat'       },
    { key: 'home',       emoji: '🏠', label: 'Home'       },
    { key: 'building',   emoji: '🏢', label: 'Building'   },
    { key: 'storage',    emoji: '📦', label: 'Storage'    },
    { key: 'other',      emoji: '🔧', label: 'Other'      },
];

/** Returns the emoji for a group icon key, falling back to 🔧 */
export function groupEmoji(key: string | null | undefined): string {
    return GROUP_ICONS.find(i => i.key === key)?.emoji ?? '🔧';
}
