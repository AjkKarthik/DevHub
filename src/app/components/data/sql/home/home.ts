import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface SqlTopic {
  title: string;
  description: string;
  route: string;
  badge: string;
  available: boolean;
  keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations':       'foundations',
  'Core SQL':          'core',
  'Functions':         'functions',
  'Advanced Queries':  'advanced',
  'Schema & Objects':  'schema',
  'Programmatic':      'programmatic',
  'Transactions':      'transactions',
  'Performance':       'performance',
  'Advanced Features': 'features',
  'Reference':         'reference',
};

const GROUP_ORDER = [
  'All', 'Foundations', 'Core SQL', 'Functions', 'Advanced Queries',
  'Schema & Objects', 'Programmatic', 'Transactions', 'Performance',
  'Advanced Features', 'Reference',
];

const ALL_TOPICS: SqlTopic[] = [

  // ── Foundations ─────────────────────────────────────────────────────────────
  { title: 'RDBMS Concepts',           route: '/sql/rdbms-concepts',        badge: 'Foundations', available: true,
    description: 'The relational model — entities, relationships, tables, primary/foreign keys, integrity constraints, and why SQL exists.',
    keyPoints: ['Codd\'s 12 rules and the relational model', 'Tables, rows, columns — the relation as a set', 'Primary key, foreign key, and referential integrity'] },

  { title: 'Data Modeling',            route: '/sql/data-modeling',         badge: 'Foundations', available: true,
    description: 'Entity-Relationship diagrams, cardinality (1:1 / 1:N / M:N), crow\'s foot notation, and translating diagrams to tables.',
    keyPoints: ['Entities, attributes, and relationships', 'Cardinality and participation constraints', 'Mapping ER diagrams to physical table schemas'] },

  { title: 'Normalization',            route: '/sql/normalization',         badge: 'Foundations', available: true,
    description: '1NF through 3NF and BCNF — eliminate anomalies, understand functional dependencies, and know when to denormalise.',
    keyPoints: ['1NF: atomic values, no repeating groups', '2NF/3NF: remove partial and transitive dependencies', 'BCNF and when denormalisation is the right choice'] },

  { title: 'Database Architecture',    route: '/sql/db-architecture',       badge: 'Foundations', available: true,
    description: 'Storage pages, buffer pool, write-ahead logging, MVCC — how MSSQL and PostgreSQL physically store and recover data.',
    keyPoints: ['8 KB pages (MSSQL) and 8 KB blocks (PostgreSQL)', 'Buffer pool: the in-memory page cache', 'WAL/transaction log ensures durability; MVCC enables readers not to block writers'] },

  { title: 'Data Types',               route: '/sql/data-types',            badge: 'Foundations', available: true,
    description: 'Integer, decimal, string, date, boolean, and binary types — MSSQL vs PostgreSQL names, storage sizes, and when to use each.',
    keyPoints: ['NVARCHAR vs VARCHAR (MSSQL) vs text/varchar (PostgreSQL)', 'DATETIME2 vs TIMESTAMPTZ — always store UTC', 'DECIMAL/NUMERIC for money; never FLOAT'] },

  // ── Core SQL ─────────────────────────────────────────────────────────────────
  { title: 'SQL Basics',               route: '/sql/basics',                badge: 'Core SQL', available: true,
    description: 'SELECT, FROM, WHERE, ORDER BY, DISTINCT — with both dialects: LIMIT (PostgreSQL) vs TOP/OFFSET FETCH (MSSQL).',
    keyPoints: ['Filtering with WHERE, IN, BETWEEN, LIKE / ILIKE', 'NULL semantics: IS NULL / IS NOT NULL', 'LIMIT (PG) vs TOP / OFFSET…FETCH (MSSQL)'] },

  { title: 'Joins',                    route: '/sql/joins',                 badge: 'Core SQL', available: true,
    description: 'INNER, LEFT, RIGHT, FULL OUTER, CROSS joins, self-joins, and the lateral/apply join pattern — both dialects.',
    keyPoints: ['LEFT JOIN returns all left-table rows — NULLs where no match', 'CROSS APPLY (MSSQL) ≈ LATERAL (PostgreSQL)', 'Self-join aliases the same table twice for parent-child queries'] },

  { title: 'Aggregations',             route: '/sql/aggregations',          badge: 'Core SQL', available: true,
    description: 'GROUP BY, HAVING, COUNT/SUM/AVG/MIN/MAX, ROLLUP, CUBE, GROUPING SETS — with dialect differences.',
    keyPoints: ['Every non-aggregate SELECT column must be in GROUP BY', 'HAVING filters after aggregation; WHERE before', 'ROLLUP adds subtotals; CUBE adds all combinations'] },

  { title: 'Set Operations',           route: '/sql/set-operations',        badge: 'Core SQL', available: true,
    description: 'UNION, UNION ALL, INTERSECT, EXCEPT (MSSQL) / EXCEPT (PostgreSQL) — combining and comparing result sets.',
    keyPoints: ['UNION deduplicates; UNION ALL is faster and preserves duplicates', 'Column count and types must match across all branches', 'EXCEPT (MSSQL/PG) ≡ MINUS (Oracle)'] },

  { title: 'NULL Handling',            route: '/sql/null-handling',         badge: 'Core SQL', available: true,
    description: 'Three-valued logic, IS NULL / IS NOT NULL, COALESCE, NULLIF, ISNULL (MSSQL) vs COALESCE (both), NULL in aggregates and joins.',
    keyPoints: ['NULL propagates through arithmetic and comparisons', 'COALESCE returns first non-NULL; works in both dialects', 'NOT IN with a NULL in the list always returns empty — use NOT EXISTS'] },

  { title: 'MERGE / Upsert',           route: '/sql/merge',                 badge: 'Core SQL', available: true,
    description: 'MERGE statement (MSSQL) vs INSERT … ON CONFLICT (PostgreSQL) — atomic upsert, delete-on-mismatch, and output clauses.',
    keyPoints: ['MERGE matches source to target and applies WHEN MATCHED/NOT MATCHED actions', 'PostgreSQL ON CONFLICT DO UPDATE SET = upsert shorthand', 'OUTPUT clause captures inserted/updated rows without a second query'] },

  // ── Functions & Expressions ──────────────────────────────────────────────────
  { title: 'String Functions',         route: '/sql/string-functions',      badge: 'Functions', available: true,
    description: 'CONCAT, SUBSTRING/SUBSTR, TRIM, UPPER/LOWER, REPLACE, CHARINDEX vs POSITION, PATINDEX vs regexp_match.',
    keyPoints: ['SUBSTRING(str, start, len) (MSSQL) vs SUBSTR (PG both work)', 'ILIKE for case-insensitive LIKE in PostgreSQL', 'PATINDEX (MSSQL) vs REGEXP_MATCH / ~ operator (PostgreSQL)'] },

  { title: 'Date & Time Functions',    route: '/sql/date-functions',        badge: 'Functions', available: true,
    description: 'DATEADD/date_trunc, DATEDIFF/AGE, FORMAT/TO_CHAR, GETDATE()/NOW() — and timezone-aware timestamp handling.',
    keyPoints: ['DATEADD(day,7,d) (MSSQL) vs d + INTERVAL \'7 days\' (PostgreSQL)', 'DATEDIFF (MSSQL) vs AGE() / EXTRACT (PostgreSQL)', 'Always store timestamps in UTC; use TIMESTAMPTZ in PostgreSQL'] },

  { title: 'Conditional Expressions',  route: '/sql/conditional-expressions', badge: 'Functions', available: true,
    description: 'CASE WHEN/THEN/ELSE, searched vs simple CASE, IIF (MSSQL), NULLIF, GREATEST/LEAST (PostgreSQL), CHOOSE (MSSQL).',
    keyPoints: ['CASE is the standard — works in SELECT, WHERE, ORDER BY, and aggregates', 'IIF(cond, t, f) is MSSQL shorthand for a two-branch CASE', 'NULLIF(a,b) returns NULL when a=b — useful for avoiding division by zero'] },

  { title: 'Math & Numeric Functions', route: '/sql/math-functions',        badge: 'Functions', available: true,
    description: 'ROUND, FLOOR, CEILING, ABS, POWER, SQRT, LOG — and the key differences between integer division in T-SQL and PostgreSQL.',
    keyPoints: ['Integer division in T-SQL: 5/2 = 2; cast to DECIMAL first', 'ROUND(n, -2) rounds to nearest hundred', 'CHECKSUM / MD5 for lightweight hash-based deduplication'] },

  // ── Advanced Queries ─────────────────────────────────────────────────────────
  { title: 'Subqueries & APPLY',       route: '/sql/subqueries',            badge: 'Advanced Queries', available: true,
    description: 'Scalar, correlated, and derived-table subqueries, EXISTS/IN, and CROSS/OUTER APPLY (MSSQL) vs LATERAL (PostgreSQL).',
    keyPoints: ['EXISTS short-circuits; NOT EXISTS is NULL-safe unlike NOT IN', 'Correlated subqueries re-run per outer row — can be expensive', 'CROSS APPLY (MSSQL) / LATERAL (PG) expose TVF results as derived tables'] },

  { title: 'CTEs & Recursive',         route: '/sql/ctes',                  badge: 'Advanced Queries', available: true,
    description: 'WITH clause, multi-step CTEs, recursive CTEs for hierarchies — and materialization control in PostgreSQL.',
    keyPoints: ['MSSQL inlines CTEs by default; PostgreSQL materialises (add NOT MATERIALIZED)', 'Recursive CTE: anchor UNION ALL recursive member', 'CTEs can precede UPDATE/DELETE/MERGE — not just SELECT'] },

  { title: 'Window Functions',         route: '/sql/window-functions',      badge: 'Advanced Queries', available: true,
    description: 'ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD, FIRST/LAST VALUE, running totals — OVER/PARTITION BY/frame clauses.',
    keyPoints: ['OVER() defines the window; PARTITION BY resets it per group', 'ROWS UNBOUNDED PRECEDING for running totals', 'FILTER clause in PostgreSQL: SUM(x) FILTER (WHERE …)'] },

  { title: 'Pivoting & CROSSTAB',      route: '/sql/pivoting',              badge: 'Advanced Queries', available: true,
    description: 'PIVOT/UNPIVOT (MSSQL), crosstab() with tablefunc (PostgreSQL), and the portable CASE-based pivot.',
    keyPoints: ['PIVOT in MSSQL uses aggregate + FOR … IN list', 'PostgreSQL uses crosstab() from the tablefunc extension', 'CASE-based manual pivot works in both dialects with no extensions'] },

  // ── Schema & Objects ─────────────────────────────────────────────────────────
  { title: 'Schema Design',            route: '/sql/schema-design',         badge: 'Schema & Objects', available: true,
    description: 'Practical schema design — surrogate vs natural keys, naming conventions, schemas as namespaces (both dialects).',
    keyPoints: ['Surrogate INT/BIGINT PKs with UNIQUE constraint on natural keys', 'Use schemas (dbo / public) to organise objects', 'Narrow rows, correct types, and FK indexes reduce fragmentation'] },

  { title: 'Constraints',              route: '/sql/constraints',           badge: 'Schema & Objects', available: true,
    description: 'PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, DEFAULT, NOT NULL — inline vs out-of-line, deferrable (PostgreSQL), partial (PostgreSQL).',
    keyPoints: ['CHECK constraints validate domain rules at the DB layer', 'DEFERRABLE INITIALLY DEFERRED FK (PostgreSQL) allows batch inserts', 'Partial unique index in PostgreSQL: UNIQUE WHERE deleted_at IS NULL'] },

  { title: 'Views & Materialized Views', route: '/sql/views',               badge: 'Schema & Objects', available: true,
    description: 'Regular views, indexed views (MSSQL), materialized views (PostgreSQL) — creation, refresh, and query rewrite.',
    keyPoints: ['Regular views are query macros — no stored data', 'MSSQL indexed views store data when WITH SCHEMABINDING + UNIQUE CLUSTERED INDEX', 'PostgreSQL MATERIALIZED VIEW: REFRESH MATERIALIZED VIEW CONCURRENTLY'] },

  { title: 'Sequences & Identity',     route: '/sql/sequences',             badge: 'Schema & Objects', available: true,
    description: 'IDENTITY(1,1) (MSSQL) vs SERIAL/BIGSERIAL/GENERATED ALWAYS AS IDENTITY (PostgreSQL) — and standalone SEQUENCE objects.',
    keyPoints: ['IDENTITY in MSSQL; GENERATED ALWAYS AS IDENTITY is ANSI SQL', 'SEQUENCE objects can be shared across tables', 'Use BIGINT or BIGSERIAL for high-volume tables to avoid overflow'] },

  { title: 'Temp Tables & Table Variables', route: '/sql/temp-tables',      badge: 'Schema & Objects', available: true,
    description: '#temp tables vs @table variables (MSSQL) vs TEMP TABLE (PostgreSQL) — scoping, statistics, and when each is appropriate.',
    keyPoints: ['#temp has statistics — optimizer makes better plans; @table does not', 'MSSQL temp tables survive UDF calls and procedures in the same session', 'PostgreSQL ON COMMIT DROP creates session-scoped temporary tables'] },

  { title: 'Computed & Generated Columns', route: '/sql/computed-columns',  badge: 'Schema & Objects', available: true,
    description: 'Persisted computed columns (MSSQL AS … PERSISTED) vs GENERATED ALWAYS AS STORED (PostgreSQL) — indexing and use cases.',
    keyPoints: ['Persisted computed columns can be indexed for fast lookups', 'MSSQL: col AS expression PERSISTED; PostgreSQL: GENERATED ALWAYS AS (expr) STORED', 'Avoid expensive function calls in computed columns — they run on every write'] },

  // ── Programmatic SQL ─────────────────────────────────────────────────────────
  { title: 'Stored Procedures',        route: '/sql/stored-procedures',     badge: 'Programmatic', available: true,
    description: 'CREATE PROCEDURE (T-SQL) vs PL/pgSQL functions — parameters, TRY/CATCH vs EXCEPTION blocks, parameter sniffing.',
    keyPoints: ['Wrap DML in TRY/CATCH with ROLLBACK in the CATCH block (MSSQL)', 'PL/pgSQL uses RAISE EXCEPTION / BEGIN...EXCEPTION (PostgreSQL)', 'Parameter sniffing: use OPTION(RECOMPILE) or OPTIMIZE FOR to fix bad plans'] },

  { title: 'Stored Functions',         route: '/sql/stored-functions',      badge: 'Programmatic', available: true,
    description: 'Scalar UDFs, inline table-valued functions (MSSQL), and PL/pgSQL RETURNS TABLE functions — plus performance implications.',
    keyPoints: ['Scalar UDFs in MSSQL inhibit parallelism — prefer TVFs or inline expressions', 'Inline TVFs are expanded like views; multi-statement TVFs are opaque to the optimizer', 'PostgreSQL RETURNS TABLE functions are the idiomatic alternative to stored procedures'] },

  { title: 'Cursors & Loops',          route: '/sql',                       badge: 'Programmatic', available: false,
    description: 'CURSOR, FETCH NEXT (MSSQL) vs FOR loop / LOOP in PL/pgSQL — and why set-based SQL is almost always preferable.',
    keyPoints: ['Cursors process row-by-row — 10–100× slower than set-based SQL', 'Use cursors only when no set-based solution exists (e.g. dynamic DDL per row)', 'PL/pgSQL FOR rec IN SELECT ... LOOP is cleaner than explicit CURSOR'] },

  { title: 'Triggers',                 route: '/sql/triggers',              badge: 'Programmatic', available: false,
    description: 'AFTER/INSTEAD OF DML triggers (MSSQL) vs BEFORE/AFTER/INSTEAD OF (PostgreSQL) — audit log and guard patterns.',
    keyPoints: ['INSERTED and DELETED pseudo-tables in T-SQL triggers', 'PostgreSQL trigger functions return NEW/OLD records', 'Avoid triggers for business logic — use for audit/guard patterns only'] },

  { title: 'Dynamic SQL',              route: '/sql/dynamic-sql',           badge: 'Programmatic', available: false,
    description: 'EXEC (T-SQL), sp_executesql with parameterised queries (MSSQL), EXECUTE in PL/pgSQL — and SQL injection prevention.',
    keyPoints: ['sp_executesql with @params prevents SQL injection in MSSQL', 'EXECUTE format(\'…\', $1) or EXECUTE with USING in PL/pgSQL', 'Always use parameterised queries — never concatenate user input'] },

  // ── Transactions & Concurrency ───────────────────────────────────────────────
  { title: 'Transactions & ACID',      route: '/sql/transactions',          badge: 'Transactions', available: true,
    description: 'BEGIN/COMMIT/ROLLBACK, SAVEPOINT, TRY/CATCH vs EXCEPTION blocks, and explicit vs autocommit behaviour.',
    keyPoints: ['Keep transactions short — long transactions hold locks', 'SAVEPOINT allows partial rollback within a transaction', 'Autocommit is the default in both dialects — wrap DML explicitly'] },

  { title: 'Isolation Levels',         route: '/sql/isolation-levels',      badge: 'Transactions', available: false,
    description: 'READ UNCOMMITTED → SERIALIZABLE, SNAPSHOT/RCSI (MSSQL), PostgreSQL MVCC — dirty reads, phantom reads, and when each level is correct.',
    keyPoints: ['READ COMMITTED is the default in both dialects', 'SNAPSHOT isolation (MSSQL RCSI) eliminates reader-writer blocking', 'SERIALIZABLE prevents phantom reads — at cost of SSI aborts (PostgreSQL)'] },

  { title: 'Locking & Deadlocks',      route: '/sql/locking',               badge: 'Transactions', available: false,
    description: 'Shared, exclusive, and update locks, lock escalation, WITH(NOLOCK) (MSSQL), FOR UPDATE/SKIP LOCKED (PostgreSQL), deadlock patterns.',
    keyPoints: ['WITH(NOLOCK) / READ UNCOMMITTED reads dirty data — use cautiously', 'SELECT … FOR UPDATE locks rows; SKIP LOCKED skips locked rows', 'Access tables in consistent order to prevent circular deadlocks'] },

  // ── Performance ──────────────────────────────────────────────────────────────
  { title: 'Indexes',                  route: '/sql/indexes',               badge: 'Performance', available: true,
    description: 'B-tree, hash, GIN/GiST (PostgreSQL), columnstore (MSSQL) — clustered, non-clustered, covering, filtered, and composite indexes.',
    keyPoints: ['One clustered index per table — choose a narrow, monotonic key', 'INCLUDE columns in non-clustered indexes to eliminate key lookups', 'GIN indexes in PostgreSQL for jsonb/arrays; columnstore for analytics (MSSQL)'] },

  { title: 'Execution Plans',          route: '/sql/execution-plans',       badge: 'Performance', available: false,
    description: 'Reading MSSQL graphical/XML plans and PostgreSQL EXPLAIN ANALYZE — operators, cost, actual vs estimated rows.',
    keyPoints: ['Read MSSQL plans right-to-left, top-to-bottom; thickest arrow = most rows', 'EXPLAIN (ANALYZE, BUFFERS) in PostgreSQL shows actual time and I/O', 'Cardinality mismatch between estimated and actual rows signals stale statistics'] },

  { title: 'Query Optimization',       route: '/sql/performance',           badge: 'Performance', available: true,
    description: 'Sargability, statistics, cardinality estimation, query hints — and systematic anti-pattern checklist.',
    keyPoints: ['Functions on indexed columns prevent seeks — rewrite predicates', 'Implicit type conversions cause full scans', 'UPDATE STATISTICS / ANALYZE after bulk loads'] },

  { title: 'Partitioning',             route: '/sql/partitioning',          badge: 'Performance', available: false,
    description: 'MSSQL partition functions/schemes vs PostgreSQL declarative partitioning — range, list, hash — and partition pruning.',
    keyPoints: ['Partitioning helps when queries filter on the partition key', 'MSSQL: CREATE PARTITION FUNCTION + SCHEME + aligned index', 'PostgreSQL: PARTITION BY RANGE/LIST/HASH on parent table'] },

  { title: 'Bulk Operations',          route: '/sql/bulk-operations',       badge: 'Performance', available: false,
    description: 'BULK INSERT / BCP (MSSQL) vs COPY (PostgreSQL) — batch sizing, minimal logging, staging table patterns.',
    keyPoints: ['BULK INSERT with TABLOCK and BATCHSIZE for minimal logging (MSSQL)', 'COPY FROM is the fastest ingestion path in PostgreSQL', 'Stage → transform → upsert/merge pattern avoids contention'] },

  { title: 'Query Store & Plan Regression', route: '/sql',                  badge: 'Performance', available: false,
    description: 'Query Store (MSSQL/PostgreSQL 17+) — capturing plan history, forcing stable plans, detecting regressions.',
    keyPoints: ['Query Store saves query text, plans, and runtime stats over time', 'Force a good plan with sys.sp_query_store_force_plan (MSSQL)', 'pg_stat_statements + auto_explain give equivalent visibility in PostgreSQL'] },

  { title: 'Statistics & Cardinality', route: '/sql',                       badge: 'Performance', available: false,
    description: 'How the optimizer uses column statistics, histograms, and density vectors — and when to update or trace statistics issues.',
    keyPoints: ['Statistics are single-column or multi-column histograms of value distribution', 'Stale statistics → bad cardinality estimates → wrong join order or index choice', 'UPDATE STATISTICS WITH FULLSCAN / ANALYZE rebuilds from 100% of the data'] },

  // ── Advanced Features ────────────────────────────────────────────────────────
  { title: 'JSON Features',            route: '/sql/json-features',         badge: 'Advanced Features', available: true,
    description: 'JSON_VALUE/JSON_QUERY/OPENJSON/FOR JSON (MSSQL) vs jsonb operators/functions/GIN indexes (PostgreSQL).',
    keyPoints: ['PostgreSQL jsonb is binary, indexable, and operator-rich', 'OPENJSON with WITH clause projects JSON into typed columns (MSSQL)', 'GIN index on jsonb for fast containment (@>) and key-existence (?) queries'] },

  { title: 'Full-Text Search',         route: '/sql/full-text-search',      badge: 'Advanced Features', available: false,
    description: 'FTS catalogs, CONTAINS, FREETEXT (MSSQL) vs tsvector/tsquery/GIN, plainto_tsquery (PostgreSQL).',
    keyPoints: ['MSSQL FTS uses catalogs and indexes maintained by a background service', 'PostgreSQL: to_tsvector(\'english\', col) indexed with GIN', 'Use FTS for natural-language search; use LIKE only for exact prefix matching'] },

  { title: 'Security & RLS',           route: '/sql/security',              badge: 'Advanced Features', available: false,
    description: 'GRANT/REVOKE, principle of least privilege, Row-Level Security (both dialects), Always Encrypted (MSSQL), pg_hba.conf (PostgreSQL).',
    keyPoints: ['Grant execute on stored procedures — not SELECT on tables — for app users', 'Row-Level Security: CREATE POLICY + ALTER TABLE ENABLE ROW LEVEL SECURITY', 'Always Encrypted (MSSQL) / pgcrypto (PostgreSQL) for column-level encryption'] },

  { title: 'Connection Pooling',       route: '/sql',                       badge: 'Advanced Features', available: false,
    description: 'How ADO.NET/pgBouncer/PgPool pool connections, pool sizing formulas, monitoring leaks, and cloud-native pooling.',
    keyPoints: ['ADO.NET pools connections per connection string — never modify the string at runtime', 'PgBouncer in transaction mode is the standard PostgreSQL pooler', 'Pool too small → queuing; too large → db context-switch overhead'] },

  // ── Reference ────────────────────────────────────────────────────────────────
  { title: 'Cheat Sheet',         route: '/sql/cheatsheet',      badge: 'Reference', available: true,
    description: 'Searchable quick-reference for SELECT, JOINs, aggregations, window functions, DDL, DML, and CLI — MSSQL + PostgreSQL.',
    keyPoints: ['7 tabbed sections covering the full SQL surface', 'Filter by keyword within any section', 'Side-by-side MSSQL / PostgreSQL syntax notes'] },
  { title: 'Common Errors',       route: '/sql/errors',          badge: 'Reference', available: true,
    description: '13 real-world SQL errors — root cause, fix, and before/after code examples for both dialects.',
    keyPoints: ['Covers NULL comparisons, implicit conversions, NOT IN pitfall', 'Deadlock, index blocking, and GROUP BY errors explained', 'Tag-filtered browser'] },
  { title: 'Quiz Practice',       route: '/sql/quiz-practice',   badge: 'Reference', available: true,
    description: '20 questions across 8 topics — setup → quiz → score with full explanations.',
    keyPoints: ['Setup → quiz → result flow with per-question explanations', 'Covers basics through window functions and indexes', 'Restart any time'] },
  { title: 'Interview Prep',      route: '/sql/interview-prep',  badge: 'Reference', available: true,
    description: '22 interview questions from junior to senior — expand each for a thorough model answer.',
    keyPoints: ['Filter by level (junior / mid / senior) and topic', 'Senior questions probe execution plans and isolation levels', 'Covers both MSSQL and PostgreSQL nuances'] },
  { title: 'Design Patterns',     route: '/sql/design-patterns', badge: 'Reference', available: true,
    description: '12 expandable schema and query patterns — soft delete, audit log, temporal tables, adjacency list, and more.',
    keyPoints: ['Soft delete, audit trail, versioning/temporal tables', 'Adjacency list and nested sets for hierarchy storage', 'Many-to-many junction tables and upsert patterns'] },
  { title: 'Decision Guides',     route: '/sql/decision-guides', badge: 'Reference', available: true,
    description: '8 side-by-side tables for common SQL choices — with a rule of thumb for each.',
    keyPoints: ['CTE vs subquery, clustered vs non-clustered', 'Stored proc vs view vs TVF', 'MSSQL vs PostgreSQL feature comparison'] },
  { title: 'Glossary',            route: '/sql/glossary',        badge: 'Reference', available: true,
    description: '50+ A–Z SQL and relational database terms with definitions and links to topic pages.',
    keyPoints: ['50+ terms from ACID to Window Function', 'Letter filter + keyword search', 'Cross-links to topic pages'] },
  { title: 'Mini Projects',       route: '/sql/mini-projects',   badge: 'Reference', available: true,
    description: '4 schema walkthroughs — e-commerce, analytics, HR, and warehouse — with full DDL and operational queries.',
    keyPoints: ['Complete CREATE TABLE scripts with all constraints and indexes', 'Sample reporting and operational queries per schema', 'Uses both MSSQL and ANSI-compatible SQL'] },
  { title: 'Learning Paths',      route: '/sql/learning-paths',  badge: 'Reference', available: true,
    description: '4 curated paths — complete beginner, data analyst, backend developer, and DBA.',
    keyPoints: ['Stage-by-stage with links to each topic page', 'From first SELECT to index tuning and isolation levels', 'DBA path covers internals, locking, and partitioning'] },
];

@Component({
  selector: 'app-sql-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class SqlHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);

  topics = computed(() => {
    const f = this.activeFilter();
    return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f);
  });

  filters = GROUP_ORDER;

  counts = computed(() => {
    const map: Record<string, number> = { All: ALL_TOPICS.length };
    for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1;
    return map;
  });

  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount     = ALL_TOPICS.length;

  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'core'); }
  toggleCard(key: string, event: Event) {
    event.preventDefault();
    this.expandedCard.update(c => c === key ? null : key);
  }
}
