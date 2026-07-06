import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-combined-version-readers-disagree-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './what-happens-when-combined-version-readers-disagree.html',
  styleUrl: './what-happens-when-combined-version-readers-disagree.scss',
})
export class WhatHappensWhenCombinedVersionReadersDisagreeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes ApiVersionReader.Combine() as "the negotiator picks the first match in configuration order" — this describes what happens when only ONE reader finds a value, not what happens when MULTIPLE readers find DIFFERENT values',
      points: [
        'The main API Versioning page\'s theory section says: "All strategies can be enabled simultaneously via <code>ApiVersionReader.Combine()</code> — the negotiator picks the first match in configuration order, letting clients choose what suits them." This phrasing describes the INTENDED use case — a client uses ONE strategy, and the others simply find nothing. It does not address what happens when a request supplies CONFLICTING version values through more than one strategy at once — e.g., a URL segment says <code>v1</code> while a header simultaneously says <code>x-api-version: 2.0</code>.',
      ],
    },
    {
      heading: 'When multiple combined readers each successfully extract a DIFFERENT version value from the SAME request, Asp.Versioning does NOT silently pick "the first one in configuration order" — it treats this as a genuine ambiguity and returns 400 Bad Request',
      points: [
        'Asp.Versioning\'s combined reader behavior is specifically designed to detect when two OR MORE readers disagree on the value they extracted from the SAME request — this is NOT the "first match wins" behavior the main page\'s phrasing might suggest for the common single-strategy case. Instead, it surfaces this as an <code>AmbiguousApiVersionException</code>, which the framework converts into a 400 Bad Request response, since it has no safe way to know which of the conflicting values the CLIENT actually intended — silently picking one could easily route the request to the wrong version\'s behavior without the client ever realizing their own request was internally inconsistent.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own combined-reader setup — works fine when only ONE strategy supplies a value',
      language: 'csharp',
      code: `builder.Services
    .AddApiVersioning(opts =>
    {
        opts.DefaultApiVersion                  = new ApiVersion(1, 0);
        opts.AssumeDefaultVersionWhenUnspecified = true;
        opts.ReportApiVersions                  = true;
        opts.ApiVersionReader = ApiVersionReader.Combine(
            new UrlSegmentApiVersionReader(),
            new QueryStringApiVersionReader(),
            new HeaderApiVersionReader("x-api-version")
        );
    })
    .AddMvc();

// THE COMMON CASE — a client uses ONLY the URL segment strategy, and
// the query string / header readers simply find nothing to extract:
//
//   GET /api/v1/products/1
//   (no ?api-version= query param, no x-api-version header)
//
// This resolves cleanly to v1.0 — only ONE reader produced a value,
// so there is nothing to disagree about.`,
    },
    {
      label: 'What actually happens when TWO readers each find a DIFFERENT version on the SAME request',
      language: 'csharp',
      code: `// A client (perhaps through a misconfigured API gateway, an SDK
// bug, or a proxy that adds its own version header without realizing
// the URL already specifies one) sends BOTH:
//
//   GET /api/v1/products/1
//   x-api-version: 2.0
//
// The UrlSegmentApiVersionReader extracts "1.0" from the URL.
// The HeaderApiVersionReader extracts "2.0" from the x-api-version header.
// These are DIFFERENT values extracted from the SAME single request.

// THIS IS NOT "first match wins" — Asp.Versioning detects the
// disagreement and throws AmbiguousApiVersionException internally,
// which the framework surfaces as:
//
//   HTTP/1.1 400 Bad Request
//   {
//     "type": "https://...",
//     "title": "Multiple different API versions were requested.",
//     "status": 400,
//     "detail": "The API version 1.0 requested by URL segment does not
//                match the API version 2.0 requested by header
//                'x-api-version'."
//   }
//
// THE PRACTICAL IMPLICATION: if your API sits behind an API gateway,
// reverse proxy, or client SDK that might inject its OWN version
// header independently of what the caller specified in the URL, this
// exact conflict can arise WITHOUT the calling developer ever
// realizing their tooling introduced a mismatch — the failure looks
// like a random 400 on requests that seem correctly formed from the
// caller's own perspective.

// ── DEFENSIVE FIX: pick exactly ONE strategy per API, as the main
// page's own final theory bullet already recommends — combining
// multiple strategies is valuable for MIGRATION PERIODS (letting
// different client generations use whichever strategy they were built
// with), not as a permanent steady-state configuration where a single
// client might accidentally supply more than one:
opts.ApiVersionReader = new UrlSegmentApiVersionReader();   // ONE strategy only`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that combining multiple version readers can produce a confusing 400 error when they disagree, propose a way to keep the FLEXIBILITY of supporting multiple client generations during a migration period while REDUCING the risk of this specific conflict — without simply going back to a single hard-coded strategy.',
    hint: 'Consider whether the conflict specifically requires TWO readers to each successfully extract a version from the SAME request — would a strategy that only accepts ONE PARTICULAR extraction source per API CONSUMER (rather than per literal request) sidestep the issue while still supporting a mixed fleet of old and new clients?',
    solution: `A practical middle ground: rather than combining readers such that ANY
single request could accidentally supply conflicting values through
multiple channels, gate which readers are ACTIVE based on some
per-consumer signal that doesn't itself conflict with the version
readers — for example, keeping URL-segment versioning as the PRIMARY,
always-active strategy, and only falling back to header-based reading
for requests that DON'T include a URL version segment at all (rather
than always actively reading both):

opts.ApiVersionReader = ApiVersionReader.Combine(
    new UrlSegmentApiVersionReader(),
    new HeaderApiVersionReader("x-api-version")
);

// This STILL allows the conflict scenario technically — Combine()
// itself does not have a "prefer this reader over that one" priority
// mode built in; it detects disagreement regardless of which readers
// are combined.

The more robust fix is at the API CONSUMER / GATEWAY level rather than
purely in code: audit and fix whatever component (API gateway, SDK,
reverse proxy) might be injecting an x-api-version header
independently of the URL a caller specifies, ensuring only ONE
component in the request path is responsible for ever setting version
information — this is a request-pipeline hygiene fix, not something
ApiVersionReader.Combine()'s own configuration options can fully solve
on their own, since Combine() is specifically designed to CATCH
disagreement (by design, to avoid silently guessing), not resolve it
in favor of one source.

If a genuine two-generation client migration truly requires two
DIFFERENT extraction strategies simultaneously, document clearly which
strategy each client generation is expected to use EXCLUSIVELY (never
both at once), and add monitoring/alerting on the 400
AmbiguousApiVersionException responses specifically — a spike in that
specific error type is a strong, actionable signal that some component
in the request path is adding conflicting version information, which
is exactly the kind of infrastructure bug this subtopic's scenario
describes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ApiVersionReader.Combine() with multiple strategies always resolves to whichever reader is listed FIRST in the Combine() call, regardless of what the other readers extract from the same request.',
      reality: '"first in configuration order" describes the behavior when only ONE reader successfully extracts a value — when TWO OR MORE readers each extract a DIFFERENT version from the same request, Asp.Versioning detects the disagreement and returns 400 Bad Request rather than silently picking the first one.',
    },
    {
      thought: 'a client would need to deliberately and maliciously send conflicting version information through multiple channels to ever trigger this 400 error.',
      reality: 'this can arise entirely accidentally — an API gateway, reverse proxy, or client SDK that injects its own version header independently of a URL segment the caller specified can introduce this exact conflict without any party involved realizing their combined tooling created a mismatch.',
    },
    {
      thought: 'combining multiple version-reading strategies is always safe and strictly more flexible than picking a single strategy, with no downside.',
      reality: 'combining strategies introduces a genuine new failure mode (conflicting version values from the same request) that a single-strategy configuration cannot produce at all — combining strategies is valuable specifically for supporting a mixed fleet of clients during a migration period, not as an unconditionally safer default.',
    },
  ];
}
