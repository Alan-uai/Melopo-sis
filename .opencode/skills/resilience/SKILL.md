---
name: resiliencia
description: |
  Ativar quando o usuário mencionar "resiliência", "erro", "falha", "crash", "fallback", "tolerância", "recuperação", "retry", ou quando implementar comunicação com serviços externos ou funcionalidades críticas. Use esta skill para garantir que o sistema lide com falhas gracefully.
---

# Skill: Resiliência

## Princípio Fundamental

Sistema deve lidar com falhas sem quebrar. Implementar fallback de UI e dados. Evitar crash por dados inesperados.

## Tratamento de Erro em Camadas

### Hook com Error Boundary

```tsx
// hooks/useAsync.ts
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = []
) {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function execute() {
      setState({ status: 'pending', data: null, error: null });

      try {
        const data = await asyncFn();
        if (mounted) {
          setState({ status: 'resolved', data, error: null });
        }
      } catch (error) {
        if (mounted) {
          setState({
            status: 'rejected',
            data: null,
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      }
    }

    execute();

    return () => { mounted = false; };
  }, deps);

  const retry = useCallback(() => {
    const asyncFn = deps[0];
    if (typeof asyncFn === 'function') {
      asyncFn().then(/* ... */);
    }
  }, deps);

  return { ...state, retry };
}
```

### Error Boundary Component

```tsx
// components/ErrorBoundary.tsx
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Uso
<ErrorBoundary
  fallback={<ErrorMessage title="Algo deu errado" />}
  onError={(error) => analytics.track('error', { message: error.message })}
>
  <Dashboard />
</ErrorBoundary>
```

## Fallback de Dados

### Cache com Fallback

```typescript
// hooks/useUserData.ts
export function useUserData(userId: string) {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Tenta buscar dados frescos
        const freshData = await userService.findById(userId);
        setData(freshData);
        setError(null);
      } catch (err) {
        // Fallback para cache local
        const cachedData = localStorage.getItem(`user_${userId}`);
        if (cachedData) {
          setData(JSON.parse(cachedData));
          setError(new Error('Dados do cache - talvez desatualizados'));
        } else {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  return { data, loading, error, isStale: !!error?.message.includes('cache') };
}
```

### Skeleton Loading

```tsx
// components/Skeleton.tsx
export function UserProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

// Uso
function UserProfile({ userId }) {
  const { data: user, loading, error } = useUser(userId);

  if (loading) return <UserProfileSkeleton />;
  if (error && !user) return <ErrorState error={error} />;
  
  return (
    <div>
      <h1>{user.name}</h1>
      {error && <WarningBanner message="Dados podem estar desatualizados" />}
    </div>
  );
}
```

## Retry com Backoff

```typescript
// utils/retry.ts
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  shouldRetry?: (error: Error) => boolean;
}

async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxAttempts) break;
      if (config.shouldRetry && !config.shouldRetry(lastError)) break;

      await sleep(delay);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError!;
}

// Uso
const user = await retry(
  () => userService.findById(id),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    shouldRetry: (error) => error.message.includes('network'),
  }
);
```

## Circuit Breaker

```typescript
// utils/circuitBreaker.ts
type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > this.config.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}
```

## Dados Inesperados

```typescript
// utils/safeAccess.ts
type SafeValue<T> = T | null | undefined;

// Acesso seguro a propriedades
function safeGet<T, K extends keyof T>(
  obj: SafeValue<T>, 
  key: K, 
  defaultValue: T[K] | null = null
): T[K] | null {
  if (obj == null) return defaultValue;
  return obj[key] ?? defaultValue;
}

// Parse seguro de JSON
function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Uso
const userName = safeGet(user, 'profile', null)?.name ?? 'Anônimo';
const settings = safeJSONParse(localStorage.getItem('settings'), DEFAULT_SETTINGS);
```

## Checklist de Verificação

- [ ] Error boundaries capturam erros de React?
- [ ] Fallback de dados está implementado?
- [ ] Skeleton/states de loading estão presentes?
- [ ] Retry com backoff para operações de rede?
- [ ] Circuit breaker para serviços externos?
- [ ] Acesso seguro a dados aninhados?
- [ ] erros não causam crash da aplicação?

## Regras de Ouro

1. **SEMPRE** implemente Error Boundaries em componentes
2. **FORNEÇA** fallback de dados quando possível
3. **USE** skeleton states para carregamento
4. **IMPLEMENTE** retry com backoff exponencial
5. **ADICIONE** circuit breaker para serviços externos
6. **USE** acesso seguro a dados (?. e ??)
7. **NUNCA** deixe erros quebrarem a aplicação inteira
