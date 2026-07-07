import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from '../../types';
import type { ComplaintCategory, ComplaintStatus } from '../../types';

export class CreateComplaintDto {
    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsOptional()
    @IsString()
    trip_id?: string;
}

/**
 * Website (no login) complaint / account-deletion request. Identity is a
 * contact email or phone (at least one required) instead of a JWT. Each of the
 * two contact fields is required only when the *other* is empty — @ValidateIf
 * is class-validator's clean way to express "one or the other."
 */
export class CreateGuestComplaintDto {
    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsOptional()
    @IsString()
    trip_id?: string;

    @ValidateIf((o: CreateGuestComplaintDto) => !o.contact_phone)
    @IsEmail({}, { message: 'contact_email must be a valid email (or provide contact_phone instead)' })
    @IsNotEmpty()
    contact_email?: string;

    @ValidateIf((o: CreateGuestComplaintDto) => !o.contact_email)
    @IsString()
    @IsNotEmpty({ message: 'Provide a contact email or phone so we can respond' })
    contact_phone?: string;

    // Defaults to 'complaint' server-side; the account-deletion page sends
    // 'account_deletion' explicitly.
    @IsOptional()
    @IsIn(COMPLAINT_CATEGORIES)
    category?: ComplaintCategory;
}

export class UpdateComplaintStatusDto {
    @IsIn(COMPLAINT_STATUSES)
    status!: ComplaintStatus;
}

export interface ComplaintWithStudent {
    complaint_id: string;
    student_id: string | null;
    trip_id: string | null;
    description: string;
    status: ComplaintStatus;
    category: ComplaintCategory;
    contact_email: string | null;
    contact_phone: string | null;
    created_at: Date;
    // null for a guest submission (student_id is null) — the admin UI shows
    // "Guest — <email/phone>" in that case.
    first_name: string | null;
    last_name: string | null;
}
