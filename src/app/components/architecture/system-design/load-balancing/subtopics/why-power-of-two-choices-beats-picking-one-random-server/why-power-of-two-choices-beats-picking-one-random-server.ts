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
  templateUrl: './why-power-of-two-choices-beats-picking-one-random-server.html',
  styleUrl: './why-power-of-two-choices-beats-picking-one-random-server.scss'
})
export class WhyPowerOfTwoChoicesBeatsPickingOneRandomServerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A named algorithm with no explanation of why it works',
      points: [
        'The main page names "Random with two choices: pick 2 random servers, route to the less-loaded one. Near-optimal with minimal state" as one line among several load-balancing algorithms — asserting it\'s "near-optimal" without any explanation of WHY picking between 2 random options beats picking 1, or how big the improvement actually is. This subtopic fills in that gap.',
      ]
    },
    {
      heading: 'The result: an EXPONENTIAL improvement from just one extra random choice',
      points: [
        'This is a well-known result from Michael Mitzenmacher\'s "Power of Two Choices" work: in the classic "balls into bins" model (n balls placed into n bins), placing each ball into a purely random bin (d=1 choice) produces a maximum bin load of roughly log(n) / log(log(n)) with high probability.',
        'Placing each ball into the LESS-LOADED of just 2 randomly-chosen bins (d=2) drops the maximum load to roughly log(log(n)) / log(2) — an EXPONENTIAL improvement, not just a modest one, achieved by adding a single extra random comparison.',
        'The improvement mostly stops there: going from d=2 to d=3 choices only yields a constant-factor improvement, not another exponential jump — which is exactly why "power of TWO choices" (not three, or ten) became the standard, memorable name for this technique.',
      ]
    },
    {
      heading: 'Why this specific result is what makes "near-optimal with minimal state" true',
      points: [
        'A load balancer using power-of-two-choices needs to check the load of only 2 servers per routing decision — not maintain a full, continuously-updated view of every backend\'s load (which is what a hypothetical, perfectly-informed "always pick the truly least-loaded server" algorithm would require).',
        'The practical upshot: you get load-balancing quality close to a fully centralized, perfectly-informed algorithm, while only needing a cheap, local, 2-server comparison per request — this is the concrete mechanism behind the main page\'s one-line "near-optimal with minimal state" claim, which named the conclusion without ever explaining the underlying result.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Power of two choices — the load-balancing decision itself',
      language: 'typescript',
      code: `// Power of two choices: pick 2 random backends, route to
// whichever currently has fewer active connections.
// Needs only local, cheap state -- not a global view.

interface Backend { id: string; activeConnections: number; }

function pickBackend(backends: Backend[]): Backend {
  const a = backends[Math.floor(Math.random() * backends.length)];
  let b = backends[Math.floor(Math.random() * backends.length)];
  while (b === a && backends.length > 1) {
    b = backends[Math.floor(Math.random() * backends.length)];
  }
  return a.activeConnections <= b.activeConnections ? a : b;
}

// Theoretical result (Mitzenmacher, "balls into bins"):
// d=1 (pure random):  max load ~ log(n) / log(log(n))
// d=2 (this function): max load ~ log(log(n)) / log(2)
//                       -- EXPONENTIALLY better than d=1
// d=3:                 only a CONSTANT-factor improvement
//                       over d=2 -- diminishing returns kick
//                       in fast after the first extra choice`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A colleague proposes upgrading a load balancer from "power of two choices" to "power of five choices" (checking 5 random servers instead of 2 before routing), expecting a similarly large improvement to the jump from 1 choice to 2. Based on this subtopic\'s theory, should they expect that?',
    hint: 'Does the improvement from d=1 to d=2 choices have the same character (exponential) as the improvement from d=2 to d=3 (and beyond)?',
    solution: 'No — they should NOT expect a similarly dramatic improvement. The jump from d=1 (pure random, one choice) to d=2 (power of two choices) is exponential — a fundamentally different regime of load balancing quality. But going from d=2 to d=3 (or further, like d=5) only yields a CONSTANT-factor improvement, not another exponential leap. This is precisely why "power of two choices" became the standard technique: it captures almost all of the achievable benefit from adding randomness-based choice, while adding more choices beyond 2 costs additional per-request overhead (checking more servers) for comparatively little further gain.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Power of two choices" is just a vague heuristic that happens to work reasonably well in practice, without a precise theoretical basis.',
      reality: 'Per this subtopic\'s theory (context added to the main page during this batch), it rests on a rigorous, well-known result (Mitzenmacher) showing an EXPONENTIAL improvement in maximum load over pure random placement — from roughly log(n)/log(log(n)) down to log(log(n))/log(2).'
    },
    {
      thought: 'Checking more random servers before routing (power of three, five, etc.) should keep improving load balancing quality proportionally to the number of extra choices.',
      reality: 'Per this subtopic\'s theory, the big win is specifically the jump from 1 choice to 2 — going from 2 choices to 3 or more only yields a constant-factor improvement, not another exponential one, which is why "two" (not more) is the standard, named technique.'
    },
    {
      thought: 'Achieving load-balancing quality close to a perfectly-informed, globally-aware algorithm requires the load balancer to track every backend\'s real-time load continuously.',
      reality: 'Per this subtopic\'s theory, power-of-two-choices gets close to that quality while only checking 2 randomly-selected servers\' load per routing decision — cheap, local state, not a maintained global view.'
    }
  ];
}
