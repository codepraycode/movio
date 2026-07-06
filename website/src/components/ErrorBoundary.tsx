import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Logo } from '@/components/Logo'

interface Props {
    children: ReactNode
}

interface State {
    error: Error | null
}

/**
 * Catches render-time errors anywhere below it so a single broken component
 * shows a friendly recovery screen instead of a blank white page. Error
 * boundaries must be class components — React has no hook equivalent.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Surfaced in the console for debugging; swap for a logging service later.
        console.error('[movio] Unhandled UI error:', error, info.componentStack)
    }

    handleReload = () => {
        // Full reload is the most reliable reset after a render crash.
        window.location.reload()
    }

    render() {
        if (!this.state.error) return this.props.children

        return (
            <div className="flex min-h-screen flex-col bg-neutral-50">
                <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
                        <a href="/" className="transition-transform hover:scale-[1.03]">
                            <Logo />
                        </a>
                    </div>
                </header>

                <main className="flex flex-1 items-center justify-center px-4 py-16">
                    <div className="max-w-md text-center">
                        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <AlertTriangle className="h-8 w-8" />
                        </span>
                        <p className="mt-6 text-sm font-semibold tracking-wide text-red-600 uppercase">
                            Something broke
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-neutral-900">
                            We hit a bump in the road
                        </h1>
                        <p className="mt-3 text-neutral-600">
                            An unexpected error stopped this page from loading. Reloading usually
                            fixes it — your survey progress on the server is safe.
                        </p>
                        {import.meta.env.DEV && (
                            <pre className="mt-4 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-left text-xs text-red-300">
                                {this.state.error.message}
                            </pre>
                        )}
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                                onClick={this.handleReload}
                                className="bg-brand-600 hover:bg-brand-700 inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-medium text-white shadow-sm transition-colors"
                            >
                                Reload page
                            </button>
                            <a
                                href="/"
                                className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 text-base font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
                            >
                                Back to home
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        )
    }
}
