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
    heading: 'Named as an Alternative — Only the Offset Version Ever Gets Built',
    points: [
      'The main page’s own theory names cursor-based pagination directly: <code>?cursor=eyJpZCI6NDJ9&limit=20</code>. The main page’s own codeTab, however, only ever implements OFFSET-based pagination (<code>skip</code>/<code>take</code> from a <code>page</code> number) — cursor-based pagination is named but never built anywhere on the page.',
      'Decoded, <code>eyJpZCI6NDJ9</code> is base64 for <code>{"id":42}</code> (confirmed via direct execution) — a cursor is typically an opaque, encoded pointer to "the last item the client already saw," not a page NUMBER at all.',
      'The main page’s own theory names the exact reason offset pagination is risky: "a record can shift pages between requests" under concurrent inserts/deletes — this subtopic builds the cursor-based alternative that specifically avoids that failure mode, by anchoring to a stable item rather than a numeric position.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Cursor-Based Pagination — Encoding and Decoding',
    language: 'typescript',
    code: `interface Cursor { id: string; createdAt: string; }

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

function decodeCursor(encoded: string): Cursor {
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
}

// Decoding the main page's own theory example directly, byte for byte:
console.log(Buffer.from('eyJpZCI6NDJ9', 'base64').toString('utf8'));
// '{"id":42}' -- confirmed via direct execution. A cursor is just a
// JSON object (here, "the id of the last item seen") encoded so it
// can travel safely as one opaque query-string value.`,
  },
  {
    label: 'The Actual Endpoint — Anchored to a Stable Item, Not a Page Number',
    language: 'typescript',
    code: `router.get('/orders', authenticate, async (req, res) => {
  const { cursor, limit = '20' } = req.query as Record<string, string>;
  const take = parseInt(limit, 10);

  // A stable sort order is required -- "createdAt" alone is NOT
  // unique (two orders can share a timestamp), so id is included as
  // a tiebreaker to guarantee a total, unambiguous ordering.
  const where = cursor
    ? (() => {
        const { id, createdAt } = decodeCursor(cursor);
        // "everything strictly after the cursor's own position" --
        // compares BOTH fields together, not createdAt alone, so two
        // same-timestamp orders don't get skipped or duplicated.
        return {
          OR: [
            { createdAt: { gt: createdAt } },
            { createdAt, id: { gt: id } },
          ],
        };
      })()
    : {};

  const orders = await db.orders.findMany({
    where,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: take + 1, // fetch one extra to detect whether more pages exist
  });

  const hasMore = orders.length > take;
  const page = hasMore ? orders.slice(0, take) : orders;
  const nextCursor = hasMore
    ? encodeCursor({ id: page[page.length - 1].id, createdAt: page[page.length - 1].createdAt })
    : null;

  res.json({ data: page, nextCursor });
});

// Unlike offset pagination's "skip: (page - 1) * limit", NOTHING
// here depends on how many items exist BEFORE the cursor position --
// a newly-inserted or newly-deleted row anywhere earlier in the
// result set has zero effect on where this query resumes from.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A client fetches page 1 (orders 1–20, offset-based, <code>page=1&limit=20</code>). Before fetching page 2, ANOTHER user deletes order #5. The client then requests <code>page=2&limit=20</code>. Trace what goes wrong. Now trace the SAME scenario using the cursor-based endpoint above, where the client’s cursor was set from order #20’s own id/createdAt. Does the same problem occur?',
  hint: 'Offset pagination’s <code>skip: (page - 1) * limit</code> literally means "skip the first N rows of the CURRENT result set" — does deleting a row earlier in that set change what "the first 20 rows" even means?',
  solution: `// Offset-based: page 1 originally returned orders #1-20. Deleting
// order #5 shrinks the table by one row -- what USED to be order #21
// (the first row of the "real" page 2) now shifts down to become row
// #20 of the table's current ordering. Requesting page=2 (skip: 20)
// now skips the NEW first 20 rows -- which is actually the OLD rows
// #2-21 shifted -- meaning the client sees order #21 TWICE (once
// would-be on the tail of a re-fetched page 1, and again at the head
// of page 2) while never seeing whatever was originally at position
// #41. The client silently gets a duplicate and silently misses an
// item, with no error anywhere.

// Cursor-based: the client's cursor encodes order #20's own id and
// createdAt directly -- not "skip 20 rows." The WHERE clause asks
// for "everything with a later createdAt than order #20's, tie-broken
// by id" -- deleting order #5 (which sorts BEFORE the cursor
// position) has literally zero effect on this query, since #5 was
// never part of what the cursor is anchored to at all. The client
// correctly resumes exactly where it left off, regardless of what
// happened to rows before that point.

// This is the concrete mechanism behind the main page's own theory
// claim ("cursor-based pagination avoids this by anchoring to a
// stable position") -- the cursor anchors to an ITEM's identity, not
// a numeric COUNT of rows that shifts as the underlying data changes.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A cursor is just a fancier name for a page number — it still represents "how far into the results" the client has gotten.',
    reality: 'A cursor encodes the IDENTITY of the last item the client saw (in the codeTab above, its <code>id</code> and <code>createdAt</code>) — not a count or position. The WHERE clause built from it (<code>createdAt > X OR (createdAt = X AND id > Y)</code>) asks a fundamentally different question than offset pagination’s "skip N rows" — "what comes after THIS SPECIFIC ITEM," not "what is at THIS NUMERIC POSITION."',
  },
  {
    thought: 'Sorting by a single field like createdAt is enough to make cursor pagination reliable.',
    reality: 'The codeTab above deliberately includes <code>id</code> as a TIEBREAKER in both the sort order and the cursor comparison — two rows can share the exact same <code>createdAt</code> timestamp, and without a unique tiebreaker field, the boundary between pages becomes ambiguous, risking the same skip/duplicate failure mode cursor pagination exists to avoid.',
  },
  {
    thought: 'Fetching exactly <code>take</code> items is enough to build a paginated response — the client can just check if the returned array is empty to know it reached the end.',
    reality: 'The codeTab above deliberately fetches <code>take + 1</code> items and only returns <code>take</code> of them — this is what lets it determine <code>hasMore</code> and produce a <code>nextCursor</code> in the SAME request, without a separate round-trip. Fetching exactly <code>take</code> items would leave the client unable to tell "there are exactly 20 results" apart from "there are MORE than 20 results" until it makes one more, likely-empty request.',
  },
];

@Component({
  selector: 'app-api-resource-url-cursor',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './cursor-based-pagination-actually-implemented.html',
  styleUrl: './cursor-based-pagination-actually-implemented.scss',
})
export class CursorBasedPaginationActuallyImplementedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
