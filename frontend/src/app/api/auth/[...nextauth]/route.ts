/**
 * NextAuth.js route handler for Google OAuth authentication.
 * 
 * Configures Google Provider and stores ID token in JWT for backend API calls.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
