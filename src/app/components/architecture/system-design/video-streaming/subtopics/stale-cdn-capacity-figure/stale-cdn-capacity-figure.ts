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
  templateUrl: './stale-cdn-capacity-figure.html',
  styleUrl: './stale-cdn-capacity-figure.scss'
})
export class StaleCdnCapacityFigureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A figure this same hub had already corrected once, drifted back in on a different page',
      points: [
        'The main page\'s "CDN Cache Strategy" code sample originally stated: "Cloudflare/Akamai: 200+ Tbps capacity across all PoPs." This hub\'s own /system-design/cdn topic already researched and corrected the identical fact during its own Phase 10 subtopic authoring — Cloudflare\'s own 2026 blog post states the network has crossed 500+ Tbps of provisioned external capacity. The page has been corrected to match.',
        'This is a different kind of catch than most: instead of fresh external research, it was caught by cross-referencing an ALREADY-VERIFIED fact from a sibling topic page in the same hub — a technique worth using whenever a new page states a specific real-world figure that another page in the same hub has already researched.',
      ]
    },
    {
      heading: 'Why the same stale figure can independently appear on multiple pages',
      points: [
        'Different pages on this site were authored at different times, often referencing the same underlying real-world facts (CDN provider capacity, cloud pricing, service defaults) independently — there\'s no single shared source of truth enforcing that every page cites the same, most-current number for a fact like "Cloudflare\'s network capacity."',
        'A number that was accurate when ONE page was written can become stale by the time a DIFFERENT page cites the same underlying fact, especially for a fast-moving figure like network capacity that providers periodically update in their own public announcements.',
      ]
    },
    {
      heading: 'The caveat that matters as much as the number itself',
      points: [
        'The corrected 500+ Tbps figure is PROVISIONED capacity — the theoretical ceiling across Cloudflare\'s entire network — not typical traffic actually served at any given moment. This distinction (already established when this exact figure was first corrected on the /system-design/cdn page) matters here too: the point of citing it is to show that a CDN provider\'s available capacity vastly exceeds what a single origin (S3) could sustain for a video-streaming workload, not to claim Cloudflare is constantly running near that ceiling.',
        'When reusing a verified fact across pages, carry over its important caveats too, not just the headline number — a number stripped of its caveat can be technically accurate but misleading about what it actually represents.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Provisioned capacity vs. typical traffic served',
      language: 'typescript',
      code: `interface CapacityClaim {
  metric: 'provisioned-ceiling' | 'typical-traffic';
  value: string;
  meaning: string;
}

const claims: CapacityClaim[] = [
  {
    metric: 'provisioned-ceiling',
    value: '500+ Tbps (Cloudflare, 2026)',
    meaning:
      'The theoretical maximum the network COULD carry across all ' +
      'PoPs combined -- a headroom figure, not a live utilization number.',
  },
  {
    metric: 'typical-traffic',
    value: 'a fraction of the provisioned ceiling',
    meaning:
      'What the network actually carries at any given moment -- ' +
      'always well below the provisioned ceiling, since providers ' +
      'build in headroom for traffic spikes.',
  },
];

// A video-streaming capacity argument ("400 Tbps needed, S3 alone
// can't do this, a CDN can") only needs the PROVISIONED ceiling to
// make its point -- it doesn't need (and shouldn't claim) that the
// CDN is running anywhere near that ceiling in normal operation.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A system design page cites "Cloudflare/Akamai: 200+ Tbps capacity" to argue that a CDN can handle far more traffic than a single origin server could. A DIFFERENT topic page in the same learning hub already researched this exact fact and found the current figure to be 500+ Tbps. What should you do, and does the 200 vs 500 difference actually change the argument being made?',
    hint: 'Does the underlying ARGUMENT ("a CDN provider has vastly more capacity than one origin server") depend on the precise number being 200 or 500, or does it hold either way?',
    solution: 'Correct the stale figure to match the already-verified 500+ Tbps fact, reusing the research already done on the sibling page rather than treating it as a fresh unknown. The underlying argument doesn\'t actually depend on the precise number -- both 200 Tbps and 500 Tbps are vastly larger than a single-origin S3 bucket could sustain for a 400 Tbps video-streaming workload, so the CONCLUSION (use a CDN) doesn\'t change. But citing an outdated specific figure still undermines the page\'s credibility and should be fixed once a more current, already-verified number is available -- especially when correcting it costs nothing beyond checking what a sibling page in the same hub already found.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once a specific real-world fact (like a CDN provider\'s network capacity) has been correctly stated once on a documentation site, every other page citing the same fact will automatically stay consistent with it.',
      reality: 'Per this subtopic\'s theory, different pages are typically authored independently — this exact figure had already been researched and corrected on a sibling page in the same hub, but the OTHER page citing the same underlying fact still had the older, stale number.'
    },
    {
      thought: 'When a new page needs to verify a specific real-world figure, the only way to check it is fresh external research (WebSearch/WebFetch).',
      reality: 'Per this subtopic\'s theory, checking whether a SIBLING page in the same hub has already researched the identical fact is a faster, equally valid verification method — reusing already-verified research is both more efficient and just as reliable as researching it again from scratch.'
    },
    {
      thought: 'A "provisioned capacity" figure and "typical traffic actually served" are close enough in meaning that either framing works when citing a CDN provider\'s scale.',
      reality: 'Per this subtopic\'s theory, these are genuinely different claims — a provisioned ceiling shows available headroom, not live utilization — and dropping this distinction when reusing a verified fact can make an accurate number read as a misleading claim about normal operating conditions.'
    }
  ];
}
