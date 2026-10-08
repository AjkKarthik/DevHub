import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-word-break-cubic-slice',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './word-break-cubic-slice.html',
  styleUrl: './word-break-cubic-slice.scss'
})
export class WordBreakCubicSliceSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Counting Characters Copied, Not Just Loop Iterations',
      points: [
        'The main page labelled its <code>wordBreak</code> as O(n²): two nested loops over split points. But each inner step calls <code>s.slice(j, i)</code>, which copies i - j characters into a new string before the Set can hash it. The cost per step is not constant.',
        'Instrumented on a worst case — a string of n "a" characters followed by "b", with dictionary ["a", "aa", "aaa"], so every prefix is breakable but the full string is not — the number of split checks grew as n² (4,954 at n = 100, 319,604 at n = 800). The characters copied grew as n³: 176,556 at n = 100, 1,373,106 at n = 200, 10,826,206 at n = 400 and 85,972,406 at n = 800. Each doubling of n multiplied the copying by about 8.',
        'The standard fix limits how far back j can start. No dictionary word is longer than L (3 here), so only the last L split points can produce a word. With that bound, n = 800 needed 803 checks and copied 2,403 characters, against 319,604 and nearly 86 million without it.',
        'The bounded version is O(n × L²) — n end positions, at most L start positions each, and slices of at most L characters. When dictionary words are short compared with the input, that is effectively linear.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Unbounded vs word-length-bounded Word Break',
      language: 'typescript',
      code: `// The main page's version: every j from 0, every slice copies i - j chars
function wordBreak(s: string, wordDict: string[]): boolean {
  const dict = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = 0; j < i; j++)
      if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[s.length];
}

// Bounded: a word can only start within maxLen characters of i
function wordBreakBounded(s: string, wordDict: string[]): boolean {
  const dict = new Set(wordDict);
  const maxLen = Math.max(0, ...wordDict.map(w => w.length));
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = Math.max(0, i - maxLen); j < i; j++)
      if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[s.length];
}

// s = "a".repeat(n) + "b", dict = ["a", "aa", "aaa"]
//   n      checks (unbounded)  chars copied (unbounded)  checks / copied (bounded)
//   100         4,954                176,556                 103 / 303
//   200        19,904              1,373,106                 203 / 603
//   400        79,804             10,826,206                 403 / 1,203
//   800       319,604             85,972,406                 803 / 2,403`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The dictionary may contain one very long word, say 5,000 characters, next to many short ones. What happens to the bounded version, and how could you keep the benefit?',
    hint: 'What does maxLen become, and which j values does that allow?',
    solution: 'maxLen becomes 5,000, so for long inputs the bounded loop again tries up to 5,000 start positions per end position and loses most of its advantage. One fix is to collect the distinct word lengths in a Set and only try j = i - len for each length that actually occurs; with a few short lengths and one long one, that is a handful of checks per position instead of 5,000.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Two nested loops means O(n²), whatever happens inside them.',
      reality: 'Only if the inside is constant time. s.slice(j, i) and hashing the resulting string both cost time proportional to its length, so the page\'s Word Break does O(n²) steps of up to O(n) work each.',
    },
    {
      thought: 'The early break after finding a valid split, from the main page\'s mistake block, already keeps Word Break fast.',
      reality: 'The break fires, but late. j counts up from 0, so for each position the long slices (length i, i - 1, ...) are built and rejected first, and the successful three-letter word is only reached at j = i - 3. Nearly every earlier j is still tried and copied. The bound on j is what removed the cubic cost.',
    },
  ];
}
