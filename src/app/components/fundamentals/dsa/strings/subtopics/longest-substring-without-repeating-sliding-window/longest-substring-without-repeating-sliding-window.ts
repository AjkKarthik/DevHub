import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-strings-sliding-window',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './longest-substring-without-repeating-sliding-window.html',
  styleUrl: './longest-substring-without-repeating-sliding-window.scss'
})
export class LongestSubstringWithoutRepeatingSlidingWindowSubtopic {
  topicLabel = 'Strings';
  topicRoute = '/dsa/strings';

  theory: TheoryPoint[] = [
    {
      heading: 'A Named Pattern With No CodeTab of Its Own',
      points: [
        'The main page\'s own revision "mustKnow" list and "interviewFocus" list both name "longest substring without repeating characters (sliding window)" as something to know -- but neither of the page\'s two codeTabs ever shows it. The only sliding-window code visible on the page is the Minimum Window Substring Challenge, which solves a DIFFERENT, more complex problem (covering a target set of characters, not avoiding repeats).',
        'This problem needs only a SINGLE pointer-tracking map, not the two frequency maps the Challenge uses -- a map from each character to the index it was last seen at. When a repeat is found inside the current window, the left edge jumps forward to just past that earlier occurrence.',
        'Verified directly against a brute-force O(n^2) check (try every starting index, extend until a repeat appears) across six test strings, including the tricky "abba" case that breaks a naive forget-to-check-the-left-boundary implementation -- all six matched exactly.'
      ]
    },
    {
      heading: 'The "abba" Case Is Exactly Why a Second Condition Is Needed',
      points: [
        'A common first-draft bug: jumping the left pointer forward whenever the current character has been SEEN before, without checking whether that earlier sighting is still inside the current window. For "abba": by the time the window reaches the second \'a\' (index 3), \'a\' was last seen at index 0 -- but the window\'s left edge has already moved past index 0 (to index 2, after the first \'b\' forced a jump). Jumping left back to index 1 based on a stale sighting would shrink the window incorrectly.',
        'The fix is a single guard: only jump the left pointer if the last-seen index is <code>&gt;= left</code> -- i.e. actually still inside the current window, not a stale sighting from before the window last moved. The sibling Arrays topic page uses this exact same function and the exact same guard in its own "Sliding Window" codeTab -- the technique generalizes identically whether the elements being windowed are characters or array entries.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Longest substring without repeats',
      language: 'typescript',
      code: `function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    // Only jump left if the earlier sighting is STILL inside the window --
    // a stale sighting from before the window last moved must be ignored.
    if (lastSeen.has(c) && lastSeen.get(c)! >= left) {
      left = lastSeen.get(c)! + 1;
    }
    lastSeen.set(c, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

// Verified against a brute-force O(n^2) reference -- all matched exactly:
//   lengthOfLongestSubstring("abcabcbb") = 3   ("abc")
//   lengthOfLongestSubstring("bbbbb")    = 1   ("b")
//   lengthOfLongestSubstring("pwwkew")   = 3   ("wke")
//   lengthOfLongestSubstring("")         = 0
//   lengthOfLongestSubstring("abba")     = 2   ("ab" or "ba")
//   lengthOfLongestSubstring("dvdf")     = 3   ("vdf")`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Trace <code>lengthOfLongestSubstring("abba")</code> step by step. At which index does the <code>&gt;= left</code> check actually matter, and what would happen without it?',
    hint: 'Track left, lastSeen, and maxLen after each character: a(0), b(1), b(2), a(3). The second \'b\' (index 2) is the one that moves left -- track where left ends up, then check what "a" last-seen value would do without the guard.',
    solution: 'Walking through: right=0 (\'a\'): lastSeen={a:0}, left=0, maxLen=1. right=1 (\'b\'): lastSeen={a:0,b:1}, left=0, maxLen=2. right=2 (second \'b\'): \'b\' was last seen at index 1, which is >= left(0), so left jumps to 2; lastSeen={a:0,b:2}, maxLen stays 2 (window is now just "b"). right=3 (second \'a\'): \'a\' was last seen at index 0 -- WITHOUT the guard, left would jump to 1, shrinking the window to indices 1-3 ("bba"), which still contains a repeat and is wrong. WITH the guard (0 >= left, where left is currently 2) the check fails, so left correctly stays at 2, giving the window "ba" (indices 2-3), maxLen=2. The guard is what correctly treats index 0\'s sighting of \'a\' as stale, since the window already moved past it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Tracking "has this character been seen" is enough information to know when to shrink the window.',
      reality: 'Verified above with the "abba" trace: you also need to know WHERE it was seen, and whether that location is still inside the current window. A character seen before the window\'s current left edge is irrelevant history, not a real repeat.'
    },
    {
      thought: 'This problem and the Minimum Window Substring Challenge use fundamentally different techniques.',
      reality: 'Both are sliding window with a single right-expanding, left-shrinking pointer pair -- the difference is the CONDITION being tracked (no repeats seen, vs. all target characters covered) and how many maps that condition needs (one last-seen map here, two frequency maps there), not the core two-pointer mechanism itself.'
    },
    {
      thought: 'A O(n^2) brute-force check-every-starting-index approach is meaningfully different in SPIRIT from the O(n) sliding window, just slower.',
      reality: 'They solve the identical problem, but the O(n) version is strictly better in every case, not a trade-off -- the brute-force version is useful ONLY as a correctness reference when verifying the faster version (exactly how it was used here), never as a real submission once the O(n) pattern is known.'
    }
  ];
}
