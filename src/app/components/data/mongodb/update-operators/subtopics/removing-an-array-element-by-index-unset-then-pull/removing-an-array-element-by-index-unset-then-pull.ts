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
    heading: 'Two Steps, Because $unset Never Shifts an Array',
    points: [
      'The main page\'s own QnA states the idiom precisely: "MongoDB has no delete by index operator. The idiomatic approach is a two-step operation: (1) $unset the element to null... then (2) $pull the null value" — but shows no code demonstrating either step or what the array looks like in between.',
      '<code>$unset</code> on an array index (<code>"arr.2"</code>) does NOT remove the element or shift later elements down — it sets that specific slot to <code>null</code>, leaving the array the SAME length it was before. This is exactly why a second step is needed at all: without it, the array would just have a hole in it, not one fewer element.',
      '<code>$pull: { arr: null }</code> then removes every <code>null</code> entry and compacts the array — verified directly that the two steps combined produce the same result as if the element had simply been spliced out, while either step ALONE would leave the array in a state neither correct nor useful on its own.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Remove Array Element by Index, Verified Step by Step',
    language: 'typescript',
    code: `const docs = db.collection('docs');

// Starting array: ['a', 'b', 'c', 'd'] -- remove index 2 ('c')

// Step 1: $unset the indexed slot -- length is UNCHANGED
await docs.updateOne(
  { _id: docId },
  { $unset: { 'arr.2': '' } }
);
// -> arr is now ['a', 'b', null, 'd']  (still 4 elements)

// Step 2: $pull the null placeholder -- THIS is what actually
// shortens the array
await docs.updateOne(
  { _id: docId },
  { $pull: { arr: null } as any }
);
// -> arr is now ['a', 'b', 'd']  (3 elements, index 2 truly gone)

// Both steps together, combined in one call for atomicity of intent
// (still two round trips -- MongoDB cannot express "unset by index,
// then compact" as a single atomic operator):
async function removeArrayElementAtIndex(collection: any, id: string, arrayField: string, index: number) {
  await collection.updateOne({ _id: id }, { $unset: { [\`\${arrayField}.\${index}\`]: '' } });
  await collection.updateOne({ _id: id }, { $pull: { [arrayField]: null } });
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A document\'s array field can legitimately contain a real <code>null</code> value as one of its own elements (not from this delete pattern — genuinely meaningful data). Is the two-step $unset-then-$pull idiom still safe to use on this array?',
  hint: 'Think about exactly what $pull: { arr: null } removes — does it distinguish "null because we just unset it" from "null because that was always the real value"?',
  solution: `// No -- it is NOT safe. $pull: { arr: null } removes EVERY null
// element in the array, with no way to distinguish a null the
// $unset step just created from a null that was already there as
// genuine data. Running this idiom on such an array would silently
// delete legitimate null entries the caller never intended to touch.
//
// This two-step pattern only works safely when null is otherwise
// GUARANTEED never to be a valid array element for that field --
// if that guarantee doesn't hold, the safer alternative the main
// page's own QnA names is reading the document, modifying the array
// in application code, and writing the whole array back with $set.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$unset on an array index behaves like deleting an item from a JavaScript array with splice() — the array gets one element shorter immediately.',
    reality: '$unset on an array index behaves nothing like splice() — it sets that one slot to null and leaves every other element exactly where it was, including the array\'s own length. The array only actually shortens once the SEPARATE $pull step runs. Treating $unset alone as "the delete" is a real, easy mistake, since the field genuinely does look different in the document afterward (a null instead of the old value) — just not shorter.',
  },
  {
    thought: 'This two-step pattern is atomic, since both operations target the same document and run back to back.',
    reality: 'The two updateOne calls are two SEPARATE operations, each individually atomic, but not atomic AS A PAIR — another process reading or writing the document between the $unset and the $pull would observe the intermediate ["a", "b", null, "d"] state, with a null sitting where a real value used to be. For a genuinely atomic single-call alternative when this window is unacceptable, reading the array, removing the element in application code, and writing it back with a single $set call is the fallback the main page\'s own QnA names.',
  },
];

@Component({
  selector: 'app-mongo-update-remove-by-index',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './removing-an-array-element-by-index-unset-then-pull.html',
  styleUrl: './removing-an-array-element-by-index-unset-then-pull.scss',
})
export class RemovingAnArrayElementByIndexUnsetThenPullSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
