---
name: mcp-security-validator
description: Validação rigorosa de segurança para código MCP. Use quando o usuário mencionar "validar segurança MCP", "security check MCP", "auditar código MCP", "verificar vulnerabilidades", "sanitizar input MCP", ou quando precisar validar segurança de servidores, tools ou qualquer código relacionado a MCP. Implementa verificação deOWASP Top 10, sanitização, e compliance.
---

# MCP Security Validator

Validador de segurança máximo para código MCP. Implementa validação rigorosa seguindo OWASP Top 10 e padrões de segurança de produção.

## Quando Usar

Use esta skill SEMPRE que:
- Criar ou modificar código MCP server
- Precisar validar ferramentas (tools) antes de deploy
- Auditoria de segurança de código MCP
- Verificar vulnerabilidades em implementations
- Validar configurações de segurança
- Teste de penetração em MCP servers

## Framework de Validação

### Níveis de Segurança

| Nível | Descrição | Use Case |
|-------|-----------|----------|
| **Critical** | OWASP Top 10 completo, pentest | Produção, dados sensíveis |
| **High** | Input validation, sanitização, rate limiting | APIs públicas |
| **Medium** | Basic sanitização, error handling | Desenvolvimento |
| **Low** | Code review básico | Protótipos |

### Checklist de Segurança por Área

#### 1. Input Validation (OBRIGATÓRIO)

```python
# SEMPRE use esta estrutura
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import re

class SecureInput(BaseModel):
    # Tipagem rigorosa - NUNCA use Any sem necessidade
    query: Optional[str] = Field(None, max_length=500, min_length=1)
    limit: int = Field(default=100, ge=1, le=1000)
    
    # Enum para valores conhecidos
    action: str = Field(..., pattern=r'^(read|list|search)$')
    
    @validator('query')
    def sanitize_query(cls, v):
        if v:
            # Remover caracteres perigosos
            dangerous = ['<script', 'javascript:', 'onerror=', 'onclick=']
            v_lower = v.lower()
            for pattern in dangerous:
                if pattern in v_lower:
                    raise ValueError(f"Dangerous pattern detected: {pattern}")
        return v
```

#### 2. SQL Injection Protection

```python
# Parameterized queries ONLY
def safe_query(db, query, params):
    # CORRETO - parameterized
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    
    # ERRADO - string concatenation
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")  # NEVER!

# Whitelist de operações
ALLOWED_OPS = {'SELECT', 'SHOW', 'DESCRIBE'}
def validate_query(sql: str):
    op = sql.strip().split()[0].upper()
    if op not in ALLOWED_OPS:
        raise ValueError(f"Operation {op} not allowed")
```

#### 3. Path Traversal Prevention

```python
import os
from pathlib import Path

def safe_file_read(user_path: str, base_dir: str) -> str:
    # Resolve path e verifica se está dentro do base_dir
    base = Path(base_dir).resolve()
    target = (base / user_path).resolve()
    
    # Verify it's within base_dir
    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError("Path traversal attempt detected")
    
    return target.read_text()
```

#### 4. Rate Limiting Implementation

```python
import time
from collections import defaultdict
from threading import Lock

class RateLimiter:
    def __init__(self, calls: int, window: int):
        self.calls = calls
        self.window = window
        self.requests = defaultdict(list)
        self.lock = Lock()
    
    def is_allowed(self, client_id: str) -> bool:
        with self.lock:
            now = time.time()
            # Remove old requests
            self.requests[client_id] = [
                t for t in self.requests[client_id]
                if now - t < self.window
            ]
            
            if len(self.requests[client_id]) >= self.calls:
                return False
            
            self.requests[client_id].append(now)
            return True
```

#### 5. Authentication & Authorization

```python
# Environment-based secrets
import os

class SecureConfig:
    @staticmethod
    def get_api_key() -> str:
        key = os.environ.get('MCP_API_KEY')
        if not key:
            raise ValueError("API key not configured")
        return key
    
    @staticmethod
    def validate_token(token: str) -> bool:
        # Verify JWT or token here
        # Never store secrets in code
        pass
```

#### 6. Audit Logging

```python
import logging
import json
from datetime import datetime

class AuditLogger:
    @staticmethod
    def log_request(tool: str, params: dict, user: str = "anonymous"):
        # Nunca log敏感 data (passwords, keys)
        safe_params = {k: v for k, v in params.items() 
                       if k not in ['password', 'api_key', 'token', 'secret']}
        
        logging.info(json.dumps({
            "timestamp": datetime.utcnow().isoformat(),
            "tool": tool,
            "user": user,
            "params": safe_params,  # Sanitized
            "action": "tool_invocation"
        }))
    
    @staticmethod
    def log_error(tool: str, error: Exception, user: str = "anonymous"):
        logging.error(json.dumps({
            "timestamp": datetime.utcnow().isoformat(),
            "tool": tool,
            "user": user,
            "error_type": type(error).__name__,
            "error_message": str(error),  # Be careful - may need sanitization
            "action": "tool_error"
        }))
```

#### 7. Secure Error Handling

```python
# NUNCA exponha stack traces em produção
def safe_execute(operation):
    try:
        return operation()
    except ValueError as e:
        # Retorna mensagem amigável, não internals
        raise Exception(f"Invalid input: {e}") from None
    except PermissionError:
        raise Exception("Access denied") from None
    except Exception as e:
        # Log internals for debugging
        logging.error(f"Unexpected error: {e}", exc_info=True)
        # Retorna mensagem genérica
        raise Exception("Internal server error") from None
```

## Vulnerabilidades OWASP para MCP

### A1: Injection
- SQL Injection
- NoSQL Injection
- Command Injection
- LDAP Injection

**Verificação:**
```python
def check_injection_vulnerabilities(code: str) -> List[str]:
    issues = []
    
    # Check for f-strings in SQL
    if re.search(rf'execute.*f["\'].*\{.*\}', code):
        issues.append("Potential SQL injection via f-string")
    
    # Check for os.system
    if 'os.system(' in code:
        issues.append("Command injection via os.system")
    
    # Check for eval/exec
    if 'eval(' in code or 'exec(' in code:
        issues.append("Dangerous eval/exec usage")
    
    return issues
```

### A2: Broken Authentication
- Weak password policies
- Session management
- Token exposure

**Verificação:**
```python
def check_auth_security(code: str) -> List[str]:
    issues = []
    
    # Check for hardcoded credentials
    if re.search(r'password\s*=\s*["\']', code):
        issues.append("Hardcoded password detected")
    
    # Check for weak token generation
    if 'random.random()' in code and 'token' in code.lower():
        issues.append("Weak random for token generation")
    
    return issues
```

### A3: Sensitive Data Exposure
- Logging sensitive data
- Insecure storage
- Cleartext transmission

**Verificação:**
```python
def check_data_exposure(code: str) -> List[str]:
    issues = []
    
    sensitive_patterns = ['api_key', 'password', 'secret', 'token', 'credential']
    for pattern in sensitive_patterns:
        if re.search(f'log.*[{pattern}]', code, re.IGNORECASE):
            issues.append(f"Potential logging of {pattern}")
    
    return issues
```

### A4: XML External Entities (XXE)
- Unsafe XML parsing

### A5: Broken Access Control
- IDOR
- Missing authorization checks

### A6: Security Misconfiguration
- Debug mode enabled
- Verbose error messages
- Default credentials

### A7: Cross-Site Scripting (XSS)
- Unsanitized output
- DOM manipulation

### A8: Insecure Deserialization
- Pickle vulnerabilities
- Unsafe deserialization

### A9: Using Components with Known Vulnerabilities
- Outdated dependencies

### A10: Insufficient Logging & Monitoring
- Missing audit trails

## Validação de Configuração

### Configuração Segura para MCP

```yaml
# mcp-config.yaml
security:
  # Rate limiting
  rate_limit:
    calls_per_minute: 60
    burst: 10
    
  # Authentication
  auth:
    required: true
    method: "jwt"  # jwt, api_key, oauth
    token_expiry: 3600
    
  # Input validation
  input_validation:
    max_query_length: 1000
    max_results: 100
    allowed_content_types:
      - "application/json"
      - "text/plain"
      
  # Audit
  audit:
    enabled: true
    log_level: "INFO"
    log_sensitive_data: false
    
  # Network
  network:
    allowed_ips: []  # Empty = allow all
    require_tls: true
    
  # CORS
  cors:
    allowed_origins: ["https://trusted-domain.com"]
    allow_credentials: true
```

## Scanner Automático

Para verificar código MCP automaticamente:

```python
def security_scan(code: str) -> dict:
    results = {
        "critical": [],
        "high": [],
        "medium": [],
        "low": [],
        "info": []
    }
    
    # Check each vulnerability class
    results["critical"].extend(check_injection_vulnerabilities(code))
    results["high"].extend(check_auth_security(code))
    results["medium"].extend(check_data_exposure(code))
    results["low"].extend(check_dependencies(code))
    results["info"].extend(check_coding_best_practices(code))
    
    return results
```

## Checklist Final de Segurança

Para cada componente MCP, verifique:

- [ ] Input validation com Pydantic
- [ ] Parameterized queries (não string concatenation)
- [ ] Rate limiting implementado
- [ ] Audit logging sem dados sensíveis
- [ ] Error handling não expõe internals
- [ ] Secrets em environment variables
- [ ] TLS/SSL para comunicação
- [ ] CORS configurado corretamente
- [ ] No hardcoded credentials
- [ ] Dependencies atualizadas
- [ ] Path traversal prevention
- [ ] Content-type validation

## Saída do Validator

Retorne no formato:

```json
{
  "scan_results": {
    "critical": [...],
    "high": [...],
    "medium": [...],
    "low": [...],
    "passed": [...]
  },
  "summary": {
    "total_issues": 5,
    "severity": "high",
    "recommendation": "Fix critical issues before deployment"
  },
  "remediation": [
    {
      "issue": "SQL injection risk",
      "severity": "critical",
      "fix": "Use parameterized queries",
      "line": 42
    }
  ]
}
```

## Padrões Proibidos

NUNCA permita em código MCP:
- `eval()` ou `exec()`
- String concatenation em SQL
- `os.system()` ou subprocess com input do usuário
- Logging de passwords/keys
- Hardcoded credentials
- Disabled SSL verification
- CORS wildcard em produção
- Debug mode enabled