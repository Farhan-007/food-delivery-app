import { createAuthClient } from 'better-auth/client';
import { phoneNumberClient } from 'better-auth/client/plugins';

// ============================================================
// Better-Auth Client (used in web/mobile apps)
// ============================================================

export const authClient = createAuthClient({
  baseURL: process.env['NEXT_PUBLIC_API_URL'] ?? process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3001',
  plugins: [phoneNumberClient()],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;
