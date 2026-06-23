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
  { name: 'B-tree index',     type: 'keyword', desc: 'Balanced tree; O(log N) lookup; optimal for range queries and ORDER BY.' },
  { name: 'LSM-tree',         type: 'keyword', desc: 'Log-Structured Merge; write-optimised; used by Cassandra, RocksDB, LevelDB.' },
  { name: 'Hash index',       type: 'keyword', desc: 'O(1) point lookups; cannot do range queries. InnoDB adaptive hash, Redis.' },
  { name: 'Composite index',  type: 'keyword', desc: 'Multi-column index. Order matters: prefix must be included in query.' },
  { name: 'Covering index',   type: 'keyword', desc: 'Index contains all columns the query needs — no table heap fetch required.' },
  { name: 'Selectivity',      type: 'keyword', desc: 'High cardinality = high selectivity = most useful for indexing.' },
  { name: 'Index scan',       type: 'keyword', desc: 'DB uses index to find rows. Index seek (single row) vs index range scan.' },
  { name: 'EXPLAIN',          type: 'keyword', desc: 'Shows query execution plan. Look for Seq Scan on large tables — needs an index.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'B-tree (default index)',
    points: [
      'Sorted, balanced tree. Leaf pages hold row references; internal nodes hold keys for navigation.',
      'O(log N) lookup, insertion, deletion. Depth is bounded (typically 3-4 levels for millions of rows).',
      'Optimal for: equality (=), range (BETWEEN, >, <), ORDER BY on indexed column, prefix matches.',
      'PostgreSQL, MySQL InnoDB, SQL Server all default to B-tree.',
    ],
  },
  {
    heading: 'LSM-tree (write-optimised)',
    points: [
      'Writes go to an in-memory memtable (sorted); periodically flushed to disk as SSTables.',
      'Background compaction merges SSTables to remove stale values.',
      'Pros: sequential writes → extremely high write throughput (100k+ writes/sec on SSD).',
      'Cons: reads may need to check multiple SSTables (bloom filters help); compaction adds I/O.',
      'Used by: Cassandra, RocksDB, LevelDB, HBase, InfluxDB.',
    ],
  },
  {
    heading: 'Composite indexes',
    points: [
      'Index on (a, b, c) can answer queries filtering on: a; a,b; a,b,c — but NOT b alone or c alone.',
      'Column order rule: put equality columns first, range column last.',
      'Example: WHERE user_id = ? AND created_at BETWEEN ? AND ? → INDEX ON (user_id, created_at).',
      'Covering index: add SELECT columns to the index — avoids a second lookup to the heap.',
    ],
  },
  {
    heading: 'Query optimisation workflow',
    points: [
      'Step 1: run EXPLAIN (ANALYZE) to see the execution plan.',
      'Step 2: identify Seq Scan on large tables (> 10k rows) without WHEREclause selectivity.',
      'Step 3: add index on the high-selectivity column(s) used in WHERE / JOIN / ORDER BY.',
      'Step 4: check for index bloat (DELETE-heavy tables) — REINDEX or use partial indexes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Index Strategies',
    language: 'bash',
    code: `-- PostgreSQL index patterns

-- 1. Standard B-tree (equality + range)
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);
-- Covers: WHERE user_id = 42 ORDER BY created_at DESC

-- 2. Covering index (include non-key columns to avoid heap fetch)
CREATE INDEX idx_orders_covering ON orders (user_id, created_at DESC)
  INCLUDE (status, total_amount);
-- SELECT status, total_amount WHERE user_id=? → index-only scan

-- 3. Partial index (only index rows matching a condition)
CREATE INDEX idx_orders_pending ON orders (created_at)
  WHERE status = 'pending';
-- Much smaller index; perfect for "find old pending orders" job

-- 4. GIN index for full-text search
CREATE INDEX idx_products_fts ON products USING GIN (to_tsvector('english', description));
-- SELECT * FROM products WHERE to_tsvector(...) @@ to_tsquery('laptop & ssd')

-- 5. Expression index
CREATE INDEX idx_email_lower ON users (LOWER(email));
-- Enables: WHERE LOWER(email) = 'test@example.com'  (case-insensitive lookup)

-- Check index usage:
SELECT indexname, idx_scan, idx_tup_read FROM pg_stat_user_indexes
WHERE relname = 'orders' ORDER BY idx_scan DESC;`,
  },
  {
    label: 'EXPLAIN ANALYZE',
    language: 'bash',
    code: `-- Interpreting PostgreSQL EXPLAIN ANALYZE

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 42 AND status = 'pending'
ORDER BY created_at DESC LIMIT 20;

-- BAD plan (no index):
-- Seq Scan on orders  (cost=0.00..85432.00 rows=1000000)
--   Filter: ((user_id = 42) AND (status = 'pending'))
--   Rows Removed by Filter: 999980
-- Execution Time: 2340ms

-- GOOD plan (with index on user_id, status):
-- Index Scan using idx_orders_user_status on orders
--   Index Cond: ((user_id = 42) AND (status = 'pending'))
-- Execution Time: 0.8ms

-- Key terms to spot:
-- "Seq Scan" on large table → missing index
-- "cost=high" → expensive before filtering
-- "Rows Removed by Filter: N" → low selectivity
-- "Buffers: shared hit=X, read=Y" → read=Y means disk I/O (cache miss)`,
  },
  {
    label: 'Index Anti-patterns',
    language: 'bash',
    code: `-- Index anti-patterns that kill performance

-- 1. Function wrapping prevents index use
-- BAD (no index on YEAR(created_at)):
SELECT * FROM orders WHERE YEAR(created_at) = 2024;
-- GOOD (range query uses index):
SELECT * FROM orders WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';

-- 2. Leading wildcard prevents index use
-- BAD:
SELECT * FROM products WHERE name LIKE '%laptop%';
-- GOOD (use full-text search):
SELECT * FROM products WHERE to_tsvector('english', name) @@ plainto_tsquery('laptop');

-- 3. Implicit type cast disables index
-- BAD (user_id is INT, but we query with string):
SELECT * FROM orders WHERE user_id = '42';  -- cast prevents index seek
-- GOOD:
SELECT * FROM orders WHERE user_id = 42;

-- 4. OR across different columns (union of index scans needed)
-- BAD (may cause full table scan):
SELECT * FROM events WHERE user_id = 42 OR session_id = 'abc';
-- GOOD:
(SELECT * FROM events WHERE user_id = 42)
UNION ALL
(SELECT * FROM events WHERE session_id = 'abc');`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Indexing low-selectivity columns',
    wrong: `CREATE INDEX idx_orders_status ON orders (status);
-- status has only 3 values: pending, completed, cancelled
-- 33% of rows per value → index not useful`,
    right: `-- Index high-cardinality columns:
CREATE INDEX idx_orders_user_id ON orders (user_id);
-- user_id has millions of distinct values → high selectivity
-- Composite: (user_id, status) is even better for filtered queries`,
    explanation: 'A low-selectivity index (gender, boolean, status) returns too many rows — the DB may choose a seq scan instead. Selectivity = distinct_values / total_rows. Index columns with selectivity > 0.1.',
  },
  {
    title: 'Over-indexing write-heavy tables',
    wrong: `-- events table with 8 indexes (all columns covered)
-- INSERT INTO events: updates 8 index trees
-- 100k inserts/sec × 8 indexes = 800k index writes/sec`,
    right: `-- Keep index count minimal for write-heavy tables:
-- 1 primary key + 1-2 query indexes maximum
-- Defer analytics indexes to a read replica`,
    explanation: 'Every index on a table adds overhead to every INSERT, UPDATE, DELETE. A table with 8 indexes can have 3-5× slower writes than with 2. Audit and drop unused indexes regularly.',
  },
  {
    title: 'Missing index on foreign key columns',
    wrong: `-- orders.user_id is a FK but has no index
-- JOIN users ON orders.user_id = users.id
-- → full orders table scan for each user in join`,
    right: `CREATE INDEX idx_orders_user_id ON orders (user_id);
-- FK columns are almost always joined or filtered — always index them`,
    explanation: 'Foreign key columns are JOIN targets. Without an index, every join requires a sequential scan of the child table. MySQL warns about this; PostgreSQL does not — create FK indexes manually.',
  },
  {
    title: 'Incorrect composite index column order',
    wrong: `-- Query: WHERE status = ? AND user_id = ?
CREATE INDEX idx ON orders (status, user_id);
-- Terrible: status has 3 values; leading column has low selectivity`,
    right: `-- Put high-selectivity column first:
CREATE INDEX idx ON orders (user_id, status);
-- user_id narrows to 1 user's rows; status further filters`,
    explanation: 'The leading column of a composite index must be the most selective. The DB narrows the search using left-prefix, so put equality + high-cardinality columns first.',
  },
];

const challenge: Challenge = {
  title: 'Optimise a slow order history query',
  language: 'typescript',
  description: `A query takes 3 seconds on the orders table (50M rows):

SELECT o.id, o.total, o.status, u.email
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status = 'pending'
  AND o.created_at > NOW() - INTERVAL '7 days'
ORDER BY o.created_at DESC
LIMIT 50;

Current indexes: PRIMARY KEY (id), INDEX (user_id)

Tasks:
1. Identify the bottleneck
2. Design the optimal index
3. Can you make it an index-only scan?
4. What does EXPLAIN show before vs after?`,
  hints: [
    'status + created_at are both in WHERE — composite index needed',
    'created_at DESC is in ORDER BY — index should be DESC on that column',
    'Include u.email in the index to avoid the JOIN heap fetch (covering)',
    'Partial index on status=\'pending\' makes it much smaller',
  ],
  starterCode: `-- Current slow query:
-- Seq Scan on orders (50M rows)
-- Filter: status = 'pending' AND created_at > NOW() - 7 days
-- Sort: created_at DESC
-- Execution time: 3200ms

-- What index(es) would you create?
-- CREATE INDEX ...

-- Optional: rewrite the query?`,
  solution: `-- OPTIMAL INDEX: composite + partial + covering

-- Option A: composite index (most compatible)
CREATE INDEX idx_orders_pending_recent ON orders (status, created_at DESC)
  INCLUDE (id, total, user_id);
-- After: Index Scan → 50 rows → Execution: 0.4ms

-- Option B: partial index (smallest, fastest for this query)
CREATE INDEX idx_orders_pending_date ON orders (created_at DESC)
  WHERE status = 'pending';
-- Even smaller — only indexes pending orders (maybe 2% of table)
-- After: Index Scan (partial) → 0.2ms

-- For the JOIN on users.email:
-- users.id is PK → already indexed; JOIN is fast
-- To make it index-only on orders side:
CREATE INDEX idx_orders_pending_covering ON orders (status, created_at DESC)
  INCLUDE (id, total, user_id)
  WHERE status = 'pending';

-- EXPLAIN ANALYZE before:
-- Seq Scan on orders  (cost=0..2.1M, Execution: 3200ms)
-- EXPLAIN ANALYZE after:
-- Index Scan using idx_orders_pending_date (cost=0..1.2, Execution: 0.2ms)`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which index type is most efficient for time-range queries like WHERE created_at BETWEEN ? AND ??',
    options: ['Hash index', 'GIN index', 'B-tree index', 'Bitmap index'],
    answer: 2,
    explanation: 'B-tree indexes are sorted, so range queries traverse a contiguous range of leaf nodes — O(log N + K) where K is the number of results. Hash indexes only support equality; they cannot do range scans.',
  },
  {
    q: 'A composite index (a, b, c) can satisfy which query?',
    options: ['WHERE b = 1 AND c = 2', 'WHERE a = 1 AND c = 2', 'WHERE a = 1 AND b = 2', 'WHERE c = 3'],
    answer: 2,
    explanation: 'Composite index left-prefix rule: queries must include a leading prefix. (a,b,c) satisfies: a; a,b; a,b,c. It does NOT satisfy b alone, c alone, or b+c without a.',
  },
  {
    q: 'LSM-tree is preferred over B-tree when?',
    options: ['Read throughput is more important than write throughput', 'Range queries dominate the workload', 'Write throughput is extremely high (100k+ writes/sec)', 'The data fits in memory'],
    answer: 2,
    explanation: 'LSM-trees batch writes to memory and flush sequentially — write throughput is much higher than B-tree (which requires in-place page updates). Cassandra, RocksDB use LSM for exactly this reason.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use a covering index?',
    a: 'Use a covering index when a hot query selects a small number of columns (total, status, created_at) from a large table. Include those columns in the index using INCLUDE (PostgreSQL) or as extra index columns (MySQL). The query becomes an "index-only scan" — no heap fetch needed, 5-10× faster for small result sets.',
  },
  {
    q: 'How do I find unused indexes in PostgreSQL?',
    a: 'Query pg_stat_user_indexes: SELECT indexname, idx_scan FROM pg_stat_user_indexes WHERE relname = \'your_table\' ORDER BY idx_scan ASC. Indexes with idx_scan = 0 since last pg_stat_reset have never been used. Drop them — they slow down writes with zero read benefit.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'B-tree default for range queries; LSM for write-heavy; composite index left-prefix rule; EXPLAIN to find seq scans.',
  mustKnow: [
    'B-tree: O(log N), sorted, range + equality + ORDER BY',
    'LSM-tree: write-optimised (Cassandra, RocksDB); reads check multiple SSTables',
    'Hash index: O(1) equality only — no range queries',
    'Composite (a,b,c): must include left prefix; equality cols first, range col last',
    'Covering index: INCLUDE extra cols — avoids heap fetch',
    'Low selectivity columns (status, boolean) make poor indexes',
  ],
  interviewFocus: [
    'Use EXPLAIN to identify missing indexes in a slow query scenario',
    'Composite index column order: equality first, range last, high selectivity first',
    'Mention write overhead of over-indexing on write-heavy tables',
    'Partial index for filtered queries (status=\'pending\') — much smaller',
  ],
};

@Component({
  selector: 'app-sysdesign-indexes',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './indexes.html',
  styleUrl: './indexes.scss',
})
export class SysdesignIndexes {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
