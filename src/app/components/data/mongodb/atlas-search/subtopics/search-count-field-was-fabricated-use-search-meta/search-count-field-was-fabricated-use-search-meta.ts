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
    heading: 'A Field Name That Was Never Real',
    points: [
      'The main page\'s own "E-commerce Search with Facets" Challenge requested <code>count: { type: \'total\' }</code> in its <code>$search</code> stage, then read the result back as <code>products[0]?.[\'$$searchCount\']</code> — a field that has never existed on any Atlas Search result document. Verified against MongoDB\'s own Counting Search Results documentation: the count metadata is exposed through the <code>$$SEARCH_META</code> SYSTEM VARIABLE, not a plain field name.',
      'To actually read it, a <code>$project</code> stage must explicitly capture <code>$$SEARCH_META</code> into a field of your own choosing (e.g., <code>meta: \'$$SEARCH_META\'</code>) — MongoDB\'s own documented example shows every returned document carrying an IDENTICAL <code>meta.count.total</code> snapshot, since the count describes the whole query\'s result set, not any individual document.',
      'The original Challenge solution\'s <code>$project</code> stage never captured <code>$$SEARCH_META</code> at all — even fixing the ACCESS expression alone would still return nothing, since the value it was trying to read was never projected onto the documents in the first place.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Fabricated Field vs. the Real $$SEARCH_META',
    language: 'typescript',
    code: `// Pure-JS model of MongoDB's own documented $$SEARCH_META behavior:
// every returned document in the SAME query carries an IDENTICAL
// snapshot of the search metadata -- it describes the whole query's
// result set, not any individual document.
function simulateSearchWithCount(matchingDocs: { name: string }[], totalCount: number) {
  return matchingDocs.map(doc => ({
    ...doc,
    meta: { count: { total: totalCount } }, // identical on every returned doc
  }));
}

const docs = [{ name: 'Widget A' }, { name: 'Widget B' }, { name: 'Widget C' }];
const results = simulateSearchWithCount(docs, 847); // 847 total matches, only 3 returned (paginated)

console.log('Every doc carries the SAME meta.count.total:',
  results.every(d => d.meta.count.total === 847));
// -> true

// BROKEN -- the original Challenge solution's access expression:
function brokenAccess(products: any[]) {
  return products[0]?.['$$searchCount'] ?? 0;
}
console.log('Broken access result:', brokenAccess(results));
// -> 0, always -- this field literally does not exist on any document.

// FIXED -- both halves of the real mechanism, per MongoDB's own docs:
const searchStage = {
  index: 'products_search',
  compound: { must: [{ text: { query: 'laptop', path: 'name' } }] },
  count: { type: 'total' },
};

const pipeline = [
  { \$search: searchStage },
  { \$project: { name: 1, price: 1, meta: '\$\$SEARCH_META' } }, // capture it explicitly
];

function fixedAccess(products: any[]) {
  return products[0]?.meta?.count?.total ?? 0; // read the captured field
}
console.log('Fixed access result:', fixedAccess(results));
// -> 847, the real total.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate "fixes" the bug by changing only the access expression to <code>products[0]?.meta?.count?.total ?? 0</code>, but leaves the <code>$project</code> stage exactly as it was in the original Challenge solution (no <code>meta: \'$$SEARCH_META\'</code> field). Does the total now report correctly?',
  hint: 'Think about whether an access expression can read a field that a projection stage never actually captured in the first place.',
  solution: `// No -- the total would still be 0 (or undefined, depending on
// optional-chaining behavior), just for a DIFFERENT reason than before.
//
// The original bug had TWO independent parts: an access expression
// reading a field name ($$searchCount) that never existed, AND a
// $project stage that never captured $$SEARCH_META onto the documents
// in the first place. Fixing only the access expression means
// products[0].meta is now undefined (since no $project stage ever set
// it) -- the optional chaining (?.) just silently returns undefined
// instead of throwing, masking that the projection half of the fix
// was skipped. Both halves are required together.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since count: { type: \'total\' } is passed directly inside the $search stage\'s own options, MongoDB must attach the resulting count directly onto each returned document automatically, without any extra projection step.',
    reality: 'Verified against MongoDB\'s own documentation: requesting count only makes the value AVAILABLE via the $$SEARCH_META system variable — it does not automatically appear as a field on any document. An explicit $project (or $searchMeta, for a metadata-only query) is always required to actually read it.',
  },
  {
    thought: 'A field access like products[0]?.[\'$$searchCount\'] failing silently (returning undefined, then defaulting to 0 via ??) is a minor cosmetic issue, since the rest of the search results are still returned correctly.',
    reality: 'The Challenge specifically requires returning "(3) Total result count" as one of its three deliverables — a total that is ALWAYS 0 regardless of how many products actually matched is a complete, silent failure of one of the function\'s three stated requirements, not a cosmetic detail.',
  },
];

@Component({
  selector: 'app-mongo-as-search-meta-count',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './search-count-field-was-fabricated-use-search-meta.html',
  styleUrl: './search-count-field-was-fabricated-use-search-meta.scss',
})
export class SearchCountFieldWasFabricatedUseSearchMetaSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
