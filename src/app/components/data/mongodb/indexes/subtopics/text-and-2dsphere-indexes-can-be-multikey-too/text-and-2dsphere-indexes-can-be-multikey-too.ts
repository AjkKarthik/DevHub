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
    heading: 'Only Hashed Indexes Are Actually Excluded',
    points: [
      'The main page\'s own QnA on multikey indexes originally claimed "$text and $2dsphere indexes cannot be multikey" — verified against MongoDB\'s own official Multikey Indexes documentation, which names exactly ONE index type unable to be multikey: hashed indexes. Neither text nor 2dsphere indexes appear anywhere in that restriction.',
      'A text index built on an array-of-strings field (like a <code>tags</code> array) indexes EVERY string in the array — the same expansion behavior a regular multikey index applies to any array field. MongoDB\'s own documentation describes building a text index as comparable to building a large multikey index.',
      'A 2dsphere index readily supports a field containing an ARRAY of GeoJSON geometries — multiple locations per document — with MongoDB\'s own compound-2dsphere-index documentation explicitly describing this multi-location capability. The genuinely excluded case is hashed indexes specifically, which cannot be built on an array field at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Multikey Text and 2dsphere Indexes',
    language: 'typescript',
    code: `const articles = db.collection('articles');

// Text index on an ARRAY field (tags) -- every string element gets
// its own index entry, exactly like a regular multikey index.
await articles.createIndex({ tags: 'text' });
await articles.insertMany([
  { title: 'MongoDB Basics', tags: ['mongodb', 'nosql', 'database'] },
  { title: 'Redis Caching',   tags: ['redis', 'caching', 'nosql'] },
]);

const nosqlMatches = await articles.find({ \$text: { \$search: 'nosql' } }).toArray();
// -> BOTH articles match -- 'nosql' appears in EITHER array, exactly
//    the multikey "any element matches" behavior

// 2dsphere index on an ARRAY of GeoJSON points -- multiple locations
// per document (e.g., a business with several branch addresses).
const businesses = db.collection('businesses');
await businesses.createIndex({ locations: '2dsphere' });
await businesses.insertOne({
  name: 'Coffee Chain Co',
  locations: [
    { type: 'Point', coordinates: [-0.1, 51.5] }, // London branch
    { type: 'Point', coordinates: [-73.9, 40.7] }, // NYC branch
  ],
});
// \$near / \$geoWithin queries match if ANY location in the array is
// within range -- the same array-expansion multikey semantics.

// Pure-JS equivalent, verified: text-search array-contains matching
function textSearchTags(docs, term) {
  return docs.filter(d => d.tags.some(t => t.toLowerCase().includes(term.toLowerCase()))).map(d => d.title);
}
const seedArticles = [
  { title: 'MongoDB Basics', tags: ['mongodb', 'nosql', 'database'] },
  { title: 'Redis Caching',   tags: ['redis', 'caching', 'nosql'] },
];
console.log('Search "nosql":', textSearchTags(seedArticles, 'nosql'));
console.log('Search "redis":', textSearchTags(seedArticles, 'redis'));
// -> Search "nosql": [ 'MongoDB Basics', 'Redis Caching' ]
// -> Search "redis": [ 'Redis Caching' ]`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own multikey QnA states the compound-index restriction precisely: "at most ONE of the indexed fields can be an array in any given compound index." Could you build a compound index on <code>{ tags: "text", locations: "2dsphere" }</code> on the SAME collection — where both fields hold arrays?',
  hint: 'The restriction is about how many ARRAY-valued fields can coexist in ONE compound index, not about which specific index TYPES (text vs. 2dsphere) are involved.',
  solution: `// No -- this would violate the compound multikey restriction the
// main page's own QnA already states, regardless of the fact that
// the two fields use different index types (text and 2dsphere). The
// rule is about how many of the compound index's OWN fields are
// array-valued in a given document -- if BOTH tags and locations are
// arrays on the same document, MongoDB rejects the write (or the
// index creation, depending on which happens first) the same way it
// would for any other compound index combining two array fields,
// entirely independent of which two index TYPES are being combined.
//
// This subtopic's own finding (text and 2dsphere CAN each individually
// be multikey) and the compound-index restriction are two SEPARATE
// rules -- correcting the first doesn't relax the second at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since a text index and a 2dsphere index are specialized index types (unlike a plain B-tree index), they must have special, restricted array-handling behavior — being excluded from "multikey" seems like a natural extra restriction that comes with being specialized.',
    reality: 'Verified against MongoDB\'s own documentation: specialized index types are not automatically more restricted with arrays — text and 2dsphere indexes both handle array fields the same expansive way a plain multikey index does. The ACTUAL specialized restriction belongs to hashed indexes specifically, for an unrelated reason (a hash of an array value has no natural per-element meaning the way a plain field comparison does).',
  },
  {
    thought: 'If a claim about MongoDB appears inside a long, detailed QnA answer that gets several OTHER facts right, the specific claim in question is probably also correct.',
    reality: 'The very QnA this subtopic corrects got several other facts about multikey indexes right in the same answer (the compound-index one-array-field restriction, the covered-query limitation, the index-size-bloat warning) — the "$text and $2dsphere cannot be multikey" claim was simply one specific, isolated inaccuracy embedded among otherwise-accurate content. A detailed answer being mostly right is not evidence any SPECIFIC claim within it is also right — each checkable claim is worth verifying independently.',
  },
];

@Component({
  selector: 'app-mongo-indexes-text-2dsphere-multikey',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './text-and-2dsphere-indexes-can-be-multikey-too.html',
  styleUrl: './text-and-2dsphere-indexes-can-be-multikey-too.scss',
})
export class TextAnd2dsphereIndexesCanBeMultikeyTooSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
