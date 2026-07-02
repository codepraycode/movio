import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

const ROLES = ['student', 'driver', 'transport_personnel', 'admin'] as const;

export class RegisterDto {
    @IsOptional()
    @IsString()
    matric_no?: string; // required for students, checked in auth.service.ts (depends on role)

    @IsString()
    @IsNotEmpty()
    first_name!: string;

    @IsString()
    @IsNotEmpty()
    last_name!: string;

    @IsEmail()
    email!: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsOptional()
    @IsIn(ROLES)
    role?: string;
}

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}

export interface AuthResult {
    user: Record<string, unknown>;
    token: string;
}
