import { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/toast'

/** The plea we send out — warm, specific, and easy to forward. */
export const SHARE_MESSAGE =
    'I just filled out this quick survey for Movio — a smart FUTA campus transport app for the ' +
    'shuttle, Keke and cabs (live tracking + tap-to-pay) being built as a final year project. ' +
    'It only counts if real FUTA students respond 🙏🏽 Please help a fellow student out:'

interface ShareButtonsProps {
    url: string
}

/** WhatsApp + native share + copy-link row, used on the survey thank-you screen. */
export function ShareButtons({ url }: ShareButtonsProps) {
    const { toast } = useToast()
    const [copied, setCopied] = useState(false)

    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${SHARE_MESSAGE} ${url}`)}`

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast({ variant: 'success', title: 'Link copied — now go paste it everywhere 😄' })
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast({ variant: 'error', title: 'Could not copy link' })
        }
    }

    async function nativeShare() {
        if (!navigator.share) {
            void copyLink()
            return
        }
        try {
            await navigator.share({
                title: 'Movio — FUTA campus shuttle survey',
                text: SHARE_MESSAGE,
                url,
            })
        } catch {
            /* user dismissed the share sheet — nothing to do */
        }
    }

    return (
        <div className="space-y-2.5">
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="block">
                <Button className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5b]" size="lg">
                    <WhatsAppIcon className="h-5 w-5" />
                    Share on WhatsApp
                </Button>
            </a>
            <div className="flex gap-2.5">
                <Button variant="outline" className="flex-1" onClick={nativeShare}>
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
                <Button variant="outline" className="flex-1" onClick={copyLink}>
                    {copied ? (
                        <Check className="text-brand-600 h-4 w-4" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                    {copied ? 'Copied' : 'Copy link'}
                </Button>
            </div>
        </div>
    )
}

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-.213zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
    )
}
