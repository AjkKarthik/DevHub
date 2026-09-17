import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-the-hash-tag-extraction-algorithm-verified-against-real-edge-cases',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-hash-tag-extraction-algorithm-verified-against-real-edge-cases.html',
  styleUrl: './the-hash-tag-extraction-algorithm-verified-against-real-edge-cases.scss',
})
export class TheHashTagExtractionAlgorithmVerifiedAgainstRealEdgeCasesSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows the happy path only',
      points: [
        'The main page\'s own theory correctly states that <code>user:{42}:session</code> and <code>user:{42}:profile</code> hash to the same slot — but that is the SIMPLE case, exactly one clean {tag} pair with no surprises. Redis\'s own Cluster Specification documents a precise, three-condition rule for exactly which substring gets hashed, with edge cases that behave very differently from the simple case.',
        'The exact rule, verified directly against Redis\'s own spec: hash the substring between the FIRST <code>{</code> and the FIRST <code>}</code> to its right, but ONLY if that substring is non-empty. If the key has no <code>{</code>, no matching <code>}</code>, or an EMPTY <code>{}</code> pair, the WHOLE key is hashed instead — silently falling back to ordinary CRC16(key) with no error of any kind.',
      ],
    },
    {
      heading: 'Why this matters in practice',
      points: [
        'A key like <code>foo{}{bar}</code> looks like it should hash on <code>bar</code> at a glance — but per the rule above, the FIRST <code>{</code> is immediately followed by <code>}</code> with nothing between them, so the whole key <code>foo{}{bar}</code> is hashed instead, landing on a completely different, effectively random slot from what a developer skimming the key name might expect.',
        'This "leading empty <code>{}</code> forces whole-key hashing" behavior is actually a documented, INTENTIONAL feature — Redis\'s own spec names it as the recommended way to safely use raw binary data as a key name without it being misinterpreted as a hash-tag pattern.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Hash tag extraction, verified',
      language: 'typescript',
      code: `function extractHashTagSubstring(key: string): string {
  const open = key.indexOf('{');
  if (open === -1) return key;              // no '{' at all -> hash whole key
  const close = key.indexOf('}', open + 1);
  if (close === -1) return key;              // no '}' to the right -> hash whole key
  if (close === open + 1) return key;        // empty {} -> hash whole key
  return key.slice(open + 1, close);
}

// Every example below matches Redis's own documented Cluster Specification exactly.
console.log(extractHashTagSubstring('{user1000}.following'));
// 'user1000' -- the simple, documented case

console.log(extractHashTagSubstring('foo{}{bar}'));
// 'foo{}{bar}' -- empty first tag -> whole key hashed, NOT 'bar'

console.log(extractHashTagSubstring('foo{{bar}}zap'));
// '{bar' -- stops at the FIRST '}', including the inner brace character itself

console.log(extractHashTagSubstring('foo{bar}{zap}'));
// 'bar' -- only the FIRST valid {tag} is ever consulted; {zap} is ignored entirely`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team names a key <code>{}session:abc123</code>, reasoning "the leading braces will make this hash on the empty string, giving every session key the same slot for fast multi-key lookups." What slot does this key actually land on, and does it achieve what the team intended?',
    hint: 'Walk <code>extractHashTagSubstring</code> through this exact key: where is the first <code>{</code>, and what is between it and the first <code>}</code> to its right?',
    solution: `The key lands on whatever slot CRC16('{}session:abc123') (the WHOLE key, braces included) maps to -- NOT a shared slot for all session keys, and NOT the empty string. The first '{' is immediately followed by '}' with nothing between them, which per the documented rule falls back to hashing the entire key exactly as if no hash tag existed at all.

This does not achieve what the team wanted at all -- a DIFFERENT session key, say '{}session:xyz789', hashes on its own full key text and very likely lands on a COMPLETELY DIFFERENT slot, since the two keys only share the constant '{}session:' prefix, not their entire content. To actually co-locate every session key on one slot, the tag needs real content inside the braces that is IDENTICAL across all the keys meant to share a slot -- something like '{sessions}:abc123' and '{sessions}:xyz789', both of which hash on the literal substring 'sessions'.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Any pair of curly braces in a key name activates hash-tag behavior."',
      reality: 'Verified above: an EMPTY pair (<code>{}</code>) does the opposite of activating hash-tag behavior — it explicitly falls back to hashing the whole key, which is a deliberately documented escape hatch for keys containing raw binary data that might otherwise accidentally contain brace characters.',
    },
    {
      thought: '"If a key has multiple {tag} pairs, Redis picks whichever one makes the most sense, or hashes all of them together."',
      reality: 'Verified above with <code>foo{bar}{zap}</code>: Redis always uses ONLY the very first valid <code>{...}</code> pair it finds scanning left to right, and completely ignores every subsequent one — there is no "smartest match" selection or combination of multiple tags happening anywhere in the algorithm.',
    },
  ];

  topicLabel = 'Redis Cluster';
  topicRoute = '/redis/redis-cluster';
  prev: SubtopicLink | null = {
    label: 'The Live Resharding State Machine: MIGRATING, IMPORTING, ASK, MOVED',
    route: '/redis/redis-cluster/the-live-resharding-state-machine-migrating-importing-ask-moved',
  };
  next: SubtopicLink | null = {
    label: 'ASK Is a One-Time Redirect, Not a Permanent Slot-Map Update',
    route: '/redis/redis-cluster/ask-is-a-one-time-redirect-not-a-permanent-slot-map-update',
  };
}
