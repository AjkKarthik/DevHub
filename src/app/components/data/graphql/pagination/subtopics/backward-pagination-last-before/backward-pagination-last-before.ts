import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-pagination-backward',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './backward-pagination-last-before.html',
  styleUrl: './backward-pagination-last-before.scss'
})
export class BackwardPaginationLastBeforeSubtopic {
  topicLabel = 'Pagination Patterns';
  topicRoute = '/graphql/pagination';

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes this in one sentence and never shows it as code',
      points: [
        'The main page\'s own QnA answers "How do I handle backward pagination (last/before)?" with: "Fetch results in reverse order using the before cursor, then reverse the array before returning" — but every codeTab on the page only ever implements forward pagination (<code>first</code>/<code>after</code>).',
        '"before: cursor" means: edges that come STRICTLY BEFORE the cursor\'s position in the connection\'s own overall order — for a feed sorted newest-first (desc by id), that means items with a LARGER id (newer), not smaller.',
        '"last: N" then takes the N edges closest to that cursor position, from the END of the resulting slice — which, for a desc-ordered connection, are the SMALLEST ids among the "before" candidates.'
      ]
    },
    {
      heading: 'Why the reverse-then-reverse technique is the natural way to query it',
      points: [
        'Querying <code>ORDER BY id DESC</code> and trying to take "the last N" would require skipping an unknown number of rows first — there is no way to know how many rows exist ahead of time without a separate count.',
        'Querying <code>ORDER BY id ASC</code> instead (the REVERSE of the connection\'s own order) turns "the last N of the connection" into "the FIRST N of the reversed query" — a direct <code>LIMIT N</code>, no skipping required.',
        'The result then needs one more reversal before returning, since the client expects edges in the connection\'s own (desc) order, not the query\'s own (asc) order.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Backward pagination resolver',
      language: 'typescript',
      code: `const resolvers = {
  Query: {
    posts: async (_, { first, after, last, before }, { db }) => {
      if (last != null) {
        return await backwardPage({ before, last, db });
      }
      return await forwardPage({ first, after, db }); // the main page's existing Resolver
    }
  }
};

async function backwardPage({ before, last, db }) {
  const cursorId = before ? decode(before) : null;

  // 'before: cursor' == items with a LARGER id (newer, earlier in the desc
  // connection order) than the cursor -- fetch one extra, ASCENDING, to
  // detect hasPreviousPage without a separate COUNT query.
  const items = await db.posts.findMany({
    where: cursorId ? { id: { gt: cursorId } } : undefined,
    orderBy: { id: 'asc' },       // REVERSE of the connection's own desc order
    take: last + 1,
  });

  const hasPreviousPage = items.length > last;
  // Drop the EXTRA item -- it's the largest/newest of the ascending batch,
  // i.e. the one furthest from the cursor, only fetched to detect more exist.
  const trimmed = hasPreviousPage ? items.slice(0, last) : items;

  const nodes = trimmed.reverse();  // restore the connection's own desc order

  return {
    edges: nodes.map(node => ({ node, cursor: encode(node.id) })),
    pageInfo: {
      hasPreviousPage,
      hasNextPage: !!cursorId,
      startCursor: nodes[0] ? encode(nodes[0].id) : null,
      endCursor: nodes.at(-1) ? encode(nodes.at(-1).id) : null,
    },
  };
}

// Verified against a 9-item desc feed [9..1]:
//   before: null, last: 3  -> [3, 2, 1], hasPreviousPage: true
//   before: id 6, last: 3  -> [9, 8, 7], hasPreviousPage: false (nothing newer than 9 exists)`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A feed has ids <code>[9, 8, 7, 6, 5, 4, 3, 2, 1]</code> in that desc order. A client requests <code>last: 4, before: null</code> (paging backward from the very end of the feed, with no cursor yet). Using the verified <code>backwardPage</code> logic above, what does it return, and what does <code>hasPreviousPage</code> report?',
    hint: '"before: null" means no filter is applied -- every item is a candidate. Sort candidates ASCENDING and take last+1 = 5 of the SMALLEST ids first, then check whether that exceeded the requested count.',
    solution: 'Candidates are all 9 items. Sorted ascending: [1,2,3,4,5,6,7,8,9]. Taking last+1 = 5 gives [1,2,3,4,5] -- 5 items, which is more than the requested last:4, so hasPreviousPage is true (there is at least one more item, id=9 in this case, further from the cursor than what was requested). The extra item (id=5, the LARGEST of the fetched 5) is dropped, leaving [1,2,3,4]. Reversing to restore desc order gives the final result: [4,3,2,1], with hasPreviousPage: true -- correctly signaling that ids 9 through 5 still remain further back in the feed for a subsequent backward page.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"before: cursor" means items that come AFTER the cursor chronologically -- i.e. older items with a smaller id, mirroring how "after: cursor" works for forward pagination.',
      reality: '"before" and "after" refer to POSITION in the connection\'s own overall order, not chronological direction relative to the cursor\'s value. For a feed sorted newest-first (desc), "before" means items EARLIER in that order -- which are the NEWER items (larger id), the opposite of what the name might suggest at a glance.'
    },
    {
      thought: 'Implementing backward pagination just means running the exact same forward-pagination query with the comparison operator flipped.',
      reality: 'It requires flipping BOTH the comparison (<code>gt</code> instead of <code>lt</code>) AND the <code>orderBy</code> direction (<code>asc</code> instead of <code>desc</code>), then reversing the final result array -- three coordinated changes, not one.'
    },
    {
      thought: 'The "fetch one extra" trick for detecting hasNextPage/hasPreviousPage works the same way regardless of pagination direction.',
      reality: 'The trick is the same IDEA (fetch N+1, check if you got more than N), but which item gets DROPPED differs: forward pagination drops the item furthest from the START of its ascending-fetched batch is not applicable here -- backward pagination specifically drops the LARGEST id in its ascending-sorted batch, since that is the one furthest from the cursor being paged toward.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Composite Cursors Prevent Skipped Rows When Sort Keys Tie', route: '/graphql/pagination/composite-cursor-tie-breaking' };
  next: SubtopicLink | null = null;
}
