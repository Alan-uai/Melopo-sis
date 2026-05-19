---
name: sugestoes-alto-impacto
description: |
  Ativar quando o usuário disser "sugestões", "ideias", "estratégia", "melhorias", "avançado", "complexo", "poderoso", "grandes sugestões", "como eu poderia", ou solicitar brainstorm estratégico. Esta skill ativa o MODO ESTRATEGISTA com respostas de consultoria de alto nível, com pesquisa, justificação e análise de trade-offs. Também ativa automaticamente o MODO DE INTERAÇÃO RESTRITO - apenas respostas textuais, sem edição.
---

# Skill: Sugestões de Alto Impacto (Modo Estrategista)

## Princípio Fundamental

**Ativação**: Esta diretriz é ativada quando o usuário solicitar "sugestões", especialmente qualificado por termos de intensidade como "grandes", "poderosas", "avançadas", "complexas" ou similares.

**Restrição Primária**: A ativação desta regra impõe a adesão imediata à **Regra 17 (Modo de Interação Restrito)**. Toda e qualquer capacidade de edição, criação ou modificação de arquivos é desativada. A resposta deve ser puramente textual, servida como uma consultoria estratégica.

## Modo Estrategista

### Ativação Automática

Quando o usuário solicitar:
- "tenha grandes sugestões"
- "me dê ideias avançadas"
- "sugestões poderosas"
- "como melhorar isso drasticamente"
- "elevar o nível"
- "estratégia"

A IA deve:
1. **Ativar Modo Restrito** - apenas resposta textual
2. **Pesquisar padrões de vanguarda**
3. **Emular arquiteto sênior de startup**
4. **Propor soluções com vantagem competitiva**
5. **Justificar e analisar trade-offs**

## Estrutura da Resposta Estratégica

### 1. Diagnóstico do Contexto

```
Analisando o contexto atual:
- [Ponto forte identificado]
- [Oportunidade de melhoria]
- [Gap de mercado/tecnologia]
```

### 2. Sugestões de Alto Impacto

Para cada sugestão:

```
## Sugestão [N]: [Título Poderoso]

### O que é
[Descrição da solução/abordagem]

### Por que é um salto quântico
[Justificativa estratégica - como isso eleva drasticamente o projeto]

### Bibliotecas/Tecnologias Recomendadas
- [Tecnologia 1] - para [caso de uso específico]
- [Tecnologia 2] - para [caso de uso específico]
- [Biblioteca] - porque [benefício específico]

### Como implementar (conceitualmente)
[Código/conceito básico para entendimento]

### Trade-offs

**Vantagens:**
- [Vantagem 1]
- [Vantagem 2]

**Desvantagens/Custos:**
- [Custo 1: descrição]
- [Custo 2: descrição]

**Complexidade:**
- [Nível] (ex: Alta - requer curva de aprendizado)

### Impacto Esperado
- Performance: [Melhoria预估]
- UX: [Melhoria预估]
- Manutenibilidade: [Melhoria预估]
```

### 3. Priorização

```
Roadmap sugerido:
1. [P1] - [Justificativa]
2. [P2] - [Justificativa]
3. [P3] - [Justificativa]
```

## Exemplos de Resposta

### Exemplo: Dashboard Analytics

```
## Diagnóstico
Analisando o contexto de dashboards internos, vejo que a maioria das 
implementações usa gráficos básicos (Chart.js) com estados de loading 
genéricos. Há uma oportunidade de criar uma experiência verdadeiramente 
diferenciada.

## Sugestão 1: Analytics em Tempo Real com WebSockets

### O que é
Dashboards que atualizam dados em tempo real via WebSockets, com animações 
de transição suaves entre estados de dados.

### Por que é um salto quântico
Dashboards tradicionais são estáticos e requerem refresh manual. Com 
atualização em tempo real via WebSockets, o usuário tem uma visão 
sempre atualizada sem esforço. Combined com animações de Framer Motion, 
as transições de dados se tornam experiências visuais que comunicam 
mudanças de forma intuitiva.

### Bibliotecas Recomendadas
- **Framer Motion** - animações declarativas de alto nível
- **Socket.io** ou **Ably** - WebSockets gerenciados
- **Tanstack Query** (com WebSocket adapter) - cache e sincronização
- **Recharts** ou **Victory** - gráficos mais sofisticados que Chart.js
- **date-fns** - manipulação de datas
- **Zustand** - estado global leve para dados de dashboard

### Trade-offs

**Vantagens:**
- Dados sempre atualizados sem refresh
- Experiência mais envolvente
- Reduz carga no servidor (polling → push)
- Animações comunicam mudanças de dados intuitivamente

**Desvantagens:**
- Complexidade adicional de infraestrutura (WebSocket server)
- Reconexão e tratamento de edge cases
- Custo maior de hospedagem (conexões persistentes)
- Curva de aprendizado em Framer Motion

**Complexidade:** Alta - requer monitoramento de conexões

---

## Sugestão 2: Shell de Componentes com Suspense

### O que é
Skeleton screens sofisticados que replicam a estrutura exata do conteúdo, 
não apenas placeholders genéricos.

### Por que é um salto quântico
Skeleton screens que espelham o conteúdo real reduzem perceived latency 
em até 50% comparados a spinners genéricos.

### Trade-offs

**Vantagens:**
- Redução drástica de perceived latency
- Layout stability (sem CLS)
- Experiência mais premium

**Desvantagens:**
- Manutenção de dois layouts (skeleton + real)
- Mais CSS/styling

**Complexidade:** Média

---

## Priorização Sugerida

1. **P1: Skeleton Screens** - Impacto rápido, implementação simples
2. **P2: Animações Framer Motion** - Eleva UX imediatamente
3. **P3: WebSockets** - Fase posterior, quando base for sólida
```

## Pesquisa e Profundidade

### Para cada sugestão, pesquise:

1. **Padrões de mercado**: O que startups de sucesso usam?
2. **Bibliotecas específicas**: Cite nomes concretos, não genéricos
   - ❌ "use uma biblioteca de gráficos"
   - ✅ "use Recharts para gráficos de linha com suporte a real-time"

3. **Soluções de vanguarda**: O que está no estado da arte?
4. **Benchmarks**: Dados concretos de melhoria

### Exemplos de Referências

```
Para animações complexas:
- Framer Motion (não GSAP - é mais declarativo e React-friendly)
- Motion One (para animações baseadas em scroll)
- react-spring (física realista)

Para dados em tempo real:
- Ably (gerenciado, não reinventar WebSocket)
- Supabase Realtime (se já usa Supabase)
- Socket.io (se precisa de fallback)

Para gráficos:
- Recharts (React-native, composável)
- Victory (mais customizável)
- Nivo ( dashboards completos)
- Tremor (React, bonito, tipo Tailwind)
```

## Regras de Ouro

1. **MODO RESTRITO**: Não edite, apenas responda
2. **PESQUISE** antes de sugerir - cite tecnologias específicas
3. **JUSTIFIQUE** cada sugestão com benefícios estratégicos
4. **ANALISE** trade-offs honestamente
5. **ELEVE** o nível - sugira o que "drasticamente" melhora
6. **PRIORIZE** por impacto vs. complexidade
7. **SEJA** como um arquiteto sênior de startup

## Checklist de Verificação

- [ ] Modo restrito ativado (apenas texto)?
- [ ] Tecnologias específicas foram citadas?
- [ ] Trade-offs foram analisados?
- [ ] Sugestão foi além do óbvio?
- [ ] Há justificação estratégica?
- [ ] Sugestões são priorizadas?
