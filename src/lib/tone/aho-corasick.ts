class ACNode {
  children = new Map<string, ACNode>();
  fail: ACNode = null!;
  output: string[] = [];
}

export class AhoCorasick {
  private root = new ACNode();

  constructor(patterns: string[]) {
    const unique = [...new Set(patterns.filter(p => p.length > 0))];
    if (unique.length === 0) return;
    this.buildTrie(unique);
    this.buildFailLinks();
  }

  private buildTrie(patterns: string[]): void {
    for (const pattern of patterns) {
      let node = this.root;
      for (const ch of pattern) {
        if (!node.children.has(ch)) {
          node.children.set(ch, new ACNode());
        }
        node = node.children.get(ch)!;
      }
      node.output.push(pattern);
    }
  }

  private buildFailLinks(): void {
    this.root.fail = this.root;
    const queue: ACNode[] = [];
    for (const child of this.root.children.values()) {
      child.fail = this.root;
      queue.push(child);
    }
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const [ch, child] of cur.children) {
        let f = cur.fail;
        while (f !== this.root && !f.children.has(ch)) f = f.fail;
        child.fail = f.children.get(ch) ?? this.root;
        if (child.fail !== this.root) {
          child.output.push(...child.fail.output);
        }
        queue.push(child);
      }
    }
  }

  search(text: string): string[] {
    if (!text) return [];
    const results: string[] = [];
    const seen = new Set<string>();
    let node = this.root;
    for (const ch of text) {
      while (node !== this.root && !node.children.has(ch)) node = node.fail;
      const next = node.children.get(ch);
      node = next ?? this.root;
      for (const pattern of node.output) {
        if (!seen.has(pattern)) {
          seen.add(pattern);
          results.push(pattern);
        }
      }
    }
    return results;
  }
}
