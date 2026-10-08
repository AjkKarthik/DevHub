import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-sorts-multikey',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sorting-by-multiple-keys-the-order-matters.html',
  styleUrl: './sorting-by-multiple-keys-the-order-matters.scss'
})
export class SortingByMultipleKeysTheOrderMattersSubtopic {
  topicLabel = 'Basic Sorts';
  topicRoute = '/dsa/basic-sorts';

  theory: TheoryPoint[] = [
    {
      heading: 'Building the Multi-Key Stable Sort the QnA Describes But Never Shows',
      points: [
        'The main page\'s own QnA states the technique precisely: "Sort by least important key first, then most important." No codeTab anywhere on the page actually sorts by two keys to show why this exact order is required.',
        'Built both orders and compared them directly on the same 5-person dataset (name, department, age), sorting by department (primary/most important) and age (secondary/least important). Sorting age FIRST then department LAST correctly groups every person into their own department, each internally sorted by age.',
        'Doing it the other way — department first, then age last — is where the QnA\'s own ordering rule actually matters: verified directly that applying the FINAL sort (by age) reorders the ENTIRE array by age alone, completely destroying the department grouping the first sort had already established. One Engineering employee (age 35) ends up stranded among the Sales group, since nothing about the final age-only sort respects department boundaries at all.',
        'This relies specifically on Array.prototype.sort() being a STABLE sort (guaranteed by the ECMAScript 2019 spec, and true of every current JavaScript engine) — a stable final sort never needs to reorder two elements that are already equal on the key it\'s sorting by, which is exactly what keeps elements within the SAME group in their already-established relative order when sorting correctly, least-important-key-first.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Correct order (age, then dept) vs. wrong order (dept, then age)',
      language: 'typescript',
      code: `interface Person { name: string; dept: string; age: number; }

const people: Person[] = [
  { name: 'Eve', dept: 'Eng', age: 35 },
  { name: 'Alice', dept: 'Sales', age: 30 },
  { name: 'Bob', dept: 'Eng', age: 22 },
  { name: 'Carol', dept: 'Sales', age: 28 },
  { name: 'Dan', dept: 'Eng', age: 25 },
];

// CORRECT: least important key (age) first, most important (dept) LAST
function sortCorrect(arr: Person[]): Person[] {
  let result = [...arr];
  result = result.sort((a, b) => a.age - b.age);
  result = result.sort((a, b) => a.dept.localeCompare(b.dept));
  return result;
}

// WRONG: most important key (dept) first, least important (age) LAST
function sortWrong(arr: Person[]): Person[] {
  let result = [...arr];
  result = result.sort((a, b) => a.dept.localeCompare(b.dept));
  result = result.sort((a, b) => a.age - b.age);
  return result;
}

console.log(sortCorrect(people).map(p => \`\${p.dept}/\${p.age}/\${p.name}\`));
// Actual measured output:
// ["Eng/22/Bob", "Eng/25/Dan", "Eng/35/Eve", "Sales/28/Carol", "Sales/30/Alice"]
// Eng and Sales each fully grouped, ages ascending within each group.

console.log(sortWrong(people).map(p => \`\${p.dept}/\${p.age}/\${p.name}\`));
// Actual measured output:
// ["Eng/22/Bob", "Eng/25/Dan", "Sales/28/Carol", "Sales/30/Alice", "Eng/35/Eve"]
// Eve (Eng, 35) is stranded AFTER the Sales group -- department grouping destroyed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If you ran sortWrong on a dataset where every single person happened to have a UNIQUE age (no ties at all), would the department grouping still get destroyed the same way?',
    hint: 'Does the bug depend on ties between ages, or does it happen regardless of whether ages repeat?',
    solution: 'It would still get destroyed, and in fact MORE completely, not less. The bug has nothing to do with ties — the final age-only sort reorders the ENTIRE array purely by age value, with zero awareness that a department grouping exists at all. Unique ages just mean every single person\'s final position is determined ONLY by their age rank, guaranteeing the department groups are thoroughly interleaved rather than merely disrupted in a few spots. Ties are actually what stability is FOR: when ages tie, a stable sort leaves those tied elements in whatever relative order the previous sort pass already established -- but that stability only helps the elements that remain tied on the FINAL sort key, which is why the final sort key must be the one you care about ordering by overall (the most important one).',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Sorting by multiple keys should work correctly regardless of which order you apply the individual sort passes in, as long as you eventually sort by both keys.',
      reality: 'Verified directly: applying the exact same two sort passes in the opposite order produces a completely different, broken result — Eve (Eng, age 35) ends up stranded after the entire Sales group instead of grouped with her own department. The QnA\'s own stated rule (least important key first, most important key LAST) is not a stylistic preference; it is the specific ordering that makes the final pass\'s stability actually preserve the earlier pass\'s grouping.',
    },
    {
      thought: 'This technique only works because JavaScript happens to have a stable Array.sort() -- in a language with an unstable sort, there would be no way to do a correct multi-key sort at all without a single combined comparator.',
      reality: 'A single combined comparator (comparing department first, falling back to age when departments are equal) would also work correctly in ANY language, stable or not, since it makes the ordering decision in one pass using both keys together. The least-important-first TWO-PASS technique specifically requires stability because it relies on information from an EARLIER pass surviving, untouched, through a LATER pass — that reliance is exactly what an unstable sort would not guarantee.',
    },
  ];
}
