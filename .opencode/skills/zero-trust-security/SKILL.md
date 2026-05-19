---
name: seguranca-zero-confianca
description: |
  Ativar quando o usuário mencionar "segurança", "validação", "sanitização", "XSS", "injection", "autenticação", "autorização", "CSRF", "rate limiting", "tokens", "senha", "criptografia", ou quando trabalhar com dados de usuário, formulários, ou comunicações de API. Use esta skill SEMPRE para garantir validação completa e proteção contra ataques.
---

# Skill: Segurança (Zero Confiança)

## Princípio Fundamental

Nunca confiar em dados do cliente (frontend). Validar TODAS as entradas. Sanitizar dados contra XSS, SQL Injection e Injection em geral.

## Validação de Entrada (Obrigatório)

### Com Zod

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos 1 letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos 1 caractere especial'),
  name: z.string().min(2).max(100),
  age: z.number().min(18).max(150),
});

export function createUser(data: unknown) {
  const validated = CreateUserSchema.safeParse(data);
  if (!validated.success) {
    throw new ValidationError(validated.error.message);
  }
  // validated.data é seguro para usar
}
```

### Validação em API (Backend)

```typescript
// services/userService.ts
export async function createUser(rawData: unknown): Promise<Result<User>> {
  // 1. Validar estrutura
  const validated = CreateUserSchema.safeParse(rawData);
  if (!validated.success) {
    return Result.fail('Dados inválidos');
  }

  // 2. Verificar duplicação (sem confiar em email do input)
  const existingUser = await userRepository.findByEmail(validated.data.email);
  if (existingUser) {
    return Result.fail('Email já cadastrado');
  }

  // 3. Sanitizar dados
  const sanitizedData = {
    ...validated.data,
    email: sanitizeEmail(validated.data.email),
    name: sanitizeString(validated.data.name),
  };

  // 4. Criar usuário
  const user = await userRepository.create(sanitizedData);
  return Result.ok(user);
}
```

## Sanitização

### XSS Prevention

```typescript
// utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

// Para uso em React (já é seguro por padrão)
function UserContent({ content }: { content: string }) {
  // React escapa automaticamente
  return <div>{content}</div>;
}

// Para HTML危险性 (dangerouslySetInnerHTML)
function SafeHTML({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }} />;
}
```

### SQL Injection Prevention

```typescript
// ❌ RUIM - Concatenação direta
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ BOM - Query builder com parâmetros
const query = supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

## Autenticação e Autorização

### Verificação Obrigatória no Backend

```typescript
// middleware/auth.ts
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = verifyJWT(token);
    req.user = decoded; // Adiciona usuário à requisição
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Uso em rotas
app.post('/api/users', authMiddleware, async (req, res) => {
  // req.user está disponível e verificado
  const result = await createUser(req.body);
  res.json(result);
});
```

### Autorização Baseada em Papéis

```typescript
// types/auth.ts
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

// Decorator ou middleware
function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    next();
  };
}

// Uso
app.delete('/api/users/:id', 
  authMiddleware, 
  requireRole(Role.ADMIN), 
  async (req, res) => { }
);
```

## Rate Limiting

```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Muitas requisições, tente novamente em 15 minutos',
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas de login por IP
  message: 'Muitas tentativas de login, tente novamente em 1 hora',
});
```

## Headers de Segurança

```typescript
// middleware/security.ts
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}
```

## Proteção CSRF

```typescript
// frontend - Gerar token
function CSRFProvider({ children }) {
  const [csrfToken, setCSRFToken] = useState('');
  
  useEffect(() => {
    // Obter token do servidor
    fetch('/api/csrf-token').then(res => res.json()).then(data => {
      setCSRFToken(data.token);
    });
  }, []);

  return (
    <CSRFContext.Provider value={csrfToken}>
      {children}
    </CSRFContext.Provider>
  );
}

// frontend - Incluir em requests
function apiClient(endpoint: string, options: RequestInit = {}) {
  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': useCSRF(),
    },
    credentials: 'include',
  });
}
```

## Variáveis de Ambiente

```typescript
// ❌ RUIM - Hardcoded
const apiKey = 'sk_live_abc123';

// ✅ BOM - Variáveis de ambiente
const apiKey = process.env.SUPABASE_API_KEY;
if (!apiKey) throw new Error('SUPABASE_API_KEY não configurada');
```

## Checklist de Verificação

- [ ] Todos os inputs são validados com schema (Zod/Yup)?
- [ ] Dados são sanitizados antes de usar?
- [ ] Autenticação é verificada no backend?
- [ ] Autorização verifica permissões do usuário?
- [ ] Rate limiting está implementado?
- [ ] Headers de segurança estão configurados?
- [ ] CSRF protection está ativa?
- [ ] Secrets estão em variáveis de ambiente?
- [ ] Logs não expõem dados sensíveis?

## Regras de Ouro

1. **NUNCA** confie em dados do frontend - sempre valide
2. **SEMPRE** use schemas de validação (Zod/Yup)
3. **SANITIZE** qualquer dado que venha do cliente
4. **IMPLEMENTE** autenticação E autorização no backend
5. **USE** rate limiting para prevenir ataques
6. **CONFIGURA** headers de segurança (CSP, HSTS, etc.)
7. **NUNCA** exponha secrets no código ou logs
8. **USE** variáveis de ambiente para configurações sensíveis
