import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-federated-subscriptions-need-enterprise-graphos',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './federated-subscriptions-need-enterprise-graphos.html',
  styleUrl: './federated-subscriptions-need-enterprise-graphos.scss',
})
export class FederatedSubscriptionsNeedEnterpriseGraphosSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The QnA says "Federation v2+" — the real gate is narrower and paid',
      points: [
        'The main page\'s own QnA on federating subscriptions says it "requires careful design and Apollo Federation v2+." Verified against Apollo\'s own GraphOS docs, that is imprecise on two counts.',
        'First, the version floor is specific: your subgraph composition has to be built against Federation <code>2.4</code> specifically — earlier Federation v2.x releases (2.0, 2.1, 2.2, 2.3) do not support subscription operations at all, not just "v2+" generically.',
        'Second, and never mentioned on the main page at all: federated subscriptions require a GraphOS <strong>Enterprise</strong> plan running a self-hosted Apollo Router. This is not a free-tier or standard-plan capability — it is gated behind a paid entitlement the router actively validates.',
      ],
    },
    {
      heading: 'How the entitlement gate actually works',
      points: [
        'A self-hosted Apollo Router is configured with two environment variables — <code>APOLLO_KEY</code> and <code>APOLLO_GRAPH_REF</code> — that, per Apollo\'s own documentation, exist specifically "to validate enterprise entitlements to use subscriptions on the router."',
        'Practically, this means a team on a free or standard GraphOS plan can compose a perfectly valid Federation 2.4+ supergraph with subscription fields in the schema — the schema itself is fine — and still have the router refuse to serve them, because the entitlement check is a separate, license-level gate on top of the schema-level capability.',
        'Each subgraph in a federated setup still needs its own working subscription server (typically <code>graphql-ws</code>, matching the "Server Setup" codeTab on the main page) — the Enterprise-gated Router feature is what lets a SINGLE client-facing subscription fan out across those subgraphs, not a replacement for wiring up each subgraph\'s own subscription support.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Composing a supergraph with subscriptions',
      language: 'typescript',
      code: `# Each subgraph's schema extension must target Federation 2.4+
# for the composition step to accept a Subscription type at all.
extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.4",
        import: ["@key", "@shareable"])

type Subscription {
  orderStatusChanged(orderId: ID!): OrderStatus!
}

# Composing this against an OLDER "2.0"/"2.1"/"2.2"/"2.3" federation
# spec URL fails composition entirely -- subscriptions are not a
# capability those earlier v2.x releases understand.`,
    },
    {
      label: 'Router config — the entitlement check',
      language: 'typescript',
      code: `// router.yaml (conceptual) -- subscriptions section only activates
// once the router successfully validates an Enterprise entitlement
// via APOLLO_KEY + APOLLO_GRAPH_REF at startup.
subscription:
  enabled: true
  mode:
    passthrough:
      all:
        path: /ws

// Environment (self-hosted router process):
//   APOLLO_KEY=service:my-graph:xxxxx        <- must be an Enterprise-plan key
//   APOLLO_GRAPH_REF=my-graph@current

// A valid key from a non-Enterprise plan: the router starts, the
// SCHEMA still composes fine, but subscription operations are
// rejected at request time -- the schema being valid says nothing
// about the plan's entitlement to actually serve them.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team composes a supergraph with <code>@link(url: "https://specs.apollo.dev/federation/v2.2", ...)</code> and adds a <code>Subscription</code> type to one subgraph. What happens — does composition fail, does the router reject requests at runtime, or does it work fine?',
    hint: 'The version floor for subscription SUPPORT in the composition spec itself is 2.4 — where does 2.2 fall relative to that?',
    solution: `Composition itself fails. 2.2 is below the 2.4 floor Federation introduced subscription-operation support at, so the composition step has no way to understand what a Subscription type even means in that older spec version -- this is a build-time failure, before the router or any entitlement check ever gets involved.

This is a DIFFERENT failure from the Enterprise-plan gate: bumping the @link URL to 2.4+ fixes THIS specific failure (composition now understands subscriptions), but the team could still hit the second, separate gate -- a non-Enterprise APOLLO_KEY -- once they actually try to serve a subscription request through a self-hosted router. Fixing one does not fix the other; they are two independent requirements.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Federation v2+ is enough to support subscriptions, since it says \'v2\' in the docs."',
      reality: 'The real floor is Federation <code>2.4</code> specifically. Federation 2.0 through 2.3 do not support subscription operations in composition at all — "v2+" understates how recent the requirement is.',
    },
    {
      thought: '"If my schema composes successfully with a Subscription type, my router will serve subscription requests."',
      reality: 'Composing successfully only proves the SCHEMA is valid. Serving federated subscription requests through a self-hosted Apollo Router additionally requires a GraphOS Enterprise-plan entitlement, validated via <code>APOLLO_KEY</code>/<code>APOLLO_GRAPH_REF</code> at the router level — a completely separate, paid gate.',
    },
    {
      thought: '"Federated subscriptions replace the need for each subgraph to run its own graphql-ws server."',
      reality: 'No — each subgraph still needs its own working subscription server (graphql-ws or similar), exactly like a non-federated setup. The Enterprise Router feature is what lets ONE client-facing subscription aggregate events across those already-working subgraph servers.',
    },
  ];

  topicLabel = 'Subscriptions';
  topicRoute = '/graphql/subscriptions';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: '@skip and @include Can Crash Subscription Validation, Not Just Reject It',
    route: '/graphql/subscriptions/skip-include-crashes-subscription-validation',
  };
}
