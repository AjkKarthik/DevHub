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
    heading: 'From "Keep 1% of INFO Logs" to an Actual Function',
    points: [
      'The main page’s own quiz explains log sampling in real technical depth — "keep 1% of INFO-level request logs... keep 100% of ERROR logs... keep 10% of WARN logs" — and states the key property that makes this useful rather than just lossy: "sampling preserves statistical validity — you can estimate the true count from the sample." No codeTab anywhere on the page ever implements this.',
      'The mechanism itself is a single probability check per log level: for a level with sample rate <code>r</code>, generate a random number in <code>[0, 1)</code> and keep the log only if that number is less than <code>r</code>. Over many log lines, this converges to keeping approximately the fraction <code>r</code> of them — verified below by running the check hundreds of thousands of times and comparing the observed keep rate to the configured one.',
      'The "estimate the true count" property the quiz names is the direct payoff: if 1% of INFO logs are kept and 486 of them were actually retained, dividing back by the 1% rate gives an estimated true count of 48,600 — recoverable statistics from a fraction of the data, at the cost of losing the ability to retrieve any SPECIFIC dropped event.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Sampler, Verified Against the Quiz’s Own Rates',
    language: 'typescript',
    code: `type LogLevel = 'error' | 'warn' | 'info';

// The quiz's own numbers: keep 100% of ERROR, 10% of WARN, 1% of INFO.
const SAMPLE_RATES: Record<LogLevel, number> = { error: 1.0, warn: 0.1, info: 0.01 };

function shouldSampleLog(level: LogLevel, rates: Record<LogLevel, number> = SAMPLE_RATES): boolean {
  const rate = rates[level] ?? 1.0; // default: keep anything not explicitly configured
  if (rate >= 1.0) return true;
  return Math.random() < rate;
}

// Verify the observed keep rate converges to the configured rate.
function observedKeepRate(level: LogLevel, trials: number): number {
  let kept = 0;
  for (let i = 0; i < trials; i++) {
    if (shouldSampleLog(level)) kept++;
  }
  return kept / trials;
}

const N = 200_000;
console.log('error observed:', observedKeepRate('error', N).toFixed(4), '(expected 1.0)');
console.log('warn  observed:', observedKeepRate('warn', N).toFixed(4), '(expected ~0.1)');
console.log('info  observed:', observedKeepRate('info', N).toFixed(4), '(expected ~0.01)');
// -> error observed: 1.0000 (expected 1.0)
// -> warn  observed: 0.0994 (expected ~0.1)
// -> info  observed: 0.0099 (expected ~0.01)

// Recovering an estimated TRUE count from a sampled count -- the
// quiz's own "statistical validity" claim, made concrete.
function estimateTrueCount(sampledCount: number, sampleRate: number): number {
  return sampledCount / sampleRate;
}
// If 486 INFO logs were kept out of a true 50,000 at a 1% rate:
console.log('estimated true count:', estimateTrueCount(486, 0.01)); // -> 48600`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The quiz explanation warns: "if you sample 1% of request logs, you cannot find the specific request from a particular user in the 99% that were dropped." A teammate proposes fixing this by making <code>shouldSampleLog()</code> deterministic instead of random — hashing the request’s <code>userId</code> and keeping the log only if the hash falls in the bottom 1% of the hash range. Does this solve the "can’t find a specific dropped request" problem?',
  hint: 'Ask what happens to EVERY log line from that SAME user, not just one specific request — does the hash-based decision vary per request, or per user?',
  solution: `// It doesn't solve the "find a specific request" problem, but it DOES
// solve a DIFFERENT, arguably more valuable problem: consistent
// per-user sampling.
//
// Hashing on userId means the sampling DECISION is now the same for
// EVERY request from that same user (the hash of a given userId never
// changes) -- so a user who falls in the kept 1% has ALL of their
// requests logged, and a user who falls in the dropped 99% has NONE of
// theirs logged. You still can't recover a SPECIFIC dropped request
// for a dropped user, but you CAN now reliably follow one particular
// user's entire session end-to-end if they happen to be sampled in --
// something pure per-request random sampling can never guarantee,
// since two requests from the SAME user could independently land on
// opposite sides of a random 1% coin flip.
//
// This is a real, common technique (consistent/deterministic sampling)
// distinct from the page's own random per-event sampling -- it trades
// "some users get zero visibility" for "sampled users get COMPLETE
// visibility," which is a different, sometimes more useful trade-off
// depending on whether the debugging need is "show me this exact
// event" or "show me this user's whole journey."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>Math.random() < rate</code> is the whole mechanism, a rate of exactly 0 would still occasionally let a log through due to floating-point edge cases.',
    reality: '<code>Math.random()</code> returns a value in <code>[0, 1)</code> — it can equal 0 but never reach 1. A rate of exactly 0 means the condition <code>Math.random() < 0</code> is checking whether a non-negative number is strictly less than 0, which is never true (the smallest possible result, 0, still fails <code>0 < 0</code>) — so a 0% sample rate genuinely keeps nothing, no edge case needed.',
  },
  {
    thought: 'The <code>estimateTrueCount()</code> function gives an exact reconstruction of the true count, not just an estimate — the quiz calls it "statistical validity" but the math itself is deterministic.',
    reality: 'It’s a genuine ESTIMATE with real statistical noise, not a reconstruction — dividing a sampled count by the rate only recovers the true count on AVERAGE across many trials. A single run sampling 1% of a true 50,000-event population will typically land within a few percent of 50,000, not exactly on it, purely from the randomness inherent in which events happened to be sampled — the codeTab’s own 48,600 estimate against a true 50,000 (a ~3% gap) is a realistic example of that expected noise, not a rounding artifact.',
  },
  {
    thought: 'Since ERROR logs are always kept at a 1.0 (100%) rate, the <code>shouldSampleLog()</code> function’s random check still runs for every ERROR log — it just always happens to return true.',
    reality: 'The function short-circuits before ever calling <code>Math.random()</code> at all for a rate of 1.0 or higher — the explicit <code>if (rate &gt;= 1.0) return true;</code> check returns immediately. This isn’t just a micro-optimization: it also means a rate of exactly 1.0 is genuinely, unconditionally guaranteed to keep every log, rather than relying on <code>Math.random() &lt; 1.0</code> being true for every possible random draw (which it technically always is, since <code>Math.random()</code> never reaches 1, but the explicit short-circuit makes the guarantee obvious from reading the code rather than depending on that fact).',
  },
];

@Component({
  selector: 'app-obs-structured-logging-sampler',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-a-log-sampler-from-the-quizs-own-numbers.html',
  styleUrl: './building-a-log-sampler-from-the-quizs-own-numbers.scss',
})
export class BuildingALogSamplerFromTheQuizsOwnNumbersSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
