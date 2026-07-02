import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { USER_ROLES } from '../../types';
import type { User, UserRole } from '../../types';

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
    @IsIn(USER_ROLES)
    role?: UserRole;
}

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}

export interface AuthResult {
    user: Omit<User, 'password_hash'>;
    token: string;
}
