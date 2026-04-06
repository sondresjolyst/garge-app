const LOCALE = 'nb-NO'

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
}

const DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
    ...DATE_OPTIONS,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
}

export function formatDate(date: Date | string | number): string {
    return new Date(date).toLocaleDateString(LOCALE, DATE_OPTIONS)
}

export function formatDateTime(date: Date | string | number): string {
    return new Date(date).toLocaleString(LOCALE, DATETIME_OPTIONS)
}
