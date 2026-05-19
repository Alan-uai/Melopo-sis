---
name: mcp-creator
description: Cria MCP servers completos e seguros. Use quando usuário mencionar "criar MCP", "desenvolver MCP", "MCP server", "implementar Model Context Protocol", "build MCP", "new MCP", ou quando precisar criar um servidor MCP do zero. Esta skill coordena a criação de tools, validação de segurança e estrutura do projeto automaticamente.
---

# MCP Creator

Cria MCP servers completos, seguros e bem estruturados. Esta é a skill principal que orquestra todas as outras skills auxiliares para criar um MCP server de produção.

## Quando Usar

Use esta skill SEMPRE que:
- O usuário solicitar criação de um MCP server
- Precisar desenvolver um novo servidor MCP
- Quiser criar tools para um MCP existente
- Precisar estruturar um projeto MCP
- Quiser um MCP completo com segurança máxima

## Processo de Criação

### Step 1: Análise de Requisitos

Colete as informações necessárias:

1. **Objetivo do MCP**:
   - Qual serviço/API vai integrar?
   - Quais operações necessárias?
   - Quem vai usar (interno/público)?

2. **Categoria**:
   - Database (PostgreSQL, MySQL, MongoDB, Redis, etc)
   - Cloud (AWS, GCP, Azure, Vercel, etc)
   - Communication (Slack, Discord, Telegram, etc)
   - Productivity (Notion, Linear, Jira, etc)
   - DevTools (GitHub, Docker, K8s, etc)
   - Storage (S3, Drive, Dropbox, etc)
   - Search (Brave, Tavily, Firecrawl, etc)
   - Analytics (Datadog, Sentry, etc)
   - Payments (Stripe, PayPal, etc)
   - CRM (Salesforce, HubSpot, etc)
   - Design (Figma, Miro, etc)
   - AI/ML (OpenAI, Anthropic, etc)
   - Browser (Playwright, Puppeteer)
   - Files (Filesystem, PDF)
   - Custom (API REST/GraphQL)

3. **Requisitos de Segurança**:
   - Nível: Critical/High/Medium/Low
   - Autenticação: API Key, OAuth, JWT
   - Rate limiting: Calls/min
   - Logging: Audit/complete

4. **Linguagem**:
   - Python (recomendado)
   - TypeScript/Node.js
   - Go
   - C#

### Step 2: Chamar Skills Auxiliares

Use as skills auxiliares nesta ordem:

#### 2.1 - Estrutura do Projeto
```
Invoke skill: mcp-structure
```
Para obter a estrutura de diretórios e templates.

#### 2.2 - Criação de Tools
```
Invoke skill: tool-creator
```
Para criar cada tool necessária com:
- Input validation (Pydantic)
- Rate limiting
- Audit logging
- Error handling
- Security checks

#### 2.3 - Validação de Segurança
```
Invoke skill: mcp-security-validator
```
Para validar:
- OWASP Top 10 compliance
- Input sanitization
- SQL injection prevention
- Path traversal prevention
- Authentication/authorization
- Audit logging

#### 2.4 - Validação Adicional (se necessário)
```
Invoke skill: anti-padroes-proibidos
```
Para verificar:
- Código duplicado
- Lógica em componentes errados
- Uso de 'any' desnecessário
- Placeholders/TODOs
- Acesso direto a API no UI

```
Invoke skill: tipagem-rigorosa
```
Para garantir:
- TypeScript/Python tipagem completa
- Sem uso de 'any'
- Interfaces definidas

### Step 3: Implementação

Crie os arquivos necessários:

#### 3.1 Arquivo Principal (main.py)

```python
"""
{server_name} MCP Server
Version: {version}
"""

import logging
from mcp.server.fastmcp import FastMCP
from src.tools import *
from src.models import *
from src.security import *

# Configuration
SERVER_NAME = "{server_name}"
SERVER_VERSION = "0.1.0"

# Setup
logging.basicConfig(level=logging.INFO)
mcp = FastMCP(SERVER_NAME)

# Register tools
@mcp.tool()
def tool_name(...):
    pass

if __name__ == "__main__":
    import asyncio
    from mcp.server.stdio import stdio_server
    
    async def main():
        async with stdio_server() as (read, write):
            await mcp.run(read, write, None)
    
    asyncio.run(main())
```

#### 3.2 Configuração (config.yaml)

```yaml
server:
  name: "{server_name}"
  version: "0.1.0"
  description: "{description}"

security:
  rate_limit:
    calls_per_minute: {rate_limit}
  auth:
    required: true
    method: "{auth_method}"
  input_validation:
    max_string_length: 1000
    max_results: 100

logging:
  level: "INFO"
  format: "json"
  audit_enabled: true
```

#### 3.3 Models (models/requests.py)

```python
from pydantic import BaseModel, Field
from typing import Optional

class ToolInput(BaseModel):
    param1: str = Field(..., max_length=500)
    param2: Optional[int] = Field(None, ge=1, le=1000)
    
    @validator('param1')
    def sanitize(cls, v):
        # Sanitization logic
        return v.strip()
```

#### 3.4 Tools (tools/feature.py)

```python
from mcp.server.fastmcp import FastMCP
from ..models import ToolInput
from ..security import rate_limiter, audit_logger

mcp = FastMCP("server_name")

@mcp.tool()
def tool_function(input_data: ToolInput) -> str:
    # Rate limiting
    if not rate_limiter.is_allowed():
        raise Exception("Rate limit exceeded")
    
    # Audit
    audit_logger.log("tool_function", input_data.dict())
    
    # Implementation
    try:
        result = do_operation(input_data)
        return format_result(result)
    except Exception as e:
        audit_logger.log_error("tool_function", e)
        raise
```

### Step 4: Validação Final

Execute estas verificações:

1. **Security Check**:
   ```
   Invoke skill: mcp-security-validator
   ```
   Passou sem issues críticas?

2. **Code Quality**:
   ```
   Invoke skill: anti-padroes-proibidos
   ```
   Sem code smells?

3. **Typing**:
   ```
   Invoke skill: tipagem-rigorosa
   ```
   Type hints completos?

4. **Estrutura**:
   ```
   Invoke skill: mcp-structure
   ```
   Estrutura segue padrões?

## Áreas MCP Suportadas

### Databases
- PostgreSQL (with connection pooling)
- MySQL
- MongoDB
- Redis (caching, sessions)
- ClickHouse (analytics)
- Elasticsearch (search)
- Neo4j (graph)
- SQLite (local)

### Cloud & Infrastructure
- AWS (EC2, S3, Lambda, RDS)
- GCP (Compute, Storage, Cloud SQL)
- Azure (Compute, Blob, SQL)
- Vercel (deployments)
- Railway
- Heroku
- DigitalOcean

### Communication
- Slack (messages, channels, webhooks)
- Discord (messages, servers)
- Telegram (bots, messages)
- WhatsApp (business API)
- Email (SMTP, SendGrid, Mailgun)

### Productivity
- Notion (pages, databases)
- Linear (issues, projects)
- Asana (tasks, projects)
- Jira (issues, workflows)
- Trello (boards, cards)
- Monday (boards, items)
- ClickUp (tasks)

### Developer Tools
- GitHub (repos, issues, PRs, actions)
- GitLab (repos, pipelines)
- Docker (images, containers)
- Kubernetes (pods, services)
- Sentry (errors, events)

### Storage
- S3 (files, buckets)
- Google Drive (files, folders)
- Dropbox (files)
- Box (files)
- FTP/WebDAV

### Search & Web
- Brave Search
- Tavily
- Perplexity
- Firecrawl
- ScraperAPI

### Analytics & Monitoring
- Datadog
- Sentry
- Mixpanel
- Amplitude
- Google Analytics 4
- Prometheus
- Grafana

### Payments
- Stripe
- PayPal
- MercadoPago
- Pagarme

### CRM
- Salesforce
- HubSpot
- Pipedrive

### Design
- Figma (files, components)
- Miro (boards)
- Canva

### AI & ML
- OpenAI (GPT models)
- Anthropic (Claude)
- HuggingFace (models)
- Weights & Biases

### Browser Automation
- Playwright
- Puppeteer
- Selenium

### Files & Documents
- Local filesystem
- PDF processing (PyPDF2, pdfplumber)
- Document conversion (Pandoc)
- Excel/CSV processing

### Custom APIs
- REST APIs
- GraphQL
- gRPC
- WebSockets

## Output

Retorne um MCP server completo com:

```
mcp-server-name/
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── server.py
│   ├── tools/
│   │   ├── __init__.py
│   │   └── [tool files]
│   ├── models/
│   │   ├── __init__.py
│   │   ├── requests.py
│   │   └── responses.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── api_client.py
│   ├── security/
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── rate_limiter.py
│   │   └── audit.py
│   └── utils/
│       ├── __init__.py
│       └── logger.py
├── tests/
│   ├── __init__.py
│   ├── test_tools.py
│   └── test_security.py
├── config/
│   ├── settings.yaml
│   └── .env.example
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Segurança Máxima

Todos os MCPs criados devem incluir:

- **Input Validation**: Pydantic models rigorosos
- **SQL Injection Prevention**: Parameterized queries
- **Path Traversal Protection**: Path resolution + validation
- **Rate Limiting**: Token bucket ou sliding window
- **Audit Logging**: JSON logs com timestamp
- **Secure Error Handling**: Sem stack traces em produção
- **Environment Variables**: Secrets em env, não no código
- **TLS/SSL**: Para comunicação de rede
- **CORS**: Configuração restritiva

## Configuração de Desenvolvimento

### Python

```bash
# Create environment
uv venv .venv
source .venv/bin/activate

# Install dependencies
uv pip install mcp fastmcp pydantic pyyaml

# Run locally
python -m server_name
```

### TypeScript

```bash
# Install
npm install @modelcontextprotocol/sdk

# Run
npx ts-node src/index.ts
```

### Docker

```bash
# Build
docker build -t mcp-server-name .

# Run
docker run -e API_KEY=xxx mcp-server-name
```

## Configuração do Cliente

### Claude Desktop

```json
{
  "mcpServers": {
    "server-name": {
      "command": "python",
      "args": ["-m", "server_name"],
      "env": {
        "API_KEY": "your-key-here"
      }
    }
  }
}
```

### Cursor/Windsurf

```json
{
  "mcpServers": {
    "server-name": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Remote Server

```json
{
  "mcpServers": {
    "server-name": {
      "url": "https://mcp.example.com/mcp"
    }
  }
}
```

## Checklist Final

Antes de entregar o MCP, verifique:

- [ ] Estrutura segue padrão (mcp-structure)
- [ ] Todas as tools criadas (tool-creator)
- [ ] Validação de segurança passou (mcp-security-validator)
- [ ] Sem anti-patterns (anti-padroes-proibidos)
- [ ] Tipagem completa (tipagem-rigorosa)
- [ ] Input validation em todas as tools
- [ ] Rate limiting implementado
- [ ] Audit logging configurado
- [ ] Error handling graceful
- [ ] Documentação completa
- [ ] Tests incluídos
- [ ] Dockerfile funcionando