export function timeAgo(iso: string | Date): string {
    const date = typeof iso === 'string' ? new Date(iso) : iso
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))

    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

export function formatDuration(startIso: string | Date): string {
    const start = typeof startIso === 'string' ? new Date(startIso) : startIso
    const minutes = Math.max(0, Math.floor((Date.now() - start.getTime()) / 60000))

    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
}

// Same m/h formatting as formatDuration, but for a trip whose end_time is
// already known (a completed trip) rather than ticking against Date.now().
export function formatElapsed(startIso: string | Date, endIso: string | Date): string {
    const start = typeof startIso === 'string' ? new Date(startIso) : startIso
    const end = typeof endIso === 'string' ? new Date(endIso) : endIso
    const minutes = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000))

    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
}
