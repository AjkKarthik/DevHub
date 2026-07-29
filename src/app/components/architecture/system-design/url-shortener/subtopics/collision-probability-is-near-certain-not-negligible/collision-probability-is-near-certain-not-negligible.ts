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
  templateUrl: './collision-probability-is-near-certain-not-negligible.html',
  styleUrl: './collision-probability-is-near-certain-not-negligible.scss'
})
export class CollisionProbabilityIsNearCertainNotNegligibleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A formula the page wrote out itself — and got the conclusion backwards',
      points: [
        'The main page\'s "Predictable sequential codes" mistake fix included this line: "Collision probability at 100M URLs: 1 - e^(-100M^2 / 2 × 62^7) ≈ negligible." Plugging the page\'s OWN stated numbers into its OWN stated formula produces the opposite conclusion — a collision is near-CERTAIN, not negligible. The page has been corrected.',
        'This is the strongest kind of catch: it requires no external research at all, just carefully evaluating the arithmetic the page itself presents as already-worked-out.',
      ]
    },
    {
      heading: 'Working the formula with the page\'s own numbers',
      points: [
        'This is the birthday-paradox approximation: P(at least one collision) ≈ 1 - e^(-n²/2m), where n is the number of items drawn and m is the size of the space they are drawn from. Here n = 100,000,000 (100M random codes) and m = 62^7 ≈ 3,521,614,606,208 (the page\'s own correctly-computed "3.5 trillion" figure, confirmed independently in this page\'s own quiz).',
        'n² = (10^8)² = 10^16. 2m ≈ 7.043×10^12. Dividing: n²/(2m) ≈ 1,420. So the exponent in the formula is approximately -1,420 — and e^-1420 is so close to zero that, for any practical purpose, it IS zero. That makes P(collision) ≈ 1 - 0 = 1, i.e. essentially 100% — a collision is near-certain, not negligible.',
        'A sanity check confirms this without even doing the full formula: the well-known birthday-paradox rule of thumb is that collision probability crosses 50% once n reaches roughly 1.18×√m. Here √m ≈ 1.88 million — so the 50%-collision point is reached at around 2.2 million random draws. The page\'s scenario draws 100 million — roughly 45 times past that point, deep into "collision is essentially guaranteed" territory.',
      ]
    },
    {
      heading: 'Why "negligible" would have been a genuinely dangerous conclusion to leave uncorrected',
      points: [
        'The main page\'s own shorten() function already implements a 3-attempt retry loop specifically to handle collisions on insert — which is the CORRECT engineering response to this math. But the "≈ negligible" comment, read at face value, tells a reader that retry logic is basically decorative insurance for an event that "won\'t really happen" — precisely backwards from what the numbers say.',
        'The corrected conclusion actually strengthens the case for the page\'s own existing retry-on-collision code: at 100M/day volume, collisions using pure random 7-character codes are not a rare edge case to shrug off — they are an expected, routine occurrence the system MUST handle gracefully, exactly as the retry loop already does.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Evaluating the collision formula step by step',
      language: 'typescript',
      code: `// The birthday-paradox approximation, worked with the page's own numbers
const n = 100_000_000;           // 100M random codes generated
const m = Math.pow(62, 7);        // 62^7 ~= 3.52 trillion possible codes

const exponent = -(n * n) / (2 * m);
console.log(exponent);
// ~= -1420  (NOT a small number close to 0 -- a LARGE negative number)

const collisionProbability = 1 - Math.exp(exponent);
console.log(collisionProbability);
// ~= 1  (i.e. ~100% -- a collision is essentially certain, not negligible)

// Sanity check via the 50%-collision rule of thumb: n ~= 1.18 * sqrt(m)
const fiftyPercentPoint = 1.18 * Math.sqrt(m);
console.log(fiftyPercentPoint);
// ~= 2.2 million -- the page's own 100 million draws is ~45x past this point`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reads the main page\'s original comment ("Collision probability at 100M URLs ... negligible") and proposes removing the retry-on-collision loop from shorten() to simplify the code, reasoning that collisions "basically never happen at this scale anyway." Using the page\'s own formula, is this a safe simplification?',
    hint: 'Plug n=100,000,000 and m=62^7 into 1 - e^(-n²/2m). Is the resulting probability close to 0, or close to 1?',
    solution: 'No, this would be a dangerous simplification. Evaluating the formula with the stated numbers gives an exponent of roughly -1,420, making e^(-1420) so close to zero that the collision probability, 1 - e^(-1420), rounds to essentially 1 (100%) — a collision is near-certain at this volume with pure random 7-character codes, not a rare edge case. Removing the retry-on-collision loop would mean the system regularly fails to generate a usable short code and has no fallback, likely causing frequent, user-visible errors on URL creation. The retry loop is essential infrastructure at this scale, not optional insurance against an unlikely event.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a 7-character Base62 code space (3.5 trillion possibilities) is vastly larger than 100 million codes generated per day, collisions must be extremely rare.',
      reality: 'Per this subtopic\'s theory, the birthday paradox means collision probability grows much faster than pure "items vs. space" intuition suggests — with 100M draws from a 3.5-trillion space, the math shows a near-certain collision, not a rare one.'
    },
    {
      thought: 'The page\'s "≈ negligible" comment on its own collision formula is a plausible-looking but essentially harmless rounding statement.',
      reality: 'Per this subtopic\'s theory, evaluating the exact formula the page itself states produces a probability of approximately 1 (100%), the polar opposite of "negligible" — this was a real, verifiable inaccuracy, not a matter of interpretation.'
    },
    {
      thought: 'If collisions are actually near-certain at this volume, the page\'s overall architecture (retry-on-collision insert) must be fundamentally broken.',
      reality: 'Per this subtopic\'s theory, the corrected math does not invalidate the page\'s architecture — it validates it. The retry-on-collision loop already shown in shorten() is exactly the right response to frequent collisions; the only thing wrong was the comment claiming collisions were rare enough not to matter.'
    }
  ];
}
