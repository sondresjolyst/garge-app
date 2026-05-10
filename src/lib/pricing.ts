export const VAT_PERCENT = 25;

export function effectivePriceInOre(priceInOre: number, vatEnabled: boolean): number {
    return vatEnabled
        ? Math.round(priceInOre * (1 + VAT_PERCENT / 100))
        : priceInOre;
}

export function vatLabel(vatEnabled: boolean): string {
    return vatEnabled ? 'incl. VAT' : 'excl. VAT';
}
