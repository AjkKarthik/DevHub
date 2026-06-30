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
  { name: 'RDBMS',        type: 'keyword', desc: 'Tables, schemas, joins, ACID. PostgreSQL, MySQL, SQLite, SQL Server.' },
  { name: 'Key-Value',    type: 'keyword', desc: 'Ultra-low latency lookups. Redis, DynamoDB, etcd. O(1) get/set.' },
  { name: 'Document',     type: 'keyword', desc: 'Nested JSON documents, flexible schema. MongoDB, Firestore, CouchDB.' },
  { name: 'Column',       type: 'keyword', desc: 'Wide-column for time-series, analytics. Cassandra, HBase, Bigtable.' },
  { name: 'Graph',        type: 'keyword', desc: 'Nodes + edges for relationship-heavy queries. Neo4j, Amazon Neptune.' },
  { name: 'ACID',         type: 'keyword', desc: 'Atomicity, Consistency, Isolation, Durability. Traditional SQL guarantee.' },
  { name: 'BASE',         type: 'keyword', desc: 'Basically Available, Soft state, Eventually consistent. Most NoSQL default.' },
  { name: 'Polyglot',     type: 'keyword', desc: 'Using multiple DB types in one system — each optimised for its access pattern.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'When to choose SQL',
    points: [
      'Complex queries: JOINs, aggregations, subqueries, window functions.',
      'Strong consistency required: financial ledgers, inventory, user auth.',
      'Relationships are complex and query patterns are not yet known.',
      'Transactions spanning multiple entities: order + inventory + payment.',
      'Examples: PostgreSQL for e-commerce, SQL Server for ERP, MySQL for WordPress.',
    ],
  },
  {
    heading: 'Key-value stores',
    points: [
      'Fastest lookup pattern: O(1) by primary key. No joins, no schema.',
      'Redis: in-memory; supports lists, sets, sorted sets, pub/sub, streams.',
      'DynamoDB: distributed KV + document; automatically scales to any throughput.',
      'Use for: session storage, rate limiting counters, leaderboards, feature flags.',
    ],
  },
  {
    heading: 'Document stores',
    points: [
      'Store entire entity as a JSON document. No fixed schema — fields vary per doc.',
      'Great for: product catalogs (varying attributes), user profiles, CMS content.',
      'MongoDB: ad-hoc queries, aggregation pipeline, secondary indexes.',
      'Avoid: when documents need to be joined frequently — embed or denormalise instead.',
    ],
  },
  {
    heading: 'Wide-column stores',
    points: [
      'Rows have a row key; columns are dynamic per row. Optimised for range scans by row key.',
      'Cassandra: partition key + clustering key; linearises writes to SSTable.',
      'Ideal for: time-series (IoT sensor readings), activity feeds, access logs.',
      'Schema design is query-driven: create a table for each access pattern.',
    ],
  },
  {
    heading: 'Decision framework',
    points: [
      'Start with the access pattern, not the technology: "I need to look up a user by ID" → KV.',
      '"I need to join orders with products with discounts" → SQL.',
      '"I need to store 50k metrics per second with time-range queries" → wide-column or InfluxDB.',
      '"Nodes and relationships are the domain" (social graph, fraud detection) → graph DB.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'DB Selection Guide',
    language: 'typescript',
    code: `// Database selection by access pattern

interface DBChoice {
  pattern: string;
  recommended: string;
  reason: string;
}

const guide: DBChoice[] = [
  {
    pattern: 'User by ID — single-key lookup, millions of reads/sec',
    recommended: 'Redis or DynamoDB',
    reason: 'O(1) key-value lookup; sub-millisecond latency at scale',
  },
  {
    pattern: 'E-commerce orders with joins to products, customers, discounts',
    recommended: 'PostgreSQL',
    reason: 'Complex joins, ACID transactions across multiple tables, flexible ad-hoc queries',
  },
  {
    pattern: 'Product catalog — 500 attributes, varies per category',
    recommended: 'MongoDB',
    reason: 'Flexible schema; embed variant attributes per document; aggregation pipeline for search',
  },
  {
    pattern: 'IoT sensor readings — 100k writes/sec, query by device + time range',
    recommended: 'Cassandra or TimescaleDB',
    reason: 'Cassandra: partition by device_id, cluster by timestamp → blazing time-range scans',
  },
  {
    pattern: 'Social graph — friends of friends within 3 hops',
    recommended: 'Neo4j',
    reason: 'Graph traversal in SQL requires expensive self-joins; native graph is O(depth) not O(N)',
  },
  {
    pattern: 'Leaderboard — top 100 users by score, updated in real-time',
    recommended: 'Redis ZSET (sorted set)',
    reason: 'ZADD, ZRANGE, ZRANK are O(log N). 1M members leaderboard: sub-ms updates',
  },
];`,
  },
  {
    label: 'Polyglot Persistence Example',
    language: 'typescript',
    code: `// A real system using multiple databases (polyglot persistence)
// E-commerce platform

// PostgreSQL — orders, payments, inventory (ACID required)
const order = await pg.query(\`
  BEGIN;
  INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id;
  UPDATE inventory SET stock = stock - 1 WHERE product_id = $3;
  COMMIT;
\`, [userId, total, productId]);

// Redis — session store, rate limiting, hot product cache
await redis.setEx(\`session:\${token}\`, 3600, JSON.stringify(user));
await redis.incr(\`rate:\${ip}:minute:\${minute}\`);
const product = await redis.get(\`product:\${productId}\`);

// Elasticsearch — full-text product search
const results = await es.search({
  index: 'products',
  query: { multi_match: { query: 'red sneakers size 10', fields: ['name', 'description', 'tags'] } }
});

// MongoDB — product catalog (varying attributes per category)
const shoes = await mongo.db('catalog').collection('products').findOne({ _id: productId });

// Cassandra — user activity log (high write, time-range query)
await cassandra.execute(
  'INSERT INTO activity_log (user_id, event_time, action) VALUES (?, ?, ?)',
  [userId, new Date(), 'purchase']
);`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Choosing NoSQL to avoid schema design',
    wrong: `// "Let's use MongoDB — no schema means we can move fast"
// Result: inconsistent field names, no validation, query nightmares`,
    right: `// Define a schema even with NoSQL (Mongoose, JSON Schema):
const userSchema = new Schema({ email: { type: String, required: true, unique: true } });
// Schema discipline enables indexing and predictable queries`,
    explanation: '"Schema-less" means the DB does not enforce schema — you still need one. Skipping schema design leads to inconsistent data that becomes impossible to query efficiently.',
  },
  {
    title: 'Using SQL for high-cardinality time-series at scale',
    wrong: `-- 1M rows/sec inserted into PostgreSQL metrics table
-- Table grows to 1B rows in 17 minutes
-- Range queries become full table scans`,
    right: `// Use TimescaleDB, Cassandra, or InfluxDB for time-series:
// Cassandra: partition by (device_id, day) → O(1) partition scan
// TimescaleDB: automatic hypertable chunks by time → parallel scans`,
    explanation: 'SQL databases without time-series partitioning degrade severely at high ingest rates. Specialised time-series stores automatically partition by time and compress efficiently.',
  },
  {
    title: 'Performing graph traversal in SQL',
    wrong: `-- Find friends-of-friends in SQL:
SELECT DISTINCT f2.friend_id
FROM friendships f1
JOIN friendships f2 ON f1.friend_id = f2.user_id
WHERE f1.user_id = 42;
-- 3 hops = 3 self-joins; O(N^3) complexity`,
    right: `// Use a graph DB for relationship queries:
// Neo4j Cypher:
// MATCH (u:User {id: 42})-[:FRIEND*2]->(fof) RETURN DISTINCT fof
// Graph traversal is O(depth), not O(N^3)`,
    explanation: 'Multi-hop graph traversal in SQL requires recursive CTEs or multiple self-joins that become exponentially expensive. Graph databases are purpose-built for this pattern.',
  },
  {
    title: 'Assuming NoSQL is always faster than SQL',
    wrong: `// "NoSQL is faster, so we should use it everywhere"`,
    right: `// PostgreSQL with proper indexes easily handles 100k QPS reads.
// Redis is faster for key lookups, but PostgreSQL with a connection
// pool and indexes is fast enough for most OLTP workloads.
// Choose based on access pattern, not raw speed claims.`,
    explanation: 'A well-indexed PostgreSQL instance easily outperforms a poorly-designed MongoDB collection. Performance depends on indexes, query design, and access patterns — not the DB label.',
  },
];

const challenge: Challenge = {
  title: 'Choose databases for a real-time ride-sharing app',
  language: 'typescript',
  description: `Design the database layer for a ride-sharing app (Uber-like).

Data entities and access patterns:
1. User profiles — read by ID, updated occasionally, OAuth tokens
2. Driver locations — updated every 5 seconds by 100k active drivers
3. Ride history — append-only, queried by user for last 12 months
4. Pricing rules — complex calculation with surge multipliers per zone
5. Trip matching — find available drivers within 2km of rider in real-time
6. Analytics — daily active riders, peak hours, revenue by city

Choose the best DB for each. Justify each choice.`,
  hints: [
    'Driver locations: high write rate, geo queries → consider Redis GEO or PostGIS',
    'Trip matching: geospatial + real-time → Redis GEO RADIUS or PostGIS',
    'Ride history: append-only, time-range → Cassandra or PostgreSQL with partitions',
    'Analytics: aggregations on large history → ClickHouse or BigQuery (OLAP)',
  ],
  starterCode: `interface DBChoice { entity: string; db: string; reason: string; }
const choices: DBChoice[] = [
  { entity: 'User profiles',      db: '', reason: '' },
  { entity: 'Driver locations',   db: '', reason: '' },
  { entity: 'Ride history',       db: '', reason: '' },
  { entity: 'Pricing rules',      db: '', reason: '' },
  { entity: 'Trip matching',      db: '', reason: '' },
  { entity: 'Analytics',          db: '', reason: '' },
];`,
  solution: `const choices = [
  { entity: 'User profiles',    db: 'PostgreSQL',  reason: 'Relational data, infrequent writes, ACID for auth state, complex queries on signup/billing' },
  { entity: 'Driver locations', db: 'Redis (GEO)', reason: '5s updates × 100k drivers = 20k writes/sec; Redis GEOADD/GEORADIUS is O(N+log M) for proximity search; data is ephemeral' },
  { entity: 'Ride history',     db: 'Cassandra',   reason: 'Append-only, high write rate, query by (user_id, created_at) range; partition by user_id, cluster by timestamp' },
  { entity: 'Pricing rules',    db: 'PostgreSQL',  reason: 'Complex conditional logic (surge zones, time-of-day); SQL is expressive for rule engines; cached in Redis for hot path' },
  { entity: 'Trip matching',    db: 'Redis GEO',   reason: 'GEORADIUS returns drivers within 2km in O(N+log M); real-time, ephemeral; falls back to PostGIS for complex geo shapes' },
  { entity: 'Analytics',        db: 'ClickHouse or BigQuery', reason: 'Columnar OLAP; aggregate 1B+ rides by city/hour efficiently; not suitable for OLTP; ETL nightly from Cassandra' },
];`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which database type is best for "find all friends of friends within 3 hops"?',
    options: ['SQL with recursive CTE', 'Document store', 'Graph database', 'Wide-column store'],
    answer: 2,
    explanation: 'Graph databases (Neo4j, Neptune) traverse relationships natively in O(depth). SQL requires exponentially expensive self-joins. Graph is the right tool for relationship-traversal queries.',
  },
  {
    q: 'A product catalog needs to store 500 different attributes that vary per category (shoes have size, electronics have voltage). Which DB fits best?',
    options: ['PostgreSQL (with nullable columns)', 'Redis', 'MongoDB', 'Cassandra'],
    answer: 2,
    explanation: 'MongoDB\'s flexible document model handles arbitrary attributes per category without schema migration. Postgres would need 500 nullable columns or EAV tables. Redis has no query capability. Cassandra is column-per-key not attribute-per-entity.',
  },
  {
    q: 'ACID properties guarantee which of the following?',
    options: ['High availability', 'Horizontal scalability', 'Each transaction is atomic and durable even on crash', 'Low latency'],
    answer: 2,
    explanation: 'ACID: Atomicity (all-or-nothing), Consistency (constraints maintained), Isolation (concurrent transactions don\'t interfere), Durability (committed data survives crashes). Not related to availability or scale.',
  },
  { q: 'What properties does the ACID acronym describe in relational databases?', options: ['Availability, Consistency, Integrity, Durability', 'Atomicity, Consistency, Isolation, Durability', 'Atomicity, Concurrency, Integrity, Distribution', 'Availability, Correctness, Isolation, Data-retention'], answer: 1, explanation: 'ACID properties: Atomicity means all operations in a transaction succeed or all fail together with no partial commits. Consistency means a transaction can only bring the database from one valid state to another, respecting all constraints. Isolation means concurrent transactions execute as if they were serial; intermediate states are not visible to other transactions. Durability means committed transactions survive system failures. These properties are what make relational databases suitable for financial systems, inventory management, and other scenarios where data integrity is critical.' },
  { q: 'What types of NoSQL databases exist and what are their primary use cases?', options: ['NoSQL databases are all equivalent; the category refers only to lack of SQL syntax', 'Key-value stores for session/cache data; document stores for flexible JSON data; column-family for time-series; graph databases for relationship traversal', 'NoSQL databases are only for unstructured data like images and binary files', 'NoSQL databases exist only for horizontal scaling and have no other advantages over SQL'], answer: 1, explanation: 'NoSQL categories: Key-value stores (Redis, DynamoDB) provide O(1) lookup by key, ideal for caching, sessions, and leaderboards. Document stores (MongoDB, Firestore) store JSON-like documents with flexible schema, ideal for content management and user profiles. Column-family stores (Cassandra, HBase) organize data by column families, optimized for wide-row access patterns and time-series. Graph databases (Neo4j, Amazon Neptune) store relationships explicitly, enabling efficient multi-hop traversals for social networks and knowledge graphs.' },
  { q: 'When would you choose MongoDB over PostgreSQL for a new application?', options: ['Always choose MongoDB because it scales better than PostgreSQL', 'Choose MongoDB when document structure varies significantly per record and you expect frequent schema changes without migration overhead', 'MongoDB is always faster than PostgreSQL for all query types', 'Choose MongoDB when you need ACID transactions across multiple collections'], answer: 1, explanation: 'MongoDB is appropriate when: data is naturally document-shaped with varying fields per document (product catalogs with different attributes per category), schema evolves rapidly and you want to avoid migration scripts, you read entire documents together (not join-heavy across collections), and you need horizontal scaling of document storage. PostgreSQL is better when: you need ACID transactions across multiple entities, data is highly relational, you need complex queries with joins, or you require strong consistency guarantees. PostgreSQL JSONB columns can store flexible schema data with indexing, often eliminating the need for MongoDB for moderately flexible schemas.' },
];

const qna: QnaItem[] = [
  {
    q: 'Can NoSQL databases support ACID transactions?',
    a: 'Some do: MongoDB supports multi-document ACID transactions since v4.0; DynamoDB has transactions (TransactWriteItems). However, distributed ACID is expensive — latency increases with each participant. Most NoSQL systems are used with eventual consistency because it\'s faster. Use ACID in NoSQL only when truly necessary.',
  },
  {
    q: 'Is it ever OK to use a single database for everything?',
    a: 'Absolutely — for most applications, PostgreSQL handles OLTP, full-text search (pg_trgm, tsvector), JSON (jsonb), time-series (TimescaleDB extension), and geospatial (PostGIS) reasonably well. Only introduce additional databases when you hit genuine bottlenecks that a single DB cannot solve.',
  },
  { q: 'What is schema-on-write vs schema-on-read and when does each apply?', a: 'Schema-on-write: data must conform to a predefined schema at write time. Relational databases enforce this via column types, NOT NULL constraints, and foreign keys. Errors are caught before data enters the database, keeping it clean. Changing the schema requires migrations. Schema-on-read: data is stored without enforcement and the schema is applied when reading. NoSQL document stores like MongoDB and data lakes allow storing any shape of data and interpreting it at query time. Schema-on-read is flexible for evolving data but moves validation responsibility to the application layer and makes queries harder to reason about when data shapes vary. Modern practice: use schema-on-write for structured operational data and schema-on-read for exploratory analytics on raw data.' },
  { q: 'How does DynamoDB achieve its scalability guarantees?', a: 'DynamoDB partitions data across many servers using consistent hashing on the partition key. Each partition is a small, independent unit (up to 10 GB, up to 3000 RCU and 1000 WCU). Reads and writes to different partitions proceed concurrently without coordination. The single-digit millisecond latency guarantee comes from the architecture: all reads and writes go to in-memory B-tree structures with WAL writes for durability, avoiding slow disk seeks. Scaling is automatic: DynamoDB splits hot partitions transparently. The constraint is that all requests for a single partition key go to the same partition, so choosing a high-cardinality partition key is critical to avoid hot partitions.' },
  { q: 'How do you decide between a relational and a NoSQL database in a system design interview?', a: 'Consider these dimensions: data structure (tabular and relational = SQL; document or hierarchical = NoSQL), consistency requirement (financial transactions need ACID = SQL; social activity can be eventually consistent = NoSQL), query patterns (complex joins and aggregations = SQL; simple key lookups or document reads = NoSQL), scale (single region moderate scale = SQL handles it; massive horizontal scale = NoSQL), and schema stability (stable, well-known schema = SQL; rapidly evolving schema = NoSQL). Most real systems use both: a relational DB for transactional data and a NoSQL store for high-volume reads or caching. Name specific databases: PostgreSQL for OLTP, DynamoDB for key-value at scale, Cassandra for time-series, MongoDB for flexible documents.' },
  { q: 'What is NewSQL and how does it differ from both SQL and NoSQL?', a: 'NewSQL databases attempt to provide the scalability of NoSQL with the ACID guarantees of traditional SQL. Examples: CockroachDB, Google Spanner, and TiDB are distributed relational databases that support SQL and ACID transactions while scaling horizontally across nodes and regions. They achieve this through distributed consensus protocols like Raft or Paxos for transaction coordination and distributed storage engines. Spanner uses TrueTime (GPS and atomic clocks) to provide globally ordered timestamps without distributed locking. The tradeoff: NewSQL databases have higher write latency than NoSQL due to consensus overhead, and they are operationally more complex than both traditional SQL and NoSQL. Use when you genuinely need both ACID guarantees and horizontal write scaling.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Choose DB by access pattern: SQL for joins/ACID; KV for O(1) lookups; Document for flexible schema; Column for time-series; Graph for traversal.',
  mustKnow: [
    'SQL: complex queries, joins, ACID transactions (PostgreSQL, MySQL)',
    'Key-value: O(1) lookups, sessions, rate limiting (Redis, DynamoDB)',
    'Document: flexible schema, nested data (MongoDB, Firestore)',
    'Wide-column: time-series, high write rate (Cassandra, HBase)',
    'Graph: multi-hop relationship traversal (Neo4j, Neptune)',
    'Polyglot: use multiple DBs each optimised for its pattern',
  ],
  interviewFocus: [
    'Always justify DB choice by access pattern — not popularity',
    'Mention ACID when strong consistency is needed (payments, inventory)',
    'Polyglot persistence: different DB for different parts of the system',
    'SQL is not "slow" — proper indexing handles most OLTP workloads',
  ],
};

@Component({
  selector: 'app-sysdesign-sql-vs-nosql',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sql-vs-nosql.html',
  styleUrl: './sql-vs-nosql.scss',
})
export class SysdesignSqlVsNosql {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
