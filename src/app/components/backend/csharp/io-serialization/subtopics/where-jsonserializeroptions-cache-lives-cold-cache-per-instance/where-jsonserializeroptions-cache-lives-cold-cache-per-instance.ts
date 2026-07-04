import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-where-jsonserializeroptions-cache-lives-cold-cache-per-instance-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './where-jsonserializeroptions-cache-lives-cold-cache-per-instance.html',
  styleUrl: './where-jsonserializeroptions-cache-lives-cold-cache-per-instance.scss',
})
export class WhereJsonserializeroptionsCacheLivesColdCachePerInstanceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake asserts the cache exists — this is exactly where it actually lives',
      points: [
        'The main I/O & Serialization page states that creating a new <code>JsonSerializerOptions</code> per call "rebuilds the reflection cache every time." The precise mechanism: each <code>JsonSerializerOptions</code> INSTANCE owns its own internal <code>JsonTypeInfo</code> cache — a dictionary mapping each involved <code>Type</code> to its pre-computed serialization metadata (property accessors, converter selection, naming policy results). This cache is a field ON the options object itself, not a process-wide static cache shared across all instances.',
      ],
    },
    {
      heading: 'This is why TWO instances with IDENTICAL settings still do NOT share a cache',
      points: [
        'Two separate <code>JsonSerializerOptions</code> instances, even when constructed with byte-for-byte identical property settings (same <code>PropertyNamingPolicy</code>, same <code>WriteIndented</code>, etc.), are still two SEPARATE objects with two separate, independently-populated <code>JsonTypeInfo</code> caches. The runtime has no way to recognize "these two options objects are equivalent" and share the cache between them — cache identity is tied to OPTIONS INSTANCE identity, not options VALUE equality.',
        'This means the main page\'s own fix (a <code>static readonly JsonSerializerOptions</code> field) works specifically because it guarantees the SAME instance — and therefore the SAME cache — is reused across every call, not because the settings happen to be identical each time.',
      ],
    },
    {
      heading: 'The cache is populated lazily, per type, on first use — not eagerly at construction',
      points: [
        'Constructing a <code>JsonSerializerOptions</code> instance does NOT immediately populate its cache for every type your program might ever serialize — the cache entry for a given <code>Type</code> is built lazily, the FIRST time that specific type is actually serialized or deserialized through THAT options instance. This is why the very first call to <code>Serialize&lt;Product&gt;(p, opts)</code> on a freshly-created <code>opts</code> is measurably slower than the second call with the SAME <code>opts</code> instance — the second call hits the now-populated cache.',
        'JSON source generation (the main page\'s own later section) sidesteps this lazy, first-call cost entirely — the <code>JsonTypeInfo</code> for every <code>[JsonSerializable]</code> type is generated and baked in at COMPILE time, so there is no "first call is slower" warm-up cost at all, for any instance of the generated context.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two instances with identical settings still have separate, independent caches',
      language: 'csharp',
      code: `var opts1 = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
var opts2 = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

// opts1 and opts2 have IDENTICAL settings — but they are two separate
// objects, each with its OWN internal JsonTypeInfo cache dictionary.
// Populating opts1's cache for Product does NOT populate opts2's cache
// for Product, even though the settings match exactly:

var p = new Product(1, "Keyboard", 79.99m, true, null);

JsonSerializer.Serialize(p, opts1); // opts1's cache: Product entry created
JsonSerializer.Serialize(p, opts2); // opts2's cache: Product entry created
                                     // AGAIN, independently — opts1's work
                                     // is not reused here at all`,
    },
    {
      label: 'The cache is lazy — the first call for a given type is slower than the second',
      language: 'csharp',
      code: `var opts = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
var p = new Product(1, "Keyboard", 79.99m, true, null);

var sw = System.Diagnostics.Stopwatch.StartNew();
JsonSerializer.Serialize(p, opts);       // FIRST call for Product on THIS
                                          // options instance — builds and
                                          // caches JsonTypeInfo<Product>
Console.WriteLine($"First:  {sw.ElapsedTicks} ticks");

sw.Restart();
JsonSerializer.Serialize(p, opts);       // SECOND call — hits the now-
                                          // populated cache on "opts",
                                          // measurably faster
Console.WriteLine($"Second: {sw.ElapsedTicks} ticks");

// A brand-new options instance pays the "first call" cost again, even
// for the SAME type Product, because its cache starts empty:
var freshOpts = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
sw.Restart();
JsonSerializer.Serialize(p, freshOpts);  // slow again — new instance,
                                          // new (empty) cache
Console.WriteLine($"Fresh:  {sw.ElapsedTicks} ticks");`,
    },
    {
      label: 'Source generation eliminates the lazy first-call cost entirely',
      language: 'csharp',
      code: `[JsonSerializable(typeof(Product))]
internal partial class AppJsonContext : JsonSerializerContext { }

var p = new Product(1, "Keyboard", 79.99m, true, null);

// AppJsonContext.Default.Product is a JsonTypeInfo<Product> generated
// and fully populated at COMPILE TIME — there is no "cold cache, first
// call is slower" behavior here at all, because there is no runtime
// reflection step to defer in the first place:
JsonSerializer.Serialize(p, AppJsonContext.Default.Product); // no warm-up cost

// Contrast with the reflection-based JsonSerializerOptions singleton —
// STILL the right fix for the main page's own common mistake, but it
// only avoids REPEATED cold caches across calls; it does not avoid the
// one-time cost of populating the cache on its very first use, the way
// source generation does by moving that work to compile time instead.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A method creates a fresh <code>JsonSerializerOptions</code> instance ONCE at startup and stores it in a static field, then calls <code>Serialize&lt;Order&gt;</code> and <code>Serialize&lt;Product&gt;</code> through it many times across the app\'s lifetime. Which calls pay the "cold cache" cost, and how many times?',
    hint: 'The cache is per-TYPE, per-OPTIONS-INSTANCE, populated lazily on first use of each type through that specific instance. Consider how many distinct (Type, instance) pairs exist here.',
    solution: `private static readonly JsonSerializerOptions _opts = new()
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
};

// Across the app's entire lifetime, using this SAME "_opts" instance:

JsonSerializer.Serialize(order1, _opts);    // FIRST call for Order on
                                             // _opts — cold, builds cache
                                             // entry for Order

JsonSerializer.Serialize(order2, _opts);    // SECOND call for Order on
                                             // _opts — warm, reuses the
                                             // Order cache entry

JsonSerializer.Serialize(product1, _opts);  // FIRST call for Product on
                                             // _opts — cold, builds a
                                             // SEPARATE cache entry for
                                             // Product (Order's entry
                                             // does not help here)

JsonSerializer.Serialize(product2, _opts);  // SECOND call for Product —
                                             // warm, reuses Product's entry

// Total cold-cache hits: exactly 2 — one for Order, one for Product —
// each occurring exactly ONCE, on the first time THAT type is used
// through THIS options instance. Every subsequent call for either type,
// through the SAME instance, is warm. This is precisely why using a
// single static instance (rather than a fresh one per call) bounds the
// total number of cold-cache hits to "one per distinct type ever used,"
// instead of "one per call, forever."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'two JsonSerializerOptions instances with identical property settings share the same reflection cache, since the settings are equivalent.',
      reality: 'the cache lives on each options INSTANCE individually — two instances with byte-for-byte identical settings still have two completely separate, independently-populated caches, because cache sharing is tied to instance identity, not value equality.',
    },
    {
      thought: 'constructing a JsonSerializerOptions object immediately builds the reflection cache for every type your application will ever serialize.',
      reality: 'the cache is populated lazily, one type at a time, only the first time that specific type is actually used through that specific options instance — construction itself does no upfront reflection work.',
    },
    {
      thought: 'using a static readonly JsonSerializerOptions singleton eliminates ALL reflection-based cache-building cost, the same way source generation does.',
      reality: 'a singleton only avoids REPEATED cold caches across many calls — it still pays the one-time lazy cache-building cost the first time each type is used through it; source generation is the only approach that removes that cost entirely, by moving the work to compile time.',
    },
  ];
}
