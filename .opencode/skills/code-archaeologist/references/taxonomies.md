# Taxonomia de Componentes e Fluxos

## Categorias de Componentes

### UI Atoms (Menores)
- Button, Input, Label, Icon, Badge, Avatar, Spinner
- Características: Reutilizáveis, stateless, simples

### UI Molecules (Médios)
- FormField (Input + Label + Error), SearchBar, CardHeader
- Características: Compostos de atoms, possuem estado

### UI Organisms (Maiores)
- DataTable, Navbar, Sidebar, Modal, CardList
- Características: Compleksos, múltiplos estados, lógica

### Layout Components
- Container, Grid, Stack, Flex
- Características: Estrutura visual

### Feedback Components
- Toast, Alert, Loading, Progress, Skeleton
- Características: Estados de sistema

### Form Components
- Input, Select, Checkbox, Radio, DatePicker, RichEditor
- Características: Coleção de inputs

## Categorias de Hooks

### Data Fetching
- useQuery, useMutation, useInfiniteQuery
- Características: Async, cache, loading states

### State Management
- useState, useReducer, useContext, useStore
- Características: Estado local/global

### DOM Interaction
- useRef, useClickOutside, useKeyPress, useScroll
- Características: Interação direta com DOM

### Side Effects
- useEffect, useInterval, useDebounce, useThrottle
- Características: Efeitos colaterais

### Lifecycle
- useMount, useUnmount, useUpdate
- Características: Pontos no ciclo de vida

## Categorias de Fluxos

### Fluxos de Autenticação
1. Login tradicional
2. Social login (OAuth)
3. Magic link
4. MFA/2FA
5. Password recovery
6. Session management

### Fluxos de Dados
1. CRUD básico
2. Upload + Processamento
3. Sync offline/online
4. Real-time updates
5. Batch operations

### Fluxos de UI
1. Navegação (routing)
2. Modals (open/close)
3. Forms (validation → submit)
4. Infinite scroll
5. Drag and drop

### Fluxos de Exportação
1. Export simples (PDF/JSON)
2. Export com template
3. Bulk export
4. Scheduled export

### Fluxos de Compartilhamento
1. Link generation
2. Social share
3. Team invite
4. Public/private toggle

## Mapeamento: Componentes → Skills

| Componente | Skill Gerada | Complexidade |
|------------|--------------|--------------|
| Button | ui-button-system | Baixa |
| Input + Label + Error | ui-form-field | Baixa |
| Modal + Dialog | ui-modal-system | Média |
| DataTable | ui-data-table | Alta |
| useAuth | hook-auth-context | Média |
| useInfiniteQuery | hook-infinite-scroll | Média |
| useDebounce | hook-debounce | Baixa |
| Auth flow | flow-authentication | Alta |
| Export flow | flow-smart-export | Média |
| CRUD flow | flow-entity-management | Alta |

## Heurísticas para Nome de Skill

### Prefixos
- `ui-` → Componentes visuais
- `hook-` → Custom hooks
- `flow-` → Processos/automação
- `util-` → Funções helpers
- `arch-` → Padrões arquiteturais
- `integration-` → Integrações externas
- `page-` → Páginas/routes

### Nomenclatura
- Kebab-case: `ui-profile-card`
- Verbos para ações: `flow-create-entity`
- Substantivos para abstrações: `hook-use-auth`

### Descrição
- O QUE: "Skill para criar/modificar/gerear..."
- QUANDO: "Use quando usuário menciona..."
- CONTEXTO: "Especialmente útil para..."
