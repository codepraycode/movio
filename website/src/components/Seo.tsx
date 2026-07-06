import { useEffect } from 'react'

interface SeoProps {
    /** Full document title for this page. */
    title: string
    /** Meta description; falls back to the site default in index.html if omitted. */
    description?: string
    /** Absolute or root-relative path for the canonical link, e.g. '/live'. */
    path?: string
}

const SITE_ORIGIN = 'https://movioapp.vercel.app'

function setMeta(name: string, content: string) {
    let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
    if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
    }
    el.setAttribute('content', content)
}

function setCanonical(path: string) {
    let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', 'canonical')
        document.head.appendChild(el)
    }
    const href = path.startsWith('http') ? path : `${SITE_ORIGIN}${path}`
    el.setAttribute('href', href)
}

/**
 * Sets per-route document title / description / canonical. The static index.html
 * carries the full OG/Twitter card defaults; this just keeps the title and
 * canonical honest as the user navigates the SPA.
 */
export function Seo({ title, description, path }: SeoProps) {
    useEffect(() => {
        document.title = title
        if (description) setMeta('description', description)
        if (path) setCanonical(path)
    }, [title, description, path])

    return null
}
