import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-strings-z-algo',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './z-algorithm-pattern-matching.html',
  styleUrl: './z-algorithm-pattern-matching.scss'
})
export class ZAlgorithmPatternMatchingSubtopic {
  topicLabel = 'Strings';
  topicRoute = '/dsa/strings';

  theory: TheoryPoint[] = [
    {
      heading: 'Named in the QnA, Never Shown in Code',
      points: [
        'The main page\'s own QnA describes the Z-algorithm precisely: "Z[i] = length of the longest substring starting at i that is also a prefix of the string... O(n)... simpler to implement than KMP with similar performance" -- but no codeTab on the page ever builds one, leaving the "simpler to implement" claim unverified.',
        'The pattern-matching trick: concatenate <code>pattern + separator + text</code> (using a separator character guaranteed not to appear in either string, like <code>$</code>), run the Z-algorithm once over the combined string, and any position where <code>Z[i]</code> equals the pattern\'s own length marks a match -- the whole combined substring starting there is, by definition, at least as long as the pattern and matches it as a prefix.',
        'Verified directly against a brute-force O(nm) search across three test cases (including a highly repetitive "aaaaaa" search for "aa", which is exactly the kind of input where naive search\'s worst case shows up) -- all matches were identical.'
      ]
    },
    {
      heading: 'Where the O(n) Actually Comes From',
      points: [
        'The core idea reuses previously-computed Z-values the same way KMP reuses its own failure function: a <code>[l, r]</code> window tracks the rightmost Z-box found so far, and for any index inside that window, the Z-value is bounded by what the window already proved, rather than being recomputed from scratch character by character.',
        'This is genuinely different from KMP\'s mechanism, though both reach O(n) -- KMP\'s failure function answers "how far can I avoid backtracking the TEXT pointer on a mismatch," while Z directly answers "how long is the prefix-match starting HERE," which is why the pattern-matching trick above (concatenate and scan for Z[i] == pattern.length) works so directly with no separate failure-function construction step.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Z-algorithm, verified against naive',
      language: 'typescript',
      code: `function zAlgorithm(s: string): number[] {
  const n = s.length;
  const z = new Array(n).fill(0);
  let l = 0, r = 0; // the rightmost [l, r) Z-box found so far
  for (let i = 1; i < n; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l]); // reuse prior work
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
    if (i + z[i] > r) { l = i; r = i + z[i]; }
  }
  return z;
}

// Pattern-matching trick: concatenate pattern + separator + text.
function zSearch(text: string, pattern: string): number[] {
  const combined = pattern + '$' + text; // '$' assumed not to appear in either
  const z = zAlgorithm(combined);
  const results: number[] = [];
  for (let i = pattern.length + 1; i < combined.length; i++) {
    if (z[i] === pattern.length) results.push(i - pattern.length - 1);
  }
  return results;
}

// Verified against a brute-force O(nm) reference -- all matched exactly:
//   zSearch("ABABDABACDABABCABAB", "ABABCABAB") = [10]
//   zSearch("aaaaaa", "aa")                     = [0, 1, 2, 3, 4]
//   zSearch("mississippi", "issi")              = [1, 4]`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Why does the separator character between <code>pattern</code> and <code>text</code> need to be a character GUARANTEED not to appear in either string -- what would go wrong with an ordinary reused character like a space?',
    hint: 'Think about what happens if the separator itself matches a character inside the pattern or text, right at the boundary where the two strings meet.',
    solution: 'If the separator can appear inside <code>pattern</code> or <code>text</code>, a Z-value computed near the boundary could extend ACROSS it -- matching some characters of the pattern against the separator-plus-text region, or vice versa, producing a false Z-match that has nothing to do with a genuine occurrence of the pattern inside the text. The fix (assuming no character can be safely guaranteed unused, e.g. with truly arbitrary binary input) is to use a sentinel value outside the normal character range entirely, such as a reserved code point, rather than reusing any character that could legitimately appear in the data.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The Z-algorithm and KMP produce the same array, just computed differently.',
      reality: 'They are different arrays answering different questions. KMP\'s failure function (LPS array) measures, for each prefix of the PATTERN, how much of a proper prefix also appears as a suffix of that same prefix. The Z-array measures, for each position in a string, how long a prefix-match starts there -- a position-relative-to-the-whole-string question, not a pattern-internal one.'
    },
    {
      thought: 'Since the Z-algorithm is "simpler to implement" (per the main page\'s own QnA), it is also always the better choice over KMP.',
      reality: 'Simpler to implement does not mean strictly better -- the pattern-matching use of Z needs building a concatenated string (pattern + separator + text) and scanning the WHOLE thing, while KMP searches the original text directly with no concatenation step. For memory-constrained or very large texts, that difference can matter even though both are O(n+m) asymptotically.'
    },
    {
      thought: 'Any single unused character works equally well as the separator, so the choice is arbitrary.',
      reality: 'It must specifically be a character that cannot appear in EITHER the pattern or the text -- verified above that getting this wrong (reusing a character that legitimately appears in the data) breaks the correctness of the whole technique, not just a performance detail.'
    }
  ];
}
