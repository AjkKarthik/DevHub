import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-auth-contextual-vs-strict',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './contextual-vs-strict-cache-modes.html',
  styleUrl: './contextual-vs-strict-cache-modes.scss'
})
export class ContextualVsStrictCacheModesSubtopic {
  topicLabel = 'Authentication & Authorization';
  topicRoute = '/graphql/auth';

  theory: TheoryPoint[] = [
    {
      heading: 'The real cache-key mechanics behind each mode',
      points: [
        '`\'contextual\'`: the cache key is just <code>this.name</code> — the rule\'s own name, nothing else. The check function runs once per request and every subsequent call to that rule, regardless of what `parent`/`args` it\'s called with, reuses the SAME cached result.',
        '`\'strict\'`: the cache key is <code>`${this.name}-${hashFunction({ parent, args })}`</code> — a hash of both `parent` and `args`. The check function re-runs any time it\'s called with a genuinely different `parent`/`args` combination, but reuses the cached result for repeated calls with the SAME combination.',
        '`\'no_cache\'` (the real default): no cache key at all — `this.func(parent, args, ctx, info)` runs directly, every single time.',
        'Verified directly from graphql-shield\'s own `executeRule()` source in the installed package — this is not inferred from documentation, it is the literal switch statement.'
      ]
    },
    {
      heading: 'Why the main page picks a different mode for each rule',
      points: [
        '`isAuthenticated` and `isAdmin` only ever read `ctx.user` — a value that does not change mid-request. Using `\'contextual\'` is exactly right: cache once per request, ignore `args` entirely, since `args` play no role in the check.',
        '`isOwner` reads `args.id` (which post is being checked) AND does a real database call (`ctx.db.posts.findById(args.id)`). If it used `\'contextual\'`, the FIRST post\'s ownership result would be cached and incorrectly reused for every OTHER post id checked in the same request.',
        '`\'strict\'` is the correct choice for `isOwner` specifically because its result genuinely depends on `args` — a different `args.id` must produce a fresh check, but the SAME `args.id` checked twice (e.g. once for a query, once for a mutation touching the same post) can safely reuse the cached result.',
        'The general rule: use `\'contextual\'` when a rule\'s result depends only on `ctx` (session/user-level facts); use `\'strict\'` when it also depends on `args`/`parent` (per-object facts).'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The wrong mode picks the wrong owner',
      language: 'typescript',
      code: `import { rule } from 'graphql-shield';

// BUG: isOwner using 'contextual' instead of 'strict'
const isOwnerWrong = rule({ cache: 'contextual' })(
  async (parent, args, ctx) => {
    const post = await ctx.db.posts.findById(args.id);
    return post?.authorId === ctx.user?.id || 'Not your post';
  }
);

// A single request updating TWO different posts in one mutation batch:
//   updatePost(id: "post-A", ...)   <- isOwnerWrong runs the real check, caches by NAME only
//   updatePost(id: "post-B", ...)   <- cache HIT on the rule's name, reuses post-A's result!
//
// If the user owns post-A but NOT post-B, the second update is incorrectly
// allowed through -- 'contextual' never looked at args.id at all.`
    },
    {
      label: 'The fix: cache: \'strict\'',
      language: 'typescript',
      code: `const isOwnerFixed = rule({ cache: 'strict' })(
  async (parent, args, ctx) => {
    const post = await ctx.db.posts.findById(args.id);
    return post?.authorId === ctx.user?.id || 'Not your post';
  }
);

// Cache key is now \`isOwner-\${hash({ parent, args })}\`:
//   updatePost(id: "post-A", ...) -> cache key includes args.id = "post-A" -> real check runs
//   updatePost(id: "post-B", ...) -> DIFFERENT cache key (different args.id) -> real check runs again
//   updatePost(id: "post-A", ...) again later in the SAME request -> cache HIT, reuses the result`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds a new rule, <code>isTeamMember</code>, that checks <code>ctx.user.teamId === args.teamId</code> — it depends on both <code>ctx</code> (the logged-in user\'s team) AND <code>args</code> (which team is being accessed). Should this rule use <code>\'contextual\'</code> or <code>\'strict\'</code> caching, and why?',
    hint: '`\'contextual\'` caches by rule name only, ignoring `args` entirely — it is only safe when the result never depends on `args`. Does this rule\'s result depend on `args`?',
    solution: 'isTeamMember must use cache: \'strict\'. Its result depends on args.teamId, which can legitimately differ between calls in the same request (checking access to team-A vs team-B). Using \'contextual\' would cache the check by rule name alone, so the FIRST team checked would silently apply to every subsequent team check in that request -- exactly the same class of bug as using \'contextual\' on isOwner. The deciding question is always: does this rule\'s check function reference `args` (or `parent`) at all? If yes, use \'strict\'. If it only ever reads `ctx`, \'contextual\' is safe and cheaper.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>\'strict\'</code> caching is "safer" than <code>\'contextual\'</code>, so it should be the default choice for every rule.',
      reality: '<code>\'strict\'</code> is not automatically safer — it is correct for rules whose result depends on <code>args</code>/<code>parent</code>. For a rule like <code>isAuthenticated</code> that only reads <code>ctx.user</code>, <code>\'contextual\'</code> is both correct AND cheaper (one cache lookup per request instead of one per unique args combination).'
    },
    {
      thought: 'Since <code>\'strict\'</code> hashes <code>parent</code> and <code>args</code>, it re-runs the check function on every single call.',
      reality: 'It only re-runs when the hash of <code>{ parent, args }</code> genuinely changes. Two calls to <code>isOwner</code> with the identical <code>args.id</code> in the same request DO hit the cache under <code>\'strict\'</code> — the mode still saves real work, it just keys on more than the rule\'s bare name.'
    },
    {
      thought: 'A rule that reads <code>ctx.user.role</code> is automatically safe with <code>\'contextual\'</code> caching no matter what else it checks.',
      reality: 'Only if it reads NOTHING from <code>args</code>/<code>parent</code>. A rule combining a role check with an ownership check (e.g. "admin OR owns this post") still depends on <code>args.id</code> through the ownership half, and needs <code>\'strict\'</code> just like a pure ownership rule would.'
    }
  ];

  prev: SubtopicLink | null = { label: 'graphql-shield Rules Are NOT Memoized by Default', route: '/graphql/auth/no-cache-is-the-real-shield-default' };
  next: SubtopicLink | null = { label: 'graphql-shield Is Effectively Unmaintained — Use @envelop/graphql-middleware', route: '/graphql/auth/graphql-shield-unmaintained-envelop-fix' };
}
