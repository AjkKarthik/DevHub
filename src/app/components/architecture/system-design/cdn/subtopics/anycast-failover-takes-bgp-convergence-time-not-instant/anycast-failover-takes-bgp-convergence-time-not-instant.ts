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
  templateUrl: './anycast-failover-takes-bgp-convergence-time-not-instant.html',
  styleUrl: './anycast-failover-takes-bgp-convergence-time-not-instant.scss'
})
export class AnycastFailoverTakesBgpConvergenceTimeNotInstantSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A true claim with an important gap: "automatic failover" is not "instant failover"',
      points: [
        'The main page\'s anycast quiz explanation states that anycast "provides... high availability via automatic failover to the next-nearest edge if one goes down." That is accurate as far as it goes, but it never states HOW LONG that failover actually takes — worth closing, since "automatic" reads to many people as "instant."',
        'When an anycast-advertising edge node fails or is withdrawn, the surrounding internet routers do not learn about it immediately — they learn once BGP (Border Gateway Protocol), the routing protocol anycast relies on, propagates the change and RE-CONVERGES on a new best path to the next-nearest surviving node.',
      ]
    },
    {
      heading: 'How long BGP convergence actually takes',
      points: [
        'Typical BGP convergence after a route withdrawal is commonly cited in the 5-15 second range, though it can extend to 30-90 seconds depending on the specific routers, BGP timer configuration, and how many hops the withdrawal has to propagate through.',
        'During that convergence window, traffic destined for the failed node can be dropped, blackholed, or delayed until routers finish updating their tables — a real, bounded outage window, not a theoretical one.',
        'This failover window is still dramatically faster than DNS-based failover (which is bounded by DNS TTL — often minutes, since clients and resolvers cache the old record until it expires) — anycast\'s real advantage over DNS failover is "seconds instead of minutes," not "instant."',
      ]
    },
    {
      heading: 'Shrinking the window: BFD as a faster failure-detection layer',
      points: [
        'BFD (Bidirectional Forwarding Detection) is a lightweight protocol that BGP peers can run alongside BGP itself, specifically to detect a failed neighbor far faster than BGP\'s own default keepalive/hold timers would.',
        'With BFD configured between BGP peers, failure detection (and the resulting reconvergence trigger) can drop to roughly 100-150 milliseconds — a large improvement over the multi-second-to-tens-of-seconds window of default BGP timers alone.',
        'BFD is an operational choice a network operator has to explicitly configure — it is not automatically part of every anycast deployment, so "anycast failover time" varies a lot between a network that has tuned this and one running default BGP timers.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Failover time budget — anycast/BGP vs. DNS',
      language: 'typescript',
      code: `interface FailoverMechanism {
  name: string;
  typicalWindow: string;
  whatBoundsIt: string;
}

const mechanisms: FailoverMechanism[] = [
  {
    name: 'Anycast + BGP, default timers',
    typicalWindow: '~5-15s typical, up to 30-90s worst case',
    whatBoundsIt:
      'How long it takes surrounding routers to detect the ' +
      'withdrawal and re-converge on the next-nearest advertiser.',
  },
  {
    name: 'Anycast + BGP, with BFD',
    typicalWindow: '~100-150ms',
    whatBoundsIt:
      'BFD detects the neighbor failure far faster than default BGP ' +
      'keepalive/hold timers, triggering reconvergence sooner.',
  },
  {
    name: 'DNS-based failover',
    typicalWindow: 'Minutes (bounded by record TTL)',
    whatBoundsIt:
      'Clients and resolvers keep using the cached old record until ' +
      'it expires -- a low TTL helps but adds constant DNS query load.',
  },
];

// "Automatic failover" describes WHO handles it (the network,
// not a human) -- it does not by itself tell you HOW FAST.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "Our CDN uses anycast, so if an edge node dies, failover is instant — users won\'t notice a thing." Is that accurate?',
    hint: 'What has to happen at the BGP routing layer before traffic actually stops flowing toward the dead node?',
    solution: 'Not quite. Anycast failover is AUTOMATIC (no human intervenes) and FAST relative to DNS-based failover, but it is not instant. Once the dead node stops advertising its anycast IP prefix, surrounding routers need time to detect the withdrawal and reconverge on the next-nearest surviving advertiser via BGP — commonly 5-15 seconds with default timers, and during that window traffic aimed at the dead node can be dropped or delayed. A network that has configured BFD alongside BGP can shrink that detection-and-reconvergence window to roughly 100-150ms, but that is an explicit operational choice, not something anycast provides automatically out of the box. The honest claim is "failover in seconds (or, with BFD, sub-second), not the minutes a DNS-TTL-based failover would take" — not "instant."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Anycast\'s "automatic failover" means failover is effectively instant — users never notice an edge node going down.',
      reality: 'Per this subtopic\'s theory, automatic just means no human has to intervene. The actual window is bounded by BGP convergence time — commonly 5-15 seconds with default timers, and up to 30-90 seconds in some configurations.'
    },
    {
      thought: 'Since BGP convergence takes seconds, anycast failover is not meaningfully faster than DNS-based failover.',
      reality: 'Per this subtopic\'s theory, anycast\'s multi-second window is still dramatically faster than DNS failover, which is bounded by record TTL and can take minutes while clients/resolvers keep using a cached stale record.'
    },
    {
      thought: 'BFD is just another name for BGP\'s own built-in failure detection — every anycast deployment already benefits from it.',
      reality: 'Per this subtopic\'s theory, BFD is a separate, optional protocol that must be explicitly configured alongside BGP to get its much faster (~100-150ms) failure detection — it is not automatically part of a default BGP setup.'
    }
  ];
}
