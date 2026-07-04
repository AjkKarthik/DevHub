import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-records-as-dictionary-keys-break-when-reference-property-mutated-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './records-as-dictionary-keys-break-when-reference-property-mutated.html',
  styleUrl: './records-as-dictionary-keys-break-when-reference-property-mutated.scss',
})
export class RecordsAsDictionaryKeysBreakWhenReferencePropertyMutatedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"Records are immutable, so they\'re safe as Dictionary keys" is a natural but incomplete assumption — the main page\'s own with-expression content hints at exactly why',
      points: [
        'Records are commonly reached for as <code>Dictionary&lt;TKey, TValue&gt;</code> keys precisely BECAUSE their <code>init</code>-only properties feel immutable, and immutable keys are the textbook-safe choice — a key\'s hash code must never change while it is stored in the dictionary, or lookups silently fail. The main page\'s own "with-expressions through hierarchy" and "shallow copy" content already establishes the crucial exception: a record\'s <code>init</code>-only property CANNOT be reassigned, but if that property is a REFERENCE to a genuinely mutable object (a <code>List&lt;T&gt;</code>, a mutable class instance), the record itself never changes, yet the OBJECT it references can still be mutated through that same reference from anywhere else in the program.',
      ],
    },
    {
      heading: 'The record\'s GetHashCode() is computed from its properties\' CURRENT values at hash-time — mutating a referenced object changes the hash the record would now produce, without changing the record\'s OWN identity at all',
      points: [
        'If a record\'s primary-constructor property is a mutable reference type (say, <code>List&lt;string&gt; Tags</code>), the compiler-generated <code>GetHashCode()</code> includes that property\'s OWN <code>GetHashCode()</code> in the combined hash — and <code>List&lt;T&gt;</code>, having no structural equality, actually uses OBJECT IDENTITY hash (from <code>object.GetHashCode()</code>) rather than content, so mutating the list\'s CONTENTS technically does not change List&lt;T&gt;\'s own hash code in THIS specific case — but if the reference-typed property is instead a MUTABLE record, a plain class with an overridden <code>GetHashCode()</code>, or any type whose hash code legitimately depends on its current field values, mutating that nested object AFTER the outer record was inserted as a dictionary key silently invalidates the dictionary\'s internal bucket placement for that key.',
        'Once a key\'s effective hash code changes after insertion (via a nested mutable object\'s state changing), the dictionary\'s internal hash table still has the entry filed under the OLD hash bucket — but any lookup for that same logical key now computes the NEW hash and searches the WRONG bucket, meaning <code>dictionary[key]</code>, <code>dictionary.TryGetValue(key, ...)</code>, and even <code>dictionary.ContainsKey(key)</code> can all silently report "not found" for an entry that IS still physically present in the dictionary\'s internal storage — a genuinely confusing, hard-to-diagnose class of bug.',
      ],
    },
    {
      heading: 'The fix mirrors the main page\'s own List&lt;T&gt;-equality-trap recommendation: nested properties used in equality/hashing must themselves be genuinely immutable',
      points: [
        'Using a genuinely immutable nested type — another <code>record</code> (which is immutable via <code>init</code>, recursively, all the way down) or an <code>ImmutableArray&lt;T&gt;</code>/<code>ImmutableList&lt;T&gt;</code> for collection-shaped properties — ensures that ONCE a record is constructed, EVERY property reachable from it, transitively, is genuinely frozen, and its hash code (and equality) can never silently drift out from under a dictionary that is relying on it as a key.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — a record with a mutable nested class used as a Dictionary key',
      language: 'csharp',
      code: `// A mutable class — NOT a record, has its own value-based GetHashCode:
public class TagSet
{
    public List<string> Tags { get; set; } = new();

    public override int GetHashCode() =>
        Tags.Aggregate(17, (h, t) => h * 31 + t.GetHashCode());

    public override bool Equals(object? obj) =>
        obj is TagSet other && Tags.SequenceEqual(other.Tags);
}

// The record itself has init-only properties — LOOKS immutable:
public record Document(int Id, TagSet Tags);

var tags = new TagSet();
tags.Tags.Add("draft");

var doc = new Document(1, tags);

var cache = new Dictionary<Document, string>();
cache[doc] = "Draft content";   // inserted using doc's CURRENT hash,
                                // which depends on tags.Tags containing
                                // just ["draft"] right now

// LATER, elsewhere in the program, the SAME underlying TagSet object
// is mutated — the Document record's OWN init-only properties never
// changed (doc.Tags still refers to the SAME TagSet reference it
// always did), but the OBJECT that reference points to has:
tags.Tags.Add("published");   // mutates the SHARED TagSet instance

// The dictionary lookup now computes a DIFFERENT hash for "doc" than
// the one it was originally inserted under:
bool found = cache.TryGetValue(doc, out var content);
Console.WriteLine(found);   // False! — even though "doc" is the exact
                             // SAME object reference used at insertion,
                             // and even though the entry IS still
                             // physically present somewhere in the
                             // dictionary's internal hash table`,
    },
    {
      label: 'The fix — make every property reachable from the key genuinely immutable',
      language: 'csharp',
      code: `// Use ANOTHER record for the nested type — records are immutable via
// init, so nothing reachable from Document can ever mutate post-construction:
public record TagSetFixed(ImmutableArray<string> Tags);

public record DocumentFixed(int Id, TagSetFixed Tags);

var tagsFixed = new TagSetFixed(["draft"]);
var docFixed  = new DocumentFixed(1, tagsFixed);

var cacheFixed = new Dictionary<DocumentFixed, string>();
cacheFixed[docFixed] = "Draft content";

// To "add" a tag, you MUST create a genuinely NEW TagSetFixed (and
// therefore a new DocumentFixed) — there is no way to mutate the
// EXISTING one, since ImmutableArray<T> and record's init properties
// give NO mutation path at all:
var docWithPublished = docFixed with
{
    Tags = docFixed.Tags with { Tags = docFixed.Tags.Tags.Add("published") }
};

// The ORIGINAL docFixed (and its hash code) is untouched — it remains
// findable in cacheFixed exactly as inserted, forever, because nothing
// reachable from it can EVER change after construction:
bool foundFixed = cacheFixed.TryGetValue(docFixed, out var contentFixed);
Console.WriteLine(foundFixed);   // True — reliably, always`,
    },
    {
      label: 'Why List<T> specifically (versus a hash-by-content class) partially masks this in practice',
      language: 'csharp',
      code: `// This is a genuinely important nuance: List<T> ITSELF, having NO
// structural equality (per the main page's own gotcha), also has NO
// structural GetHashCode — it uses plain OBJECT IDENTITY hash code
// (inherited from object), which does NOT change when the list's
// CONTENTS are mutated:
public record DocumentWithPlainList(int Id, List<string> Tags);

var tags2 = new List<string> { "draft" };
var doc2  = new DocumentWithPlainList(1, tags2);

var cache2 = new Dictionary<DocumentWithPlainList, string>();
cache2[doc2] = "Draft content";

tags2.Add("published");   // mutates the list's CONTENTS

// This STILL WORKS — because List<T>'s hash code (object identity)
// never changed, even though its CONTENTS did:
bool stillFound = cache2.TryGetValue(doc2, out var content2);
Console.WriteLine(stillFound);   // True — List<T>'s reference-identity
                                 // hash happens to "accidentally" survive
                                 // content mutation, UNLIKE the TagSet
                                 // class example (which explicitly
                                 // overrides GetHashCode based on content)

// This is NOT a reason to feel safe using List<T> in a dictionary-key
// record deliberately — it means EQUALITY is broken in the OPPOSITE
// direction instead (per the main page's own gotcha: two records with
// separately-constructed-but-equal-content lists are NOT equal) — the
// GENUINE fix, either way, is a nested type that is BOTH structurally
// equal AND has a hash code that cannot change post-construction:
// an immutable collection type, or another record, all the way down.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team caches computed results in a <code>Dictionary&lt;CacheKey, Result&gt;</code> where <code>record CacheKey(string Operation, Settings Settings)</code>, and <code>Settings</code> is a mutable class with a content-based <code>GetHashCode()</code> override (similar to the TagSet example). Six months later, cache lookups start intermittently "missing" entries that were definitely inserted. Explain the most likely root cause, and how you would confirm it without extensive debugging.',
    hint: 'Consider what could cause a Settings instance, ALREADY referenced by a CacheKey sitting in the dictionary, to have its fields changed by some OTHER, unrelated part of the codebase after the cache entry was inserted — this does not require the caching code itself to have any bug at all.',
    solution: `public class Settings
{
    public int Threshold { get; set; }
    public override int GetHashCode() => Threshold.GetHashCode();
    public override bool Equals(object? obj) =>
        obj is Settings s && s.Threshold == Threshold;
}

public record CacheKey(string Operation, Settings Settings);

var settings = new Settings { Threshold = 10 };
var cache = new Dictionary<CacheKey, Result>();
var key = new CacheKey("Compute", settings);
cache[key] = someResult;

// MOST LIKELY ROOT CAUSE: somewhere ELSE in the codebase — possibly a
// completely different module, service, or configuration-reload path
// that has NOTHING to do with the caching code itself — holds a
// reference to the SAME Settings object (perhaps it was shared
// deliberately, or the Settings object came from a singleton
// configuration service) and later does:
settings.Threshold = 20;   // some unrelated code path mutates the
                            // SHARED Settings instance, changing its
                            // GetHashCode() result

// From this point on, "cache.TryGetValue(key, out ...)" (using the
// SAME "key" object, or even a brand-new CacheKey("Compute", settings)
// pointing at the SAME mutated Settings instance) computes a DIFFERENT
// hash than the one used at insertion time — the entry is now
// unreachable via normal lookup, even though it is still physically
// present in the dictionary's internal bucket array.

// HOW TO CONFIRM WITHOUT EXTENSIVE DEBUGGING:
// 1. Check whether "cache.Keys.Any(k => k.Operation == "Compute")"
//    finds an entry that "cache.TryGetValue(...)" or
//    "cache.ContainsKey(...)" reports as missing — .Keys enumeration
//    walks every bucket regardless of hash, so if THIS finds the
//    "missing" entry while TryGetValue does not, that is a strong,
//    fast confirmation of exactly this hash-drift bug, without
//    needing a debugger at all.
// 2. Audit every place the SAME Settings instance is referenced —
//    specifically look for any code path that sets a property on it
//    AFTER it may have already been used as (or nested inside) a
//    dictionary key anywhere in the application.
//
// THE FIX: make Settings an immutable record (or wrap its mutable
// state so CacheKey only ever holds a frozen SNAPSHOT of the settings
// values relevant to the cache key, never a live reference to a
// Settings object that other code might still be mutating).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a record is always safe to use as a Dictionary key because its init-only properties make it immutable.',
      reality: 'init only prevents REASSIGNING a property — if that property is a reference to a genuinely mutable object, the object itself can still be mutated through that same reference after the record was inserted as a key, silently changing its effective hash code.',
    },
    {
      thought: 'if a Dictionary lookup for a key that was definitely inserted returns "not found," the entry must have been removed or the caching logic itself has a bug.',
      reality: 'a far more likely and much harder-to-spot cause is that a nested mutable object referenced by the key changed state after insertion, invalidating the hash bucket the entry is actually stored under — enumerating .Keys directly (which ignores hashing) can quickly confirm the entry is still physically present.',
    },
    {
      thought: 'List&lt;T&gt; properties inside a record used as a dictionary key are just as risky as any other mutable reference-typed property for this specific hash-drift bug.',
      reality: 'List&lt;T&gt; specifically uses object-identity hashing (inherited from object), which does NOT change when the list\'s contents are mutated — this happens to avoid the hash-drift bug in this particular case, though it introduces the SEPARATE equality-comparison gotcha the main page already covers.',
    },
  ];
}
