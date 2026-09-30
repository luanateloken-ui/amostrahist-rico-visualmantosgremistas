import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'mantos_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  username: string;
  exp: number;
};

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function digest(value: string) {
  return createHash('sha256').update(value, 'utf8').digest();
}

function safeEqual(a: string, b: string) {
  return timingSafeEqual(digest(a), digest(b));
}

function sessionSecret() {
  return process.env.SESSION_SECRET || '';
}

function sign(payload: string) {
  const secret = sessionSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function adminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD &&
    process.env.SESSION_SECRET
  );
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || '';
  const expectedPassword = process.env.ADMIN_PASSWORD || '';
  if (!expectedUser || !expectedPassword) return false;
  return safeEqual(username.trim(), expectedUser) && safeEqual(password, expectedPassword);
}

export function createAdminSessionToken(username: string) {
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  };
  const encoded = encode(JSON.stringify(payload));
  const signature = sign(encoded);
  if (!signature) throw new Error('SESSION_SECRET não configurado.');
  return `${encoded}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null): SessionPayload | null {
  if (!token || !sessionSecret()) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (!expected || !safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(decode(encoded)) as SessionPayload;
    if (!payload.username || !payload.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isAdminRequest(req: NextRequest) {
  return Boolean(verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value));
}

export const adminSessionMaxAge = SESSION_MAX_AGE_SECONDS;
