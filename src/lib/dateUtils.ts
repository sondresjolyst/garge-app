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

export function formatRelative(date: Date | string | number, now: Date = new Date()): string {
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    if (diffMs < 0) return 'just now'
    const sec = Math.round(diffMs / 1000)
    if (sec < 60) return 'just now'
    const min = Math.round(sec / 60)
    if (min < 60) return `${min} min ago`
    const hr = Math.round(min / 60)
    if (hr < 24) return `${hr} h ago`
    const days = Math.round(hr / 24)
    if (days < 30) return `${days} d ago`
    const months = Math.round(days / 30)
    if (months < 12) return `${months} mo ago`
    const years = Math.round(months / 12)
    return `${years} y ago`
}
