#!/usr/bin/env python3
"""
Code Analyzer - Extrai metadados de código-fonte
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict, field
from datetime import datetime


@dataclass
class Component:
    name: str
    path: str
    type: str  # ui, hook, flow, util, page, module
    framework: str
    complexity: str  # high, medium, low
    props: List[str] = field(default_factory=list)
    state_management: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    exports: List[str] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    patterns: List[str] = field(default_factory=list)
    language: str = "typescript"
    
    def __post_init__(self):
        if self.props is None:
            self.props = []
        if self.state_management is None:
            self.state_management = []
        if self.dependencies is None:
            self.dependencies = []
        if self.exports is None:
            self.exports = []
        if self.imports is None:
            self.imports = []
        if self.patterns is None:
            self.patterns = []


class CodeAnalyzer:
    def __init__(self, root_path: str):
        self.root = Path(root_path)
        self.components: List[Component] = []
        self.hooks: List[Component] = []
        self.pages: List[Component] = []
        self.modules: List[Component] = []
        self.utils: List[Component] = []
        self.flows: List[Component] = []
        
    def scan(self) -> Dict[str, Any]:
        """Executa análise completa do codebase"""
        print(f"🔍 Escaneando {self.root}...")
        
        # 1. Identificar stack tecnológico
        tech_stack = self._detect_tech_stack()
        
        # 2. Mapear estrutura
        structure = self._map_structure()
        
        # 3. Extrair componentes
        self._extract_components()
        
        # 4. Detectar padrões
        patterns = self._detect_patterns()
        
        # 5. Identificar fluxos
        flows = self._identify_flows()
        
        # 6. Gerar relatório
        return {
            "timestamp": datetime.now().isoformat(),
            "tech_stack": tech_stack,
            "structure": structure,
            "components": [asdict(c) for c in self.components],
            "hooks": [asdict(h) for h in self.hooks],
            "pages": [asdict(p) for p in self.pages],
            "modules": [asdict(m) for m in self.modules],
            "utils": [asdict(u) for u in self.utils],
            "flows": [asdict(f) for f in self.flows],
            "patterns": patterns,
            "stats": self._generate_stats()
        }
    
    def _detect_tech_stack(self) -> Dict[str, Any]:
        """Detecta stack tecnológico"""
        stack = {"frontend": [], "backend": [], "database": [], "tools": [], "language": "unknown"}
        
        # Verifica package.json
        pkg_path = self.root / "package.json"
        if pkg_path.exists():
            with open(pkg_path) as f:
                pkg = json.load(f)
                deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                
                # Frontend frameworks
                if "next" in deps:
                    stack["frontend"].append("Next.js")
                    stack["language"] = "TypeScript"
                if "react" in deps:
                    stack["frontend"].append("React")
                    stack["language"] = "TypeScript"
                if "vue" in deps:
                    stack["frontend"].append("Vue")
                if "@nuxt" in deps:
                    stack["frontend"].append("Nuxt")
                
                # UI libraries
                if "@mui" in deps or "@material-ui" in deps:
                    stack["frontend"].append("Material UI")
                if "tailwindcss" in deps:
                    stack["frontend"].append("Tailwind CSS")
                if "styled-components" in deps:
                    stack["frontend"].append("styled-components")
                
                # State management
                if "@reduxjs/toolkit" in deps or "redux" in deps:
                    stack["frontend"].append("Redux")
                if "@tanstack/react-query" in deps or "react-query" in deps:
                    stack["frontend"].append("React Query")
                if "zustand" in deps:
                    stack["frontend"].append("Zustand")
                if "jotai" in deps:
                    stack["frontend"].append("Jotai")
                
                # 3D/Graphics
                if "three" in deps or "@react-three" in deps:
                    stack["frontend"].append("Three.js")
                if "framer-motion" in deps:
                    stack["frontend"].append("Framer Motion")
                
                # Backend/Database
                if "supabase" in deps:
                    stack["backend"].append("Supabase")
                    stack["database"].append("PostgreSQL")
                if "firebase" in deps:
                    stack["backend"].append("Firebase")
                if "prisma" in deps:
                    stack["database"].append("Prisma")
                
                # Auth
                if "next-auth" in deps or "@auth0" in deps:
                    stack["backend"].append("Auth")
        
        # Verifica Python
        if (self.root / "requirements.txt").exists() or (self.root / "pyproject.toml").exists():
            stack["language"] = "Python"
            
        # Verifica Go
        if (self.root / "go.mod").exists():
            stack["language"] = "Go"
            
        # Verifica Rust
        if (self.root / "Cargo.toml").exists():
            stack["language"] = "Rust"
            
        return stack
    
    def _map_structure(self) -> Dict[str, Any]:
        """Mapeia estrutura de diretórios"""
        structure = {}
        
        for item in self.root.rglob("*"):
            if item.is_dir() and not any(x in str(item) for x in [".git", "node_modules", ".next", "__pycache__", "dist", "build"]):
                parts = item.relative_to(self.root).parts
                if len(parts) <= 3:
                    structure[str(item.relative_to(self.root))] = {
                        "type": self._classify_dir(parts),
                        "files": len([f for f in item.rglob("*") if f.is_file()])
                    }
        
        return structure
    
    def _classify_dir(self, parts: tuple) -> str:
        """Classifica diretório baseado no nome"""
        name = parts[-1].lower()
        
        if any(x in name for x in ["component", "ui", "widget"]):
            return "components"
        if any(x in name for x in ["hook", "use"]):
            return "hooks"
        if any(x in name for x in ["page", "route", "view"]):
            return "pages"
        if any(x in name for x in ["module", "feature", "domain"]):
            return "modules"
        if any(x in name for x in ["lib", "util", "helper", "tool"]):
            return "utils"
        if any(x in name for x in ["api", "service", "endpoint"]):
            return "api"
        if any(x in name for x in ["store", "context", "state"]):
            return "state"
        return "other"
    
    def _extract_components(self):
        """Extrai componentes do código"""
        extensions = [".tsx", ".jsx", ".ts", ".js", ".py"]
        
        for ext in extensions:
            for file in self.root.rglob(f"*{ext}"):
                if any(x in str(file) for x in [".git", "node_modules", ".next", "__pycache__"]):
                    continue
                    
                try:
                    with open(file, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # Classifica o arquivo
                    comp_type = self._classify_file(file, content)
                    if comp_type:
                        component = self._parse_component(file, content, comp_type)
                        self._add_component(component)
                        
                except Exception as e:
                    print(f"⚠️ Erro ao processar {file}: {e}")
    
    def _classify_file(self, path: Path, content: str) -> Optional[str]:
        """Classifica arquivo baseado em conteúdo"""
        rel_path = str(path.relative_to(self.root)).lower()
        
        # Componentes React/UI
        if path.suffix in [".tsx", ".jsx"] and ("component" in rel_path or "/" in rel_path):
            if "use" in path.stem:
                return "hook"
            elif any(x in rel_path for x in ["page", "route"]):
                return "page"
            elif any(x in rel_path for x in ["module", "feature"]):
                return "module"
            elif any(x in rel_path for x in ["lib", "util", "helper"]):
                return "util"
            else:
                return "component"
        
        # Hooks
        if "hook" in rel_path or path.stem.startswith("use"):
            return "hook"
        
        return None
    
    def _parse_component(self, path: Path, content: str, comp_type: str) -> Component:
        """Parseia componente e extrai metadados"""
        rel_path = str(path.relative_to(self.root))
        
        # Extrai imports
        imports = re.findall(r'import\s+(?:{[^}]+}|[^;]+)\s+from\s+[\'"]([^\'"]+)[\'"]', content)
        
        # Extrai exports
        exports = re.findall(r'export\s+(?:default\s+)?(?:function|const|class|type|interface)\s+(\w+)', content)
        
        # Extrai interfaces/types
        interfaces = re.findall(r'(?:interface|type)\s+(\w+Props?)', content)
        
        # Detecta padrões
        patterns = []
        if "useState" in content:
            patterns.append("useState")
        if "useEffect" in content:
            patterns.append("useEffect")
        if "useContext" in content:
            patterns.append("Context API")
        if "useReducer" in content:
            patterns.append("useReducer")
        if "memo(" in content or "React.memo" in content:
            patterns.append("memoization")
        if "useCallback" in content:
            patterns.append("useCallback")
        if "useMemo" in content:
            patterns.append("useMemo")
        if "createContext" in content:
            patterns.append("Provider Pattern")
        if "children" in content:
            patterns.append("Children Pattern")
        if "ref=" in content:
            patterns.append("Refs")
        if "async" in content and "await" in content:
            patterns.append("Async/Await")
        
        # Detecta complexidade
        complexity = "low"
        lines = content.count("\n")
        if lines > 200:
            complexity = "high"
        elif lines > 100:
            complexity = "medium"
        
        # Determina framework
        framework = "React"
        if "next" in imports:
            framework = "Next.js"
        
        return Component(
            name=path.stem,
            path=rel_path,
            type=comp_type,
            framework=framework,
            complexity=complexity,
            props=interfaces,
            exports=exports,
            imports=imports,
            patterns=patterns,
            language="typescript" if path.suffix in [".tsx", ".ts"] else "javascript"
        )
    
    def _add_component(self, component: Component):
        """Adiciona componente à lista correta"""
        if component.type == "hook":
            self.hooks.append(component)
        elif component.type == "page":
            self.pages.append(component)
        elif component.type == "module":
            self.modules.append(component)
        elif component.type == "util":
            self.utils.append(component)
        else:
            self.components.append(component)
    
    def _detect_patterns(self) -> Dict[str, List[str]]:
        """Detecta padrões arquiteturais no código"""
        patterns = {
            "component_patterns": [],
            "state_patterns": [],
            "data_patterns": [],
            "ux_patterns": []
        }
        
        # Procura padrões em todos os arquivos
        for ext in [".tsx", ".jsx", ".ts"]:
            for file in self.root.rglob(f"*{ext}"):
                if any(x in str(file) for x in [".git", "node_modules", ".next"]):
                    continue
                    
                try:
                    with open(file, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # Component patterns
                    if "function" in content and "return" in content and "<" in content:
                        if "({" in content or "(props" in content:
                            patterns["component_patterns"].append(f"{file.stem}: Functional Component")
                    
                    # State patterns
                    if "createContext" in content:
                        patterns["state_patterns"].append("Context API")
                    if "useReducer" in content:
                        patterns["state_patterns"].append("useReducer Pattern")
                    if "zustand" in content or "create(" in content:
                        patterns["state_patterns"].append("Zustand Store")
                    if "@tanstack" in content:
                        patterns["state_patterns"].append("React Query/TanStack")
                    
                    # UX patterns
                    if "Modal" in file.stem or "modal" in content:
                        patterns["ux_patterns"].append("Modal System")
                    if "Skeleton" in content or "skeleton" in content:
                        patterns["ux_patterns"].append("Skeleton Loading")
                    if "Toast" in content or "notification" in content.lower():
                        patterns["ux_patterns"].append("Toast/Notification")
                    
                except Exception:
                    pass
        
        # Deduplica
        for key in patterns:
            patterns[key] = list(set(patterns[key]))
        
        return patterns
    
    def _identify_flows(self) -> List[Dict[str, Any]]:
        """Identifica fluxos de dados e processos"""
        flows = []
        
        # Procura por arquivos de fluxo
        flow_keywords = ["auth", "login", "signup", "crud", "create", "update", "delete",
                        "export", "import", "upload", "download", "share", "payment"]
        
        for ext in [".tsx", ".ts"]:
            for file in self.root.rglob(f"*{ext}"):
                if any(x in str(file) for x in [".git", "node_modules", ".next"]):
                    continue
                    
                rel_path = str(file.relative_to(self.root)).lower()
                
                for keyword in flow_keywords:
                    if keyword in rel_path:
                        flows.append({
                            "name": file.stem,
                            "path": str(file.relative_to(self.root)),
                            "type": keyword,
                            "priority": "high" if keyword in ["auth", "login"] else "medium"
                        })
                        break
        
        return flows[:20]  # Limita a 20 fluxos mais relevantes
    
    def _generate_stats(self) -> Dict[str, int]:
        """Gera estatísticas do codebase"""
        return {
            "total_components": len(self.components),
            "total_hooks": len(self.hooks),
            "total_pages": len(self.pages),
            "total_modules": len(self.modules),
            "total_utils": len(self.utils),
            "total_flows": len(self.flows),
            "total_files": len(list(self.root.rglob("*.tsx"))) + len(list(self.root.rglob("*.ts"))) + len(list(self.root.rglob("*.jsx"))) + len(list(self.root.rglob("*.js")))
        }


def main():
    import sys
    
    if len(sys.argv) < 2:
        root = os.getcwd()
    else:
        root = sys.argv[1]
    
    analyzer = CodeAnalyzer(root)
    result = analyzer.scan()
    
    # Output
    print("\n📊 RESULTADO DA ANÁLISE")
    print("=" * 50)
    print(f"Tech Stack: {', '.join(result['tech_stack'].get('frontend', []))}")
    print(f"Linguagem: {result['tech_stack']['language']}")
    print(f"\n📦 Componentes: {result['stats']['total_components']}")
    print(f"🪝 Hooks: {result['stats']['total_hooks']}")
    print(f"📄 Páginas: {result['stats']['total_pages']}")
    print(f"🧩 Módulos: {result['stats']['total_modules']}")
    print(f"🔧 Utilitários: {result['stats']['total_utils']}")
    print(f"🔀 Fluxos: {result['stats']['total_flows']}")
    
    # Salva JSON
    output_path = Path(root) / ".opencode" / "skills" / "code-archaeologist" / "analysis_output.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"\n💾 Análise salva em: {output_path}")


if __name__ == "__main__":
    main()
