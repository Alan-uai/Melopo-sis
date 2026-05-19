#!/usr/bin/env python3
"""
Pattern Finder - Detecta padrões de código automaticamente
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict


@dataclass
class Pattern:
    name: str
    category: str  # component, state, data, ux, arch
    occurrences: List[str]
    description: str
    confidence: float  # 0.0 - 1.0
    suggestion: str  # O que criar baseado neste padrão


class PatternFinder:
    """Detecta padrões em código-fonte"""
    
    # Catálogo de padrões para procurar
    PATTERNS = {
        # Component Patterns
        "Functional Component": {
            "regex": r"(?:export\s+)?(?:default\s+)?function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>",
            "category": "component",
            "description": "Componente funcional React"
        },
        "Class Component": {
            "regex": r"class\s+\w+\s+extends\s+(?:React\.)?Component",
            "category": "component",
            "description": "Componente de classe React"
        },
        "Higher-Order Component": {
            "regex": r"(?:export\s+)?(?:default\s+)?function\s+\w+\s*\([^)]*Component[^)]*\)|with[A-Z]\w+",
            "category": "component",
            "description": "HOC - Wrapper que adiciona funcionalidade"
        },
        "Compound Component": {
            "regex": r"(?:\{[^{}]*\.\s*\}\s*as\s*\w+|Object\.assign|createContext)",
            "category": "component",
            "description": "Componentes compostos com sub-componentes"
        },
        
        # State Patterns
        "useState Pattern": {
            "regex": r"useState",
            "category": "state",
            "description": "Estado local com useState"
        },
        "useReducer Pattern": {
            "regex": r"useReducer",
            "category": "state",
            "description": "Estado com reducer para lógica complexa"
        },
        "Context API": {
            "regex": r"createContext",
            "category": "state",
            "description": "Estado global via Context API"
        },
        "Redux Pattern": {
            "regex": r"(?:useDispatch|useSelector|createSlice|createAsyncThunk)",
            "category": "state",
            "description": "Gerenciamento de estado Redux"
        },
        "React Query": {
            "regex": r"(?:useQuery|useMutation|useInfiniteQuery|QueryClientProvider)",
            "category": "state",
            "description": "Server state management com React Query"
        },
        "Zustand Store": {
            "regex": r"(?:zustand|create\s*\(\s*\(\s*set)",
            "category": "state",
            "description": "Store simples com Zustand"
        },
        
        # Data Patterns
        "API Call": {
            "regex": r"(?:fetch\(|axios\.|request\.|http\.)",
            "category": "data",
            "description": "Chamadas de API"
        },
        "Async/Await": {
            "regex": r"async\s+(?:function|const|\(\s*\))|await\s+",
            "category": "data",
            "description": "Operações assíncronas"
        },
        "Data Transformation": {
            "regex": r"(?:map\(|filter\(|reduce\(|Object\.(?:entries|values|keys))",
            "category": "data",
            "description": "Transformação de dados"
        },
        "Local Storage": {
            "regex": r"(?:localStorage|sessionStorage|window\.storage)",
            "category": "data",
            "description": "Persistência local no browser"
        },
        
        # UX Patterns
        "Modal": {
            "regex": r"(?:isOpen|isModal|showModal|Dialog|Modal)",
            "category": "ux",
            "description": "Sistema de modais"
        },
        "Form Handling": {
            "regex": r"(?:onSubmit|onChange|onBlur|form\.reset|form\.validate)",
            "category": "ux",
            "description": "Manipulação de formulários"
        },
        "Loading State": {
            "regex": r"(?:isLoading|loading|isFetching|isPending|Spinner)",
            "category": "ux",
            "description": "Estados de loading"
        },
        "Error Handling UI": {
            "regex": r"(?:isError|error\s*\?|catch\s*\(|Error\s+Boundary)",
            "category": "ux",
            "description": "Tratamento de erros na UI"
        },
        "Empty State": {
            "regex": r"(?:isEmpty|No\s+\w+|empty\s+state|placeholder)",
            "category": "ux",
            "description": "Estados vazios/não encontrado"
        },
        "Skeleton Screen": {
            "regex": r"(?:Skeleton|shimmer|placeholder\s*style)",
            "category": "ux",
            "description": "Placeholders de loading"
        },
        "Toast/Notification": {
            "regex": r"(?:toast|notify|notification|alert\s*\(|showNotification)",
            "category": "ux",
            "description": "Sistema de notificações"
        },
        "Pagination": {
            "regex": r"(?:page|cursor|offset|limit|totalPages|hasMore)",
            "category": "ux",
            "description": "Paginação de listas"
        },
        
        # Architecture Patterns
        "Custom Hook": {
            "regex": r"export\s+function\s+use\w+|export\s+const\s+use\w+",
            "category": "arch",
            "description": "Custom hook para lógica reutilizável"
        },
        "Service Layer": {
            "regex": r"(?:Service|Api|Client)\s*(?:class|const)",
            "category": "arch",
            "description": "Camada de serviços/abstração de API"
        },
        "Middleware": {
            "regex": r"(?:middleware|next\s*\(|handler\s*\(|request\s*=>)",
            "category": "arch",
            "description": "Middleware pattern"
        },
        "Event Emitter": {
            "regex": r"(?:emit|on\s*\(|off\s*\(|addEventListener|EventEmitter)",
            "category": "arch",
            "description": "Sistema de eventos"
        },
        "Observer Pattern": {
            "regex": r"(?:subscribe|unsubscribe|observer|listener)",
            "category": "arch",
            "description": "Padrão Observer/Pub-Sub"
        }
    }
    
    def __init__(self, root_path: str):
        self.root = Path(root_path)
        self.found_patterns: List[Pattern] = []
        
    def scan(self) -> Dict[str, Any]:
        """Escaneia código e detecta padrões"""
        print("🔍 Procurando padrões...")
        
        extensions = [".tsx", ".jsx", ".ts", ".js", ".py"]
        
        for ext in extensions:
            for file in self.root.rglob(f"*{ext}"):
                if self._should_ignore(file):
                    continue
                    
                try:
                    with open(file, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    self._analyze_file(file, content)
                    
                except Exception as e:
                    print(f"⚠️ Erro ao analisar {file}: {e}")
        
        return self._generate_report()
    
    def _should_ignore(self, path: Path) -> bool:
        """Verifica se deve ignorar o arquivo"""
        ignore_patterns = [
            ".git", "node_modules", ".next", "__pycache__",
            "dist", "build", ".cache", ".turbo"
        ]
        return any(x in str(path) for x in ignore_patterns)
    
    def _analyze_file(self, path: Path, content: str):
        """Analisa um arquivo em busca de padrões"""
        rel_path = str(path.relative_to(self.root))
        
        for pattern_name, pattern_info in self.PATTERNS.items():
            matches = re.findall(pattern_info["regex"], content, re.IGNORECASE)
            
            if matches:
                # Procura padrão existente
                existing = next(
                    (p for p in self.found_patterns if p.name == pattern_name),
                    None
                )
                
                if existing:
                    existing.occurrences.append(rel_path)
                else:
                    self.found_patterns.append(Pattern(
                        name=pattern_name,
                        category=pattern_info["category"],
                        occurrences=[rel_path],
                        description=pattern_info["description"],
                        confidence=self._calculate_confidence(matches, content),
                        suggestion=self._generate_suggestion(pattern_name, pattern_info["category"])
                    ))
    
    def _calculate_confidence(self, matches: List, content: str) -> float:
        """Calcula confiança do pattern (0.0 - 1.0)"""
        base = min(len(matches) / 5, 1.0)  # Mais ocorrências = mais confiança
        return round(0.5 + (base * 0.5), 2)
    
    def _generate_suggestion(self, pattern_name: str, category: str) -> str:
        """Gera sugestão de skill baseada no padrão"""
        suggestions = {
            "Functional Component": "Criar skill 'component-generator' para scaffold de componentes React",
            "Class Component": "Considerar migração para functional components + hooks",
            "Higher-Order Component": "Criar skill 'hoc-builder' para construir HOCs padronizados",
            "Compound Component": "Criar skill 'compound-component' para criar componentes compostos",
            "useState Pattern": "Criar guia de boas práticas para estado local",
            "useReducer Pattern": "Criar skill 'reducer-builder' para lógica de estado complexa",
            "Context API": "Criar skill 'context-generator' para gerar Contexts reutilizáveis",
            "Redux Pattern": "Criar skill 'redux-scaffold' para configurar Redux rapidamente",
            "React Query": "Criar skill 'query-builder' para queries e mutations padronizadas",
            "Zustand Store": "Criar skill 'zustand-store-generator' para stores simples",
            "API Call": "Criar skill 'api-client-generator' para clientes de API",
            "Async/Await": "Criar guia de padrões para operações assíncronas",
            "Data Transformation": "Criar skill 'data-transformer' para pipelines de transformação",
            "Local Storage": "Criar skill 'storage-manager' para abstração de localStorage",
            "Modal": "Criar skill 'modal-system' para sistema de modais consistente",
            "Form Handling": "Criar skill 'form-builder' para formulários com validação",
            "Loading State": "Criar skill 'loading-skeleton' para estados de loading",
            "Error Handling UI": "Criar skill 'error-boundary' para tratamento de erros",
            "Empty State": "Criar skill 'empty-state' para componentes de estado vazio",
            "Skeleton Screen": "Criar skill 'skeleton-generator' para placeholders de loading",
            "Toast/Notification": "Criar skill 'notification-system' para toast/notificações",
            "Pagination": "Criar skill 'pagination-component' para navegação de páginas",
            "Custom Hook": "Criar skill 'hook-generator' para scaffold de custom hooks",
            "Service Layer": "Criar skill 'service-generator' para camada de serviços",
            "Middleware": "Criar skill 'middleware-builder' para funções de middleware",
            "Event Emitter": "Criar skill 'event-system' para sistema de eventos",
            "Observer Pattern": "Criar skill 'observer-pattern' para subscribe/unsubscribe"
        }
        return suggestions.get(pattern_name, "Considerar criar skill especializada")
    
    def _generate_report(self) -> Dict[str, Any]:
        """Gera relatório final"""
        # Agrupa por categoria
        by_category = {}
        for pattern in self.found_patterns:
            if pattern.category not in by_category:
                by_category[pattern.category] = []
            by_category[pattern.category].append(asdict(pattern))
        
        # Ordena por confiança
        for category in by_category:
            by_category[category].sort(key=lambda x: x["confidence"], reverse=True)
        
        # Skills recomendadas
        recommended_skills = [
            p.suggestion for p in self.found_patterns 
            if p.suggestion.startswith("Criar skill") and p.confidence > 0.5
        ]
        
        return {
            "patterns_found": len(self.found_patterns),
            "total_occurrences": sum(len(p.occurrences) for p in self.found_patterns),
            "by_category": by_category,
            "high_confidence_patterns": [
                asdict(p) for p in self.found_patterns if p.confidence > 0.7
            ],
            "recommended_skills": list(set(recommended_skills)),
            "patterns": [asdict(p) for p in self.found_patterns]
        }


def main():
    import sys
    
    if len(sys.argv) < 2:
        root = os.getcwd()
    else:
        root = sys.argv[1]
    
    finder = PatternFinder(root)
    result = finder.scan()
    
    print("\n📊 PADRÕES DETECTADOS")
    print("=" * 50)
    
    for category, patterns in result["by_category"].items():
        print(f"\n{category.upper()}:")
        for p in patterns[:5]:  # Top 5 de cada categoria
            print(f"  • {p['name']} ({p['confidence']:.0%}) - {p['description']}")
            print(f"    Encontrado em: {len(p['occurrences'])} arquivo(s)")
    
    print("\n\n🎯 SKILLS RECOMENDADAS:")
    for skill in result["recommended_skills"][:5]:
        print(f"  • {skill}")
    
    # Salva resultado
    output_path = Path(root) / ".opencode" / "skills" / "code-archaeologist" / "patterns_output.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"\n💾 Padrões salvos em: {output_path}")


if __name__ == "__main__":
    main()
