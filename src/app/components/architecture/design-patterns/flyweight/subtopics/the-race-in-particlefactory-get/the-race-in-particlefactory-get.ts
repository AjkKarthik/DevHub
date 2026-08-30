import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Thread-Safety Note in Prose, a Plain Dictionary in Code',
    points: [
      'The main page\'s own QnA states, about implementing a FlyweightFactory: "In thread-safe environments, ' +
      'synchronize factory access or use ConcurrentDictionary" — one sentence, easy to skim past. The main ' +
      'codeTab\'s <code>ParticleFactory</code> uses a plain <code>Dictionary&lt;string, ParticleType&gt;</code>, ' +
      'which is not safe for concurrent access at all.',
      'This matters specifically BECAUSE Flyweight\'s whole reason for existing is being called from many ' +
      'places sharing the SAME cache — a particle system spawning particles from multiple threads is a ' +
      'completely realistic scenario for the pattern\'s own stated use case (millions of objects, high ' +
      'throughput), not an edge case.',
    ],
  },
  {
    heading: 'What Actually Breaks Under Concurrent Get() Calls',
    points: [
      'Dictionary&lt;TKey,TValue&gt; is explicitly documented as not thread-safe for concurrent writes — two ' +
      'threads both reaching the <code>_cache[key] = pt</code> line for keys that happen to hash into the same ' +
      'internal bucket at the same moment can corrupt the dictionary\'s internal state, in the worst case ' +
      'throwing or silently losing an entry.',
      'Even short of outright corruption, the classic check-then-act race applies here too: two threads can ' +
      'both call <code>TryGetValue</code> for the SAME key, both get a miss, and both proceed to create and ' +
      'store their OWN new <code>ParticleType</code> instance — defeating the entire point of the Flyweight ' +
      'pattern, since two logically-identical particles now reference two DIFFERENT flyweight objects instead ' +
      'of sharing one.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — Plain Dictionary, Two Ways to Break',
    language: 'csharp',
    code: `public sealed class ParticleFactory
{
    private readonly Dictionary<string, ParticleType> _cache = new();

    public ParticleType Get(string texture, string color, string shape)
    {
        var key = $"{texture}|{color}|{shape}";
        if (!_cache.TryGetValue(key, out var pt))
        {
            // Two threads can BOTH reach here for the same key —
            // both see a miss, both create their own instance,
            // and the second write can also corrupt a Dictionary
            // under true concurrent access.
            pt = new ParticleType(texture, color, shape);
            _cache[key] = pt;
        }
        return pt;
    }
}`,
  },
  {
    label: 'After — ConcurrentDictionary.GetOrAdd',
    language: 'csharp',
    code: `public sealed class ParticleFactory
{
    private readonly ConcurrentDictionary<string, ParticleType> _cache = new();

    public ParticleType Get(string texture, string color, string shape)
    {
        var key = $"{texture}|{color}|{shape}";

        // GetOrAdd is atomic for WHICH VALUE ENDS UP STORED — every caller
        // is guaranteed to receive the SAME ParticleType instance for a
        // given key, closing the sharing-defeating race above.
        return _cache.GetOrAdd(key, _ => new ParticleType(texture, color, shape));
    }
}

// One real subtlety worth knowing: under contention, the factory delegate
// (_ => new ParticleType(...)) CAN run more than once — if two threads race
// on a genuinely new key, both MAY construct a ParticleType, but only ONE
// of those instances is actually stored and returned to every caller. The
// "extra" instance is simply discarded, unused and ungathered by anyone —
// harmless here since ParticleType's constructor has no side effects, but
// worth knowing if a flyweight's own constructor ever does something
// expensive or externally visible.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes fixing the race with <code>lock (_cache) { ... }</code> wrapped around the entire ' +
    'body of <code>Get()</code>, keeping the plain <code>Dictionary</code>. Would this actually fix the bug? ' +
    'What does it cost compared to the <code>ConcurrentDictionary</code> version?',
  hint:
    'A single lock around the whole method body does serialize every call — think about what that means for ' +
    'a particle system spawning from MULTIPLE threads at once, especially once the cache is already warm.',
  solution:
    'Yes, a lock around the whole method body would fix the correctness bug — only one thread can be inside ' +
    'Get() at a time, so the check-then-act race and the Dictionary corruption risk both disappear. The cost ' +
    'is that EVERY call to Get() — even two calls for two DIFFERENT, already-cached keys that have nothing to ' +
    'do with each other — now serializes behind the same lock, turning what should be a highly-parallel, ' +
    'read-mostly cache lookup (the whole point of caching flyweights is that most calls after warmup are pure ' +
    'reads) into a bottleneck. ConcurrentDictionary is specifically designed to let uncontended reads and ' +
    'lookups for DIFFERENT keys proceed without blocking each other, only synchronizing the narrow moment a ' +
    'genuinely new key is being added — a meaningfully better fit for a cache that is read far more often ' +
    'than it is written to, which is exactly the FlyweightFactory\'s own access pattern once warmed up.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the main page\'s own particle-spawning loop is single-threaded (a plain for loop), the ' +
      'Dictionary-based factory shown is already correct for its own example.',
    reality:
      'The SPECIFIC loop shown is single-threaded, which is why the bug never surfaces in that exact demo — ' +
      'but the whole reason Flyweight exists (supporting large numbers of objects efficiently) is exactly the ' +
      'kind of workload that gets parallelized in real systems (spawning particles across multiple worker ' +
      'threads, or a game engine processing several subsystems concurrently). The FIX matters for how the ' +
      'pattern gets used beyond this one illustrative loop, not for the loop itself.',
  },
  {
    thought: 'ConcurrentDictionary.GetOrAdd() guarantees the factory delegate runs exactly once per key.',
    reality:
      'It guarantees exactly one VALUE is stored and returned to every caller for a given key — it does NOT ' +
      'guarantee the factory delegate itself only ever runs once under contention. Two threads racing on a ' +
      'brand-new key can both invoke the delegate; only one of the two resulting objects is kept. This is ' +
      'harmless for a side-effect-free constructor like ParticleType\'s, but is a real correctness concern if ' +
      'a flyweight\'s own construction has side effects (e.g. incrementing a shared counter, writing a log).',
  },
];

@Component({
  selector: 'app-flyweight-the-race-in-particlefactory-get',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-race-in-particlefactory-get.html',
  styleUrl: './the-race-in-particlefactory-get.scss',
})
export class TheRaceInParticlefactoryGetSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
