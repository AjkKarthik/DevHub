import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-federation-missing-link',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './missing-link-falls-back-to-v1.html',
  styleUrl: './missing-link-falls-back-to-v1.scss'
})
export class MissingLinkFallsBackToV1Subtopic {
  topicLabel = 'Schema Stitching & Federation';
  topicRoute = '/graphql/federation';

  theory: TheoryPoint[] = [
    {
      heading: '@link is the only opt-in mechanism at the subgraph level',
      points: [
        'A subgraph opts into Federation v2 with exactly one line on its own schema: <code>extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: [...])</code>.',
        'There is no <code>federation_version: 2</code> field inside a subgraph\'s own SDL to opt in some other way -- that key DOES exist, but only in rover\'s own <code>supergraph.yaml</code> composition config, a completely different file from the subgraph schema itself.',
        'Opt-in is per-SUBGRAPH, not per-supergraph -- one subgraph using @link says nothing about whether a sibling subgraph in the same composed graph has done the same.'
      ]
    },
    {
      heading: 'Forgetting @link does not fail -- it quietly falls back to v1',
      points: [
        'Verified directly against Apollo\'s own "Moving to Federation 2" docs: "Without this @link definition, composition considers a schema to be a Federation 1 schema, and it applies certain default settings for backward compatibility."',
        'This is a quiet fallback, not an error -- a subgraph missing @link composes successfully, just under the OLDER rule set, which is exactly what makes it easy to miss during a v1-to-v2 migration that touches several subgraphs at once.',
        'The main page\'s own Federation v2 codeTab correctly includes @link on every subgraph shown -- the risk this subtopic covers is a subgraph added LATER, by someone who copies an older v1-style file as a starting point and never adds the line.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Correctly opted in',
      language: 'typescript',
      code: `import gql from 'graphql-tag';

const typeDefs = gql\`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  type Product @key(fields: "id") {
    id: ID!
    name: String!
    # @shareable is a v2-only directive -- it is only recognized here
    # because this schema opted in via the @link line above.
    price: Float! @shareable
  }
\`;`
    },
    {
      label: 'Forgotten @link -- a CI check, not a guess',
      language: 'typescript',
      code: `// Rather than trust a visual scan of every subgraph's SDL for the
// @link line, a small script can check it directly against each
// subgraph's own schema text -- a real thing a CI step can run before
// composing the supergraph.
function usesFederationV2(subgraphSdl: string): boolean {
  return /@link\\s*\\(\\s*url:\\s*["']https:\\/\\/specs\\.apollo\\.dev\\/federation\\/v2\\.\\d+["']/.test(
    subgraphSdl
  );
}

const productsSdl = \`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])
  type Product @key(fields: "id") { id: ID! name: String! }
\`;

const reviewsSdl = \`
  # No @link line at all -- copied from an older v1-era subgraph.
  type Review @key(fields: "id") { id: ID! rating: Int! }
\`;

console.log('products:', usesFederationV2(productsSdl)); // true
console.log('reviews:', usesFederationV2(reviewsSdl));   // false -- silently v1

// This check catches exactly the case that composition itself will
// NOT flag as an error -- reviewsSdl above composes fine, just under
// Federation v1 semantics, with no warning anywhere in that process.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A supergraph has three subgraphs. Two include <code>extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", ...)</code>; the third was written months earlier and has no @link line at all. The team runs <code>rover supergraph compose</code> and it succeeds with no warnings. What does that success tell them about the third subgraph?',
    hint: 'Does a missing @link cause a composition ERROR, or does it change which RULE SET that one subgraph is composed under?',
    solution: 'Composition succeeding tells them nothing about which Federation version the third subgraph is running under -- it is silently treated as a Federation v1 schema for backward compatibility, with no warning printed anywhere in the process. The other two subgraphs are on v2; this one is quietly on v1. A clean compose result is consistent with BOTH "every subgraph correctly opted into v2" and "one subgraph never opted in at all" -- the two situations look identical from the composition output alone, which is exactly why checking each subgraph\'s own SDL for the @link line directly (not just trusting a successful compose) is the only reliable way to confirm which version each subgraph is actually on.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Forgetting @link on a subgraph produces a composition error, since the schema is "missing" a required directive.',
      reality: 'No error at all -- composition succeeds, and the subgraph is silently treated as Federation v1 for backward compatibility. There is no build-time signal that anything was forgotten.'
    },
    {
      thought: 'Once ONE subgraph in a supergraph opts into Federation v2 via @link, the whole composed graph is "on v2."',
      reality: 'Opt-in is per-subgraph. Each subgraph\'s own schema document needs its own @link statement -- a sibling subgraph with no @link of its own stays on v1 regardless of what the rest of the graph does.'
    },
    {
      thought: 'There is a <code>federation_version: 2</code> setting you can add to a subgraph\'s own schema file instead of writing out the full @link directive.',
      reality: 'That key does exist, but only inside rover\'s own <code>supergraph.yaml</code> composition config (which subgraphs to combine and how) -- it is not a field inside a subgraph\'s own SDL, and it does not substitute for that subgraph\'s own @link opt-in line.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Federation v2 Doesn’t Replace the Gateway', route: '/graphql/federation/gateway-vs-router' };
  next: SubtopicLink | null = { label: 'Where DataLoader Actually Helps in __resolveReference', route: '/graphql/federation/dataloader-inside-resolve-reference' };
}
