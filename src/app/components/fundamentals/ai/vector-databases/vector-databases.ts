import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-ai-vector-databases',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './vector-databases.html',
  styleUrl: './vector-databases.scss',
})
export class AiVectorDatabases {
  quickRef: QuickRefItem[] = [
    { name: 'Vector DB',       type: 'keyword', desc: 'Database optimised for storing and querying high-dimensional embedding vectors via ANN search.' },
    { name: 'ANN',             type: 'keyword', desc: 'Approximate Nearest Neighbour — finds the k closest vectors in milliseconds, sacrificing tiny accuracy.' },
    { name: 'HNSW',            type: 'keyword', desc: 'Hierarchical Navigable Small World graph — default ANN index. Fast queries, high recall, large memory.' },
    { name: 'IVF',             type: 'keyword', desc: 'Inverted File Index — partitions space into Voronoi cells, searches only nearby cells. Lower memory than HNSW.' },
    { name: 'PQ',              type: 'keyword', desc: 'Product Quantisation — compress vectors 4–64× by encoding sub-vectors. Reduces memory at slight recall cost.' },
    { name: 'Metadata filter', type: 'keyword', desc: 'Filter by attributes (date, category, user_id) alongside vector search — pre or post filter.' },
    { name: 'Namespace',       type: 'keyword', desc: 'Logical partition within a vector DB (Pinecone). Isolates data per tenant or environment.' },
    { name: 'Upsert',          type: 'keyword', desc: 'Insert or update a vector by ID. Standard write operation in all vector databases.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Vector Databases',
      points: [
        'Traditional DBs query by exact match or range. Embeddings live in high-dimensional spaces (768–3072 dims) where similarity is an angle, not an equality.',
        'Naive approach: compute cosine similarity against every stored vector — O(N·d). With 10M vectors at 1536 dims: ~15 billion multiplications per query.',
        'ANN algorithms (HNSW, IVF) reduce this to O(log N) or O(√N) by building an index structure — trades a small recall loss for orders-of-magnitude speed.',
        'Vector DBs add persistence, CRUD, metadata filtering, horizontal scaling, and multi-tenancy on top of ANN indexes.',
        'Use cases: RAG retrieval, semantic search, recommendation systems, deduplication, anomaly detection, image/audio search.',
      ],
    },
    {
      heading: 'Index Types',
      points: [
        'HNSW (Hierarchical Navigable Small World): graph-based. Every node links to M nearest neighbours at multiple layers. Queries navigate layers from coarse to fine. Best recall, highest memory (O(N·M·d) floats).',
        'IVF (Inverted File): k-means clusters the vector space into nlist cells. Each query: find closest nprobe cells, then search only vectors in those cells. Lower memory, slightly lower recall. Good for billions of vectors.',
        'Flat (exact): brute-force exact search. Perfect recall, O(N·d) — only viable for <100K vectors or with GPU acceleration.',
        'IVF+PQ: combine IVF partitioning with product quantisation compression. The only viable approach for 100M+ vectors on CPU — trades recall for memory.',
        'FAISS (Meta): the reference C++ library. Supports Flat, IVF, HNSW, PQ, and combinations. Runs on CPU/GPU. Used internally by many vector DBs.',
      ],
    },
    {
      heading: 'Managed Vector Databases',
      points: [
        'Pinecone: fully managed, serverless or pods. Namespaces for multi-tenancy. Pre/post metadata filtering. Strong TypeScript SDK.',
        'Weaviate: open-source + cloud. Native GraphQL API. Hybrid search (BM25 + vector) built in. Multi-modal (text + images).',
        'Qdrant: open-source + cloud. Rust-based — very fast. Named vectors (multiple vectors per object). Payload filtering.',
        'Chroma: open-source, embeds in Python process. Great for prototyping. No managed cloud tier.',
        'pgvector: PostgreSQL extension. Add vector similarity to your existing Postgres DB. Supports HNSW and IVF. Best if already on Postgres.',
      ],
    },
    {
      heading: 'Metadata Filtering',
      points: [
        'Pre-filtering: filter by metadata first, then run ANN on the filtered subset. Precise but slow if the filter is too selective (ANN needs a minimum N).',
        'Post-filtering: run ANN to get top-k, then filter by metadata. Fast but may return < k results if many are filtered out.',
        'Best practice: index selective metadata fields. Use a filter that keeps ≥ 10% of vectors. If very selective, use a separate namespace/partition.',
        'Payload indexes (Qdrant), metadata indexes (Pinecone), where filters (Weaviate) — all let you filter efficiently without full scans.',
        'Multi-tenancy: use a user_id metadata field to filter per-user data, or use namespaces/collections to physically separate tenant data.',
      ],
    },
    {
      heading: 'Approximate Nearest Neighbor Search: The Speed-Accuracy Tradeoff',
      points: [
        'Exact nearest-neighbor search (comparing a query vector against every stored vector) is accurate but scales linearly with dataset size — impractically slow for the millions of vectors typical of production RAG or recommendation systems.',
        'Approximate nearest-neighbor algorithms (HNSW, IVF) trade a small amount of retrieval accuracy for dramatically faster query times by building an index structure that avoids comparing against every single vector, typically achieving sub-linear or near-constant query time at scale.',
        'HNSW (Hierarchical Navigable Small World graphs) builds a multi-layer graph structure enabling fast approximate search with strong recall — it has become a popular default across many vector database implementations due to this favorable speed-accuracy balance.',
        'Index-building parameters (like HNSW\'s ef_construction and M) directly control the speed-accuracy-memory tradeoff — higher values improve recall at the cost of slower index construction and higher memory usage, a tuning decision that should reflect the actual application\'s accuracy requirements.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'FAISS (ANN)',
      language: 'typescript',
      code: `// FAISS via Python (faiss-cpu or faiss-gpu)
// pip install faiss-cpu numpy

// import numpy as np
// import faiss

// # Create and populate an HNSW index
// dimension = 1536  # text-embedding-3-small output dim
// M = 32            # number of neighbours per node (higher = better recall, more memory)

// index = faiss.IndexHNSWFlat(dimension, M)
// index.hnsw.efSearch = 64   # search depth (higher = better recall, slower query)

// # Add 100K vectors
// np.random.seed(42)
// vectors = np.random.rand(100_000, dimension).astype('float32')
// faiss.normalize_L2(vectors)   # normalise for cosine similarity
// index.add(vectors)

// # Query: find 5 nearest neighbours
// query = np.random.rand(1, dimension).astype('float32')
// faiss.normalize_L2(query)
// distances, indices = index.search(query, k=5)
// print("Top-5 indices:", indices[0])
// print("Cosine similarities:", 1 - distances[0])

// # Persist index
// faiss.write_index(index, "my_index.faiss")
// index = faiss.read_index("my_index.faiss")

// # IVF+PQ for large-scale (10M+ vectors)
// quantiser = faiss.IndexFlatL2(dimension)
// nlist = 2048    # number of clusters
// m = 96          # number of sub-quantisers (dimension must be divisible)
// bits = 8        # bits per sub-quantiser
// index_ivfpq = faiss.IndexIVFPQ(quantiser, dimension, nlist, m, bits)
// index_ivfpq.train(training_vectors)   # train on representative sample
// index_ivfpq.add(all_vectors)`,
    },
    {
      label: 'Pinecone TypeScript',
      language: 'typescript',
      code: `// Pinecone TypeScript SDK
// npm install @pinecone-database/pinecone

import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env['PINECONE_API_KEY']! });

async function setupAndQuery() {
  // Create index (serverless)
  await pc.createIndex({
    name: 'documents',
    dimension: 1536,
    metric: 'cosine',
    spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
  });

  const index = pc.index('documents');

  // Upsert vectors with metadata
  await index.upsert([
    {
      id: 'doc-001',
      values: Array.from({ length: 1536 }, () => Math.random()),
      metadata: { text: 'Return policy: 30-day returns', category: 'policy', date: '2025-01-01' },
    },
    {
      id: 'doc-002',
      values: Array.from({ length: 1536 }, () => Math.random()),
      metadata: { text: 'Shipping costs: free over $50', category: 'shipping', date: '2025-01-01' },
    },
  ]);

  // Query with metadata filter
  const queryVector = Array.from({ length: 1536 }, () => Math.random());
  const results = await index.query({
    vector: queryVector,
    topK: 5,
    filter: { category: { $eq: 'policy' } },  // metadata pre-filter
    includeMetadata: true,
  });

  for (const match of results.matches) {
    console.log(\`Score: \${match.score?.toFixed(4)} | \${(match.metadata as { text: string }).text}\`);
  }

  // Namespace for multi-tenancy
  const userIndex = index.namespace('user-123');
  await userIndex.upsert([{ id: 'note-1', values: queryVector, metadata: { text: 'My note' } }]);
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not normalising vectors before cosine similarity search',
      wrong: `// Raw vectors without L2 normalisation
index.add(raw_vectors)
# cosine similarity = dot(a,b) / (|a||b|)
# Without normalisation, |a| and |b| vary → dot product ≠ cosine similarity`,
      right: `# Normalise to unit length: then dot product == cosine similarity
faiss.normalize_L2(vectors)   # in-place L2 normalisation
index.add(vectors)            # now inner product index gives cosine similarity`,
      explanation: 'Cosine similarity measures the angle between vectors, not their magnitude. Without L2 normalisation, high-magnitude vectors dominate retrieval. Normalise to unit length so that dot product equals cosine similarity.',
    },
    {
      title: 'Using a flat (exact) index for production scale',
      wrong: `# Exact search (IndexFlatL2) on 10M vectors
index = faiss.IndexFlatL2(1536)
index.add(ten_million_vectors)  # 60GB RAM; query: 15 seconds`,
      right: `# Use HNSW for fast, high-recall ANN
index = faiss.IndexHNSWFlat(1536, 32)  # M=32, queries in <10ms
# Or IVF+PQ for memory-constrained billion-scale
index = faiss.IndexIVFPQ(quantiser, 1536, 2048, 96, 8)`,
      explanation: 'Flat exact search is O(N·d) — fine for <100K vectors but unusable at millions. HNSW delivers >95% recall in milliseconds at 10M+ scale. Use IVF+PQ if memory is constrained.',
    },
    {
      title: 'Embedding at query time without caching',
      wrong: `// Re-embedding the same queries repeatedly
async function search(query: string) {
  const embedding = await openai.embeddings.create({ input: query, model: 'text-embedding-3-small' });
  // Each call: 1 API round trip + cost even if query was used before
}`,
      right: `// Cache query embeddings — same text → same vector
const queryCache = new Map<string, number[]>();

async function search(query: string) {
  if (!queryCache.has(query)) {
    const resp = await openai.embeddings.create({ input: query, model: 'text-embedding-3-small' });
    queryCache.set(query, resp.data[0].embedding);
  }
  return vectorDB.query({ vector: queryCache.get(query)!, topK: 5 });
}`,
      explanation: 'Embedding API calls cost money and add ~100ms latency. Identical queries produce identical vectors. Cache query embeddings in-memory (or Redis) — especially for popular search terms.',
    },
    {
      title: 'Over-filtering before ANN search',
      wrong: `// Filter to only 100 vectors out of 1M, then run ANN
// HNSW graph navigation breaks down with < ~1000 vectors in the filtered set
results = index.query(vector, filter={'user_id': 'user-123'}, topK=5)
// Result: poor recall, slow, or no results`,
      right: `// If filter is very selective, use namespace/collection isolation
const userIndex = pinecone.index('docs').namespace('user-123');
// Or store user data in separate collections
// ANN works best with ≥ 10K vectors in the search space`,
      explanation: 'ANN algorithms navigate a graph built from all vectors. Very selective pre-filters leave too few vectors for the graph navigation to work — recall collapses. Isolate highly selective data into separate namespaces or collections.',
    },
  ];

  challenge: Challenge = {
    title: 'Cosine Similarity vs Dot Product',
    language: 'typescript',
    description: 'Implement two similarity functions and show that for L2-normalised vectors, dot product equals cosine similarity. Include a normalise function.',
    hints: [
      'L2 norm: sqrt(sum of squares)',
      'Normalise: divide each component by the L2 norm',
      'For unit vectors: dot(a, b) === cosine(a, b)',
    ],
    starterCode: `function l2Normalise(v: number[]): number[] {
  // Return unit-length vector
}

function dotProduct(a: number[], b: number[]): number {
  // Return dot product
}

function cosineSimilarity(a: number[], b: number[]): number {
  // Return cosine similarity
}`,
    solution: `function l2Normalise(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return v.map(x => x / (norm + 1e-10));
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((s, ai, i) => s + ai * b[i], 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const na = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
  const nb = Math.sqrt(b.reduce((s, x) => s + x * x, 0));
  return dotProduct(a, b) / (na * nb + 1e-10);
}

// Verify: for normalised vectors, dot === cosine
const a = l2Normalise([1, 2, 3]);
const b = l2Normalise([4, 5, 6]);
console.log(dotProduct(a, b).toFixed(6));       // e.g. 0.974632
console.log(cosineSimilarity(a, b).toFixed(6)); // same value`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of HNSW over brute-force (Flat) search?',
      options: [
        'HNSW gives exact results',
        'HNSW finds approximate nearest neighbours in O(log N) time vs O(N·d) for brute-force — orders of magnitude faster at scale',
        'HNSW uses less memory than Flat',
        'HNSW supports more distance metrics',
      ],
      answer: 1,
      explanation: 'HNSW builds a multi-layer navigable small world graph. Queries start at the top layer (coarse navigation) and drill down to the bottom layer (fine search) — achieving O(log N) complexity with >95% recall typical on real datasets.',
    },
    {
      q: 'Why should vectors be L2-normalised before cosine similarity search?',
      options: [
        'To reduce the embedding dimension',
        'To make dot product equivalent to cosine similarity — allowing fast inner product indexes to compute cosine similarity',
        'L2 normalisation improves embedding quality',
        'To reduce storage size',
      ],
      answer: 1,
      explanation: 'Cosine similarity = dot(a,b) / (|a|·|b|). If |a|=|b|=1 (unit vectors), cosine simplifies to just dot(a,b). This lets you use an Inner Product index (faster than computing norms at query time) to get cosine similarity.',
    },
    {
      q: 'When would you use IVF+PQ instead of HNSW?',
      options: [
        'When you need the highest possible recall',
        'When you have billions of vectors and memory is constrained — PQ compresses vectors 4–64×',
        'When you need exact search',
        'When your vectors have fewer than 100 dimensions',
      ],
      answer: 1,
      explanation: 'HNSW stores full vectors plus graph edges — memory scales as O(N·M·d). At a billion vectors with 1536 dims, that\'s terabytes. IVF+PQ compresses vectors 4–64× using product quantisation, making billion-scale feasible on CPUs.',
    },
  { q: 'What is approximate nearest neighbor (ANN) search and why is it used?', options: ['Exact nearest neighbor search with optimizations', 'A family of algorithms that find approximate results faster than exact search, trading small accuracy loss for large speed gains', 'A type of vector database', 'A method for dimensionality reduction'], answer: 1, explanation: 'Exact nearest neighbor in high dimensions requires O(n*d) time — too slow for millions of vectors. ANN algorithms (HNSW, IVF, LSH) find approximate results in O(log n) or O(sqrt(n)) with tunable accuracy/speed tradeoff. Recall@10 > 0.95 is typical for well-tuned ANN.' },
  { q: 'What is HNSW and why is it popular for vector search?', options: ['A hash-based search method', 'Hierarchical Navigable Small World: a graph-based ANN index that provides very high recall with fast query times', 'A database replication protocol', 'A dimensionality reduction algorithm'], answer: 1, explanation: 'HNSW: builds a layered graph where each layer is a coarser version of the vector space. Search: start at top layer (few connections, wide jumps), navigate to nearest neighbor, descend to lower layers (finer search). O(log n) query time, high recall, supports incremental insertion. Default in Pinecone, Weaviate, Qdrant.' },
  { q: 'What embedding model should you choose for semantic search?', options: ['Any embedding model works equally well', 'Domain-specific models outperform general models; text-embedding-3-large (OpenAI) or E5/BGE are strong for general English text', 'Only fine-tuned models should be used', 'Embedding model quality does not affect retrieval quality'], answer: 1, explanation: 'Embedding model quality directly impacts retrieval quality. MTEB benchmark ranks models on diverse retrieval/semantic similarity tasks. For English: text-embedding-3-large (OpenAI), E5-large-v2, BGE-large-en-v1.5. For multilingual: multilingual-e5-large. For code: code-search-net. Fine-tune on domain data for specialized use cases.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I choose between Pinecone, Weaviate, Qdrant, and pgvector?',
      a: 'pgvector: already on Postgres and <10M vectors — add HNSW with one extension, no new infrastructure. Pinecone: need a fully managed solution with zero ops, multi-tenancy via namespaces, and a simple TypeScript SDK. Weaviate: need hybrid search (BM25+vector) built in, or multi-modal data. Qdrant: need very high throughput, advanced payload filtering, or named vectors per object (multiple embedding models). Chroma: local prototype only, not production. The RAG demo that works with Chroma in a Jupyter notebook is not the same as production scale.',
    },
    {
      q: 'What is product quantisation and when does the recall loss matter?',
      a: 'PQ divides each d-dimensional vector into m sub-vectors of size d/m, then trains a codebook of 2^bits centroids for each sub-vector. At query time, sub-vectors are replaced by centroid IDs — reducing storage from d×4 bytes to m×(bits/8) bytes. Recall loss is typically 2–5% at m=96, bits=8 for 1536-dim vectors. This matters for high-precision recall-sensitive tasks (e.g. face recognition). For RAG, 2–5% recall loss is usually acceptable given the 10–20× memory savings at billion scale.',
    },
  { q: 'What is a key operational tradeoff of pgvector versus a dedicated vector database like Pinecone at large scale?', a: 'pgvector runs vector search as an extension inside your existing PostgreSQL instance, so scaling the vector workload means scaling your entire relational database (compute, storage, connection limits) even if the rest of your app\'s Postgres usage is light — there is no independent scaling knob for "just the vector search part." A dedicated vector database like Pinecone is a separate, purpose-built service that scales its indexing and query throughput independently of any relational data you have elsewhere, at the cost of introducing a second system to operate, secure, and keep in sync with your source-of-truth data.' },
  { q: 'How do you filter vector search results by metadata?', a: 'Pre-filtering (filter before ANN search): apply metadata filter to reduce candidate set, then search within filtered subset. Fast for high-selectivity filters; degrades quality for low-selectivity filters. Post-filtering (search then filter): run ANN search on all vectors, filter results after. Simple but may return fewer than k results. Hybrid: use filtered index partitions. Pinecone, Weaviate, Qdrant all support metadata filtering with different performance characteristics. Always store metadata alongside embeddings.' },
  { q: 'What is the index build vs query tradeoff in vector databases?', a: 'HNSW: fast queries (O(log n)), high recall, but slow index build (O(n log n)) and high memory use. IVF (Inverted File Index): fast build, lower memory, but lower recall (only searches k nearest cluster centroids). IVF+PQ (Product Quantization): compressed vectors — lower memory, lower accuracy. HNSW is preferred when: query latency matters and you have enough RAM. IVF+PQ for: billions of vectors with limited memory. Parameters: ef_construction (build recall), ef (query recall), m (connections per node in HNSW).' },
  { q: 'How do you update and delete vectors in a production vector database?', a: 'Vector databases handle updates differently: (1) Upsert: most databases support upsert (insert or update by ID) — pass new embedding with same ID. (2) Deletion: mark as deleted (soft delete) or remove from index. Rebuilding HNSW index for every delete is expensive — periodic compaction is typical. (3) Immutable approach: append new version, deprecate old by ID prefix. (4) Re-indexing: when embedding model changes, re-embed all documents and rebuild the index. Plan for periodic re-indexing as your embedding model evolves.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Vector DBs index embeddings for ANN search. HNSW = fast high-recall graph index. IVF+PQ = compressed billion-scale. Normalise vectors; filter selectively; choose DB by your scale and ops burden.',
    mustKnow: [
      'ANN vs exact: HNSW O(log N) vs Flat O(N·d); >95% recall typical',
      'L2 normalise before cosine search → dot product == cosine similarity',
      'IVF: cluster space into cells, search nprobe cells. IVF+PQ adds compression',
      'Metadata filter: pre-filter needs ≥10K vectors in set; use namespaces for sparse data',
      'pgvector for existing Postgres; Pinecone for fully managed; Qdrant for high perf',
      'Upsert by ID; namespace for multi-tenancy',
    ],
    interviewFocus: [
      'Why can\'t a traditional DB store and query embedding vectors efficiently?',
      'Compare HNSW and IVF index types — when would you choose each?',
      'How does metadata filtering interact with ANN search?',
    ],
  };
}
