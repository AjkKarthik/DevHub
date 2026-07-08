import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-getorset-falsy-trap-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-getorset-avoids-the-falsy-value-cache-trap.html',
  styleUrl: './testing-that-getorset-avoids-the-falsy-value-cache-trap.scss',
})
export class TestingThatGetorsetAvoidsTheFalsyValueCacheTrapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge Solution\'s getOrSet',
      points: [
        'The Challenge solution implements <code>getOrSet&lt;K&gt;(key, factory) { if (this.has(key)) return this.get(key) as TMap[K]; const value = factory(); this.set(key, value); return value; }</code>, checking presence with <code>has(key)</code> — itself implemented as <code>this.store.has(key)</code> on a <code>Map</code> — rather than checking the truthiness of the cached value.',
        'That distinction is easy to skim past, but it is exactly what separates a correct cache from a classic, very common cache bug. This subtopic tests it directly: store a legitimately falsy value (like <code>0</code>) in the cache, then call <code>getOrSet</code> for that same key and confirm the factory is NOT invoked a second time.',
      ],
    },
    {
      heading: 'The Falsy-Value Cache Bug This Avoids',
      points: [
        'A very common, very tempting alternative implementation reads: <code>getOrSet(key, factory) { const cached = this.get(key); if (cached) return cached; ... }</code> — using the VALUE\'s truthiness as the "is it cached" check instead of asking the underlying <code>Map</code> whether the key exists. This looks equivalent for most test cases, until the legitimately cached value happens to be falsy: <code>0</code>, <code>\'\'</code>, <code>false</code>, or <code>NaN</code>.',
        'For those falsy-but-genuinely-cached values, the truthiness-based check would treat them as "not cached" and call <code>factory()</code> again — silently discarding a real cache hit and, worse, potentially producing a DIFFERENT value each time if the factory is not pure (e.g. a counter, a timestamp, or a random ID generator).',
        '<code>Map.prototype.has(key)</code> checks KEY PRESENCE, not value truthiness — it correctly returns <code>true</code> for a key mapped to <code>0</code>, <code>false</code>, or any other falsy value. This is precisely why the challenge solution\'s choice to check <code>has(key)</code> rather than the value itself is not a stylistic detail — it is the one line standing between this cache and the falsy-value bug.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>getOrSet and the falsy-value cache trap</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The main page's own Cache<TMap> challenge solution, unchanged
class Cache<TMap extends Record<string, unknown>> {
  private store = new Map<keyof TMap, TMap[keyof TMap]>();

  get<K extends keyof TMap>(key: K): TMap[K] | undefined {
    return this.store.get(key) as TMap[K] | undefined;
  }
  set<K extends keyof TMap>(key: K, value: TMap[K]): void {
    this.store.set(key, value);
  }
  has(key: keyof TMap): boolean {
    return this.store.has(key);
  }
  getOrSet<K extends keyof TMap>(key: K, factory: () => TMap[K]): TMap[K] {
    if (this.has(key)) return this.get(key) as TMap[K];
    const value = factory();
    this.set(key, value);
    return value;
  }
}

type Counters = { retries: number };
const cache = new Cache<Counters>();

let factoryCalls = 0;
function factory(): number {
  factoryCalls++;
  return 999; // a clearly-wrong "fresh" value, to make a cache miss obvious
}

// Store a genuinely falsy value directly (not through the factory)
cache.set('retries', 0);

// Now ask getOrSet for the same key -- does it respect the cached 0,
// or does it treat 0 as "nothing cached" and call the factory again?
const result = cache.getOrSet('retries', factory);

console.log('result:', result);                 // expect 0 (the cached value)
console.log('factory was called:', factoryCalls > 0); // expect false

// Compare against a naive, truthiness-based alternative implementation
class NaiveCache<TMap extends Record<string, unknown>> {
  private store = new Map<keyof TMap, TMap[keyof TMap]>();
  get<K extends keyof TMap>(key: K) { return this.store.get(key) as TMap[K] | undefined; }
  set<K extends keyof TMap>(key: K, value: TMap[K]) { this.store.set(key, value); }
  getOrSet<K extends keyof TMap>(key: K, factory: () => TMap[K]): TMap[K] {
    const cached = this.get(key);
    if (cached) return cached;           // BUG: truthiness check, not has()
    const value = factory();
    this.set(key, value);
    return value;
  }
}
const naive = new NaiveCache<Counters>();
naive.set('retries', 0);
let naiveFactoryCalls = 0;
function naiveFactory(): number { naiveFactoryCalls++; return 999; }
const naiveResult = naive.getOrSet('retries', naiveFactory);
console.log('naive result:', naiveResult);                       // 999 -- wrong!
console.log('naive factory was called:', naiveFactoryCalls > 0); // true -- the bug
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the cached value from `0` to `\'\'` (empty string) in both the main Cache and NaiveCache demos (you\'ll need a `type Counters = { retries: string }` and matching factories). Does the same pattern hold?',
    hint: 'Empty string is falsy in JavaScript, just like 0 -- the same has()-vs-truthiness distinction applies to any falsy value, not just numbers.',
    solution: `Yes -- the exact same pattern holds. cache.set('retries', '') followed
by cache.getOrSet('retries', factory) still correctly returns '' and
never calls the factory, because has() only checks whether the key
exists in the Map, regardless of what value it maps to.

The NaiveCache version still incorrectly treats '' as "not cached"
(since '' is falsy) and calls the factory again, overwriting the
real cached empty string with the factory's return value.

This generalizes to every JavaScript falsy value: 0, '', false,
NaN, and (if TMap allowed it) null -- any of these, once genuinely
cached, would be silently discarded and re-computed by a
truthiness-based getOrSet, but correctly preserved by a
has()-based one.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'checking `if (this.get(key))` and checking `if (this.has(key))` are two equivalent ways to ask "is this key already cached?"',
      reality: '`this.get(key)` truthiness fails for any falsy-but-genuinely-cached value (`0`, `\'\'`, `false`, `NaN`) — `this.has(key)` correctly checks key presence in the underlying Map regardless of what value is stored there.',
    },
    {
      thought: 'a cache bug that only affects falsy values like `0` or `\'\'` is a minor edge case not worth designing around.',
      reality: 'falsy-but-valid cache values are extremely common in practice — counters starting at 0, empty-string form fields, boolean flags defaulting to false — making this one of the more frequently-hit real-world cache bugs, not a rare corner case.',
    },
    {
      thought: 'the main page\'s Cache challenge solution using `has(key)` instead of checking the value\'s truthiness is just a stylistic preference between two equally-correct approaches.',
      reality: 'it is the specific implementation choice that determines whether the cache is correct for falsy values at all — the "naive" truthiness-based alternative is a genuinely different, buggier implementation, not an equivalent rewording.',
    },
  ];
}
