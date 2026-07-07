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

/**
 * Website Transit Credit top-up (no login). The visitor identifies the account
 * by matric number OR email — whichever they type — and pays via Paystack.
 */
export class InitiateAppTopupDto {
    @IsString()
    @IsNotEmpty()
    identifier!: string; // matric_no OR email, either accepted

    @IsInt()
    @IsPositive()
    amount_naira!: number;
}

export class VerifyAppTopupDto {
    @IsString()
    @IsNotEmpty()
    reference!: string;
}

export interface InitiateAppTopupResult {
    access_code: string;
    reference: string;
    first_name: string; // shown back for confirmation — nothing else about the account is leaked
    credits: number; // how many Transit Credits this amount buys
}

export interface VerifyAppTopupResult {
    credits_added: number;
    balance_credits: number;
    first_name: string;
}
