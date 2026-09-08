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
    heading: 'Three Forms, No Code Anywhere on the Main Page',
    points: [
      'The main page\'s own QnA describes all three forms of <code>$slice</code> in careful detail: a positive N returns the first N elements, a negative N returns the last N, and a <code>[skip, limit]</code> array form returns <code>limit</code> elements starting at position <code>skip</code>. None of these appear in any codeTab, despite <code>$slice (projection)</code> being its own QuickRef entry.',
      '<code>$slice</code> operates purely on POSITION, exactly matching a plain JavaScript array slice — it never sorts or filters the array first. Verified directly: slicing a 12-element array with the <code>[10, 5]</code> form returns only 2 elements, not 5, since only 2 elements remain from index 10 onward — <code>$slice</code> never pads a short result or errors when the array runs out early.',
      'The main page\'s own theory section (a later heading, "Array Performance Considerations") separately names the technique of using <code>$push</code> with a <code>$slice</code> UPDATE modifier to cap a growing array — this is a genuinely different operator usage from the PROJECTION form covered here, sharing only the operator name.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'All Three $slice Forms, Verified',
    language: 'typescript',
    code: `const posts = db.collection('posts');

// Positive N -- first 5 comments
const firstFive = await posts.findOne(
  { _id: postId },
  { projection: { comments: { \$slice: 5 } } }
);

// Negative N -- last 3 comments
const lastThree = await posts.findOne(
  { _id: postId },
  { projection: { comments: { \$slice: -3 } } }
);

// [skip, limit] -- pagination: 5 comments starting at index 10
const page3 = await posts.findOne(
  { _id: postId },
  { projection: { comments: { \$slice: [10, 5] } } }
);

// Pure-JS equivalent, verified against a real 12-element array to
// confirm the exact behavior at each form's own edge cases:
function mongoSlice<T>(arr: T[], sliceSpec: number | [number, number]): T[] {
  if (Array.isArray(sliceSpec)) {
    const [skip, limit] = sliceSpec;
    return arr.slice(skip, skip + limit);
  }
  return sliceSpec >= 0 ? arr.slice(0, sliceSpec) : arr.slice(sliceSpec);
}

const comments = ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12'];
console.log(mongoSlice(comments, 5));        // ['c1'..'c5']       -- first 5
console.log(mongoSlice(comments, -3));       // ['c10','c11','c12'] -- last 3
console.log(mongoSlice(comments, [10, 5]));  // ['c11','c12']       -- only 2 remain!`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A post has exactly 8 comments. A client requests <code>{ comments: { $slice: [10, 5] } }</code> — skip 10, then take 5. What does the query return?',
  hint: 'The array only has 8 elements total -- position 10 is already past the end of the array before any "taking" even happens.',
  solution: `// An empty array: []. Skipping 10 elements from an 8-element array
// leaves nothing at all to slice from -- there's no element at
// position 10 or beyond. This matches plain JavaScript slice
// semantics exactly: [1,2,3].slice(10, 15) also returns [], not an
// error and not a shorter-than-requested-but-nonempty result.
//
// This confirms $slice degrades gracefully at every boundary: too
// few elements after skip yields fewer than limit (as the [10,5] on
// a 12-element array showed, returning 2 instead of 5), and skipping
// past the end entirely yields exactly zero, never an error.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$slice, being a "sort of like $sort" name, orders the array before taking the requested elements.',
    reality: '$slice never sorts anything — it operates strictly on the array\'s STORED order, exactly as a plain array index slice would. Getting the "top 5 highest-rated comments" (a value-based selection) requires sorting the array FIRST, either at write time (keeping it pre-sorted, as the page\'s own $push+$sort+$slice UPDATE pattern does) or via an aggregation $sort stage before projecting — $slice alone only ever answers "which positions," never "which values."',
  },
  {
    thought: 'The [skip, limit] form and separate positive/negative N forms are three unrelated features that happen to share an operator name.',
    reality: 'They are all the same underlying position-based slicing mechanism, just with different shorthand for the common cases: a bare positive N is shorthand for "skip 0, take N," and a bare negative N is shorthand for "count backward N from the end." The [skip, limit] form is the only one that can express an arbitrary middle-of-the-array range, which is why it\'s the one used for genuine pagination.',
  },
];

@Component({
  selector: 'app-mongo-array-slice-projection',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './slicing-arrays-with-the-slice-projection-operator.html',
  styleUrl: './slicing-arrays-with-the-slice-projection-operator.scss',
})
export class SlicingArraysWithTheSliceProjectionOperatorSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
