---
name: padronizacao-absoluta
description: |
  Ativar quando o usuário mencionar "padronização", "convenção", "nomenclatura", "estrutura", "organização", "imports", ou quando estiver criando novos arquivos/funções/componentes. Use esta skill SEMPRE que criar ou modificar arquivos para garantir consistência com o projeto.
---

# Skill: Padronização Absoluta

## Princípio Fundamental

Estrutura consistente em todo o projeto. Imports organizados e previsíveis. Convenções únicas de nomenclatura e organização.

## Convenções de Nomenclatura

### Arquivos
```
Componentes:     PascalCase    →  UserCard.tsx, ModalContainer.tsx
Hooks:           camelCase     →  useAuth.ts, useFetchData.ts
Services:        camelCase     →  userService.ts, apiClient.ts
Types/Interfaces: PascalCase   →  User.ts, ApiResponse.ts
Utils:           camelCase     →  formatDate.ts, debounce.ts
Constants:       SCREAMING_SNAKE →  API_ENDPOINTS.ts, ROUTES.ts
Schemas:         camelCase     →  userSchema.ts, validateEmail.ts
```

### Funções e Variáveis
```
Funções:         camelCase     →  getUserById, calculateTotal
Classes:         PascalCase    →  UserService, ApiClient
Constantes:      SCREAMING_SNAKE →  MAX_RETRY, API_URL
Interfaces:      PascalCase    →  User, ProductList
Types:           PascalCase    →  LoadingState, ApiResult
Enums:           PascalCase    →  UserRole, OrderStatus
```

## Estrutura de Arquivo TypeScript/React

```typescript
// 1. Imports externos (bibliotecas)
import { useState, useCallback } from 'react';
import { z } from 'zod';
import { format } from 'date-fns';

// 2. Imports internos (projeto)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import type { User } from '@/types/user';

// 3. Types/Interfaces
interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// 4. Constantes (se necessário)
const CARD_CLASSES = 'bg-white rounded-lg shadow-md p-4';

// 5. Funções auxiliares (se necessário)
function formatUserName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

// 6. Componente principal
export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  // Hooks primeiro
  const { canEdit } = useAuth();
  
  // Estado
  const [expanded, setExpanded] = useState(false);
  
  // Callbacks
  const handleEdit = useCallback(() => {
    onEdit?.(user.id);
  }, [user.id, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(user.id);
  }, [user.id, onDelete]);

  // Render
  return (
    <div className={CARD_CLASSES}>
      <h3>{formatUserName(user)}</h3>
      <p>{user.email}</p>
      {canEdit && (
        <div>
          <Button onClick={handleEdit}>Editar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      )}
    </div>
  );
}
```

## Ordem de Imports

```typescript
// ordem rigorosa:
// 1. React/core (quando aplicável)
import React, { useState, useEffect } from 'react';

// 2. Bibliotecas externas - ordem alfabética
import { format } from 'date-fns';
import { z } from 'zod';

// 3. Imports internos - paths absolutos, ordem alfabética
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import type { User } from '@/types/user';
import { ROUTES } from '@/constants/routes';
```

## Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@constants/*": ["src/constants/*"],
      "@domain/*": ["src/domain/*"],
      "@contracts/*": ["src/contracts/*"]
    }
  }
}
```

## Estrutura de Diretórios Padrão

```
src/
├── components/          # Componentes UI
│   └── ui/              # Design system base
├── features/             # Features desacopladas
│   └── [feature]/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
├── hooks/               # Hooks globais
├── services/            # Services globais
├── types/               # Tipos globais
├── utils/               # Utilitários
├── constants/           # Constantes
├── contracts/           # Interfaces
└── shared/              # Código compartilhado
```

## Checklist de Verificação

- [ ] Nome do arquivo segue a convenção?
- [ ] Imports estão em ordem correta?
- [ ] Path aliases estão sendo usados?
- [ ] Funções/variáveis seguem camelCase?
- [ ] Types/Interfaces seguem PascalCase?
- [ ] Arquivo está na pasta correta?

## ESLint + Prettier Recomendado

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      { "selector": "variable", "format": ["camelCase", "UPPER_CASE"] },
      { "selector": "function", "format": ["camelCase"] },
      { "selector": "typeLike", "format": ["PascalCase"] }
    ],
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal"],
      "pathGroups": [
        { "pattern": "@/**", "group": "internal" }
      ]
    }]
  }
}
```

## Regras de Ouro

1. **SIGA** as convenções de nomenclatura SEMPRE
2. **ORGANIZE** imports na ordem correta
3. **USE** path aliases para imports internos
4. **MANTENHA** estrutura de diretórios consistente
5. **APLIQUE** ESLint/Prettier para automatizar padrões
