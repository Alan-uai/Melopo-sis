---
name: code-reviewer
description: |
  Use esta skill para revisar código verificando: anti-padrões, modularização, manutenibilidade, TypeScript, completude (sem placeholders), segurança (XSS, injection, secrets), UI/UX (acessibilidade, responsividade), performance, compatibilidades, hacker/injeção (SQL, code injection, CSRF), e conformidade com o pedido original. Ative quando o agente julgar necessário ou quando solicitado pelo usuário. Synonyms: "revisar", "review", "verificar código", "checar", "auditar código", "code audit", "code review".
---

# Skill: Code Reviewer

## Princípio Fundamental

Esta skill está disponível como ferramenta opcional para revisar código quando o agente ou usuário julgar necessário. O objetivo é garantir qualidade, segurança e conformidade.

## Quando Usar

**Considere usar quando:**
- O agente sentir necessidade de validar código antes de entregar
- O usuário solicitar revisão
- After changes that touch critical areas (segurança, autenticação, etc.)
- Antes de commits importantes ou pull requests
- Quando houver dúvida sobre qualidade do código gerado

## Fluxo de Verificação

```
Código Gerado
    ↓
[1. Anti-Padrões] ──────► Issues → [RELATÓRIO]
    ↓
[2. Modularização] ──────► Issues → [RELATÓRIO]
    ↓
[3. Manutenibilidade] ───► Issues → [RELATÓRIO]
    ↓
[4. TypeScript] ─────────► Erros → [RELATÓRIO]
    ↓
[5. Completude] ─────────► Placeholders → [RELATÓRIO]
    ↓
[6. Segurança] ───────────► Issues → [RELATÓRIO]
    ↓
[7. UI/UX] ──────────────► Issues → [RELATÓRIO]
    ↓
[8. Performance] ────────► Issues → [RELATÓRIO]
    ↓
[9. Compatibilidades] ───► Issues → [RELATÓRIO]
    ↓
[10. Hacker/Injeção] ────► Issues → [RELATÓRIO]
    ↓
[11. Conformidade] ───────► Issues → [RELATÓRIO]
    ↓
[✓ PASSOU] ───────────────► Silêncio → Entrega
```

## Categorias de Verificação

### 1. Anti-Padrões
Verificar usando skill `anti-padroes-proibidos`:
- Código duplicado
- Lógica em componente
- Uso de `any`
- Acesso direto a API no UI
- Dados não validados
- Secrets expostos

### 2. Modularização
Verificar usando skill `modularizacao-total`:
- Separação correta de camadas
- Responsabilidade única
- Imports organizados

### 3. Manutenibilidade
Verificar usando skill `manutenibilidade`:
- Funções pequenas (20-30 linhas)
- Nomes descritivos
- Sem efeitos colaterais
- Empty states funcionais

### 4. TypeScript
```bash
npx tsc --noEmit
```
- Compilação sem erros
- Tipos corretos
- Sem `any` implícito

### 5. Completude
**PROIBIDO:**
- Placeholders: `"Em breve"`, `"TODO"`, `"将来"`
- Empty states vazios
- Comentários de implementação pendente

**OBRIGATÓRIO:**
- Empty states funcionais
- Estados de loading reais
- Mensagens de erro úteis

### 6. Segurança
Verificar:
- XSS: `dangerouslySetInnerHTML` sem sanitização
- Injection: SQL params, code eval
- Secrets: variáveis de ambiente, não hardcoded
- CSRF: tokens em forms
- Input validation

### 7. UI/UX
- Acessibilidade: `aria-*`, `alt`, `tabindex`
- Responsividade: mobile-first
- Cores: contraste WCAG AA
- Loading states
- Error states

### 8. Performance
- Re-renders desnecessários
- Bundle size
- Lazy loading
- Images otimizadas

### 9. Compatibilidades
- Browser support
- Node version
- Dependências versionadas

### 10. Hacker/Injeção
- SQL injection
- Command injection
- Code injection
- Path traversal
- XXE
- SSRF

### 11. Conformidade
Verificar:
- Código atende o pedido original?
- Todas as funcionalidades implementadas?
- Nenhuma funcionalidade extra não solicitada?

## Formato do Relatório

### Console (JSON)
```json
{
  "review_id": "rev-{timestamp}",
  "agent_task": "nome-da-tarefa",
  "status": "PASSED" | "NEEDS_REVISION" | "FAILED",
  "issues_count": 0,
  "checks": {
    "anti_patterns": { "passed": true, "issues": [] },
    "modularization": { "passed": true, "issues": [] },
    "maintainability": { "passed": true, "issues": [] },
    "typescript": { "passed": true, "errors": [] },
    "completeness": { "passed": true, "issues": [] },
    "security": { "passed": true, "issues": [] },
    "ui_ux": { "passed": true, "issues": [] },
    "performance": { "passed": true, "issues": [] },
    "compatibility": { "passed": true, "issues": [] },
    "hacker_injection": { "passed": true, "issues": [] },
    "conformity": { "passed": true, "issues": [] }
  },
  "summary": "string",
  "action_required": "string | null"
}
```

### Markdown (Arquivo)
```markdown
# Code Review Report

**Agent:** `nome-do-agente`  
**Task:** `descrição-da-tarefa`  
**Status:** ✅ PASSED | ⚠️ NEEDS REVISION | ❌ FAILED

## Summary
{X} issues found

## Issues by Category

### 🔴 HIGH: Security
**File:** `path/to/file.ts:45`
```tsx
// Código vulnerável
dangerouslySetInnerHTML={{ __html: userContent }}
// Correção: Usar DOMPurify.sanitize()
```

### 🟡 MEDIUM: Completeness
**File:** `path/to/file.ts:12`
```tsx
// Placeholder encontrado
return <div>Em breve...</div>
// Correção: Empty state funcional
```

## Checks Results

| Category | Status |
|----------|--------|
| Anti-Padrões | ✅ |
| Modularização | ✅ |
| Manutenibilidade | ✅ |
| TypeScript | ✅ |
| Completude | ⚠️ |
| Segurança | ✅ |
| UI/UX | ✅ |
| Performance | ✅ |
| Compatibilidades | ✅ |
| Hacker/Injeção | ✅ |
| Conformidade | ✅ |

## Action Required
{Correções necessárias ou "None"}
```

## Ações

### Se PASSED
1. Silêncio
2. Continuar normalmente

### Se NEEDS_REVISION
1. Gerar relatório com issues encontrados
2. Oferecer correções sugeridas ao usuário
3. Aguardar decisão do usuário ou agente sobre aplicar correções

### Se FAILED
1. Reportar erros de compilação específicos
2. Sugerir correções quando possível

## Recomendações

1. **SEJA específico** nos relatórios (file, line, código)
2. **FORNEÇA correção** junto com cada issue
3. **MANTENHA silêncio** se tudo passou
4. **USE outras skills** para verificações específicas
5. **USE seu julgamento** sobre quando é valioso revisar

## Integração com Outras Skills

Para verificações detalhadas, use as skills existentes:
- `anti-padroes-proibidos` - Para código duplicado, any, etc.
- `modularizacao-total` - Para separação de camadas
- `manutenibilidade` - Para funções e empty states
- `seguranca-zero-confianca` - Para validação e segurança

## Checklist Opcional

Use como guia quando julgar necessário:

- [ ] Nenhum placeholder/TODO encontrado
- [ ] Compilação TypeScript passou (se aplicável)
- [ ] Empty states funcionais implementados
- [ ] Sem `any` no código (se TypeScript)
- [ ] Lógica isolada em hooks/services
- [ ] Funções com tamanho adequado
- [ ] Segurança validada
- [ ] Acessibilidade básica (alt, aria)
- [ ] Código atende pedido original