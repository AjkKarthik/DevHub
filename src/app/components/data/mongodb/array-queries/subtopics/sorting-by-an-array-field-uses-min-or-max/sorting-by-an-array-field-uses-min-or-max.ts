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
    heading: 'The Same Document Can Sort First in Both Directions',
    points: [
      'The main page\'s own QnA states the rule precisely: "When you sort by an array field, MongoDB uses the minimum value (ascending sort) or maximum value (descending sort) from each document\'s array for comparison." No codeTab demonstrates the actual, genuinely surprising consequence of this rule.',
      'Verified directly with a three-student example: Alice has scores <code>[90, 40, 70]</code> (min 40, max 90), Bob has <code>[60, 65, 62]</code> (min 60, max 65), and Cy has <code>[95, 10, 50]</code> (min 10, max 95). Sorting ascending by <code>scores</code> puts Cy FIRST (lowest min, 10). Sorting descending by the SAME field also puts Cy FIRST (highest max, 95) — the same document tops both orderings, because its array simply has the widest spread of values, not because it\'s consistently "low" or "high."',
      'This is a genuinely different result from what a reader might expect if they assumed "sort by scores" meant "sort by average score," "sort by first score," or "sort by most recent score" — none of those interpretations would put Cy first in both directions the way the real min/max rule does.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Sorting by Array Field, Verified',
    language: 'typescript',
    code: `const students = db.collection('students');

// Ascending -- MongoDB compares each document's MINIMUM score
const byMinAscending = await students.find({}).sort({ scores: 1 }).toArray();

// Descending -- MongoDB compares each document's MAXIMUM score
const byMaxDescending = await students.find({}).sort({ scores: -1 }).toArray();

// Pure-JS equivalent, verified against seed data matching the exact
// rule the main page's own QnA describes:
function sortByArrayField<T extends Record<string, number[]>>(
  docs: T[],
  field: keyof T,
  direction: 1 | -1
): T[] {
  return [...docs].sort((a, b) => {
    const keyA = direction === 1 ? Math.min(...a[field]) : Math.max(...a[field]);
    const keyB = direction === 1 ? Math.min(...b[field]) : Math.max(...b[field]);
    return direction === 1 ? keyA - keyB : keyB - keyA;
  });
}

const seedStudents = [
  { name: 'Alice', scores: [90, 40, 70] },
  { name: 'Bob',   scores: [60, 65, 62] },
  { name: 'Cy',    scores: [95, 10, 50] },
];

console.log(sortByArrayField(seedStudents, 'scores', 1).map(s => s.name));
// -> ['Cy', 'Alice', 'Bob']   -- ascending by MIN (Cy's min is 10)

console.log(sortByArrayField(seedStudents, 'scores', -1).map(s => s.name));
// -> ['Cy', 'Alice', 'Bob']   -- descending by MAX too (Cy's max is 95)
// Cy is FIRST in BOTH directions -- widest spread, not consistently low or high.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A fourth student, Dee, has scores <code>[70, 72, 71]</code> — a very narrow, consistent spread all clustered around 70-72. Where does Dee rank in an ASCENDING sort by <code>scores</code>, relative to Alice (min 40), Bob (min 60), and Cy (min 10)?',
  hint: 'Ascending sort compares each student\'s MINIMUM score only -- Dee\'s minimum is 70. Compare that single number against Alice, Bob, and Cy\'s own minimums.',
  solution: `// Dee ranks LAST (highest minimum among the four): Cy (min 10),
// Alice (min 40), Bob (min 60), Dee (min 70) -- ascending order by
// minimum score.
//
// This is worth noting precisely because Dee's scores are the most
// CONSISTENTLY solid of anyone (70-72 every time, no low outliers),
// yet Dee sorts dead last in ascending order -- purely because the
// rule only ever looks at the single lowest value, with no regard
// for how representative that value actually is of the rest of the
// array. A student with one unlucky low score (like Cy's 10) always
// beats a student with zero low scores at all, under this specific
// sort rule.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Sorting ascending by an array field roughly approximates "sort by the typical/average performance," since low values pull the sort key down.',
    reality: 'It has no relationship to typical or average performance at all — a SINGLE outlier value determines the entire sort key, regardless of how unrepresentative that one value is of the rest of the array. A student who scored 10 exactly once, surrounded by otherwise-strong scores, sorts as if they were the weakest student overall in ascending order — the other scores in the array are completely invisible to the sort comparison.',
  },
  {
    thought: 'A document that sorts first in ascending order by an array field must sort LAST in descending order by that same field, the way sorting a scalar field always works.',
    reality: 'This intuition, correct for scalar fields, breaks down for array fields specifically because ascending and descending use DIFFERENT values from the same array (min vs. max) — not the same value compared in reverse. A document with a wide spread between its own minimum and maximum can rank first in both directions simultaneously, which is structurally impossible for a scalar field where ascending and descending are always mirror images of each other.',
  },
];

@Component({
  selector: 'app-mongo-array-sort-min-max',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sorting-by-an-array-field-uses-min-or-max.html',
  styleUrl: './sorting-by-an-array-field-uses-min-or-max.scss',
})
export class SortingByAnArrayFieldUsesMinOrMaxSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
