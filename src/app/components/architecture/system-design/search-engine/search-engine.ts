import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Crawler',         type: 'keyword', desc: 'Fetches web pages following links. Respects robots.txt and crawl-delay.' },
  { name: 'Inverted index',  type: 'keyword', desc: 'token → [doc_id, positions]. Core data structure for full-text search.' },
  { name: 'BM25',            type: 'keyword', desc: 'Best Match 25 — TF-IDF variant. Standard ranking algorithm for keyword search.' },
  { name: 'PageRank',        type: 'keyword', desc: 'Link-based authority score. High-quality inbound links boost rank.' },
  { name: 'Tokenisation',    type: 'keyword', desc: 'Split text into tokens: lowercase, strip punctuation, stem/lemmatise.' },
  { name: 'Sharding index',  type: 'keyword', desc: 'Partition inverted index by term hash or document range across search nodes.' },
  { name: 'Query expansion',  type: 'keyword', desc: 'Synonym expansion and spell-correction to improve recall.' },
  { name: 'Elasticsearch',   type: 'keyword', desc: 'Distributed search engine built on Lucene. Used by GitHub, Shopify, Stack Overflow.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Crawler pipeline',
    points: [
      'URL frontier: priority queue of URLs to crawl. Prioritise by PageRank estimate + freshness.',
      'Fetcher: HTTP GET page → extract text + outbound links → dedup links (Bloom filter).',
      'Politeness: respect robots.txt, crawl-delay header; rate-limit per domain.',
      'Content dedup: near-duplicate detection with SimHash — avoid indexing mirror sites.',
    ],
  },
  {
    heading: 'Inverted index',
    points: [
      'Forward index: doc_id → list of tokens. Inverted index: token → list of (doc_id, position, frequency).',
      'Posting list: sorted list of doc_ids containing a token. Intersection = AND query; union = OR.',
      'Positions enable phrase queries: "system design" needs both tokens adjacent.',
      'Index is built offline (batch) and merged. Lucene segments: each segment is an immutable mini-index.',
    ],
  },
  {
    heading: 'Ranking: BM25 + signals',
    points: [
      'BM25 score: TF saturation (more occurrences helps but with diminishing returns) × IDF (rare terms score higher) × field length normalisation.',
      'BM25 is the baseline. Layer additional signals: PageRank, freshness, click-through rate, domain authority.',
      'Learning-to-rank (LTR): ML model trained on human relevance judgements or click data combines all signals.',
      'Query expansion: add synonyms, correct spelling → broader recall without lower precision.',
    ],
  },
  {
    heading: 'Distributed search architecture',
    points: [
      'Index too large for one node → shard by document range or hash(doc_id).',
      'Scatter-gather: query fan-out to all shards → each returns top K results → coordinator merges → final top K.',
      'Replicate each shard (3×) for HA. Read from any replica; writes go to primary shard.',
      'Hot terms (common words): posting lists can be millions long — store compressed (delta + varint encoding).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Inverted Index',
    language: 'typescript',
    code: `// Simplified inverted index — in-memory demo

type PostingList = { docId: number; freq: number; positions: number[] }[];

class InvertedIndex {
  private index = new Map<string, PostingList>();
  private docs = new Map<number, string>();

  // Index a document
  addDocument(docId: number, text: string): void {
    this.docs.set(docId, text);
    const tokens = this.tokenise(text);

    const termFreq = new Map<string, number[]>();
    tokens.forEach((token, pos) => {
      if (!termFreq.has(token)) termFreq.set(token, []);
      termFreq.get(token)!.push(pos);
    });

    for (const [term, positions] of termFreq) {
      if (!this.index.has(term)) this.index.set(term, []);
      this.index.get(term)!.push({ docId, freq: positions.length, positions });
    }
  }

  // AND query: find docs containing ALL terms
  search(query: string): number[] {
    const terms = this.tokenise(query);
    if (terms.length === 0) return [];

    // Start with shortest posting list (most selective)
    const postings = terms
      .map(t => this.index.get(t) ?? [])
      .sort((a, b) => a.length - b.length);

    // Intersect posting lists
    let result = new Set(postings[0].map(p => p.docId));
    for (let i = 1; i < postings.length; i++) {
      const next = new Set(postings[i].map(p => p.docId));
      result = new Set([...result].filter(id => next.has(id)));
    }
    return [...result];
  }

  private tokenise(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 1 && !STOP_WORDS.has(t));
  }
}

const STOP_WORDS = new Set(['the', 'a', 'an', 'in', 'on', 'is', 'and', 'or']);`,
  },
  {
    label: 'BM25 Ranking',
    language: 'typescript',
    code: `// BM25 ranking algorithm
// Score(D, Q) = Σ IDF(qi) × (freq(qi,D) × (k1+1)) / (freq(qi,D) + k1×(1-b+b×|D|/avgDL))

interface Document { id: number; text: string; tokens: string[]; }

class BM25 {
  private readonly k1 = 1.5;  // term frequency saturation (1.2–2.0)
  private readonly b  = 0.75; // length normalisation (0 = no norm, 1 = full)

  private idf = new Map<string, number>();
  private avgDocLen = 0;

  constructor(private docs: Document[]) {
    this.avgDocLen = docs.reduce((s, d) => s + d.tokens.length, 0) / docs.length;
    this.computeIDF();
  }

  private computeIDF(): void {
    const N = this.docs.length;
    const df = new Map<string, number>();
    for (const doc of this.docs) {
      for (const term of new Set(doc.tokens)) {
        df.set(term, (df.get(term) ?? 0) + 1);
      }
    }
    for (const [term, count] of df) {
      // IDF: log((N - count + 0.5) / (count + 0.5) + 1)
      this.idf.set(term, Math.log((N - count + 0.5) / (count + 0.5) + 1));
    }
  }

  score(doc: Document, queryTerms: string[]): number {
    const docLen = doc.tokens.length;
    let score = 0;

    for (const term of queryTerms) {
      const idf = this.idf.get(term) ?? 0;
      const freq = doc.tokens.filter(t => t === term).length;
      const tf = (freq * (this.k1 + 1)) /
        (freq + this.k1 * (1 - this.b + this.b * docLen / this.avgDocLen));
      score += idf * tf;
    }
    return score;
  }

  rank(query: string): Document[] {
    const terms = query.toLowerCase().split(/\s+/);
    return this.docs
      .map(doc => ({ doc, score: this.score(doc, terms) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.doc);
  }
}`,
  },
  {
    label: 'Elasticsearch Query',
    language: 'bash',
    code: `# Elasticsearch — production search with BM25 + boosting

# 1. Create index with custom analyser
PUT /products
{
  "settings": {
    "analysis": {
      "analyzer": {
        "product_analyser": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop", "snowball"]  // stemming
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title":       { "type": "text", "analyzer": "product_analyser", "boost": 3 },
      "description": { "type": "text", "analyzer": "product_analyser" },
      "tags":        { "type": "keyword" },
      "price":       { "type": "float" },
      "popularity":  { "type": "integer" }
    }
  }
}

# 2. Multi-field search with function scoring
POST /products/_search
{
  "query": {
    "function_score": {
      "query": {
        "multi_match": {
          "query": "red sneakers running",
          "fields": ["title^3", "description"],  // title weighted 3×
          "type": "best_fields",
          "fuzziness": "AUTO"                    // spell correction
        }
      },
      "functions": [
        { "field_value_factor": { "field": "popularity", "modifier": "log1p", "factor": 0.5 } }
      ],
      "score_mode": "multiply"  // BM25 × popularity boost
    }
  },
  "from": 0, "size": 20
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Querying the search index on every keystroke',
    wrong: `// Search on every keydown event
input.addEventListener('keydown', () => search(input.value));
// User types "system design" = 13 requests fired
// Many return before previous — race condition on results`,
    right: `// Debounce: wait 300ms after last keystroke
const debouncedSearch = debounce(search, 300);
input.addEventListener('input', () => debouncedSearch(input.value));
// Also: cancel in-flight request if new query arrives (AbortController)`,
    explanation: 'Searching on every keystroke fires 10-20 requests per word typed. Debouncing by 300ms fires 1 request per search. Also cancel stale in-flight requests to prevent out-of-order results from rendering.',
  },
  {
    title: 'Storing posting lists uncompressed',
    wrong: `// Term "the" appears in 500M documents
// Posting list: [1, 2, 3, 4, ..., 500,000,000]
// 500M × 4 bytes = 2 GB for one common term`,
    right: `// Delta encoding + varint compression
// [1, 2, 3, 4] → store deltas: [1, 1, 1, 1]
// [1000, 1050, 1200] → [1000, 50, 150] → smaller varint encoding
// Lucene: FOR (Frame of Reference) + PFOR compression
// 2 GB → ~100 MB for common terms`,
    explanation: 'Uncompressed posting lists for common terms (stop words) are gigabytes. Delta encoding (store gaps between doc IDs) + varint compression (variable-length integers) shrinks this 10-20×. Remove stop words from the index entirely.',
  },
  {
    title: 'Single search node — no sharding',
    wrong: `// All 50 billion web pages indexed on one machine
// Index size: 500 TB
// Single search node: 1 machine with 2 TB RAM, 100 TB SSD
// Not enough — and single point of failure`,
    right: `// Shard index across 100 nodes
// Each shard: 500 TB / 100 = 5 TB — fits in NVMe SSDs
// Scatter-gather: broadcast query to all 100 shards
// Each returns top 20 → coordinator merges → global top 20`,
    explanation: 'A search index at web scale is terabytes or petabytes — far beyond a single machine. Shard the inverted index by document range or hash. Scatter-gather fan-out queries to all shards and merge results.',
  },
  {
    title: 'Not caching popular query results',
    wrong: `// "python tutorial" searched 10,000 times/minute
// Each search: scatter to 100 shards + BM25 scoring = 50ms
// 10k × 50ms = 500 core-seconds wasted per minute`,
    right: `// Cache top-N query results in Redis
const cacheKey = \`search:\${hash(query)}:page:\${page}\`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
const results = await searchIndex(query, page);
await redis.setEx(cacheKey, 300, JSON.stringify(results)); // 5 min TTL`,
    explanation: 'Search traffic follows a power-law distribution — top 1% of queries account for 50%+ of traffic. Cache results for popular queries in Redis with a short TTL. Index updates invalidate or expire the cache.',
  },
];

const challenge: Challenge = {
  title: 'Design a product search for an e-commerce site',
  language: 'typescript',
  description: `Design product search for an e-commerce platform (Amazon-like).

Scale:
- 500M product listings
- 50M searches/day = ~580 searches/sec
- Products updated frequently (price, stock, ratings)

Requirements:
1. Full-text search: "red running shoes size 10"
2. Faceted filtering: brand, price range, rating, in-stock
3. Results ranked by: relevance + popularity + personalisation
4. Autocomplete: suggestions as user types (< 50ms)
5. Near-real-time index updates (price changes within 30s)

Design:
- Index structure
- Query processing pipeline
- Update propagation
- Autocomplete`,
  hints: [
    'Elasticsearch: multi-field BM25 + function_score for popularity boost',
    'Facets: aggregations on keyword fields (brand, category)',
    'Autocomplete: separate suggest index with edge n-grams',
    'Near-real-time: Kafka CDC from product DB → Elasticsearch bulk indexer',
  ],
  starterCode: `interface SearchSystem {
  indexStructure: string;
  queryPipeline: string[];
  updateMechanism: string;
  autocompletePipeline: string;
  rankingSignals: string[];
}`,
  solution: `const searchSystem: SearchSystem = {
  indexStructure: \`
    Elasticsearch cluster: 10 data nodes × 3 replicas
    Index: products (500M docs × ~2KB each = 1 TB index)
    Shards: 30 primary shards — each ~33M docs
    Mapping: title (text, boost=3, edge_ngram for autocomplete),
      description (text), brand/category (keyword for facets),
      price/rating/stock (numeric for range filter + sort),
      popularity_score (float — precomputed daily)\`,

  queryPipeline: [
    '1. Parse: extract filters from query ("under $50", "Nike", "in stock")',
    '2. Spell correction: "runing shoes" → "running shoes" (ES suggest API)',
    '3. Synonym expansion: "shoes" → ["shoes", "sneakers", "footwear"]',
    '4. Elasticsearch bool query: must=full-text, filter=facets (cached)',
    '5. function_score: BM25 × log(popularity) × user_affinity_boost',
    '6. Aggregations: brand/price/rating buckets for facet counts',
    '7. Cache results for popular queries (Redis, TTL=5min)',
  ],

  updateMechanism: \`
    CDC: Debezium reads PostgreSQL WAL → Kafka topic "product-updates"
    Indexer service: consumes Kafka, calls ES _bulk API (500 docs/batch)
    ES near-real-time: refresh_interval=1s → changes visible in ~1-2s
    Price changes: high-priority Kafka partition → dedicated indexer → < 30s\`,

  autocompletePipeline: \`
    Separate ES index: suggest (edge_ngram min=1, max=15)
    "run" → tokenises to: r, ru, run, runn, ...
    Query: prefix match on suggest index → top 10 by popularity_score
    Cache in Redis: key=query_prefix, TTL=60s
    Latency: < 20ms (Redis hit) or < 50ms (ES query)\`,

  rankingSignals: [
    'BM25 text relevance (title weighted 3×, description 1×)',
    'Popularity score (log of sales rank, refreshed daily)',
    'Rating × review count (Wilson score lower bound)',
    'Personalisation: category affinity from last 30 days clicks (A/B tested)',
    'Freshness: slight boost for listings updated in last 7 days',
    'In-stock boost: out-of-stock items penalised by 0.5×',
  ],
};`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'An inverted index maps?',
    options: [
      'Document ID → list of tokens in that document',
      'Token → list of documents containing that token',
      'URL → page rank score',
      'Query → cached result set',
    ],
    answer: 1,
    explanation: 'An inverted index maps each unique token to the list of documents (posting list) that contain it. This enables O(1) lookup for "which documents contain this word?" — the core operation for search. A forward index maps document → tokens.',
  },
  {
    q: 'BM25 improves over simple TF-IDF by?',
    options: [
      'Using neural embeddings instead of term frequency',
      'Applying term frequency saturation and document length normalisation',
      'Ignoring common words',
      'Ranking by publication date',
    ],
    answer: 1,
    explanation: 'BM25 adds: (1) TF saturation — more occurrences help, but with diminishing returns (a word appearing 100× is not 10× better than 10×); (2) length normalisation — short documents with one mention score as well as long documents with many mentions.',
  },
  {
    q: 'Scatter-gather in a distributed search engine means?',
    options: [
      'Crawling multiple URLs in parallel',
      'Broadcasting a query to all index shards and merging the top-K results',
      'Replicating the index across data centers',
      'Caching results across multiple Redis nodes',
    ],
    answer: 1,
    explanation: 'The index is sharded across N nodes. A query coordinator broadcasts the query to all shards (scatter). Each shard returns its local top-K results. The coordinator merges all responses and returns the global top-K (gather).',
  },
  { q: 'What is an inverted index and why is it used for text search?', options: ['An index that stores data in reverse alphabetical order for fast range queries', 'An index that maps each word or token to the list of documents containing it, enabling efficient full-text search', 'An index built by reversing the primary key for backward traversal', 'A B-tree index applied to a reversed string for suffix matching'], answer: 1, explanation: 'An inverted index inverts the document-to-words relationship into a word-to-documents mapping. For each unique word in the corpus, it stores the list of document IDs (and optionally positions) where that word appears. At query time, looking up a word in the inverted index immediately returns the set of matching documents. Intersecting lists from multiple query words gives documents matching all terms. This is fundamentally different from a B-tree index: inverted indexes enable arbitrary keyword searches across text content, which B-trees cannot do efficiently.' },
  { q: 'What is TF-IDF and how is it used for search relevance ranking?', options: ['A traffic flow algorithm that optimizes query distribution across search nodes', 'A relevance scoring formula where TF measures term frequency in a document and IDF penalizes terms that appear in many documents', 'A caching strategy that stores frequently queried terms in memory', 'A data structure for storing inverted index entries efficiently'], answer: 1, explanation: 'TF-IDF scores document relevance for a query term. Term Frequency (TF): how often does the term appear in this document? More occurrences = higher score. Inverse Document Frequency (IDF): how rare is this term across all documents? Terms appearing in most documents (like the or is) carry less information and get a lower IDF score. The combined TF-IDF score rewards documents with frequent occurrences of rare terms. BM25 is a modern refinement of TF-IDF that adds document length normalization and is the default ranking algorithm in Elasticsearch and Solr.' },
  { q: 'What is the difference between a search index and a database index?', options: ['Search indexes support equality queries; database indexes support full-text search', 'Search indexes like Elasticsearch use inverted indexes optimized for text relevance; database indexes like B-trees are optimized for exact match and range queries on structured data', 'Database indexes are persisted to disk; search indexes live only in memory', 'Search indexes require more storage than database indexes for the same data'], answer: 1, explanation: 'Database B-tree indexes support equality (WHERE col = value), range (WHERE col > 10), and prefix queries. They do not support ranking by relevance or arbitrary keyword searches across prose text. Search indexes (Elasticsearch, Solr) use inverted indexes optimized for text: they tokenize, stem, and normalize text at index time, then support keyword search with relevance ranking, fuzzy matching, synonym expansion, and faceted filtering. Use a database index for structured data lookups and a search engine index for user-facing content search with ranking.' },
];

const qna: QnaItem[] = [
  {
    q: 'How is Elasticsearch different from building your own search?',
    a: 'Elasticsearch is a distributed search engine built on Apache Lucene. It provides: automatic sharding and replication, BM25 ranking out-of-the-box, rich query DSL (bool, range, geo, nested), real-time indexing (refresh_interval=1s), aggregations for facets, and a REST API. Building your own gives more control but requires implementing all of these. For most products, Elasticsearch is the right choice — only web-scale systems (Google, Bing) build proprietary search engines.',
  },
  {
    q: 'How do you implement autocomplete efficiently?',
    a: 'Two approaches: (1) Prefix trie in memory: index all popular queries + product titles. O(prefix_len) lookup. Maintained by a background process refreshed hourly. (2) Elasticsearch completion suggester: uses an FST (Finite State Transducer) — extremely fast, but requires separate suggest field with edge_ngram analyser. Cache autocomplete results in Redis with a 60s TTL. At Google scale: suggest service is a separate distributed system with dedicated hardware.',
  },
  { q: 'How does Elasticsearch handle horizontal scaling via sharding?', a: 'Elasticsearch divides an index into shards, each of which is an independent Lucene index. A primary shard handles writes and can have one or more replica shards for redundancy and read scaling. By default, an index has 5 primary shards, distributing documents across 5 shards by consistent hashing of the document ID. Each shard is allocated to a node in the cluster; adding nodes allows Elasticsearch to redistribute shards automatically. Read requests fan out to all shards in parallel and results are merged. The number of primary shards is fixed at index creation time because changing it changes routing; plan shard count based on expected data volume, targeting shard sizes of 10-50 GB each for optimal performance.' },
  { q: 'How do you implement autocomplete in a search system?', a: 'Autocomplete (typeahead) requires very low latency since it fires on every keystroke. Approaches: prefix trie stored in memory: a trie data structure supports efficient prefix lookups in O(k) time where k is the prefix length. Edge n-gram indexing in Elasticsearch: index each prefix of each word, so typing sys matches syst, syste, system. Redis sorted sets for popularity-based completion: store completions as members with their popularity score as the member score; ZRANGEBYLEX on a sorted set of all completions returns matches for a prefix. Suggest API in Elasticsearch uses a completion suggester optimized for prefix matching with popularity scoring. Precompute and cache the top N completions for the most common prefixes to further reduce latency.' },
  { q: 'What is semantic search and how does it differ from keyword search?', a: 'Keyword search matches documents containing the query words exactly or via stemming and synonyms. It fails when the user searches for fast and the relevant document uses quick rather than fast. Semantic search uses embedding models to convert both queries and documents into dense vector representations in a high-dimensional semantic space. Documents similar in meaning have vectors close together regardless of exact word choice. At query time, embed the query and find documents whose vectors are nearest using approximate nearest neighbor search (FAISS, Pinecone, Weaviate). Vector search enables finding conceptually relevant results even without exact keyword overlap. Hybrid search combines keyword BM25 scores with vector similarity scores for best coverage.' },
  { q: 'How do you handle index updates without downtime in a production search engine?', a: 'Zero-downtime reindex: create a new index with the updated mapping or settings. Configure the old index alias to serve queries while the new index is built. Start the reindex process, copying all documents from the old index to the new one. After reindex completes, optionally apply delta updates for documents changed during reindex by replaying the change log from that time window. Finally, atomically swap the alias from the old index to the new index. Queries switch to the new index instantly with no downtime. Delete the old index after confirming the new one is healthy. For large corpora, use the Elasticsearch Reindex API or Logstash to stream data between indexes.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Crawler → inverted index (token→posting list) → BM25+PageRank ranking → scatter-gather across shards → cache popular queries.',
  mustKnow: [
    'Inverted index: token → [(doc_id, freq, positions)] — core search data structure',
    'BM25: TF saturation × IDF × length normalisation — standard ranking algorithm',
    'Posting list intersection: AND query; union: OR query; sort by score for ranking',
    'Sharding: scatter query to all shards, gather top-K, merge for global top-K',
    'Near-real-time: Kafka CDC from DB → bulk indexer → 1-2s visibility',
    'Autocomplete: edge n-gram index + Redis cache for sub-50ms suggestions',
  ],
  interviewFocus: [
    'Explain inverted index structure and how AND/OR queries use it',
    'BM25 vs TF-IDF: what two improvements BM25 adds',
    'Scatter-gather: how distributed search handles sharded indexes',
    'How to keep search index up-to-date with frequent product changes',
  ],
};

@Component({
  selector: 'app-sysdesign-search-engine',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './search-engine.html',
  styleUrl: './search-engine.scss',
})
export class SysdesignSearchEngine {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
