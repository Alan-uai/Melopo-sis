#!/usr/bin/env python3
"""
Skill Generator - Gera novas skills automaticamente
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional


class SkillGenerator:
    """Gera novas skills baseadas em análise de código"""
    
    TEMPLATES = {
        "ui_component": """---
name: {skill_name}
description: |
  Skill especializada para {component_name} - {description}.
  Use quando: usuário menciona {keywords}, quer {actions}, precisa de {component_name}.
---

# {component_name} Component Skill

## Visão Geral
{overview}

## Estrutura
```
{structure}
```

## Props/Interface
\`\`\`typescript
{props_interface}
\`\`\`

## Estados
| Estado | Descrição | Visual |
|--------|-----------|--------|
{states}

## Uso Comum
\`\`\`tsx
{usage_example}
\`\`\`

## Padrões
- [ ] Composable com outros componentes
- [ ] Acessível (ARIA labels)
- [ ] Responsivo
- [ ] Tema-aware

## Customização
{customization}

## Boas Práticas
1. {best_practice_1}
2. {best_practice_2}
3. {best_practice_3}
""",

        "hook": """---
name: {skill_name}
description: |
  Hook personalizado {hook_name} - {description}.
  Use quando: usuário menciona {keywords}, precisa de {hook_name}.
---

# {hook_name} Hook Skill

## Assinatura
\`\`\`typescript
{hook_signature}
\`\`\`

## Parâmetros
{parameters}

## Retorno
{return_value}

## Uso
\`\`\`tsx
{usage_example}
\`\`\`

## Side Effects
{side_effects}

## Edge Cases
{edge_cases}
""",

        "flow": """---
name: {skill_name}
description: |
  Automação do fluxo {flow_name} - {description}.
  Use quando: usuário menciona {keywords}, quer automatizar {flow_name}.
---

# {flow_name} Flow Skill

## Diagrama
```
{diagram}
```

## Etapas
{steps}

## Input
\`\`\`typescript
{input_type}
\`\`\`

## Output
\`\`\`typescript
{output_type}
\`\`\`

## Error Handling
{error_handling}

## Configuração
{configuration}
""",

        "util": """---
name: {skill_name}
description: |
  Utilitário {util_name} - {description}.
  Use quando: usuário menciona {keywords}.
---

# {util_name} Utility Skill

## Função Principal
\`\`\`typescript
{function_signature}
\`\`\`

## Parâmetros
{parameters}

## Retorno
{return_value}

## Exemplos
\`\`\`typescript
{examples}
\`\`\`

## Edge Cases
{edge_cases}
"""
    }
    
    def __init__(self, root_path: str):
        self.root = Path(root_path)
        self.skills_dir = self.root / ".opencode" / "skills"
        
    def generate_skill(
        self,
        skill_type: str,
        name: str,
        source_path: str,
        metadata: Dict[str, Any]
    ) -> str:
        """Gera uma nova skill"""
        
        template = self.TEMPLATES.get(skill_type, self.TEMPLATES["util"])
        skill_name = self._to_skill_name(name)
        
        # Prepara contexto
        context = {
            "skill_name": skill_name,
            "component_name": name,
            "hook_name": name,
            "flow_name": name,
            "util_name": name,
            "description": metadata.get("description", "..."),
            "keywords": metadata.get("keywords", [name.lower()]),
            "actions": metadata.get("actions", ["usar", "implementar"]),
            "overview": metadata.get("overview", "..."),
            "structure": metadata.get("structure", "..."),
            "props_interface": metadata.get("props_interface", "// interface Props {}"),
            "states": metadata.get("states", "| Default | Estado inicial | - |"),
            "usage_example": metadata.get("usage_example", "// Exemplo de uso"),
            "customization": metadata.get("customization", "..."),
            "best_practice_1": metadata.get("best_practice_1", "Use TypeScript"),
            "best_practice_2": metadata.get("best_practice_2", "Documente props"),
            "best_practice_3": metadata.get("best_practice_3", "Teste estados"),
            "hook_signature": metadata.get("hook_signature", "// signature"),
            "parameters": metadata.get("parameters", "| Param | Tipo | Descrição |"),
            "return_value": metadata.get("return_value", "// return value"),
            "side_effects": metadata.get("side_effects", "- Sem side effects"),
            "edge_cases": metadata.get("edge_cases", "- Nenhum edge case identificado"),
            "diagram": metadata.get("diagram", "[Input] → [Process] → [Output]"),
            "steps": metadata.get("steps", "1. Step 1\n2. Step 2"),
            "input_type": metadata.get("input_type", "// InputType"),
            "output_type": metadata.get("output_type", "// OutputType"),
            "error_handling": metadata.get("error_handling", "- Error handling info"),
            "configuration": metadata.get("configuration", "..."),
            "function_signature": metadata.get("function_signature", "// signature"),
            "examples": metadata.get("examples", "// examples")
        }
        
        # Gera conteúdo
        content = template.format(**context)
        
        # Cria diretório da skill
        skill_dir = self.skills_dir / skill_name
        skill_dir.mkdir(parents=True, exist_ok=True)
        
        # Salva SKILL.md
        skill_path = skill_dir / "SKILL.md"
        with open(skill_path, "w") as f:
            f.write(content)
        
        # Cria estrutura de diretórios
        (skill_dir / "scripts").mkdir(exist_ok=True)
        (skill_dir / "references").mkdir(exist_ok=True)
        
        # Cria README para referência
        self._create_metadata(skill_dir, skill_type, source_path, metadata)
        
        return str(skill_path)
    
    def _to_skill_name(self, name: str) -> str:
        """Converte nome para formato de skill"""
        # Remove caracteres especiais, espaços → kebab-case
        name = re.sub(r'[^\w\s-]', '', name)
        name = re.sub(r'[-\s]+', '-', name.lower())
        return name
    
    def _create_metadata(
        self,
        skill_dir: Path,
        skill_type: str,
        source_path: str,
        metadata: Dict[str, Any]
    ):
        """Cria arquivo de metadados da skill"""
        meta = {
            "generated_at": datetime.now().isoformat(),
            "generated_by": "code-archaeologist",
            "skill_type": skill_type,
            "source_file": source_path,
            "original_name": metadata.get("original_name", ""),
            "patterns_detected": metadata.get("patterns", []),
            "complexity": metadata.get("complexity", "medium"),
            "dependencies": metadata.get("dependencies", [])
        }
        
        with open(skill_dir / "metadata.json", "w") as f:
            json.dump(meta, f, indent=2)
    
    def generate_from_analysis(self, analysis_path: str) -> List[Dict[str, str]]:
        """Gera múltiplas skills a partir de análise prévia"""
        with open(analysis_path) as f:
            analysis = json.load(f)
        
        generated = []
        
        # Gera skills para componentes
        for comp in analysis.get("components", []):
            skill_path = self.generate_skill(
                skill_type="ui_component",
                name=comp["name"],
                source_path=comp["path"],
                metadata={
                    "original_name": comp["name"],
                    "description": f"Componente React para {comp['name']}",
                    "keywords": [comp["name"].lower(), comp["type"]],
                    "actions": ["implementar", "customizar", "usar"],
                    "complexity": comp["complexity"],
                    "patterns": comp.get("patterns", []),
                    "props_interface": self._generate_props(comp),
                    "structure": f"src/components/.../{comp['name']}"
                }
            )
            generated.append({"type": "component", "name": comp["name"], "path": skill_path})
        
        # Gera skills para hooks
        for hook in analysis.get("hooks", []):
            skill_path = self.generate_skill(
                skill_type="hook",
                name=hook["name"],
                source_path=hook["path"],
                metadata={
                    "original_name": hook["name"],
                    "description": f"Hook customizado {hook['name']}",
                    "keywords": [hook["name"].lower(), "hook"],
                    "complexity": hook["complexity"],
                    "patterns": hook.get("patterns", []),
                    "hook_signature": f"function {hook['name']}()"
                }
            )
            generated.append({"type": "hook", "name": hook["name"], "path": skill_path})
        
        # Gera skills para fluxos
        for flow in analysis.get("flows", []):
            skill_path = self.generate_skill(
                skill_type="flow",
                name=flow["name"],
                source_path=flow["path"],
                metadata={
                    "original_name": flow["name"],
                    "description": f"Fluxo {flow['type']} - {flow['name']}",
                    "keywords": [flow["type"], flow["name"].lower()],
                    "priority": flow.get("priority", "medium"),
                    "diagram": self._generate_flow_diagram(flow)
                }
            )
            generated.append({"type": "flow", "name": flow["name"], "path": skill_path})
        
        return generated
    
    def _generate_props(self, component: Dict) -> str:
        """Gera interface de props"""
        if component.get("props"):
            props = component["props"]
            if isinstance(props, list):
                return f"interface {component['name']}Props {{\\n  // props\\n}}"
        return f"interface {component['name']}Props {{\\n  className?: string;\\n}}"
    
    def _generate_flow_diagram(self, flow: Dict) -> str:
        """Gera diagrama ASCII para fluxo"""
        steps = [
            "User Action",
            "Validate Input",
            "Process Data",
            "API Call",
            "Update State",
            "UI Response"
        ]
        
        diagram = "```\\n"
        for i, step in enumerate(steps[:-1]):
            diagram += f"[{step}] --> "
        diagram += f"[{steps[-1]}]\\n```"
        return diagram


def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Uso: python skill_generator.py <analysis_output.json>")
        sys.exit(1)
    
    analysis_path = sys.argv[1]
    root = Path(analysis_path).parent.parent.parent.parent
    generator = SkillGenerator(str(root))
    
    print("🎯 Gerando skills...")
    generated = generator.generate_from_analysis(analysis_path)
    
    print(f"\n✅ {len(generated)} skills geradas:")
    for skill in generated:
        print(f"  • [{skill['type']}] {skill['name']} → {skill['path']}")


if __name__ == "__main__":
    main()
