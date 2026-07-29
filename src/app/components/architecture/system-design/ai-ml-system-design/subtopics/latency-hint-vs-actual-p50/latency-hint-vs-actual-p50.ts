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
  templateUrl: './latency-hint-vs-actual-p50.html',
  styleUrl: './latency-hint-vs-actual-p50.scss'
})
export class ChallengeHintSaidLlm24sSolutionsOwnP50Was15sSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A hint\'s stated range and the solution\'s own numbers didn\'t agree',
      points: [
        'The Challenge\'s own hints originally stated: "Latency budget: embedding 100ms + ANN 50ms + LLM 2-4s = under 5s." The SAME Challenge\'s solution gives the actual LLM latency figures: "LLM inference (P50): 1500ms, LLM inference (P99): 3500ms." 1500ms (1.5s) falls BELOW the hint\'s stated floor of 2s. The page has been corrected so the hint states "LLM 1.5-3.5s (P50-P99)," matching the solution exactly.',
        'This is catchable purely by comparing two numbers stated on the SAME page for the SAME quantity — no LLM-serving expertise needed, just noticing 1.5s isn\'t inside the range "2-4s."',
      ]
    },
    {
      heading: 'Why a hint disagreeing with its own solution is a real problem, not a cosmetic one',
      points: [
        'A "hint" in this page\'s format is meant to guide someone attempting the Challenge BEFORE seeing the solution — if the hint states a latency range that\'s subtly wrong relative to the actual solution, someone using the hint to sanity-check their own answer could conclude their own (correct) faster estimate is wrong, when it actually matches the reference solution better than the hint did.',
        'The total P99 latency (~3.7s, per the solution\'s own math: 100 + 5 + 50 + 3500 = 3655ms) does fall inside the hint\'s original "under 5s" budget claim — it\'s specifically the LOWER bound of the LLM sub-range (2s) that didn\'t match the solution\'s P50 (1.5s), a narrower and easier-to-miss kind of mismatch than a wildly wrong total.',
      ]
    },
    {
      heading: 'A useful habit: hints and solutions should be checked against each other, not just each independently',
      points: [
        'A hint is often written to be DIRECTIONALLY helpful without necessarily being computed from the exact same numbers as the eventual solution — but when a hint states a specific numeric range (not just "the LLM call will dominate latency"), it\'s worth verifying that range actually contains the solution\'s own figures.',
        'The safest fix in cases like this is making the hint\'s numbers a direct reflection of the solution\'s own figures (as done here: "1.5-3.5s (P50-P99)") rather than an independently-estimated range that can drift from what the solution actually states.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking a hint\'s range against the solution\'s own numbers',
      language: 'typescript',
      code: `interface LatencyBudget {
  embeddingMs: number;
  annSearchMs: number;
  llmP50Ms: number;
  llmP99Ms: number;
}

const solutionBudget: LatencyBudget = {
  embeddingMs: 100,
  annSearchMs: 50,
  llmP50Ms: 1500,   // from the solution's own latencyBudget field
  llmP99Ms: 3500,
};

// The hint claimed the LLM step alone takes "2-4s" (2000-4000ms).
const hintLlmRangeMs = { low: 2000, high: 4000 };

function rangeContains(value: number, range: { low: number; high: number }): boolean {
  return value >= range.low && value <= range.high;
}

console.log(rangeContains(solutionBudget.llmP50Ms, hintLlmRangeMs)); // false -- 1500 < 2000
console.log(rangeContains(solutionBudget.llmP99Ms, hintLlmRangeMs)); // true  -- 3500 is in range

// The corrected hint range, taken directly from the solution's own figures:
const correctedHintRangeMs = { low: solutionBudget.llmP50Ms, high: solutionBudget.llmP99Ms };
console.log(rangeContains(solutionBudget.llmP50Ms, correctedHintRangeMs)); // true
console.log(rangeContains(solutionBudget.llmP99Ms, correctedHintRangeMs)); // true`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Challenge\'s hint states "Latency budget: embedding 100ms + ANN 50ms + LLM 2-4s = under 5s." The Challenge\'s own solution states "LLM inference (P50): 1500ms, LLM inference (P99): 3500ms." Does the solution\'s P50 figure fall inside the hint\'s stated LLM range? What should the hint say instead?',
    hint: 'Convert 1500ms to seconds, then check: is 1.5 greater than or equal to the hint\'s stated lower bound of 2?',
    solution: 'No -- 1500ms (1.5s) is BELOW the hint\'s stated floor of 2s, so the solution\'s own P50 figure falls outside the range the hint claims. The P99 figure (3500ms = 3.5s) does fall inside the "2-4s" range, which is likely why the mismatch wasn\'t obvious at a glance -- the upper end checks out even though the lower end doesn\'t. The hint should state the range directly from the solution\'s own numbers: "LLM 1.5-3.5s (P50-P99)" -- this guarantees the hint and the solution agree, rather than risking drift from two independently-estimated figures.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A "hint" provided before a Challenge\'s solution is meant to be a loose, approximate guide — it doesn\'t need to precisely match the solution\'s own numbers, just point in the right general direction.',
      reality: 'Per this subtopic\'s theory, when a hint states a SPECIFIC numeric range (not just general guidance), a reader may reasonably use it to sanity-check their own estimate — a range that excludes the actual solution\'s P50 figure can cause someone to doubt a correct answer that\'s actually closer to the truth than the hint itself.'
    },
    {
      thought: 'If the upper bound of a stated range matches a solution\'s figure, the range as a whole is probably consistent with the solution.',
      reality: 'Per this subtopic\'s theory, this page\'s own case shows a range whose UPPER bound (4s) comfortably contained the solution\'s P99 figure (3.5s) while its LOWER bound (2s) excluded the solution\'s P50 figure (1.5s) — checking only one end of a range isn\'t sufficient to confirm it fully contains the relevant numbers.'
    },
    {
      thought: 'Once a Challenge\'s solution is written with specific, detailed numbers, any earlier hint text referencing the same quantity will already reflect those exact figures, since they describe the same design.',
      reality: 'Per this subtopic\'s theory, a hint and a solution can be authored somewhat independently (the hint as a rough estimate, the solution with a fully worked-out breakdown) — the safest way to keep them in sync is deriving the hint\'s numbers FROM the solution\'s own figures directly, rather than assuming the two will naturally agree.'
    }
  ];
}
