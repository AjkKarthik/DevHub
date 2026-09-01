import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Comment Describing Behavior the Config Doesn’t Implement',
    points: [
      'The main page’s own "Promtail Config" codeTab originally had a section labeled "Sample 10% of health check logs," configured with a <code>drop</code> stage matching <code>&#39;"path":"/health"&#39;</code> and a trailing comment: "Drop 90% of health checks: keep only when hash(log_line) % 10 == 0" — but the actual <code>drop</code> stage shown has no hash-based condition anywhere in it. It unconditionally drops EVERY line matching that string.',
      'Confirmed directly against Loki’s own official documentation for the <code>drop</code> pipeline stage: its configuration fields are <code>source</code>, <code>separator</code>, <code>value</code>, <code>expression</code>, <code>older_than</code>, <code>longer_than</code>, and <code>drop_counter_reason</code> — none of which is a percentage or probability. The stage is purely deterministic: for a given log line, it either matches the condition (and drops it) or doesn’t (and keeps it). There is no way to configure it to drop only a FRACTION of matching lines.',
      'The SAME page’s own later mistake block, "Shipping all logs including health check and metrics scrape logs," uses the exact identical <code>drop: expression: &#39;"path":"/health"&#39;</code> pattern — but correctly frames it as "Drop health check and metrics logs at Promtail level," a full drop, with no sampling claim at all. Comparing the two sections against each other is what makes the earlier "sample 10%" framing’s inaccuracy obvious without needing to consult external docs at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'What the drop Stage Actually Supports',
    language: 'bash',
    code: `# Every field the real Loki "drop" pipeline stage supports:
# - source            (which extracted field to check, or the raw log line)
# - separator          (used when source is a list of fields)
# - value               (exact-match comparison against source)
# - expression          (RE2 regex match)
# - older_than          (drop lines older than a duration)
# - longer_than         (drop lines longer than a byte length)
# - drop_counter_reason (label for the internal drop-count metric)
#
# Notice: NO field for "drop X% of matching lines" exists anywhere in
# this list. A drop stage is a pure yes/no gate per log line.

- drop:
    expression: '"path":"/health"'
    drop_counter_reason: health_check_full_drop
# -> This drops 100% of matching health-check lines, not a sampled
#    fraction -- there is no config that would make it drop only 90%.

# True probabilistic sampling has to happen BEFORE the log line is even
# emitted -- in application code, using the exact technique already
# built on the Structured Logging topic's own "Building a Log Sampler"
# subtopic:
function shouldSampleLog(level: string, rates: Record<string, number>): boolean {
  const rate = rates[level] ?? 1.0;
  if (rate >= 1.0) return true;
  return Math.random() < rate;
}
// A health-check request handler checks this BEFORE calling logger.info(...)
// -- Promtail never even sees the 90% of lines that were never emitted.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes a workaround: since <code>drop</code> supports an <code>expression</code> (RE2 regex), write a regex that matches roughly 10% of health-check log lines by checking whether the last character of the <code>traceId</code> field is <code>&#39;0&#39;</code> (one out of sixteen possible hex digits, close enough to ~10%), and drop everything that DOESN’T match. Would this actually work as a sampling mechanism?',
  hint: 'Think about what determines a given request’s <code>traceId</code>, and whether that value is independent from request to request, or correlated with anything else about the request.',
  solution: `// It technically works as a crude ~1-in-16 sampling mechanism (since
// trace IDs are effectively random hex), but it has a real, subtle cost
// the naive "10%" framing hides: it's IMPOSSIBLE to independently tune
// the sample rate away from whatever fraction the regex happens to
// carve out of the hex alphabet (1/16 =~ 6.25%, not a clean 10% -- there's
// no way to express "keep exactly 10%" using a single hex-digit check).
//
// It's also strictly WORSE than doing nothing extra at the Promtail
// layer: this regex still requires Promtail to receive, parse, and
// evaluate every single health-check log line before deciding to drop
// most of them -- the shipping and CPU cost of PROCESSING the log line
// already happened. The whole point of application-level sampling (the
// approach shown in the codeTab above) is that the 90% of dropped lines
// are never even WRITTEN in the first place, let alone shipped to
// Promtail for it to evaluate a regex against.
//
// So the regex trick "works" numerically but defeats the actual cost-
// saving goal that "sampling" exists for in this context -- the
// meaningful cost isn't in Loki's storage, it's in generating and
// shipping the log line at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since Promtail’s <code>drop</code> stage can’t sample, "sampling" as a cost-control technique for log shipping simply isn’t possible in a Loki-based pipeline at all.',
    reality: 'Sampling is entirely possible — it just has to happen at a DIFFERENT layer than the shipper. The main page’s own theory section (and the sibling Structured Logging topic’s own subtopic) both describe application-level sampling: the decision to emit a log line at all happens in the logging library, before Promtail (or any shipper) ever sees it. The shipper’s job is delivering whatever the application already decided to log — it was never the right layer for probabilistic decisions to begin with.',
  },
  {
    thought: 'The <code>value</code> field listed among the drop stage’s real config options must be the percentage/rate parameter, just under a differently-named field.',
    reality: '<code>value</code> is an EXACT-match comparison field — it checks whether an extracted <code>source</code> field equals a specific string, the same category of condition as <code>expression</code> (a regex match) — not a numeric rate. Every one of the drop stage’s real fields (<code>source</code>, <code>value</code>, <code>expression</code>, <code>older_than</code>, <code>longer_than</code>) describes a CONDITION to check against a single log line in isolation; none of them can reference anything about the surrounding stream of lines, which is what a rate/percentage would fundamentally require.',
  },
  {
    thought: 'The original comment’s "hash(log_line) % 10 == 0" idea is a reasonable one that Promtail just happens not to support directly — if it DID exist, it would be equivalent to the application-level random sampling shown in the fix.',
    reality: 'A hash-of-log-content approach is actually a DIFFERENT, DETERMINISTIC sampling strategy from <code>Math.random()</code>-based sampling — hashing the log line’s own content means the SAME log message would always get the SAME keep/drop decision every time it recurs verbatim, which could systematically under- or over-represent certain repeated messages depending on what their hash happens to be, unlike true random sampling, which treats every occurrence independently regardless of content.',
  },
];

@Component({
  selector: 'app-obs-log-aggregation-drop-stage-sampling',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './promtails-drop-stage-has-no-sampling-rate.html',
  styleUrl: './promtails-drop-stage-has-no-sampling-rate.scss',
})
export class PromtailsDropStageHasNoSamplingRateSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
