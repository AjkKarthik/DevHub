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
  templateUrl: './quiz-answer-was-the-mistakes-blocks-own-anti-pattern.html',
  styleUrl: './quiz-answer-was-the-mistakes-blocks-own-anti-pattern.scss'
})
export class QuizAnswerWasTheMistakesBlocksOwnAntiPatternSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two sections of the same page, disagreeing about the same technique',
      points: [
        'The main page\'s "Predictable sequential codes (security)" mistake block explicitly warns: sequential auto-increment codes converted to Base62 are enumerable — "attacker enumerates: curl https://sho.rt/0000G{0..Z}... exposes all shortened URLs including private/sensitive ones." Its fix is to use random or hash-based codes instead.',
        'Yet the extended quiz asked "What data structure would you use to generate unique short codes at scale?" and marked "Auto-incrementing integers converted to base 62" as the single BEST answer — the exact technique the mistakes block just finished warning against — with an explanation that discussed the bottleneck problem of a single counter but never once mentioned the enumeration/security tradeoff the sibling section had already established as important. The page has been corrected to reconcile the two.',
      ]
    },
    {
      heading: 'Why both sections are pointing at something real — just incompletely, on their own',
      points: [
        'The mistakes block\'s security concern is entirely valid: unmodified sequential codes ARE trivially enumerable, and that is a genuine, well-known vulnerability class for public-facing URL shorteners.',
        'The quiz\'s engineering argument is also entirely valid, on its own terms: counter-based generation is collision-free BY CONSTRUCTION (no birthday-paradox risk at all, unlike the random-code approach this same page\'s OTHER corrected subtopic shows has a near-certain collision rate at scale) and needs no per-insert uniqueness check.',
        'The gap was that neither section acknowledged the other\'s concern — the quiz explanation never mentioned enumeration risk, and the mistakes block never mentioned that its "use random codes instead" fix reintroduces the collision-probability problem the OTHER corrected subtopic on this page identifies as near-certain at 100M/day scale.',
      ]
    },
    {
      heading: 'The reconciling answer: counter-based generation, with the counter obfuscated before exposure',
      points: [
        'A common real-world pattern gets both properties at once: use an auto-incrementing counter internally (collision-free by construction, no per-insert uniqueness check needed), but apply a reversible, non-sequential TRANSFORM to the counter value before Base62-encoding it for public exposure — for example, XOR-ing it with a fixed secret mask, or running it through a format-preserving permutation (like a Feistel-network-based scheme).',
        'This keeps the counter\'s collision-free guarantee (each internal counter value still maps to exactly one code) while making the PUBLIC code sequence non-obvious to an outside observer — codes no longer increment in visible, guessable order, closing the enumeration hole the mistakes block correctly flags, without reopening the collision-probability problem random generation introduces at scale.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Counter-based generation with obfuscation',
      language: 'typescript',
      code: `// Plain counter -> Base62: collision-free, but ENUMERABLE
function toCodePlain(counterValue: number): string {
  return toBase62(counterValue);
  // Sequential: counter=1000 -> code N, counter=1001 -> code N+1
  // An attacker can enumerate every code by incrementing
}

// Counter -> obfuscated -> Base62: still collision-free, NOT enumerable
const OBFUSCATION_MASK = 0x1F3A5C7E; // a fixed secret, chosen once

function toCodeObfuscated(counterValue: number): string {
  const obfuscated = counterValue ^ OBFUSCATION_MASK; // reversible XOR
  return toBase62(obfuscated);
  // Still a 1-to-1 mapping (XOR is reversible and bijective over
  // a fixed bit width) -- no collisions -- but consecutive counter
  // values no longer produce consecutive-looking public codes.
}

// Both approaches avoid the near-certain collision rate that pure
// RANDOM code generation has at 100M/day scale -- the obfuscated
// counter gets collision-freedom AND non-enumerability together.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team reads the main page\'s quiz and concludes "auto-increment + Base62 is simply the correct approach" and ships it directly, with sequential codes exposed as-is in the URL. A security researcher later reports they can enumerate the company\'s entire shortened-URL database by incrementing the code in the URL. What did the team miss, and what is the minimal fix?',
    hint: 'Does using a counter-based approach for COLLISION-FREEDOM require exposing the counter value directly and sequentially to the public?',
    solution: 'The team correctly used a counter-based approach to avoid collisions (a genuinely good engineering choice, collision-free by construction) — but shipped the counter value directly and sequentially as the public code, which is exactly the "Predictable sequential codes" vulnerability the same page\'s own mistakes block warns about. The minimal fix does not require abandoning the counter: apply a reversible, non-sequential transform (e.g. XOR with a fixed secret mask, or a format-preserving permutation) to the counter value BEFORE Base62-encoding it for public exposure. This keeps the collision-free guarantee (still a 1-to-1 mapping) while making the public code sequence non-obvious, closing the enumeration hole without reintroducing the collision-probability risk that switching to purely random codes would bring back at scale.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s quiz and its "Predictable sequential codes" mistake block give conflicting advice, so at least one of them must simply be wrong.',
      reality: 'Per this subtopic\'s theory, both are correct on their own narrow terms — the quiz correctly favors counter-based generation for collision-freedom; the mistakes block correctly flags exposing that counter sequentially as an enumeration risk. The gap was that neither acknowledged the other\'s concern.'
    },
    {
      thought: 'Avoiding the enumeration vulnerability requires switching entirely from counter-based generation to random code generation.',
      reality: 'Per this subtopic\'s theory, a reversible obfuscation transform (like XOR with a secret mask) applied to the counter before encoding achieves BOTH goals at once — collision-freedom from the counter, non-enumerability from the obfuscation — without reintroducing random generation\'s own near-certain collision rate at scale.'
    },
    {
      thought: 'Since XOR obfuscation is a simple, well-known technique, it provides strong cryptographic protection against an attacker guessing the pattern.',
      reality: 'A fixed XOR mask is a basic obfuscation, not cryptographic security — a sufficiently motivated attacker with enough samples could potentially recover the mask or pattern. It defeats casual/naive enumeration far better than a bare sequential counter, but a genuinely security-critical system should still combine it with rate limiting and monitoring, not rely on obfuscation alone.'
    }
  ];
}
