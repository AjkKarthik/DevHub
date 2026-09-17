import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-code-generation-authenticated-introspection',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './authenticated-introspection-endpoint.html',
  styleUrl: './authenticated-introspection-endpoint.scss'
})
export class AuthenticatedIntrospectionEndpointSubtopic {
  topicLabel = 'Code Generation';
  topicRoute = '/graphql/code-generation';

  theory: TheoryPoint[] = [
    {
      heading: 'Two ways to point codegen at a protected schema, both named in the QnA, neither shown in code',
      points: [
        'The main page\'s own QnA names two approaches in one sentence: passing headers directly to a URL-based <code>schema</code> config, or downloading the schema once via curl with auth and committing it as a file.',
        'Verified directly against GraphQL Code Generator\'s own schema-field config reference: the URL-with-headers form is an OBJECT keyed by the URL, not a plain string -- <code>schema: { \'https://api.example.com/graphql\': { headers: { Authorization: \'...\' } } }</code>.',
        'Mistake #3 on the main page already warns against hardcoding internal API URLs in <code>codegen.ts</code> -- the SAME reasoning applies to a hardcoded bearer token; both belong in an environment variable, not committed source.'
      ]
    },
    {
      heading: 'The two approaches have a real, different failure mode',
      points: [
        'The live-URL approach re-runs introspection on every codegen invocation, so the generated types always match the CURRENT schema -- but it means every developer and every CI run needs a valid token, and codegen fails entirely if the API is briefly unreachable.',
        'The committed-schema-file approach has no such live dependency -- codegen works fully offline once the file exists -- but the committed file can silently go stale if nobody remembers to re-download it after the API changes.',
        'Neither approach is unconditionally better -- the URL form suits a fast-moving internal API where staleness is the bigger risk; the file form suits CI environments where reliability and offline development matter more than always-fresh types.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'URL config with auth headers',
      language: 'typescript',
      code: `import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // schema as an object keyed by URL, not a plain string --
  // this is what actually lets you attach request headers.
  schema: {
    [process.env.GRAPHQL_SCHEMA_URL || 'https://internal-api.company.com/graphql']: {
      headers: {
        // Read from env, never hardcoded -- matches the main page's own
        // "don't commit internal URLs" mistake, applied to the token too.
        Authorization: \`Bearer \${process.env.GRAPHQL_INTROSPECTION_TOKEN}\`
      }
    }
  },
  documents: 'src/**/*.graphql',
  generates: {
    'src/types.ts': { plugins: ['typescript'] }
  }
};

export default config;`
    },
    {
      label: 'Committed-schema-file alternative',
      language: 'typescript',
      code: `// One-time (or periodic) refresh step, run manually or on a schedule --
// NOT on every codegen invocation:
//
//   curl -H "Authorization: Bearer $GRAPHQL_INTROSPECTION_TOKEN" \\
//        -X POST https://internal-api.company.com/graphql \\
//        -d '{"query":"query IntrospectionQuery { __schema { ... } }"}' \\
//        > schema.graphql.json
//
// Then commit schema.graphql.json to the repo, and point codegen at
// the FILE instead of the live URL -- no token needed at codegen time.

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql.json',
  documents: 'src/**/*.graphql',
  generates: {
    'src/types.ts': { plugins: ['typescript'] }
  }
};

export default config;`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A CI pipeline uses the URL-config approach shown above, and the internal API has a brief 30-second outage during a deploy. What happens to that specific CI run\'s build step, and would the committed-schema-file alternative have behaved differently?',
    hint: 'Does codegen with a live URL config have any fallback if the request fails -- and does the file-based config depend on that same network call at all?',
    solution: 'The build step fails outright -- codegen with a live URL schema config makes a real introspection request as part of generation, and there is no built-in fallback to a cached or previous schema if that request errors or times out; the whole codegen step (and therefore the build) fails for that run. The committed-schema-file alternative would NOT have been affected at all, since it reads schema.graphql.json directly from the repo checkout and never makes any network call during codegen -- the outage would have zero effect on that CI run. This is exactly the tradeoff the theory above describes: the URL approach buys always-fresh types at the cost of a live dependency every single run, while the file approach trades that reliability for the risk of the committed file quietly going stale.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page already shows an env-var-based schema URL for the "don\'t hardcode internal URLs" mistake, that same config automatically also solves auth.',
      reality: 'An env-var-driven URL and an env-var-driven auth token are two SEPARATE pieces of config -- the mistake block\'s fix only moves the URL out of source; it never demonstrates the headers object needed to actually authenticate the introspection request against a protected endpoint.'
    },
    {
      thought: 'The <code>schema</code> field only ever accepts a plain string (a URL or file path) -- headers must be configured some other way, like a separate auth plugin.',
      reality: 'The <code>schema</code> field itself accepts either a plain string OR an object keyed by URL with a <code>headers</code> property -- no separate plugin or config surface is needed; the auth headers are part of the schema field\'s own documented shape.'
    },
    {
      thought: 'Committing a schema file instead of using a live URL is always the more "correct" choice, since it avoids a network dependency.',
      reality: 'It trades one risk for another rather than eliminating risk -- a committed file removes the live-network dependency but introduces its own staleness risk (nobody remembers to refresh it after a schema change), which the URL approach does not have at all, since it always reflects the CURRENT schema.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Setting Up near-operation-file for Colocated Types', route: '/graphql/code-generation/near-operation-file-preset' };
  next: SubtopicLink | null = null;
}
