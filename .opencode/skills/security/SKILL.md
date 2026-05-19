---
name: security
description: |
  Use this skill on EVERY piece of code that handles user input, authentication, file uploads, API routes, database queries, or any external data — without exception. Activate immediately when: building login/register flows, handling file uploads, creating API endpoints, writing database queries, managing sessions or tokens, or reviewing any existing backend code. Frontend data is NEVER trusted — all validation happens server-side. This skill covers 25+ attack vectors with concrete defenses, enforces argon2id for passwords, and automatically calls the security-tester skill to run penetration tests against the finished code. No code that handles sensitive operations should be delivered without running this skill first.
---

# Security

Security is not a feature you add at the end — it's a constraint that shapes every decision from the start. This skill applies to every layer that touches user data, authentication, file uploads, or external communication.

**Core axiom: The frontend is untrusted. Always. Without exception.**

A user, a script, a bot, or an attacker can send any HTTP request to your API. Client-side validation, client-side authentication checks, and client-side permission logic are UX conveniences — they provide zero security. Every security decision must be enforced on the server.

---

## Section 1: Authentication & Password Security

### Use Argon2id for All Passwords

Argon2id is the current best practice for password hashing. It's resistant to GPU attacks, side-channel attacks, and time-memory tradeoff attacks. Never use bcrypt (weaker), MD5/SHA (not password hashing algorithms), or plain text.

```typescript
import * as argon2 from 'argon2'

// Hashing — use during registration and password change
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 65536,   // 64 MB — makes GPU attacks expensive
    timeCost: 3,         // 3 iterations
    parallelism: 4,      // 4 threads
  })
}

// Verification — use during login
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain)
  } catch {
    return false  // argon2.verify throws on malformed hash — never expose this
  }
}
```

### JWT Security

```typescript
// WRONG — weak secret, no expiry, no algorithm pinning
jwt.sign({ userId }, 'secret')

// RIGHT — strong secret, short expiry, explicit algorithm
jwt.sign(
  { userId, iat: Date.now() },
  process.env.JWT_SECRET!,  // min 256-bit random secret
  { algorithm: 'HS256', expiresIn: '15m' }  // short-lived access token
)

// Refresh token — longer lived, stored in httpOnly cookie
jwt.sign(
  { userId, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET!,
  { algorithm: 'HS256', expiresIn: '7d' }
)

// Verification — always verify on every protected request
function verifyAccessToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] }) as { userId: string }
  } catch {
    return null  // expired, malformed, wrong signature — all treated the same
  }
}
```

---

## Section 2: Input Validation — Server Always, Frontend Optional

```typescript
// Every API route that receives data must validate with Zod
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  content: z.string().min(1).max(50000).trim(),
  // author, userId, role — NEVER accepted from client
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = CreatePostSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 })
  }

  // result.data has only the fields we allowed — Zod strips everything else
  const authorId = getAuthenticatedUserId(req)  // server determines author, not client
  await createPost({ ...result.data, authorId })
}
```

---

## Section 3: File Upload Security

File uploads are one of the highest-risk attack surfaces. A single unprotected upload endpoint can allow malware delivery, server compromise, or data exfiltration.

```typescript
import sharp from 'sharp'
import { ExifParser } from 'exif-parser'

const UPLOAD_CONFIG = {
  maxSizeBytes: 5 * 1024 * 1024,   // 5 MB hard limit
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
}

export async function handleImageUpload(file: File): Promise<Result<string>> {
  // 1. Size check — before reading content
  if (file.size > UPLOAD_CONFIG.maxSizeBytes) {
    return Result.fail('File too large', 'FILE_TOO_LARGE')
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // 2. MIME type validation — from file content, NOT the client-sent Content-Type
  const { fileTypeFromBuffer } = await import('file-type')
  const detected = await fileTypeFromBuffer(buffer)

  if (!detected || !UPLOAD_CONFIG.allowedMimeTypes.includes(detected.mime)) {
    return Result.fail('Invalid file type', 'INVALID_TYPE')
    // Note: a .jpg file containing a PHP script will fail here because
    // file-type reads the actual magic bytes, not the extension or Content-Type
  }

  // 3. Strip ALL metadata (EXIF can contain GPS, malware payloads, hidden scripts)
  const stripped = await sharp(buffer)
    .rotate()           // apply EXIF rotation, then strip EXIF
    .toBuffer({ resolveWithObject: true })

  // 4. Re-encode through sharp to neutralize any steganographic payloads
  const sanitized = await sharp(stripped.data)
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()

  // 5. Generate unpredictable filename — never use original filename
  const filename = `${crypto.randomUUID()}.jpg`

  // 6. Store in isolated bucket, not web root
  const url = await storageService.upload(filename, sanitized, 'image/jpeg')

  return Result.ok(url)
}
```

**Why each step matters:**
- Size check: prevents DoS via huge files
- Content-based MIME detection: prevents extension spoofing (malware.php renamed to photo.jpg)
- EXIF stripping: removes GPS data, removes malware in EXIF comment fields
- Re-encoding through sharp: neutralizes steganographic payloads embedded in valid images
- Random filename: prevents enumeration and overwrite attacks

---

## Section 4: Security Headers

```typescript
// middleware.ts or next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'nonce-{nonce}'",   // nonce-based, no unsafe-inline
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
    ].join('; ')
  },
]
```

---

## Section 5: Rate Limiting & DDoS Protection

```typescript
// lib/rateLimit.ts
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, number[]>({ max: 10000 })

export function rateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  const requests = (cache.get(identifier) ?? []).filter(t => t > windowStart)

  if (requests.length >= maxRequests) return false

  cache.set(identifier, [...requests, now])
  return true
}

// In API routes
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const allowed = rateLimit(`login:${ip}`, 5, 60_000)  // 5 attempts per minute

  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }
  // ...
}
```

---

## Section 6: Attack Catalog Reference

This skill covers 25+ attack vectors. For the complete catalog with defenses for each, read:

→ `references/attack-catalog.md` — full list with code examples for every attack type

**Quick reference — categories covered:**
- Injection: SQL, NoSQL, Command, LDAP, XML/XXE, Template injection
- Authentication: Credential stuffing, Brute force, JWT attacks, Session fixation, OAuth misconfiguration
- File attacks: Upload bypass, Path traversal, Zip bombs, Malicious EXIF, Polyglot files
- Web: XSS (reflected/stored/DOM), CSRF, Clickjacking, Open redirect, SSRF, CORS misconfiguration
- DoS: Resource exhaustion, ReDoS (regex), Slowloris, Large payload flooding
- Data: Mass assignment, IDOR (Insecure Direct Object Reference), Sensitive data exposure, API key leakage
- Infrastructure: Dependency confusion, Secret scanning, Environment variable exposure

---

## Section 7: Invoke the Security Tester

After implementing any security-sensitive feature — authentication, file uploads, API routes, database queries, session management — call the `security-tester` skill to run automated penetration tests against the code.

```
→ Use skill: security-tester
→ Provide: the routes, services, and file paths to test
→ Review: the test report and fix any findings before delivering
```

The security-tester runs injection attempts, authentication bypass attempts, file upload bypass attempts, rate limit bypass attempts, and data extraction probes against your actual implementation. No security-sensitive feature should be delivered without passing the security-tester.

---

## Pre-Delivery Security Checklist

- [ ] Passwords hashed with argon2id (not bcrypt, not SHA, never plain)
- [ ] All frontend data validated with Zod schema server-side
- [ ] Sensitive fields (role, admin, permissions) excluded from client schemas
- [ ] File uploads: size limit, content-based MIME detection, EXIF stripped, re-encoded
- [ ] JWT: short expiry, strong secret, algorithm pinned
- [ ] Security headers configured
- [ ] Rate limiting on auth endpoints and sensitive routes
- [ ] RLS policies on database tables
- [ ] No secrets in code or NEXT_PUBLIC_ variables
- [ ] `security-tester` skill run and report reviewed

---

## Self-Observation

```json
{
  "skill": "security",
  "observation_type": "missing_coverage | conflict_with_stack | ambiguous_instruction",
  "description": "[what attack vector or defense the skill didn't cover]",
  "suggested_improvement": "[what would have helped]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.
