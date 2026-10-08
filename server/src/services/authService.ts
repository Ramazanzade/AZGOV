import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db/client';
import { users, otpCodes, User, NewUser } from '../db/schema';

// ============================================================
// USERS
// ============================================================
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] || null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] || null;
};

export const findUserByGoogleId = async (googleId: string): Promise<User | null> => {
  const rows = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return rows[0] || null;
};

export const createUser = async (data: NewUser): Promise<User> => {
  const rows = await db.insert(users).values({
    ...data,
    email: data.email.toLowerCase()
  }).returning();
  return rows[0];
};

export const updateLastLogin = async (userId: string): Promise<void> => {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
};

// ============================================================
// OTP
// ============================================================
const OTP_TTL_MIN = 5;
const MAX_ATTEMPTS = 3;

export const generateOtpCode = (): string => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export const createOtp = async (email: string): Promise<string> => {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

  // Köhnə istifadə olunmamış kodları ləğv et
  await db.update(otpCodes)
    .set({ used: true })
    .where(and(eq(otpCodes.email, email.toLowerCase()), eq(otpCodes.used, false)));

  // Yeni kod
  await db.insert(otpCodes).values({
    email: email.toLowerCase(),
    code,
    expiresAt
  });

  return code;
};

export interface VerifyResult {
  ok: boolean;
  reason?: 'not_found' | 'expired' | 'used' | 'max_attempts' | 'wrong_code';
}

export const verifyOtp = async (email: string, code: string): Promise<VerifyResult> => {
  const rows = await db.select().from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email.toLowerCase()),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  const record = rows[0];
  if (!record) return { ok: false, reason: 'not_found' };

  if (record.attempts >= MAX_ATTEMPTS) {
    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, record.id));
    return { ok: false, reason: 'max_attempts' };
  }

  if (record.code !== code.trim()) {
    await db.update(otpCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpCodes.id, record.id));
    return { ok: false, reason: 'wrong_code' };
  }

  // Uğurlu — istifadə olundu işarələ
  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, record.id));
  return { ok: true };
};

// ============================================================
// UPSERT USER (OTP və ya Google ilə girişdən sonra)
// ============================================================
export const findOrCreateUser = async (email: string, name?: string, googleId?: string, avatarUrl?: string): Promise<User> => {
  let user = await findUserByEmail(email);

  if (user) {
    if (googleId && !user.googleId) {
      const updated = await db.update(users)
        .set({ googleId, lastLoginAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      user = updated[0];
    } else {
      await updateLastLogin(user.id);
    }
    return user;
  }

  return createUser({
    email,
    name: name || email.split('@')[0],
    googleId,
    avatarUrl,
    lastLoginAt: new Date()
  });
};