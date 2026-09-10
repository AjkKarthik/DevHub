import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-graphql-get-vs-post',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './graphql-get-vs-post.html',
  styleUrl: './graphql-get-vs-post.scss',
})
export class GraphqlGetVsPostSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'GET is for queries only',
      points: [
        'The HTTP Transport section says GET requests "can be used for queries" and are good for CDN caching. It leaves out the constraint: per the GraphQL-over-HTTP spec, the GET method may be used <strong>only for query operations</strong>. A server must not execute a mutation from a GET request.',
        'The reason is HTTP semantics. GET is a "safe" method — it must not cause side effects — and mutations are side effects by definition. Send a mutation over GET and a compliant server responds with an error like "Can only perform a mutation operation from a POST request."',
        'So the split is: mutations always POST; queries may use GET (for caching) or POST (for everything else). Subscriptions use their own transport.',
      ],
    },
    {
      heading: 'Why GET caching needs persisted queries in practice',
      points: [
        'A GET request carries the query as a URL parameter: <code>/graphql?query=...&variables=...</code>, both URL-encoded. Real queries are long, and browsers, proxies, and CDNs impose URL length limits (commonly around 2-8 KB). A moderately nested query blows past that.',
        'The production pattern is a persisted / trusted document: the client registers the query text once, then sends a short hash (<code>?extensions=...&variables=...</code>) on every GET. The URL stays small and stable, so the CDN can key on it.',
        'Automatic Persisted Queries (APQ) automate the registration handshake — the client tries the hash first, and only sends the full query the one time the server replies "PersistedQueryNotFound".',
        'Without a persisted-document scheme, "switch to GET for caching" works only for the handful of tiny queries whose full text fits comfortably in a URL.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Dispatch by method and operation',
      language: 'typescript',
      code: `type Method = 'GET' | 'POST';
type OperationType = 'query' | 'mutation' | 'subscription';

function dispatchOverHttp(method: Method, op: OperationType, urlLength = 0): string {
  if (method === 'GET') {
    if (op !== 'query')
      return 'REJECTED: can only perform a "' + op + '" operation from a POST request ' +
             '(GET is a safe method and must not cause side effects).';
    if (urlLength > 2048)
      return 'RISKY: the query is ' + urlLength + ' chars in the URL -- likely past browser/CDN ' +
             'limits. Send a persisted-query hash instead of the full text.';
    return 'OK: query over GET -- CDN / edge cacheable.';
  }
  return 'OK: ' + op + ' over POST.';
}`,
    },
    {
      label: 'The matrix',
      language: 'typescript',
      code: `console.log(dispatchOverHttp('GET', 'query', 280));
// OK: query over GET -- CDN / edge cacheable.

console.log(dispatchOverHttp('GET', 'mutation'));
// REJECTED: can only perform a "mutation" operation from a POST request
// (GET is a safe method and must not cause side effects).

console.log(dispatchOverHttp('POST', 'mutation'));
// OK: mutation over POST.

console.log(dispatchOverHttp('POST', 'query'));
// OK: query over POST.        <- POST works for queries too; it just is not cached

console.log(dispatchOverHttp('GET', 'query', 6000));
// RISKY: the query is 6000 chars in the URL -- likely past browser/CDN limits.
// Send a persisted-query hash instead of the full text.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'To get CDN caching, a team flips every GraphQL request to GET. Queries cache nicely, but mutations start failing with "Can only perform a mutation operation from a POST request." Why is GET query-only, and how do you get the caching without giving up mutations?',
    hint: 'What does it mean for an HTTP method to be "safe"?',
    solution: `GET is defined by HTTP as a "safe" method: it must be read-only and free of side effects, which is exactly why it is cacheable in the first place. A mutation is a side effect, so the GraphQL-over-HTTP spec forbids running one from a GET request -- a compliant server rejects it.

The fix is to route by operation type, not switch everything: keep mutations (and subscriptions) on POST, and use GET only for queries. To make GET queries actually cacheable despite URL length limits, pair GET with Automatic Persisted Queries -- the client sends a short hash plus variables, the CDN keys on that stable short URL, and the full query text is registered once out of band. You get edge-cached reads and normal mutations at the same time.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"GET vs POST for GraphQL is purely a caching preference — either works for any operation."',
      reality: 'GET is restricted to query operations. A mutation over GET is rejected by a spec-compliant server, because GET is a safe method and mutations have side effects.',
    },
    {
      thought: '"Switching queries to GET gives me CDN caching for free."',
      reality: 'Only for queries whose full URL-encoded text fits inside URL length limits (~2-8 KB). Anything larger needs a persisted-document / APQ scheme so the URL is a short, stable hash.',
    },
    {
      thought: '"POST responses can be cached at the CDN if I set the right headers."',
      reality: 'In practice CDNs do not cache POST — the method is treated as non-cacheable. Edge caching of GraphQL reads means GET plus a persisted query, not tuned headers on a POST.',
    },
  ];

  topicLabel = 'Variables & Arguments';
  topicRoute = '/graphql/variables-arguments';
  prev: SubtopicLink | null = {
    label: 'Enum Values: Bare in the Query, String in the Variables JSON',
    route: '/graphql/variables-arguments/enum-inline-vs-variables',
  };
  next: SubtopicLink | null = null;
}
