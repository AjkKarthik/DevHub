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
    heading: 'One Array Field Per Document, Full Stop',
    points: [
      'The main page\'s own "Multikey Indexes" theory bullet said the restriction applies to "TWO multikey fields from arrays of different sizes" — implying two SAME-sized arrays might be fine. Verified directly against MongoDB\'s own documentation: the restriction is unconditional. "For a compound multikey index, each indexed document can have at most one indexed field whose value is an array" — array length is never mentioned as a factor at all.',
      'The SAME main page already states this correctly elsewhere, without any size qualifier: its own mistake block says "A compound multikey index cannot have two fields that are both arrays in the same document," and its own codeTab comment reads "Error: cannot create compound multikey index on two array fields." The theory bullet was the one place on the page that introduced an incorrect exception.',
      'Verified the enforcement point too: this restriction isn\'t checked at query time — it\'s checked when the index itself is built (or when a new document is inserted/updated against an already-existing index). A document with two array fields will fail to insert against a pre-existing violating compound index, or block the createIndex() call itself if such a document already exists in the collection.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Same-Length Arrays Still Violate the Restriction',
    language: 'bash',
    code: `# Two arrays of the IDENTICAL length -- still fails, per the
# UNCONDITIONAL restriction (not a size mismatch problem at all).
db.orders.insertOne({
  _id: 1,
  tags: ["a", "b"],     # length 2
  scores: [10, 20],     # ALSO length 2 -- matching lengths, doesn't matter
})

db.orders.createIndex({ tags: 1, scores: 1 })
# Error: cannot index parallel arrays [scores] [tags]
# -- fails regardless of the fact both arrays are the same length.

# The only fix: at most ONE array field per compound index.
db.orders.createIndex({ tags: 1 })
db.orders.createIndex({ scores: 1 })
# Or, if scores is actually a fixed set of named values, restructure
# it as separate scalar fields instead of an array.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A collection has 10,000 documents where only ONE document, deep in the collection, happens to have BOTH tags and scores as arrays (every other document has at most one of the two as an array). Does <code>createIndex({ tags: 1, scores: 1 })</code> succeed for the other 9,999 documents and just skip that one, or does the whole operation fail?',
  hint: 'The restriction is checked per document, but createIndex() builds one index covering the WHOLE collection at once -- think about what happens when the index build reaches that one document.',
  solution: `// The whole createIndex() call fails -- MongoDB does not build a
// "partial" compound multikey index that simply skips the one
// offending document. The instant the index build encounters ANY
// document violating the one-array-field restriction, the entire
// operation fails with an error, and no index is created at all --
// not even a valid one covering the other 9,999 documents.
//
// This is why the restriction is worth checking proactively during
// schema design, not just testing against a handful of sample
// documents during development -- a single edge-case document deep
// in a large, otherwise-compliant collection is enough to make the
// whole index creation fail outright.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The restriction exists because two arrays of DIFFERENT lengths would create a lopsided, inefficient Cartesian product -- same-length arrays should be fine since the product would at least be predictable.',
    reality: 'The restriction has nothing to do with efficiency or predictability of the resulting entry count — it is a flat prohibition on having more than one array field in a compound index\'s covered fields, for ANY document. Two arrays of length 2 each still produce a 2×2=4-entry Cartesian product per document (not a 1-to-1 pairing), which is exactly the same kind of combinatorial blowup the restriction exists to prevent regardless of whether the lengths happen to match.',
  },
  {
    thought: 'Since only ONE document out of many violates the restriction, MongoDB would reasonably index that document differently or mark it separately, rather than failing the whole build.',
    reality: 'MongoDB has no concept of a "partially indexed" collection for this restriction — a compound index either exists correctly for every document that could match it, or the create operation fails entirely. There is no per-document opt-out or graceful degradation; the restriction is enforced as an all-or-nothing constraint on the index as a whole.',
  },
];

@Component({
  selector: 'app-mongo-array-multikey-restriction',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-compound-multikey-restriction-is-unconditional.html',
  styleUrl: './the-compound-multikey-restriction-is-unconditional.scss',
})
export class TheCompoundMultikeyRestrictionIsUnconditionalSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
