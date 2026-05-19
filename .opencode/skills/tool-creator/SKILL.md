---
name: tool-creator
description: Create MCP tools with maximum security validation. Use when user mentions "criar ferramenta", "criar tool", "MCP tool", "tool para MCP", "desenvolver tool", "implementar ferramenta", ou quando precisar criar ferramentas executáveis para servidores MCP. Inclui validação de segurança rigorosa, sanitização de entrada, rate limiting, e审计 logging.
---

# Tool Creator

Cria ferramentas (tools) seguras e bem estruturadas para servidores MCP. Cada tool criada deve seguir os padrões de segurança máxima do ecossistema MCP.

## Quando Usar

Use esta skill SEMPRE que:
- O usuário solicitar criação de uma ferramenta MCP
- Precisar implementar functions/executables para um MCP server
- Estiver definindo tools que o LLM pode chamar
- Precisar criar ferramentas com validação de entrada e sanitização

## Áreas Suportadas

A skill cria tools para estas categorias MCP:

1. **Database**: PostgreSQL, MySQL, MongoDB, SQLite, Redis, ClickHouse, Neo4j, Elasticsearch
2. **Cloud/Infra**: AWS, GCP, Azure, Vercel, Railway, Heroku, DigitalOcean
3. **Communication**: Slack, Discord, Telegram, WhatsApp, Email (SMTP, SendGrid, Mailgun)
4. **Productivity**: Notion, Linear, Asana, Jira, Trello, Monday, ClickUp
5. **DevTools**: GitHub, GitLab, Bitbucket, Docker, Kubernetes
6. **Storage**: S3, Google Drive, Dropbox, Box, FTP, WebDAV
7. **Search/Web**: Brave Search, Tavily, Perplexity, Firecrawl, ScraperAPI
8. **Analytics**: Datadog, Sentry, Mixpanel, Amplitude, GA4
9. **Payments**: Stripe, PayPal, MercadoPago, Pagarme
10. **CRM**: Salesforce, HubSpot, Pipedrive
11. **Design**: Figma, Sketch, Miro, Canva
12. **Marketing**: HubSpot, Mailchimp, Buffer, Hootsuite
13. **Security**: Auth0, Cloudflare, Vault, GPG, SSH
14. **AI/ML**: OpenAI, Anthropic, HuggingFace, Weights & Biases
15. **Browser**: Playwright, Puppeteer, Selenium
16. **Files**: Filesystem, PDF processing, Document conversion
17. **Monitoring**: Prometheus, Grafana, New Relic
18. **IoT**: Home Assistant, MQTT, Zigbee
19. **Finance**: Bloomberg, YFinance, Crypto APIs
20. **Social**: LinkedIn, Twitter, Instagram, Facebook
21. **Media**: YouTube, Spotify, Twitch
22. **Learning**: Wolfram, Khan Academy, Coursera API
23. **Healthcare**: FHIR, HL7, hospital systems
24. **Legal**: Westlaw, LexisNexis
25. **Government**: APIs governamentais, transparência
26. **Custom**: APIs REST/GraphQL customizadas

## Processo de Criação

### Step 1: Validar Requisitos

Antes de criar qualquer tool, valide:

1. **Escopo**: Qual área/categoria?
2. **Operações**: Quais operações (CRUD, search, execute)?
3. **Autenticação**: Qual método (API key, OAuth, JWT, Basic)?
4. **Dados**: Quais dados de entrada/saída?
5. **Segurança**: Requisitos especiais?

### Step 2: Estrutura da Tool

Cada tool deve seguir esta estrutura:

```python
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any
import logging
import asyncio

# Logging para auditoria
logger = logging.getLogger(__name__)

# Rate limiting
RATE_LIMIT = 100  # chamadas por minuto
RATE_WINDOW = 60

# Validadores de entrada
class ToolInput(BaseModel):
    # Campos com validação rigorosa
    query: Optional[str] = Field(None, max_length=500)
    
    @validator('query')
    def sanitize_query(cls, v):
        if v:
            # Sanitização de SQL injection
            dangerous_patterns = ['DROP', 'DELETE', 'INSERT', 'UPDATE', '--', ';', '/*', '*/']
            v_upper = v.upper()
            for pattern in dangerous_patterns:
                if pattern in v_upper:
                    raise ValueError(f"Pattern '{pattern}' is not allowed")
        return v

mcp = FastMCP("Tool Name")

@mcp.tool()
def tool_function(input_data: ToolInput) -> str:
    """
    Descrição clara do que a tool faz.
    
    Args:
        input_data: Dados de entrada validados
        
    Returns:
        Resultado formatado como string ou objeto estruturado
    """
    logger.info(f"Tool invoked with: {input_data}")
    
    # Rate limiting check
    if not check_rate_limit():
        raise Exception("Rate limit exceeded")
    
    try:
        # Lógica da tool
        result = execute_operation(input_data)
        return format_result(result)
    except Exception as e:
        logger.error(f"Tool error: {e}")
        raise
```

### Step 3: Validação de Segurança

Cada tool DEVE incluir:

1. **Input Validation**:
   - Pydantic models com validação rigorosa
   - Tipos específicos (não usar `Any` desnecessário)
   - Limites de tamanho (max_length, max_items)
   - Enumeração para valores válidos

2. **Sanitization**:
   - Escape de caracteres especiais
   - Validação de paths (Directory Traversal protection)
   - URL validation
   - Email validation

3. **Rate Limiting**:
   - Implementar token bucket ou sliding window
   - Configurable limits
   - Logging de tentativas excedidas

4. **Audit Logging**:
   - Log de todas as invocações
   - Timestamp, user, parameters (sem sensitive data)
   - Log de erros com stack trace

5. **Error Handling**:
   - Try/catch em operações externas
   - Graceful degradation
   - User-friendly error messages

6. **Sensitive Data**:
   - Nunca expor API keys em logs
   - Mascarar dados sensíveis em respostas
   - Usar environment variables para secrets

### Step 4: Output Format

Retorne sempre:

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "ISO8601",
    "tool_name": "...",
    "execution_time_ms": 123
  }
}
```

Ou em caso de erro:

```json
{
  "success": false,
  "error": "Mensagem amigável",
  "error_code": "ERROR_CODE",
  "details": { ... }
}
```

## Template Boilerplate

Para criar uma tool rapidamente:

```python
"""
{tool_name} - MCP Tool
Category: {category}
Created: {date}
Security Level: Maximum
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field, validator

# ============== SECURITY CONFIG ==============
SECURITY_CONFIG = {
    "max_request_size": 1024 * 1024,  # 1MB
    "rate_limit_per_minute": 60,
    "timeout_seconds": 30,
    "allowed_origins": ["*"],
    "require_auth": True,
}

# ============== AUDIT LOGGING ==============
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== RATE LIMITER ==============
class RateLimiter:
    def __init__(self, max_calls: int, window_seconds: int):
        self.max_calls = max_calls
        self.window = window_seconds
        self.calls = []
    
    def is_allowed(self) -> bool:
        now = datetime.now().timestamp()
        self.calls = [c for c in self.calls if now - c < self.window]
        if len(self.calls) >= self.max_calls:
            return False
        self.calls.append(now)
        return True

rate_limiter = RateLimiter(
    SECURITY_CONFIG["rate_limit_per_minute"],
    60
)

# ============== INPUT MODEL ==============
class ToolInput(BaseModel):
    # Campos com validação
    pass

# ============== MCP SERVER ==============
mcp = FastMCP("{tool_name}")

@mcp.tool()
def execute_tool(input_data: ToolInput) -> str:
    if not rate_limiter.is_allowed():
        raise Exception("Rate limit exceeded. Please try again later.")
    
    logger.info(f"Executing tool: {input_data}")
    
    try:
        result = do_operation(input_data)
        return format_response(result)
    except Exception as e:
        logger.error(f"Tool execution failed: {e}")
        raise

def do_operation(input_data: ToolInput) -> Any:
    pass

def format_response(result: Any) -> str:
    pass

if __name__ == "__main__":
    import asyncio
    from mcp.server.stdio import stdio_server
    
    async def main():
        async with stdio_server() as (read, write):
            await mcp.run(read, write, None)
    
    asyncio.run(main())
```

## Categorias e Examples

### Database Tools
- Query executor (read-only por padrão)
- Schema inspector
- Data export/import
- Connection pool manager

### API Tools
- REST/GraphQL client
- Webhook receiver
- OAuth handler
- API key manager

### File Tools
- File reader/writer
- Directory lister
- File converter
- Backup manager

### Communication Tools
- Message sender
- Channel manager
- Notification dispatcher
- Email composer

### DevOps Tools
- CI/CD trigger
- Deploy manager
- Log viewer
- Metrics fetcher

## Validação Final

Antes de entregar uma tool, verifique:

- [ ] Input validation com Pydantic
- [ ] Rate limiting implementado
- [ ] Audit logging configurado
- [ ] Error handling graceful
- [ ] No sensitive data exposure
- [ ] Timeout configurado
- [ ] Tests unitários incluídos
- [ ] Documentação completa
- [ ] Type hints em todas funções

## Chamando Outras Skills

Se a tool criada precisar de validação adicional de segurança, use:

```
Invoke skill: seguranca-zero-confianca
```

Para validação de código e anti-patterns:

```
Invoke skill: anti-padroes-proibidos
```

Para garantir tipagem rigorosa:

```
Invoke skill: tipagem-rigorosa
```