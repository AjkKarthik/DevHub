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
  templateUrl: './comparable-can-panic-since-go120.html',
  styleUrl: './comparable-can-panic-since-go120.scss'
})
export class ComparableCanPanicSinceGo120Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents comparable as a clean, static compile-time guarantee — Go 1.20 quietly weakened that',
      points: [
        'The main page\'s own theory states comparable\'s job plainly: "comparable allows == and != — needed for map keys and sets," and its own mistake entry frames the fix for a compile error entirely in terms of the constraint: "the constraint must be comparable... the compiler then guarantees T supports equality comparison." Every example on the main page treats comparable as an unconditional, purely compile-time safety net.',
        'This was fully true before Go 1.20. Since Go 1.20, per the Go blog\'s own explanation of the change: "generic functions that rely on comparable are not statically type-safe anymore. The == and != operations may panic if applied to operands of comparable type parameters, even though the declaration says that they are strictly comparable." The constraint\'s NAME still says "comparable," but satisfying it no longer guarantees a runtime-safe == or != every time.',
        'The specific change: Go 1.20 introduced an exception allowing types that merely SUPPORT the == operator (like any / interface{}) to satisfy comparable, even though such a type can hold a dynamic value that is NOT actually comparable at runtime — a slice, map, or function value tucked inside an any. Before this change, that would have been a compile-time error; after it, per the blog\'s own words, "we have given up static type safety for a run-time check."',
      ]
    },
    {
      heading: 'A direct connection to this hub\'s own earlier interface-comparison coverage',
      points: [
        'This is precisely the SAME underlying failure mode this hub\'s own Structs & Interfaces subtopic on "Comparing Interfaces Can Panic at Runtime" already covers for ordinary, non-generic code — two interface values sharing an identical, non-comparable dynamic type (a slice, map, or function) panic when compared with ==, even though the comparison compiles fine. Go 1.20\'s change to comparable means this exact same risk now has a SECOND way to reach a program: through a generic function whose type parameter was instantiated with any (or another interface type), rather than only through direct interface-to-interface == in ordinary code.',
        'The Go blog\'s own description of the mechanism is exact: "a single non-comparable value may sneak its way through multiple generic functions or types by way of a single non-strictly comparable type argument and cause a panic" — meaning the risk is not confined to the one function that first receives the problematic value; it can propagate silently through several layers of generic code (a generic Set[T comparable], passed into a generic function that deduplicates, passed into another that indexes by key) before finally panicking at whichever == comparison actually happens to execute against the offending value.',
        'The main page\'s own comparable-constrained code (Set[T comparable], the Cache challenge\'s Cache[K comparable, V any]) is not automatically safe from this just because comparable is used correctly — it is safe SPECIFICALLY because those examples always instantiate K/T with genuinely, strictly comparable types (string, int) at every call site shown. The risk this subtopic describes only appears once a comparable-constrained generic type or function is instantiated with any (or another interface type) as its type argument.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own Set[T comparable] — safe as actually used',
      language: 'typescript',
      code: `package main

import "fmt"

// This mirrors the main page's own Set[T comparable] exactly.
type Set[T comparable] map[T]struct{}

func NewSet[T comparable](items ...T) Set[T] {
    s := make(Set[T], len(items))
    for _, v := range items {
        s[v] = struct{}{}
    }
    return s
}

func main() {
    // Instantiated with "string" -- a STRICTLY comparable type.
    // Every == this Set performs internally is genuinely safe --
    // this is the ONLY way the main page's own example ever uses it.
    tags := NewSet("go", "generics", "types")
    fmt.Println(tags["go"]) // works fine, no risk at all
}`,
    },
    {
      label: 'The Go 1.20 exception: comparable now also accepts "any"',
      language: 'typescript',
      code: `package main

import "fmt"

// The EXACT same Set[T comparable] definition -- unchanged.
type Set[T comparable] map[T]struct{}

func NewSet[T comparable](items ...T) Set[T] {
    s := make(Set[T], len(items))
    for _, v := range items {
        s[v] = struct{}{}
    }
    return s
}

func main() {
    // Before Go 1.20: this would NOT compile -- "any" was not
    // considered to satisfy "comparable" at all.
    //
    // Since Go 1.20: this DOES compile, per the language change
    // this subtopic's theory describes -- "types that support ==
    // now satisfy the comparable constraint even if they're not
    // strictly comparable."
    s := NewSet[any]("go", 42, true) // fine so far -- these three
                                        // VALUES are all individually
                                        // comparable dynamic types.

    fmt.Println(s["go"]) // fine -- comparing "go" against string
                            // keys works normally

    // The actual danger: inserting a genuinely NON-comparable
    // dynamic value into this same Set.
    // s2 := NewSet[any]([]int{1, 2, 3})
    // PANICS AT RUNTIME: "runtime error: hash of unhashable type
    // []int" -- the code compiled fine, per Go 1.20's own
    // documented tradeoff: "we have given up static type safety
    // for a run-time check."
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team builds a generic caching layer using the main page\'s own Cache[K comparable, V any] challenge type, then later adds a convenience wrapper AnyKeyCache = Cache[any, any] so callers do not need to think about key types up front. In production, the cache occasionally panics with "runtime error: hash of unhashable type []string" when a specific caller passes a []string as the cache key. Using this subtopic\'s theory, explain why this compiled without error in the first place, and identify the actual root cause versus a superficial one.',
    hint: 'Per this subtopic\'s theory, does Cache[any, any] compile cleanly under Go 1.20+, given that K is constrained to comparable and any technically satisfies comparable since that version? Is the caller\'s mistake (passing a []string as a key) something the COMPILER was ever in a position to catch, per this subtopic\'s own explanation of what changed?',
    solution: 'This compiled without error precisely because of the Go 1.20 change this subtopic\'s theory describes: Cache[any, any] instantiates K (which is constrained to comparable in the main page\'s own Cache[K comparable, V any] definition) with any — and since Go 1.20, "types that support == now satisfy the comparable constraint even if they\'re not strictly comparable," so any is accepted as a valid K without any compile-time objection, exactly as demonstrated in this subtopic\'s second code example. The superficial cause is "a caller passed a []string as a cache key" — but the actual root cause, per this subtopic\'s theory, is the AnyKeyCache = Cache[any, any] type alias itself: by instantiating K with any, the team gave up the compile-time guarantee that K is genuinely, strictly comparable, and per the Go blog\'s own description of this tradeoff, "we have given up static type safety for a run-time check" — meaning the compiler was structurally never in a position to catch this mistake once K became any, regardless of how careful any individual caller tried to be. A []string key sailing through untouched until the exact moment the cache\'s own internal map[K]entry[V] actually tries to hash it (per this subtopic\'s theory, echoing the identical panic mechanism this hub\'s own Structs & Interfaces subtopic covers for ordinary interface comparisons) is precisely the "sneaks its way through multiple generic functions... and causes a panic" scenario the Go blog itself warns about. The real fix is to avoid instantiating K with any in the first place — using a genuinely strictly-comparable key type (a specific concrete type, or a narrower constraint than any) restores the compile-time safety Cache[K comparable, V any] was designed to provide, rather than papering over convenience with a type parameter that structurally cannot be checked at compile time anymore.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own description — "the compiler then guarantees T supports equality comparison" when a comparable constraint is used — is a complete, permanently accurate statement about what comparable provides, on every Go version.',
      reality: 'This subtopic\'s theory shows this description, while accurate before Go 1.20 and still accurate for STRICTLY comparable type arguments, is no longer a complete, unconditional guarantee as of Go 1.20 — the Go blog itself states plainly that "generic functions that rely on comparable are not statically type-safe anymore," specifically because any (and other interface types) now satisfy comparable despite being able to hold non-comparable dynamic values at runtime.'
    },
    {
      thought: 'The runtime panic risk this subtopic describes is a completely separate, unrelated concern from the "Comparing Interfaces Can Panic at Runtime" risk this hub\'s own Structs & Interfaces subtopic already covers — one is about generics, the other about plain interface comparison.',
      reality: 'This subtopic\'s theory shows these are the SAME underlying failure mode reached through two different paths: both ultimately come down to comparing two values whose shared dynamic type turns out to be non-comparable (a slice, map, or function) at the moment == actually executes. Go 1.20\'s comparable change specifically opened a NEW path (via generic type parameters instantiated with any) to trigger that identical failure mode, rather than introducing a genuinely new or different kind of bug.'
    },
    {
      thought: 'Since a comparable-constrained generic type or function compiles successfully regardless of which type argument is used (including any, since Go 1.20), any concrete type argument that successfully compiles is safe to use without further thought — the compiler already validated it.',
      reality: 'This subtopic\'s exercise shows the opposite: successful compilation with K=any provides NO runtime safety guarantee at all for what VALUES actually get used as keys later — the compiler validates only that any itself satisfies the RELAXED comparable constraint, not that every value a caller might later pass in is genuinely, strictly comparable. The actual safety now depends entirely on runtime discipline from every caller, exactly the tradeoff the Go blog describes as "giving up static type safety for a run-time check."'
    }
  ];
}
