import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class TopupCashDto {
    @IsString()
    @IsNotEmpty()
    user_id!: string; // the student's user_id - not matric_no, since not every user has one

    @IsInt()
    @IsPositive()
    amount!: number; // credits to add, must be a positive whole number
}

export interface TopupCashResult {
    wallet_id: string;
    user_id: string;
    balance_credits: number;
    transaction_id: string;
    amount: number;
    created_at: Date;
}
