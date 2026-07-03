#!/usr/bin/env python3
"""
PageIndex — Vectorless RAG for StormCaller.

Builds a hierarchical semantic tree from markdown files, then supports
tree-based retrieval: the LLM navigates the tree by reasoning through
branches instead of vector similarity search.

Inspired by VectifyAI/PageIndex — similarity is not relevance, reasoning is.

Usage:
  # Index
  python3 .pageindex/index_stormcaller.py                          # Index all
  python3 .pageindex/index_stormcaller.py --folder Nagarro/BAU     # Index one folder

  # Retrieve (vectorless RAG — the LLM navigates these)
  python3 .pageindex/index_stormcaller.py --tree                   # Top-level tree
  python3 .pageindex/index_stormcaller.py --tree --depth 2         # Two levels deep
  python3 .pageindex/index_stormcaller.py --navigate 0003          # Drill into node
  python3 .pageindex/index_stormcaller.py --read 0003              # Full text of node
  python3 .pageindex/index_stormcaller.py --query "Messiness Index" # Keyword search
"""

import sys
import os
import json
import argparse
import re
from datetime import datetime

# --- Markdown Parsing (no LLM, pure header extraction) ---

def extract_nodes_from_markdown(markdown_content):
    header_pattern = r'^(#{1,6})\s+(.+)$'
    code_block_pattern = r'^```'
    node_list = []
    lines = markdown_content.split('\n')
    in_code_block = False
    for line_num, line in enumerate(lines, 1):
        stripped_line = line.strip()
        if re.match(code_block_pattern, stripped_line):
            in_code_block = not in_code_block
            continue
        if not stripped_line:
            continue
        if not in_code_block:
            match = re.match(header_pattern, stripped_line)
            if match:
                title = match.group(2).strip()
                node_list.append({'node_title': title, 'line_num': line_num})
    return node_list, lines


def extract_node_text_content(node_list, markdown_lines):
    all_nodes = []
    for node in node_list:
        line_content = markdown_lines[node['line_num'] - 1]
        header_match = re.match(r'^(#{1,6})', line_content)
        if header_match is None:
            continue
        processed_node = {
            'title': node['node_title'],
            'line_num': node['line_num'],
            'level': len(header_match.group(1))
        }
        all_nodes.append(processed_node)
    for i, node in enumerate(all_nodes):
        start_line = node['line_num'] - 1
        if i + 1 < len(all_nodes):
            end_line = all_nodes[i + 1]['line_num'] - 1
        else:
            end_line = len(markdown_lines)
        node['text'] = '\n'.join(markdown_lines[start_line:end_line]).strip()
    return all_nodes


def build_tree_from_nodes(node_list):
    if not node_list:
        return []
    stack = []
    root_nodes = []
    node_counter = 1
    for node in node_list:
        current_level = node['level']
        tree_node = {
            'title': node['title'],
            'node_id': str(node_counter).zfill(4),
            'text': node['text'],
            'line_num': node['line_num'],
            'level': current_level,
            'nodes': []
        }
        node_counter += 1
        while stack and stack[-1][1] >= current_level:
            stack.pop()
        if not stack:
            root_nodes.append(tree_node)
        else:
            parent_node, parent_level = stack[-1]
            parent_node['nodes'].append(tree_node)
        stack.append((tree_node, current_level))
    return root_nodes


# --- Configuration ---

STORMCALLER_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(STORMCALLER_ROOT, '.pageindex', 'stormcaller-index.json')

EXCLUDE_DIRS = {
    '.obsidian', 'node_modules', '.claude', '.vault-index',
    '.markdown_vault_mcp', '.pageindex', '.git', 'assets',
    'published', '.deploy'
}


def should_index(filepath):
    parts = filepath.split(os.sep)
    for part in parts:
        if part in EXCLUDE_DIRS:
            return False
    return filepath.endswith('.md')


def discover_files(root, folder=None):
    search_root = os.path.join(root, folder) if folder else root
    files = []
    for dirpath, dirnames, filenames in os.walk(search_root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for f in filenames:
            fullpath = os.path.join(dirpath, f)
            relpath = os.path.relpath(fullpath, root)
            if should_index(relpath):
                files.append(relpath)
    return sorted(files)


# --- Indexing ---

def build_rich_tree(nodes):
    """Build tree with previews for navigation. Full text read from source on demand."""
    cleaned = []
    for node in nodes:
        text = node.get('text', '')
        cleaned_node = {
            'title': node['title'],
            'node_id': node.get('node_id', ''),
            'line_num': node.get('line_num', 0),
            'level': node.get('level', 0),
            'preview': text[:500] if text else '',
            'char_count': len(text),
            'nodes': build_rich_tree(node.get('nodes', []))
        }
        cleaned.append(cleaned_node)
    return cleaned


def index_file(root, relpath):
    fullpath = os.path.join(root, relpath)
    try:
        with open(fullpath, 'r', encoding='utf-8') as f:
            content = f.read()

        node_list, markdown_lines = extract_nodes_from_markdown(content)
        if not node_list:
            return {
                'doc_name': relpath,
                'line_count': len(markdown_lines),
                'char_count': len(content),
                'structure': [{
                    'title': os.path.basename(relpath).replace('.md', ''),
                    'node_id': '0001',
                    'line_num': 1,
                    'level': 1,
                    'preview': content[:500],
                    'char_count': len(content),
                    'full_text': content,
                    'nodes': []
                }]
            }

        nodes_with_content = extract_node_text_content(node_list, markdown_lines)
        tree = build_tree_from_nodes(nodes_with_content)

        return {
            'doc_name': relpath,
            'line_count': len(markdown_lines),
            'char_count': len(content),
            'structure': build_rich_tree(tree)
        }
    except Exception as e:
        return {
            'doc_name': relpath,
            'error': str(e),
            'structure': []
        }


def build_index(root, folder=None):
    files = discover_files(root, folder)
    print(f"Indexing {len(files)} files...")

    index = {
        'indexed_at': datetime.now().isoformat(),
        'root': root,
        'file_count': len(files),
        'documents': []
    }

    # Global node counter for unique IDs across all documents
    global_counter = [1]

    for relpath in files:
        doc = index_file(root, relpath)
        # Reassign node IDs to be globally unique
        reassign_node_ids(doc.get('structure', []), global_counter)
        index['documents'].append(doc)
        print(f"  + {relpath} ({len(doc.get('structure', []))} sections)")

    os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

    total_sections = global_counter[0] - 1
    print(f"\nIndex saved: {INDEX_PATH}")
    print(f"Total: {len(files)} files, {total_sections} nodes")
    return index


def reassign_node_ids(nodes, counter):
    """Assign globally unique node IDs."""
    for node in nodes:
        node['node_id'] = str(counter[0]).zfill(5)
        counter[0] += 1
        reassign_node_ids(node.get('nodes', []), counter)


def count_nodes(nodes):
    c = len(nodes)
    for n in nodes:
        c += count_nodes(n.get('nodes', []))
    return c


# --- Retrieval Commands ---

def load_index():
    if not os.path.exists(INDEX_PATH):
        print("No index found. Run without flags first to build the index.", file=sys.stderr)
        sys.exit(1)
    with open(INDEX_PATH, 'r') as f:
        return json.load(f)


def cmd_tree(depth=1, domain=None):
    """Show the tree at specified depth, optionally filtered by domain."""
    index = load_index()
    docs = index['documents']
    if domain:
        domain_lower = domain.lower().rstrip('/')
        docs = [d for d in docs if d['doc_name'].lower().startswith(domain_lower + '/') or
                (domain_lower == '.' and '/' not in d['doc_name'])]
        print(f"PageIndex Tree (depth={depth}, domain={domain}) | {len(docs)} files | indexed {index['indexed_at'][:10]}")
    else:
        print(f"PageIndex Tree (depth={depth}) | {index['file_count']} files | indexed {index['indexed_at'][:10]}")
        print("Domains: " + ", ".join(sorted(set(
            d['doc_name'].split('/')[0] for d in docs if '/' in d['doc_name']
        ))))
    print("=" * 80)
    for doc in docs:
        print(f"\n[{doc['doc_name']}] ({doc.get('char_count', '?')} chars)")
        print_tree_nodes(doc.get('structure', []), depth=depth, current_depth=1, indent=2)


def print_tree_nodes(nodes, depth, current_depth, indent):
    for node in nodes:
        prefix = " " * indent
        child_count = count_nodes(node.get('nodes', []))
        child_info = f" [{child_count} children]" if child_count > 0 else ""
        chars = node.get('char_count', 0)
        print(f"{prefix}{node['node_id']} | {node['title']} ({chars} chars){child_info}")
        if current_depth < depth and node.get('nodes'):
            print_tree_nodes(node['nodes'], depth, current_depth + 1, indent + 4)


def cmd_navigate(node_id):
    """Show a node's children with previews. The drill-down step."""
    index = load_index()
    node, doc_name = find_node(index, node_id)
    if not node:
        print(f"Node {node_id} not found.", file=sys.stderr)
        sys.exit(1)

    print(f"Node {node_id} in [{doc_name}]")
    print(f"Title: {node['title']}")
    print(f"Content: {node.get('char_count', 0)} chars")
    print(f"Preview: {node.get('preview', '')[:300]}")
    print()

    children = node.get('nodes', [])
    if children:
        print(f"Children ({len(children)}):")
        print("-" * 60)
        for child in children:
            sub_count = count_nodes(child.get('nodes', []))
            sub_info = f" [{sub_count} children]" if sub_count > 0 else ""
            print(f"  {child['node_id']} | {child['title']} ({child.get('char_count', 0)} chars){sub_info}")
            # Show first 200 chars of preview for decision-making
            preview = child.get('preview', '')
            # Strip the header line from preview
            lines = preview.split('\n')
            body = '\n'.join(lines[1:]).strip()[:200]
            if body:
                print(f"         {body[:200]}")
            print()
    else:
        print("(leaf node — no children. Use --read to get full text.)")


def cmd_read(node_id):
    """Full text of a specific node. Reads from source markdown file on demand."""
    index = load_index()
    node, doc_name = find_node(index, node_id)
    if not node:
        print(f"Node {node_id} not found.", file=sys.stderr)
        sys.exit(1)

    # Find the next sibling/parent node's line number to determine text range
    all_nodes_flat = []
    for doc in index['documents']:
        if doc['doc_name'] == doc_name:
            flatten_nodes(doc.get('structure', []), all_nodes_flat)
            break

    # Find our node and the next node's line number
    start_line = node['line_num']
    end_line = None
    found = False
    for n in all_nodes_flat:
        if found:
            end_line = n['line_num']
            break
        if n['node_id'] == node_id:
            found = True

    # Read from source file
    fullpath = os.path.join(index['root'], doc_name)
    try:
        with open(fullpath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        if end_line:
            text = ''.join(lines[start_line - 1:end_line - 1]).strip()
        else:
            text = ''.join(lines[start_line - 1:]).strip()

        print(f"--- [{doc_name}] node {node_id}: {node['title']} ---")
        print()
        print(text)
    except FileNotFoundError:
        print(f"Source file not found: {fullpath}", file=sys.stderr)
        print(f"Preview (from index): {node.get('preview', '(none)')}")


def flatten_nodes(nodes, result):
    """Flatten tree into ordered list for line-range calculation."""
    for node in nodes:
        result.append(node)
        flatten_nodes(node.get('nodes', []), result)


def cmd_search(query, domain=None):
    """Keyword search ranked by BM25 + title/path boost.

    Ranking:
      - BM25 with k1=1.5, b=0.75 (Lucene defaults)
      - TITLE_WEIGHT=5 applied to hits appearing in the section path (node title
        plus ancestor headers). Structural hits count 5x body hits — a query term
        in a header means the node is ABOUT the term, not just mentioning it.
      - Multi-word queries are tokenized; BM25 is computed per term and summed.
      - IDF penalizes common terms, rewards rare terms.
    """
    import math

    index = load_index()
    domain_lower = domain.lower().rstrip('/') if domain else None

    # Tokenize query — word chars only, min length 2, lowercased
    query_terms = [t for t in re.findall(r'\w+', query.lower()) if len(t) >= 2]
    if not query_terms:
        query_terms = [query.lower().strip()]

    # Collect all nodes in scope
    docs = index.get('documents', [])
    if domain_lower:
        docs = [d for d in docs if d['doc_name'].lower().startswith(domain_lower + '/')]

    all_nodes = []

    def collect(nodes, doc_name, path=""):
        for node in nodes:
            title = node.get('title', '')
            preview = node.get('preview', '')
            current_path = f"{path} > {title}" if path else title
            all_nodes.append({
                'file': doc_name,
                'path': current_path,
                'title': title,
                'preview': preview,
                'node_id': node.get('node_id', ''),
                'line': node.get('line_num', 0),
                'chars': node.get('char_count', 0),
                'length': max(node.get('char_count', 0), len(title) + len(preview)),
            })
            collect(node.get('nodes', []), doc_name, current_path)

    for doc in docs:
        collect(doc.get('structure', []), doc['doc_name'])

    N = len(all_nodes)
    if N == 0:
        scope = f" in {domain}" if domain else ""
        print(f"No nodes indexed{scope}.")
        return

    avgdl = sum(n['length'] for n in all_nodes) / N

    # Document frequency per term (presence, not count)
    df = {t: 0 for t in query_terms}
    for n in all_nodes:
        text = (n['path'] + ' ' + n['preview']).lower()
        for t in query_terms:
            if t in text:
                df[t] += 1

    k1, b, TITLE_WEIGHT = 1.5, 0.75, 5.0

    results = []
    for n in all_nodes:
        path_l = n['path'].lower()
        preview_l = n['preview'].lower()
        score = 0.0
        total_body_hits = 0
        total_struct_hits = 0
        matched = False

        for t in query_terms:
            body_hits = preview_l.count(t)
            struct_hits = path_l.count(t)
            effective_hits = body_hits + TITLE_WEIGHT * struct_hits
            if effective_hits == 0:
                continue
            matched = True
            total_body_hits += body_hits
            total_struct_hits += struct_hits
            # IDF — +1 inside log prevents negative scores on very common terms
            nt = df[t]
            idf = math.log(1 + (N - nt + 0.5) / (nt + 0.5))
            # BM25 term score
            dl = max(n['length'], 1)
            denom = effective_hits + k1 * ((1 - b) + b * dl / avgdl)
            score += idf * (effective_hits * (k1 + 1)) / denom

        if matched:
            results.append({
                **n,
                'score': score,
                'hits': total_body_hits + total_struct_hits,
                'title_hits': total_struct_hits,
            })

    results.sort(key=lambda r: -r['score'])

    scope = f" in {domain}" if domain else ""
    if not results:
        print(f"No matches for '{query}'{scope}")
        return

    print(f"Found {len(results)} nodes matching '{query}'{scope} "
          f"(ranked by BM25 + title boost):\n")
    for r in results[:15]:
        title_tag = f" [title:{r['title_hits']}]" if r['title_hits'] else ""
        print(f"  [{r['node_id']}] {r['file']}:{r['line']} "
              f"(score {r['score']:.2f}, {r['hits']} hits{title_tag}, {r['chars']} chars)")
        print(f"    {r['path']}")
        # Show context around first matching term
        preview_l = r['preview'].lower()
        for t in query_terms:
            pos = preview_l.find(t)
            if pos >= 0:
                start = max(0, pos - 50)
                end = min(len(r['preview']), pos + len(t) + 50)
                snippet = r['preview'][start:end].replace('\n', ' ')
                print(f"    ...{snippet}...")
                break
        print()


def find_node(index, node_id):
    """Find a node by ID across all documents."""
    for doc in index.get('documents', []):
        result = find_in_tree(doc.get('structure', []), node_id)
        if result:
            return result, doc['doc_name']
    return None, None


def find_in_tree(nodes, node_id):
    for node in nodes:
        if node.get('node_id') == node_id:
            return node
        result = find_in_tree(node.get('nodes', []), node_id)
        if result:
            return result
    return None


# --- Main ---

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='PageIndex — Vectorless RAG for StormCaller')
    parser.add_argument('--folder', help='Index only this subfolder')
    parser.add_argument('--tree', action='store_true', help='Show document tree for navigation')
    parser.add_argument('--depth', type=int, default=1, help='Tree depth (default: 1)')
    parser.add_argument('--domain', help='Filter tree to a domain (e.g., Cognition, Nagarro, Content)')
    parser.add_argument('--navigate', metavar='NODE_ID', help='Drill into a node — show children with previews')
    parser.add_argument('--read', metavar='NODE_ID', help='Read full text of a node')
    parser.add_argument('--query', help='Keyword search across the index')
    args = parser.parse_args()

    if args.tree:
        cmd_tree(depth=args.depth, domain=args.domain)
    elif args.navigate:
        cmd_navigate(args.navigate)
    elif args.read:
        cmd_read(args.read)
    elif args.query:
        cmd_search(args.query, domain=args.domain)
    else:
        build_index(STORMCALLER_ROOT, args.folder)
