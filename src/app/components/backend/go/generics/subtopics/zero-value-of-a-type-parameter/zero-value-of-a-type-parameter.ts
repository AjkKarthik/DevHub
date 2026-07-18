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
  templateUrl: './zero-value-of-a-type-parameter.html',
  styleUrl: './zero-value-of-a-type-parameter.scss'
})
export class ZeroValueOfATypeParameterSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code writes "var zero T" three times — without ever explaining why',
      points: [
        'The main page\'s own Stack.Pop, Stack.Peek, and the Cache challenge\'s Get method all write var zero T before returning it as a "nothing to give you" placeholder — Pop: "var zero T ... return zero, errors.New(...)"; Peek: the same pattern; Get: "var zero V ... return zero, false". None of the main page\'s own theory bullets ever explain what this line actually does or why it is necessary.',
        'A natural instinct, especially from developers used to nullable-by-default languages, is to reach for return nil, err instead — but this does not compile for a plain type parameter T. nil is only a valid value for pointers, interfaces, maps, slices, channels, and functions — for a T that might be instantiated as int or a plain struct, nil has no meaning at all, and the compiler rejects it regardless of what T eventually turns out to be.',
        'var zero T solves this by asking the compiler for T\'s OWN zero value, whatever that happens to be for the concrete type this particular instantiation is using — exactly the same zero-value rule that already applies to every ordinary Go type (0 for numeric types, "" for string, false for bool, nil for pointer/interface/map/slice/channel/func, and a zero-valued struct for struct types), just deferred until the type parameter is actually bound to something concrete.',
      ]
    },
    {
      heading: 'Why this has to be written this way, and the shorthand alternative',
      points: [
        'This is not a workaround or a clever trick — it is the ONLY way to express "the zero value of T" in Go\'s generics design, because a single generic function body is compiled ONCE (per the main page\'s own Q&A on GCShape stenciling) and must produce correct code for every possible T it might be instantiated with — a literal that only makes sense for SOME possible types (like nil, which only works for T\'s that happen to be nilable) cannot appear in code meant to work for every T satisfying the constraint.',
        'There is a shorthand equivalent worth recognizing when reading other Go code: *new(T) — new(T) allocates a zero-valued T and returns a pointer to it, and dereferencing that pointer with * yields the zero value directly, all in one expression. It is functionally identical to declaring var zero T and using zero, just more compact and less commonly used because it reads less clearly at a glance — the main page\'s own code consistently uses the more readable var zero T form instead.',
        'This pattern generalizes beyond return values: anywhere a generic function needs to represent "no value yet" or "reset to nothing" for a type parameter — initializing an accumulator, clearing a slot, or providing a fallback when a lookup misses — var zero T (or *new(T)) is the idiomatic tool, precisely because it works correctly and uniformly regardless of which concrete type the function ends up being instantiated with.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why nil doesn\'t work for a plain type parameter',
      language: 'typescript',
      code: `package main

// This demonstrates the compile error nil produces for T -- shown as
// a comment since it does not compile.
func firstOrNil[T any](s []T) T {
    if len(s) > 0 {
        return s[0]
    }
    // return nil
    // COMPILE ERROR: cannot use nil as T value in return statement
    //
    // This fails regardless of what T ends up being instantiated
    // as. Even if every ACTUAL call site happens to use a pointer
    // or interface type (where nil would be meaningful), the
    // function body itself must compile once, correctly, for EVERY
    // type that could satisfy "any" -- including int, string, and
    // plain structs, none of which have a meaningful nil value.
    var zero T
    return zero
}`,
    },
    {
      label: 'The main page\'s own pattern, generalized: "no value" for any T',
      language: 'typescript',
      code: `package main

import "fmt"

// findOrZero mirrors the exact pattern the main page's own
// Stack.Pop/Peek and Cache.Get already use -- "var zero T" is the
// ONLY way to express "nothing to return" that works correctly no
// matter what concrete type T is instantiated with.
func findOrZero[T comparable](s []T, target T) (T, bool) {
    for _, v := range s {
        if v == target {
            return v, true
        }
    }
    var zero T // T's own zero value -- 0 for int, "" for string,
                 // a zero-valued struct for a struct type, nil for
                 // a pointer/interface/slice/map/chan/func type --
                 // whichever ACTUALLY applies to this instantiation.
    return zero, false
}

func main() {
    ints := []int{1, 2, 3}
    v, ok := findOrZero(ints, 5)
    fmt.Println(v, ok) // 0 false -- T's zero value for int is 0

    strs := []string{"a", "b", "c"}
    s, ok2 := findOrZero(strs, "z")
    fmt.Println(s, ok2) // "" false -- T's zero value for string is ""
}`,
    },
    {
      label: '*new(T): the compact, functionally-identical shorthand',
      language: 'typescript',
      code: `package main

import "fmt"

// zeroValue and zeroValueShort are functionally IDENTICAL -- both
// produce T's zero value. The main page's own code consistently
// uses the "var zero T" form (more readable); this shows the
// equivalent shorthand you may encounter reading OTHER Go code.
func zeroValue[T any]() T {
    var zero T
    return zero
}

func zeroValueShort[T any]() T {
    return *new(T) // new(T) allocates a zero-valued T, returns *T;
                     // dereferencing with * yields the zero value
                     // directly, in one expression.
}

func main() {
    fmt.Println(zeroValue[int]())         // 0
    fmt.Println(zeroValueShort[int]())    // 0 -- identical result
    fmt.Println(zeroValue[string]())      // ""
    fmt.Println(zeroValueShort[string]()) // "" -- identical result
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a generic function func FirstMatch[T any](s []T, pred func(T) bool) T that should return the first element matching a predicate, or "nothing" if none match — but since T is constrained to any (not comparable), there is no sentinel value they can compare against to represent "not found," and the function has no second boolean return value to signal a miss (unlike the main page\'s own findFirst/Option pattern). They write return nil as the fallback. Using this subtopic\'s theory, explain why this fails to compile, and describe two different fixes.',
    hint: 'Per this subtopic\'s theory, for which categories of Go types is nil actually a valid value? Does the any constraint guarantee T will always be one of those categories? What are the two general strategies this subtopic covers for representing "no value" generically?',
    solution: 'This fails to compile for exactly the reason this subtopic\'s theory and first code example describe: nil is only a valid value for pointer, interface, map, slice, channel, and function types — and the any constraint places no restriction on T beyond "any type at all," meaning T could just as easily be instantiated as int, a plain struct, or any other non-nilable type. Since the function body must compile once and work correctly for every possible T satisfying any (per the GCShape-stenciling model the main page\'s own Q&A describes), a literal that only makes sense for SOME possible T\'s cannot appear in the function at all — the compiler rejects "return nil" here regardless of what any specific caller happens to instantiate T as. There are two genuinely different fixes. The first, matching this subtopic\'s own zero-value pattern, is to return T\'s zero value instead of nil: var zero T; return zero (or the *new(T) shorthand) — this compiles for every T, but callers cannot distinguish "found a value that happens to equal the zero value" from "nothing was found," the exact ambiguity the main page\'s own findFirst/Option[T] pattern was specifically designed to avoid. The second, more precise fix is to change the function\'s own signature to return a second boolean (or use the main page\'s own Option[T] type) alongside T, exactly mirroring findFirst\'s own (Option[T]) return or a plain (T, bool) — this preserves T\'s zero value as the "no value" placeholder while giving callers an unambiguous, separate signal for whether a real match was actually found, rather than overloading the zero value itself to mean two different things.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"var zero T" (or the *new(T) shorthand) is a defensive workaround specific to error-handling code, similar to how the main page\'s own Stack.Pop returns it alongside an error — the pattern exists mainly to satisfy Go\'s requirement that every return path provide SOME value, even a meaningless placeholder.',
      reality: 'This subtopic\'s theory and second code example show the pattern is not a meaningless placeholder or error-handling-specific workaround — it is the correct, deliberate way to represent "T\'s own zero value" for ANY generic code that needs one, including code with no error handling at all (like findOrZero\'s plain (T, bool) return). It is the direct generic-code equivalent of the same zero-value concept every ordinary Go type already has.'
    },
    {
      thought: 'return nil should work as a fallback in a generic function as long as the ACTUAL type arguments used at every call site happen to be nilable types (pointers, interfaces, slices, maps) — the compile error would only appear if someone tried to call the function with a non-nilable type like int.',
      reality: 'This subtopic\'s theory and first code example show the compiler rejects "return nil" in the FUNCTION BODY ITSELF, at the point the generic function is DEFINED — completely independent of what any specific caller\'s type argument happens to be. The function body must compile correctly for every T that could possibly satisfy its constraint, not just the specific types any current caller happens to use, so nil is rejected even if every existing call site would have supplied a nilable type.'
    },
    {
      thought: 'var zero T and *new(T) are two different techniques with different behavior — *new(T) additionally allocates memory on the heap (since it uses "new"), while var zero T is a cheaper, stack-friendly alternative, so the choice between them is a meaningful performance decision.',
      reality: 'This subtopic\'s theory and third code example show these are functionally IDENTICAL in the value they produce — both yield exactly T\'s zero value, and *new(T) simply dereferences the pointer new(T) returns to get that same value in one expression. Go\'s escape analysis governs actual allocation behavior for both forms based on how the result is used, not based on which of these two equivalent spellings was chosen — the main page\'s own consistent use of "var zero T" throughout is a readability choice, not a performance one.'
    }
  ];
}
