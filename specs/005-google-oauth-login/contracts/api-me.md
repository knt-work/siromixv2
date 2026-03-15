# API Contract: GET /api/v1/me

**Feature**: 005 — Real Google OAuth Login  
**Direction**: Frontend → Backend  
**Auth**: Required (Bearer token = Google ID token)

---

## Purpose

This endpoint is the bridge between Google's OAuth identity and the SiroMix user database. It is called by `SessionSync` immediately after a successful Google authentication, once per session establishment.

Two responsibilities in one call:
1. **First login** — Create a new `User` record using Google's immutable `sub` as the key
2. **Subsequent logins** — Return the existing `User` record, refreshing `email`, `display_name`, and `avatar_url` from the latest token

---

## Request

```http
GET /api/v1/me
Authorization: Bearer {google_id_token}
```

**Headers**:
| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer {google_id_token}` | Yes |
| `Content-Type` | N/A (no body) | No |

**No request body.**

---

## Success Response

**Status**: `200 OK`

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "teacher@university.edu",
  "full_name": "Trieu Kiem",
  "avatar_url": "https://lh3.googleusercontent.com/a/...",
  "role": "professor",
  "created_at": "2026-03-15T10:30:00Z"
}
```

**Response Schema** (maps to frontend `User` type):

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | string (UUID) | Internal app ID |
| `email` | string | Current Google email |
| `full_name` | string | Current Google display name |
| `avatar_url` | string \| null | Google profile photo URL |
| `role` | `"professor"` | Fixed for MVP |
| `created_at` | string (ISO 8601) | First login timestamp |

---

## Error Responses

| Status | Condition | Response body |
|--------|-----------|---------------|
| `401 Unauthorized` | Token missing, invalid, or expired | `{"detail": "Invalid or expired token"}` |
| `500 Internal Server Error` | Database error during upsert | `{"detail": "Internal server error"}` |

---

## Frontend Caller: SessionSync

```typescript
// Called from SessionSync.tsx after status === 'authenticated'
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me`, {
  headers: {
    Authorization: `Bearer ${session.idToken}`,
  },
});

if (!response.ok) {
  // FR-010: show modal error + console.error + signOut()
  console.error('[SessionSync] /api/v1/me failed:', response.status, await response.text());
  throw new Error('Backend registration failed');
}

const user: User = await response.json();
authStore.login(user, session.idToken);
```

---

## Backend Implementation Notes

- Already implemented in `backend/app/api/v1/me.py` (Feature 003)
- Token verification via `verify_google_token()` in `backend/app/core/auth.py`
- Upsert logic: `INSERT ... ON CONFLICT (google_sub) DO UPDATE SET email=..., display_name=..., avatar_url=...`
- `DEV_BYPASS_AUTH=true` allows `mock-token-*` tokens in local development

---

## Contract Stability

This contract was established in Feature 003 (exam-artifacts-model). **No changes to this contract in Feature 005.**
