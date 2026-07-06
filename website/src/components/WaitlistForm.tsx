import { useState, type FormEvent } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/components/ui/toast'
import { supabase, PG_UNIQUE_VIOLATION } from '@/lib/supabase'

export function WaitlistForm() {
    const { toast } = useToast()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (loading) return
        setLoading(true)

        const { error } = await supabase
            .from('waitlist')
            .insert({ name: name.trim(), email: email.trim().toLowerCase() })

        setLoading(false)

        if (error) {
            if (error.code === PG_UNIQUE_VIOLATION) {
                toast({
                    variant: 'info',
                    title: 'Already registered',
                    description: 'This email is already on the waitlist.',
                })
            } else {
                toast({
                    variant: 'error',
                    title: 'Something went wrong',
                    description: 'We could not add you to the waitlist. Please try again.',
                })
            }
            return
        }

        setDone(true)
        toast({
            variant: 'success',
            title: "You're on the list",
            description: "We'll reach out when Movio is ready.",
        })
    }

    if (done) {
        return (
            <div className="border-brand-200 bg-brand-50 flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
                <CheckCircle2 className="text-brand-600 h-10 w-10" />
                <p className="text-brand-900 text-lg font-semibold">You're on the list.</p>
                <p className="text-brand-800 text-sm">
                    We'll reach out when Movio is ready to launch.
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="waitlist-name">Name</Label>
                <Input
                    id="waitlist-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    autoComplete="name"
                />
            </div>
            <div>
                <Label htmlFor="waitlist-email">Email</Label>
                <Input
                    id="waitlist-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@whatever.com"
                    required
                    autoComplete="email"
                />
            </div>
            <Button type="submit" size="lg" loading={loading} className="w-full">
                {loading ? 'Adding you...' : 'Notify me when Movio launches'}
            </Button>
        </form>
    )
}
