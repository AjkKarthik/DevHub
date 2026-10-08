import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-palindrome-substring-vs-subsequence',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './palindrome-substring-vs-subsequence.html',
  styleUrl: './palindrome-substring-vs-subsequence.scss'
})
export class PalindromeSubstringVsSubsequenceSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Running the Page\'s Own Functions on Its Own Example',
      points: [
        'The main page\'s QnA used "character" to show substring and subsequence diverging, and said its longest palindromic substring is a single letter because "no contiguous palindrome longer than 1 exists". The page\'s own <code>longestPalindrome</code> (expand around center) returns "ara" for "character" — positions 2 to 4 of c-h-a-r-a-c-t-e-r.',
        'The subsequence half of the example was right: the page\'s own challenge solution, <code>longestPalindromeSubseq</code>, returns 5 for "character", matching "carac" (c, a, r, a, c taken from positions 0, 2, 3, 4, 5).',
        'So the two measures do diverge on this word — 3 against 5 — just not by as much as the QnA claimed. The gap is the "c" at each end: they are both in the string, but the "h" between the first c and the first a breaks contiguity, so only the subsequence version may skip it.',
        'The general lesson for the QnA: a hand-checked example is worth running through the page\'s own code. Both functions were already on the page; running them would have caught the "length 1" claim.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Both page functions on "character"',
      language: 'typescript',
      code: `// From the main page's "Edit Distance & Palindrome" codeTab
function longestPalindrome(s: string): string {
  let start = 0, maxLen = 1;
  function expand(l: number, r: number): void {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    if (r - l - 1 > maxLen) { maxLen = r - l - 1; start = l + 1; }
  }
  for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); }
  return s.slice(start, start + maxLen);
}

// From the main page's Challenge solution
function longestPalindromeSubseq(s: string): number {
  const n = s.length;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = 1;
  for (let len = 2; len <= n; len++)
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      dp[i][j] = s[i] === s[j]
        ? (len === 2 ? 2 : dp[i + 1][j - 1] + 2)
        : Math.max(dp[i + 1][j], dp[i][j - 1]);
    }
  return dp[0][n - 1];
}

longestPalindrome('character');        // "ara"  (length 3, not 1)
longestPalindromeSubseq('character');  // 5      ("carac")`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Find a short English word where the longest palindromic substring really is a single letter but the longest palindromic subsequence is at least 3.',
    hint: 'No two equal letters may be adjacent or one letter apart, but some letter must repeat further away.',
    solution: 'One example is "alphabet". Running the two page functions gives 1 for the substring and 3 for the subsequence. The two a characters are three letters apart (a-l-p-h-a), so no contiguous palindrome longer than one letter exists, but a subsequence can take a, any one letter between them, and the second a — for example "aha". Other words that work: "abstract", "acrobatic", "tomato" (t-o-m-a-t-o: both the t pair and the o pair are four positions apart).',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If two letters of a palindrome are separated by other letters, no contiguous palindrome can use them.',
      reality: 'Contiguity only rules out skipping letters. "ara" in "character" is contiguous because the letters between the two a characters — just "r" — form the palindrome middle themselves.',
    },
    {
      thought: 'Longest palindromic subsequence is always at least twice the substring length when they differ.',
      reality: 'There is no such rule. For "character" they are 3 and 5, and for "alphabet" 1 and 3. The gap depends entirely on which letters repeat and how far apart they are.',
    },
  ];
}
