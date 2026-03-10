/**
 * User Type Definitions
 * 
 * Represents authenticated user in the system.
 */

export interface User {
  user_id: string;              // Unique identifier
  email: string;                // Email address (from OAuth)
  full_name: string;            // Display name
  avatar_url: string | null;    // Profile picture URL
  role: 'professor';            // User role (fixed for MVP)
  created_at: string;           // ISO 8601 timestamp
}

/**
 * Type guard to check if an object is a valid User
 */
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'user_id' in obj &&
    'email' in obj &&
    'full_name' in obj &&
    'role' in obj
  );
}
