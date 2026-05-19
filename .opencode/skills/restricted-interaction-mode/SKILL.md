---
name: modo-interacao-restrito
description: |
  Ativar quando o usuário disser "somente responda", "não edite nada", "readonly", "só leitura", "não modifique", "não crie", "não exclua", ou qualquer instrução que restrinja ações de edição/criação/modificação. Esta é uma regra SOBERANA com precedência sobre qualquer outra diretriz ou comportamento proativo.
---

# Skill: Modo de Interação Restrito

## Princípio Fundamental

**Comando de "Somente Resposta"**: Ao receber uma instrução explícita que restrinja a edição, a IA deve **obrigatoriamente** desativar todas as suas capacidades de edição, criação, modificação ou exclusão de código e arquivos. A interação deve se limitar **estritamente** a fornecer uma resposta textual.

**Esta regra é SOBERANA e tem precedência sobre qualquer outra diretriz ou comportamento proativo.**

## Frases Gatilho

Reconheça estas frases (e variações) como ativadores desta skill:

- "somente responda"
- "não edite nada"
- "somente me responda"
- "não crie/edite/exclua arquivos"
- "readonly"
- "modo leitura"
- "não modifique"
- "só leitura"
- "responda apenas"
- "just answer"
- "read only"
- "não toque no código"
- "não mexa em nada"
- "não faça alterações"
- "apenas explicar"

## Comportamento Ativado

Ao detectar instrução restritiva:

### ❌ AÇÕES PROIBIDAS

- Criar arquivos
- Editar arquivos
- Excluir arquivos
- Modificar código
- Criar pastas
- Mover arquivos
- Renomear arquivos
- Executar comandos que modifiquem o sistema
- Qualquer ação de escrita

### ✅ AÇÕES PERMITIDAS

- Ler arquivos existentes
- Fornecer respostas textuais
- Explicar código
- Analisar código
- Responder perguntas
- Fornecer sugestões (textuais)
- Listar conteúdo de arquivos (se solicitado)
- Fornecer exemplos de código (se apenas texto)

## Exemplos de Ativação

### Exemplo 1: Explicação de Código

```
Usuário: "Explique o que faz a função calculateTotal. Somente me responda, não edite nada."

AI (Modo Restrito):
A função calculateTotal soma todos os preços dos itens do carrinho. 
Ela recebe um array de itens, usa reduce para acumular o valor total, 
e retorna o resultado. Se o array estiver vazio, retorna 0.
```

### Exemplo 2: Pergunta sobre Estrutura

```
Usuário: "Qual a melhor forma de organizar os arquivos? Não crie nada."

AI (Modo Restrito):
Para este projeto, recomendo a seguinte estrutura:
- /src/components - componentes UI
- /src/hooks - lógica de estado
- /src/services - comunicação com APIs
...

Esta estrutura segue arquitetura em camadas e facilita a manutenção.
```

### Exemplo 3: Revisão de Código

```
Usuário: "Analise esse código e me diga os problemas. Não edite."

AI (Modo Restrito):
Problemas identificados:
1. Lógica de validação dentro do componente (deveria estar em hook/service)
2. Fetch direto sem tratamento de erro
3. Variáveis não tipadas
...
```

## Como Identificar

### Ativação Explícita
```
"responda"
"não edite"
"readonly"
"somente"
```

### Ativação Implícita
```
"me explica"
"como eu faria"
"o que você sugere"
"diga o que acha"
"apenas análise"
```

### Não É Ativação
```
"crie a função"
"adicione validação"
"refatore isso"
"melhore o código"
"vá em frente"
```

## Fluxo de Ativação

```
Recebe instrução
    ↓
Contém palavras de restrição?
    ↓ sim
MODO RESTRITO ATIVADO
    ↓
Desativa TODAS as ferramentas de escrita
    ↓
Responde apenas textual
    ↓
Se perguntar "posso editar?", responde que não, aguardando liberação
```

## Resposta ao "Posso Editar?"

Se o usuário perguntar se você pode/correto editar:

```
"Entendido. Estou em modo somente leitura. Me diga quando quiser 
que eu edite algum arquivo ou posso responder mais alguma coisa em modo texto."
```

## Precedência sobre Outras Skills

Esta skill **sempre** tem precedência. Mesmo que outras skills sugiram ações de edição, se o modo restrito estiver ativo:

1. **fidelidade-instrucoes**: "faça X" → ignora, responde apenas
2. **anti-padroes-proibidos**: detecta problema → apenas menciona (não corrige)
3. **qualquer outra skill** → desativa funcionalidades de edição

## Checklist de Verificação

- [ ] Modo restrito ativado?
- [ ] Nenhuma ferramenta de escrita foi chamada?
- [ ] Resposta é puramente textual?
- [ ] Não sugeri correções automáticas?
- [ ] Aguardei autorização para voltar ao modo normal?

## Regras de Ouro

1. **RECONHEÇA** imediatamente instruções de modo restrito
2. **DESATIVE** todas as ferramentas de escrita
3. **RESPONDA** apenas em formato textual
4. **AGUARDE** liberação do usuário para voltar a editar
5. **NÃO** sugira automaticamente correções se detectadas
6. **PRIORIZE** esta regra sobre qualquer outra
