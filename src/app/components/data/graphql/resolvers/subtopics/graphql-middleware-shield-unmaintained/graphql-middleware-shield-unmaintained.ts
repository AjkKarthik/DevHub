import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-graphql-middleware-shield-unmaintained',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './graphql-middleware-shield-unmaintained.html',
  styleUrl: './graphql-middleware-shield-unmaintained.scss',
})
export class GraphqlMiddlewareShieldUnmaintainedSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Two names on the main page, both from the same maintainer, both gone quiet',
      points: [
        'The main page\'s own "Resolver Middleware" codeTab presents <code>graphql-middleware</code> and <code>graphql-shield</code> as a current, working combination with zero staleness caveat. Verified via WebSearch: both packages share an original maintainer, and neither has shipped a release in <strong>3+ years</strong>.',
        '<code>graphql-shield</code>\'s own npm listing sits at v7.6.5, last published years ago — community-maintained forks (<code>@depup/graphql-shield</code>, <code>@vio/graphql-shield</code>) exist specifically to keep its DEPENDENCIES current, since the original package itself has not been touched.',
        '<code>graphql-middleware</code>\'s own maintainers stated, regarding a dropped integration, that support "might" come back "if the library becomes maintained again" — the maintainers\' own words acknowledging the project\'s current state.',
      ],
    },
    {
      heading: 'What still works, and what the modern replacement looks like',
      points: [
        'Neither package is BROKEN — the code the main page shows still runs today, since GraphQL\'s own execution model has not changed underneath it. The risk is the usual one for an unmaintained dependency: no security patches, no compatibility fixes for newer <code>graphql-js</code> versions, and a maintainer who has moved on.',
        'The actively-maintained modern path for the exact same cross-cutting-logic need is the <strong>envelop</strong> plugin ecosystem. <code>@envelop/graphql-middleware</code> wraps the SAME <code>graphql-middleware</code> API you already know, just running through envelop\'s own, actively-updated plugin pipeline instead of graphql-middleware\'s own (now-frozen) execution wrapper.',
        'A team starting a new project today reaches for an envelop plugin (either the wrapped <code>@envelop/graphql-middleware</code>, or a plain envelop plugin using its <code>onResolverCalled</code> hook) rather than installing the original, unmaintained packages directly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the main page shows (still runs, unmaintained deps)',
      language: 'typescript',
      code: `import { applyMiddleware } from 'graphql-middleware';
import { shield, rule, and } from 'graphql-shield';

const isAuthenticated = rule()((parent, args, ctx) => ctx.user !== null);
const isAdmin = rule()((parent, args, ctx) => ctx.user?.role === 'ADMIN');

const permissions = shield({
  Query: {
    adminStats: and(isAuthenticated, isAdmin),
    myProfile: isAuthenticated,
  },
});

const schemaWithPermissions = applyMiddleware(schema, permissions);
// Runs fine today. But: no release from either package in 3+ years --
// no patches for newly-discovered issues, no compatibility fixes for
// future graphql-js versions.`,
    },
    {
      label: '@envelop/graphql-middleware — same API, actively maintained',
      language: 'typescript',
      code: `import { envelop, useSchema } from '@envelop/core';
import { useGraphQLMiddleware } from '@envelop/graphql-middleware';
import { shield, rule, and } from 'graphql-shield';

// The shield/rule definitions are unchanged -- graphql-shield's RULE
// API is stable and widely used; it's the wiring that moves.
const isAuthenticated = rule()((parent, args, ctx) => ctx.user !== null);
const isAdmin = rule()((parent, args, ctx) => ctx.user?.role === 'ADMIN');
const permissions = shield({
  Query: { adminStats: and(isAuthenticated, isAdmin) },
});

const getEnveloped = envelop({
  plugins: [
    useSchema(schema),
    useGraphQLMiddleware([permissions]),   // <- runs through envelop's own pipeline
    // ... other envelop plugins (caching, tracing, rate limiting) compose here
  ],
});`,
    },
    {
      label: 'A plain envelop plugin — no graphql-middleware dependency at all',
      language: 'typescript',
      code: `import { useOnResolve } from '@envelop/on-resolve';

// For a simple case, skip both unmaintained packages entirely --
// @envelop/on-resolve covers the same per-field-auth-check use case
// with no extra graphql-middleware/graphql-shield dependency at all.
//
// Note: as of envelop v3, this hook lives in its own package. In v2
// you could define onResolverCalled directly inside a custom plugin
// object -- v3 deliberately split it out (part of making envelop's
// core "engine agnostic"), so useOnResolve is now the entry point.
const restrictedFields = new Set(['adminStats']);

const getEnveloped = envelop({
  plugins: [
    useSchema(schema),
    useOnResolve(({ context, info }) => {
      if (restrictedFields.has(info.fieldName) && !(context as any).user) {
        throw new Error(\`Not authenticated for field "\${info.fieldName}"\`);
      }
    }),
  ],
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A project already has <code>graphql-shield</code> permission rules for a dozen fields, working correctly. A teammate proposes rewriting all the rule definitions from scratch to migrate onto envelop. Is a full rewrite actually necessary, or is there a smaller change that gets the maintenance benefit?',
    hint: 'Which part of the migration in the second codeTab actually changed — the shield/rule definitions themselves, or just how the resulting `permissions` object gets applied?',
    solution: `A full rewrite is not necessary. Comparing the two codeTabs directly: the shield()/rule()/and() definitions -- the actual permission LOGIC -- are byte-for-byte identical in both versions. graphql-shield's own rule API did not change; only how the resulting permissions object gets WIRED into the server changed, from applyMiddleware(schema, permissions) to useGraphQLMiddleware([permissions]) inside an envelop plugin list.

The smaller, lower-risk change: keep every existing shield()/rule() definition exactly as written, swap only the wiring layer (@envelop/graphql-middleware in place of graphql-middleware's own applyMiddleware), and get the maintenance benefit (an actively-updated execution pipeline) without touching a dozen already-working, already-tested permission rules at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"graphql-middleware and graphql-shield are officially deprecated on npm, so they will stop working soon."',
      reality: 'Neither is formally marked deprecated. They are simply unmaintained — no release in 3+ years. The existing code keeps running; the risk is the absence of future patches and compatibility fixes, not an imminent break.',
    },
    {
      thought: '"Switching to @envelop/graphql-middleware means rewriting all my existing graphql-shield permission rules."',
      reality: 'No — <code>@envelop/graphql-middleware</code> wraps the SAME <code>graphql-middleware</code> API. Existing <code>shield()</code>/<code>rule()</code> definitions are reused unchanged; only the wiring that applies them to the schema moves into an envelop plugin.',
    },
    {
      thought: '"envelop is a replacement for Apollo Server or graphql-yoga, not something you add ON TOP of them."',
      reality: 'envelop is a plugin PIPELINE that sits around GraphQL execution — it composes with an existing server rather than replacing it, and different server frameworks have their own ways of hooking envelop\'s pipeline into their own request lifecycle.',
    },
    {
      thought: '"A per-field resolver hook is always defined directly as onResolverCalled inside a custom envelop plugin object."',
      reality: 'That was the envelop v2 pattern. As of v3, the team deliberately moved it into its own package (<code>@envelop/on-resolve</code>) as part of making envelop\'s core "engine agnostic" — the current entry point is <code>useOnResolve(callback)</code>, not a bare <code>onResolverCalled</code> key.',
    },
  ];

  topicLabel = 'Resolvers';
  topicRoute = '/graphql/resolvers';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Preventing Overfetching With info.fieldNodes',
    route: '/graphql/resolvers/preventing-overfetch-with-info-fieldnodes',
  };
}
