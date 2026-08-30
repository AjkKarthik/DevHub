import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Named in the QnA in Real SQL Detail — Never Shown Side by Side',
    points: [
      'The main page’s own QnA describes the deferred-join trick precisely: "<code>SELECT o.* FROM orders o JOIN (SELECT id FROM orders ORDER BY id DESC LIMIT 20 OFFSET 400) t ON o.id = t.id</code>. The inner query uses index-only scan on id. The outer join fetches full rows only for the 20 result IDs." No codeTab on the page ever shows this next to the naive version it improves on.',
      'The mechanism is precise: a naive <code>OFFSET 400</code> query has to fetch and discard every COLUMN of the first 400 rows before it can return row 401 — the database reads full table pages for rows it will never return. The deferred join instead has the OFFSET/LIMIT operate on an index-only query that reads JUST the <code>id</code> column, then only fetches full rows for the exact 20 ids that survive.',
      'This still does not change the fundamental O(offset) cost of the SKIP itself — the inner query still has to walk past 400 index entries. What it eliminates is the far more expensive part: reading the FULL ROW DATA (every column, including large text/JSON fields) for all 400 skipped rows, not just their ids.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Naive Deep Offset vs. the Deferred Join',
    language: 'sql',
    code: `-- ── Naive deep-offset query ──────────────────────────────────────────────
-- The database reads EVERY COLUMN of all 420 matching rows (400
-- skipped + 20 returned), including any large TEXT/JSONB columns,
-- before discarding the first 400 and returning the last 20.
SELECT *
FROM orders
ORDER BY id DESC
LIMIT 20 OFFSET 400;

-- ── Deferred join ────────────────────────────────────────────────────────
-- The INNER query is an index-only scan -- it reads ONLY the id
-- column (assuming id is indexed, which it always is as the primary
-- key), never touching the rest of each row's data for the 400
-- skipped rows at all.
SELECT o.*
FROM orders o
JOIN (
  SELECT id
  FROM orders
  ORDER BY id DESC
  LIMIT 20 OFFSET 400
) t ON o.id = t.id
ORDER BY o.id DESC;

-- The OUTER join then fetches full row data for EXACTLY the 20 ids
-- that survived the inner query -- not 420 rows' worth of full data,
-- just 20. For a table with wide rows (large JSON columns, long
-- text fields), this is the difference between reading megabytes of
-- data you immediately discard versus reading only what you return.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate argues the deferred join is pointless for a table where every column is small (a handful of integers and short strings, no large TEXT/JSONB fields) — "there’s nothing expensive to skip reading in the first place." Is this reasoning correct?',
  hint: 'The deferred join’s benefit specifically comes from the inner query being an INDEX-ONLY scan versus the outer query needing a full TABLE (heap) access for each row. Does that distinction disappear just because the row’s columns happen to be small?',
  solution: `// The reasoning is partially right but overstates the conclusion.
// For a table with genuinely small rows, the deferred join's benefit
// is SMALLER -- there's less "extra data" being needlessly read per
// skipped row, so the relative improvement shrinks. But it does not
// disappear entirely, because the win isn't purely about how many
// BYTES are read -- it's also about whether the database can serve
// the skip ENTIRELY from the index (an index-only scan, sequential
// and cache-friendly) versus needing a TABLE HEAP access per row
// (following a pointer from the index into the actual table storage,
// which is a much less cache-friendly access pattern regardless of
// row size).

// A table with small rows still benefits from the deferred join, just
// less dramatically than a table with wide rows. The teammate's
// reasoning would only be fully correct if the query planner could
// ALREADY serve the naive version entirely via an index-only scan --
// which "SELECT *" specifically prevents, since selecting every
// column forces the database to visit the actual table heap for
// every row, no matter how small each row's data is.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The deferred join eliminates the O(offset) cost of deep pagination — it makes page 1000 just as fast as page 1.',
    reality: 'The inner query still has to walk past <code>OFFSET</code> index entries — that scan cost is still proportional to the offset value, unchanged. What the deferred join eliminates is the much LARGER cost of reading full row data (every column) for every skipped row, not the underlying skip itself. For genuinely unbounded deep pagination, the theory’s own guidance still applies: switch to keyset pagination instead.',
  },
  {
    thought: 'Any query using OFFSET automatically benefits equally from being rewritten as a deferred join.',
    reality: 'The benefit scales with how much data would otherwise be read per skipped row — a table with small, narrow rows (a handful of integers) sees a smaller improvement than a table with wide rows (large JSON/text columns), as the Try It above traces. The deferred join is a genuine optimization, not a universal fix that makes deep OFFSET queries fast regardless of table shape.',
  },
  {
    thought: 'The inner subquery in a deferred join needs its own separate index beyond the one already on the primary key.',
    reality: 'The inner query’s index-only scan works off the SAME index that already exists on <code>id</code> as the primary key — no additional index needs to be created for this specific pattern to work, as long as the ordering column used in <code>ORDER BY</code> is already indexed (which a primary key column always is).',
  },
];

@Component({
  selector: 'app-api-pagination-deferred-join',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-deferred-join-trick-for-deep-offset-pages.html',
  styleUrl: './the-deferred-join-trick-for-deep-offset-pages.scss',
})
export class TheDeferredJoinTrickForDeepOffsetPagesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
