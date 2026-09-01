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
    heading: 'A Different Fix for the Same Problem This Hub Already Solved With Spread',
    points: [
      'The main page’s QnA on well-known types names <code>google.protobuf.FieldMask</code> in one sentence: "specifies which fields to update in a partial update operation." No codeTab on the page shows what applying a FieldMask actually looks like.',
      'This hub’s API Design Principles topic already solved a version of this exact problem for JSON PATCH requests — a plain object spread (<code>{ ...existing, ...patch }</code>) correctly distinguishes "field absent" from "field explicitly null," using JavaScript’s own object semantics. Protobuf’s proto3 message types don’t have that luxury: EVERY field always has a value (its zero value if never explicitly set), so a partial-update request genuinely cannot tell "the client wants this field cleared to zero" apart from "the client didn’t mention this field at all" just by looking at the message’s own field values.',
      'FieldMask solves this differently: instead of relying on the shape of the data itself, the CLIENT sends an explicit, separate list of field PATHS it intends to update — <code>paths: ["name", "address.city"]</code> — and the server copies ONLY those specific paths from the incoming message onto the stored one, leaving every other field completely untouched, however it happens to be set on the incoming message.',
      'Paths can reach into nested messages using dots — <code>address.city</code> updates just the nested <code>city</code> field of an <code>address</code> sub-message, without touching <code>address.zip</code> or anything else on the record.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Applying a FieldMask',
    language: 'typescript',
    code: `// Deep-clones the target and copies ONLY the fields named in "paths"
// from source onto the clone -- everything else on target is left
// completely untouched, regardless of what source contains for it.
function applyFieldMask<T extends Record<string, any>>(
  target: T,
  source: Record<string, any>,
  paths: string[]
): T {
  const result: any = structuredClone(target);

  for (const path of paths) {
    const segments = path.split('.');

    // Walk source to find the value this path actually points at.
    let src: any = source;
    let found = true;
    for (const seg of segments) {
      if (src === undefined) { found = false; break; }
      src = src[seg];
    }
    if (!found) continue;

    // Walk (and create, if needed) the same path on result, then set
    // the final segment.
    let dest = result;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (typeof dest[seg] !== 'object' || dest[seg] === null) dest[seg] = {};
      dest = dest[seg];
    }
    dest[segments[segments.length - 1]] = src;
  }

  return result;
}

const target = { id: '42', name: 'Jane', address: { city: 'NYC', zip: '10001' } };
const source = { id: 'ignored', name: 'Janet', address: { city: 'LA', zip: '90001' } };

console.log(applyFieldMask(target, source, ['name']));
// { id: '42', name: 'Janet', address: { city: 'NYC', zip: '10001' } }
// -- only name changed; id and the whole address object untouched,
// even though source's id and address are completely different.

console.log(applyFieldMask(target, source, ['address.city']));
// { id: '42', name: 'Jane', address: { city: 'LA', zip: '10001' } }
// -- only the nested city field changed; zip on the SAME sub-message
// stayed at target's own value.

console.log(target);
// { id: '42', name: 'Jane', address: { city: 'NYC', zip: '10001' } }
// -- target itself was never mutated; applyFieldMask returns a new object.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>applyFieldMask</code> function above completely ignores any field on <code>source</code> that ISN’T named in <code>paths</code> — even fields with an obviously different, clearly-intentional-looking value like <code>id: \'ignored\'</code> in the codeTab. Why is this the CORRECT behavior for a FieldMask-based update, rather than a limitation to work around?',
  hint: 'If a partial-update endpoint updated every field the client happened to send, regardless of what the paths list said, what would the paths list actually be FOR?',
  solution: `// Ignoring every field not named in paths is the entire POINT of
// FieldMask-based updates, not a limitation -- it's what makes "partial
// update" mean something precise and predictable.

// If applyFieldMask instead copied every field present on source
// (falling back to paths only as a hint), the paths list would be
// purely decorative -- a client could send a full record with an
// accidental or stale id/address, and it would silently overwrite the
// stored id/address regardless of what paths claimed to be updating.
// This defeats the safety guarantee a partial update is supposed to
// provide: "only the fields I explicitly listed will change, nothing
// else, even if my request body happens to carry other stale data."

// This is exactly analogous to why the earlier PATCH-merge subtopic on
// this hub's API Design Principles topic mattered: a caller needs a
// reliable way to say "update ONLY this," and either mechanism --
// FieldMask's explicit paths list, or JSON's own missing-vs-present
// distinction via spread -- exists specifically to make that
// guarantee real rather than accidental.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'FieldMask solves the same "missing vs. explicit value" problem this hub’s API Design Principles topic already solved with a plain object spread — it’s just protobuf’s name for the identical mechanism.',
    reality: 'The two mechanisms solve the same PROBLEM (update only what the client actually intended to change) via genuinely DIFFERENT means. JSON’s spread-based fix works because a JS object can distinguish "key absent" from "key present with value null." A proto3 message CANNOT make that same distinction — every field always holds a real value (its zero value if unset) — so FieldMask solves it a different way entirely: a separate, explicit list of field paths sent alongside the message, rather than relying on anything about the message’s own shape.',
  },
  {
    thought: 'A FieldMask path like <code>address.city</code> replaces the ENTIRE <code>address</code> sub-message with whatever <code>address</code> looks like on the incoming request.',
    reality: 'The codeTab’s own second example proves the opposite: applying the mask <code>[\'address.city\']</code> updates ONLY the nested <code>city</code> field, leaving <code>address.zip</code> exactly as it was on <code>target</code> — even though <code>source.address</code> has a completely different <code>zip</code> value that never gets copied. A dotted path reaches precisely into the nested structure; it does not swap out the whole parent object.',
  },
  {
    thought: 'Since <code>applyFieldMask</code> uses <code>structuredClone</code>, calling it on a target repeatedly with different masks would eventually merge in every field from source.',
    reality: 'Each call to <code>applyFieldMask</code> is independent and only reads whatever <code>paths</code> is passed on THAT call — nothing persists or accumulates across separate calls. The codeTab’s own three separate <code>console.log</code> calls each start fresh from the same original <code>target</code>, confirmed by the final log showing <code>target</code> itself was never mutated by any of the earlier calls.',
  },
];

@Component({
  selector: 'app-api-protobuf-fieldmask',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fieldmask-partial-updates-by-explicit-field-path.html',
  styleUrl: './fieldmask-partial-updates-by-explicit-field-path.scss',
})
export class FieldmaskPartialUpdatesByExplicitFieldPathSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
