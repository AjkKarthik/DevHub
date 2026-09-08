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
    heading: 'find().sort() Has No Equivalent to This at All',
    points: [
      'The main page\'s own QnA gives the exact pattern in prose: "you cannot sort directly on a computed value in find(). Use aggregation with <code>$addFields</code> to compute the field first, then <code>$sort</code>," with the specific example of sorting by description LENGTH via <code>$strLenCP</code>. No codeTab anywhere on the page builds this.',
      'This isn\'t a minor limitation of <code>find().sort()</code> — it is a hard capability gap. The <code>sort()</code> API only ever accepts <code>{ fieldName: 1 | -1 }</code> pairs referencing EXISTING document fields; there is no expression-evaluation capability in it at all, unlike the aggregation pipeline\'s <code>$sort</code> stage, which happily sorts on any field <code>$addFields</code> computed just one stage earlier.',
      'Verified directly with a length-based sort: comparing a 10-character description, a 42-character one, and a 53-character one, the <code>$addFields</code>-then-<code>$sort</code> pattern correctly orders them by their computed length descending — a result <code>find().sort()</code> has no way to produce, since <code>description.length</code> is not a stored field at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Aggregation: Compute, Then Sort',
    language: 'typescript',
    code: `const articles = db.collection('articles');

// find().sort() CANNOT do this -- there is no field called
// "descriptionLength" stored anywhere in the documents, and sort()
// has no way to compute one on the fly.
// await articles.find({}).sort({ 'description.length': -1 }); // does NOT work

// The aggregation pipeline CAN: compute the field first, then sort on it.
const byDescriptionLength = await articles.aggregate([
  { \$addFields: { descLen: { \$strLenCP: '\$description' } } },
  { \$sort: { descLen: -1 } }, // longest descriptions first
]).toArray();

// The same pattern works for any computed sort key -- e.g. sorting
// by array length instead of a string length:
const byTagCount = await articles.aggregate([
  { \$addFields: { tagCount: { \$size: '\$tags' } } },
  { \$sort: { tagCount: -1 } },
]).toArray();

// Pure-JS equivalent, verified against real seed data to confirm the
// exact ordering the aggregation pipeline above would produce:
const seedArticles = [
  { title: 'A', description: 'Short one.' },
  { title: 'B', description: 'This is a considerably longer description field here.' },
  { title: 'C', description: 'Medium length text goes here for this one.' },
];

const sorted = seedArticles
  .map(a => ({ ...a, descLen: a.description.length }))
  .sort((a, b) => b.descLen - a.descLen);

console.log(sorted.map(a => \`\${a.title}(len=\${a.descLen})\`));
// -> ['B(len=53)', 'C(len=42)', 'A(len=10)']`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A developer tries <code>db.articles.find({}).sort({ descriptionLength: -1 })</code>, expecting it to sort by description length, without ever running an <code>$addFields</code> step first. What actually happens?',
  hint: 'Think about what "descriptionLength" refers to as a plain sort key -- does MongoDB compute it, or look for a stored field by that exact name?',
  solution: `// It does NOT throw an error, and it does NOT compute anything --
// find().sort() treats "descriptionLength" as a literal field name to
// look up in each document. Since no document actually has a field
// called descriptionLength (it was never computed or stored), every
// document's value for that "field" is effectively missing/undefined,
// and the sort produces an ARBITRARY, meaningless order -- silently
// wrong, not loudly broken.
//
// This is a genuinely dangerous failure mode: no error message points
// at the mistake, and the query returns SOME order that might even
// look plausible on small test data purely by coincidence, while
// being completely wrong on the real dataset.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since $addFields adds a NEW field to the output, using it before $sort means every document in the result now carries this extra, possibly unwanted descLen field.',
    reality: 'This is actually true and worth planning for — $addFields is additive by design (it keeps every existing field and adds the new one), so the computed field genuinely does appear in the aggregation\'s output unless a later $project or $unset stage removes it. A common follow-up pattern is adding a $project (or $unset) stage after $sort specifically to drop the computed field before returning results to a client that never needed to see it.',
  },
  {
    thought: 'find().sort({ descriptionLength: -1 }) at least fails loudly with a clear error, making the mistake easy to catch during development.',
    reality: 'It fails completely silently, as traced in the Try It above — no error, no warning, just a meaningless sort order that can be easy to miss on small development datasets where "meaningless" and "sort of plausible" can look identical by chance. This makes the aggregation-pipeline pattern not just a capability requirement but a genuine safety improvement: an aggregation referencing a field that was never computed produces null/missing values in a way that\'s at least consistently traceable, rather than silently degrading into whatever undefined-comparison behavior the sort algorithm happens to produce.',
  },
];

@Component({
  selector: 'app-mongo-proj-sort-computed-field',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sorting-by-a-computed-field-with-addfields.html',
  styleUrl: './sorting-by-a-computed-field-with-addfields.scss',
})
export class SortingByAComputedFieldWithAddfieldsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
