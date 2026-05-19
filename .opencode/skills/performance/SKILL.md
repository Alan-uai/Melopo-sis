---
name: performance
description: |
  Ativar quando o usuário mencionar "performance", "otimização", "memoização", "re-render", "lazy loading", "code splitting", "renderização", "lento", ou quando trabalhar com listas grandes, componentes complexos ou efeitos. Use esta skill para garantir renderizações eficientes e carregamento otimizado.
---

# Skill: Performance

## Princípio Fundamental

Evitar re-renderizações desnecessárias. Uso estratégico de memoização. Lazy loading e code splitting obrigatórios onde aplicável. Separar lógica pesada.

## Memoização

### useMemo - Resultados de Cálculos

```tsx
// ❌ RUIM - Cálculo a cada render
function ProductList({ products, filter }) {
  const filteredProducts = products.filter(p => p.category === filter);
  const sortedProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  // ...
}

// ✅ BOM - Memoizar resultado
function ProductList({ products, filter }) {
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.category === filter);
  }, [products, filter]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => a.price - b.price);
  }, [filteredProducts]);
  // ...
}
```

### useCallback - Funções

```tsx
// ❌ RUIM - Nova função a cada render
function Parent() {
  const handleClick = () => { /* ... */ };
  return <Child onClick={handleClick} />;
}

// ✅ BOM - Função memoizada
function Parent() {
  const handleClick = useCallback(() => {
    // lógica
  }, [dependencies]);

  return <Child onClick={handleClick} />;
}
```

### React.memo - Componentes

```tsx
// ❌ RUIM - Componente sempre re-renderiza
function UserCard({ user }) {
  return <div>{user.name}</div>;
}

// ✅ BOM - Só re-renderiza se props mudarem
const UserCard = React.memo(function UserCard({ user }) {
  return <div>{user.name}</div>;
});

// Com comparador customizado se necessário
const UserCard = React.memo(
  function UserCard({ user }) {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);
```

## Lazy Loading e Code Splitting

### Import Dinâmico

```tsx
// ❌ RUIM - Import estático (carrega tudo)
import { HeavyChart } from './HeavyChart';

// ✅ BOM - Import dinâmico (carrega sob demanda)
const HeavyChart = lazy(() => import('./HeavyChart'));

// Com Suspense
function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

### Rotas com Lazy Loading

```tsx
// routes.tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));

const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/settings', element: <Settings /> },
  { path: '/reports', element: <Reports /> },
];
```

## Listas Virtualizadas

Para listas grandes, use virtualização:

```tsx
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ListItem item={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

## Separação de Lógica Pesada

```tsx
// ❌ RUIM - Lógica pesada no componente
function DataProcessor({ data }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Processamento pesado no effect
    const processed = heavyComputation(data);
    setResult(processed);
  }, [data]);

  return <div>{result}</div>;
}

// ✅ BOM - Web Worker para lógica pesada
// worker.ts
self.onmessage = ({ data }) => {
  const result = heavyComputation(data);
  self.postMessage(result);
};

// hook
function useHeavyComputation(data) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url));
    worker.postMessage(data);
    worker.onmessage = ({ data }) => {
      setResult(data);
      worker.terminate();
    };
    return () => worker.terminate();
  }, [data]);

  return result;
}
```

## Evitar Re-renders em Cadeia

```tsx
// Provider com contexto otimizado
const UserContext = createContext(null);

// ✅ BOM - Dividir contexto para evitar re-renders
const UserDataContext = createContext(null);
const UserActionsContext = createContext(null);

// ❌ RUIM - Tudo em um contexto
const UserContext = createContext({
  user: null,
  setUser: () => {},
  logout: () => {},
});
```

## Checklist de Verificação

- [ ] Cálculos pesados estão memoizados com `useMemo`?
- [ ] Funções passadas como props estão com `useCallback`?
- [ ] Componentes puros estão com `React.memo`?
- [ ] Code splitting está aplicado em rotas e imports pesados?
- [ ] Listas grandes estão virtualizadas?
- [ ] Lógica pesada está em Web Workers?
- [ ] Context está dividido para evitar re-renders?

## Padrões de Otimização

### Componente Genérico Otimizado

```tsx
// components/OptimizedList.tsx
const OptimizedList = React.memo(function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  estimateSize,
}: OptimizedListProps<T>) {
  const listRef = useRef(null);

  return (
    <FixedSizeList
      ref={listRef}
      height={400}
      itemCount={items.length}
      itemSize={estimateSize}
      itemData={items}
    >
      {({ index, style }) => (
        <div style={style} key={keyExtractor(items[index])}>
          {renderItem(items[index], index)}
        </div>
      )}
    </FixedSizeList>
  );
});
```

## Regras de Ouro

1. **MEÇA** antes de otimizar - use React DevTools Profiler
2. **MEMOIZE** cálculos pesados com `useMemo`
3. **MEMOIZE** callbacks com `useCallback`
4. **MEMORIZE** componentes puros com `React.memo`
5. **SPLIT** código de rotas e componentes pesados
6. **VIRTUALIZE** listas com mais de 100 itens
7. **MOVA** lógica pesada para Web Workers
