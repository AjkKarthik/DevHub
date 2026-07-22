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
  templateUrl: './comparing-interfaces-can-panic-at-runtime.html',
  styleUrl: './comparing-interfaces-can-panic-at-runtime.scss'
})
export class ComparingInterfacesCanPanicAtRuntimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Interfaces are comparable — but the comparison can still blow up, just not at compile time',
      points: [
        'The main page\'s own mistake entry covers one specific interface-comparison pitfall in detail: comparing an interface to nil, where "an interface value is nil only when both its type and value are nil." That entry is correct and important, but it covers comparing an interface to nil specifically — not the separate, distinct case of comparing two NON-NIL interface values to each other.',
        'Go\'s own spec states plainly that this comparison is allowed: "Interface values are comparable. Two interface values are equal if they have identical dynamic types and equal dynamic values, or if both are nil." The Go compiler accepts i1 == i2 for any two interface values of the same interface type — this compiles without complaint, unconditionally.',
        'The catch is what the spec states immediately after: "A comparison of two interface values with identical dynamic types causes a run-time panic if values of that type are not comparable." The compiler cannot know, at compile time, what concrete (dynamic) type either interface value will actually hold when the program runs — so it cannot reject this comparison in advance, even when it will provably fail at runtime for some inputs.',
      ]
    },
    {
      heading: 'The exact types that trigger the panic — and why this differs from a compile error',
      points: [
        'The spec is direct about which types cause this: "Slice, map, and function values are not comparable." Combined with the panic rule above, this means the specific, predictable failure case is two interface values that both happen to hold a slice, a map, or a function as their dynamic type — attempting i1 == i2 in that situation compiles cleanly, runs, and then panics the instant that specific comparison actually executes.',
        'This is a meaningfully different failure mode from the struct-with-a-slice-field example the main page covers in its OWN comparability mistake entry (a different topic — comparing two STRUCT values directly). There, the compiler catches the problem immediately: "invalid operation... struct containing []string cannot be compared" is a compile-time error, since the compiler can see the concrete struct TYPE and its field types directly at the comparison site. With interfaces, the compiler only sees the INTERFACE type at the comparison site — the actual dynamic type hiding inside each interface value is not known until the program runs, so the identical class of problem (comparing something that holds a non-comparable value) surfaces as a runtime panic instead of a compile error.',
        'The practical defense: before comparing two interface values with == (directly, or indirectly — as map keys, since map keys of interface type have this exact same risk, or in a switch statement\'s case clauses), be confident about what concrete types can actually flow into them. If a slice, map, or function value might end up boxed inside one of the interfaces being compared, == is not safe to use unconditionally — reflect.DeepEqual, an explicit type check first, or redesigning the data to avoid boxing a non-comparable type into an interface used for equality checks are all more defensive alternatives.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The exact same == expression: fine for one dynamic type, a panic for another',
      language: 'typescript',
      code: `package main

import "fmt"

func main() {
	var a, b any // any = interface{}, per the main page's own theory

	// Case 1: both hold a COMPARABLE dynamic type (int) -- fine.
	a, b = 5, 5
	fmt.Println(a == b) // true -- compiles AND runs without issue,
	                      // per the spec: "equal if they have
	                      // identical dynamic types and equal
	                      // dynamic values"

	// Case 2: both hold a NON-comparable dynamic type (a slice).
	a, b = []int{1, 2, 3}, []int{1, 2, 3}

	fmt.Println(a == b)
	// COMPILES successfully (Go cannot know at compile time that
	// 'any' will hold slices here) -- but PANICS at runtime:
	//   panic: runtime error: comparing uncomparable type []int
	//
	// Per the spec's own rule: "A comparison of two interface
	// values with identical dynamic types causes a run-time panic
	// if values of that type are not comparable" -- and "slice...
	// values are not comparable" is stated as the exact reason.`,
    },
    {
      label: 'The same risk hiding inside a map[any]... or a switch — and the defensive fix',
      language: 'typescript',
      code: `package main

import "fmt"

func safeEqual(a, b any) (equal bool, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("comparison panicked: %v", r)
		}
	}()
	return a == b, nil
}

func main() {
	// A map keyed by 'any' has the IDENTICAL risk -- inserting a
	// value whose dynamic type is a slice/map/function as a KEY
	// panics the moment Go's map implementation needs to compare
	// it against another key with the same dynamic type.
	cache := map[any]string{}
	cache[42] = "answer"        // fine -- int is comparable

	// cache[[]int{1, 2}] = "oops"
	// PANICS immediately on insertion: runtime error: hash of
	// unhashable type []int -- maps compare keys internally,
	// hitting the identical non-comparable-dynamic-type problem.

	// THE DEFENSIVE FIX: recover from the specific panic, or check
	// the dynamic type before comparing, when the dynamic type
	// flowing into an 'any'-typed comparison genuinely cannot be
	// guaranteed comparable in advance.
	ok, err := safeEqual([]int{1, 2}, []int{1, 2})
	fmt.Println(ok, err)
	// false <nil-turned-error>: "comparison panicked: runtime
	// error: comparing uncomparable type []int" -- recovered
	// safely instead of crashing the whole program.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A generic-ish cache implemented before Go generics existed stores type CacheEntry struct { Key any; Value any } in a slice, and a lookup function does for _, entry := range entries { if entry.Key == searchKey { return entry.Value } } where searchKey is also typed any. The function works correctly for months (all keys have been strings and ints) until a caller passes a []string as a search key one day, and the program crashes. Explain exactly what happened, using what this subtopic covers, and describe a fix that prevents the crash without banning slices from ever being used as keys.',
    hint: 'Per this subtopic\'s theory, does entry.Key == searchKey compile successfully regardless of what concrete types might flow into entry.Key and searchKey at runtime? What specifically triggers a panic when this comparison actually executes, versus when it runs safely?',
    solution: 'The crash happened because entry.Key == searchKey is comparing two any-typed (interface) values, and per this subtopic\'s theory, Go\'s own spec confirms this comparison always COMPILES successfully regardless of what dynamic types might flow into either side — the compiler has no way to know in advance what concrete type an any value will hold at runtime. For months, every entry.Key and searchKey pair happened to hold comparable dynamic types (strings, ints), so every comparison succeeded silently and correctly. The day a caller passed a []string as searchKey, the loop eventually reached a comparison where BOTH sides genuinely had the identical dynamic type ([]string) — and per the spec\'s own rule, "a comparison of two interface values with identical dynamic types causes a run-time panic if values of that type are not comparable," combined with the spec\'s direct statement that "slice... values are not comparable," this specific comparison panicked the instant it executed, crashing the program with something like "panic: runtime error: comparing uncomparable type []string." Note that the panic ONLY happens when both sides hold the SAME non-comparable dynamic type at that exact iteration — comparing []string against a string or an int on other iterations would not panic (per the spec, comparing genuinely DIFFERENT dynamic types just evaluates to false, no panic), which is exactly why this bug stayed hidden for months until a same-typed pair of non-comparable values actually collided in one comparison. The fix that prevents the crash without banning slices outright is to guard the comparison with a recover() (as this subtopic\'s second code example demonstrates with safeEqual), or to explicitly check whether entry.Key\'s dynamic type is itself comparable before attempting == — for instance, using a type switch to detect and specially handle (or explicitly reject with a clear error) any key whose dynamic type is a slice, map, or function, rather than letting the bare == expression reach and panic on it unpredictably.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own mistake entry already covers "interface values can behave unexpectedly around nil," that single entry covers the complete set of interface-comparison gotchas in Go — there is no other meaningfully different way comparing interface values can go wrong.',
      reality: 'This subtopic\'s theory shows the nil-interface pitfall and the non-comparable-dynamic-type panic are two entirely SEPARATE issues with different mechanisms and different fixes — the nil case is about what "nil" actually means for an interface (type AND value both nil), while this subtopic\'s issue is about what happens when comparing two definitely-non-nil interface values that happen to share a non-comparable dynamic type.'
    },
    {
      thought: 'If Go\'s compiler allows an expression like i1 == i2 to compile for two interface-typed variables, that comparison is guaranteed to execute safely at runtime — a successful compile means the comparison itself cannot fail.',
      reality: 'This subtopic\'s theory and first code example show this assumption is false specifically for interface comparisons — Go\'s own spec confirms the compiler accepts ANY interface-to-interface comparison of the same interface type unconditionally, since it cannot know the dynamic types involved in advance, and explicitly documents that this can PANIC AT RUNTIME when the shared dynamic type turns out to be non-comparable (a slice, map, or function).'
    },
    {
      thought: 'The non-comparable-dynamic-type interface comparison panic is the same underlying problem as the main page\'s own "comparing structs with == when they contain slices" mistake entry — just a different syntax for triggering an identical compile-time error.',
      reality: 'This subtopic\'s theory explicitly distinguishes these as different FAILURE STAGES for the same underlying category of problem — the direct struct-comparison case is caught at COMPILE time (the compiler can see the concrete struct type\'s fields directly), while the interface-comparison case is only caught at RUNTIME (the compiler only sees the interface type, not the dynamic type hidden inside it, until the program actually executes and the panic fires).'
    }
  ];
}
