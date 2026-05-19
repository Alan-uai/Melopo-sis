---
name: design-system-rigoroso
description: |
  Ativar quando o usuário mencionar "design system", "componente", "estilo", "CSS", "tokens", "cores", "tipografia", "UI", "interface", "estado visual", ou quando estiver criando/adicionando componentes visuais. Use esta skill SEMPRE que criar qualquer elemento de interface para garantir abstração e consistência visual.
---

# Skill: Design System Rigoroso

## Princípio Fundamental

Todos os elementos visuais devem ser abstraídos. Nenhum componente deve conter estilos duplicados. Cada componente deve suportar todos os estados visuais obrigatórios.

## Estados Visuais Obrigatórios

Todo componente visual deve implementar:

1. **Loading** - Feedback de carregamento
2. **Erro** - Feedback de erro
3. **Vazio** - Feedback de conteúdo vazio
4. **Sucesso** - Feedback de operação bem-sucedida

## Tokens Centralizados

### Cores
```typescript
// tokens/colors.ts
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    900: '#1e3a8a',
  },
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  neutral: {
    50: '#fafafa',
    900: '#171717',
  },
} as const;
```

### Espaçamento
```typescript
// tokens/spacing.ts
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
} as const;
```

### Tipografia
```typescript
// tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;
```

### Shadows
```typescript
// tokens/shadows.ts
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
} as const;
```

## Estrutura de Design System

```
src/design-system/
├── tokens/              # Tokens centralizados
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── shadows.ts
├── primitives/          # Componentes base (átomos)
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.styles.ts
│   │   ├── Button.types.ts
│   │   └── Button.test.tsx
│   ├── Input/
│   ├── Badge/
│   └── ...
├── composites/         # Componentes compostos (moléculas)
│   ├── SearchInput/
│   ├── Card/
│   └── ...
├── patterns/           # Padrões recorrentes
│   ├── DataTable/
│   ├── Form/
│   └── ...
└── templates/          # Templates de página
    ├── DashboardTemplate/
    └── AuthTemplate/
```

## Exemplo: Componente com Todos os Estados

```tsx
// Button/Button.tsx
import { ButtonContainer, ButtonLoader, ButtonText } from './Button.styles';
import type { ButtonProps } from './Button.types';

export function Button({
  children,
  loading,
  disabled,
  variant = 'primary',
  error,
  ...props
}: ButtonProps) {
  if (loading) {
    return (
      <ButtonContainer disabled state="loading">
        <ButtonLoader />
        <ButtonText>Carregando...</ButtonText>
      </ButtonContainer>
    );
  }

  if (error) {
    return (
      <ButtonContainer disabled state="error">
        <ButtonText>Erro ao carregar</ButtonText>
      </ButtonContainer>
    );
  }

  return (
    <ButtonContainer disabled={disabled} state="success" {...props}>
      <ButtonText>{children}</ButtonText>
    </ButtonContainer>
  );
}
```

```tsx
// Exemplo de uso com Card vazio
function EmptyState() {
  return (
    <Card state="empty">
      <EmptyIcon />
      <Title>Nenhum usuário encontrado</Title>
      <Description>Comece adicionando seu primeiro usuário</Description>
      <Button>Adicionar Usuário</Button>
    </Card>
  );
}
```

## Checklist de Verificação

- [ ] Tokens centralizados (cores, espaçamento, tipografia)?
- [ ] Componente não tem estilos duplicados?
- [ ] Implementa estados: loading, erro, vazio, sucesso?
- [ ] Componente é reutilizável e abstrato?
- [ ] Segue a hierarquia do design system?

## Regras de Ouro

1. **NUNCA** hardcode valores de estilo
2. **SEMPRE** use tokens para cores, espaçamento, tipografia
3. **SEMPRE** implemente os 4 estados obrigatórios
4. **NUNCA** duplique estilos entre componentes
5. **EXTRAIA** padrões visuais para componentes compartilhados
