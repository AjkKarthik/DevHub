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
  templateUrl: './initial-vs-anyscript-budgets-catch-genuinely-different-failure-modes.html',
  styleUrl: './initial-vs-anyscript-budgets-catch-genuinely-different-failure-modes.scss'
})
export class InitialVsAnyscriptBudgetsCatchGenuinelyDifferentFailureModesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why this isn\'t browser-runtime-testable — and what to verify instead',
      points: [
        'Angular CLI budgets are enforced entirely at BUILD time, inside the <code>ng build</code> process itself — there is no browser API or runtime behavior to observe here, only the CLI\'s own output and exit code. This subtopic uses a plain code example rather than a live playground, the same treatment already used for other build-time-only content (Tailwind\'s JIT scanner, module bundler tree-shaking).',
        'What IS worth carefully understanding is a genuine, easy-to-miss distinction the main page\'s own mistake entry only partially covers: <code>initial</code> and <code>anyScript</code> are not "the same budget applied twice" — they measure fundamentally different things, and a real app can pass one while failing the other.',
      ]
    },
    {
      heading: '"initial" measures a SUM across files; "anyScript" measures each file INDEPENDENTLY — the same numbers can pass one check and fail the other',
      points: [
        '<code>initial</code> adds up every JS + CSS chunk that must download before the app boots (main bundle, polyfills, initial styles, and any eagerly-loaded chunks) into ONE total, then compares that total against the limit.',
        '<code>anyScript</code> instead checks EACH individual chunk file separately against the SAME limit — a build with ten 40 KB chunks passes an <code>anyScript</code> limit of 50 KB (every single file is under 50 KB) even though its <code>initial</code> total of 400 KB might fail an <code>initial</code> limit of 300 KB.',
        'The reverse failure mode is just as real: a build with one legitimate 180 KB vendor chunk (React interop, a chart library) alongside several tiny app chunks might have a perfectly healthy <code>initial</code> total of 250 KB (well under a 300 KB limit) while still failing an <code>anyScript</code> limit of 150 KB, because that ONE chunk individually exceeds it — even though the overall page load is fine.',
        'Setting only ONE of these two budget types leaves a real blind spot: <code>initial</code> alone won\'t catch "one chunk somehow ballooned to 2 MB while everything else shrank to compensate" (as long as the sum stays under budget); <code>anyScript</code> alone won\'t catch "we now have twelve reasonably-sized eager chunks that collectively make the initial load slow."',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two failure modes, same numbers',
      language: 'typescript',
      code: `// angular.json — setting BOTH budget types catches different problems

{
  "budgets": [
    {
      "type": "initial",        // total of ALL initial-load chunks, summed
      "maximumWarning": "300kB",
      "maximumError": "500kB"
    },
    {
      "type": "anyScript",      // EACH chunk file checked independently
      "maximumWarning": "100kB",
      "maximumError": "200kB"
    }
  ]
}

// Scenario A: passes anyScript, FAILS initial
// 10 chunks × 40kB each = 400kB total
// - anyScript check: every file is 40kB < 200kB limit → PASS
// - initial check:   sum is 400kB > 300kB warning     → WARN/FAIL
// Root cause: too many separately-fine-sized eager chunks, adding up.

// Scenario B: passes initial, FAILS anyScript
// 1 vendor chunk (180kB) + 3 small app chunks (20kB each) = 240kB total
// - initial check:   sum is 240kB < 300kB limit        → PASS
// - anyScript check: the 180kB chunk exceeds 100kB warn → WARN
// Root cause: one legitimately large chunk, even though the page total is healthy.

// Only checking ONE of the two budget types would silently let the OTHER
// failure mode through — this is why the main page's own code sample
// includes both "initial" and "anyScript" together, not as redundant checks.`,
    },
    {
      label: 'Reading ng build budget output',
      language: 'bash',
      code: `# Scenario A output — initial budget exceeded, anyScript budget fine
$ ng build --configuration=production

Initial chunk files | Names         |  Raw size
main.a1b2c3.js       | main          | 180.40 kB
chunk-x1.js          | lazy-route-1  |  40.12 kB  |
chunk-x2.js          | lazy-route-2  |  40.08 kB  |
... (8 more chunks, ~40kB each)

WARNING: budget-exceeded — initial exceeded maximum budget.
Budget 300.00 kB was not met by 100.40 kB with a total of 400.40 kB.

# Every individual chunk is well under the anyScript limit —
# the CLI does not print an anyScript warning here at all.
# The ONLY signal is the initial-budget total warning above.

# Scenario B output — anyScript budget exceeded, initial budget fine
$ ng build --configuration=production

Initial chunk files | Names    |  Raw size
main.a1b2c3.js       | main     |  60.20 kB
vendor.d4e5f6.js      | vendor   | 180.00 kB  <-- flagged individually

WARNING: budget-exceeded — vendor.d4e5f6.js exceeded maximum budget.
Budget 100.00 kB was not met by 80.00 kB with a total of 180.00 kB.

# The overall initial total (240kB) never appears as a problem —
# only the single oversized chunk is called out, by name.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s angular.json only sets an "initial" budget of 500kB, with no "anyScript" budget at all. Over several months, a single lazy-loaded route\'s chunk gradually grows to 2.3 MB (a heavy charting library got added there, with no code-splitting inside that route) — but because it\'s LAZY, it\'s not part of the "initial" total, and no other chunk changed. Would the current budget setup have caught this?',
    hint: 'Think carefully about what "initial" actually sums — does a LAZY-loaded chunk get counted in that total at all?',
    solution: 'No — this specific setup would NOT catch it, and the reason is even more specific than just "wrong budget type." The main page\'s own theory notes "initial" covers what "must be downloaded before the app boots" — a genuinely lazy-loaded route chunk is by definition NOT part of that initial download, so it is excluded from the "initial" total entirely, regardless of how large it grows. Neither an "initial" budget NOR the "anyScript" example in this subtopic\'s Scenario A/B would catch unbounded growth of a single lazy chunk unless "anyScript" (which checks every chunk, lazy or eager, individually) is specifically configured — confirming the theory point that "initial" alone leaves a real blind spot for exactly this failure mode. Adding an "anyScript" budget (checking every individual chunk, lazy included) would have caught the 2.3 MB lazy chunk the moment it crossed the per-chunk limit, regardless of what the initial total was doing.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Angular CLI\'s "initial" and "anyScript" budget types are two different ways of enforcing roughly the same limit — setting both is mostly redundant, like a stricter version of one check.',
      reality: 'They measure fundamentally different things — "initial" is a SUM across files, "anyScript" checks EACH file independently — this subtopic\'s two scenarios show real, plausible builds that pass one check while failing the other with the exact same underlying numbers, confirming they catch genuinely different failure modes, not redundant ones.'
    },
    {
      thought: 'A healthy "initial" budget total guarantees no individual chunk in the app has grown unreasonably large.',
      reality: 'Scenario B in this subtopic shows the opposite is possible — a total initial size well under budget (240kB under a 300kB limit) can still contain one individually oversized chunk (180kB) that a per-chunk "anyScript" check would flag but an "initial"-only setup would miss entirely.'
    },
    {
      thought: 'Since lazy-loaded route chunks aren\'t part of the initial bundle, they don\'t need any budget enforcement at all — only the initial/eager bundle matters for performance.',
      reality: 'This subtopic\'s exercise shows a lazy chunk left completely unbounded can grow to 2.3 MB with zero warning from an "initial"-only budget setup — a user navigating to that specific route still has to download that oversized chunk, making it a real user-facing performance problem the main page\'s "anyScript" budget type (which applies to ANY chunk, lazy or eager) is specifically designed to catch.'
    }
  ];
}
