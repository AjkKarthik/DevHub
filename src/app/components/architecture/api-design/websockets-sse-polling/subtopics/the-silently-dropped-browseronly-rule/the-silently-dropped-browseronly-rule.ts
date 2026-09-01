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
    heading: 'A "Simplify" Step That Simplified Away a Real Rule',
    points: [
      'The main page’s own Challenge originally listed five rules for <code>selectTransport()</code>, including "browserOnly + !bidirectional → \'SSE\'." It then offered a "Simplify" shortcut collapsing the logic to just three branches — checking only <code>bidirectional</code> and <code>standardProxy</code> — which silently dropped BOTH <code>highFrequency</code> and <code>browserOnly</code> from the actual implementation.',
      'Dropping <code>highFrequency</code> turned out to be harmless: both bidirectional rules return <code>\'WebSocket\'</code> regardless of its value, so it genuinely never changes the answer. Dropping <code>browserOnly</code> was NOT harmless — for the specific input <code>{ bidirectional: false, standardProxy: false, browserOnly: true }</code>, the stated rule requires <code>\'SSE\'</code>, but the simplified logic (which never even LOOKS at <code>browserOnly</code>) fell through to the generic <code>\'SSE or WebSocket\'</code> default instead.',
      'This has now been fixed on the main page: an explicit <code>if (req.browserOnly) return \'SSE\';</code> branch was added, positioned AFTER the <code>standardProxy</code> check (since a <code>standardProxy</code> match already correctly returns <code>\'SSE\'</code> regardless of <code>browserOnly</code>, the two rules never actually conflict) and BEFORE the generic fallback.',
      'This is the same underlying failure mode this hub has hit before on a sibling Challenge (the GraphQL vs REST topic’s own precedence bug): a "simplified" implementation that quietly drops one of several parameters the function signature still accepts, without checking whether that parameter was actually redundant for every stated rule.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing and Fixing the Dropped Rule',
    language: 'typescript',
    code: `interface Requirements {
  bidirectional: boolean;
  highFrequency: boolean;
  standardProxy: boolean;
  browserOnly: boolean;
}

// ── BROKEN: the "Simplify" version never checks browserOnly at all ──────────
function selectTransportBroken(req: Requirements): string {
  if (req.bidirectional) return 'WebSocket';
  if (req.standardProxy) return 'SSE';
  return 'SSE or WebSocket';
}

// Per the Challenge's own stated rule: "browserOnly + !bidirectional -> SSE"
console.log(selectTransportBroken({
  bidirectional: false, highFrequency: false, standardProxy: false, browserOnly: true,
}));
// 'SSE or WebSocket' -- WRONG. browserOnly was silently ignored.

// ── FIXED: an explicit branch restores the stated rule ───────────────────────
function selectTransportFixed(req: Requirements): string {
  if (req.bidirectional) return 'WebSocket';
  if (req.standardProxy) return 'SSE';
  if (req.browserOnly) return 'SSE';
  return 'SSE or WebSocket';
}

console.log(selectTransportFixed({
  bidirectional: false, highFrequency: false, standardProxy: false, browserOnly: true,
}));
// 'SSE' -- correct.

// Confirms the fix changes NOTHING for inputs the original examples covered:
console.log(selectTransportFixed({ bidirectional: true, highFrequency: true, standardProxy: false, browserOnly: false })); // WebSocket
console.log(selectTransportFixed({ bidirectional: false, highFrequency: false, standardProxy: true, browserOnly: true })); // SSE
console.log(selectTransportFixed({ bidirectional: false, highFrequency: false, standardProxy: false, browserOnly: false })); // SSE or WebSocket`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The fixed version places the new <code>if (req.browserOnly) return \'SSE\';</code> branch AFTER the <code>standardProxy</code> check. Would placing it BEFORE the <code>standardProxy</code> check instead (immediately after the <code>bidirectional</code> check) have produced any DIFFERENT results for any possible input?',
  hint: 'For every input where <code>standardProxy</code> is true, what does the ORIGINAL (correct) branch already return — and does that ever disagree with what the <code>browserOnly</code> branch would return for the SAME input?',
  solution: `// No -- moving the browserOnly check before the standardProxy check
// would produce IDENTICAL results for every possible input, because
// the two rules never actually disagree when both conditions are true.

// Whenever standardProxy is true, the existing standardProxy branch
// already returns 'SSE' -- and whenever browserOnly is ALSO true in
// that same case, the browserOnly branch (per the Challenge's own
// stated rule) would ALSO return 'SSE'. The two branches only ever
// diverge in what they check, never in what they'd return for a case
// both apply to -- so swapping their order changes nothing observable.

// This is a genuinely different situation from the earlier GraphQL vs
// REST precedence bug on a sibling topic, where swapping branch order
// DID change results for a real input, because those two rules
// disagreed on outcome for the exact case where both could apply. Here,
// order is safe to swap specifically because the two rules happen to
// be CONSISTENT with each other wherever they overlap -- not something
// that's true in general, and worth checking explicitly rather than
// assuming, the same way this subtopic's own fix had to be verified.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A "Simplify" instruction in a Challenge’s own description is guaranteed to be logically equivalent to the full, detailed rule list it’s simplifying.',
    reality: 'This subtopic demonstrates exactly the opposite — the "Simplify" shortcut on the main page’s own original Challenge silently dropped a rule (<code>browserOnly</code>) that was NOT actually redundant, producing a genuinely different answer than the detailed rule list required for at least one real input. A stated simplification is a claim to verify, not something to trust by default.',
  },
  {
    thought: 'If a function accepts a parameter in its type signature, that parameter must be genuinely used somewhere in the function’s logic.',
    reality: 'The ORIGINAL, buggy <code>selectTransportBroken</code> accepted <code>browserOnly: boolean</code> as part of its <code>Requirements</code> parameter type, yet its body never referenced <code>req.browserOnly</code> at all — TypeScript’s structural typing has no way to flag "this parameter is accepted but never read" as an error; that kind of gap needs to be caught by comparing the implementation against the SPEC, not the type signature.',
  },
  {
    thought: 'Two rules that both name the same condition (<code>!bidirectional</code>) as part of their trigger must always be checked in a specific, fixed relative order to work correctly.',
    reality: 'The Try It above demonstrates the opposite for THIS specific pair of rules — swapping the order of the <code>standardProxy</code> and <code>browserOnly</code> checks produces identical results for every possible input, because the two rules never disagree wherever both could apply. Whether order matters is something to verify per pair of rules, not assume universally.',
  },
];

@Component({
  selector: 'app-api-realtime-browseronly-fix',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-silently-dropped-browseronly-rule.html',
  styleUrl: './the-silently-dropped-browseronly-rule.scss',
})
export class TheSilentlyDroppedBrowseronlyRuleSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
