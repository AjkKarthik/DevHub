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
  templateUrl: './cloudflares-100-tbps-figure-is-stale-network-passed-500.html',
  styleUrl: './cloudflares-100-tbps-figure-is-stale-network-passed-500.scss'
})
export class Cloudflares100TbpsFigureIsStaleNetworkPassed500Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A specific number in a QnA answer, checked against the vendor\'s own current figure',
      points: [
        'The main page\'s DDoS QnA answer cited "Cloudflare: 100+ Tbps" as a rough illustration of how much aggregate bandwidth a large CDN can bring to bear. That figure was accurate several years ago, but Cloudflare\'s own blog confirms their network crossed 500 Tbps of external capacity in 2026 — the page has been corrected.',
        'Specific numeric figures (bandwidth totals, dashboard IDs, port numbers) read as more authoritative than a vague claim, which paradoxically makes them LESS likely to get double-checked before reuse — a stale number can circulate in explanations for years after the underlying figure moved on.',
      ]
    },
    {
      heading: 'What "500 Tbps of capacity" actually measures — and what it does not',
      points: [
        'Cloudflare\'s own description of the figure is precise: it is the sum of every provisioned port facing a transit provider, private peering partner, internet exchange, or Cloudflare Network Interconnect (CNI), across 330+ cities — total PROVISIONED external interconnection capacity, not traffic actually carried.',
        'Cloudflare explicitly notes that peak day-to-day utilization is a fraction of that 500 Tbps total — the number describes how much headroom the network has built, not how much traffic typically flows through it. Conflating "provisioned capacity" with "traffic served" overstates how close to the ceiling the network normally runs.',
        'This same distinction matters for the DDoS-absorption claim itself: the headroom between typical utilization and total capacity is exactly what lets a CDN absorb a sudden volumetric attack without the legitimate traffic it is also carrying being crowded out.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Provisioned capacity vs. traffic served',
      language: 'typescript',
      code: `// A rough mental model for interpreting a CDN vendor's
// "network capacity" headline figure

interface CdnCapacityClaim {
  metric: 'provisioned external capacity' | 'peak observed traffic';
  whatItMeasures: string;
  whyItMatters: string;
}

const claims: CdnCapacityClaim[] = [
  {
    metric: 'provisioned external capacity',
    whatItMeasures:
      'Sum of every transit/peering/IX/CNI port capacity, across every ' +
      'PoP -- the theoretical ceiling if every link ran fully saturated ' +
      'at once.',
    whyItMatters:
      'This is the headroom available to absorb a sudden traffic spike ' +
      '(viral event, DDoS attack) without legitimate traffic degrading.',
  },
  {
    metric: 'peak observed traffic',
    whatItMeasures:
      'What the network actually carried at its busiest recent moment -- ' +
      'a small fraction of provisioned capacity on a healthy network.',
    whyItMatters:
      'This is the number that would actually change your experience ' +
      'day to day -- provisioned capacity you never approach is inert.',
  },
];

// A "500 Tbps" headline is almost always the FIRST metric --
// worth confirming which one a vendor is quoting before using
// it to argue "our CDN can absorb any spike."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A blog post you are reading says "Cloudflare has 500 Tbps of network capacity, which means it typically carries 500 Tbps of live traffic at any given moment." What is wrong with that second half of the sentence?',
    hint: 'What did Cloudflare\'s own blog post explicitly say about the relationship between the 500 Tbps figure and actual day-to-day traffic?',
    solution: 'The 500 Tbps figure is provisioned EXTERNAL CAPACITY — the sum of every transit, peering, IX, and interconnect port across the network, i.e. the ceiling if every link ran fully saturated simultaneously. Cloudflare\'s own post is explicit that this is not peak traffic, and that day-to-day peak utilization is only a fraction of the total. So "typically carries 500 Tbps at any given moment" is a misreading — the real, much smaller number is however much traffic the network actually observes at its busiest, which is what a "peak observed traffic" figure (a different, separately reported statistic) would describe.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Cloudflare\'s network handles "100+ Tbps" of traffic — that figure is a safe, current shorthand for "a CDN has a lot of bandwidth."',
      reality: 'Per this subtopic\'s theory, that figure is stale — Cloudflare\'s own 2026 blog post confirms the network passed 500 Tbps of provisioned external capacity. The main page has been corrected to the current figure.'
    },
    {
      thought: 'A CDN vendor\'s headline "network capacity" number describes how much traffic the network is actually carrying.',
      reality: 'Per this subtopic\'s theory, Cloudflare\'s own description of the 500 Tbps figure is explicit that it is provisioned external capacity — the ceiling, not the typical load. Peak day-to-day utilization is only a fraction of that total.'
    },
    {
      thought: 'Since large CDN bandwidth figures grow steadily, any specific number quoted in an explanation is close enough to still be useful years later.',
      reality: 'Per this subtopic\'s theory, the jump from "100+ Tbps" to "500+ Tbps" over a few years is a 5x change — large enough that reusing an old figure meaningfully understates a CDN\'s actual current scale, not just a rounding difference.'
    }
  ];
}
