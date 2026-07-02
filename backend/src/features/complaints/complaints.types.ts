import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { COMPLAINT_STATUSES } from '../../types';
import type { ComplaintStatus } from '../../types';

export class CreateComplaintDto {
    @IsString()
    @IsNotEmpty()
    description!: string;

    @IsOptional()
    @IsString()
    trip_id?: string;
}

export class UpdateComplaintStatusDto {
    @IsIn(COMPLAINT_STATUSES)
    status!: ComplaintStatus;
}

export interface ComplaintWithStudent {
    complaint_id: string;
    student_id: string;
    trip_id: string | null;
    description: string;
    status: ComplaintStatus;
    created_at: Date;
    first_name: string;
    last_name: string;
}
