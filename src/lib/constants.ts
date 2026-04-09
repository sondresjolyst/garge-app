export const RANGE_OPTIONS = [
    { label: 'Day',   timeRange: '1d',   groupBy: '30m' },
    { label: 'Week',  timeRange: '1w',   groupBy: '2h'  },
    { label: 'Month', timeRange: '30d',  groupBy: '1d'  },
    { label: 'Year',  timeRange: '365d', groupBy: '1d'  },
] as const;

export type RangeIndex = 0 | 1 | 2 | 3;
