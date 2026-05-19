# Catálogo de Padrões de Código

Este documento lista padrões comuns detectados pelo Code Archaeologist.

## Padrões de Componentes

### 1. Functional Component
```tsx
const Component = ({ prop1, prop2 }) => {
  return <div>...</div>;
};
```
**Quando usar**: Componentes React modernos

### 2. Compound Component
```tsx
const Parent = ({ children }) => <div>{children}</div>;
Parent.Item = ({ children }) => <span>{children}</span>;
```
**Quando usar**: Componentes com sub-partes reutilizáveis

### 3. Higher-Order Component (HOC)
```tsx
const withAuthentication = (Component) => {
  return (props) => {
    if (!isAuthenticated) return <Login />;
    return <Component {...props} />;
  };
};
```
**Quando usar**: Adicionar funcionalidade cross-cutting

### 4. Render Props
```tsx
<DataProvider render={(data) => <Display data={data} />} />
```
**Quando usar**: Compartilhar lógica sem herança

## Padrões de Estado

### 5. Context API
```tsx
const ThemeContext = createContext(defaultValue);

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```
**Quando usar**: Estado compartilhado por múltiplos componentes

### 6. useReducer para Estado Complexo
```tsx
const reducer = (state, action) => {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    default: return state;
  }
};

const [state, dispatch] = useReducer(reducer, initialState);
```
**Quando usar**: Estado com múltiplas transições

### 7. Zustand Store
```tsx
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```
**Quando usar**: Estado global simples sem boilerplate

### 8. React Query/TanStack Query
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
});
```
**Quando usar**: Server state, cache, sincronização

## Padrões de Dados

### 9. API Service Layer
```tsx
class ApiService {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    return response.json();
  }
}
```
**Quando usar**: Abstrair chamadas de API

### 10. CRUD Operations
```tsx
const create = async (data) => { /* POST */ };
const read = async (id) => { /* GET */ };
const update = async (id, data) => { /* PUT */ };
const remove = async (id) => { /* DELETE */ };
```
**Quando usar**: Operações típicas de banco

### 11. Optimistic Updates
```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries(['todos']);
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);
    return { previous };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previous);
  },
});
```
**Quando usar**: Updates instantâneos com rollback

## Padrões de UX/UI

### 12. Modal Pattern
```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <Content />
</Modal>
```
**Quando usar**: Diálogos e popups

### 13. Form com Validação
```tsx
const { register, handleSubmit, formState: { errors } } = useForm();

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("name", { required: true })} />
  {errors.name && <span>Este campo é obrigatório</span>}
</form>
```
**Quando usar**: Inputs com validação

### 14. Skeleton Loading
```tsx
{isLoading ? (
  <div className="skeleton">
    <div className="skeleton-image" />
    <div className="skeleton-text" />
  </div>
) : (
  <Content />
)}
```
**Quando usar**: Loading states visuais

### 15. Infinite Scroll
```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({ ... });

useEffect(() => {
  const handleScroll = () => {
    if (hasMore && !isFetching && isNearBottom) {
      fetchNextPage();
    }
  };
}, [fetchNextPage, hasMore, isFetching, isNearBottom]);
```
**Quando usar**: Listas longas com lazy loading

## Padrões Arquiteturais

### 16. Custom Hook
```tsx
const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
};
```
**Quando usar**: Lógica reutilizável entre componentes

### 17. Service Worker / Middleware
```tsx
const middleware = (req, res, next) => {
  // Log, auth, transform
  return next();
};
```
**Quando usar**: Processamento cross-cutting

### 18. Event Bus
```tsx
class EventBus {
  private events: Map<string, Function[]>;
  
  on(event: string, callback: Function) { ... }
  emit(event: string, data: any) { ... }
  off(event: string, callback: Function) { ... }
}
```
**Quando usar**: Comunicação loose-coupled
