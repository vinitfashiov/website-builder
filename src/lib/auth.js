import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db/client';

const ACCESS_TOKEN_EXPIRE_MINUTES = Number(process.env.ACCESS_TOKEN_EXPIRE_MINUTES ?? 30 * 24 * 60);
const JWT_SECRET = process.env.JWT_SECRET_KEY ?? 'change-me-in-production';
const JWT_ALGORITHM = 'HS256';

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

export function createAccessToken(payload) {
  const expiresIn = ACCESS_TOKEN_EXPIRE_MINUTES * 60;
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
}

export async function getUserById(id) {
  const db = await getDb();
  const user = await db.collection('users').findOne({ id }, { projection: { _id: 0 } });
  return user;
}

export async function getUserFromRequest(request) {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length);

  try {
    const decoded = verifyAccessToken(token);
    const userId = decoded?.sub;
    if (!userId) {
      return null;
    }

    const user = await getUserById(userId);
    return user ?? null;
  } catch (error) {
    return null;
  }
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

