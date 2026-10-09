import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index
} from 'drizzle-orm/pg-core';

// ============================================================
// USERS
// ============================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    passwordHash: text('password_hash'), 
        emailVerified: boolean('email_verified').default(false).notNull(), 
    avatarUrl: text('avatar_url'),
    googleId: varchar('google_id', { length: 255 }).unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true })
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email)
  })
);

// ============================================================
// OTP CODES
// ============================================================
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    used: boolean('used').default(false).notNull(),
    attempts: integer('attempts').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
  },
  (table) => ({
    emailIdx: index('otp_email_idx').on(table.email)
  })
);

// ============================================================
// TİPLƏR
// ============================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;