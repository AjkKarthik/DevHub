import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-prefix-like-pattern-ops-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-prefix-like-needs-pattern-ops-under-default-locale.html',
  styleUrl: './demonstrating-that-prefix-like-needs-pattern-ops-under-default-locale.scss',
})
export class DemonstratingThatPrefixLikeNeedsPatternOpsUnderDefaultLocaleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Blanket Claim With a Hidden Condition',
      points: [
        'The main page states plainly: "Prefix searches (col LIKE \'abc%\') can use an index; mid-string (\'%abc%\') cannot." This is true for MSSQL, and true for PostgreSQL under the C locale — but it is NOT automatically true for PostgreSQL\'s most common real-world configuration: a locale-aware collation (like en_US.UTF-8), which is what most PostgreSQL databases are initialized with by default.',
        'Under a locale-aware collation, an ordinary B-tree index (CREATE INDEX ON t(col)) is built using locale-aware comparison operators. LIKE pattern matching for a prefix search needs the index to support pattern-matching comparisons specifically — under a non-C locale, the default index\'s operator class does not support this, and the planner silently falls back to a sequential scan, exactly as if no index existed at all.',
      ],
    },
    {
      heading: 'The Fix: text_pattern_ops',
      points: [
        'PostgreSQL provides a special operator class, text_pattern_ops (or varchar_pattern_ops for varchar columns), specifically for this case: CREATE INDEX ON t(col text_pattern_ops). An index built with this operator class supports LIKE prefix searches efficiently regardless of the database\'s locale.',
        'You can have BOTH a regular index (for ORDER BY, =, and range comparisons in the current locale) and a text_pattern_ops index (for LIKE prefix searches) on the same column if the application needs both kinds of query.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the database locale',
      language: 'sql',
      code: `SHOW lc_collate;
-- en_US.UTF-8   -- the typical default on most managed PostgreSQL
--                  services (RDS, Cloud SQL, etc.) and most Linux installs

-- Only databases explicitly initialized with --locale=C (or LC_COLLATE=C)
-- are exempt from the behavior demonstrated below.`,
    },
    {
      label: 'A plain index that does NOT accelerate a prefix LIKE',
      language: 'sql',
      code: `CREATE TABLE products (product_id INT, sku TEXT);
CREATE INDEX products_sku_idx ON products (sku);
-- Populated with 500,000 rows for this demonstration.

EXPLAIN SELECT * FROM products WHERE sku LIKE 'WID-%';

--                         QUERY PLAN
-- --------------------------------------------------------
--  Seq Scan on products  (cost=0.00..10917.00 rows=50 width=36)
--    Filter: (sku ~~ 'WID-%'::text)
--
-- Under en_US.UTF-8 collation, the planner cannot use
-- products_sku_idx for this LIKE pattern -- it falls back to a
-- full sequential scan, exactly as the main page warns 'contains'
-- searches do, even though this is a PREFIX search.`,
    },
    {
      label: 'The fix — an index built with text_pattern_ops',
      language: 'sql',
      code: `CREATE INDEX products_sku_pattern_idx ON products (sku text_pattern_ops);

EXPLAIN SELECT * FROM products WHERE sku LIKE 'WID-%';

--                              QUERY PLAN
-- ----------------------------------------------------------------
--  Index Scan using products_sku_pattern_idx on products
--    (cost=0.42..8.45 rows=50 width=36)
--    Index Cond: ((sku ~>=~ 'WID-'::text) AND (sku ~<~ 'WID.'::text))
--
-- The same query, same data, same LIKE 'WID-%' pattern -- now an
-- Index Scan instead of a Seq Scan, purely because the index's
-- operator class matches what LIKE needs under this locale.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate created a plain B-tree index on a text column specifically to speed up an application feature that does prefix autocomplete search (WHERE name LIKE \'sea%\'), but EXPLAIN still shows a sequential scan. They\'re confused because "the main page said prefix searches can use an index." What single fact about their database are they most likely missing, and what\'s the fix?',
    hint: 'Check SHOW lc_collate — most managed PostgreSQL databases default away from the one locale where a plain index would have just worked.',
    solution: `They are almost certainly running PostgreSQL under a locale-aware
collation (e.g. en_US.UTF-8), which is the default for most managed
PostgreSQL services and most fresh installs -- not the C locale, which
is the one case where the main page's blanket claim ("prefix searches
can use an index") holds true for an ordinary index without any extra
step.

The fix is to add a second index built with the text_pattern_ops
operator class: CREATE INDEX ... ON t (col text_pattern_ops). This
index specifically supports LIKE prefix-pattern matching regardless
of locale, and EXPLAIN will then show an Index Scan for the same
query. The teammate doesn't need to drop their existing plain index --
it's still useful for ORDER BY and exact-match queries in the
locale's collation order -- they need an ADDITIONAL, purpose-built
index for the LIKE use case.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'in PostgreSQL, any ordinary B-tree index on a text column automatically accelerates a prefix LIKE search (col LIKE \'abc%\'), the same as it would in MSSQL.',
      reality: 'under PostgreSQL\'s common locale-aware collations (like en_US.UTF-8, the typical default), a plain index does NOT accelerate prefix LIKE searches -- it requires a separate index built with the text_pattern_ops (or varchar_pattern_ops) operator class.',
    },
    {
      thought: 'if EXPLAIN shows a Seq Scan for a prefix LIKE query even though an index exists on that column, the index must be missing statistics or needs a VACUUM ANALYZE.',
      reality: 'the far more common cause is a locale/operator-class mismatch -- the existing index simply doesn\'t support the comparison operators LIKE needs under the database\'s active collation, and no amount of ANALYZE changes that.',
    },
    {
      thought: 'building an index with text_pattern_ops means giving up the ability to use that index for ORDER BY or exact-match (=) queries.',
      reality: 'a text_pattern_ops index and a regular index serve different purposes and can coexist on the same column -- keep the plain index for locale-aware sorting/equality, and add the pattern-ops index specifically for LIKE prefix searches.',
    },
  ];
}
