import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { hashPassword, verifyPassword } from '../lib/password';
import { signAccessToken, generateRefreshToken, hashRefreshToken } from '../lib/jwt';
import { userPublicSelect } from '../lib/serializers';
import { env } from '../env';

const router = Router();

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

function cookieOpts(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    // Frontend and backend live on different domains in production (e.g.
    // vercel.app vs railway.app), which browsers treat as cross-site — Lax
    // cookies are not sent on cross-site fetch/XHR at all, only 'None' is.
    // 'None' requires Secure, which is only true once cookieSecure is (i.e.
    // in production over HTTPS); local dev keeps 'lax' since it's same-site.
    sameSite: (env.cookieSecure ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}

async function issueTokens(res: Response, userId: string): Promise<void> {
  const accessToken = signAccessToken(userId);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 86400000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashRefreshToken(refreshToken), expiresAt },
  });

  res.cookie(ACCESS_COOKIE, accessToken, cookieOpts(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts(env.refreshTokenTtlDays * 86400000));
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120),
});

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'An account with this email already exists');

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: userPublicSelect,
  });

  await issueTokens(res, user.id);
  res.status(201).json(user);
}));

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = credentialsSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(401, 'Invalid email or password');
  }

  await issueTokens(res, user.id);
  const { passwordHash: _passwordHash, ...publicUser } = user;
  res.json(publicUser);
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new AppError(401, 'No refresh token');

  const tokenHash = hashRefreshToken(token);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token invalid or expired');
  }

  // Rotate: revoke the used token and issue a fresh pair.
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  await issueTokens(res, record.userId);
  res.status(204).end();
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(token) },
      data: { revokedAt: new Date() },
    });
  }
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
  res.status(204).end();
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: userPublicSelect });
  if (!user) throw new AppError(404, 'User not found');
  res.json(user);
}));

export default router;
