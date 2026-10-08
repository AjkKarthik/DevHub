import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-hash-first-nonrepeat',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './first-non-repeating-character-two-ways.html',
  styleUrl: './first-non-repeating-character-two-ways.scss'
})
export class FirstNonRepeatingCharacterTwoWaysSubtopic {
  topicLabel = 'Hash Tables';
  topicRoute = '/dsa/hash-tables';

  theory: TheoryPoint[] = [
    {
      heading: 'Two Approaches Named in the QnA, Neither Shown in Code',
      points: [
        'The main page\'s own QnA describes two approaches for finding the first non-repeating character: a two-pass version (count frequencies, then scan the string again for the first count-of-1 character) and "an alternative: single-pass using an ordered map or LinkedHashMap that preserves insertion order" -- neither appears in any codeTab on the page.',
        'Both approaches share the exact same first step (build a frequency map, one pass over the string) -- the difference is entirely in HOW they find the answer afterward: the two-pass version scans the original STRING a second time; the "single-pass" version instead iterates the frequency MAP\'s own entries, relying on the fact (already correctly stated earlier on this same page) that JavaScript\'s Map preserves insertion order.',
        'Verified directly across six test strings (including inputs with no non-repeating character at all, and a single-character string) that both approaches return byte-identical results every time -- they are two equally correct implementations of the same specification, not competing algorithms with different answers.'
      ]
    },
    {
      heading: 'What "Single-Pass" Actually Means Here',
      points: [
        'The map-iteration version is single-pass specifically OVER THE ORIGINAL STRING -- its first loop visits each of the n characters exactly once, and its second loop only visits the map\'s DISTINCT keys, which is bounded by the alphabet size (at most 26 for lowercase English letters, far smaller than n for a long string with many repeats).',
        'This genuinely saves re-reading the (potentially much longer) original string a second time, which matters more the longer the string is relative to its alphabet -- for a short string with a small alphabet, the practical difference between the two approaches is negligible, since both are O(n) overall either way.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two-pass vs. single-pass, verified identical',
      language: 'typescript',
      code: `// Two-pass: build frequency map, then scan the ORIGINAL STRING again.
function firstNonRepeatingTwoPass(s: string): string | null {
  const freq = new Map<string, number>();
  for (const c of s) freq.set(c, (freq.get(c) ?? 0) + 1);
  for (const c of s) if (freq.get(c) === 1) return c;
  return null;
}

// Single-pass over the string: build the SAME frequency map, then scan
// the MAP's own entries (bounded by alphabet size) instead of the string.
function firstNonRepeatingSinglePass(s: string): string | null {
  const freq = new Map<string, number>();
  for (const c of s) freq.set(c, (freq.get(c) ?? 0) + 1);
  for (const [c, count] of freq) if (count === 1) return c; // relies on Map's insertion order
  return null;
}

// Actual measured output -- both approaches matched exactly, every time:
//   firstNonRepeatingTwoPass("leetcode")      = "l"  (and singlePass agrees)
//   firstNonRepeatingTwoPass("loveleetcode")  = "v"  (and singlePass agrees)
//   firstNonRepeatingTwoPass("aabb")          = null (and singlePass agrees)
//   firstNonRepeatingTwoPass("z")             = "z"  (and singlePass agrees)
//   firstNonRepeatingTwoPass("aabbcc")        = null (and singlePass agrees)
//   firstNonRepeatingTwoPass("abcabcde")      = "d"  (and singlePass agrees)`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Both approaches rely on building a frequency map with Map, which preserves insertion order. Would EITHER approach still give the correct answer if a plain pre-ES2015 object (<code>{}</code>) were used instead of a Map for the frequency counts?',
    hint: 'Think about which approach actually DEPENDS on insertion order being preserved, versus which one only uses the frequency structure as a lookup table.',
    solution: 'The two-pass version would still work correctly with a plain object, since it never iterates the frequency structure\'s own keys in any order at all -- it only ever uses it as a lookup table (<code>freq[c]</code>) while re-scanning the ORIGINAL string, whose order is unaffected by the frequency structure\'s implementation. The single-pass version, however, specifically depends on iterating the frequency structure in the SAME order the characters were first encountered -- modern JavaScript objects do actually preserve insertion order for string keys in practice (as of ES2015\'s property-order guarantees), so this would likely still work today, but relying on that is more fragile and less universally guaranteed across all object-like structures (and definitely not guaranteed for genuinely numeric-like string keys, which JS objects always iterate in ascending numeric order regardless of insertion) than explicitly using a Map, which guarantees it unconditionally for every key type.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The "single-pass" approach is a strictly faster algorithm than the two-pass version.',
      reality: 'Both are O(n) time overall -- the single-pass version\'s second loop over the map saves re-reading the original string, but that second loop is already bounded by alphabet size in BOTH versions\' first pass. The practical speed difference is a constant-factor one, not a complexity-class one, and for a short string it is negligible either way.'
    },
    {
      thought: 'Relying on Map\'s insertion-order guarantee is a clever trick specific to this one problem.',
      reality: 'It is a general, well-documented property of JavaScript\'s Map (and, separately, of plain objects for string keys since ES2015) that applies anywhere iteration order matters -- grouping, deduplication while preserving first-seen order, and this exact "first X satisfying a condition" pattern all lean on the same guarantee.'
    },
    {
      thought: 'Since both approaches give the same answer on every test here, there is no real reason to prefer one over the other.',
      reality: 'For a SHORT string, true -- but the single-pass version\'s advantage grows precisely when the string is long relative to its alphabet (e.g. a long DNA sequence over a 4-letter alphabet, or a long log line over ASCII) specifically because the second loop stays bounded by alphabet size while the two-pass version\'s second loop grows with the string itself.'
    }
  ];
}
