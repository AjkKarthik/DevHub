import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-lpos-rank-count-and-the-nil-vs-empty-array',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lpos-rank-count-and-the-nil-vs-empty-array.html',
  styleUrl: './lpos-rank-count-and-the-nil-vs-empty-array.scss',
})
export class LposRankCountAndTheNilVsEmptyArraySubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page names but never shows',
      points: [
        'The main page\'s own QnA describes <code>LPOS key element [RANK rank] [COUNT count]</code> in one paragraph — verified accurate against the command\'s own docs (<code>"since": "6.0.6"</code>) — but no codeTab on the page ever calls it.',
        '<code>RANK 1</code> (the default) finds the first match scanning head-to-tail. <code>RANK 2</code> finds the SECOND match, scanning in the same direction. A NEGATIVE rank (<code>RANK -1</code>) reverses the SCAN direction to tail-to-head — but the returned index is always the same 0-based position counted from the head, regardless of which direction found it.',
        '<code>COUNT n</code> returns up to <code>n</code> matching indices as an array instead of just one; <code>COUNT 0</code> means "return every match."',
      ],
    },
    {
      heading: 'A genuinely easy-to-miss return-shape gotcha',
      points: [
        'Verified directly against Redis\'s own docs: "When COUNT is used and no match is found, an empty array is returned. However when COUNT is not used and there are no matches, the command returns nil." The SAME "not found" outcome is represented two completely different ways depending on whether COUNT was part of the call.',
        'Code that checks a plain LPOS result with <code>if (!result)</code> works correctly without COUNT (nil is falsy) — but the identical check against a COUNT-based call is subtly wrong the moment "found zero matches" needs to be distinguished from "found matches, but the list happened to be empty for some other reason" — an empty array is truthy in JavaScript, unlike nil/null.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'RANK and COUNT',
      language: 'typescript',
      code: `// Reproduces LPOS's own documented example precisely.
function lpos(
  list: string[],
  element: string,
  opts: { rank?: number; count?: number } = {},
): number | number[] | null {
  const { rank = 1, count } = opts;
  const matches: number[] = [];
  if (rank > 0) {
    for (let i = 0; i < list.length; i++) if (list[i] === element) matches.push(i);
  } else {
    for (let i = list.length - 1; i >= 0; i--) if (list[i] === element) matches.push(i);
  }
  const startIdx = Math.abs(rank) - 1;
  const selected = matches.slice(startIdx);

  if (count === undefined) {
    return selected.length > 0 ? selected[0] : null; // nil when not found
  }
  const n = count === 0 ? selected.length : count;
  return selected.slice(0, n); // empty array when not found, WITH count
}

const mylist = ['a', 'b', 'c', 'd', '1', '2', '3', '4', '3', '3', '3'];

console.log('LPOS mylist 3:', lpos(mylist, '3'));
console.log('LPOS mylist 3 COUNT 0 RANK 2:', lpos(mylist, '3', { rank: 2, count: 0 }));
// LPOS mylist 3: 6
// LPOS mylist 3 COUNT 0 RANK 2: [ 8, 9, 10 ]  -- matches Redis's own documented example exactly`,
    },
    {
      label: 'The nil vs. empty-array gotcha',
      language: 'typescript',
      code: `function lpos(
  list: string[],
  element: string,
  opts: { count?: number } = {},
): number | number[] | null {
  const { count } = opts;
  const matches: number[] = [];
  for (let i = 0; i < list.length; i++) if (list[i] === element) matches.push(i);

  if (count === undefined) {
    return matches.length > 0 ? matches[0] : null;
  }
  const n = count === 0 ? matches.length : count;
  return matches.slice(0, n);
}

const mylist = ['a', 'b', 'c', 'd', '1', '2', '3', '4', '3', '3', '3'];

const withoutCount = lpos(mylist, 'zzz');
const withCount = lpos(mylist, 'zzz', { count: 0 });

console.log('no COUNT, no match ->', withoutCount, '(nil, falsy)');
console.log('COUNT 0, no match ->', withCount, '(empty array, TRUTHY in JS!)');

// A naive truthiness check silently behaves differently depending on
// whether the call used COUNT at all:
console.log('if (!withoutCount) treats it as "not found":', !withoutCount);
console.log('if (!withCount) treats it as "not found":', !withCount, '<-- WRONG, empty array is truthy');
// no COUNT, no match -> null (nil, falsy)
// COUNT 0, no match -> [] (empty array, TRUTHY in JS!)
// if (!withoutCount) treats it as "not found": true
// if (!withCount) treats it as "not found": false  <-- WRONG, empty array is truthy`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A caller uses <code>LPOS mylist target COUNT 3</code> and writes <code>if (!result) { console.log("not found"); }</code>. For a list with zero matches, what does this code actually print, and why?',
    hint: 'Check what an empty array evaluates to in a plain JavaScript truthiness check — is <code>![]</code> true or false?',
    solution: `It prints nothing at all -- the "not found" branch never runs. LPOS with COUNT returns an empty array ([]) when there are no matches, not nil/null. In JavaScript, an empty array is a truthy value (the expression !arr evaluates to false for arr = []), so the "if (!result)" check is silently false even though zero matches were actually found.

The correct check for a COUNT-based LPOS call is "result.length === 0", not a bare truthiness check on result itself -- the truthiness shortcut only works correctly for the no-COUNT form, where a genuine "not found" comes back as nil/null instead of an empty array.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"LPOS always returns nil/null when nothing matches, the same way GET does for a missing key."',
      reality: 'Verified directly against Redis\'s own docs: this is only true when COUNT is NOT part of the call. Adding COUNT (even COUNT 0) changes the "not found" representation to an empty array instead -- a genuinely different value in most client languages, including JavaScript, where an empty array is truthy but null/nil is not.',
    },
    {
      thought: '"RANK -1 searches the list in reverse, so it returns a different (higher) index than RANK 1 would for the same match."',
      reality: 'RANK\'s sign only changes which DIRECTION the scan searches in -- it never changes how indices are numbered. Every returned index is always 0-based counting from the head of the list, regardless of whether RANK was positive or negative; only WHICH match is found first differs.',
    },
  ];

  topicLabel = 'Lists';
  topicRoute = '/redis/lists';
  prev: SubtopicLink | null = {
    label: 'LMPOP: The Non-Blocking Sibling of BLPOP',
    route: '/redis/lists/lmpop-the-non-blocking-sibling-of-blpop',
  };
  next: SubtopicLink | null = null;
}
