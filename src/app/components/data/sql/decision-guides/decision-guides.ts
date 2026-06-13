import { Component } from '@angular/core';

interface DecisionRow { aspect: string; optionA: string; optionB: string; }
interface DecisionGuide { title: string; optionA: string; optionB: string; rows: DecisionRow[]; rule: string; }

@Component({
  selector: 'app-sql-decision-guides',
  standalone: true,
  imports: [],
  templateUrl: './decision-guides.html',
  styleUrl: './decision-guides.scss',
})
export class SqlDecisionGuides {
  guides: DecisionGuide[] = [
    {
      title: 'CTE vs Subquery',
      optionA: 'CTE (WITH clause)',
      optionB: 'Subquery',
      rows: [
        { aspect: 'Readability',    optionA: 'Named steps — easier to read for complex logic',  optionB: 'Inline — OK for simple cases, nests deeply' },
        { aspect: 'Reuse',          optionA: 'Can be referenced multiple times in the same query', optionB: 'Must be repeated — each reference re-evaluates' },
        { aspect: 'Recursion',      optionA: 'Supports recursive CTEs for hierarchies',          optionB: 'Not supported' },
        { aspect: 'Performance',    optionA: 'Inlined by optimiser (MSSQL); materialised in PG ≤11', optionB: 'Usually inlined; same plan as CTE in most cases' },
        { aspect: 'Use in DML',     optionA: 'Can precede UPDATE/DELETE/INSERT',                 optionB: 'Derived table in FROM clause only' },
        { aspect: 'Debugging',      optionA: 'Can SELECT from CTE in isolation during dev',      optionB: 'Harder to isolate' },
      ],
      rule: 'Prefer CTE when logic is multi-step, shared, or recursive. Use a subquery for simple one-time inline filtering.',
    },
    {
      title: 'Clustered vs Non-Clustered Index',
      optionA: 'Clustered Index',
      optionB: 'Non-Clustered Index',
      rows: [
        { aspect: 'Count per table',  optionA: '1 only — defines physical row order',              optionB: 'Up to 999 in SQL Server' },
        { aspect: 'Data storage',     optionA: 'Leaf pages ARE the data rows',                     optionB: 'Separate B-tree with row locators back to data' },
        { aspect: 'Lookup cost',      optionA: 'No lookup — data is in the index',                 optionB: 'Key Lookup needed if not covering' },
        { aspect: 'Covering',         optionA: 'Always covers — all columns are there',            optionB: 'Needs INCLUDE for extra columns' },
        { aspect: 'Range scans',      optionA: 'Very efficient — rows are physically contiguous',  optionB: 'Efficient for index key; lookup cost if non-covering' },
        { aspect: 'Write overhead',   optionA: 'Page splits if key is random (e.g. GUID)',         optionB: 'Additional write per DML; less fragmentation risk' },
      ],
      rule: 'Use the clustered index on the primary key (narrow, monotonic). Use non-clustered + INCLUDE for query-specific lookup/covering needs.',
    },
    {
      title: 'Stored Procedure vs View vs Inline TVF',
      optionA: 'Stored Procedure',
      optionB: 'Inline Table-Valued Function (iTVF)',
      rows: [
        { aspect: 'Returns',          optionA: 'Multiple result sets, output params, status code', optionB: 'A single table result; usable in FROM clause' },
        { aspect: 'Parameterised',    optionA: 'Yes — input and output params',                    optionB: 'Yes — inline parameter in WHERE becomes a predicate' },
        { aspect: 'Composable',       optionA: 'Cannot be used in FROM / JOIN',                    optionB: 'Fully composable — SELECT ... FROM dbo.Fn(p) AS f' },
        { aspect: 'Optimiser',        optionA: 'Opaque — optimiser sees one unit',                 optionB: 'Fully inlined — optimiser sees through it' },
        { aspect: 'Side effects',     optionA: 'Can INSERT/UPDATE/DELETE, call other procs',       optionB: 'Read-only; no side effects' },
        { aspect: 'Best use',         optionA: 'Complex multi-step logic, ETL, transactions',      optionB: 'Parameterised view, reusable query building block' },
      ],
      rule: 'Use stored procedures for business logic with side effects. Use iTVFs for reusable query fragments that need to be composable.',
    },
    {
      title: 'DELETE vs TRUNCATE',
      optionA: 'DELETE',
      optionB: 'TRUNCATE TABLE',
      rows: [
        { aspect: 'Scope',            optionA: 'Can target specific rows with WHERE',              optionB: 'Removes ALL rows — no WHERE clause' },
        { aspect: 'Logging',          optionA: 'Fully logged per row — slow on large tables',      optionB: 'Minimally logged (deallocates pages) — much faster' },
        { aspect: 'Triggers',         optionA: 'Fires DELETE triggers',                             optionB: 'Does NOT fire triggers' },
        { aspect: 'IDENTITY reset',   optionA: 'Does not reset IDENTITY counter',                  optionB: 'Resets IDENTITY to seed value' },
        { aspect: 'FK constraints',   optionA: 'Blocked by referencing FK rows',                   optionB: 'Blocked if table is referenced by a FK' },
        { aspect: 'Rollback',         optionA: 'Can be wrapped in a transaction',                  optionB: 'Can also be rolled back inside a transaction (DDL)' },
      ],
      rule: 'Use TRUNCATE to empty a staging/temp table fast. Use DELETE when you need row-level control, trigger firing, or FK constraint checking.',
    },
    {
      title: 'MSSQL vs PostgreSQL — Key Differences',
      optionA: 'SQL Server (MSSQL)',
      optionB: 'PostgreSQL',
      rows: [
        { aspect: 'JSON type',        optionA: 'Stored as NVARCHAR; functions: JSON_VALUE, OPENJSON', optionB: 'Native jsonb type; GIN indexable; rich operators' },
        { aspect: 'Auto-increment',   optionA: 'IDENTITY(1,1) or SEQUENCE',                         optionB: 'SERIAL / BIGSERIAL or GENERATED ALWAYS AS IDENTITY' },
        { aspect: 'String concat',    optionA: "'+' operator or CONCAT()",                           optionB: "'||' operator or CONCAT()" },
        { aspect: 'TOP / LIMIT',      optionA: 'SELECT TOP N … ORDER BY',                           optionB: 'SELECT … ORDER BY … LIMIT N OFFSET M' },
        { aspect: 'Date now',         optionA: 'GETDATE() / SYSUTCDATETIME()',                       optionB: 'NOW() / CURRENT_TIMESTAMP / SYSDATE' },
        { aspect: 'Temp tables',      optionA: '#temp (session) or ##temp (global)',                 optionB: 'CREATE TEMP TABLE (session scope)' },
      ],
      rule: 'Write ANSI SQL (JOINs, CTEs, window functions) where possible. Isolate dialect-specific code in stored procedures or DAO layer.',
    },
    {
      title: 'Normalisation vs Denormalisation',
      optionA: 'Normalised (3NF)',
      optionB: 'Denormalised',
      rows: [
        { aspect: 'Data integrity',   optionA: 'Single source of truth — updates in one place',    optionB: 'Redundant data risks update anomalies' },
        { aspect: 'Storage',          optionA: 'Less storage — no duplicated data',                 optionB: 'More storage — repeated values' },
        { aspect: 'Write performance',optionA: 'Faster writes — update one row in one place',       optionB: 'Slower writes — must update all copies' },
        { aspect: 'Read performance', optionA: 'JOINs add overhead for complex queries',            optionB: 'Pre-joined data — fast reads, no JOIN cost' },
        { aspect: 'Query complexity', optionA: 'More complex SELECT with multiple JOINs',           optionB: 'Simpler SELECT — fewer or no JOINs' },
        { aspect: 'Best for',         optionA: 'OLTP — transactional workloads with many writes',   optionB: 'OLAP / reporting — read-heavy, aggregation-heavy' },
      ],
      rule: 'Normalise to 3NF by default. Denormalise only after profiling proves JOIN cost is a measured bottleneck in a production workload.',
    },
    {
      title: 'IN vs EXISTS',
      optionA: 'IN (subquery)',
      optionB: 'EXISTS (subquery)',
      rows: [
        { aspect: 'Execution',        optionA: 'Builds full subquery result set, then checks membership', optionB: 'Short-circuits on first match — can be faster' },
        { aspect: 'NULL safety',      optionA: 'NOT IN breaks with NULLs in list',                  optionB: 'NOT EXISTS is NULL-safe' },
        { aspect: 'Correlated',       optionA: 'Usually non-correlated (evaluated once)',            optionB: 'Usually correlated (re-evaluated per outer row)' },
        { aspect: 'Optimiser',        optionA: 'Modern optimisers often convert to semi-join',       optionB: 'Modern optimisers often convert to semi-join' },
        { aspect: 'Use for',          optionA: 'Membership check against a short, known list',       optionB: 'Existence check, especially with NULLs or NOT' },
        { aspect: 'Readability',      optionA: 'Clean for small static lists: IN (1, 2, 3)',         optionB: 'Clearer intent for correlated existence checks' },
      ],
      rule: 'Prefer EXISTS / NOT EXISTS for correctness with NULLs. Use IN for small static lists. For large datasets, let the optimiser decide — plans are often identical.',
    },
    {
      title: 'Surrogate Key vs Natural Key',
      optionA: 'Surrogate Key (INT / BIGINT / GUID)',
      optionB: 'Natural Key (email, SKU, SSN)',
      rows: [
        { aspect: 'Stability',        optionA: 'Immutable — assigned once and never changes',       optionB: 'Can change (email changes, SKUs get retired)' },
        { aspect: 'FK cascade',       optionA: 'Narrow (4–16 bytes) — cheap FK storage',            optionB: 'Wide string FKs — more storage, wider indexes' },
        { aspect: 'Uniqueness',       optionA: 'Guaranteed unique by the DB (IDENTITY/SEQUENCE)',    optionB: 'May have duplicates if not enforced carefully' },
        { aspect: 'Meaningfulness',   optionA: 'No business meaning — opaque to users',             optionB: 'Meaningful to users — easier debugging' },
        { aspect: 'Join performance', optionA: 'Integer JOINs are faster than string JOINs',        optionB: 'String comparisons are slower' },
        { aspect: 'Recommendation',   optionA: 'Use as PK for most tables',                        optionB: 'Add as UNIQUE constraint alongside surrogate PK' },
      ],
      rule: 'Use a surrogate key as the PK. Enforce natural keys as UNIQUE constraints. This gives you stability and business-key uniqueness.',
    },
  ];
}
