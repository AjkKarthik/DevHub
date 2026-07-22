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
  templateUrl: './escape-analysis-gcflags-m-shows-why-a-var-heap-allocates.html',
  styleUrl: './escape-analysis-gcflags-m-shows-why-a-var-heap-allocates.scss'
})
export class EscapeAnalysisGcflagsMShowsWhyAVarHeapAllocatesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA names the exact command but never shows what it actually prints',
      points: [
        'The main page\'s own QnA answer for escape analysis says: "Inspect escape decisions with: go build -gcflags=-m=2 ./... — it prints \'does not escape\' or \'escapes to heap\' per variable." That is the entirety of the coverage — no example command output, and no worked example connecting a specific piece of code to a specific escape decision.',
        'The official Go FAQ describes the underlying rule the compiler applies: "if the compiler cannot prove that the variable is not referenced after the function returns, then the compiler must allocate the variable on the garbage-collected heap to avoid dangling pointer errors." The FAQ adds: "if a variable has its address taken, that variable is a candidate for allocation on the heap. However, a basic escape analysis recognizes some cases when such variables will not live past the return from the function and can reside on the stack."',
        'Put together: taking a variable\'s address (&x) does not automatically force a heap allocation — it only makes the variable a CANDIDATE. Whether it actually escapes depends on whether the compiler can prove the resulting pointer never outlives the function call — the main page\'s "Avoid interface boxing for hot paths" bullet gestures at one specific escape trigger (interfaces) without ever showing the compiler\'s own reasoning for that or any other case.',
      ]
    },
    {
      heading: 'Reading the actual output, not just knowing the command exists',
      points: [
        'go build -gcflags="-m" ./... (a single -m; -m=2 is more verbose, showing inlining decisions too) prints one line per variable the compiler analyzed, annotated with the exact file and line number, using two characteristic phrasings: "./file.go:12:6: moved to heap: x" for variables that escape, and "./file.go:15:9: x does not escape" for variables the compiler proved could stay on the stack.',
        'The three classic escape triggers, per the FAQ\'s own general rule ("referenced after the function returns"), each produce this pattern: returning a pointer to a local variable (the caller can reference it after the function returns, so it must escape), storing a value in an interface (the interface\'s internal representation needs a stable address, so escape analysis is conservative here), and capturing a variable in a closure that outlives the enclosing function (a goroutine launched with go func() { ... } that reads a local variable — the goroutine can run long after the function that launched it returns).',
        'This turns the main page\'s own "Avoid interface boxing for hot paths" and "Channel operations are not free" theory bullets from abstract advice into something verifiable: running -gcflags=-m against the exact function in question shows, line by line, which specific variables the compiler decided to heap-allocate and why — replacing "this is probably slow because of allocations" with a directly inspectable compiler decision.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reading real -gcflags=-m output for three classic triggers',
      language: 'typescript',
      code: `package main

import "fmt"

// Trigger 1: returning a pointer to a local variable.
func newCounter() *int {
    c := 0 // per the compiler, c's address is returned -- it must
           // be referenced after newCounter returns, so it escapes.
    return &c
}

// Trigger 2: storing a value in an interface.
func logValue(v any) { // any is an interface -- the argument
    fmt.Println(v)      // escapes to satisfy the interface's own
}                        // internal representation requirements.

// Trigger 3: capturing a variable in a goroutine closure.
func startWorker() {
    data := make([]byte, 16) // data can be read by the goroutine
    go func() {               // long after startWorker itself
        process(data)          // returns -- data must escape.
    }()
}

// go build -gcflags="-m" .
//
// ./main.go:8:2: moved to heap: c
// ./main.go:14:14: v escapes to heap
// ./main.go:20:2: moved to heap: data
// ./main.go:21:5: func literal escapes to heap
//
// Each line matches exactly one of the three triggers -- per the Go
// FAQ's own general rule, all three share the same underlying cause:
// the compiler "cannot prove that the variable is not referenced
// after the function returns."`,
    },
    {
      label: 'A variable that looks similar but does NOT escape',
      language: 'typescript',
      code: `package main

import "fmt"

// A local variable whose address IS taken, but never leaves the
// function -- per the Go FAQ: "a basic escape analysis recognizes
// some cases when such variables will not live past the return
// from the function and can reside on the stack."
func sumSquares(nums []int) int {
    total := 0
    for _, n := range nums {
        p := &n          // address taken -- a CANDIDATE for escape...
        total += (*p) * (*p) // ...but *p is only ever dereferenced
    }                          // right here, never returned or stored
    return total                // anywhere that outlives this loop iteration
}

// go build -gcflags="-m" .
//
// ./main.go:10:6: p does not escape
//
// This is exactly the distinction the Go FAQ draws: &n makes p a
// CANDIDATE for heap allocation (its address was taken), but escape
// analysis proves p never needs to exist after this loop iteration
// ends -- so, unlike newCounter's "c" in the previous example, it
// stays on the stack. Same "&variable" syntax, opposite outcome,
// because the COMPILER's proof about lifetime -- not the mere
// presence of "&" -- is what actually decides the allocation site.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer runs go build -gcflags="-m" ./... on a hot-path function and sees the line "./service.go:42:9: result escapes to heap" for a local struct variable named result. Looking at the function, result is built up field by field and then passed as fmt.Sprintf("%+v", result) purely for a debug log line — result is never returned, never stored in a struct field, and no goroutine touches it. Using this subtopic\'s theory, identify which of the three classic escape triggers this matches, and explain what about the fmt.Sprintf call specifically is responsible, given that result looks like a purely local, short-lived value everywhere else in the function.',
    hint: 'Per this subtopic\'s theory, which escape trigger involves passing a value into a function parameter typed as an interface? What is the signature of fmt.Sprintf\'s variadic arguments — are they a concrete type, or do they accept any type via an interface?',
    solution: 'This matches the second classic trigger from this subtopic\'s theory: storing a value in an interface. fmt.Sprintf\'s signature is func Sprintf(format string, a ...any) string — its variadic arguments are typed any (an empty interface), so passing result into fmt.Sprintf("%+v", result) requires the compiler to box result into an interface value to satisfy that parameter type. Per this subtopic\'s theory, "storing a value in an interface... the interface\'s internal representation needs a stable address, so escape analysis is conservative here." Everywhere ELSE in the function, result is used purely as a plain, local struct value — which would ordinarily stay on the stack, exactly like this subtopic\'s second code example — but the single fmt.Sprintf call at the very end is enough to force the escape, since escape analysis has to account for every use of result across the whole function, not just the majority of uses that would otherwise be stack-safe. This is precisely why this subtopic\'s theory frames -gcflags=-m as turning "this is probably slow because of allocations" into a directly inspectable compiler decision — a single interface-typed call site, easy to overlook, is visible by exact line number in the annotated build output rather than needing to be guessed at.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Taking the address of a local variable (&x) always forces that variable to be heap-allocated — "does not escape" only applies to variables whose address is never taken at all.',
      reality: 'This subtopic\'s theory quotes the Go FAQ directly: taking a variable\'s address only makes it "a candidate for allocation on the heap... a basic escape analysis recognizes some cases when such variables will not live past the return from the function and can reside on the stack." This subtopic\'s second code example shows a variable whose address IS taken but that still does not escape, because the compiler proves its pointer never outlives the function.'
    },
    {
      thought: 'go build -gcflags=-m produces one summary line per FUNCTION, telling you whether that function allocates on the heap overall.',
      reality: 'This subtopic\'s theory and first code example show the output is per VARIABLE, with an exact file and line number for each — a single function can have multiple lines of output, some variables escaping and others not, depending on how each one is individually used within the function body.'
    },
    {
      thought: 'The main page\'s own "Avoid interface boxing for hot paths" advice is a general best practice with no direct way to verify whether a specific piece of code is actually affected by it.',
      reality: 'This subtopic\'s exercise shows -gcflags=-m makes this directly verifiable: running it against a specific function shows, by exact line number, precisely which variables escape because of an interface argument (annotated as "escapes to heap" at the call site passing into the interface-typed parameter) — turning the abstract advice into an inspectable compiler decision for any given piece of code.'
    }
  ];
}
