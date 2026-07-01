import { Component } from '@angular/core';
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

@Component({
  selector: 'app-redis-stack',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './redis-stack.html',
  styleUrl: './redis-stack.scss',
})
export class RedisStack {
  quickRef: QuickRefItem[] = [
    { name: 'FT.CREATE idx ON HASH SCHEMA field TEXT', type: 'keyword', desc: 'Create a full-text search index on hash fields' },
    { name: 'FT.SEARCH idx "query" LIMIT 0 10', type: 'keyword', desc: 'Full-text search; returns matching documents' },
    { name: 'FT.AGGREGATE idx query GROUPBY ...', type: 'keyword', desc: 'Aggregation pipeline over search results' },
    { name: 'JSON.SET key $ value', type: 'keyword', desc: 'Store a JSON document at root ($) path' },
    { name: 'JSON.GET key $.field', type: 'keyword', desc: 'Get value at JSONPath expression' },
    { name: 'JSON.ARRAPPEND key $.array value', type: 'keyword', desc: 'Append to a JSON array atomically' },
    { name: 'TS.CREATE key [RETENTION ms]', type: 'keyword', desc: 'Create a time series key with optional retention' },
    { name: 'TS.ADD key timestamp value', type: 'keyword', desc: 'Add a data point (* = auto timestamp)' },
    { name: 'TS.RANGE key from to [AGGREGATION type bucket]', type: 'keyword', desc: 'Query time range with optional downsampling' },
    { name: 'BF.ADD key item', type: 'keyword', desc: 'Add an item to a Bloom filter' },
    { name: 'BF.EXISTS key item', type: 'keyword', desc: 'Check Bloom filter — 0 = definitely not present' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Redis Stack?',
      points: [
        'Redis Stack bundles Redis core with a set of official modules: RedisSearch (full-text search + secondary indexes), RedisJSON (native JSON storage + JSONPath queries), RedisTimeSeries (time series data), RedisBloom (probabilistic data structures), and RedisInsight (GUI).',
        'Modules extend Redis with new data types and commands while remaining fully compatible with the Redis protocol — existing clients work without changes.',
        'Redis Stack is available as a Docker image (`redis/redis-stack`), as cloud-managed Redis on Redis Cloud and AWS ElastiCache Serverless, and as a self-hosted installation.',
        'In Redis 7.4+ (Cloud), many Stack capabilities are available as part of Redis Community Edition. On self-hosted, you must use the Redis Stack package or load modules individually.',
      ],
    },
    {
      heading: 'RedisSearch — Full-Text & Secondary Indexes',
      points: [
        'FT.CREATE creates an index over existing (and future) Redis Hashes or JSON documents. Supports TEXT, NUMERIC, GEO, TAG, and VECTOR field types.',
        'Secondary indexes enable queries that would otherwise require SCAN + application-side filtering: range queries on numbers, tag filtering, geo radius search, and full-text search with ranking.',
        'FT.SEARCH supports query syntax: `hello world` (AND), `hello|world` (OR), `@field:[1 100]` (numeric range), `@field:{tag1|tag2}` (tag filter), `@field:(phrase)` (exact phrase).',
        'FT.AGGREGATE provides a server-side aggregation pipeline — GROUP BY, REDUCE (COUNT, SUM, AVG, etc.), SORT, APPLY transformations — for analytics without loading all data to the client.',
        'Indexes are maintained automatically as documents are added/updated/deleted — you only create the index once.',
      ],
    },
    {
      heading: 'RedisJSON — Native JSON Documents',
      points: [
        'JSON.SET stores a JSON document natively (not as a serialised string). Redis understands the structure and can update individual fields without deserialising the whole document.',
        'JSONPath syntax: `$` = root, `$.name` = top-level field, `$.addresses[0].city` = nested, `$..price` = recursive descent.',
        'JSON documents can be indexed by RedisSearch for full-text search across JSON fields.',
        'JSON.NUMINCRBY, JSON.ARRAPPEND, JSON.OBJLEN — operate on sub-paths atomically without loading the whole document.',
      ],
    },
    {
      heading: 'RedisTimeSeries & RedisBloom',
      points: [
        'RedisTimeSeries stores numeric time series with automatic compaction rules (downsample to averages/mins/maxes at larger intervals). Native support for TS.RANGE, TS.MRANGE (multiple series), and label-based queries.',
        'RedisBloom adds Bloom filters (space-efficient membership tests with no false negatives but possible false positives), Cuckoo filters, Count-Min Sketch, Top-K, and HyperLogLog extensions.',
        'Bloom filters are ideal for "have I seen this ID before?" checks (deduplication, cache warming) where false positives are acceptable but memory is constrained.',
      ],
    },
    {
      heading: 'Redis Stack Modules Beyond Core Data Structures',
      points: [
        'RedisJSON adds native JSON document storage and manipulation (JSON.SET, JSON.GET with path expressions) — letting you update a single nested field within a JSON document atomically, without needing to fetch, modify, and rewrite the entire document as a plain string.',
        'RediSearch adds full-text search and secondary indexing capabilities on top of Redis data — enabling complex queries (filtering, faceting, ranking) against Redis-stored data that would otherwise require a separate dedicated search engine like Elasticsearch.',
        'RedisTimeSeries provides purpose-built time-series data structures with automatic downsampling and retention policies — more efficient than manually implementing time-series storage using sorted sets, particularly for high-frequency metric ingestion.',
        'Redis Stack bundles these modules together specifically to reduce the operational overhead of running multiple separate specialized databases (a document store, a search engine, a time-series database) — consolidating into one Redis deployment where the additional capabilities genuinely fit the application\'s needs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'RedisJSON',
      language: 'typescript',
      code: `import { createClient } from 'redis';

const client = createClient({ url: 'redis://localhost:6379' });
await client.connect();

// Store a JSON document
await client.json.set('product:42', '$', {
  name: 'Wireless Headphones',
  price: 79.99,
  tags: ['electronics', 'audio'],
  stock: 150,
});

// Get specific fields via JSONPath
const name = await client.json.get('product:42', { path: '$.name' });
const price = await client.json.get('product:42', { path: '$.price' });

// Update a nested field atomically
await client.json.numIncrBy('product:42', '$.stock', -1);
await client.json.arrAppend('product:42', '$.tags', '"sale"');

// Get entire document
const product = await client.json.get('product:42', { path: '$' });
console.log(product); // [{ name, price, tags, stock }]`,
    },
    {
      label: 'RedisSearch',
      language: 'typescript',
      code: `import { createClient, SchemaFieldTypes } from 'redis';
const client = createClient();
await client.connect();

// Create a search index on JSON documents
await client.ft.create('idx:products', {
  '$.name': { type: SchemaFieldTypes.TEXT, ALIAS: 'name' },
  '$.price': { type: SchemaFieldTypes.NUMERIC, ALIAS: 'price', SORTABLE: true },
  '$.tags.*': { type: SchemaFieldTypes.TAG, ALIAS: 'tags' },
}, { ON: 'JSON', PREFIX: ['product:'] });

// Full-text search
const results = await client.ft.search('idx:products', 'wireless headphones');

// Numeric range + tag filter
const filtered = await client.ft.search(
  'idx:products',
  '@price:[50 100] @tags:{electronics}',
  { SORTBY: { BY: 'price', DIRECTION: 'ASC' }, LIMIT: { from: 0, size: 10 } }
);

// Aggregation: average price by tag
const agg = await client.ft.aggregate('idx:products', '*', {
  STEPS: [
    { type: 'GROUPBY', properties: ['@tags'], REDUCE: [{ type: 'AVG', property: '@price', AS: 'avg_price' }] },
    { type: 'SORTBY', BY: [{ BY: 'avg_price', DIRECTION: 'DESC' }] },
  ],
});`,
    },
    {
      label: 'Bloom Filter',
      language: 'typescript',
      code: `import { createClient } from 'redis';
const client = createClient();
await client.connect();

// Create a Bloom filter with expected 1M items, 0.1% false positive rate
await client.bf.reserve('seen:emails', 0.001, 1_000_000);

// Add items
await client.bf.add('seen:emails', 'user@example.com');

// Check membership (false = definitely not seen; true = probably seen)
const seen = await client.bf.exists('seen:emails', 'user@example.com');
console.log(seen); // true

// Batch check
const results = await client.bf.mExists('seen:emails', [
  'user@example.com',    // true (seen)
  'new@example.com',     // false (not seen)
]);

// Use case: deduplication before expensive DB insert
async function processEmail(email: string) {
  const alreadySeen = await client.bf.add('seen:emails', email);
  if (!alreadySeen) return; // 0 = was already present
  await db.processNewEmail(email); // only runs for genuinely new emails
}

declare const db: { processNewEmail: (e: string) => Promise<void> };`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Indexing before data is loaded — missing documents',
      wrong: `await client.ft.create('idx:products', schema, { ON: 'JSON', PREFIX: ['product:'] });
// Index only covers documents added AFTER creation
// Documents already in Redis at creation time are indexed retroactively — this is fine`,
      right: `// Redis DOES index existing documents retroactively on FT.CREATE
// But if you add documents before the index, they will be picked up.
// The real mistake is querying before indexing is complete on large datasets.
// Check: FT.INFO idx:products → num_docs should equal your document count`,
      explanation: 'FT.CREATE triggers a background scan of existing keys matching the PREFIX — existing documents ARE indexed. However, querying immediately may return incomplete results on large datasets. Check FT.INFO to confirm indexing is complete.',
    },
    {
      title: 'Storing JSON as a Redis string instead of using JSON.SET',
      wrong: `await client.set('product:42', JSON.stringify({ name: 'Widget', price: 9.99 }));
// Can't use JSONPath queries, RedisSearch JSON indexing, or atomic field updates`,
      right: `await client.json.set('product:42', '$', { name: 'Widget', price: 9.99 });
// Supports JSONPath, FT.CREATE ON JSON, JSON.NUMINCRBY, etc.`,
      explanation: 'Storing JSON as a plain string loses all RedisJSON benefits: no JSONPath queries, no RedisSearch JSON indexing, and no atomic field-level updates. Always use JSON.SET when using Redis Stack.',
    },
    {
      title: 'Not reserving a Bloom filter before use',
      wrong: `// BF.ADD auto-creates with defaults: 100 items, 1% FPR — too small for production
await client.bf.add('seen:ids', 'item-1');`,
      right: `// Reserve with production-sized parameters first
await client.bf.reserve('seen:ids', 0.001, 10_000_000); // 0.1% FPR, 10M items
await client.bf.add('seen:ids', 'item-1');`,
      explanation: 'BF.ADD auto-creates a filter with a default capacity of 100 items and 1% FPR if the key does not exist. For production, always reserve with realistic capacity and FPR using BF.RESERVE to avoid excessive false positives as the filter fills.',
    },
  ];

  challenge: Challenge = {
    title: 'Product Search Index',
    language: 'typescript',
    description: 'Write `setupProductIndex(client)` that creates an FT index called `idx:products` over JSON documents with prefix `product:`, indexing: name (TEXT), price (NUMERIC SORTABLE), category (TAG). Then write `searchProducts(client, query, maxPrice)` that searches the index filtering by query text and `@price:[0 maxPrice]`.',
    hints: [
      'Use SchemaFieldTypes.TEXT, NUMERIC (with SORTABLE: true), TAG',
      'Catch BUSYGROUP/Index exists error on FT.CREATE',
    ],
    starterCode: `import { createClient, SchemaFieldTypes } from 'redis';
type RedisClient = ReturnType<typeof createClient>;

async function setupProductIndex(client: RedisClient): Promise<void> {}
async function searchProducts(client: RedisClient, query: string, maxPrice: number) {}`,
    solution: `import { createClient, SchemaFieldTypes } from 'redis';
type RedisClient = ReturnType<typeof createClient>;

async function setupProductIndex(client: RedisClient) {
  try {
    await client.ft.create('idx:products', {
      '$.name': { type: SchemaFieldTypes.TEXT, ALIAS: 'name' },
      '$.price': { type: SchemaFieldTypes.NUMERIC, ALIAS: 'price', SORTABLE: true },
      '$.category': { type: SchemaFieldTypes.TAG, ALIAS: 'category' },
    }, { ON: 'JSON', PREFIX: ['product:'] });
  } catch (e: any) {
    if (!e.message.includes('Index already exists')) throw e;
  }
}

async function searchProducts(client: RedisClient, query: string, maxPrice: number) {
  const q = query ? \`\${query} @price:[0 \${maxPrice}]\` : \`@price:[0 \${maxPrice}]\`;
  return client.ft.search('idx:products', q, {
    SORTBY: { BY: 'price', DIRECTION: 'ASC' },
    LIMIT: { from: 0, size: 20 },
  });
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between JSON.SET and storing JSON with SET (as a string)?',
      options: [
        'No difference — both store JSON',
        'JSON.SET supports JSONPath queries, atomic field updates, and RedisSearch indexing',
        'JSON.SET compresses the data',
        'SET is faster for JSON data',
      ],
      answer: 1,
      explanation: 'JSON.SET stores JSON natively, enabling JSONPath queries (JSON.GET with paths), atomic field-level updates (JSON.NUMINCRBY, JSON.ARRAPPEND), and indexing via RedisSearch ON JSON. Plain SET stores a raw string — Redis cannot introspect its structure.',
    },
    {
      q: 'What does a BF.EXISTS return of 0 (false) guarantee?',
      options: [
        'The item is definitely in the filter',
        'The item is definitely NOT in the filter',
        'The filter is empty',
        'The item was recently evicted',
      ],
      answer: 1,
      explanation: 'Bloom filters have no false negatives: if BF.EXISTS returns 0, the item is definitely not in the filter. If it returns 1, the item is probably in the filter (small chance of false positive depending on filter size and fill rate).',
    },
    {
      q: 'What does the Redis Search module (FT.*) provide?',
      options: ['Full-text indexing and querying on Redis hash and JSON documents using an inverted index', 'A SQL query interface for Redis strings', 'Real-time stream processing', 'Graph traversal algorithms'],
      answer: 0,
      explanation: 'RediSearch provides secondary indexes, full-text search, numeric range queries, geospatial queries, and aggregations on Redis Hashes and JSON documents. FT.CREATE defines an index; FT.SEARCH queries it.',
    },
    {
      q: 'What does RedisJSON enable?',
      options: ['Storing Redis data as JSON files on disk', 'Native JSON document storage and manipulation using JSONPath queries without serialising/deserialising in the application', 'Exporting Redis data to JSON format', 'Converting JSON config to Redis commands'],
      answer: 1,
      explanation: 'RedisJSON adds a JSON data type with commands like JSON.SET, JSON.GET, JSON.ARRAPPEND. JSONPath (like JSON.GET key $.name) navigates the document. Documents are stored efficiently and can be indexed with RediSearch.',
    },
    {
      q: 'What is RESP3 and how does it differ from RESP2?',
      options: ['RESP3 is a binary protocol; RESP2 uses text', 'RESP3 adds richer data types (maps, sets, doubles, attributes) and server-push for out-of-band messages, reducing parsing overhead', 'RESP3 requires TLS; RESP2 does not', 'RESP3 is only for cluster connections'],
      answer: 1,
      explanation: 'RESP3 (Redis 6+) adds native map, set, double, and boolean types — clients receive typed data without parsing. It also supports client tracking (server pushes invalidation messages for client-side caching). RESP2 clients still work.',
    },
    {
      q: 'What does Redis TimeSeries provide over storing time series in sorted sets?',
      options: ['TimeSeries is stored on disk, sorted sets are in memory', 'TimeSeries has native downsampling, compaction rules, and range queries — much more efficient than sorted sets for large time-series', 'TimeSeries supports pub/sub; sorted sets do not', 'Both are equally efficient'],
      answer: 1,
      explanation: 'RedisTimeSeries: TS.ADD, TS.RANGE, TS.CREATERULE (automatic downsampling). Efficient for high-cardinality time-series data: aggregations (avg, sum, min, max), retention policies, and compression. Sorted sets require manual TTL and no built-in aggregation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does Redis Stack work with Redis Cluster?',
      a: 'Yes, but with constraints. RedisSearch indexes are per-node — in Cluster mode, each master indexes its own subset of data. FT.SEARCH queries one node. For cross-cluster search, you need redis-search with a coordinator (available in Redis Enterprise) or run all searchable keys on the same slot using hash tags. RedisJSON and RedisBloom work normally in Cluster (keys are still distributed by slot). For large-scale search, Redis Enterprise or a dedicated search service is often a better fit.',
    },
    {
      q: 'What is Redis Stack and how does it differ from open-source Redis?',
      a: 'Redis Stack bundles open-source Redis with modules: <strong>RedisJSON</strong> (native JSON), <strong>RediSearch</strong> (full-text search), <strong>RedisTimeSeries</strong> (time series), <strong>RedisBloom</strong> (probabilistic data structures). Available as redis-stack Docker image or via Redis Cloud. Enterprise features (clustering, ACL, TLS) still require Redis Enterprise or Redis Cloud.',
    },
    {
      q: 'How do you create a full-text search index with RediSearch?',
      a: '<code>FT.CREATE idx ON HASH PREFIX 1 product: SCHEMA title TEXT WEIGHT 5 price NUMERIC SORTABLE tags TAG</code>. Then search: <code>FT.SEARCH idx "@title:laptop @price:[0 1000]" SORTBY price ASC LIMIT 0 10</code>. Supports full-text, numeric ranges, tags, geo. FT.AGGREGATE for grouping and aggregations.',
    },
    {
      q: 'What is RedisBloom and when do you use it?',
      a: 'RedisBloom provides probabilistic data structures: <strong>Bloom filter</strong> (BF.ADD, BF.EXISTS) — fast membership testing with tunable false positive rate; <strong>Count-Min Sketch</strong> — frequency estimation; <strong>Top-K</strong> — top N most frequent items; <strong>HyperLogLog</strong> (built-in Redis). Use Bloom filters to prevent unnecessary DB lookups.',
    },
    {
      q: 'How do you store and query JSON in RedisJSON?',
      a: 'JSON.SET key path value sets a JSON document or sub-document. JSON.GET key path retrieves. Paths use JSONPath syntax: <code>JSON.GET user:1 $.name</code>. JSON.ARRAPPEND adds to arrays. JSON.NUMINCRBY increments numeric fields. Documents can be indexed with RediSearch FT.CREATE ON JSON SCHEMA.',
    },
    {
      q: 'What is client-side caching in Redis 6+ with RESP3?',
      a: 'Redis 6 supports server-assisted client-side caching: the server tracks which keys each client has cached and pushes invalidation messages when those keys change. Clients subscribe to invalidation channel with <code>CLIENT TRACKING on</code>. Requires RESP3 protocol. Smart clients cache values locally; Redis notifies them on change — eliminates network round trips for hot data.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Redis Stack extends core with RedisSearch (full-text + secondary indexes), RedisJSON (native JSON + JSONPath), RedisTimeSeries, and Bloom filters — all via standard Redis protocol.',
    mustKnow: [
      'FT.CREATE once; Redis auto-indexes existing and future matching keys',
      'JSON.SET stores native JSON — use JSONPath ($.field) for atomic partial updates',
      'FT.SEARCH supports TEXT, NUMERIC range, TAG, GEO, VECTOR field types',
      'BF.RESERVE before BF.ADD to set capacity + FPR — auto-create uses tiny defaults',
      'Bloom filter: BF.EXISTS = 0 → definitely absent; 1 → probably present (no false negatives)',
      'RedisSearch in Cluster is per-node — cross-cluster search requires Redis Enterprise',
    ],
    interviewFocus: [
      'How does RedisSearch compare to Elasticsearch for search use cases?',
      'When would you use RedisJSON vs storing serialised JSON in strings?',
      'What are Bloom filters and what guarantee does a "not found" result give?',
      'How does FT.AGGREGATE work and what can it replace?',
    ],
  };
}
