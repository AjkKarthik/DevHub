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
    heading: 'The Verb Check Never Actually Fired on a Realistic Verb-Prefixed Path',
    points: [
      'The main page’s own Challenge solution checked <code>VERBS.includes(lower)</code> — an EXACT match of the whole path segment against a 6-word list (get, create, delete, update, fetch, list). A realistic verb-in-URL violation like <code>getUserById</code> or <code>createOrder</code> never equals any single verb word exactly, so this check never caught the anti-pattern it existed to catch.',
      'Confirmed by direct execution: <code>/getUserById</code> WAS still flagged invalid by the original code — but only by the SEPARATE camelCase check, not the verb check, since the segment happens to contain uppercase letters too. An all-lowercase verb-prefixed path like <code>/getusers</code> or <code>/deleteuser/42</code> — exactly the anti-pattern the main page’s own mistakes block warns against — passed as fully VALID, with zero issues raised.',
      'This has been fixed on the main page to a prefix-based check (<code>VERBS.some(v => lower.startsWith(v))</code>) — this subtopic traces exactly why the exact-match version failed silently, and the real tradeoff the prefix-based fix introduces.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before: An Exact-Match Check That Almost Never Fires',
    language: 'typescript',
    code: `const VERBS = ['get', 'create', 'delete', 'update', 'fetch', 'list'];

function hasVerbSegmentBROKEN(segments: string[]): boolean {
  return segments.some(seg => VERBS.includes(seg.toLowerCase()));
}

// The exact real-world anti-pattern the mistakes block above this
// Challenge warns against -- all lowercase, no camelCase to fall
// back on -- sails through completely undetected:
console.log(hasVerbSegmentBROKEN(['getusers']));         // false
console.log(hasVerbSegmentBROKEN(['createorder']));      // false
console.log(hasVerbSegmentBROKEN(['deleteuser', '42'])); // false

// The ONLY input that would ever return true is a segment that IS,
// in its entirety, one of the six exact words -- e.g. a bare "/get"
// or "/list" segment on its own, which is rare in practice; real
// verb violations are almost always a COMPOUND word (verb + noun).
console.log(hasVerbSegmentBROKEN(['get']));  // true -- but this
// specific shape barely ever occurs in a real API's own URLs.`,
  },
  {
    label: 'After: Prefix Matching Catches the Real Anti-Pattern',
    language: 'typescript',
    code: `function hasVerbSegment(segments: string[]): boolean {
  return segments.some(seg => VERBS.some(v => seg.toLowerCase().startsWith(v)));
}

console.log(hasVerbSegment(['getusers']));         // true -- now caught
console.log(hasVerbSegment(['createorder']));      // true
console.log(hasVerbSegment(['deleteuser', '42'])); // true

// The tradeoff: a genuine NOUN that happens to start with one of the
// same six letters-sequences also gets flagged -- a real,
// documented false positive, not a hypothetical one:
console.log(hasVerbSegment(['listings']));  // true -- "listings" is
// a perfectly legitimate resource name (e.g. real-estate/marketplace
// listings), but it starts with the letters "list".`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes a THIRD approach: instead of prefix matching, split each segment into words at camelCase boundaries (<code>getUserById</code> → <code>[\'get\', \'User\', \'By\', \'Id\']</code>) and check whether any WORD exactly equals a verb. Would this correctly flag <code>getusers</code> (all lowercase, no camelCase boundaries at all) the same way the prefix-based fix does?',
  hint: 'A camelCase-word-splitter finds boundaries by looking for a lowercase letter followed by an uppercase letter. Does <code>getusers</code> have any such boundary anywhere in it?',
  solution: `// No -- a camelCase-word-splitting approach would MISS "getusers"
// entirely. There is no lowercase-to-uppercase transition anywhere
// in that string at all -- it's uniformly lowercase from end to end
// -- so a splitter that only looks for camelCase boundaries would
// treat the whole thing as ONE word, "getusers", which does not
// exactly equal "get" any more than the ORIGINAL exact-match check
// did.

// This reveals something the prefix-based fix gets right that a
// camelCase-splitting approach would NOT: the original bug wasn't
// really about camelCase detection at all -- it was about the verb
// check requiring an EXACT whole-segment match. Any fix that still
// requires some kind of exact match on a DERIVED unit (a whole
// segment, or a whole camelCase-split word) inherits the same root
// problem for an all-lowercase compound word, since there's no
// boundary signal to split on in the first place.

// The prefix-based fix works specifically because it doesn't rely on
// finding a BOUNDARY at all -- it only asks "does this string START
// WITH these particular characters," which is true regardless of
// case or of whether a camelCase transition exists anywhere in the
// rest of the string.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A code sample that produces the CORRECT overall valid/invalid verdict for every test case shown must have correct logic for the reason it claims.',
    reality: 'The original <code>/getUserById</code> test case DID correctly return <code>invalid</code> — but for the wrong reason (camelCase, not the verb check the comment claimed). Checking that a function’s OVERALL output matches an expected result is not the same as checking that EACH INDIVIDUAL check inside it is actually doing what its own comment says — the camelCase check was silently doing double duty, masking the verb check’s real failure.',
  },
  {
    thought: 'The fixed prefix-based verb check is strictly better than the original — it has no downsides.',
    reality: 'It trades one class of false negative (missing real verb-prefixed URLs entirely) for a real, demonstrated class of false positive (flagging a legitimate noun like <code>listings</code> that happens to start with a verb word). Neither version is perfect — the fix is a genuine improvement for THIS Challenge’s purpose (catching the common case), but it is a tradeoff, not a strictly dominant fix.',
  },
  {
    thought: 'Testing a function against the exact example inputs shown in its own comments is sufficient to confirm the function is correct.',
    reality: 'The original code’s own <code>console.log</code> examples never included an all-lowercase verb-prefixed test case (<code>/getusers</code>) — exactly the input shape that exposes the bug. A test suite (or a set of illustrative examples) is only as good as the INPUTS it happens to cover; passing every example shown says nothing about inputs that were never tried.',
  },
];

@Component({
  selector: 'app-api-resource-url-verbs',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './verbs-as-prefixes-not-exact-matches-the-real-fix.html',
  styleUrl: './verbs-as-prefixes-not-exact-matches-the-real-fix.scss',
})
export class VerbsAsPrefixesNotExactMatchesTheRealFixSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
