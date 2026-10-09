import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  position?: string;
  bio?: string;
  language?: 'az' | 'ru' | 'en';
  avatarUrl?: string;
}

export async function getById(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

export async function update(userId: string, patch: UpdateUserInput) {
  // Yalnız icazə verilən sahələri seç
  const allowed: UpdateUserInput = {};
  if (patch.name !== undefined) allowed.name = patch.name;
  if (patch.email !== undefined) allowed.email = patch.email;
  if (patch.phone !== undefined) allowed.phone = patch.phone;
  if (patch.organization !== undefined) allowed.organization = patch.organization;
  if (patch.position !== undefined) allowed.position = patch.position;
  if (patch.bio !== undefined) allowed.bio = patch.bio;
  if (patch.language !== undefined) allowed.language = patch.language;
  if (patch.avatarUrl !== undefined) allowed.avatarUrl = patch.avatarUrl;

  const [updated] = await db
    .update(users)
    .set({ ...allowed, updatedAt: new Date() })   // ✅ indi schema-da var
    .where(eq(users.id, userId))
    .returning();

  return updated;
}
export async function updateAvatar(userId: string, avatarUrl: string) {
  const [updated] = await db
    .update(users)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}
// Public format — password və s. gizlət
export function toPublic(user: any) {
  if (!user) return null;
  const { passwordHash, googleId, ...rest } = user;
  return rest;
}