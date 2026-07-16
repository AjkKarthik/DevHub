import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './lru-cache-on-a-method-keeps-the-instance-alive.html',
  styleUrl: './lru-cache-on-a-method-keeps-the-instance-alive.scss'
})
export class LruCacheOnAMethodKeepsTheInstanceAliveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '@lru_cache on an instance method makes self part of the cache key — and the cache keeps that instance alive',
      points: [
        'The main page\'s own theory introduces @functools.lru_cache purely as a memoization tool ("memoizes a function... use @cache for unbounded cache") without mentioning a real, officially documented pitfall when it\'s applied to a bound instance method rather than a plain function.',
        'Python\'s own functools documentation states plainly: "If a method is cached, the self instance argument is included in the cache" — since self is the first positional argument passed to a bound method, it becomes part of the tuple used as the cache key, exactly the same way any other argument would.',
        'This means the cache dictionary — which lives on the function object itself (defined once at class-definition time, not per-instance) — holds a strong reference to that specific self for as long as the cache entry exists. Python\'s own FAQ ("How do I cache method calls?") confirms directly: this "creates a reference to the instance... instances are kept alive until they age out of the cache or until the cache is cleared." Since the cache lives on the class-level function object, not on any individual instance, it persists for the lifetime of the class/module, not the instance — meaning an instance can be kept alive indefinitely even after every other reference to it is gone, as long as its cache entry remains.',
      ]
    },
    {
      heading: 'What the official docs actually recommend instead',
      points: [
        'Python\'s own FAQ entry doesn\'t just flag the problem — it names the sanctioned alternative directly: functools.cached_property, which the docs describe as storing the cached value per-instance (in the instance\'s own __dict__) rather than in a class-level cache keyed by self — this means it "does not create a reference to the instance" the way lru_cache does, and the cached value is naturally released whenever the instance itself is garbage collected.',
        'cached_property isn\'t a universal drop-in replacement, though — the main page\'s own lru_cache example (@lru_cache(maxsize=None) on a recursive fib(n) function) genuinely needs argument-based caching across different inputs, which cached_property doesn\'t provide (it caches exactly one value per instance, computed once). The choice depends on the shape of the caching need: cached_property for "compute this expensive per-instance value once," lru_cache (accepting the instance-lifetime tradeoff, or using weak references) for "cache results keyed by varying arguments."',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'lru_cache on a method — the instance never gets garbage collected',
      language: 'typescript',
      code: `import functools, gc, weakref

class ExpensiveQuery:
    def __init__(self, db_id):
        self.db_id = db_id

    @functools.lru_cache(maxsize=None)
    def run(self, query):   # self is part of the cache key!
        return f"result for {query} on db {self.db_id}"

obj = ExpensiveQuery(1)
ref = weakref.ref(obj)
obj.run("SELECT 1")     # cache now holds a reference to obj

del obj
gc.collect()
print(ref())   # NOT None — the cache is still holding the instance
               # alive, because self was part of the cached call's key`,
    },
    {
      label: 'The documented fix: cached_property for per-instance caching',
      language: 'typescript',
      code: `import functools

class ExpensiveQuery:
    def __init__(self, db_id):
        self.db_id = db_id

    @functools.cached_property
    def connection_info(self):
        # Computed once, stored in THIS instance's own __dict__ —
        # does not create a reference to the instance from anywhere
        # outside the instance itself.
        return f"connection for db {self.db_id}"

obj = ExpensiveQuery(1)
print(obj.connection_info)   # computed once, cached on obj itself
del obj   # obj is genuinely collectible — nothing external held it

# cached_property is right for "compute once per instance."
# lru_cache is right for "cache by varying arguments" — but if the
# decorated callable is a method, that means accepting the
# instance-lifetime tradeoff, or passing a weak reference explicitly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A class DatabaseConnection wraps a limited pool of connections and decorates an instance method fetch_cached(self, query) with @lru_cache(maxsize=None) to avoid repeated identical queries. Over a long-running process, memory usage keeps growing even though DatabaseConnection instances are created and discarded frequently (each one is meant to be short-lived, replaced when the pool rotates). Explain why, using what this subtopic covers, and describe the fix.',
    hint: 'What does self being the first positional argument of fetch_cached mean for what actually gets stored as part of the lru_cache\'s cache key? Does the cache dictionary live on the DatabaseConnection instance, or somewhere else — and for how long does THAT thing live?',
    solution: 'Memory usage keeps growing because every call to fetch_cached includes self as part of the arguments used to build the lru_cache key — per Python\'s own functools documentation, "if a method is cached, the self instance argument is included in the cache." The cache dictionary itself lives on the fetch_cached function object, which is defined once at class-definition time and persists for the lifetime of the DatabaseConnection class (effectively the whole process), NOT on any individual instance. So every DatabaseConnection instance that ever calls fetch_cached gets a strong reference held in that class-level cache, for as long as its cache entry survives — meaning instances the application believes are "short-lived, replaced when the pool rotates" are actually being kept alive indefinitely by the cache, exactly matching Python\'s own FAQ description of this pattern: "instances are kept alive until they age out of the cache or until the cache is cleared." Since maxsize=None means entries never age out on their own, every instance that has ever called fetch_cached is retained forever, which explains the continuous memory growth. The fix, per Python\'s own documented guidance: either switch to functools.cached_property if the cached value doesn\'t vary by call arguments (storing it on the instance itself, so it\'s released naturally when the instance is), or if argument-varying caching genuinely is needed, explicitly clear the cache when instances are retired (fetch_cached.cache_clear() at the appropriate point), or restructure the cache to key on something other than self directly (e.g., passing relevant instance data as plain arguments to a module-level cached function instead of decorating the method itself).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since @functools.lru_cache is described as a general-purpose memoization decorator on the main page, it is equally safe to apply to any function OR any instance method — the caching mechanism works identically either way with no extra considerations.',
      reality: 'This subtopic\'s theory and first code example both show a real, officially documented difference — applying lru_cache to an instance method makes self part of the cache key, which keeps that specific instance alive for as long as its cache entry exists, a consequence that simply does not apply to lru_cache on a plain, non-method function.'
    },
    {
      thought: 'Once every external reference to an object is deleted (del obj) and garbage collection runs, that object is guaranteed to actually be freed, regardless of what decorators might be involved.',
      reality: 'This subtopic\'s first code example shows the opposite — a weakref.ref() check after del obj and gc.collect() still resolves to the live object, because an lru_cache entry on one of its methods is an ADDITIONAL, easy-to-forget reference the application code never explicitly created or sees.'
    },
    {
      thought: 'functools.cached_property and functools.lru_cache are essentially interchangeable caching decorators — whichever one is more familiar or convenient can be used for either "cache this expensive per-instance value" or "cache results by varying arguments."',
      reality: 'This subtopic\'s theory explains the real, documented distinction — cached_property stores its value per-instance and does not create a reference to the instance from outside it, which is fundamentally different from lru_cache\'s class-level cache keyed by (self, args), and the two are suited to genuinely different caching needs, not freely interchangeable.'
    }
  ];
}
