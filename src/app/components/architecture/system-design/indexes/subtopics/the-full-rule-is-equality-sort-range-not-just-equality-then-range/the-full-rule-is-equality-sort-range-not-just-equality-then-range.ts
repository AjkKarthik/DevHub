import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './the-full-rule-is-equality-sort-range-not-just-equality-then-range.html',
  styleUrl: './the-full-rule-is-equality-sort-range-not-just-equality-then-range.scss'
})
export class TheFullRuleIsEqualitySortRangeNotJustEqualityThenRangeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A two-part rule where the standard version actually has three parts',
      points: [
        'The main page states the composite index column-order rule as: "put equality columns first, range column last." This is directionally correct but incomplete — it never mentions where ORDER BY (sort) columns belong, even though the page\'s own example index, (user_id, created_at DESC), is doing double duty as both a range/sort column in different examples across the page.',
        'The widely-used, more complete version of this rule is commonly called the ESR rule — Equality, Sort, Range — and it explicitly gives sort columns their own middle position, distinct from both the leading equality columns and the trailing range columns.',
      ]
    },
    {
      heading: 'Why sort columns get their own middle slot, not just "range last"',
      points: [
        'Equality columns come first because they narrow the B-tree search to an exact, contiguous key range before anything else needs to happen — this part matches what the main page already says.',
        'Sort columns come SECOND (not folded into "range") because, once the equality filters have narrowed things down, having the ORDER BY column already sorted within that narrowed range lets the database skip a separate sort step entirely — it can just walk the index in order. This is a distinct benefit from filtering: it is about avoiding a sort operation, not about narrowing rows.',
        'Range columns come LAST specifically because a range predicate produces a variable-length scan through the index — once you cross into a range condition, the index can no longer also guarantee a clean sort order for anything indexed AFTER it, which is exactly why range columns have to be the final part of the key, after both equality and sort columns have done their work.',
      ]
    },
    {
      heading: 'Why folding "sort" into "range" produces a real mistake for a common query shape',
      points: [
        'Consider a query like WHERE status = ? ORDER BY created_at DESC LIMIT 20 (no range predicate on created_at at all — it is purely a sort column here, not a range filter). Following the main page\'s literal two-part rule ("equality first, range last") gives no explicit guidance on where created_at belongs, since it isn\'t technically a "range column" in this query at all — it is a SORT column.',
        'The correct index for this exact query is (status, created_at DESC) — equality column, then sort column — and the ESR framing makes this immediately obvious, since it explicitly has a middle slot for exactly this "not filtered, but sorted" case. A team reasoning only from "equality first, range last" might not realize this common ORDER-BY-only pattern needs the same leading-equality-then-column treatment as an actual range predicate would.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Applying ESR to three query shapes',
      language: 'bash',
      code: `-- Query 1: equality only
-- WHERE status = ?
CREATE INDEX idx1 ON orders (status);
-- E only -- no sort or range column needed

-- Query 2: equality + sort, NO range predicate
-- WHERE status = ? ORDER BY created_at DESC LIMIT 20
CREATE INDEX idx2 ON orders (status, created_at DESC);
-- E, S -- created_at is a SORT column here, not a range column;
-- this index lets the DB walk it pre-sorted, no separate sort step

-- Query 3: equality + sort + range (all three)
-- WHERE status = ? AND created_at > NOW() - INTERVAL '7 days'
-- ORDER BY created_at DESC
CREATE INDEX idx3 ON orders (status, created_at DESC);
-- E, then created_at serves BOTH the sort AND the range here --
-- when the same column is both sorted and range-filtered, it
-- naturally lands in the S/R slot together, not as two separate
-- columns -- ESR collapses cleanly in this common case

-- Query 4: equality + a DIFFERENT range column + a DIFFERENT sort column
-- WHERE status = ? AND amount > 100 ORDER BY created_at DESC
CREATE INDEX idx4 ON orders (status, created_at DESC, amount);
-- E (status), S (created_at -- the sort column), R (amount --
-- the range column) -- three DISTINCT columns, each in its own
-- ESR slot; "equality first, range last" alone doesn't tell you
-- where created_at goes here, since it's neither equality nor range`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A query is WHERE tenant_id = ? ORDER BY updated_at DESC LIMIT 25 — no range predicate anywhere, purely an equality filter plus a sort. Using the main page\'s original "equality first, range last" phrasing, where does updated_at belong in the composite index? Using the ESR rule, where does it belong?',
    hint: 'Is updated_at being used as a RANGE filter in this query at all, or as something else?',
    solution: 'Under the main page\'s original two-part phrasing, it is genuinely ambiguous — updated_at is not a range predicate in this query at all (there\'s no BETWEEN, >, or < on it), so "range column last" does not obviously apply, and the phrasing gives no explicit guidance for a pure sort column. Under the ESR (Equality, Sort, Range) rule, the answer is immediate: updated_at is a SORT column here (used only in ORDER BY, with no filtering role), so it takes the SECOND position, right after the equality column — CREATE INDEX idx ON some_table (tenant_id, updated_at DESC). This lets the database narrow to the tenant\'s rows via the equality match, then walk them already in the correct sort order with no separate sort step, exactly the case the two-part rule\'s wording leaves unclear.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A column used only in ORDER BY (no WHERE-clause range predicate on it at all) doesn\'t need special placement consideration in a composite index — it just goes wherever fits.',
      reality: 'Per this subtopic\'s theory, a pure sort column has its own dedicated middle position in the ESR (Equality, Sort, Range) rule, placed right after equality columns — placing it correctly lets the database skip a separate sort operation entirely.'
    },
    {
      thought: '"Range column last" and "sort column" refer to the same thing — any column after the equality columns in the rule is just called different names.',
      reality: 'Per this subtopic\'s theory, sort and range are functionally different roles a column can play, with genuinely different positions when they apply to DIFFERENT columns in the same query — sort comes second, range comes third/last, and conflating the two loses the practical guidance for queries that only sort without range-filtering.'
    },
    {
      thought: 'The main page\'s "equality first, range last" phrasing is simply wrong and should be discarded.',
      reality: 'Per this subtopic\'s theory, the phrasing is correct as far as it goes — it just omits the middle SORT case. When a query\'s sort column and range column happen to be the SAME column (a common case), the two-part rule and the three-part ESR rule agree completely; the gap only shows up for queries that sort without range-filtering, or that sort and range-filter on two DIFFERENT columns.'
    }
  ];
}
