---
name: code-archaeologist
description: |
  Análise profunda de código-fonte para descobrir ferramentas, fluxos, UIs, padrões e criar novas skills automaticamente. Use esta skill quando:
  - O usuário menciona "analisar meu código", "descobrir padrões", "mapear componentes"
  - O usuário quer criar skills automaticamente baseadas no código existente
  - O usuário menciona "extrair ferramentas", "gerar skills", "arquitetura do projeto"
  - O usuário quer entender a estrutura, dependências, ou padrões do projeto
  - O usuário menciona qualquer framework, biblioteca, ou tecnologia específica (React, Next.js, etc.)
  - O usuário quer documentação automática ou migração de código
  - SEMPRE que o usuário disser "criar skill", "gerar skill", "nova skill baseada em..."
  - Esta skill é o MOTOR que transforma código em skills - use-a PROATIVAMENTE
  - Quando outra skill precisar de análise de código para criar itself, chame esta skill
---

# Code Archaeologist

Uma skill poderosa para minerar, analisar e transformar código-fonte em conhecimento acionável e novas skills.

## Arquitetura da Skill

```
code-archaeologist/
├── SKILL.md (este arquivo)
├── scripts/
│   ├── analyzer.py       - Análise estática de código
│   ├── pattern_finder.py - Detecção de padrões
│   └── skill_generator.py - Geração automática de skills
└── references/
    ├── patterns.md      - Catálogo de padrões de código
    ├── taxonomies.md     - Taxonomia de componentes e fluxos
    └── skill_templates.md - Templates para geração de skills
```

## Processo de Análise em 5 Fases

### FASE 1: Escaneamento do Terreno

Antes de qualquer análise, escaneie o codebase para entender:
1. **Estrutura de diretórios** - Identifique padrões organizacionais
2. **Stack tecnológico** - package.json, requirements.txt, Cargo.toml, etc.
3. **Framework principal** - Next.js, React, Vue, Django, etc.
4. **Arquitetura** - Monorepo, microservices, modular, etc.

Use comandos de leitura e glob para construir um mapa mental:
- `ls -la` na raiz para ver estrutura
- `package.json` ou equivalente para dependências
- `tsconfig.json` ou equivalente para configurações

### FASE 2: Catálogo de Componentes

Para cada componente identificado, catalogue:

**COMPONENTES UI:**
```
- Nome do componente
- Props/interface
- Estados gerenciados
- Dependências visuais
- Biblioteca de estilo (Tailwind, styled-components, CSS modules)
- Animações/transições
- Acessibilidade
- Responsividade
```

**HOOKS/CUSTOM HOOKS:**
```
- Nome e propósito
- Inputs/outputs
- Side effects
- Estado interno
- Dependências externas (APIs, stores)
```

**FLUXOS/DADOS:**
```
- Origem dos dados
- Transformações
- Destinos
- Pontos de falha
- Cache/otimizações
```

**UTILIDADES/FERRAMENTAS:**
```
- Funções puras
- Helpers
- Wrappers
- polyfills
```

### FASE 3: Detecção de Padrões

Procure por padrões conhecidos:

**Padrões de Componentes:**
- Container/Presentational
- Higher-Order Components (HOC)
- Compound Components
- Render Props
- Custom Hooks
- Provider Pattern
- Controller/View

**Padrões de Estado:**
- Flux/Redux-like
- Context API
- State Machines
- Derived State
-乐观更新/Optimistic Updates

**Padrões de Dados:**
- REST/GraphQL client
- CRUD operations
- Real-time subscriptions
- Pagination/Infinite scroll
- Cache invalidation

**Padrões de UX/UI:**
- Modal/Drawer patterns
- Form handling (validation, submission)
- Error boundaries
- Loading states
- Empty states
- Skeleton screens

### FASE 4: Análise de Fluxos

Para cada fluxo significativo:

1. **Trigger** - O que inicia o fluxo
2. **Input** - Dados de entrada
3. **Processamento** - Lógica/middleware
4. **Output** - Resultado/efeito colateral
5. **Tratamento de Erro** - O que acontece se falhar

Fluxos comuns para identificar:
- Autenticação/Autorização
- CRUD de entidades
- Navegação/Roteamento
- Upload/Download
- Notificações
- Compartilhamento
- Analytics/Tracking
- Configurações/Temas

### FASE 5: Geração de Skills

Baseado na análise, determine QUAL SKILL criar:

| Descoberta | Skill a Gerar |
|------------|---------------|
| Componentes UI | `ui-[nome-do-componente]` |
| Hooks customizados | `hook-[nome-do-hook]` |
| Fluxos de dados | `flow-[nome-do-fluxo]` |
| Padrões arquiteturais | `arch-[nome-do-padrão]` |
| Integrações (API, Auth, etc) | `integration-[nome]` |
| Utilitários | `util-[nome-da-ferramenta]` |
| Páginas/Rotas | `page-[nome-da-rota]` |

## Como Usar o skill-creator

Quando identificar algo que merece sua própria skill:

1. **Chame a skill `skill-creator`** com contexto completo:
   - Nome proposto para a skill
   - Descrição do que faz
   - Inputs/outputs esperados
   - Casos de uso
   - Código relevante para referencia

2. **O skill-creator cuidará de:**
   - Escrever o SKILL.md
   - Criar estrutura de diretórios
   - Preparar scripts de suporte
   - Gerar casos de teste
   - Iterar baseado em feedback

3. **Você fornece:**
   - Análise detalhada do componente/fluxo
   - Contexto do codebase
   - Padrões identificados
   - Proposta de API/nome/descrição

## Regras de Ouro

### SEMPRE:
- Analise ANTES de criar - entenda o código profundamente
- Nomeie skills com prefixo descritivo (ui-, hook-, flow-, util-, arch-, integration-, page-)
- Documente o código fonte que inspirou cada skill
- Identifique dependências e externalidades
- Proponha testes significativos

### NUNCA:
- Crie skills sem análise prévia
- Duplique functionality existente
- Crie skills muito pequenas (combine RELATED)
- Ignore o contexto arquitetural
- Crie skills sem nome descritivo

## Templates de Output

### Template: Análise de Componente UI
```markdown
## [Nome do Componente]

### Metadata
- **Caminho**: `src/components/...`
- **Framework**: React/Next.js
- **Estilo**: Tailwind/styled-components/CSS Modules
- **Complexidade**: 🔴 Alta | 🟡 Média | 🟢 Baixa

### Props/Interface
\`\`\`typescript
interface Props {
  // ...
}
\`\`\`

### Estados
- [ ] Default
- [ ] Hover
- [ ] Active
- [ ] Disabled
- [ ] Loading
- [ ] Error
- [ ] Empty

### Dependências Visuais
- Ícones:
- Imagens:
-outros componentes:

### Padrões Identificados
- [ ] Compound Components
- [ ] Controlled/Uncontrolled
- [ ] Slot Pattern
- [ ] Custom Hook interno

### Proposta de Skill
**Nome**: ui-[kebab-case-name]
**Resumo**: ...
**Quando usar**: ...
```

### Template: Análise de Fluxo
```markdown
## [Nome do Fluxo]

### Diagrama
```
[Trigger] → [Input] → [Processamento] → [Output]
                ↓              ↓
            [Validação]    [Erro/Retry]
```

### Etapas
1. **Nome da Etapa**: descrição breve
   - Responsabilidade:
   - Dependências:
   - Próximo passo:

### Tratamento de Erro
- **Tipo de erro**: handling
- **Fallback**: ação de recuperação

### Skill Proposta
**Nome**: flow-[kebab-case-name]
**Resumo**: Automatiza o fluxo completo de...
**Entrada**: dados necessários
**Saída**: resultado esperado
**Pontos de extensão**: onde customization é possível
```

## Casos de Uso Avançados

### 1. Migração de Código
Quando o usuário quer migrar de uma tecnologia para outra:
1. Analise o código existente em profundidade
2. Identifique abstrações/interface
3. Proponha mapeamentos tecnológicos
4. Crie skill de migração com steps específicos

### 2. Documentação Automática
1. Analise componentes e fluxos
2. Extraia API shapes, props, side effects
3. Gere documentação em formato padronizado
4. Crie skill de "documentar novo componente"

### 3. Otimização de Performance
1. Analise padrões de renderização
2. Identifique re-renders desnecessários
3. Proponha memoização/caching
4. Crie skill de "audit performance"

### 4. Testes Automatizados
1. Analise lógica de componentes/fluxos
2. Identifique edge cases
3. Proponha estratégia de testes
4. Crie skill de "gerar testes para [tipo]"

### 5. Refatoração Guiada
1. Analise código legado
2. Identifique code smells
3. Proponha novo design
4. Crie skill de "refatorar para [padrão]"

## Exemplos de Skills Geradas por Esta Skill

| Skill Gerada | Inspiração | Uso |
|--------------|------------|-----|
| `ui-button-system` | Button, Input, Label, SharedUI | Sistema consistente de botões |
| `flow-authentication` | AuthProvider, auth routes | Fluxo completo de auth |
| `hook-profile-state` | useProfileState, useProfileData | Gerenciamento de estado de perfil |
| `flow-resume-export` | SmartExportModal, VectorResume | Exportação de currículo |
| `ui-3d-cards` | PremiumCard3D, CareerOrbit3D | Componentes 3D |
| `flow-job-match` | useJobMatch, JobMatchBadge | Algoritmo de matching |
| `util-sharing` | sharing.ts | Compartilhamento social |

## Dicas para Análise Profunda

### Para TypeScript/JavaScript:
```bash
# Ver estrutura de tipos
grep -r "interface\|type\|enum" --include="*.ts" --include="*.tsx"

# Ver imports/exports
grep -r "^import\|^export" --include="*.ts" --include="*.tsx"

# Ver dependências
cat package.json
```

### Para Componentes React:
```bash
# Listar todos componentes
grep -r "function\|const.*=" --include="*.tsx" | grep -v "^import"

# Ver hooks
grep -r "use[A-Z]" --include="*.tsx"
```

### Para Fluxos/Páginas:
```bash
# Listar rotas
find src/app -name "page.tsx" -o -name "page.jsx"
find src/pages -name "*.tsx" -o -name "*.jsx"
```

## Checklist de Análise Completa

Para cada skill que você for criar, garanta ter respondido:

- [ ] Qual é o propósito deste componente/fluxo?
- [ ] Quais são as entradas e saídas?
- [ ] Quais estados ele gerencia?
- [ ] Quais side effects existem?
- [ ] Quais dependências externas?
- [ ] Como se integra com o resto do app?
- [ ] Quais são os edge cases?
- [ ] Como é tratado o erro?
- [ ] Qual é o nível de complexidade?
- [ ] Pode ser generalizado ou é muito específico?
- [ ] Vale a pena criar uma skill separada?

Se >= 7 checkmarks são "sim", crie a skill.
