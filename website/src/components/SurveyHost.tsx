import { LogoMark } from '@/components/Logo'

interface SurveyHostProps {
    /** What the founder "says" — rendered as a speech bubble. */
    message: string
}

/**
 * The founder talking to the respondent. An avatar + speech bubble that sits
 * above each step so the survey reads like a one-to-one conversation rather
 * than a form. Give it a `key` (e.g. the step index) so the entrance animation
 * replays whenever the message changes.
 */
export function SurveyHost({ message }: SurveyHostProps) {
    return (
        <div className="animate-fade-up flex items-start gap-3">
            <span className="relative shrink-0">
                <LogoMark
                    animated
                    className="shadow-brand-900/10 h-10 w-10 rounded-2xl shadow-sm ring-1 ring-black/5"
                />
                <span className="absolute -right-0.5 -bottom-0.5 block h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
            </span>

            <div className="relative max-w-prose rounded-2xl rounded-tl-sm border border-brand-100 bg-brand-50/70 px-4 py-3">
                {/* little tail pointing back at the avatar */}
                <span
                    className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 border-b border-l border-brand-100 bg-brand-50/70"
                    aria-hidden
                />
                <p className="text-brand-900 text-[15px] leading-relaxed">{message}</p>
            </div>
        </div>
    )
}
