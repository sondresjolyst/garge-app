export interface ElectricitySlot {
    x: number;
    xEnd: number;
    y: number;
}

export const pickCurrentSlot = <T extends ElectricitySlot>(
    slots: T[],
    now: number,
): T | null => slots.find(s => s.x <= now && now < s.xEnd) ?? null;
