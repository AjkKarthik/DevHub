import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-auth-no-cache-default',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './no-cache-is-the-real-shield-default.html',
  styleUrl: './no-cache-is-the-real-shield-default.scss'
})
export class NoCacheIsTheRealShieldDefaultSubtopic {
  topicLabel = 'Authentication & Authorization';
  topicRoute = '/graphql/auth';

  theory: TheoryPoint[] = [
    {
      heading: 'What graphql-shield actually does when no `cache` option is given',
      points: [
        'graphql-shield\'s `rule(name, options)` factory passes `options.cache` straight through to the internal `Rule` class with no default applied at that layer.',
        'The `Rule` class\'s own `normalizeOptions()` method is where the real default lives: when `options.cache === undefined`, it resolves to `\'no_cache\'` — verified by reading `cjs/rules.js` directly in the installed `graphql-shield@7.6.5` package.',
        '`\'no_cache\'` means `executeRule()` calls `this.func(parent, args, ctx, info)` directly, every single time the rule is checked — there is no memoization step at all.',
        'This directly contradicts the common assumption (and the version of this page\'s own theory that existed before this fix) that rules are "memoized per request by default."'
      ]
    },
    {
      heading: 'Why the page\'s own codeTab already opts into caching',
      points: [
        'The main page\'s `graphql-shield` codeTab writes `rule({ cache: \'contextual\' })(...)` for `isAuthenticated`/`isAdmin` and `rule({ cache: \'strict\' })(...)` for `isOwner` — both are explicit opt-ins, not restatements of a default.',
        'If memoization really were the unconditional default, explicitly passing `{ cache: \'contextual\' }` would be a no-op — the fact that the codeTab bothers to write it out is itself a signal the default is something else.',
        'Skipping the `cache` option is a legitimate, safe choice too — it just means the rule\'s check function runs on every single call site where that rule appears in the permission map, which is correct (if slightly wasteful) for cheap checks.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'graphql-shield source (verified)',
      language: 'typescript',
      code: `// From graphql-shield@7.6.5's own cjs/rules.js — Rule.normalizeOptions()
// (read directly from node_modules after \`npm install graphql-shield\`)

normalizeOptions(options) {
  if (typeof options.cache === 'boolean') {
    return options.cache ? 'strict' : 'no_cache';
  }
  // The real default — kicks in whenever \`cache\` is never passed at all
  return options.cache || 'no_cache';
}

// executeRule() then branches on the resolved cache mode:
//   'no_cache'   -> always calls this.func(parent, args, ctx, info) directly
//   'contextual' -> cache key is just this.name (once per request)
//   'strict'     -> cache key is \`\${this.name}-\${hash({ parent, args })}\``
    },
    {
      label: 'Verifying it end-to-end',
      language: 'typescript',
      code: `import { rule, shield } from 'graphql-shield';

let callCount = 0;
const expensiveCheck = rule()(async (parent, args, ctx) => {
  // no \`cache\` option passed at all -> defaults to 'no_cache'
  callCount++;
  return ctx.user !== null;
});

const permissions = shield({
  Query: {
    a: expensiveCheck,
    b: expensiveCheck,   // same rule instance, reused on a sibling field
  },
});

// Executing a query that touches BOTH \`a\` and \`b\` in one request:
// callCount ends up at 2, not 1 -- the rule genuinely re-ran for each field.
// Swapping to rule({ cache: 'contextual' })(...) makes callCount == 1 instead.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s codeTab defines <code>isAuthenticated</code> with <code>rule({ cache: \'contextual\' })(...)</code>. Suppose a teammate removes the <code>{ cache: \'contextual\' }</code> option entirely, leaving a bare <code>rule()(...)</code>. For a single request that touches 5 different fields all guarded by <code>isAuthenticated</code>, how many times does the check function actually run — before and after the removal?',
    hint: 'Match the cache mode to what it does: `\'contextual\'` caches by rule name only (once per request); no option at all resolves to `\'no_cache\'` (every call re-runs the function).',
    solution: 'Before the removal (cache: \'contextual\'): the check function runs exactly ONCE for the whole request — every field guarded by isAuthenticated reuses the same cached result, because the cache key is just the rule\'s own name (ctx.user does not change mid-request). After the removal (no cache option, defaults to \'no_cache\'): the check function runs 5 times, once per field, since \'no_cache\' never memoizes anything. For a rule as cheap as checking ctx.user !== null this barely matters, but for isOwner (which does a real ctx.db.posts.findById(args.id) database call), the equivalent unguarded default would mean one DB round trip PER field touching that rule instead of one per unique post id.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'graphql-shield memoizes every rule automatically — I don\'t need to think about <code>cache</code> at all.',
      reality: 'Verified directly against the installed package\'s own source: the real default is <code>\'no_cache\'</code>. Memoization is opt-in via the <code>cache</code> option, not a blanket default. A rule with no <code>cache</code> option re-runs its check function on every single call site that references it.'
    },
    {
      thought: 'Since <code>isAuthenticated</code> and <code>isAdmin</code> both use <code>cache: \'contextual\'</code>, that must be the "correct" mode for every rule.',
      reality: '<code>\'contextual\'</code> is correct specifically because those two rules only ever look at <code>ctx.user</code> — a value that is fixed for the whole request. <code>isOwner</code> depends on <code>args.id</code> (which post is being checked), so the SAME page deliberately uses <code>\'strict\'</code> for it instead — using <code>\'contextual\'</code> there would incorrectly cache the FIRST post\'s ownership result and reuse it for every other post id in the same request.'
    },
    {
      thought: 'Passing <code>true</code> to <code>cache</code> is the same as <code>\'contextual\'</code>.',
      reality: 'graphql-shield\'s own <code>normalizeOptions()</code> maps the legacy boolean shorthand differently: <code>cache: true</code> resolves to <code>\'strict\'</code> (per parent+args), and <code>cache: false</code> resolves to <code>\'no_cache\'</code> — there is no boolean shorthand for <code>\'contextual\'</code> at all, it must be spelled out as the string.'
    }
  ];

  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = { label: 'Contextual vs. Strict: Which Cache Mode Does a Rule Actually Need?', route: '/graphql/auth/contextual-vs-strict-cache-modes' };
}
