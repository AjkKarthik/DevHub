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
  templateUrl: './naive-serving-units-mismatch.html',
  styleUrl: './naive-serving-units-mismatch.scss'
})
export class NaiveServingRequestsVsTokensMismatchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two different numbers, two different units, describing the same "naive serving" baseline',
      points: [
        'The main page\'s theory section originally stated: "Naïve serving: one GPU per request. Throughput: ~1 request/sec on a single A100." The SAME page\'s "LLM Serving (vLLM)" code sample, describing the same naive (no batching) baseline, states: "Naive (one request at a time): ~15 tokens/sec." The page has been corrected so the theory section states the throughput in tokens/sec, matching the code sample.',
        'On the surface these look like they could both be true (one about requests, one about tokens) — but the page ELSEWHERE gives a concrete output-length figure ("~400 output tokens" per response, in the Challenge\'s latencyBudget) that lets the two numbers be reconciled and compared directly.',
      ]
    },
    {
      heading: 'Reconciling the two figures reveals a ~27x disagreement',
      points: [
        'If naive serving produces 15 tokens/sec, and a typical response is ~400 tokens, one full response takes roughly 400 ÷ 15 ≈ 26.7 seconds — meaning naive throughput is closer to 1 request per ~27 seconds (~0.037 requests/sec), not "~1 request/sec" as the theory section originally claimed.',
        'The gap between "~1 request/sec" and the reconciled "~0.037 requests/sec" is roughly 27x — not a rounding difference, but two genuinely different characterizations of the same baseline scenario.',
      ]
    },
    {
      heading: 'Why the tokens/sec framing is the more useful one to keep',
      points: [
        'Tokens/sec is the more standard, directly-comparable unit for LLM serving throughput — it\'s what the SAME page\'s own vLLM comparison chain uses throughout ("~15 tokens/sec" naive → "~350 tokens/sec" continuous batching → "~500 tokens/sec" with prefix caching), so keeping the theory section in the same unit makes the whole page internally consistent and lets a reader compare all three numbers on the same scale.',
        '"Requests/sec" depends on an assumption about average response length that varies a lot by use case (a one-word answer vs. a long generated essay) — tokens/sec is a more stable, apples-to-apples metric for comparing serving techniques independent of how long any particular response happens to be.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reconciling requests/sec and tokens/sec',
      language: 'typescript',
      code: `interface ThroughputClaim {
  metric: 'requests/sec' | 'tokens/sec';
  value: number;
}

function reconcile(tokensPerSec: number, avgTokensPerResponse: number): number {
  // How many full responses complete per second, given a tokens/sec rate?
  return tokensPerSec / avgTokensPerResponse;
}

const codeTabClaim: ThroughputClaim = { metric: 'tokens/sec', value: 15 };
const avgResponseLength = 400; // stated elsewhere on the same page

const reconciledRequestsPerSec = reconcile(codeTabClaim.value, avgResponseLength);
console.log(reconciledRequestsPerSec); // ~0.0375 requests/sec

// The theory section's original claim:
const theoryClaim: ThroughputClaim = { metric: 'requests/sec', value: 1 };

// Compare the theory section's claim against the reconciled figure:
const discrepancyFactor = theoryClaim.value / reconciledRequestsPerSec;
console.log(discrepancyFactor); // ~26.7x -- not a rounding difference

// Corrected: state the theory section's claim in tokens/sec too,
// matching the code sample's own unit and eliminating the need to
// reconcile two different metrics for the same baseline at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page states "naive LLM serving: ~1 request/sec" in one section and "naive serving: ~15 tokens/sec" in another, both describing the same no-batching baseline on the same GPU. The page also states responses average ~400 output tokens. Do these two throughput figures agree with each other?',
    hint: 'If naive serving produces 15 tokens per second, and each response is ~400 tokens long, how many SECONDS does one full response take to generate -- and how does that translate to requests per second?',
    solution: 'No, they don\'t agree -- reconciling the two: at 15 tokens/sec, a ~400-token response takes roughly 400 / 15 ≈ 26.7 seconds to complete, which works out to about 1 request per 27 seconds (~0.037 requests/sec), not "~1 request/sec" as originally claimed. That\'s roughly a 27x discrepancy between the two stated figures for the same scenario. The fix is describing naive throughput in tokens/sec everywhere on the page (matching the code sample\'s own unit, and the same unit used for the vLLM continuous-batching and prefix-caching comparisons), rather than mixing requests/sec and tokens/sec for what should be one consistent baseline number.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"~1 request/sec" and "~15 tokens/sec" could both accurately describe the same naive LLM serving baseline, since they\'re measuring different things (requests vs. tokens).',
      reality: 'Per this subtopic\'s theory, once a typical response length (~400 tokens, stated elsewhere on the SAME page) is used to convert between the two units, they disagree by roughly 27x — they are not two compatible descriptions of the same throughput, one of them is simply wrong.'
    },
    {
      thought: 'When a page states a throughput figure in one unit (requests/sec) in one section and a related figure in a different unit (tokens/sec) in another section, there\'s no way to check whether they\'re consistent without additional external research.',
      reality: 'Per this subtopic\'s theory, the SAME page already provided the conversion factor needed (an average response length of ~400 tokens, stated in the Challenge\'s own latencyBudget) — no external research was needed, just combining two numbers already present on the page.'
    },
    {
      thought: 'Since tokens/sec and requests/sec are just two different ways of expressing throughput, either unit is an equally good choice for a page that already uses BOTH elsewhere.',
      reality: 'Per this subtopic\'s theory, tokens/sec is the more useful and consistent choice here specifically because the SAME page\'s own vLLM comparison chain (naive → continuous batching → prefix caching) already uses tokens/sec throughout — keeping the theory section in that same unit makes every throughput figure on the page directly comparable on one consistent scale.'
    }
  ];
}
