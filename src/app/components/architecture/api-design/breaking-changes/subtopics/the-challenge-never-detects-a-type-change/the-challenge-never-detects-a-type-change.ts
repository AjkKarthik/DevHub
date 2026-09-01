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
    heading: 'A Correctly-Scoped Challenge That Misses What the Rest of the Page Warns About',
    points: [
      'The main page’s own Challenge is explicit about its own scope: <code>classifyChange(before, after)</code> is described as comparing "only top-level field names" — and its reference solution does exactly, correctly, what that scope promises: it checks which keys were added or removed, nothing more. This is not a bug in the Challenge; it does precisely what it says it does.',
      'But the SAME page’s own theory ("Field type changes are always breaking (string → number)") and its own "Safe vs Breaking Changes" codeTab (which explicitly labels a <code>price: 9.99</code> → <code>price: "999"</code> change "❌ BREAKING: changing a field type") both treat type changes as a core example of a breaking change — a case the Challenge, by its own stated scope, was never built to catch.',
      'Verified directly: running the Challenge’s OWN unmodified <code>classifyChange()</code> function against a before/after pair that only differs by a field’s type (<code>price: 9.99</code> becoming <code>price: "999"</code>, with every KEY unchanged) returns <code>\'safe\'</code> — the exact classification the page’s own codeTab elsewhere calls a false negative for a genuinely breaking change.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Extending classifyChange to Catch Type Changes',
    language: 'typescript',
    code: `function classifyChange(before: any, after: any): 'breaking' | 'non-breaking' | 'safe' {
  const beforeKeys = new Set(Object.keys(before));
  const afterKeys = new Set(Object.keys(after));

  const removed = [...beforeKeys].filter(k => !afterKeys.has(k));
  const added = [...afterKeys].filter(k => !beforeKeys.has(k));

  if (removed.length > 0) return 'breaking';
  if (added.length > 0) return 'non-breaking';
  return 'safe';
}

const v1 = { id: '1', name: 'John', price: 9.99 };
const v2TypeChange = { id: '1', name: 'John', price: '999' }; // number -> string

// Verified: the ORIGINAL, unmodified Challenge solution against this exact
// case -- every key is unchanged, only price's TYPE changed:
console.log(classifyChange(v1, v2TypeChange)); // 'safe' -- a false negative

// Extended version -- adds a third check: for every key present in BOTH
// objects, has its runtime type changed?
function classifyChangeV2(before: any, after: any): 'breaking' | 'non-breaking' | 'safe' {
  const beforeKeys = new Set(Object.keys(before));
  const afterKeys = new Set(Object.keys(after));

  const removed = [...beforeKeys].filter(k => !afterKeys.has(k));
  const added = [...afterKeys].filter(k => !beforeKeys.has(k));
  const typeChanged = [...beforeKeys].filter(k =>
    afterKeys.has(k) && typeof before[k] !== typeof after[k]
  );

  if (removed.length > 0 || typeChanged.length > 0) return 'breaking';
  if (added.length > 0) return 'non-breaking';
  return 'safe';
}

// Verified against all four cases (the original three from the Challenge's
// own starterCode, plus the new type-change case):
const v2add = { id: '1', name: 'John', price: 9.99, phone: '555' };
const v2remove = { id: '1', name: 'John' };

console.log(classifyChangeV2(v1, v2add));        // 'non-breaking' -- unchanged from V1
console.log(classifyChangeV2(v1, v2remove));     // 'breaking' -- unchanged from V1
console.log(classifyChangeV2(v1, v2TypeChange)); // 'breaking' -- FIXED, was 'safe'
console.log(classifyChangeV2(v1, v1));           // 'safe' -- unchanged from V1`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The page’s own "Adding new enum values" mistake block treats an enum value change (e.g. a <code>status</code> field going from <code>\'pending\'</code> to a new value like <code>\'shipped\'</code>) as only POTENTIALLY breaking, not automatically breaking. If <code>status</code> stays a <code>string</code> both before and after, does <code>classifyChangeV2()</code> flag this as breaking?',
  hint: '<code>typeof \'pending\'</code> and <code>typeof \'shipped\'</code> — are these the same, or different?',
  solution: `// typeof 'pending' === 'string'
// typeof 'shipped' === 'string'
//
// classifyChangeV2({ status: 'pending' }, { status: 'shipped' })
//   -> 'safe' -- typeChanged stays empty, since typeof didn't change,
//      only the VALUE did.
//
// This is actually the CORRECT outcome for this specific check, and
// matches the main page's own nuanced framing exactly: a changed enum
// VALUE (same underlying type) is only "potentially breaking" -- it
// depends entirely on whether the CONSUMER's own code does exhaustive
// pattern matching that throws on an unrecognized value, something no
// structural type-comparison function like this one can ever detect by
// inspecting the API's before/after shape alone. classifyChangeV2()
// catches STRUCTURAL type changes (string became number); it was never
// designed to, and correctly does not claim to, catch every category of
// breaking change the main page discusses -- semantic/behavioral changes
// (documented separately in the page's own "breaking change vs. behavior
// change" QnA) are a different category entirely, undetectable by ANY
// schema-comparison tool, automated or hand-written.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Challenge’s <code>classifyChange()</code> function is simply buggy, since it fails to catch a genuinely breaking type change.',
    reality: 'The Challenge is explicit about its own scope ("Compare only top-level field names") and its reference solution does exactly that, correctly. It’s not a bug in the function — it’s a real, documented GAP between what the Challenge was built to teach (presence/absence of fields) and the fuller set of breaking-change categories the rest of the page discusses.',
  },
  {
    thought: 'Once <code>classifyChangeV2()</code> checks field types in addition to field presence, it now catches every kind of breaking change the main page describes.',
    reality: 'The Try It above demonstrates a real remaining gap: an enum VALUE change (<code>\'pending\'</code> → <code>\'shipped\'</code>) keeps the same <code>typeof</code> result and is correctly reported as <code>\'safe\'</code> by the structural check — even though the page’s own mistake block explains this can still break a consumer with an exhaustive switch statement. No purely structural (before/after shape) comparison can detect that kind of consumer-code-dependent breakage.',
  },
  {
    thought: 'A field whose type changes from <code>number</code> to <code>string</code> is inherently more dangerous than one whose ENUM VALUE changes while staying the same type.',
    reality: 'Both are real risks with different failure signatures: a type change (number → string) breaks any consumer code doing arithmetic on the field immediately and unconditionally. An enum value change only breaks consumers with exhaustive, no-default pattern matching — a narrower, code-shape-dependent risk the page’s own "tolerant reader" QnA explains how to avoid entirely on the CONSUMER side.',
  },
];

@Component({
  selector: 'app-api-breaking-changes-type-change',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-challenge-never-detects-a-type-change.html',
  styleUrl: './the-challenge-never-detects-a-type-change.scss',
})
export class TheChallengeNeverDetectsATypeChangeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
