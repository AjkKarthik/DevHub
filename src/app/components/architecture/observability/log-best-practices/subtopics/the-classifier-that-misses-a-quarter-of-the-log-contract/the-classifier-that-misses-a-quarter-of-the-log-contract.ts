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
    heading: 'Two Sections of the Same Page, Cross-Checked',
    points: [
      'The main page’s own "Log Contract" codeTab defines <code>LOG_EVENTS</code> — 13 real event messages, each with an explicitly configured level (<code>info</code>/<code>warn</code>/<code>error</code>). The Challenge, <code>classifyLogLevel()</code>, is a SEPARATE, generic keyword-based classifier — it was never claimed to reproduce the Log Contract’s decisions, but since both are about "what level should this event log at" on the same topic page, running the Log Contract’s own 13 messages through the classifier is a natural, self-contained check.',
      'Verified via direct execution: 3 of the 13 configured events come back classified as <code>&#39;debug&#39;</code> — the classifier’s fallback for "none of my keyword rules matched" — when the Log Contract says <code>info</code>, <code>error</code>, and <code>warn</code> respectively: <code>ORDER_CANCELLED</code> ("Order cancelled"), <code>DB_CONNECTION_LOST</code> ("Database connection lost"), and <code>CACHE_UNAVAILABLE</code> ("Cache unavailable, using DB fallback").',
      'This isn’t a bug in either section on its own — the Challenge’s rules are followed correctly, and the Log Contract’s level assignments are each individually sensible. It’s a genuine LIMITATION worth understanding: a small, hand-picked keyword list ("failed", "error", "declined", "retry", "timeout", "started", "completed", "created") inevitably misses real event phrasing that doesn’t happen to contain one of those specific words — "cancelled," "lost," and "unavailable" are all perfectly reasonable words for real log messages, and none of them are in the classifier’s vocabulary at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Every Log Contract Event, Run Through the Classifier',
    language: 'typescript',
    code: `function classifyLogLevel(event: string): 'debug' | 'info' | 'warn' | 'error' {
  const lower = event.toLowerCase();
  if ((lower.includes('failed') || lower.includes('error')) && !lower.includes('declined')) return 'error';
  if (lower.includes('declined') || lower.includes('retry') || lower.includes('timeout')) return 'warn';
  if (lower.includes('started') || lower.includes('completed') || lower.includes('created')) return 'info';
  return 'debug';
}

// Every event from the page's own "Log Contract" codeTab, with its
// EXPLICITLY CONFIGURED level:
const LOG_EVENTS = {
  REQUEST_STARTED:     { level: 'info',  msg: 'Request started' },
  REQUEST_COMPLETED:   { level: 'info',  msg: 'Request completed' },
  REQUEST_FAILED:      { level: 'error', msg: 'Request failed' },
  ORDER_CREATED:       { level: 'info',  msg: 'Order created' },
  ORDER_CANCELLED:     { level: 'info',  msg: 'Order cancelled' },
  PAYMENT_DECLINED:    { level: 'warn',  msg: 'Payment declined' },
  PAYMENT_ERROR:       { level: 'error', msg: 'Payment processing error' },
  JOB_STARTED:         { level: 'info',  msg: 'Background job started' },
  JOB_COMPLETED:       { level: 'info',  msg: 'Background job completed' },
  JOB_FAILED:          { level: 'error', msg: 'Background job failed' },
  DB_CONNECTION_LOST:  { level: 'error', msg: 'Database connection lost' },
  CACHE_UNAVAILABLE:   { level: 'warn',  msg: 'Cache unavailable, using DB fallback' },
  THIRD_PARTY_TIMEOUT: { level: 'warn',  msg: 'Third-party API timeout' },
} as const;

for (const [key, { level, msg }] of Object.entries(LOG_EVENTS)) {
  const classified = classifyLogLevel(msg);
  const match = classified === level;
  console.log(\`\${match ? 'OK  ' : 'MISMATCH'} \${key}: "\${msg}" -> configured=\${level}, classified=\${classified}\`);
}
// -> OK   REQUEST_STARTED: "Request started" -> configured=info, classified=info
// -> OK   REQUEST_COMPLETED: "Request completed" -> configured=info, classified=info
// -> OK   REQUEST_FAILED: "Request failed" -> configured=error, classified=error
// -> OK   ORDER_CREATED: "Order created" -> configured=info, classified=info
// -> MISMATCH ORDER_CANCELLED: "Order cancelled" -> configured=info, classified=debug
// -> OK   PAYMENT_DECLINED: "Payment declined" -> configured=warn, classified=warn
// -> OK   PAYMENT_ERROR: "Payment processing error" -> configured=error, classified=error
// -> OK   JOB_STARTED: "Background job started" -> configured=info, classified=info
// -> OK   JOB_COMPLETED: "Background job completed" -> configured=info, classified=info
// -> OK   JOB_FAILED: "Background job failed" -> configured=error, classified=error
// -> MISMATCH DB_CONNECTION_LOST: "Database connection lost" -> configured=error, classified=debug
// -> MISMATCH CACHE_UNAVAILABLE: "Cache unavailable, using DB fallback" -> configured=warn, classified=debug
// -> OK   THIRD_PARTY_TIMEOUT: "Third-party API timeout" -> configured=warn, classified=warn`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Rather than expanding the keyword list forever to catch every possible phrasing, a colleague proposes a completely different fix: change <code>classifyLogLevel()</code> to accept the EVENT KEY (like <code>&#39;DB_CONNECTION_LOST&#39;</code>) instead of the free-text message, and look it up directly in <code>LOG_EVENTS</code>. Would this fix all three mismatches, and what would it give up?',
  hint: 'Think about what information a direct lookup has access to that keyword-matching a free-text string never could — and what happens for an event that was never added to <code>LOG_EVENTS</code> in the first place.',
  solution: `// Yes -- a direct lookup would fix all three mismatches perfectly, and
// every OTHER already-correct event too, because it isn't GUESSING the
// level from wording at all; it's reading the level that was already
// explicitly, deliberately assigned when the event was defined. There's
// no keyword vocabulary to be incomplete, because there's no keyword
// matching happening.
//
// What it gives up: the classifier's whole VALUE PROPOSITION was
// working on ARBITRARY free-text messages -- log lines from code that
// was never routed through the LOG_EVENTS contract at all (a quick
// logger.info() someone wrote inline, a third-party library's own log
// output being re-classified). A LOG_EVENTS lookup can only classify
// events that were already deliberately catalogued; it has nothing to
// say about a message like "Disk usage at 91%" that was never added to
// the contract.
//
// The genuinely robust answer combines both: try the LOG_EVENTS lookup
// FIRST (exact, no guessing, catches every catalogued event correctly),
// and fall back to the keyword classifier only for messages that were
// never added to the contract -- getting the reliability of the lookup
// for known events and the imperfect-but-useful coverage of the
// heuristic for everything else.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the classifier correctly handles 10 of 13 real events (roughly 77%), it’s "mostly working" and the 3 misses are a minor edge case not worth worrying about.',
    reality: 'A silent misclassification to <code>&#39;debug&#39;</code> is a worse failure mode than an obvious error, precisely BECAUSE it looks plausible — a genuinely important event like "Database connection lost" (a real system failure) being classified as debug-level noise is exactly the kind of quiet mistake the main page’s own theory warns about elsewhere: "real errors logged as info and never surfaced to anyone watching error-level dashboards." A 77% success rate on a LEVEL-ASSIGNMENT tool is a real risk, not a rounding error, since the cost of the 23% failure mode (an important event going unnoticed) is disproportionately high compared to the cost of the 77% success (correctly routine classification).',
  },
  {
    thought: 'Adding "cancelled," "lost," and "unavailable" to the classifier’s keyword lists would be a complete, durable fix — the classifier would then correctly handle 100% of the Log Contract.',
    reality: 'It would fix these SPECIFIC three mismatches, but the underlying problem — a finite keyword list trying to anticipate every possible way an event might be phrased — doesn’t go away; it just moves to the NEXT event that happens to use different wording (a future event named "Cluster degraded" or "Rate limited," neither containing any current keyword, would create the identical failure mode all over again). Patching individual keywords treats a symptom, not the structural mismatch between keyword-guessing and having an authoritative source of truth already available in the SAME codebase.',
  },
  {
    thought: 'Since the classifier and the Log Contract disagree on 3 events, one of the two must be "wrong" and the other "right" — the Log Contract’s assigned levels are presumably the authoritative, correct ones.',
    reality: 'That’s a reasonable assumption given the Log Contract represents deliberate, considered decisions (the main page’s own theory calls it a "team agreement"), but it’s worth stating explicitly rather than assuming: the classifier’s rules were never DESIGNED to match the Log Contract’s specific choices in the first place — they’re a generic, standalone exercise. The "mismatch" is really "two independently-designed systems disagree," and the Log Contract being the more authoritative one is a judgment call based on what each artifact is FOR, not an inherent property of either.',
  },
];

@Component({
  selector: 'app-obs-log-best-practices-classifier-gap',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-classifier-that-misses-a-quarter-of-the-log-contract.html',
  styleUrl: './the-classifier-that-misses-a-quarter-of-the-log-contract.scss',
})
export class TheClassifierThatMissesAQuarterOfTheLogContractSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
