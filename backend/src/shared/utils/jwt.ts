import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JwtTokenPayload } from '../types/express';
import { SESSION_SECRET, SESSION_EXPIRES_IN } from '../../config/session.config';

const EXPIRES_IN = SESSION_EXPIRES_IN as SignOptions['expiresIn'];

export function signToken(payload: Pick<JwtTokenPayload, 'user_id' | 'role'>): string {
    return jwt.sign(payload, SESSION_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtTokenPayload {
    return jwt.verify(token, SESSION_SECRET) as JwtTokenPayload;
}
