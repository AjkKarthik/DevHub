import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-real-cost-of-array-covariance-runtime-type-check-every-store-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './real-cost-of-array-covariance-runtime-type-check-every-store.html',
  styleUrl: './real-cost-of-array-covariance-runtime-type-check-every-store.scss',
})
export class RealCostOfArrayCovarianceRuntimeTypeCheckEveryStoreSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows the covariance trap firing once — the real mechanism fires on EVERY store, whether it fails or not',
      points: [
        'The main Arrays page\'s own example shows <code>objs[0] = 42;</code> throwing <code>ArrayTypeMismatchException</code> — but frames it as a one-off write-time check. The actual CLR behavior is that EVERY SINGLE element store into a reference-type array goes through a covariant type check, including all the ones that succeed and never throw anything.',
      ],
    },
    {
      heading: 'The IL instruction behind element stores — stelem.ref — always performs the check for reference-type arrays',
      points: [
        'For a reference-type array element store, the compiler emits the <code>stelem.ref</code> IL instruction (as opposed to <code>stelem.i4</code> for a value-type <code>int[]</code>, which has NO such check). <code>stelem.ref</code> is specified to verify, at that exact store, that the value being stored is actually assignment-compatible with the array\'s ACTUAL runtime element type — not its compile-time declared type.',
        'This check happens for <code>strings[0] = "hello";</code> just as much as it does for the covariance-violating <code>objects[0] = 42;</code> — the JIT cannot statically prove ahead of time that a given <code>object[]</code>-typed reference is not secretly backed by a <code>string[]</code>, so it must verify on every store, even ones that are guaranteed to succeed by the program\'s actual logic.',
      ],
    },
    {
      heading: 'Value-type arrays are exempt — this is why int[] has zero covariance overhead',
      points: [
        'Value-type arrays like <code>int[]</code> or <code>double[]</code> are NOT covariant in the way that matters here — you cannot assign a <code>double[]</code> to an <code>int[]</code> variable, so there is no possibility of a mismatched runtime element type, and <code>stelem.i4</code> (and its value-type siblings) perform NO type check at all. This is a real, measurable performance difference: writing into an <code>int[]</code> in a tight loop is cheaper per-element than writing into a <code>string[]</code> or any other reference-type array, purely because of this covariance check.',
        'The main page\'s own "practical rule" (avoid relying on covariance for mutation) is therefore not just a correctness concern — reference-type array writes carry a small but real per-store cost that value-type array writes never pay, independent of whether covariance is ever actually exploited in that particular code path.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Every reference-type array store is checked — not just the "wrong" one',
      language: 'csharp',
      code: `string[] strings = { "a", "b", "c" };
object[] objs = strings;  // covariant reference — same underlying array

// EVERY one of these stores triggers the SAME runtime type check —
// not just the one that would actually fail:
objs[0] = "hello";   // check passes (string is compatible) — check still ran
objs[1] = "world";   // check passes — check still ran
// objs[2] = 42;      // check FAILS — ArrayTypeMismatchException

// The JIT cannot know, at compile time, that "objs" is definitely
// backed by a string[] rather than some other reference type array —
// so it inserts the check unconditionally for every stelem.ref.`,
    },
    {
      label: 'Decompiled IL shape — stelem.ref vs stelem.i4',
      language: 'csharp',
      code: `// Reference-type array store — compiles to stelem.ref,
// which the CLR spec requires to perform a covariant type check:
object[] objs = new string[3];
objs[0] = "x";
// IL (simplified):
//   ldloc.0        // load objs
//   ldc.i4.0       // index 0
//   ldstr "x"
//   stelem.ref     // <-- runtime checks "x" is compatible with the
//                  //     array's ACTUAL element type before storing

// Value-type array store — compiles to stelem.i4 (or similar),
// which performs NO type check, because int[] cannot be covariantly
// backed by any other array's storage:
int[] nums = new int[3];
nums[0] = 42;
// IL (simplified):
//   ldloc.0
//   ldc.i4.0
//   ldc.i4.s 42
//   stelem.i4      // <-- direct store, no type check at all`,
    },
    {
      label: 'Why this matters in a hot loop',
      language: 'csharp',
      code: `// Writing into a reference-type array in a tight loop pays the
// covariant check cost on every iteration, even though this specific
// array is never actually aliased through a covariant reference:
string[] results = new string[1_000_000];
for (int i = 0; i < results.Length; i++)
    results[i] = ComputeLabel(i);   // every store: stelem.ref + type check

// The equivalent value-type loop has no such per-store check:
int[] values = new int[1_000_000];
for (int i = 0; i < values.Length; i++)
    values[i] = Compute(i);        // every store: stelem.i4, no type check

// This is not a reason to avoid string[]/object[] arrays outright —
// the check is typically cheap and JIT-optimized in practice — but it
// is a real, structural difference worth knowing when reasoning about
// why a value-type array write can be marginally faster than a
// reference-type array write of the same size.
static string ComputeLabel(int i) => i.ToString();
static int Compute(int i) => i * i;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given <code>Animal[] animals = new Dog[3];</code> (assuming <code>Dog : Animal</code>), explain what happens at the IL level for the store <code>animals[0] = new Cat();</code> (assuming <code>Cat : Animal</code> too, but NOT a Dog) — and why the compiler cannot catch this at compile time.',
    hint: 'The compile-time declared type of "animals" is Animal[], and Cat IS an Animal, so the assignment type-checks fine at compile time. The actual runtime array, though, is a Dog[] — consider what stelem.ref must verify against.',
    solution: `Animal[] animals = new Dog[3];  // covariant assignment — compiles fine,
                                 // "animals" is declared Animal[] but the
                                 // ACTUAL array instance is a Dog[]

animals[0] = new Cat();
// COMPILES — Cat is assignment-compatible with the DECLARED type Animal[]
// from the compiler's perspective.
//
// At the IL level, this store is a stelem.ref, which the CLR verifies
// against the array's ACTUAL runtime element type (Dog), not the
// compile-time declared type (Animal). Since Cat is not a Dog, the
// check FAILS at runtime:
//
//   System.ArrayTypeMismatchException: Attempted to access an element
//   as a type incompatible with the array.
//
// The compiler cannot catch this ahead of time because "animals" is
// just a reference — its declared type (Animal[]) says nothing about
// which concrete array type it points to at any given moment. Only
// the CLR, at the actual store instruction, has the real runtime
// type information needed to verify compatibility.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the covariant type check on array stores only happens for the specific write that would actually violate the array\'s real element type.',
      reality: 'the stelem.ref instruction performs the check on EVERY store into a reference-type array, including ones that are guaranteed to succeed — the CLR cannot know in advance which stores are "safe" without checking each one.',
    },
    {
      thought: 'int[] and string[] element stores have the same runtime cost — the covariance check only exists as a compile-time concept.',
      reality: 'value-type array stores (int[], double[], etc.) use stelem.i4/similar with NO type check at all, since value-type arrays cannot be covariantly backed by an incompatible array — reference-type array stores always pay the stelem.ref check.',
    },
    {
      thought: 'array covariance checks only matter for the exact line of code that would throw ArrayTypeMismatchException.',
      reality: 'every store into a reference-type array pays the check, structurally, regardless of whether that particular array is ever actually aliased through a covariant reference in the running program.',
    },
  ];
}
