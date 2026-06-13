import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface GlossaryEntry { term: string; def: string; see?: string; seeRoute?: string; }

@Component({
  selector: 'app-sql-glossary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './glossary.html',
  styleUrl: './glossary.scss',
})
export class SqlGlossary {
  search     = signal('');
  activeLetter = signal('');

  allEntries: GlossaryEntry[] = [
    { term: 'ACID', def: 'Atomicity, Consistency, Isolation, Durability — the four guarantees a transactional database must provide.', see: 'Transactions', seeRoute: '/sql/transactions' },
    { term: 'Aggregate function', def: 'A function that computes a single result from multiple rows: COUNT, SUM, AVG, MIN, MAX. Ignores NULL values except COUNT(*).', see: 'Aggregations', seeRoute: '/sql/aggregations' },
    { term: 'Anti-join', def: 'Returns rows from the left table that have no matching row in the right table. Implemented via LEFT JOIN ... WHERE right.key IS NULL, or NOT EXISTS.' },
    { term: 'Atomicity', def: 'ACID property — a transaction is all-or-nothing. All statements commit or all roll back.' },
    { term: 'B-tree index', def: 'The standard index structure used by SQL databases. Data is stored in a balanced tree of pages. Supports equality, range, and prefix seeks.' },
    { term: 'Cardinality', def: 'The number of distinct values in a column, or the estimated number of rows an operation produces. Used by the optimiser to choose plans.' },
    { term: 'Clustered index', def: 'An index that determines the physical order of rows in a table. One per table. SQL Server creates it on the PK by default.', see: 'Indexes', seeRoute: '/sql/indexes' },
    { term: 'Composite index', def: 'An index on two or more columns. Column order matters — the index supports seeks on prefixes of the key.' },
    { term: 'Consistency', def: 'ACID property — a transaction takes the database from one valid state to another. All constraints must hold before and after.' },
    { term: 'Correlated subquery', def: 'A subquery that references a column from the outer query. Re-executed once per outer row in the worst case.', see: 'Subqueries', seeRoute: '/sql/subqueries' },
    { term: 'CTE', def: 'Common Table Expression — a named temporary result set defined with the WITH keyword. Can be recursive. Exists only for the duration of the query.', see: 'CTEs', seeRoute: '/sql/ctes' },
    { term: 'Covering index', def: 'A non-clustered index that contains all columns a query needs (key + INCLUDE), eliminating the need for a key lookup.', see: 'Indexes', seeRoute: '/sql/indexes' },
    { term: 'Deadlock', def: 'A circular lock wait: transaction A waits for a lock held by transaction B, which waits for A. The database terminates one transaction (the victim).', see: 'Transactions', seeRoute: '/sql/transactions' },
    { term: 'Dense rank', def: 'A window ranking function (DENSE_RANK()) that assigns the same rank to ties with no gaps: 1, 2, 2, 3.', see: 'Window Functions', seeRoute: '/sql/window-functions' },
    { term: 'Derived table', def: 'A subquery in the FROM clause that must be aliased. Evaluated once and used like a regular table in the outer query.' },
    { term: 'Durability', def: 'ACID property — once committed, changes survive crashes. The write-ahead log ensures recoverability.' },
    { term: 'Execution plan', def: 'A tree of operators showing how the database engine retrieves data. Read right-to-left in SQL Server. Reveals scans, seeks, joins, and costs.', see: 'Query Performance', seeRoute: '/sql/performance' },
    { term: 'EXISTS', def: 'A predicate that returns TRUE if the subquery returns at least one row. Short-circuits on first match.', see: 'Subqueries', seeRoute: '/sql/subqueries' },
    { term: 'Fill factor', def: 'SQL Server: the percentage of each index page filled at creation time. Leaves room for future inserts and reduces page splits.' },
    { term: 'Filtered index', def: 'An index defined over a subset of rows using a WHERE clause. Keeps the index small and targeted.', see: 'Indexes', seeRoute: '/sql/indexes' },
    { term: 'Foreign key', def: 'A constraint that enforces referential integrity — values in a child column must exist in the referenced parent column.', see: 'Schema Design', seeRoute: '/sql/schema-design' },
    { term: 'Full outer join', def: 'Returns all rows from both tables. Where no match exists in the other table, NULL values fill the missing columns.', see: 'Joins', seeRoute: '/sql/joins' },
    { term: 'GIN index', def: 'PostgreSQL Generalised Inverted Index. Supports jsonb containment (@>), array membership, and full-text search operators.', see: 'JSON Features', seeRoute: '/sql/json-features' },
    { term: 'GROUP BY', def: 'Collapses rows with the same values into one group per combination. Every non-aggregate SELECT column must appear in GROUP BY.', see: 'Aggregations', seeRoute: '/sql/aggregations' },
    { term: 'HAVING', def: 'Filters groups after aggregation. WHERE filters rows before aggregation; HAVING filters the resulting groups.', see: 'Aggregations', seeRoute: '/sql/aggregations' },
    { term: 'Index fragmentation', def: 'Pages in an index are out-of-order (logical fragmentation) or partially filled (internal fragmentation), increasing I/O.' },
    { term: 'Index scan', def: 'Reads all (or a range of) leaf pages in an index. Slower than a seek for selective queries, faster than a table scan when the index is covering.' },
    { term: 'Index seek', def: 'Navigates the B-tree root → internal nodes → leaf to find exactly the rows matching the predicate. Efficient for selective queries.' },
    { term: 'Isolation', def: 'ACID property — the degree to which concurrent transactions are visible to each other. Controlled by isolation levels.', see: 'Transactions', seeRoute: '/sql/transactions' },
    { term: 'jsonb', def: 'PostgreSQL binary JSON type. Faster to query than json, supports GIN indexing, and allows containment/existence operators.', see: 'JSON Features', seeRoute: '/sql/json-features' },
    { term: 'Key lookup', def: 'An execution plan operator where the engine fetches extra columns from the clustered index after using a non-covering non-clustered index. Eliminate with INCLUDE.' },
    { term: 'LAG / LEAD', def: 'Window functions that return the value N rows before/after the current row. Used for period-over-period comparisons.', see: 'Window Functions', seeRoute: '/sql/window-functions' },
    { term: 'Logical reads', def: 'The number of 8KB pages the engine reads from the buffer pool (cache). The primary I/O metric for query performance in SQL Server.' },
    { term: 'Normalisation', def: 'The process of organising columns into tables to eliminate data redundancy and ensure integrity. Common forms: 1NF, 2NF, 3NF.', see: 'Schema Design', seeRoute: '/sql/schema-design' },
    { term: 'NULL', def: 'Represents an unknown or absent value. Not equal to zero or empty string. Use IS NULL / IS NOT NULL to test for it. Propagates through arithmetic and comparisons.' },
    { term: 'OPENJSON', def: 'SQL Server TVF that shreds a JSON string into a relational result set. Accepts a WITH clause to specify column names and types.', see: 'JSON Features', seeRoute: '/sql/json-features' },
    { term: 'OVER clause', def: 'Defines the window for a window function. Can include PARTITION BY (grouping) and ORDER BY (row order within the group).', see: 'Window Functions', seeRoute: '/sql/window-functions' },
    { term: 'Parameter sniffing', def: 'SQL Server compiles a stored procedure\'s plan using the first execution\'s parameter values and caches it. Can produce a poor plan for different values later.', see: 'Stored Procedures', seeRoute: '/sql/stored-procedures' },
    { term: 'PARTITION BY', def: 'Divides a window function\'s rows into independent groups. The window function resets per partition.', see: 'Window Functions', seeRoute: '/sql/window-functions' },
    { term: 'Primary key', def: 'A column (or combination) that uniquely identifies each row. Enforces entity integrity. Creates a clustered index in SQL Server by default.', see: 'Schema Design', seeRoute: '/sql/schema-design' },
    { term: 'Recursive CTE', def: 'A CTE that references itself. Used to traverse hierarchical data (org charts, folder trees). Consists of an anchor member and a recursive member united by UNION ALL.', see: 'CTEs', seeRoute: '/sql/ctes' },
    { term: 'ROW_NUMBER', def: 'Window function that assigns a unique sequential integer to each row. Ties get different numbers. Used for deduplication.', see: 'Window Functions', seeRoute: '/sql/window-functions' },
    { term: 'Sargable', def: 'A predicate that can use an index seek (Search ARGument ABLE). Predicates with functions on indexed columns are non-sargable.', see: 'Query Performance', seeRoute: '/sql/performance' },
    { term: 'Scalar subquery', def: 'A subquery that returns exactly one row, one column. Used as a column expression in SELECT. Raises an error if it returns more than one row.', see: 'Subqueries', seeRoute: '/sql/subqueries' },
    { term: 'SNAPSHOT isolation', def: 'An isolation level where readers see a snapshot of committed data from the transaction start. Eliminates reader-writer blocking. Uses a version store.', see: 'Transactions', seeRoute: '/sql/transactions' },
    { term: 'Statistics', def: 'Histograms of column value distributions used by the query optimiser to estimate row counts and choose execution plans. Can become stale after bulk data changes.' },
    { term: 'Stored procedure', def: 'A named, pre-compiled block of SQL stored in the database. Reduces round-trips, encapsulates logic, and allows fine-grained permission grants.', see: 'Stored Procedures', seeRoute: '/sql/stored-procedures' },
    { term: 'Surrogate key', def: 'An auto-generated, meaningless primary key (INT IDENTITY, BIGINT, GUID). Immutable and narrow — preferred over natural keys for PKs.' },
    { term: 'Table scan', def: 'Reads every row in the table. Occurs when no usable index exists or when the query returns a large percentage of rows.' },
    { term: 'Transaction', def: 'A unit of work that satisfies ACID properties. Explicitly controlled with BEGIN TRANSACTION, COMMIT, and ROLLBACK.', see: 'Transactions', seeRoute: '/sql/transactions' },
    { term: 'TRUNCATE', def: 'Removes all rows from a table with minimal logging. Faster than DELETE for full-table deletes. Does not fire triggers; resets IDENTITY.' },
    { term: 'Unique constraint', def: 'Ensures all values in a column or combination are distinct. Implemented as a unique index. Allows one NULL in SQL Server (multiple in PostgreSQL).' },
    { term: 'Window function', def: 'A function that computes a result over a set of rows related to the current row without collapsing rows. Requires an OVER() clause.', see: 'Window Functions', seeRoute: '/sql/window-functions' },
  ];

  letters = computed(() => {
    const set = new Set(this.allEntries.map(e => e.term[0].toUpperCase()));
    return [...set].sort();
  });

  filtered = computed(() => {
    const q   = this.search().toLowerCase();
    const ltr = this.activeLetter();
    return this.allEntries.filter(e => {
      const matchSearch = !q || e.term.toLowerCase().includes(q) || e.def.toLowerCase().includes(q);
      const matchLetter = !ltr || e.term[0].toUpperCase() === ltr;
      return matchSearch && matchLetter;
    });
  });

  grouped = computed(() => {
    const map = new Map<string, GlossaryEntry[]>();
    for (const e of this.filtered()) {
      const l = e.term[0].toUpperCase();
      if (!map.has(l)) map.set(l, []);
      map.get(l)!.push(e);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  });

  setLetter(l: string) { this.activeLetter.update(cur => cur === l ? '' : l); }
}
