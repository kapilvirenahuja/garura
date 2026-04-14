# Graph-Based RAG (Knowledge Graph Retrieval)

Using knowledge graphs to retrieve structured relationships and entity context for LLM reasoning.

**Search patterns:** GraphRAG, knowledge graph, Neo4j, relationships, entity extraction, ontology, graph database, triples, entity linking, structured retrieval

## When to Choose

Graph RAG excels when the relationships between entities are as important as the entities themselves. "Which medications interact with Drug X?" is a graph problem — vector search finds documents about Drug X but doesn't traverse interaction relationships. Choose for: healthcare (drug interactions, patient history, care pathways), legal (case law references, regulatory dependencies), enterprise knowledge management (org structure, project dependencies), fraud detection (transaction networks), and supply chain (supplier relationships). PP-7 >= 4 (Regulated) industries often have inherently graph-structured domains. Any BRD mentioning "relationships," "dependencies," "networks," "hierarchies," or "connected" suggests graph applicability.

## When to Avoid

Avoid when queries are primarily content-based ("find documents about X") rather than relationship-based ("find how X connects to Y"). Building and maintaining a knowledge graph is expensive — entity extraction, relationship mapping, and schema design require domain expertise. If the corpus is unstructured text with no clear entity-relationship model, vector RAG is simpler and often sufficient. Avoid for PP-6 = 1-2 (POC/MVP) unless the domain is inherently graph-structured. Graph databases add operational complexity that small teams may not be equipped to manage.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Entity count | 10K-10M nodes | 10M-1B | > 1B (partitioning essential) |
| Relationship density | 5-50 relationships per entity | 50-500 | > 500 (query optimization critical) |
| Query depth | 1-3 hops | 3-6 hops | > 6 hops (exponential traversal cost) |
| Schema complexity | 5-20 entity types | 20-100 | > 100 (ontology management needed) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Graph database | Neo4j, Amazon Neptune, ArangoDB, TigerGraph | Neo4j for general purpose; Neptune for AWS-native; ArangoDB for multi-model |
| Entity extraction | LLM-based (GPT-4, Claude), SpaCy NER, custom models | LLM for accuracy on complex entities; SpaCy for speed on standard NER |
| Relationship extraction | LLM-based, OpenIE, rule-based | LLM for nuanced relationships; rules for well-defined domains |
| Graph query language | Cypher (Neo4j), Gremlin, SPARQL, GQL | Cypher for Neo4j; Gremlin for multi-vendor; SPARQL for RDF |
| Graph + Vector hybrid | Neo4j vector index, Weaviate + graph module | Neo4j vector for integrated; separate stores for scale |

## Reference Architecture

```
Knowledge Graph Construction:
  Documents → Entity Extraction (LLM/NER) → Entity Resolution (dedup)
                                          → Relationship Extraction (LLM)
                                          → Knowledge Graph (Neo4j)

Query Pipeline:
  User Query → Entity Recognition → Graph Traversal (Cypher)
                                  → Subgraph Extraction
                                  → Context Assembly (entities + relationships + properties)
                                  → LLM (query + graph context)
                                  → Response with attribution

Graph Schema (healthcare example):
  (Patient)-[:DIAGNOSED_WITH]->(Condition)
  (Condition)-[:TREATED_BY]->(Medication)
  (Medication)-[:INTERACTS_WITH]->(Medication)
  (Doctor)-[:PRESCRIBED]->(Medication)
  (Medication)-[:CONTRAINDICATED_FOR]->(Condition)
```

**Graph RAG design rules:**
- Schema-first: define entity types and relationship types before ingesting
- Entity resolution is critical — "John Smith" and "J. Smith" must resolve to same entity
- Limit traversal depth — unbounded graph traversals are exponentially expensive
- Combine graph context with document context for best results
- Version the graph schema — ontology changes affect all downstream queries

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Vector RAG | Graph RAG | Relationship queries emerge | Build knowledge graph alongside vector store; query both |
| Relational DB | Graph RAG | Complex JOINs becoming unmanageable | Model relationships as graph edges; migrate relationship-heavy queries |
| Graph RAG | Hybrid RAG | Need both relationship and content retrieval | Keep graph for structure, add vector for content similarity |
| Manual knowledge base | Graph RAG | Automate knowledge extraction | LLM-based entity/relationship extraction from existing docs |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Relationship reasoning | Answers "how does X relate to Y" precisely | Knowledge graph construction is expensive |
| Structured context | LLM receives entities + relationships, not just text chunks | Entity extraction errors propagate to graph |
| Multi-hop reasoning | Traverse chains of relationships (A→B→C→D) | Query complexity grows exponentially with depth |
| Explainability | Can show the graph path that led to the answer | Graph visualization and explanation UX is complex |
| Precision | Exact relationship matches (not similarity-based) | Misses relationships not explicitly in the graph |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Schema-less graph | No defined entity/relationship types, just ad-hoc nodes and edges | Ungovernable, inconsistent, impossible to query reliably |
| Entity duplication | Same real-world entity as multiple nodes (no resolution) | Incomplete traversals, wrong answers |
| Unbounded traversal | Queries that traverse entire graph without depth limits | Timeout, memory exhaustion, useless results |
| Graph without vector | Using only graph retrieval for content questions | Misses semantic content similarity |
| Over-extraction | Creating entities and relationships from every sentence | Noisy graph, low signal-to-noise ratio |
| Stale ontology | Schema doesn't evolve with domain understanding | New entity types missed, wrong classifications |
