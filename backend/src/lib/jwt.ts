import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../env';

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  const options: jwt.SignOptions = { expiresIn: env.accessTokenTtl as jwt.SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId }, env.jwtAccessSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}

// Refresh tokens are opaque high-entropy random strings, not JWTs: they are
// looked up by their hash in the database, which is what makes them revocable.
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
