---
name: security-tester
description: |
  Use this skill to run automated security tests against your own code, routes, database access patterns, and API endpoints. Called automatically by the security skill after implementing authentication, file uploads, or any sensitive feature. Also activate directly when: "test security", "run pen test", "check for vulnerabilities", "security audit", "test my API routes", "check injection", "test authentication", "verify my defenses". Runs injection probes, authentication bypass attempts, authorization escalation tests, file upload bypass attempts, rate limit tests, data extraction probes, and database infiltration attempts — against your actual implementation. Produces a findings report with severity levels. Nothing ships without passing this.
---

# Security Tester

Attacks your own code before an attacker does. Runs a structured battery of security probes against your implementation and reports findings with severity levels and remediation guidance.

## How This Skill Works

This skill reads your actual code — routes, services, middleware, schemas — and generates targeted test cases based on what it finds. It then simulates attacker behavior against each surface and reports what would succeed.

This is not static analysis. It reasons about what an attacker would actually try against your specific implementation, based on the code it reads.

For tests that require a running server (e.g. Test C1 — access another user's resource): reason about what the code would do if the attack were attempted. Read the route handler — does it check ownership before returning data? If the ownership check is missing from the code, mark it as a finding without needing a live server. The goal is code-level reasoning, not just runtime probing.

---

## Step 1: Map the Attack Surface

Before running any tests, read the code to understand what needs testing:

```
Read:
- All files in src/app/api/ or pages/api/  → API routes
- All middleware files                      → Auth and rate limiting
- All service files                         → Data access patterns
- All schema files                          → Input validation coverage
- Upload handlers                           → File processing
- Auth-related files                        → Login, register, token handling
```

Build a surface map:
```
ATTACK SURFACE MAP
==================
Public routes (no auth required):
  POST /api/auth/login
  POST /api/auth/register

Protected routes (auth required):
  GET  /api/users/:id
  PATCH /api/users/:id
  DELETE /api/posts/:id

File upload endpoints:
  POST /api/upload/image

External data accepted: [list every field accepted from client]
Auth mechanism: [JWT / session / Supabase / Clerk]
Database: [Supabase / Prisma / Drizzle]
```

---

## Step 2: Run the Test Battery

For each surface identified, run the applicable test categories. Document what you tested and what the result was.

### Test Category A: Injection Probes

For every route that accepts string input, attempt:

```
SQL injection payloads:
  ' OR '1'='1
  '; DROP TABLE users; --
  1 UNION SELECT * FROM users
  admin'--
  ' OR 1=1--

NoSQL injection payloads:
  { "$gt": "" }
  { "$ne": null }
  { "$where": "sleep(5000)" }

Command injection payloads:
  ; ls -la
  | cat /etc/passwd
  `whoami`
  $(id)

XSS payloads:
  <script>alert(1)</script>
  <img src=x onerror=alert(1)>
  javascript:alert(1)
  "><svg/onload=alert(1)>

Template injection payloads:
  {{7*7}}
  <%= 7*7 %>
  ${7*7}
```

**Expected result for each:** Input rejected by schema validation with 400 error. If the payload reaches the database query or response, it's a finding.

**Finding format:**
```
[CRITICAL] SQL Injection — POST /api/posts
Payload: title = "'; DROP TABLE posts; --"
Result: Payload reached database query without sanitization
Expected: Schema validation should reject non-string or Zod .trim() should neutralize
```

### Test Category B: Authentication Bypass

```
Test B1: Missing Authorization header
  → Send request to every protected route without token
  → Expected: 401 Unauthorized
  → Finding if: any protected route responds with data

Test B2: Malformed token
  → Send: Authorization: Bearer invalid.token.here
  → Expected: 401 Unauthorized
  → Finding if: any route accepts malformed token

Test B3: Expired token
  → Construct a token with exp set to past timestamp
  → Expected: 401 Unauthorized
  → Finding if: expired token accepted

Test B4: Algorithm confusion (none)
  → Construct JWT with { "alg": "none" } header, no signature
  → Expected: 401 Unauthorized
  → Finding if: none-algorithm token accepted

Test B5: Algorithm switching
  → If RS256 is used, sign a new token with HS256 using the public key as HMAC secret
  → Expected: 401 Unauthorized
  → Finding if: switched-algorithm token accepted

Test B6: Token with elevated claims
  → Construct valid-looking token with { role: "admin", userId: "attacker" }
  → Expected: Token rejected or role claim ignored
  → Finding if: role claim from token is used without server-side verification
```

### Test Category C: Authorization Escalation (IDOR)

```
Test C1: Access another user's resource
  → As user A, request GET /api/users/[user_B_id]/data
  → Expected: 403 Forbidden
  → Finding if: user A can read user B's private data

Test C2: Modify another user's resource
  → As user A, send PATCH /api/users/[user_B_id] with modified data
  → Expected: 403 Forbidden
  → Finding if: user A can modify user B's data

Test C3: Privilege escalation via request body
  → Send PATCH /api/users/[own_id] with body: { role: "admin" }
  → Expected: role field stripped or rejected
  → Finding if: role is updated to admin

Test C4: Horizontal privilege escalation via ID manipulation
  → Try sequential IDs: /api/posts/1, /api/posts/2, /api/posts/3
  → Expected: only own posts returned, 403 for others
  → Finding if: other users' posts accessible
```

### Test Category D: File Upload Bypass

```
Test D1: Oversized file
  → Upload a file exceeding the configured size limit
  → Expected: 413 or 400 rejection before processing
  → Finding if: large file processed

Test D2: MIME type spoofing
  → Upload a PHP/JS/HTML file renamed to photo.jpg
  → Set Content-Type: image/jpeg
  → Expected: Rejected by content-based MIME detection
  → Finding if: file accepted based on extension or header alone

Test D3: Malicious filename
  → Upload with filename: "../../etc/passwd" or "../config.env"
  → Expected: server generates its own filename, ignores client filename
  → Finding if: client filename used in storage path

Test D4: Upload to predictable path
  → If a file was just uploaded, can you guess the URL of the next upload?
  → Expected: UUIDs or random names — not sequential
  → Finding if: filenames are predictable (timestamp-based, sequential)

Test D5: Polyglot file
  → Upload a file that is simultaneously a valid JPEG and a valid ZIP
  → Expected: Re-encoding through sharp neutralizes the ZIP component
  → Finding if: file passes as image but retains ZIP structure

Test D6: Zip bomb (if ZIP accepted)
  → Upload a valid-structure ZIP that expands to 1 GB
  → Expected: Size check on compressed file before decompression
  → Finding if: decompression attempted without size guard
```

### Test Category E: Rate Limit & DoS

```
Test E1: Rapid authentication attempts
  → Send 20 login requests in 10 seconds with wrong password
  → Expected: Rate limited after configured threshold (typically 5/min)
  → Finding if: all 20 requests processed normally

Test E2: Large request body
  → Send a POST with a 10 MB JSON body to a route that expects small payloads
  → Expected: Rejected before JSON parsing
  → Finding if: body is fully parsed before rejection

Test E3: ReDoS probe
  → Send a string of 30+ repeated characters to any field validated with a regex
  → e.g., "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!" to an email field
  → Expected: Fast rejection (< 50ms) — no catastrophic backtracking
  → Finding if: response takes > 1 second

Test E4: Concurrent duplicate requests
  → Send the same create request 10 times in parallel
  → Expected: Only 1 resource created (idempotency or DB unique constraint)
  → Finding if: 10 duplicate resources created (race condition)
```

### Test Category F: Data Extraction Probes

```
Test F1: Verbose error messages
  → Send malformed data to every endpoint
  → Expected: Generic error messages only
  → Finding if: stack traces, SQL errors, or internal paths returned

Test F2: Sensitive fields in responses
  → Inspect every API response for: password, passwordHash, secretKey, internalNotes
  → Expected: None of these fields present in any response
  → Finding if: any sensitive field returned

Test F3: Information disclosure via timing
  → Test login with valid email + wrong password vs invalid email + wrong password
  → Expected: Same response time (constant-time comparison)
  → Finding if: response time differs by > 100ms (reveals valid emails)

Test F4: Directory/path enumeration
  → Request /api/users/1, /api/users/2, /api/users/3 without authentication
  → Expected: 401 before any ID-based lookup
  → Finding if: different responses for existing vs non-existing IDs (reveals enumeration)
```

### Test Category G: Database Infiltration

```
Test G1: RLS bypass attempt
  → Without authentication, attempt direct Supabase query using anon key
  → Expected: RLS blocks all non-public data
  → Finding if: any private data accessible with anon key

Test G2: Over-fetching via query parameters
  → Attempt to request extra fields: GET /api/users/me?select=password,internalNotes
  → Expected: API returns only explicitly defined response fields
  → Finding if: arbitrary field selection from client is honored

Test G3: Transaction rollback via error injection
  → Trigger an error mid-transaction to see if partial writes are committed
  → Expected: Transaction rolled back completely
  → Finding if: partial writes visible in database

Test G4: N+1 query amplification
  → Request a list endpoint and inspect whether it triggers N database calls
  → This is not a security issue directly but enables DoS via amplification
  → Finding if: each list item triggers an individual query
```

---

## Step 3: Generate the Findings Report

```
══════════════════════════════════════════
SECURITY TEST REPORT
Generated: [timestamp]
Target: [project name]
Routes tested: [N]
Test categories run: [A, B, C, D, E, F, G]
══════════════════════════════════════════

CRITICAL FINDINGS (fix before delivery)
────────────────────────────────────────
[C1] SQL Injection — POST /api/posts
     Payload: title = "'; DROP TABLE posts; --"
     Result: Payload reached DB query
     Fix: Zod schema validation on title field

HIGH FINDINGS (fix before production)
──────────────────────────────────────
[H1] IDOR — GET /api/users/:id
     User A accessed User B's private data
     Fix: Add ownership check: if (record.userId !== session.userId) return 403

MEDIUM FINDINGS (fix soon)
───────────────────────────
[M1] Verbose errors — POST /api/auth/login
     Stack trace returned on malformed input
     Fix: Catch errors, return generic "Invalid credentials" message

LOW FINDINGS (fix eventually)
──────────────────────────────
[L1] Rate limiting not configured on POST /api/posts
     Recommendation: Add rate limit to prevent spam

PASSED
───────
✓ Authentication bypass: all 6 tests passed
✓ File upload: all 6 tests passed
✓ Injection (SQL, NoSQL, Command): all inputs rejected
✓ CORS: only whitelisted origins accepted

══════════════════════════════════════════
Overall result: NEEDS_REVISION (1 critical, 1 high)
Deliver only after critical and high findings are resolved.
══════════════════════════════════════════
```

---

## Step 4: Remediation Loop

For each CRITICAL or HIGH finding:
1. Identify the exact line of code causing the vulnerability
2. Apply the fix from `security` skill's attack catalog
3. Re-run the specific test that found it
4. Confirm the finding no longer reproduces
5. Update the report with `FIXED` status

Do not deliver code with CRITICAL or HIGH findings unresolved.

---

## Self-Observation

If a new attack vector appears that this skill's test battery doesn't cover, log it:

```json
{
  "skill": "security-tester",
  "observation_type": "missing_coverage",
  "description": "[what attack type the battery doesn't test]",
  "suggested_improvement": "[what test would cover it]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.

---

For the complete remediation guidance for each finding type, cross-reference with `security` skill's `references/attack-catalog.md`.
