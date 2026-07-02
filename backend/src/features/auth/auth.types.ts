export interface RegisterRequestBody {
    matric_no?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    role?: string;
}

export interface LoginRequestBody {
    email: string;
    password: string;
}

export interface AuthResult {
    user: Record<string, unknown>;
    token: string;
}
