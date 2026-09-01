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
    heading: 'Quiz Q5 Names Every Type — Never Shown as a Working Resolver',
    points: [
      'Quiz Q5’s own explanation lists the Relay Connection spec’s exact shape: "Connection: has edges and pageInfo. Edge: a wrapper around each item with the node and its cursor. Node: the actual data item. PageInfo: has hasNextPage, hasPreviousPage, startCursor, endCursor." No codeTab on the page ever implements a resolver returning this shape.',
      'Verified against the Relay Cursor Connections specification itself: <code>PageInfo</code> has exactly those four fields; an <code>Edge</code> has exactly <code>node</code> and <code>cursor</code>; forward pagination uses <code>first</code>/<code>after</code>, backward pagination uses <code>last</code>/<code>before</code> — a field returning a Connection must support forward args, backward args, or both.',
      'This subtopic builds the piece the quiz’s own worked example queries against — <code>{ orders(first: 10, after: cursor) { edges { node { id total } cursor } pageInfo { hasNextPage endCursor } } }</code> — as an actual resolver function.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Relay-Spec-Compliant Connection Resolver',
    language: 'typescript',
    code: `interface Order { id: string; total: number; createdAt: string; }

interface Edge<T> { node: T; cursor: string; }
interface PageInfo { hasNextPage: boolean; hasPreviousPage: boolean; startCursor: string | null; endCursor: string | null; }
interface Connection<T> { edges: Edge<T>[]; pageInfo: PageInfo; }

function encodeCursor(id: string): string {
  return Buffer.from(\`order:\${id}\`).toString('base64');
}
function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf8').replace('order:', '');
}

async function ordersConnection(args: {
  first?: number; after?: string;
  last?: number;  before?: string;
}): Promise<Connection<Order>> {
  // Forward pagination: first + after
  if (args.first !== undefined) {
    const afterId = args.after ? decodeCursor(args.after) : null;
    const orders = await db.orders.findMany({
      where: afterId ? { id: { gt: afterId } } : {},
      orderBy: { id: 'asc' },
      take: args.first + 1, // fetch one extra to detect hasNextPage
    });
    const hasNextPage = orders.length > args.first;
    const page = hasNextPage ? orders.slice(0, args.first) : orders;
    const edges: Edge<Order>[] = page.map(o => ({ node: o, cursor: encodeCursor(o.id) }));
    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: Boolean(args.after), // a cursor was given, so earlier pages exist
        startCursor: edges[0]?.cursor ?? null,
        endCursor: edges[edges.length - 1]?.cursor ?? null,
      },
    };
  }

  // Backward pagination: last + before (mirrors forward, reversed)
  const beforeId = args.before ? decodeCursor(args.before) : null;
  const orders = await db.orders.findMany({
    where: beforeId ? { id: { lt: beforeId } } : {},
    orderBy: { id: 'desc' },
    take: (args.last ?? 10) + 1,
  });
  const hasPreviousPage = orders.length > (args.last ?? 10);
  const page = (hasPreviousPage ? orders.slice(0, args.last) : orders).reverse();
  const edges: Edge<Order>[] = page.map(o => ({ node: o, cursor: encodeCursor(o.id) }));
  return {
    edges,
    pageInfo: {
      hasNextPage: Boolean(args.before),
      hasPreviousPage,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    },
  };
}

// Answers exactly the quiz's own worked example query:
// { orders(first: 10, after: cursor) { edges { node { id total } cursor } pageInfo { hasNextPage endCursor } } }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A client calls <code>ordersConnection({ first: 5 })</code> with NO <code>after</code> cursor at all — the very first page. What does <code>pageInfo.hasPreviousPage</code> come back as, and is that actually correct?',
  hint: 'Look at how <code>hasPreviousPage</code> is computed in the forward-pagination branch above — what exactly is it checking?',
  solution: `// hasPreviousPage comes back as false, via "Boolean(args.after)" --
// args.after is undefined on the very first request, so
// Boolean(undefined) is false.

// This is correct for THIS specific implementation's assumption:
// treating "a cursor was supplied at all" as a proxy for "there is
// definitely an earlier page." It's a reasonable simplification, but
// worth being precise about what it does NOT verify: it doesn't
// re-check the DATABASE to confirm items actually exist before the
// given cursor -- it only reflects "does earlier context appear
// to exist based on how this specific request was shaped."

// For the "no after, first page" case specifically, this is exactly
// right: no cursor was given, so there is no earlier context this
// request could be continuing, and false is the accurate answer. The
// same shortcut becomes worth double-checking only in an edge case
// where a client might supply an "after" cursor pointing at what
// happens to be the very first row already -- worth reasoning
// through explicitly for any production implementation, even though
// it doesn't affect the basic case traced here.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A Relay Connection’s "cursor" field on each edge and the pagination "after"/"before" arguments are two different concepts.',
    reality: 'They are the SAME opaque token, used in two different roles — the codeTab above’s <code>encodeCursor</code>/<code>decodeCursor</code> pair is used both to produce each edge’s own <code>cursor</code> field AND to decode an incoming <code>after</code>/<code>before</code> argument. A client’s next request literally reuses the <code>cursor</code> value it received on a previous edge.',
  },
  {
    thought: 'A single resolver only needs to support EITHER forward pagination (first/after) OR backward pagination (last/before), never both.',
    reality: 'The spec explicitly allows (and the codeTab above implements) supporting BOTH directions on the same Connection field — the resolver branches on whether <code>args.first</code> is present to decide which direction the client is requesting, letting the same field serve infinite-scroll-forward and jump-to-the-end-then-scroll-backward use cases.',
  },
  {
    thought: '<code>PageInfo</code>’s <code>startCursor</code>/<code>endCursor</code> and each individual edge’s own <code>cursor</code> field serve different purposes.',
    reality: '<code>startCursor</code> and <code>endCursor</code> are literally just the <code>cursor</code> value of the FIRST and LAST edge in the current page (confirmed in the codeTab’s own <code>edges[0]?.cursor</code> / <code>edges[edges.length - 1]?.cursor</code>) — they exist as a convenience so a client doesn’t need to reach into the <code>edges</code> array just to find the boundary cursors for the current page.',
  },
];

@Component({
  selector: 'app-api-pagination-relay',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-relay-connection-graphql-resolver.html',
  styleUrl: './a-real-relay-connection-graphql-resolver.scss',
})
export class ARealRelayConnectionGraphqlResolverSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
