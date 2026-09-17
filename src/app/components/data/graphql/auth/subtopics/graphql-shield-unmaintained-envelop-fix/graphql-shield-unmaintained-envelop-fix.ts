import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-auth-shield-unmaintained',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './graphql-shield-unmaintained-envelop-fix.html',
  styleUrl: './graphql-shield-unmaintained-envelop-fix.scss'
})
export class GraphqlShieldUnmaintainedEnvelopFixSubtopic {
  topicLabel = 'Authentication & Authorization';
  topicRoute = '/graphql/auth';

  theory: TheoryPoint[] = [
    {
      heading: 'graphql-shield and graphql-middleware are both effectively unmaintained',
      points: [
        'graphql-shield (the rules/shield API this page\'s own codeTab uses) and graphql-middleware (the applyMiddleware function that wraps it onto a schema) are both maintained by the same original author, with no release in 3+ years.',
        'This is a genuine maintenance-status fact, not a functionality bug — the API still works exactly as documented today. The risk is the usual one for an unmaintained dependency: no security patches, no compatibility fixes for newer graphql-js versions, and no response to open issues.',
        'This exact finding was already verified once on this hub\'s sibling `/graphql/resolvers` page (which covers graphql-middleware\'s `applyMiddleware` more directly) — reused here rather than re-derived, since it is the same two packages either way.'
      ]
    },
    {
      heading: 'The modern replacement wraps the identical API',
      points: [
        '`@envelop/graphql-middleware` (via `useGraphQLMiddleware`) is an actively maintained Envelop plugin that wraps the SAME `shield()`/`rule()` permission-map shape this page\'s own codeTab already uses — migrating is a matter of changing how the middleware is attached, not rewriting the rules themselves.',
        'Envelop is a plugin system for GraphQL execution (composable via `envelop({ plugins: [...] })`), and `useGraphQLMiddleware` is one plugin in that ecosystem specifically built to run legacy graphql-middleware-shaped middleware, including a `shield()` permission map, without needing `applyMiddleware` at all.',
        'The `rule()`/`and()`/`or()`/`not()`/`shield()` calls themselves — including the `cache` option covered in the two prior subtopics — are entirely unchanged; only the code that wires the resulting permission map onto the executable schema changes.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before: graphql-middleware\'s applyMiddleware',
      language: 'typescript',
      code: `import { rule, shield, and } from 'graphql-shield';
import { applyMiddleware } from 'graphql-middleware';

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx) => ctx.user !== null || 'Not authenticated'
);

const permissions = shield({
  Query: { myProfile: isAuthenticated },
  Mutation: { createPost: isAuthenticated }
}, { fallbackRule: not(isAuthenticated) });

// The unmaintained part: graphql-middleware's applyMiddleware
const schema = applyMiddleware(executableSchema, permissions);`
    },
    {
      label: 'After: @envelop/graphql-middleware',
      language: 'typescript',
      code: `import { rule, shield, and } from 'graphql-shield';
import { envelop, useSchema } from '@envelop/core';
import { useGraphQLMiddleware } from '@envelop/graphql-middleware';

// Identical rule/shield code -- nothing here changes
const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx) => ctx.user !== null || 'Not authenticated'
);

const permissions = shield({
  Query: { myProfile: isAuthenticated },
  Mutation: { createPost: isAuthenticated }
}, { fallbackRule: not(isAuthenticated) });

// Only the wiring step changes: an Envelop plugin instead of applyMiddleware
const getEnveloped = envelop({
  plugins: [
    useSchema(executableSchema),
    useGraphQLMiddleware([permissions]),
  ],
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team is deciding whether to add graphql-shield to a brand-new GraphQL API being built today. They ask: "Since the rule()/shield() API still works fine and this page shows it in a codeTab, is there any real reason not to use it?" What should they weigh before deciding?',
    hint: 'Distinguish "does the API still function correctly" from "is the underlying project still being maintained" — these are two separate questions, and this page verified both packages fail the second one.',
    solution: 'The API itself is not broken and will keep working exactly as shown on this page for now -- that is not in question. The real consideration is maintenance risk on a multi-year timeline: no releases in 3+ years means no security patches if a vulnerability is found, no guaranteed compatibility as graphql-js itself evolves, and no response if a real bug surfaces in an open issue. For a brand-new project specifically, this tips the decision toward @envelop/graphql-middleware -- it wraps the identical rule()/shield() API (so the team keeps everything they already know and any rules they write), while getting an actively maintained wiring layer instead of the unmaintained applyMiddleware. For an EXISTING project already using graphql-middleware\'s applyMiddleware and working fine, the calculus is different -- there is no urgent need to migrate immediately, just an awareness that new development against the unmaintained path carries more long-term risk than starting fresh on the maintained one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Unmaintained" means graphql-shield is broken or will stop working.',
      reality: 'It means no NEW releases have shipped in 3+ years — the existing, published version keeps working exactly as documented. The risk is forward-looking: no security patches, no fixes for compatibility issues with newer graphql-js versions, and no response to bug reports, not a claim that the current code is broken today.'
    },
    {
      thought: 'Switching to <code>@envelop/graphql-middleware</code> means rewriting all the <code>rule()</code>/<code>shield()</code> permission logic from scratch.',
      reality: 'The rule/shield code is completely unchanged — <code>rule()</code>, <code>and()</code>/<code>or()</code>/<code>not()</code>, the permission map shape, and the <code>cache</code> option all stay identical. Only the final step (how the resulting permission map gets attached to the schema) changes, from graphql-middleware\'s <code>applyMiddleware</code> to Envelop\'s <code>useGraphQLMiddleware</code> plugin.'
    },
    {
      thought: 'graphql-shield itself is the unmaintained part, so switching wiring layers (Envelop vs. applyMiddleware) fixes the problem entirely.',
      reality: 'graphql-shield (the rule()/shield() package) is ALSO unmaintained, independent of graphql-middleware\'s own applyMiddleware — reused here from this hub\'s already-verified finding. Envelop\'s useGraphQLMiddleware only replaces the unmaintained WIRING layer (graphql-middleware); it still depends on graphql-shield itself for the rule/shield API, so graphql-shield\'s own unmaintained status is a separate, still-present fact worth knowing about regardless of which wiring layer is used.'
    }
  ];

  prev: SubtopicLink | null = { label: 'Contextual vs. Strict: Which Cache Mode Does a Rule Actually Need?', route: '/graphql/auth/contextual-vs-strict-cache-modes' };
  next: SubtopicLink | null = null;
}
