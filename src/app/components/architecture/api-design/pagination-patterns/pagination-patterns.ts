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
  { name: 'Offset Pagination',  type: 'keyword', desc: '?page=2&limit=20 — easy to implement, inconsistent with concurrent inserts/deletes.' },
  { name: 'Cursor Pagination',  type: 'keyword', desc: '?cursor=eyJpZCI6NDJ9&limit=20 — stable for real-time feeds, no skipped/duplicate rows.' },
  { name: 'Keyset Pagination',  type: 'keyword', desc: 'WHERE id > lastId ORDER BY id LIMIT 20 — fastest for deep pages on indexed columns.' },
  { name: 'next / prev links',  type: 'keyword', desc: 'Response includes links to the next and previous pages (HATEOAS pagination).' },
  { name: 'total',              type: 'keyword', desc: 'Total count of matching records — needed for "page X of Y" UI but expensive on large tables.' },
  { name: 'hasNextPage',        type: 'keyword', desc: 'Fetch limit+1 items; if count > limit, hasNextPage is true and drop the last item.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Offset / Page Pagination',
    points: [
      'The simplest pattern: ?page=2&limit=20 translates to SQL OFFSET 20 LIMIT 20.',
      'Advantages: easy to implement, supports jumping to any page number, familiar to users ("go to page 5").',
      'Disadvantages: unstable with concurrent writes — if a row is inserted before the current page, the next page skips one row; if one is deleted, a row appears twice. At deep offsets, the database scans and discards many rows before returning results (O(offset) scan).',
      'Use when: data changes infrequently, the dataset is small-to-medium, and users need to navigate to arbitrary page numbers (admin tables, search results).',
    ],
  },
  {
    heading: 'Cursor Pagination',
    points: [
      'The cursor is an opaque token (often base64-encoded JSON: `{"id": 42, "createdAt": "2024-01-15"}`) that encodes the position of the last item seen.',
      'Clients pass ?cursor=eyJpZC...}&limit=20 to get the next page. The server decodes the cursor and fetches items "after" that position.',
      'Advantages: stable — inserts/deletes before the cursor don\'t affect the current page. No O(offset) scan — the query uses an indexed WHERE clause. Infinite scroll and real-time feeds benefit most.',
      'Disadvantages: cannot jump to page 5 directly; no total count (or expensive to compute); cursor-based navigation only (next/previous, not arbitrary).',
      'Use when: data changes frequently (feeds, activity streams), or you need deep pagination performance.',
    ],
  },
  {
    heading: 'Keyset Pagination',
    points: [
      'A specific cursor implementation using the primary key (or a unique indexed column) directly: WHERE id > :lastId ORDER BY id LIMIT 20.',
      'Fastest option for sequential traversal — the database uses the index directly, no full-table scan.',
      'Works best when paginating in a single direction (forward) and the ordering column is indexed.',
      'Can be extended to multi-column keys: WHERE (createdAt, id) > (:lastCreatedAt, :lastId) for stable sort on non-unique columns.',
      'Use when: exporting large datasets, ETL jobs, or any sequential traversal where page-jumping is not needed.',
    ],
  },
  {
    heading: 'Response Envelope Design',
    points: [
      'Always wrap paginated results in an envelope with metadata: `{ data: [...], pagination: { page, limit, total, pages } }`.',
      'Include next/prev links (HATEOAS): `{ links: { next: "/users?page=3&limit=20", prev: "/users?page=1&limit=20" } }`.',
      'Avoid returning total count for cursor pagination on large datasets — COUNT(*) on millions of rows is expensive. Return hasNextPage instead.',
      'The "fetch limit+1" trick for hasNextPage: request 21 items when the limit is 20. If you get 21 back, there is a next page — drop the 21st from the response.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Offset Pagination',
    language: 'typescript',
    code: `// Offset / page pagination
app.get('/users', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    db.users.findMany({ skip: offset, take: limit, orderBy: { createdAt: 'desc' } }),
    db.users.count(),
  ]);

  const pages = Math.ceil(total / limit);
  res.json({
    data: users,
    pagination: {
      page, limit, total, pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
    links: {
      next: page < pages  ? \`/users?page=\${page + 1}&limit=\${limit}\` : null,
      prev: page > 1      ? \`/users?page=\${page - 1}&limit=\${limit}\` : null,
    },
  });
});`,
  },
  {
    label: 'Cursor Pagination',
    language: 'typescript',
    code: `// Cursor pagination — stable for real-time data

interface Cursor { id: number; createdAt: string; }

function encodeCursor(item: { id: number; createdAt: Date }): string {
  return Buffer.from(JSON.stringify({ id: item.id, createdAt: item.createdAt })).toString('base64url');
}
function decodeCursor(cursor: string): Cursor {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString());
}

app.get('/feed', async (req, res) => {
  const limit  = Math.min(50, parseInt(req.query.limit as string) || 20);
  const cursor = req.query.cursor as string | undefined;

  const where = cursor
    ? { createdAt: { lt: decodeCursor(cursor).createdAt } }  // items before the cursor
    : {};

  // Fetch limit+1 to detect hasNextPage without COUNT(*)
  const items = await db.posts.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });

  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, limit) : items;
  const nextCursor = hasNextPage ? encodeCursor(data[data.length - 1]) : null;

  res.json({
    data,
    pagination: { limit, hasNextPage, nextCursor },
    links: { next: nextCursor ? \`/feed?cursor=\${nextCursor}&limit=\${limit}\` : null },
  });
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Returning all records without pagination',
    wrong: `app.get('/users', async (req, res) => {
  const users = await db.users.findAll(); // could return millions of rows
  res.json(users);
});`,
    right: `app.get('/users', async (req, res) => {
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const users = await db.users.findMany({ take: limit, skip: offset });
  res.json({ data: users, pagination: { ... } });
});`,
    explanation: 'Returning all records crashes the server on large datasets, times out clients, and wastes bandwidth. Always paginate collections with a sensible default (20) and maximum (100) limit.',
  },
  {
    title: 'Not validating and capping the limit parameter',
    wrong: `const limit = parseInt(req.query.limit); // attacker sends ?limit=100000`,
    right: `const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));`,
    explanation: 'Without capping, a client can request 100,000 records in one call, causing memory issues and database strain. Always enforce a maximum limit and default to a reasonable value.',
  },
  {
    title: 'Using offset pagination for real-time feeds',
    wrong: `// Page 2 skips rows if new items were inserted since page 1 was fetched
GET /feed?page=2&limit=20`,
    right: `// Cursor pagination is stable — no missed or duplicate rows
GET /feed?cursor=eyJpZCI6NDJ9&limit=20`,
    explanation: 'For real-time feeds (social media, activity streams) where data changes constantly, offset pagination causes missed rows (if items are inserted) or duplicates (if items are deleted). Cursor pagination anchors to the last item seen — inserts before it don\'t affect subsequent pages.',
  },
  {
    title: 'Counting all rows on every paginated request',
    wrong: `const [data, total] = await Promise.all([
  db.posts.findMany({ take: limit, skip: offset }),
  db.posts.count(), // COUNT(*) on 10M rows — slow every request
]);`,
    right: `// Use hasNextPage instead of total count for cursor pagination
const items = await db.posts.findMany({ take: limit + 1, ... });
const hasNextPage = items.length > limit;`,
    explanation: 'COUNT(*) on large tables is slow and locks resources. For cursor pagination, use the "fetch N+1" trick — if you get N+1 results, there is a next page. Return hasNextPage instead of total. For offset pagination with a total count, cache or approximate it.',
  },
];

const challenge: Challenge = {
  title: 'Pagination Builder',
  language: 'typescript',
  description: `Implement buildPaginationMeta(items: number[], page: number, limit: number, total: number): object that returns:
{ page, limit, total, pages, hasNext, hasPrev, data: items.slice(0, limit) }
Where pages = Math.ceil(total / limit), hasNext = page < pages, hasPrev = page > 1.`,
  hints: [
    'Calculate pages = Math.ceil(total / limit)',
    'hasNext: page < pages; hasPrev: page > 1',
    'data should be sliced to limit length',
  ],
  starterCode: `function buildPaginationMeta(items: number[], page: number, limit: number, total: number) {
  // TODO: build pagination metadata
  return {};
}`,
  solution: `function buildPaginationMeta(items: number[], page: number, limit: number, total: number) {
  const pages = Math.ceil(total / limit);
  return {
    data: items.slice(0, limit),
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
}

console.log(buildPaginationMeta([1,2,3,4,5], 2, 5, 23));
// { data: [1,2,3,4,5], pagination: { page: 2, limit: 5, total: 23, pages: 5, hasNext: true, hasPrev: true } }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which pagination strategy is most stable for real-time activity feeds?',
    options: [
      'Offset pagination (?page=2&limit=20) — simple and familiar',
      'Cursor pagination (?cursor=opaque&limit=20) — stable regardless of concurrent writes',
      'Keyset pagination — best for jumping to any page',
      'No pagination — return all items and let the client slice',
    ],
    answer: 1,
    explanation: 'Cursor pagination is stable for real-time feeds because it anchors to the last item seen, not an arbitrary row offset. With offset pagination, new inserts shift all rows — page 2 may skip or repeat items from page 1. Cursor pagination is immune to this.',
  },
  {
    q: 'How do you detect "hasNextPage" without running a COUNT(*) query?',
    options: [
      'Always return totalCount and compare to (page * limit)',
      'Request limit+1 items; if you get more than limit, there is a next page — drop the extra',
      'Check if the returned array length equals limit',
      'Run a separate EXISTS query',
    ],
    answer: 1,
    explanation: 'Requesting N+1 items is the standard trick. If the query returns more than N results, there is at least one more page. Slice the response to N items before returning. This avoids a potentially slow COUNT(*) on large tables while still accurately detecting the next page.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use offset vs cursor pagination?',
    a: '<strong>Offset pagination</strong>: use for stable datasets where users need to jump to arbitrary pages — search results, admin data tables, product catalogs. Simple to implement and familiar. <strong>Cursor pagination</strong>: use for real-time or frequently updated datasets where stability matters — social media feeds, activity streams, notifications. Also use for very large datasets where deep offset scans are slow. <strong>Keyset pagination</strong>: use for sequential data exports or ETL where you traverse all records in one direction and need maximum throughput.',
  },
  {
    q: 'Should I include a total count in paginated responses?',
    a: 'For offset pagination: yes, include <code>total</code> and <code>pages</code> — the UI needs this for "Page 2 of 47" displays and page navigation controls. For cursor pagination: avoid it — <code>COUNT(*)</code> on millions of rows is expensive and blocks. Return <code>hasNextPage</code> instead. For infinite scroll UIs with cursor pagination, <code>hasNextPage</code> is all you need — there\'s no "page 5 of 47" to display. If you must return a total count for cursor pagination, cache it or approximate it (hyperloglog, cached daily).',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Offset pagination is simple but unstable with concurrent writes; cursor pagination is stable for real-time feeds; keyset pagination is fastest for deep sequential traversal.',
  mustKnow: [
    'Offset (?page=N&limit=20): simple, supports page jumping, unstable with concurrent inserts/deletes',
    'Cursor (?cursor=opaque&limit=20): stable, no O(offset) scan, no page jumping',
    'Keyset (WHERE id > lastId LIMIT 20): fastest for sequential traversal on indexed columns',
    'Always cap limit: Math.min(100, parseInt(limit) || 20)',
    'hasNextPage trick: fetch limit+1 items; if count > limit, hasNextPage = true',
    'Include pagination envelope: { data, pagination: { page, limit, total, pages } }',
  ],
  interviewFocus: [
    'What is the problem with offset pagination for real-time feeds?',
    'How does cursor pagination work and what are its limitations?',
    'How do you detect hasNextPage without a COUNT(*) query?',
  ],
};

@Component({
  selector: 'app-api-pagination-patterns',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './pagination-patterns.html',
  styleUrl: './pagination-patterns.scss',
})
export class ApiPaginationPatterns {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
