import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber, openAPI } from 'better-auth/plugins';
import { db } from '@repo/db/client';
import { users, sessions, accounts, verifications } from '@repo/db';

// ============================================================
// Better-Auth Configuration
// ============================================================

const secret = process.env['BETTER_AUTH_SECRET'];
if (!secret) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required');
}

export const auth = betterAuth({
  secret,
  baseURL: process.env['API_URL'] ?? 'http://localhost:3001',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Hook up to Resend or SMTP in production
      console.log(`[Auth] Verification email for ${user.email}: ${url}`);
    },
  },

  socialProviders: {
    google: {
      clientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
      enabled: !!(process.env['GOOGLE_CLIENT_ID'] && process.env['GOOGLE_CLIENT_SECRET']),
    },
  },

  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // Hook up to Twilio/Vonage in production
        console.log(`[Auth] OTP for ${phoneNumber}: ${code}`);
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),
    openAPI(), // Auto-generated API docs at /api/auth/reference
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session every 24h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  advanced: {
    useSecureCookies: process.env['NODE_ENV'] === 'production',
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
