import type { ReactNode } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Seo } from '@/components/Seo'

export interface DocSection {
    heading: string
    paragraphs: string[]
}

interface LegalLayoutProps {
    title: string
    lastUpdated: string
    intro: string
    sections: DocSection[]
    /** Route path for canonical + SEO. */
    path: string
    seoDescription: string
    /** Optional trailing note (e.g. the "not lawyer-reviewed" disclaimer). */
    footnote?: ReactNode
}

/**
 * Shared shell for the Privacy Policy / Terms of Service pages. Content is kept
 * honest and project-accurate (mirrors the mobile app's LegalContent) rather
 * than boilerplate — these describe what MovIO actually does.
 */
export function LegalLayout({
    title,
    lastUpdated,
    intro,
    sections,
    path,
    seoDescription,
    footnote,
}: LegalLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Seo title={`${title} — Movio`} description={seoDescription} path={path} />
            <Navbar />

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:py-20">
                <p className="text-brand-600 text-sm font-semibold tracking-wide uppercase">
                    Movio · Legal
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                    {title}
                </h1>
                <p className="mt-2 text-sm text-neutral-500">Last updated: {lastUpdated}</p>

                <p className="mt-8 text-[15px] leading-relaxed text-neutral-700">{intro}</p>

                <div className="mt-10 space-y-10">
                    {sections.map((s) => (
                        <section key={s.heading}>
                            <h2 className="text-lg font-bold text-neutral-900">{s.heading}</h2>
                            <div className="mt-3 space-y-3">
                                {s.paragraphs.map((p, i) => (
                                    <p
                                        key={i}
                                        className="text-[15px] leading-relaxed text-neutral-600"
                                    >
                                        {p}
                                    </p>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {footnote && (
                    <div className="border-brand-100 bg-brand-50/50 mt-12 rounded-2xl border p-5 text-sm leading-relaxed text-neutral-600">
                        {footnote}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}
