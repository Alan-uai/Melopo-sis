---
name: mcp-structure
description: Define estrutura padrão, templates e arquitetura para projetos MCP. Use quando usuário mencionar "estrutura MCP", "MCP template", "MCP project structure", "arquitetura MCP", "organizar arquivos MCP", ou quando precisar criar a estrutura de diretórios, configuração, ou padrões de código para um servidor MCP.
---

# MCP Structure

Define a estrutura padrão, templates e arquitetura para projetos MCP servers. Garante consistência, manutenibilidade e escalabilidade.

## Quando Usar

Use esta skill SEMPRE que:
- Criar novo projeto MCP server
- Precisar de templates MCP
- Estruturar arquivos de um servidor MCP
- Definir configuração de projeto
- Planejar arquitetura de um MCP

## Estrutura de Diretórios

### Estrutura Completa MCP

```
mcp-server-name/
├── src/
│   ├── __init__.py
│   ├── main.py              # Entry point
│   ├── server.py            # MCP Server definition
│   ├── tools/               # Tools implementações
│   │   ├── __init__.py
│   │   ├── tool_1.py
│   │   └── tool_2.py
│   ├── models/              # Pydantic models
│   │   ├── __init__.py
│   │   ├── requests.py
│   │   └── responses.py
│   ├── services/            # Lógica de negócio
│   │   ├── __init__.py
│   │   └── api_client.py
│   ├── security/            # Security utilities
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   └── rate_limiter.py
│   └── utils/               # Helpers
│       ├── __init__.py
│       └── logger.py
├── tests/
│   ├── __init__.py
│   ├── test_tools.py
│   ├── test_security.py
│   └── fixtures/
├── config/
│   ├── settings.yaml
│   └── .env.example
├── docs/
│   ├── README.md
│   ├── API.md
│   └── SECURITY.md
├── scripts/
│   ├── setup.sh
│   └── run.sh
├── pyproject.toml           # ou setup.py
├── uv.lock                  # ou requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .gitignore
├── LICENSE
└── README.md
```

### Estrutura TypeScript/Node.js

```
mcp-server-name/
├── src/
│   ├── index.ts             # Entry point
│   ├── server.ts            # MCP Server
│   ├── tools/               # Tools
│   │   ├── index.ts
│   │   └── tool-1.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   └── utils/               # Helpers
│       └── logger.ts
├── tests/
│   └── tools.test.ts
├── config/
│   └── config.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## Templates

### Template Python (FastMCP)

```python
"""
{name} MCP Server
Version: {version}
Description: {description}
Author: {author}
"""

import os
import logging
from pathlib import Path
from typing import Optional

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

# Configuration
SERVER_NAME = "{name}"
SERVER_VERSION = "0.1.0"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create MCP server
mcp = FastMCP(SERVER_NAME)


# ============== INPUT MODELS ==============
class ToolInput(BaseModel):
    """Input model for {tool_name}"""
    param1: str
    param2: Optional[int] = None


# ============== TOOLS ==============
@mcp.tool()
def tool_name(input_data: ToolInput) -> str:
    """
    Tool description.
    
    Args:
        input_data: Validated input parameters
        
    Returns:
        Result as JSON string
    """
    logger.info(f"Tool invoked: tool_name")
    try:
        # Implementation
        result = {"status": "success", "data": {}}
        return json.dumps(result)
    except Exception as e:
        logger.error(f"Tool error: {e}")
        raise


# ============== RESOURCES ==============
@mcp.resource("config://server-info")
def get_server_info():
    """Return server metadata"""
    return {
        "name": SERVER_NAME,
        "version": SERVER_VERSION,
        "capabilities": ["tools", "resources"]
    }


# ============== PROMPTS ==============
@mcp.prompt()
def analysis_prompt(context: str) -> str:
    """Prompt template for analysis"""
    return f"Analyze the following context:\n\n{context}"


# ============== MAIN ==============
if __name__ == "__main__":
    import asyncio
    from mcp.server.stdio import stdio_server
    
    async def main():
        async with stdio_server() as (read, write):
            await mcp.run(read, write, None)
    
    asyncio.run(main())
```

### Template TypeScript

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

const SERVER_NAME = '{name}';
const SERVER_VERSION = '0.1.0';

class MCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: SERVER_NAME, version: SERVER_VERSION },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'tool_name',
            description: 'Tool description',
            inputSchema: {
              type: 'object',
              properties: {
                param1: { type: 'string', description: 'Parameter 1' }
              },
              required: ['param1']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Implement tool logic
        const result = await this.executeTool(name, args);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error}` }],
          isError: true
        };
      }
    });
  }

  private async executeTool(name: string, args: any): Promise<any> {
    // Tool implementation
    return { status: 'success' };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Server running on stdio');
  }
}

const server = new MCPServer();
server.run().catch(console.error);
```

### Template Configuration (config.yaml)

```yaml
server:
  name: "mcp-server-name"
  version: "0.1.0"
  description: "Server description"

security:
  rate_limit:
    calls_per_minute: 60
    burst: 10
  auth:
    required: true
    method: "api_key"
  input_validation:
    max_string_length: 1000
    max_results: 100

logging:
  level: "INFO"
  format: "json"
  audit_enabled: true

connection:
  timeout: 30
  retry_attempts: 3
  retry_delay: 1
```

## Padrões de Código

### 1. Nomenclatura

- **Files**: kebab-case (my-server.py, tool-name.ts)
- **Classes**: PascalCase (MyServer, ToolHandler)
- **Functions**: snake_case (get_data, process_request)
- **Constants**: UPPER_SNAKE_CASE (MAX_RETRY, DEFAULT_TIMEOUT)

### 2. Imports

```python
# Standard library
import os
import json
from typing import Optional, List

# Third-party
from pydantic import BaseModel, Field
from mcp.server.fastmcp import FastMCP

# Local
from .models import RequestModel
from .services import APIClient
from .security import RateLimiter
```

### 3. Type Hints (OBRIGATÓRIO)

```python
# CORRETO
def process(data: dict) -> Optional[str]:
    pass

def get_items() -> List[Item]:
    pass

# ERRADO - sem type hints
def process(data):
    pass
```

### 4. Docstrings

```python
def function_name(param1: str, param2: int) -> dict:
    """
    Short description.
    
    Longer description if needed.
    
    Args:
        param1: Description of param1
        param2: Description of param2
        
    Returns:
        Description of return value
        
    Raises:
        ValueError: When validation fails
        ConnectionError: When API is unreachable
    """
    pass
```

## Arquitetura de Componentes

### Camada de Tools

```
tools/
├── __init__.py          # Export all tools
├── database.py          # Database operations
│   ├── query_tool()
│   ├── insert_tool()
│   └── delete_tool()
├── api.py               # External APIs
│   ├── fetch_tool()
│   └── post_tool()
└── file.py              # File operations
    ├── read_tool()
    └── write_tool()
```

### Camada de Services

```
services/
├── __init__.py
├── api_client.py        # Reusable API client
│   ├── BaseAPIClient
│   ├── get()
│   ├── post()
│   └── with_retry()
├── database.py          # Database utilities
│   ├── ConnectionPool
│   ├── QueryBuilder
│   └── TransactionManager
└── cache.py             # Caching layer
    ├── RedisClient
    └── CacheStrategy
```

### Camada de Security

```
security/
├── __init__.py
├── validators.py        # Input validation
│   ├── validate_string()
│   ├── validate_email()
│   └── validate_path()
├── auth.py             # Authentication
│   ├── APIKeyAuth
│   ├── JWTAuth
│   └── OAuthHandler
├── rate_limiter.py     # Rate limiting
│   ├── TokenBucket
│   ├── SlidingWindow
│   └── RateLimitExceeded
└── audit.py            # Audit logging
    ├── AuditLogger
    └── AuditEntry
```

## Testes

### Structure de Testes

```
tests/
├── __init__.py
├── conftest.py         # Pytest fixtures
├── test_tools/
│   ├── __init__.py
│   ├── test_database.py
│   └── test_api.py
├── test_security/
│   ├── __init__.py
│   ├── test_validators.py
│   └── test_rate_limiter.py
└── fixtures/
    ├── mock_api_response.json
    └── test_data.yaml
```

### Test Template

```python
import pytest
from unittest.mock import Mock, patch
from src.tools import my_tool

@pytest.fixture
def mock_api():
    with patch('src.services.api_client.get') as mock:
        mock.return_value = {"data": "test"}
        yield mock

def test_tool_success(mock_api):
    """Test successful tool execution"""
    result = my_tool({"param": "value"})
    assert result["status"] == "success"

def test_tool_validation_error():
    """Test input validation"""
    with pytest.raises(ValueError):
        my_tool({"param": ""})  # Empty param should fail
```

## Documentação

### README.md Structure

```markdown
# MCP Server Name

Brief description of what this server does.

## Features

- Feature 1
- Feature 2

## Installation

```bash
pip install mcp-server-name
```

## Configuration

Create `config.yaml`:

```yaml
server:
  name: "example"
  auth:
    api_key: "your-api-key"
```

## Usage

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "python",
      "args": ["-m", "server_name"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| tool_name | What it does |

## Security

See [SECURITY.md](SECURITY.md) for security details.

## License

MIT
```

## Deployment

### Dockerfile Template

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# Copy source
COPY src/ ./src/
COPY config/ ./config/

# Run as non-root
RUN useradd -m appuser
USER appuser

CMD ["python", "-m", "server_name"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  mcp-server:
    build: .
    environment:
      - API_KEY=${API_KEY}
      - LOG_LEVEL=INFO
    volumes:
      - ./config:/app/config
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import sys; sys.exit(0)"]
      interval: 30s
```

## Checklist de Estrutura

Para cada projeto MCP, verifique:

- [ ] Estrutura de diretórios segue o padrão
- [ ] Arquivo principal em src/main.py ou src/index.ts
- [ ] Input models em models/requests.py
- [ ] Tools em tools/
- [ ] Configuração em config/settings.yaml
- [ ] Testes em tests/
- [ ] README.md completo
- [ ] SECURITY.md para aspectos de segurança
- [ ] Dockerfile presente
- [ ] .gitignore configurado
- [ ] Type hints em todas funções
- [ ] Docstrings em classes e funções públicas
- [ ] Logging configurado
- [ ] Environment variables para secrets