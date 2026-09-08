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
    heading: 'Two QnAs on the Same Page, Two Different Upper Bounds — Only One Works',
    points: [
      'The main page has TWO separate QnAs describing the exact same zone-sharding upper-bound technique. One correctly writes <code>{ region: "EU~" }</code> as the upper bound of an EU zone range. The other wrote <code>{ region: "EU" + "" }</code> — string concatenation with an empty string, which produces the exact same value as the lower bound, <code>"EU"</code>, not a real upper bound at all.',
      'The two QnAs also used different command names for the identical operation: <code>sh.addShardToZone()</code>/<code>sh.updateZoneKeyRange()</code> (the modern commands) versus <code>sh.addShardTag()</code>/<code>sh.addTagRange()</code> — verified via MongoDB\'s own documentation that the latter pair are legacy aliases for the former, not a genuinely different mechanism.',
      'The <code>"~"</code> (tilde) character works as an upper bound because MongoDB compares BSON strings by their raw byte/code-point ordering — tilde (ASCII 126) sorts after every uppercase letter, lowercase letter, and digit, so <code>"EU~"</code> is guaranteed to sort after any string that merely starts with <code>"EU"</code>.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Broken Range vs. the Working One',
    language: 'typescript',
    code: `// BROKEN -- this main-page QnA's own code concatenated an empty
// string onto the lower bound, producing an IDENTICAL upper bound.
const lower = 'EU';
const brokenUpper = 'EU' + ''; // -- just 'EU' again, no-op concatenation
console.log('lower === brokenUpper:', lower === brokenUpper);
// -> true. A zone key range where the lower and upper bound are
// identical is zero-width -- sh.updateZoneKeyRange() would define a
// range that matches nothing at all.

// WORKING -- append a tilde, matching this page's OWN other,
// already-correct QnA.
const fixedUpper = 'EU~';
console.log('lower < fixedUpper:', lower < fixedUpper);
console.log('"EUxyz" < fixedUpper:', 'EUxyz' < fixedUpper);   // any EU-prefixed string
console.log('"EUzzz" < fixedUpper:', 'EUzzz' < fixedUpper);
console.log('"EV" < fixedUpper:', 'EV' < fixedUpper);          // correctly excludes the NEXT prefix

// The real, modern commands (per MongoDB's own docs, addShardTag/
// addTagRange are legacy aliases for these):
sh.addShardToZone('shard0001', 'EU');
sh.updateZoneKeyRange('db.users', { region: 'EU' }, { region: 'EU~' }, 'EU');`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team wants a zone covering every region code starting with "US" (e.g. "US-East", "US-West"), using the same tilde technique. What upper bound should they pass to <code>sh.updateZoneKeyRange()</code>, and would <code>{ region: "US" }</code> as the upper bound (i.e., forgetting the tilde entirely) work correctly instead?',
  hint: 'Apply the exact same reasoning demonstrated above to a different prefix — and check whether the lower and upper bound would be equal without the tilde.',
  solution: `// Upper bound: { region: 'US~' } -- exactly the same technique,
// just with the "US" prefix instead of "EU".
//
// Using { region: 'US' } as the upper bound WITHOUT the tilde would
// NOT work -- it would make the lower and upper bound identical again
// (the same bug as the original main-page QnA), producing a zero-width
// range that matches nothing. The tilde is not a cosmetic detail --
// it is what actually creates a non-empty range covering every
// "US"-prefixed string.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Concatenating an empty string onto a value, like \'EU\' + \'\', is a common (if slightly unusual) way some codebases create a copy of a string to be safe against mutation — it should be harmless here even if it looks odd.',
    reality: 'It is not harmless here specifically because the surrounding code depends on the RESULT being a genuinely different, LARGER value than the lower bound — string concatenation with an empty string always returns a value equal to the original, never a different one. There is no operation that could make \'EU\' + \'\' produce anything other than \'EU\'.',
  },
  {
    thought: 'sh.addShardTag()/sh.addTagRange() and sh.addShardToZone()/sh.updateZoneKeyRange() are two independent, competing sharding mechanisms — a codebase should pick one family and never mix them.',
    reality: 'Verified against MongoDB\'s own documentation: they are the SAME mechanism under two names — addShardTag/addTagRange are legacy aliases for addShardToZone/updateZoneKeyRange. Mixing them in different QnAs on the same page (as the main page originally did) is a documentation-consistency issue, not evidence of two different features.',
  },
];

@Component({
  selector: 'app-mongo-rs-eu-tilde-upper-bound',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './eu-tilde-upper-bound-fixes-the-broken-zone-range.html',
  styleUrl: './eu-tilde-upper-bound-fixes-the-broken-zone-range.scss',
})
export class EuTildeUpperBoundFixesTheBrokenZoneRangeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
