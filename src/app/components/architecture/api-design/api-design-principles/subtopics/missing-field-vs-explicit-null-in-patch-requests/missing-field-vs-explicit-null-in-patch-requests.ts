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
    heading: 'The Main Page Names the Distinction — Here It Is, Verified in Code',
    points: [
      'The main page’s QnA states the distinction precisely: "Missing: the client did not provide it (use default). Null: the client explicitly set it to null (clear the value). JSON does not distinguish the two natively." No codeTab anywhere on the page actually implements a PATCH handler that gets this right.',
      'A very common, plausible-looking PATCH implementation merges the incoming patch onto the existing record using a falsy fallback: <code>result[key] = patch[key] || result[key]</code>. This looks reasonable — "use the new value if one was given, otherwise keep the old one" — but <code>||</code> treats EVERY falsy value (<code>null</code>, <code>0</code>, <code>\'\'</code>, <code>false</code>) as "not given," silently discarding a client’s explicit attempt to clear a field or set it to a legitimate falsy value.',
      'A plain object spread — <code>{ ...existing, ...patch }</code> — gets the distinction right for free: a key absent from <code>patch</code> is simply never assigned, leaving the existing value untouched; a key present in <code>patch</code> with value <code>null</code> DOES get assigned, correctly clearing the field. The correctness comes from JavaScript’s own spread semantics (only own, present keys are copied), not from any special-case logic.',
      'When a handler needs to REJECT an explicit <code>null</code> for a specific field (say, a required field that can never be cleared), spread alone isn’t enough — that needs an explicit <code>\'field\' in patch</code> check, since spread can’t distinguish "reject this" from "silently apply it."',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Falsy-Fallback Bug vs. the Spread Fix',
    language: 'typescript',
    code: `interface UserRecord {
  name: string;
  email: string | null;
  discountPercent: number;
}

const existing: UserRecord = { name: 'Jane', email: 'jane@old.com', discountPercent: 10 };

// ── BROKEN: falsy fallback silently ignores explicit null/0/'' ──────────────
function badMerge(existing: UserRecord, patch: Partial<UserRecord>): UserRecord {
  const result = { ...existing };
  for (const key of Object.keys(patch) as (keyof UserRecord)[]) {
    (result[key] as any) = patch[key] || result[key]; // WRONG
  }
  return result;
}

console.log(badMerge(existing, { email: null }));
// { name: 'Jane', email: 'jane@old.com', discountPercent: 10 }
// -- client asked to CLEAR email; the old value survived instead.

console.log(badMerge(existing, { discountPercent: 0 }));
// { name: 'Jane', email: 'jane@old.com', discountPercent: 10 }
// -- client asked to zero out the discount; 0 is falsy, so it was
// silently ignored and the old 10% discount stayed active.

// ── CORRECT: plain spread respects "key absent" vs "key present, null" ──────
function goodMerge(existing: UserRecord, patch: Partial<UserRecord>): UserRecord {
  return { ...existing, ...patch };
}

console.log(goodMerge(existing, { email: null }));
// { name: 'Jane', email: null, discountPercent: 10 } -- correctly cleared

console.log(goodMerge(existing, { discountPercent: 0 }));
// { name: 'Jane', email: 'jane@old.com', discountPercent: 0 } -- correctly zeroed

console.log(goodMerge(existing, { name: 'Janet' }));
// { name: 'Janet', email: 'jane@old.com', discountPercent: 10 }
// -- fields the client never mentioned are left completely untouched.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A <code>name</code> field is required and can never legally be <code>null</code>. A client sends <code>PATCH /users/1</code> with body <code>{ "name": null }</code>. The <code>goodMerge()</code> spread-based function above would happily set <code>name</code> to <code>null</code> with no error. What check does the handler need ADD, beyond the spread, to correctly reject this request with a <code>400</code>?',
  hint: 'Spread alone can’t distinguish "reject this value" from "apply it" — what does the handler need to check about the incoming <code>patch</code> object BEFORE merging, specifically for fields that must never be null?',
  solution: `function handlePatchUser(existing: UserRecord, patch: Partial<UserRecord>) {
  // Explicitly reject a null on a required field BEFORE merging --
  // 'name' in patch is true whether patch.name is a string OR null,
  // so this check catches exactly the case that needs rejecting.
  if ('name' in patch && patch.name === null) {
    return { status: 400, error: 'name cannot be cleared -- it is required' };
  }

  const merged = { ...existing, ...patch };
  return { status: 200, body: merged };
}

console.log(handlePatchUser(existing, { name: null as any }));
// { status: 400, error: 'name cannot be cleared -- it is required' }

console.log(handlePatchUser(existing, { name: 'Janet' }));
// { status: 200, body: { name: 'Janet', email: 'jane@old.com', discountPercent: 10 } }

// The key insight: spread alone answers "how do I merge correctly by
// default" -- it does NOT answer "which fields are allowed to be
// cleared at all." That second question needs its own explicit check,
// run before the merge, for every field where null is not a legal value.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'JSON.stringify/JSON.parse round-trips preserve the missing-vs-null distinction automatically, so no special handling is needed on either end.',
    reality: '<code>JSON.stringify</code> DOES correctly distinguish the two on the way out — an object key with value <code>undefined</code> is DROPPED entirely, while a key with value <code>null</code> is kept as literal <code>null</code>. The distinction survives the wire format correctly. The bug this subtopic demonstrates is not about JSON serialization at all — it’s about how the SERVER’s own merge logic reads the already-correctly-parsed patch object afterward.',
  },
  {
    thought: 'A falsy-fallback merge (<code>patch[key] || existing[key]</code>) is a rare, contrived mistake — real code wouldn’t write it this way.',
    reality: 'This exact pattern is extremely common precisely because it reads naturally as "use the new value if provided" — it looks correct at a glance and passes any test that never happens to PATCH a field to <code>null</code>, <code>0</code>, <code>\'\'</code>, or <code>false</code>. It is one of the most reproduced real-world PATCH bugs, not a contrived edge case.',
  },
  {
    thought: 'Using <code>{ ...existing, ...patch }</code> is enough to correctly implement PATCH semantics for any record shape.',
    reality: 'Plain spread correctly handles the missing-vs-null MERGE distinction, but says nothing about VALIDATION — as the Try It above shows, spread alone will happily let a client null out a field that should never be nullable. Getting PATCH semantics right needs both: spread for correct default merging, and explicit per-field checks for any field with additional constraints beyond "can be updated."',
  },
];

@Component({
  selector: 'app-api-principles-patch-null-vs-missing',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './missing-field-vs-explicit-null-in-patch-requests.html',
  styleUrl: './missing-field-vs-explicit-null-in-patch-requests.scss',
})
export class MissingFieldVsExplicitNullInPatchRequestsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
