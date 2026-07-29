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
  templateUrl: './raw-vary-cookie-fragments-the-cache-normalize-it-instead.html',
  styleUrl: './raw-vary-cookie-fragments-the-cache-normalize-it-instead.scss'
})
export class RawVaryCookieFragmentsTheCacheNormalizeItInsteadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions Vary-by-cookie as a working personalization technique — the fine print matters',
      points: [
        'The main page\'s QnA on serving personalized content through a CDN says "Vary headers tell the CDN to cache separate versions of a response per header value like Accept-Language or a user segment cookie." That is directionally correct — but only if the cookie value being varied on is a small, normalized set, not the raw Cookie header.',
        'The distinction the main page glosses over: "vary by a user SEGMENT cookie" (a small, bounded set of values like A/B-test-variant=b) is a completely different scale of problem from "vary by the raw Cookie header" (which typically contains a unique session ID per user).',
      ]
    },
    {
      heading: 'Why raw Vary: Cookie is a well-documented cache killer',
      points: [
        'HTTP caches (browsers, CDNs, reverse proxies) store one cached VARIANT per distinct combination of Vary-listed header values. If a response says Vary: Cookie and the request\'s Cookie header contains a unique per-user session ID, the cache effectively stores a separate copy of the response for every single user who ever requested it.',
        'Since almost no two users share an identical raw Cookie header value, this drives the effective cache hit rate toward zero — every request becomes a fresh cache miss keyed on a Cookie string nobody else will ever send again. This is a widely documented CDN operational trap, not a hypothetical edge case.',
        'This is exactly the same "cardinality of the cache key" problem the main page\'s own cache-tag material warns about in a different guise: a cache key with too many possible distinct values stops functioning as a cache at all.',
      ]
    },
    {
      heading: 'The fix: never Vary on the raw Cookie header — normalize to a bounded value first',
      points: [
        'Standard guidance from CDN vendors is explicit: origins should not serve Vary: Cookie to a CDN for broadly-cacheable content. Restrict any cookie-based variation to responses that genuinely depend on cookie values (dashboards, personalized pages) — never on public/static assets.',
        'When personalization is limited to a small signal (an A/B test bucket, a currency preference), the origin should extract just that signal into a NEW, normalized request header with a small, known set of values (e.g. X-Ab-Variant: b) and Vary on THAT header instead of the raw Cookie header — this keeps the cache key\'s cardinality bounded no matter how many distinct sessions exist.',
        'For content that is genuinely unique per authenticated user (a dashboard, an account page), the correct move — matching the main page\'s own Cache-Control guidance elsewhere — is simply not caching it at the CDN at all (private, no-store), rather than trying to make Vary: Cookie work.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Normalizing a cookie signal before Vary',
      language: 'typescript',
      code: `// The trap: varying directly on the raw Cookie header
app.get('/pricing', (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.setHeader('Vary', 'Cookie');
  // Every distinct session cookie -> a distinct cached variant.
  // With a unique session ID per user, effective cache hit rate
  // trends toward zero -- this is nearly the same as not caching.
  res.send(renderPricing(req));
});

// The fix: extract the one small signal that actually changes
// the response, normalize it to a bounded value, and Vary on
// a DERIVED header instead of the raw cookie.
app.get('/pricing', (req, res) => {
  const abVariant = getAbTestVariant(req.cookies.sessionId); // 'a' | 'b'
  res.setHeader('X-Ab-Variant', abVariant);
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.setHeader('Vary', 'X-Ab-Variant');
  // Now there are only as many cached variants as there are
  // A/B buckets -- 2, not one per user.
  res.send(renderPricing(req, abVariant));
});

// For genuinely per-user content, don't fight the cache at all:
app.get('/api/dashboard', authenticate, (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.json(buildDashboard(req.user));
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds Vary: Cookie to their public product-listing page so they can show a slightly different "recently viewed" strip per user, while keeping the rest of the page cacheable at the CDN. A week later, their CDN cache hit rate for that page has dropped from 92% to under 2%. Why?',
    hint: 'How many distinct values does the raw Cookie header take across all their visitors — and how does an HTTP cache use Vary-listed headers to decide what counts as "the same" cached response?',
    solution: 'Vary: Cookie tells the cache to store a separate cached variant for every distinct value of the Cookie request header. Since the Cookie header typically contains a unique per-user session ID, virtually every visitor sends a different Cookie value — so the cache ends up storing (and never reusing) a separate copy of the page per user, which is functionally the same as not caching at all. The fix is to stop varying on the raw Cookie header: extract just the "recently viewed" signal into its own small, bounded, normalized header (or better, fetch that strip client-side/via edge-side includes as a separately-loaded fragment) and Vary on that instead — keeping the number of distinct cached variants small and bounded regardless of how many users exist.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Varying a cached response on a "user segment cookie," as the main page describes, is safe as long as it is a cookie-based signal.',
      reality: 'Per this subtopic\'s theory, the main page\'s phrasing is fine when it means a normalized, bounded signal (an A/B bucket) — but Vary: Cookie on the RAW Cookie header (which typically contains a unique session ID) is a well-documented way to destroy a cache\'s hit rate, since it is a completely different problem.'
    },
    {
      thought: 'Adding a Vary header for personalization only affects which cached copy a browser reuses — it has no real cost.',
      reality: 'Per this subtopic\'s theory, Vary directly controls how many distinct cached variants a CDN/proxy stores. Varying on a high-cardinality value (like a unique session cookie) can drop effective cache hit rate toward zero, with real origin-load consequences.'
    },
    {
      thought: 'The only way to serve any per-user personalization through a CDN-cached page is to disable caching for that page entirely.',
      reality: 'Per this subtopic\'s theory, the standard fix is narrower: extract just the small personalization signal into its own normalized, bounded-cardinality header and Vary on that — keeping the rest of the page cacheable, rather than abandoning caching altogether.'
    }
  ];
}
