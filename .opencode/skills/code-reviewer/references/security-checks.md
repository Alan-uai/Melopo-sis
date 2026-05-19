# Security Checks Reference

## Common Security Issues

### 1. XSS (Cross-Site Scripting)

**BAD:**
```tsx
<div dangerouslySetInnerHTML={{ __html: userInput }} />
<div dangerouslySetInnerHTML={{ __html: contentFromAPI }} />
```

**GOOD:**
```tsx
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 2. SQL Injection

**BAD:**
```typescript
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**GOOD:**
```typescript
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

### 3. Hardcoded Secrets

**BAD:**
```typescript
const apiKey = 'sk_live_abc123def456';
const password = 'admin123';
```

**GOOD:**
```typescript
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('API_KEY não configurada');
```

### 4. Eval/Function Constructor

**BAD:**
```typescript
eval(userInput);
new Function(code);
```

### 5. Path Traversal

**BAD:**
```typescript
const file = path.join uploads/${filename};
```

**GOOD:**
```typescript
import { resolve } from 'path';
const safePath = resolve(uploads, filename);
if (!safePath.startsWith(uploads)) throw new Error('Path traversal detected');
```

### 6. Command Injection

**BAD:**
```typescript
exec(`git commit -m "${message}"`);
```

**GOOD:**
```typescript
execFile('git', ['commit', '-m', message]);
```
