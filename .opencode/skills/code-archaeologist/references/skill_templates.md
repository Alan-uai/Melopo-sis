# Templates para Geração de Skills

## Template Base para SKILL.md

```yaml
---
name: skill-name
description: |
  Descrição clara do que a skill faz.
  Quando usar: contextos específicos de ativação.
  Formato: Uma linha descritiva + contextos de uso.
---

# Skill Title

## Visão Geral
Breve descrição do propósito.

## Como Usar
Instruções de uso.

## Exemplos
Exemplos práticos.
```

## Template: Skill de Componente UI

```yaml
---
name: ui-[component-name]
description: |
  Componente [ComponentName] - {description}.
  Use quando: usuário menciona {keywords}, quer {actions}.
  Ativa especialmente em contextos de {context}.
---

# [ComponentName] Component

## Props
\`\`\`typescript
interface Props {
  // Required
  children?: React.ReactNode;
  className?: string;
}
\`\`\`

## Estados Visuais
- Default, Hover, Active, Disabled, Loading, Error, Empty

## Exemplo
\`\`\`tsx
<[ComponentName]>
  Content
</[ComponentName]>
\`\`\`
```

## Template: Skill de Hook

```yaml
---
name: hook-[hook-name]
description: |
  Hook {hookName} - {description}.
  Use quando: usuário menciona {keywords}, precisa de {hookName}.
---

# {hookName} Hook

## Assinatura
\`\`\`typescript
function {hookName}(options?: Options): ReturnType
\`\`\`

## Parâmetros
| Nome | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| options | Options | {} | Configurações |

## Retorno
\`\`\`typescript
{
  data: T,
  isLoading: boolean,
  error: Error | null
}
\`\`\`

## Uso
\`\`\`tsx
const { data } = use{hookName}();
\`\`\`
```

## Template: Skill de Fluxo

```yaml
---
name: flow-[flow-name]
description: |
  Automação do fluxo {flowName} - {description}.
  Use quando: usuário menciona {keywords}, quer {actions}.
---

# {flowName} Flow

## Diagrama
```
[Trigger] → [Validate] → [Process] → [Save] → [Respond]
```

## Etapas
1. Receber input
2. Validar dados
3. Processar lógica
4. Salvar resultado
5. Retornar resposta

## Configuração
\`\`\`typescript
const config = {
  // options
};
\`\`\`
```

## Checklist de Qualidade

Antes de finalizar uma skill, verifique:

- [ ] Nome segue convenção `tipo-nome`
- [ ] Descrição menciona contextos de ativação
- [ ] Exemplos são práticos e copiáveis
- [ ] Inputs/outputs estão documentados
- [ ] Edge cases estão mencionados
- [ ] Erros comuns estão listados
- [ ] Referencias a outros arquivos estão corretas
