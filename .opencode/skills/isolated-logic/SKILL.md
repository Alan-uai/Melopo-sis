---
name: logica-isolada
description: |
  Ativar quando o usuário mencionar "lógica", "hook", "useState", "useEffect", "efeito colateral", "estado", "componente", "função", ou quando estiver escrevendo código que não seja puramente visual. Use esta skill SEMPRE que adicionar qualquer lógica a componentes para garantir que esteja corretamente isolada em hooks ou services.
---

# Skill: Lógica Isolada

## Princípio Fundamental

Proibido lógica dentro de componentes. Componentes devem ser puramente declarativos. Toda lógica deve existir em hooks ou domain/services.

## O que é "Lógica"?

Lógica inclui qualquer código que:
- Gerencia estado (`useState`, `useReducer`)
- Executa efeitos colaterais (`useEffect`, `useAsync`)
- Realiza validações
- Faz cálculos ou transformações
- Acessa APIs ou banco de dados
- Contém condições complexas

## Estrutura Correta

### Componentes: Apenas Declaração

```tsx
// ❌ RUIM - Lógica no componente
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (users.length === 0) return <EmptyState />;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <UserCard name={user.name} email={user.email} />
        </li>
      ))}
    </ul>
  );
}

// ✅ BOM - Lógica isolada em hook
function UserList() {
  const { users, loading, error, refetch } = useUsers();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (users.length === 0) return <EmptyState />;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <UserCard name={user.name} email={user.email} />
        </li>
      ))}
    </ul>
  );
}
```

### Hooks: Toda a Lógica

```typescript
// hooks/useUsers.ts
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
}
```

## Padrões de Hooks

### Hook de Dados (useFetch)
```typescript
// hooks/useFetch.ts
export function useFetch<T>(url: string, options?: FetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ... implementação

  return { data, loading, error, refetch };
}
```

### Hook de Mutation (useMutation)
```typescript
// hooks/useMutation.ts
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const [state, setState] = useState<MutationState<TData>>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(async (variables: TVariables) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await mutationFn(variables);
      setState({ loading: false, data, error: null });
      return data;
    } catch (error) {
      setState({ loading: false, data: null, error });
      throw error;
    }
  }, [mutationFn]);

  return { ...state, mutate };
}
```

### Hook de Formulário
```typescript
// hooks/useForm.ts
export function useForm<T>(initialValues: T, validationSchema?: Schema) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const validate = useCallback(async () => {
    if (!validationSchema) return true;
    const result = await validationSchema.validate(values);
    setErrors(result.errors);
    return result.isValid;
  }, [values, validationSchema]);

  // ...

  return { values, errors, touched, handleChange, validate };
}
```

## Checklist de Verificação

- [ ] O componente contém apenas JSX/TSX?
- [ ] Toda lógica está em hooks?
- [ ] Hooks estão em arquivos separados?
- [ ] Services (API, validação) estão isolados?
- [ ] Componentes recebem dados via props?

## Estrutura de Arquivos

```
src/
├── components/
│   └── UserList/
│       └── UserList.tsx        # Apenas UI
├── hooks/
│   └── useUsers.ts             # Lógica de estado e fetch
├── services/
│   └── userService.ts          # Comunicação com API
└── domain/
    └── validators/
        └── userValidator.ts    # Validações de negócio
```

## Regras de Ouro

1. **NUNCA** escreva `useState`, `useEffect` dentro de componentes de UI
2. **SEMPRE** extraia lógica para hooks customizados
3. **MANTENHA** componentes declarativos e focados em renderização
4. **SEPARA** lógica de API em services
5. **REUTILIZE** hooks quando a lógica for similar
