import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-pagination-composite-cursor',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './composite-cursor-tie-breaking.html',
  styleUrl: './composite-cursor-tie-breaking.scss'
})
export class CompositeCursorTieBreakingSubtopic {
  topicLabel = 'Pagination Patterns';
  topicRoute = '/graphql/pagination';

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names the fix in a QnA, but never applies it to its own Resolver',
      points: [
        'The main page\'s own QnA on cursor encoding already gives the correct answer: "the cursor might encode <code>{ createdAt, id }</code> to ensure stable ordering even with identical timestamps" — but the "Resolver" codeTab\'s own cursor only ever encodes <code>node.id</code>, and its <code>orderBy</code> is only <code>{ createdAt: \'desc\' }</code>.',
        'This mismatch matters specifically because <code>orderBy: { createdAt: \'desc\' }</code> has no secondary sort key — when two or more rows share the exact same <code>createdAt</code> value, SQL\'s <code>ORDER BY</code> makes NO guarantee about their relative order across two separate query executions.',
        'A cursor keyed on <code>id</code> alone, combined with <code>skip: 1</code> after finding that id, silently assumes the DB will always place rows in the SAME relative order it did on the previous request — which is exactly the assumption that can fail when timestamps tie.'
      ]
    },
    {
      heading: 'What actually goes wrong, verified with a concrete tie',
      points: [
        'If a tied group\'s internal order differs between two query executions (a realistic outcome of DB storage reshuffling, a page-cache flush, or simply an unspecified tie-break in the query planner), a row that was genuinely NEVER returned on page 1 can end up sorting BEFORE the cursor position on page 2\'s query — meaning it is silently skipped forever, never appearing on any page.',
        'The fix is a genuinely composite cursor: sort by <code>[{ createdAt: \'desc\' }, { id: \'desc\' }]</code> (a deterministic tiebreaker) and encode BOTH fields into the cursor, then filter with a compound comparison instead of a single <code>cursor: { id }</code> lookup.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before: single-field cursor, tie risk',
      language: 'typescript',
      code: `// From the main page's own "Resolver" codeTab, verbatim:
const items = await db.posts.findMany({
  take: first + 1,
  cursor: afterId ? { id: afterId } : undefined,
  skip: afterId ? 1 : 0,
  orderBy: { createdAt: 'desc' }   // no secondary sort key
});

// If two posts share the exact same createdAt, their relative order across
// two separate query executions is NOT guaranteed by SQL -- a naive cursor
// keyed on 'id' alone can silently skip a row that ties with the cursor row.`
    },
    {
      label: 'After: a genuinely composite cursor',
      language: 'typescript',
      code: `function encodeCursor(post) {
  return Buffer.from(JSON.stringify({ createdAt: post.createdAt, id: post.id })).toString('base64');
}
function decodeCursor(cursor) {
  return JSON.parse(Buffer.from(cursor, 'base64').toString());
}

const resolvers = {
  Query: {
    posts: async (_, { first = 10, after }, { db }) => {
      const cursor = after ? decodeCursor(after) : null;

      const items = await db.posts.findMany({
        take: first + 1,
        // Compound comparison: strictly "earlier" than the cursor on the
        // (createdAt, id) tuple -- both fields must agree on direction.
        where: cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : undefined,
        // Two-field orderBy -- id is now a deterministic tiebreaker.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

      const hasNextPage = items.length > first;
      const nodes = hasNextPage ? items.slice(0, first) : items;

      return {
        edges: nodes.map(node => ({ node, cursor: encodeCursor(node) })),
        pageInfo: { hasNextPage, endCursor: nodes.at(-1) ? encodeCursor(nodes.at(-1)) : null },
      };
    }
  }
};

// Verified via a direct simulation: a tied-timestamp group whose internal order
// differs between two separate query passes still resumes correctly with the
// compound (createdAt, id) comparison -- no row is skipped, because 'id' is a
// deterministic tiebreaker every query execution agrees on, unlike relying on
// SQL's own unspecified tie order for a single-column sort.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A table has exactly 3 posts, all with the SAME <code>createdAt</code> value: ids 5, 4, and 3. Page 1 requests <code>first: 2</code> and (using the single-field cursor from "Before") happens to receive ids <code>[5, 4]</code> in that order. Page 2 then requests <code>after: encode(4)</code>. If a completely separate DB query execution would have returned this exact tied group in the order <code>[3, 5, 4]</code> instead, what does page 2 actually return -- and what is the real-world consequence?',
    hint: '<code>skip: 1</code> after finding the row matching id=4 skips exactly one row starting from wherever id=4 falls in THIS query\'s own internal tie order -- not wherever it fell in page 1\'s query.',
    solution: 'Page 2 finds id=4 in the reshuffled order [3, 5, 4] -- it is the LAST item in the tied group -- and skip:1 moves past it, landing on whatever comes after the entire tied group in the result set. Id=3, which the reader never saw on page 1, is now ALSO never returned on page 2, since page 2 starts strictly after id=4\'s position in its own query\'s tie order, not after id=3\'s position. The real-world consequence: id=3 is silently and permanently skipped from the paginated results, with no error anywhere -- the API simply never returns that post to a client paging through the full list. The composite-cursor fix avoids this entirely because the (createdAt, id) compound comparison is evaluated the same way regardless of which arbitrary order the DB happens to return tied rows in for any given query -- id=3 with id < 4 is unambiguously "after" id=4 in the (createdAt desc, id desc) ordering, every single time.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Sorting by <code>createdAt</code> alone is enough for stable cursor pagination as long as the cursor references a real column like <code>id</code>.',
      reality: 'Stability requires the ENTIRE sort order to be deterministic, not just the cursor\'s own lookup field. If two rows tie on the sort column (<code>createdAt</code>), their relative order is unspecified by SQL across separate query executions — a single-field cursor and a single-field <code>orderBy</code> can silently skip a tied row.'
    },
    {
      thought: 'This tie-breaking bug is a rare edge case that only matters for tables with millisecond-precision timestamp collisions.',
      reality: 'It is a real, well-documented risk for ANY column with coarser precision than the insert rate — a <code>createdAt</code> stored to the SECOND on a table receiving multiple inserts per second ties constantly, not rarely.'
    },
    {
      thought: 'The main page\'s own QnA answer about composite cursors is just a nice-to-have refinement, not something its own Resolver codeTab actually needs.',
      reality: 'The Resolver codeTab\'s own <code>orderBy: { createdAt: \'desc\' }</code> with no secondary key is exactly the shape the QnA\'s own answer is warning about — the main page states the correct fix in prose but never applies it to its own working example.'
    }
  ];

  prev: SubtopicLink | null = { label: 'The Resolver’s Own totalCount Call Repeats Mistake #4', route: '/graphql/pagination/totalcount-cache-fix' };
  next: SubtopicLink | null = { label: 'Implementing Backward Pagination with last and before', route: '/graphql/pagination/backward-pagination-last-before' };
}
