/**
 * Website guest complaint + account-deletion request — POSTs to the backend's
 * no-login /complaints/public endpoint. Identity is a contact email/phone (at
 * least one required) instead of a JWT.
 */
import { postJson } from './backend'

export type ComplaintCategory = 'complaint' | 'account_deletion'

export interface GuestComplaintInput {
    description: string
    trip_id?: string
    contact_email?: string
    contact_phone?: string
    category?: ComplaintCategory
}

export function submitGuestComplaint(input: GuestComplaintInput): Promise<{ complaint_id: string }> {
    return postJson<{ complaint_id: string }>('/complaints/public', input)
}
