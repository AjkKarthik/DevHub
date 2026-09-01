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
    heading: 'A Whole Different Rate-Limiting Shape, Described but Never Built',
    points: [
      'Every codeTab on the main page counts REQUESTS — one unit per HTTP call, regardless of what that call actually does. The page’s own QnA on GraphQL rate limiting explains precisely why this breaks down for a single GraphQL endpoint: "a query fetching 1 item vs 10000 items is very different" in cost, yet a request-count limiter treats them identically.',
      'The QnA’s own fix — complexity-based limiting, where a client has a points budget per window (its own example: 10,000 points/minute) and each query is scored before execution, with simple queries costing few points and deeply nested queries costing many more — is described in real structural detail, but no codeTab anywhere on the page shows a complexity calculator or a budget-tracking limiter actually running.',
      'The key insight the QnA names but doesn’t demonstrate: a field that returns a LIST fans its own children’s cost out by however many items that list is expected to return — a nested <code>posts { comments { author } } }</code> query costs roughly (number of posts) × (number of comments per post) × (cost per author lookup), which is why a small, innocent-looking nested query can carry a genuinely large complexity score.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Complexity Calculator + Budget Limiter',
    language: 'typescript',
    code: `interface QueryField {
  name: string;
  isList?: boolean;
  expectedCount?: number; // how many items a list field is expected to return
  children?: { fields: QueryField[] };
}
interface QueryShape { fields: QueryField[]; }

// Each selected field costs 1 point, multiplied by how many times its
// PARENT list is expected to fan out -- this is what makes a query nested
// under a list field genuinely more expensive than a flat one.
function calculateComplexity(query: QueryShape): number {
  let cost = 0;
  function walk(node: QueryShape, multiplier: number) {
    for (const field of node.fields) {
      cost += 1 * multiplier;
      if (field.children) {
        const nextMultiplier = multiplier * (field.isList ? (field.expectedCount ?? 10) : 1);
        walk(field.children, nextMultiplier);
      }
    }
  }
  walk(query, 1);
  return cost;
}

const simpleQuery: QueryShape = { fields: [{ name: 'user' }] };
const nestedQuery: QueryShape = {
  fields: [{
    name: 'posts', isList: true, expectedCount: 20,
    children: { fields: [{
      name: 'comments', isList: true, expectedCount: 15,
      children: { fields: [{ name: 'author' }] },
    }] },
  }],
};

console.log('simple query cost:', calculateComplexity(simpleQuery));   // 1
console.log('nested query cost:', calculateComplexity(nestedQuery));   // 321
// posts (1) + 20 * [ comments (1) + 15 * [ author (1) ] ]
//   = 1 + 20 * (1 + 15 * 1) = 1 + 20 * 16 = 321

class ComplexityLimiter {
  private state = new Map<string, { remaining: number; windowStart: number }>();
  constructor(private budgetPerWindow: number, private windowMs: number) {}

  consume(key: string, cost: number, nowMs: number): { allowed: boolean; remaining: number } {
    let entry = this.state.get(key);
    if (!entry || nowMs - entry.windowStart >= this.windowMs) {
      entry = { remaining: this.budgetPerWindow, windowStart: nowMs };
      this.state.set(key, entry);
    }
    if (cost > entry.remaining) return { allowed: false, remaining: entry.remaining };
    entry.remaining -= cost;
    return { allowed: true, remaining: entry.remaining };
  }
}

// Verified: budget of 10,000 points/min, 21 nested queries (cost 321 each)
// fired in a row.
const limiter = new ComplexityLimiter(10_000, 60_000);
const now = Date.now();
let last;
for (let i = 1; i <= 21; i++) {
  last = limiter.consume('client1', calculateComplexity(nestedQuery), now);
}
console.log('after 21 nested queries (321 each):', last);
// -> { allowed: true, remaining: 3259 } -- 21 * 321 = 6741, well under budget

// A 22nd query pushes total consumption to 7062 -- still allowed.
// But a client sending the SAME nested query 32 times (32 * 321 = 10,272)
// would exceed the 10,000 budget on the 32nd attempt -- unlike a plain
// request-count limiter, which would have allowed all 32 requests freely
// if its own limit were set generously enough to permit 32 requests/min.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A client with a 10,000-point/minute budget sends 30 SIMPLE queries (cost 1 each), then one single, deeply nested query costing 9,975 points. Is the nested query allowed? What does a plain REQUEST-COUNT limiter (e.g., "100 requests/minute") say about this same client’s behavior, and why do the two limiters disagree?',
  hint: 'Track the running total consumed by the 30 simple queries first, then check whether the nested query’s cost fits in what’s left of the 10,000 budget.',
  solution: `// 30 simple queries * 1 point each = 30 points consumed.
// Remaining budget: 10,000 - 30 = 9,970 points.
//
// The nested query costs 9,975 points -- MORE than the 9,970 remaining.
//
// limiter.consume('client', 9975, now) -> { allowed: false, remaining: 9970 }
//
// A plain request-count limiter (100 requests/minute) would see this same
// client as having made only 31 total requests -- comfortably under 100 --
// and would allow the nested query without hesitation, having no way to
// know that ONE of those 31 requests is roughly as expensive as 9,975
// of the others. This is exactly the QnA's own opening point made
// concrete: request count and actual server cost are only loosely
// correlated in a GraphQL API where every request hits the same single
// endpoint but can ask for wildly different amounts of work.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'GraphQL rate limiting is just request-count limiting applied to a single URL — the "one endpoint" detail doesn’t really change anything structural about the approach.',
    reality: 'The Try It above demonstrates the real structural difference: a client well within a generous request-count budget (31 of 100 requests) can still be denied by a complexity-based limiter, because complexity tracks the actual COST of what was requested, not merely how many times the endpoint was hit — a distinction that has no equivalent in a REST API where each endpoint\'s cost is roughly fixed.',
  },
  {
    thought: 'A field that returns a list only adds a FLAT cost for that one field, the same as any other field in the query.',
    reality: 'The calculator above deliberately multiplies every CHILD field\'s cost by the list field\'s own expected item count — a list field genuinely fans out real backend work (one resolver call, often one DB query, per returned item), which is precisely why a deeply nested query under two list fields (posts, then comments) reached 321 points from just 3 named fields in the query text.',
  },
  {
    thought: 'Since complexity limiting is described in the QnA as the "correct" GraphQL approach, request-count limiting has no place in a GraphQL API at all.',
    reality: 'The QnA itself names "request count as floor: combine complexity limiting with a base request limit to catch trivial query flooding" — the two are complementary, not competing: complexity limiting catches expensive queries a request-count limit would miss, while a request-count floor catches a flood of many CHEAP queries that complexity limiting alone might not flag quickly enough.',
  },
];

@Component({
  selector: 'app-api-rate-limiting-graphql-complexity',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-graphql-query-complexity-limiter.html',
  styleUrl: './a-graphql-query-complexity-limiter.scss',
})
export class AGraphqlQueryComplexityLimiterSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
