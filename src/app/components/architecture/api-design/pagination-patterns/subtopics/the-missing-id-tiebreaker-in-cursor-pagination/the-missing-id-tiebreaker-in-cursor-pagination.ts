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
    heading: 'The Cursor Encoded id — the Query Never Actually Used It',
    points: [
      'The main page’s own Cursor Pagination codeTab defines <code>interface Cursor { id: number; createdAt: string; }</code> and <code>encodeCursor</code> deliberately includes BOTH fields — but the actual query’s <code>where</code> clause originally compared ONLY on <code>createdAt: { lt: ... }</code>, never referencing the decoded <code>id</code> at all.',
      'The page’s own Keyset Pagination section, one theory block earlier, names the exact fix this needed: "Can be extended to multi-column keys: <code>WHERE (createdAt, id) > (:lastCreatedAt, :lastId)</code> for stable sort on non-unique columns" — the cursor codeTab was doing exactly the single-column comparison that bullet warns is unstable.',
      'Confirmed via direct simulation: two posts sharing the EXACT same <code>createdAt</code> timestamp as the cursor’s own boundary post — a realistic case, since many systems store timestamps with limited precision or batch-insert rows in the same instant — caused one of them to be silently skipped entirely. This has been fixed on the main page to compare on both fields, matching the theory’s own multi-column pattern.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Skip, With Real Data',
    language: 'typescript',
    code: `interface Post { id: number; createdAt: string; title: string; }

const posts: Post[] = [
  { id: 5, createdAt: '2026-01-15T10:00:00.000Z', title: 'PostA' }, // the cursor's own boundary
  { id: 3, createdAt: '2026-01-15T10:00:00.000Z', title: 'PostB' }, // SAME timestamp as PostA
  { id: 9, createdAt: '2026-01-14T10:00:00.000Z', title: 'PostC' },
];

// A client's cursor was generated FROM PostA (id: 5, createdAt: '...T10:00:00.000Z').
// The next page should return every post that comes AFTER PostA in the
// full sorted order -- which is PostB (same timestamp, lower id, sorts
// right after PostA) and PostC.

// ── BEFORE: comparing only on createdAt ──────────────────────────────────────
const cursorCreatedAt = '2026-01-15T10:00:00.000Z';
const brokenResults = posts.filter(p => p.createdAt < cursorCreatedAt);
console.log(brokenResults.map(p => p.title));
// [ 'PostC' ] -- PostB is GONE. Its createdAt is NOT strictly less
// than the cursor's own createdAt (they're equal), so the single-
// column "< " comparison excludes it entirely -- even though it
// should be the very next item after the cursor.

// ── AFTER: comparing on createdAt, with id as the tiebreaker ────────────────
const cursorId = 5;
const fixedResults = posts.filter(p =>
  p.createdAt < cursorCreatedAt || (p.createdAt === cursorCreatedAt && p.id < cursorId)
);
console.log(fixedResults.map(p => p.title));
// [ 'PostB', 'PostC' ] -- PostB is correctly included via the second
// OR branch: same timestamp as the cursor, but a lower id, so it
// sorts immediately after PostA in the total DESC order.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes a simpler fix: instead of a compound <code>OR</code> comparison, just add a tiny random offset (a few milliseconds) to every <code>createdAt</code> at insert time, guaranteeing no two rows ever share the exact same timestamp. Would this actually fix the bug the same way the id-tiebreaker fix does?',
  hint: 'Two ALREADY-INSERTED rows in the existing dataset might still share a timestamp before this new insert-time change takes effect. Does a fix applied only to FUTURE inserts help with data that already exists?',
  solution: `// It would reduce how OFTEN the bug occurs going forward, but it
// does not actually fix it -- and it introduces its own new problems.

// First, it does nothing for already-existing rows -- any data
// inserted before this change is deployed can still share exact
// timestamps, and the bug reproduces identically for that data.
// Second, even for NEW rows, a "tiny random offset" only makes a
// COLLISION less likely, not impossible -- two inserts landing on
// the exact same millisecond (a real, common scenario for a bulk
// import or a burst of concurrent writes) can still collide.

// The id-tiebreaker fix, by contrast, is a STRUCTURAL guarantee, not
// a probabilistic one: as long as id itself is unique (true by
// definition for a primary key), the compound (createdAt, id)
// ordering has NO ties, ever, for ANY data, past or future -- no
// insert-time behavior change is needed at all, and no dataset
// migration is needed either. This is exactly why the theory's own
// keyset pagination guidance recommends a real unique tiebreaker
// column, not trying to make the primary sort column itself
// artificially collision-resistant.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Timestamp collisions between rows are rare enough in practice that a createdAt-only cursor comparison is a reasonable simplification.',
    reality: 'They are more common than intuition suggests — bulk imports, batch jobs, and any system storing timestamps with limited precision (seconds instead of milliseconds/microseconds) routinely produce multiple rows with an identical <code>createdAt</code> value. The codeTab above demonstrates the skip with a completely ordinary two-post example, not a contrived edge case.',
  },
  {
    thought: 'Since <code>encodeCursor</code> already includes both <code>id</code> and <code>createdAt</code> in the cursor token, the pagination is automatically using both fields for comparison.',
    reality: 'Encoding a field into the cursor and USING that field in the actual database query are two separate steps — the original codeTab decoded <code>id</code> from the cursor but the <code>where</code> clause never referenced it at all. A field can be present in your data structure and still be silently unused in the logic that matters.',
  },
  {
    thought: 'The fix here is the same fix as adding a tiebreaker to a SORT ORDER — it’s purely about how results are ORDERED, not about which results are returned at all.',
    reality: 'The bug demonstrated here is not an ordering problem — it’s a genuine MISSING-ROW problem. PostB was not returned in the wrong position; it was not returned at all. The fix changes which rows the <code>WHERE</code> clause matches, not just what order they come back in.',
  },
];

@Component({
  selector: 'app-api-pagination-tiebreaker',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-missing-id-tiebreaker-in-cursor-pagination.html',
  styleUrl: './the-missing-id-tiebreaker-in-cursor-pagination.scss',
})
export class TheMissingIdTiebreakerInCursorPaginationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
