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
  templateUrl: './graphql-returns-200-even-when-errors-is-present.html',
  styleUrl: './graphql-returns-200-even-when-errors-is-present.scss'
})
export class GraphqlReturns200EvenWhenErrorsIsPresentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s QnA covers throwing typed errors from resolvers — but never says what HTTP status code the client actually receives when that happens, and the answer surprises developers coming from REST',
      points: [
        'A GraphQL response body is a single JSON object that can contain BOTH a "data" key (the successfully-resolved fields, with any failed fields set to null) AND an "errors" key (an array describing what went wrong) — at the SAME TIME, in the SAME response. This is fundamentally different from REST\'s model of one status code representing the outcome of the entire request.',
        'The GraphQL-over-HTTP specification\'s guidance (using the conventional application/json response type that Apollo Server and most GraphQL servers use by default) is that the server SHOULD respond with HTTP 200 for any well-formed, successfully-EXECUTED request — regardless of whether individual resolvers threw errors along the way. A query that partially fails (some requested fields null, an errors array present) still normally comes back as a 200.',
        'HTTP 4xx/5xx status codes are reserved for a DIFFERENT category of failure: the request never even reached execution — malformed JSON, a syntactically invalid GraphQL document that fails parsing, or a document that fails schema validation before any resolver runs at all. In those cases, there is no "data" entry in the response whatsoever, and a 4xx status is appropriate.',
      ]
    },
    {
      heading: 'Why this matters for how you write client-side error handling',
      points: [
        'Code that checks response.ok or response.status === 200 to decide "did this GraphQL request succeed?" is checking the wrong thing — that check will pass even for a response containing a populated errors array and some null data fields. The correct check is inspecting the parsed JSON body\'s own errors key.',
        'This is precisely why the main page\'s recommendation to throw typed errors with an extensions.code from resolvers matters so much: since the HTTP status code itself carries almost no information about resolver-level failures, the errors array\'s own structured content (message, extensions.code) is the ONLY reliable signal a client has for distinguishing what specifically went wrong.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A response with data AND errors together — still HTTP 200',
      language: 'typescript',
      code: `// Query: { user(id: "999") { name } validPost: post(id: "1") { title } }
// user(id: "999") doesn't exist and its resolver throws.
// post(id: "1") resolves fine.

// Actual HTTP response: status 200
// Actual JSON body:
{
  "data": {
    "user": null,               // the failed field — set to null
    "validPost": { "title": "Hello World" }  // the succeeded field, intact
  },
  "errors": [
    {
      "message": "User not found",
      "path": ["user"],
      "extensions": { "code": "NOT_FOUND" }
    }
  ]
}

// This is NOT an HTTP error response — a naive fetch() check like
// if (!response.ok) throw new Error('Request failed') would NEVER
// catch this, because response.ok is true (status 200).`,
    },
    {
      label: 'Correct client-side error checking',
      language: 'typescript',
      code: `async function graphqlRequest(query, variables) {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  // WRONG signal for GraphQL-level failure — this only catches
  // network-level or parse/validation-level failures (4xx/5xx),
  // not resolver errors:
  if (!response.ok) {
    throw new Error(\`HTTP error: \${response.status}\`);
  }

  const json = await response.json();

  // CORRECT signal — always check the errors array in the body,
  // regardless of what the HTTP status code was:
  if (json.errors?.length) {
    const notFoundError = json.errors.find(e => e.extensions?.code === 'NOT_FOUND');
    if (notFoundError) {
      // handle this specific, structured error
    }
    // decide per-field: some data may still be safely usable even
    // though errors is non-empty, depending on which fields errored
  }

  return json.data;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A frontend developer writes: axios.get("/graphql-endpoint-style-call").catch(err => showErrorToast()) and reports that their error toast never appears even when they can see, by manually inspecting the network tab, that the GraphQL response contains a populated "errors" array describing a resolver failure. Explain precisely why their .catch() handler never runs.',
    hint: 'Does an HTTP client library like axios or fetch treat a 200 response as a "successful" response regardless of what JSON body it contains? What actually triggers a .catch() handler for an HTTP request?',
    solution: 'The .catch() handler never runs because axios (like fetch) only rejects/throws based on the HTTP-level outcome of the request — typically a non-2xx status code or a network failure — not based on the CONTENTS of a successfully-received JSON body. Since this GraphQL server followed the conventional guidance of returning HTTP 200 even when the response contains a populated "errors" array (reserving 4xx/5xx specifically for requests that failed to even execute, like malformed JSON or invalid GraphQL syntax), axios sees a perfectly successful 200 response and resolves its promise normally — it has no way to know, and does not attempt to know, that the JSON body it received happens to contain a GraphQL-level errors array. The fix is for the developer\'s own code to explicitly check response.data.errors (or the equivalent field) after every request resolves successfully at the HTTP level, rather than relying on the HTTP client\'s built-in success/failure detection to surface GraphQL-level failures — those are two separate, independent signals that GraphQL over HTTP does not conflate.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a GraphQL query causes a resolver to throw an error, the HTTP response will have a non-200 status code, the same way a failed REST endpoint typically returns 4xx or 5xx.',
      reality: 'This subtopic\'s theory and code example both show the conventional, spec-guided behavior is the opposite — a resolver-level error still normally returns HTTP 200, with the failure communicated entirely through the response body\'s own "errors" array, not the status code.'
    },
    {
      thought: 'Checking response.ok (or an equivalent "was this HTTP request successful" check) in an HTTP client library is a reliable way to detect whether a GraphQL request succeeded.',
      reality: 'This subtopic\'s exercise shows response.ok being true tells you nothing about whether the GraphQL response body contains an errors array — that check only catches request-level failures (malformed JSON, invalid syntax) that occur before execution, not resolver-level failures during execution.'
    },
    {
      thought: 'A GraphQL response either fully succeeds (data present, no errors) or fully fails (errors present, no usable data) — there is no in-between state.',
      reality: 'This subtopic\'s theory and first code example both show GraphQL\'s actual "partial success" model — a single response can contain a data object with SOME fields correctly populated and others null due to specific, individually-reported errors, all in one response.'
    }
  ];
}
