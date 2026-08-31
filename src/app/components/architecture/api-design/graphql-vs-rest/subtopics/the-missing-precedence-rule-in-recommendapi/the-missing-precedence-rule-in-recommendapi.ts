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
    heading: 'A Stated Rule the Original Solution Never Actually Implemented',
    points: [
      'The main page’s own Challenge listed five rules for <code>recommendApi()</code>, including "If caching is true AND multipleDataSources is false: REST." The original <code>solution</code> code, though, had no branch checking exactly that condition — it only handled <code>caching && multipleDataSources</code> (returning <code>\'Both\'</code>), then fell through directly to the client-count checks.',
      'For most inputs this went unnoticed, since falling through to the final <code>return \'REST\'</code> default happened to produce the same answer the stated rule required. But for <code>{ clients: 5, caching: true, multipleDataSources: false }</code>, the fallthrough hit the <code>clients > 3</code> check FIRST and returned <code>\'GraphQL\'</code> — directly contradicting the Challenge’s own stated rule that caching-without-aggregation should always mean REST.',
      'This has now been fixed on the main page: an explicit <code>if (s.caching && !s.multipleDataSources) return \'REST\';</code> branch was added, positioned BEFORE the client-count checks — restoring the caching-based rule’s stated precedence over the client-diversity rule.',
      'The Challenge’s own <code>hints</code> array also named a <code>\'Both\'</code> outcome the original <code>description</code> text never actually stated as a rule — a second, smaller inconsistency fixed alongside the precedence bug by adding the missing rule to the description itself.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing and Fixing the Precedence Bug',
    language: 'typescript',
    code: `interface Scenario {
  clients: number;
  caching: boolean;
  fileUploads: boolean;
  multipleDataSources: boolean;
}

// ── BROKEN: no explicit branch for "caching, not aggregating" ───────────────
function recommendApiBroken(s: Scenario): 'GraphQL' | 'REST' | 'Both' {
  if (s.fileUploads) return 'REST';
  if (s.caching && s.multipleDataSources) return 'Both';
  if (s.multipleDataSources && s.clients > 2) return 'GraphQL';
  if (s.clients > 3) return 'GraphQL'; // <-- fires BEFORE the caching-only case is ever checked
  return 'REST';
}

// The Challenge's own stated rule: "caching true AND multipleDataSources
// false" should ALWAYS mean REST -- but this input has 5 clients too.
console.log(recommendApiBroken({ clients: 5, caching: true, fileUploads: false, multipleDataSources: false }));
// 'GraphQL' -- WRONG. The caching rule was silently overridden.

// ── FIXED: explicit branch restores the stated precedence ───────────────────
function recommendApiFixed(s: Scenario): 'GraphQL' | 'REST' | 'Both' {
  if (s.fileUploads) return 'REST';
  if (s.caching && s.multipleDataSources) return 'Both';
  if (s.caching && !s.multipleDataSources) return 'REST'; // the missing rule
  if (s.multipleDataSources && s.clients > 2) return 'GraphQL';
  if (s.clients > 3) return 'GraphQL';
  return 'REST';
}

console.log(recommendApiFixed({ clients: 5, caching: true, fileUploads: false, multipleDataSources: false }));
// 'REST' -- correct, matches the Challenge's own stated rule.

// Confirms the fix doesn't change any of the Challenge's own original examples:
console.log(recommendApiFixed({ clients: 1, caching: true, fileUploads: false, multipleDataSources: false })); // REST
console.log(recommendApiFixed({ clients: 4, caching: false, fileUploads: false, multipleDataSources: true })); // GraphQL
console.log(recommendApiFixed({ clients: 2, caching: false, fileUploads: true, multipleDataSources: false })); // REST`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The fix adds ONE new branch (<code>caching && !multipleDataSources → REST</code>) positioned between the existing <code>\'Both\'</code> branch and the <code>multipleDataSources && clients > 2</code> branch. Would placing the new branch AFTER the <code>clients > 3</code> check instead (at the very end, just before the final <code>return \'REST\'</code>) have fixed the bug just as correctly?',
  hint: 'For the exact counter-example (<code>clients: 5, caching: true, multipleDataSources: false</code>), which branch would the code reach FIRST if the new caching branch were moved to the very end, after <code>clients > 3</code>?',
  solution: `// No -- moving the new branch to the very end would NOT fix the bug,
// because JavaScript's if/else-if chain always takes the FIRST matching
// branch, regardless of what other branches exist further down.

// For { clients: 5, caching: true, multipleDataSources: false }, if the
// caching-only branch were placed AFTER "if (s.clients > 3) return
// 'GraphQL';", the clients > 3 check would still fire FIRST (5 > 3 is
// true) and return 'GraphQL' immediately -- the caching branch below it
// would never even be reached, since a return statement exits the
// function immediately.

// This is exactly why the REAL fix had to insert the new branch BEFORE
// the clients > 3 check, not just anywhere in the function -- the
// Challenge's own stated rule ordering ("checked IN ORDER, the first
// matching rule wins") is not just documentation, it's a hard
// requirement on where in the if-chain each rule's branch has to sit.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'If a Challenge’s worked examples in <code>console.log</code> calls all produce the expected output, the underlying function must be fully correct for every possible input.',
    reality: 'This is exactly the situation this subtopic demonstrates: all three of the original Challenge’s own worked examples produced correct output, yet the function still had a real bug for a DIFFERENT input the examples never happened to cover. A function passing its own stated test cases says nothing about inputs those test cases don’t exercise.',
  },
  {
    thought: 'A rule listed in a Challenge’s prose description is automatically reflected in the actual code, as long as the code’s FINAL output happens to match for commonly-tested inputs.',
    reality: 'The original broken code’s fallthrough behavior happened to coincidentally match the caching rule for LOW client counts (where the <code>clients > 3</code> check also correctly returned REST) — but coincidental agreement on some inputs is not the same as the rule actually being implemented. The bug was only exposed by an input where the two rules’ implied answers diverge.',
  },
  {
    thought: 'The order branches appear in an if/else-if chain is a stylistic choice that doesn’t affect correctness, as long as all the right conditions are checked somewhere.',
    reality: 'The Try It above demonstrates the opposite directly — the SAME new branch, with the SAME condition, fixes the bug in one position and does NOT fix it in another, purely because of ordering. Whenever a Challenge states rules should be "checked in order," branch placement in the actual code is not cosmetic — it is part of the correctness requirement.',
  },
];

@Component({
  selector: 'app-api-graphql-vs-rest-precedence',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-missing-precedence-rule-in-recommendapi.html',
  styleUrl: './the-missing-precedence-rule-in-recommendapi.scss',
})
export class TheMissingPrecedenceRuleInRecommendapiSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
