import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-federation-gateway-vs-router',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './gateway-vs-router.html',
  styleUrl: './gateway-vs-router.scss'
})
export class GatewayVsRouterSubtopic {
  topicLabel = 'Schema Stitching & Federation';
  topicRoute = '/graphql/federation';

  theory: TheoryPoint[] = [
    {
      heading: 'Federation v2 is a spec version, not a runtime choice',
      points: [
        'Verified directly against Apollo\'s own "Moving to Federation 2" docs: Federation v2 is a composition/spec version, decoupled from which runtime actually serves the supergraph. It does not remove or deprecate the gateway.',
        '<code>@apollo/gateway</code> is still fully usable with Federation v2 subgraphs -- you just need Gateway 2.0+ (the old v1.x gateway package predates v2 composition support, not v2 itself).',
        'Apollo Router is a SEPARATE, newer runtime -- a standalone Rust binary, not a version of the Node/Apollo Server-based gateway -- that Apollo recommends for performance. It is a recommendation, not something Federation v2 requires.'
      ]
    },
    {
      heading: 'The version relationship actually runs the other way',
      points: [
        'Very recent Apollo Router releases (v1.60 and later) actually DROPPED support for Federation v1 supergraphs -- the opposite direction from "Federation v2 removes the gateway." It is the newer Router that is narrowing what it supports, not Federation v2 retiring the gateway.',
        'So there are really three independent axes: which Federation spec VERSION your subgraphs compose against (v1 or v2), which RUNTIME serves the resulting supergraph (Gateway or Router), and which runtime VERSION of that runtime you\'re on -- conflating any two of these is where claims like the original one go wrong.',
        'In practice: pick Gateway or Router based on your own performance/ops needs, and separately pick Federation v1 or v2 based on which directives your subgraphs need -- the two choices are independent.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Gateway 2.0+ serving a Federation v2 supergraph',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { startStandaloneServer } from '@apollo/server/standalone';

// This is ordinary @apollo/gateway 2.x code -- nothing about it changes
// because the underlying subgraphs opted into Federation v2. The gateway
// package itself just needs to be a version that understands v2-composed
// supergraphs (2.0+), which every current release does.
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'products', url: 'http://localhost:4001/graphql' },
      { name: 'reviews', url: 'http://localhost:4002/graphql' },
    ],
  }),
});

const server = new ApolloServer({ gateway });

// Nothing here references "Federation v2" at all -- the version is a
// property of the SUBGRAPH schemas (via their own @link directive),
// not something the gateway needs to be told about explicitly.
await startStandaloneServer(server, { listen: { port: 4000 } });`
    },
    {
      label: 'The independent-axes model',
      language: 'typescript',
      code: `// Two SEPARATE decisions, each with its own reasons:

// (1) Which Federation spec version do the subgraphs compose against?
//     -- decided by whether each subgraph's own SDL has a
//        "extend schema @link(url: '...federation/v2.0', ...)" line.
//     -- v2 unlocks directives like @shareable, @override, @inaccessible.

// (2) Which runtime serves the resulting supergraph?
//     -- @apollo/gateway (Node, an Apollo Server plugin) -- works fine
//        with EITHER v1 or v2 subgraphs, as long as the gateway package
//        itself is 2.0+.
//     -- Apollo Router (standalone Rust binary) -- Apollo's own newer,
//        higher-performance recommendation. Also works with v1 or v2
//        supergraphs, EXCEPT very recent Router releases (1.60+) which
//        dropped v1 supergraph support specifically.

// A team can therefore be on: v1 subgraphs + Gateway, v1 subgraphs +
// (older) Router, v2 subgraphs + Gateway, or v2 subgraphs + Router --
// all four combinations are real, valid configurations. "v2 removes
// the gateway" collapses two independent decisions into one false rule.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team is standing up a brand-new Federation v2 supergraph (their subgraphs all use <code>@link</code> to opt in). They already run <code>@apollo/gateway</code> version 2.3 in production for an unrelated existing project and want to reuse that same setup rather than adopt a new runtime. Is this a valid choice?',
    hint: 'Does Federation v2 (the spec/composition version) require a specific RUNTIME, or is that a separate decision?',
    solution: 'Yes -- @apollo/gateway 2.3 is well past the 2.0+ floor needed to understand Federation v2-composed supergraphs, and nothing about opting into v2 forces a switch to Apollo Router. Apollo Router is a separate, newer runtime Apollo recommends for its own performance characteristics, but Gateway remains a fully supported way to serve a Federation v2 supergraph. The team can reuse their existing Gateway 2.3 setup with zero changes required by the version choice alone.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Federation v2 requires switching from Apollo Gateway to Apollo Router.',
      reality: 'False -- <code>@apollo/gateway</code> (2.0+) works fine with Federation v2-composed supergraphs. The spec version and the serving runtime are two independent decisions.'
    },
    {
      thought: 'Apollo Router is simply a newer version of Apollo Gateway, the way Federation v2 is a newer version of v1.',
      reality: 'No -- Router is a genuinely separate runtime (a standalone Rust binary) from Gateway (a Node/Apollo Server plugin), not a version upgrade of the same codebase. They are two different products that both happen to serve a federated supergraph.'
    },
    {
      thought: 'The relationship only ever moves toward the newer things (v2, Router) replacing the older ones (v1, Gateway).',
      reality: 'The opposite has happened at least once: very recent Apollo Router releases (1.60+) dropped support for Federation v1 supergraphs entirely -- a runtime NARROWING what it supports, unrelated to whether v2 "removes" anything on the Gateway side.'
    }
  ];

  next: SubtopicLink | null = { label: 'A Missing @link Silently Falls Back to v1', route: '/graphql/federation/missing-link-falls-back-to-v1' };
}
