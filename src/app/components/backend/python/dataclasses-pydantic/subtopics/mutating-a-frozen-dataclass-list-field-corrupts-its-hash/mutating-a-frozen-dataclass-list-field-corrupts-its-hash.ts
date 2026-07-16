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
  templateUrl: './mutating-a-frozen-dataclass-list-field-corrupts-its-hash.html',
  styleUrl: './mutating-a-frozen-dataclass-list-field-corrupts-its-hash.scss'
})
export class MutatingAFrozenDataclassListFieldCorruptsItsHashSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'frozen=True generates a hash from CURRENT field values — mutating a stored instance\'s mutable field corrupts the set/dict holding it',
      points: [
        'The main page\'s own QnA already establishes that frozen=True "only prevents REASSIGNING or adding attributes directly on the instance... it does NOT make the contents of mutable fields immutable" — a frozen dataclass\'s list field can still be mutated in place via instance.items.append(x). What the main page doesn\'t follow through on is the actual consequence once that instance has been placed into a set or used as a dict key.',
        'The generated __hash__ on a frozen dataclass is an ordinary method — it is computed fresh, from the current field values, every single time hash() is called on the instance; nothing about @dataclass caches or freezes the hash value itself at construction time. So if a field\'s value legitimately changes after construction (as a mutable field still can, per the main page\'s own QnA), hash(instance) can genuinely return a DIFFERENT value on a later call than it did earlier.',
        'This runs directly into a general, fundamental Python invariant, stated in Python\'s own glossary: "An object is hashable if it has a hash value which never changes during its lifetime... Hashable objects which compare equal must have the same hash value." A set or dict relies on an object\'s hash staying constant for as long as that object remains stored inside it — mutating a mutable field on an already-stored frozen dataclass instance breaks this invariant, even though frozen=True made the class "hashable" in the first place.',
      ]
    },
    {
      heading: 'What actually happens, and how to avoid it',
      points: [
        'The practical consequence: once an instance\'s hash changes while it\'s already sitting inside a set or serving as a dict key, that collection\'s internal hash table becomes inconsistent with the object\'s new hash — the object can become permanently unfindable via normal lookups (instance in my_set can return False even though the exact same object is still physically present in the set\'s internal storage), and further set/dict operations involving it can behave unpredictably.',
        'The reliable fix is ensuring every field of a frozen, hashable dataclass is ITSELF immutable — using tuple instead of list, frozenset instead of set, for any field on a class that frozen=True and hashability are being relied upon for. This is a stronger requirement than frozen=True alone enforces; frozen=True only locks the class\'s own attribute assignments, not the mutability of whatever objects those attributes point to.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Mutating a mutable field after storing the instance in a set',
      language: 'typescript',
      code: `from dataclasses import dataclass, field

@dataclass(frozen=True)
class Tag:
    name: str
    aliases: list[str] = field(default_factory=list)   # still MUTABLE

t = Tag("python", ["py", "python3"])
print(hash(t))          # some hash value, e.g. -8234...

tags = {t}
print(t in tags)        # True — found correctly, right after insertion

t.aliases.append("py3k")   # frozen=True does NOT prevent this —
                             # aliases is a list, mutated in place
print(hash(t))              # a DIFFERENT hash value now!

print(t in tags)        # False! — the set's internal hash table still
                          # has 't' stored under its OLD hash bucket,
                          # but looking it up now computes the NEW hash
                          # and searches the WRONG bucket entirely.
print(len(tags))        # 1 — the object IS still physically there,
                          # it's just permanently unfindable by normal
                          # lookup, since its hash silently changed
                          # while it was stored.`,
    },
    {
      label: 'The fix — use genuinely immutable field types',
      language: 'typescript',
      code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Tag:
    name: str
    aliases: tuple[str, ...] = ()   # tuple — genuinely immutable

t = Tag("python", ("py", "python3"))
tags = {t}
print(t in tags)   # True

# t.aliases.append("py3k")   # AttributeError — tuples have no .append()
# t2 = Tag("python", t.aliases + ("py3k",))   # correct way to "change"
                                                # it — create a NEW Tag
                                                # instead of mutating

# hash(t) is now guaranteed to be stable for the object's ENTIRE
# lifetime, matching the general Python invariant that a hashable
# object's hash value must never change while it exists — frozen=True
# alone only guarantees this if every field is itself immutable.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A cache implementation uses a set of frozen CacheKey dataclass instances (with fields query: str, params: list[str]) to track which queries have already been computed. Occasionally, a query that was definitely cached earlier (confirmed by checking application logs) is recomputed anyway, as if the cache "forgot" it — even though the CacheKey object is confirmed, via debugging, to still be present in the underlying set\'s internal storage. Explain what is likely happening, using what this subtopic covers.',
    hint: 'What type is the params field — is it something that can be mutated in place after the CacheKey was created and inserted into the set? If it were mutated after insertion, what would that do to the object\'s hash, and to the set\'s ability to find it via a later lookup?',
    solution: 'The cache is very likely "forgetting" entries because params is a mutable list field, and something in the codebase is mutating a CacheKey instance\'s params list in place AFTER that instance was already inserted into the set — this changes the instance\'s hash value, per the general Python invariant that "hashable objects... must have the same hash value" for as long as they compare equal and remain stored, which frozen=True alone does not guarantee once a mutable field is involved (frozen=True only prevents reassigning the params attribute itself, not mutating the list object it points to). Once the hash changes, the set\'s internal hash table becomes inconsistent with the object\'s current hash — the object remains physically present in the set\'s internal storage (matching what debugging confirmed), but a later lookup using an equivalent CacheKey (even one with byte-for-byte identical field values) computes a hash based on the CURRENT state of whatever mutated instance is stored, and searches the wrong internal bucket, returning "not found" even though an equal-looking entry genuinely exists — causing the cache to recompute a query it had already cached. The fix is changing the params field\'s type from list[str] to tuple[str, ...] (or frozenset[str] if order doesn\'t matter), making every field of CacheKey genuinely immutable — this guarantees the object\'s hash can never change after construction, satisfying the requirement frozen=True alone only partially provides, and eliminating this entire class of "vanishing cache entry" bug.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since @dataclass(frozen=True) makes a class hashable and prevents reassigning its attributes, any instance of that class is fully safe to store in a set or use as a dict key indefinitely, regardless of what types its fields have.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — frozen=True only prevents reassigning the field itself; if a field holds a mutable object (a list), that object can still be mutated in place, which changes the instance\'s computed hash and corrupts any set/dict it is already stored in.'
    },
    {
      thought: 'A dataclass\'s generated __hash__ value is computed once and cached at construction time, the same way some other languages memoize an immutable object\'s hash — so even if a field\'s underlying object changes later, the cached hash would stay the same and everything would keep working.',
      reality: 'This subtopic\'s theory explains the opposite — the generated __hash__ is an ordinary method computed fresh from the CURRENT field values every time hash() is called, with no caching added by @dataclass at all, which is exactly why a later mutation produces a genuinely different hash value on the next call.'
    },
    {
      thought: 'If an object that should be in a set is confirmed (via debugging) to still be physically present in the set\'s internal storage, then `obj in my_set` should reliably return True for an equal object, since the object is right there.',
      reality: 'This subtopic\'s exercise shows the opposite — a set\'s lookup mechanism depends entirely on computing the CURRENT hash of the object being searched for and checking the corresponding internal bucket; if a stored object\'s own hash silently changed after insertion, it becomes permanently unfindable via normal lookup even while still being physically present in the set\'s internal storage.'
    }
  ];
}
