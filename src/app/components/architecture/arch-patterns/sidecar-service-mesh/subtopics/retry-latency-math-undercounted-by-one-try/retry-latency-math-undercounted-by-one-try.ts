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
  templateUrl: './retry-latency-math-undercounted-by-one-try.html',
  styleUrl: './retry-latency-math-undercounted-by-one-try.scss'
})
export class RetryLatencyMathUndercountedByOneTrySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A comment that multiplied the wrong number of tries',
      points: [
        'The Challenge\'s reference solution defines <code>retryPolicy = { attempts: 2, perTryTimeout: \'2s\', ... }</code> with the comment "Total max latency: 2 × 2s = 4s." That arithmetic silently assumes <code>attempts: 2</code> means "2 total tries."',
        'Verified via research into Istio\'s own documented VirtualService <code>HTTPRetry</code> spec: the <code>attempts</code> field counts RETRIES that happen AFTER the initial request — it does not include the original try. <code>attempts: 2</code> means the original request PLUS up to 2 retries, for 3 total tries.',
        'With 3 total tries at <code>perTryTimeout: \'2s\'</code> each, the actual worst-case max latency is 3 × 2s = 6s, not the stated 4s — a real, checkable understatement of exactly the number this page\'s own Challenge asks the reader to compute correctly.',
      ]
    },
    {
      heading: 'Why this particular off-by-one is easy to make and worth watching for elsewhere',
      points: [
        'The English word "attempts" reads naturally as "total attempts" to someone who hasn\'t specifically checked the field\'s documented semantics — Istio\'s own choice to define it as "retries after the first try" is a real, if slightly unintuitive, API design detail that isn\'t obvious from the field name alone.',
        'This isn\'t unique to Istio: many retry libraries and APIs across different ecosystems have exactly this ambiguity (does a "retries" or "attempts" count include the original try or not?), and the field\'s actual behavior has to be checked against its documentation rather than assumed from the name — the same discipline this page\'s own "no service versioning strategy" and other technical claims already require elsewhere in this hub.',
        'The practical consequence for anyone using this page\'s Challenge as a template: budgeting SLO headroom based on the ORIGINAL (undercounted) "4s max" comment would leave a real gap — an actual worst-case retry sequence taking 6s could still be running when a caller\'s own timeout, sized against the wrong 4s figure, has already given up.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Counting tries correctly',
      language: 'bash',
      code: `# Istio VirtualService HTTPRetry.attempts semantics (per Istio's own spec):
#   "attempts" = number of RETRIES after the initial request
#   total tries = 1 (original) + attempts

# This page's Challenge:
retries:
  attempts: 2
  perTryTimeout: 2s

# WRONG comment (undercounts by one try):
#   Total max latency: 2 x 2s = 4s

# CORRECT:
#   total tries = 1 original + 2 retries = 3 tries
#   Total max latency: 3 x 2s = 6s

# General formula for sizing an outer timeout/SLO budget against an
# Istio retry policy:
#   max_latency = (attempts + 1) x perTryTimeout   [+ any retry backoff]
#
# Always add 1 to 'attempts' before multiplying by perTryTimeout --
# forgetting it is the exact mistake this subtopic corrects.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets a caller-side HTTP client timeout of 5 seconds for calls to order-service, reasoning that order-service\'s own Istio retry policy is attempts: 2 with perTryTimeout: 2s, giving "4 seconds max" -- so 5 seconds leaves a safety margin. Does it?',
    hint: 'How many total tries does attempts: 2 actually produce, and what\'s the real worst-case latency at 2s per try?',
    solution: 'No -- the "4 seconds max" figure the team is reasoning from is itself wrong. attempts: 2 means 2 RETRIES after the original request, for 3 total tries at up to 2s each: a real worst case of 6 seconds, not 4. The caller\'s 5-second timeout is actually BELOW the retry policy\'s own real worst-case latency, meaning the caller could give up and time out while order-service\'s retry sequence is still legitimately in progress -- the opposite of the safety margin the team believed they had. Fixing the caller\'s timeout requires first fixing the underlying (attempts + 1) x perTryTimeout arithmetic, not just picking a number that looks comfortably larger than the wrong figure.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A field named "attempts" in a retry configuration most likely means the total number of tries, original request included.',
      reality: 'Per this subtopic\'s theory, Istio\'s own documented HTTPRetry.attempts specifically counts RETRIES after the initial request — the field name alone doesn\'t disambiguate this, and it has to be checked against the actual spec.'
    },
    {
      thought: 'A one-try miscounting error in a latency comment is a cosmetic documentation issue, not something that affects real system behavior.',
      reality: 'Per this subtopic\'s theory, an undercounted worst-case latency figure can directly cause a caller\'s own timeout to be sized too aggressively — timing out while a legitimately in-progress retry sequence is still running, exactly the failure mode a "safety margin" was meant to prevent.'
    },
    {
      thought: 'This specific off-by-one in Istio\'s attempts field is a one-off quirk unlikely to appear in other retry configuration APIs.',
      reality: 'Per this subtopic\'s theory, the same ambiguity (does a retry count include the original try?) recurs across many different retry libraries and APIs — the field\'s actual documented behavior always needs checking, not assuming from the name, regardless of which specific technology is in use.'
    }
  ];
}
