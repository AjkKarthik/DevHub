import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-strings-rabin-karp',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rabin-karp-rolling-hash.html',
  styleUrl: './rabin-karp-rolling-hash.scss'
})
export class RabinKarpRollingHashSubtopic {
  topicLabel = 'Strings';
  topicRoute = '/dsa/strings';

  theory: TheoryPoint[] = [
    {
      heading: 'The QuickRef Names It, the QnA Describes It, Neither Shows Code',
      points: [
        'The main page\'s own Quick Reference lists "Rolling hash -- Rabin-Karp substring search -- O(n+m) average" and the QnA adds "removing the outgoing character\'s contribution and adding the incoming character\'s" enables O(1) window updates -- but no codeTab anywhere on the page actually computes a rolling hash.',
        'The core trick: treat the window of characters as digits of a number in some BASE (e.g. 256, since ASCII/byte values fit under that), compute that number modulo a large prime to keep it from overflowing, and when the window slides by one position, update the hash in O(1) using modular arithmetic instead of rehashing all m characters from scratch.',
        'Verified directly against a brute-force O(nm) search across four test cases, using exact BigInt arithmetic (to sidestep any floating-point precision concern entirely) for both the pattern\'s hash and the rolling window hash -- all four matched exactly, including the "aaaaaa" search for "aa" where every window overlaps the previous one.'
      ]
    },
    {
      heading: 'Why the Hash Check Alone Is Not Enough',
      points: [
        'A hash match does not PROVE the substrings are equal -- it is possible (though rare, with a good hash and modulus) for two different substrings to hash to the same value, a collision. The main page\'s own quiz explanation already notes this correctly: "Worst case O(nm) on hash collisions."',
        'The standard, necessary fix is exactly what a correct Rabin-Karp implementation does: treat a hash match as a CANDIDATE, then do one direct character-by-character comparison (<code>text.slice(i, i+m) === pattern</code>) to confirm it before reporting a real match. Skipping this verification step trades a rare correctness bug for a small constant-factor speedup -- not a trade worth making.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Rolling hash, verified against naive',
      language: 'typescript',
      code: `function rabinKarpSearch(text: string, pattern: string): number[] {
  const n = text.length, m = pattern.length;
  if (m > n) return [];
  const BASE = 256n, MOD = 1_000_000_007n;

  let patternHash = 0n, windowHash = 0n, power = 1n;
  for (let i = 0; i < m - 1; i++) power = (power * BASE) % MOD;

  for (let i = 0; i < m; i++) {
    patternHash = (patternHash * BASE + BigInt(pattern.charCodeAt(i))) % MOD;
    windowHash = (windowHash * BASE + BigInt(text.charCodeAt(i))) % MOD;
  }

  const results: number[] = [];
  for (let i = 0; i <= n - m; i++) {
    // Hash match is a CANDIDATE -- always verify with a real comparison,
    // since a hash collision would otherwise report a false match.
    if (windowHash === patternHash && text.slice(i, i + m) === pattern) {
      results.push(i);
    }
    if (i < n - m) {
      // Roll the window forward in O(1): remove the outgoing char's
      // contribution, shift, add the incoming char's.
      windowHash = ((windowHash - BigInt(text.charCodeAt(i)) * power) * BASE
                      + BigInt(text.charCodeAt(i + m))) % MOD;
      if (windowHash < 0n) windowHash += MOD; // JS BigInt %  can return negative
    }
  }
  return results;
}

// Verified against a brute-force O(nm) reference -- all matched exactly:
//   rabinKarpSearch("ABABDABACDABABCABAB", "ABABCABAB") = [10]
//   rabinKarpSearch("aaaaaa", "aa")                     = [0, 1, 2, 3, 4]
//   rabinKarpSearch("mississippi", "issi")              = [1, 4]
//   rabinKarpSearch("abcabcabc", "abc")                 = [0, 3, 6]`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'The line <code>if (windowHash &lt; 0n) windowHash += MOD;</code> exists specifically because of how JavaScript\'s <code>%</code> operator behaves on BigInt. What would break without it?',
    hint: 'JavaScript\'s remainder operator can return a negative result when the left-hand operand is negative, unlike a true mathematical modulo, which always returns a non-negative result for a positive modulus. Think about what the subtraction right before the % computes.',
    solution: 'The expression <code>(windowHash - BigInt(text.charCodeAt(i)) * power)</code> can genuinely go negative -- it is removing a weighted character value from a hash that might be smaller than that weighted value after the modular reduction. JavaScript\'s <code>%</code> is a REMAINDER operator, not a true modulo: for a negative left operand it can return a negative result (e.g. <code>-5n % 3n</code> is <code>-2n</code>, not the mathematically-expected <code>1n</code>). Without correcting that back into the non-negative range, the rolling hash would drift into negative values that no longer match the always-non-negative <code>patternHash</code>, causing every subsequent comparison to silently fail to match even when the underlying substrings genuinely are equal.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If two substrings hash to the same value, they must be equal -- that is the whole point of hashing.',
      reality: 'A hash match only means equal is POSSIBLE, not guaranteed -- a collision (two different inputs producing the same hash) is always possible with a finite-size hash. The main page\'s own quiz explanation already names this ("Worst case O(nm) on hash collisions"), which is exactly why a real implementation always verifies a hash match with a direct string comparison before reporting it.'
    },
    {
      thought: 'Recomputing the hash of a window from scratch and rolling it forward incrementally are roughly the same amount of work, just organized differently.',
      reality: 'Recomputing from scratch is O(m) per window position, giving O(nm) total across the whole text -- no better than naive search. Rolling forward is O(1) per position (verified above in the implementation), which is the entire reason Rabin-Karp reaches O(n+m) average case instead of O(nm).'
    },
    {
      thought: 'Using BigInt instead of ordinary numbers for the hash arithmetic is just a style choice.',
      reality: 'It avoids a genuine correctness risk: with a large enough base, power, and modulus, intermediate products in the hash computation can exceed JavaScript\'s safe integer range (2^53 - 1) using ordinary numbers, silently producing wrong results through floating-point precision loss. BigInt keeps every intermediate value as an exact integer throughout.'
    }
  ];
}
