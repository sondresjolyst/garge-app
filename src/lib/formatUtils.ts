export function formatNok(ore: number): string {
    return `NOK ${(ore / 100).toFixed(2).replace('.', ',')}`;
}
