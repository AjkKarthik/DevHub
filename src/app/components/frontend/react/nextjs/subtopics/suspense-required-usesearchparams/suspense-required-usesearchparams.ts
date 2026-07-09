import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-suspense-required-usesearchparams-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './suspense-required-usesearchparams.html',
  styleUrl: './suspense-required-usesearchparams.scss',
})
export class SuspenseRequiredUsesearchparamsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Quiz Answer Names the Mechanism, But Not the Scope of the Consequence',
      points: [
        'Quiz question 7\'s explanation states: "useSearchParams reads from the dynamic URL query string, opting the component into dynamic rendering. Next.js requires a Suspense boundary around it so the rest of the page can be statically generated while the dynamic part streams in." Mistake #6\'s wrong/right example shows the fix, but not what happens if you skip it.',
        'This subtopic makes the SCOPE explicit: "opting the component into dynamic rendering" does not stay contained to that one component. Without a Suspense boundary specifically isolating the useSearchParams consumer, Next.js has no way to statically render anything ABOVE it in that page\'s tree either — the entire page segment is forced into dynamic (server-rendered-per-request) mode, not just the small piece that actually reads the URL.',
      ],
    },
    {
      heading: 'Why a Suspense Boundary Is What Draws the Line',
      points: [
        'A Suspense boundary tells Next.js (and React) exactly where a "static shell" ends and a "dynamic hole" begins. Everything OUTSIDE the boundary can be pre-rendered once and reused across requests. Everything INSIDE it is rendered fresh, per-request, and streamed in after the shell.',
        'Without any Suspense boundary around the useSearchParams consumer, there is no declared line — so Next.js has to treat the entire page as dynamic, because it cannot prove any part of it is safe to statically pre-render ahead of a request-specific value like the URL\'s query string.',
        'This is the same general mechanism as React\'s own Suspense (catching a thrown promise and rendering a fallback) — Next.js layers request-time/build-time rendering decisions on top of it. Wrapping the search-params-dependent piece is what limits the "this needs a live request" designation to just that piece, not everything around it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'No Suspense — the WHOLE page opts into dynamic rendering',
      language: 'typescript',
      code: `'use client';
import { useSearchParams } from 'next/navigation';

// SearchResults reads the URL query string directly.
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  return <div>Results for: {query}</div>;
}

// app/search/page.tsx
export default function SearchPage() {
  return (
    <div>
      <h1>Search</h1>
      {/* Nothing here is wrapped -- Next.js cannot statically
          pre-render ANY of this page, including <h1>Search</h1>,
          because there's no declared boundary separating the
          static shell from the dynamic, URL-dependent part. */}
      <SearchResults />
    </div>
  );
}`,
    },
    {
      label: 'With Suspense — only the search-params piece is dynamic',
      language: 'typescript',
      code: `'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  return <div>Results for: {query}</div>;
}

// app/search/page.tsx
export default function SearchPage() {
  return (
    <div>
      {/* <h1> is OUTSIDE the boundary -- Next.js can pre-render
          this shell once and reuse it across every request. */}
      <h1>Search</h1>

      <Suspense fallback={<div>Loading results…</div>}>
        {/* Only SearchResults is marked dynamic -- the URL-dependent
            piece streams in after the static shell has already
            been sent to the browser. */}
        <SearchResults />
      </Suspense>
    </div>
  );
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page has a static &lt;Header/&gt;, a static &lt;Footer/&gt;, and one component in the middle that calls useSearchParams with no Suspense wrapper anywhere on the page. Which parts of the page can Next.js statically pre-render?',
    hint: 'A Suspense boundary is what tells Next.js where the "safe to pre-render" shell ends — with none present anywhere on the page, is there any declared line at all?',
    solution: `None of it -- not even the Header and Footer, despite neither of
them touching useSearchParams at all.

This is the counterintuitive part the main page's explanation
implies but doesn't spell out with a full-page example: dynamic
rendering isn't scoped to "the component that actually needs it,"
it's scoped to "everything Next.js can't prove is safe to statically
render ahead of time" -- and without ANY Suspense boundary declaring
a line, Next.js has no way to treat Header and Footer differently
from the useSearchParams consumer sitting between them. The whole
page segment falls back to dynamic (server-rendered per request)
rendering.

Wrapping ONLY the useSearchParams consumer in <Suspense> is what
draws that line -- Header and Footer, sitting outside the boundary,
become eligible for static pre-rendering again, and only the wrapped
piece streams in dynamically. This is exactly why the fix is placing
Suspense around the smallest possible piece that actually needs the
URL, not around the whole page -- a page-wide Suspense wrapper would
avoid the warning but would also mean nothing on the page pre-renders,
which defeats the point of separating static and dynamic content in
the first place.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the "wrap useSearchParams in Suspense" requirement only affects the specific component that calls the hook — the rest of the page keeps rendering statically regardless.',
      reality: 'without a Suspense boundary specifically isolating that component, Next.js cannot statically pre-render ANYTHING on the page, including completely unrelated static content like a header or footer.',
    },
    {
      thought: 'wrapping the ENTIRE page in one big Suspense boundary (instead of just the useSearchParams piece) is an equally good fix, just less precise.',
      reality: 'a page-wide Suspense boundary avoids the build warning, but it also means NOTHING on the page pre-renders statically anymore — it defeats the actual purpose of the fix, which is to let the static shell (header, footer, layout) pre-render while only the URL-dependent piece streams in dynamically.',
    },
    {
      thought: 'this Suspense requirement is a Next.js-specific quirk unrelated to how React\'s own Suspense mechanism normally works.',
      reality: 'the underlying mechanism is React\'s own Suspense — a boundary that catches a suspended child and shows a fallback while it resolves. Next.js layers static-vs-dynamic rendering decisions on top of that same boundary; it isn\'t inventing a separate concept.',
    },
  ];
}
