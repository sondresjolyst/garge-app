export function statusColor(status: string): string {
    switch (status) {
        case 'Active':
        case 'Paid':
            return 'bg-green-500/20 border-green-500/30 text-green-400';
        case 'Reserved':
        case 'Pending':
            return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
        case 'Cancelled':
        case 'Failed':
            return 'bg-red-500/20 border-red-500/30 text-red-400';
        default:
            return 'bg-gray-700/50 border-gray-600/40 text-gray-500';
    }
}
