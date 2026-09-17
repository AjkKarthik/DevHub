import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-apollo-server-incremental-kind',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './executeoperation-incremental-response-kind.html',
  styleUrl: './executeoperation-incremental-response-kind.scss'
})
export class ExecuteoperationIncrementalResponseKindSubtopic {
  topicLabel = 'Apollo Server';
  topicRoute = '/graphql/apollo-server';

  theory: TheoryPoint[] = [
    {
      heading: 'What `response.body.kind` is actually distinguishing',
      points: [
        'The main page\'s own Testing codeTab narrows the type with `if (response.body.kind === \'single\')` before reading `singleResult`, but never explains what the OTHER branch is for.',
        '`\'single\'` means incremental delivery was NOT used — `response.body.singleResult` holds the complete `{ data, errors, extensions }` object, exactly like every ordinary GraphQL response.',
        '`\'incremental\'` means the operation used the `@defer` or `@stream` directives — `response.body.initialResult` holds the first partial result, and `response.body.subsequentResults` is an async iterator yielding the rest as it becomes available.',
        'This is a genuinely different response SHAPE, not just a status flag — code that only ever checks `singleResult` would need entirely separate handling to consume an `\'incremental\'` response at all.'
      ]
    },
    {
      heading: 'Why you will probably never see the `\'incremental\'` branch fire',
      points: [
        '`@defer`/`@stream` incremental delivery requires `graphql-js` v17, which as of this writing is still shipped only as pre-release/alpha versions — not the stable `graphql` dependency any production Apollo Server app installs by default.',
        'Even on an alpha `graphql-js` v17 install, `@defer`/`@stream` are NOT automatically available — they must be explicitly declared in the schema\'s own SDL before a query can use them at all.',
        'This means the main page\'s own defensive `if (response.body.kind === \'single\')` check is correct future-proofing, not dead code covering an unreachable case forever — it simply protects against a feature that is real, typed, and documented, but not yet something an ordinary production server will encounter.',
        'If a codebase never installs an alpha `graphql-js` and never adds `@defer`/`@stream` directives to its schema, `response.body.kind` will always resolve to `\'single\'` — the check exists for type-safety and future readiness, not because both branches are equally likely today.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Handling both branches',
      language: 'typescript',
      code: `const response = await server.executeOperation({ query, variables });

if (response.body.kind === 'single') {
  // The path every ordinary Apollo Server 4 app takes today.
  const { data, errors } = response.body.singleResult;
  console.log('Complete result:', data, errors);
} else {
  // response.body.kind === 'incremental' -- only reachable with an
  // alpha graphql-js v17 install AND @defer/@stream declared in the SDL.
  console.log('Initial partial result:', response.body.initialResult);
  for await (const chunk of response.body.subsequentResults) {
    console.log('Later chunk:', chunk);
  }
}`
    },
    {
      label: 'What a real graphql-js v17 install reports',
      language: 'typescript',
      code: `// Verified directly against the installed graphql-js dependency's
// own package.json -- this is how to check whether a project is even
// CAPABLE of reaching the 'incremental' branch at all.
import graphqlPkg from 'graphql/package.json' with { type: 'json' };

const [major] = graphqlPkg.version.split('.').map(Number);

if (major < 17) {
  console.log(
    \`graphql \${graphqlPkg.version} installed -- @defer/@stream unavailable, \` +
    \`response.body.kind will always be 'single'.\`
  );
} else {
  console.log(
    \`graphql \${graphqlPkg.version} installed -- @defer/@stream may be usable, \` +
    \`but only for operations whose SDL explicitly declares them.\`
  );
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes a test that only ever checks <code>response.body.kind === \'single\'</code> and reads <code>response.body.singleResult</code> without an <code>else</code> branch at all — no handling for <code>\'incremental\'</code>. Given that their project installs the standard, stable <code>graphql</code> npm package (not an alpha pre-release) and their schema declares no <code>@defer</code>/<code>@stream</code> directives, is this test at real risk of silently breaking?',
    hint: '<code>response.body.kind</code> can only become <code>\'incremental\'</code> if BOTH conditions are met: an alpha graphql-js v17+ install, AND the schema explicitly opts into <code>@defer</code>/<code>@stream</code> via SDL.',
    solution: 'No, this test is not at real risk today. Since the project installs the standard stable graphql package (not an alpha 17.x pre-release) and the schema never declares @defer/@stream in its SDL, response.body.kind can only ever resolve to \'single\' for this specific project -- the \'incremental\' branch is genuinely unreachable under these conditions, not just unlikely. The risk would only become real if the team later upgraded to an alpha graphql-js v17 release AND started adding @defer/@stream directives to their schema -- at that point, any query using those directives would return an \'incremental\' response and the missing else branch would need to be added. Until then, omitting it is a reasonable simplification, not a hidden bug.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The <code>\'incremental\'</code> branch is dead code the main page\'s own Testing codeTab includes just for TypeScript type-narrowing, with no real-world meaning.',
      reality: 'It is a real, documented response shape for genuine <code>@defer</code>/<code>@stream</code> incremental delivery — verified via WebSearch against Apollo\'s own documentation. It is simply not YET reachable in most production setups, since it requires an alpha <code>graphql-js</code> v17 install and explicit schema opt-in.'
    },
    {
      thought: '<code>@defer</code> and <code>@stream</code> are enabled automatically the moment a project installs a <code>graphql-js</code> version that supports them.',
      reality: 'Verified via research: support in <code>graphql-js</code> v17 is opt-in at the SCHEMA level — the directives must be explicitly declared in the SDL before any query can use them, even on a version that technically implements the underlying execution engine.'
    },
    {
      thought: 'Checking <code>response.body.kind === \'single\'</code> is an unnecessary type-safety formality with no practical downside to skipping.',
      reality: 'Skipping it is fine for a project that will never adopt <code>@defer</code>/<code>@stream</code>, but TypeScript will not compile code that accesses <code>response.body.singleResult</code> without first narrowing on <code>kind</code>, since <code>GraphQLResponse</code>\'s type is a genuine union of the two shapes — the check is required by the type system, not merely good practice.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Introspection Is Still NODE_ENV-Gated — Not a v3-to-v4 Change', route: '/graphql/apollo-server/introspection-still-nodeenv-gated' };
  next: SubtopicLink | null = { label: 'executeOperation’s contextValue Is Shallow-Cloned, Not Shared by Reference', route: '/graphql/apollo-server/contextvalue-is-shallow-cloned' };
}
