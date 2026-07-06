import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-beyond-expression-trees-dynamicmethod-reflection-emit-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './beyond-expression-trees-dynamicmethod-reflection-emit.html',
  styleUrl: './beyond-expression-trees-dynamicmethod-reflection-emit.scss',
})
export class BeyondExpressionTreesDynamicmethodReflectionEmitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page calls compiled expression trees "even faster" — here is exactly what a further step buys you, and why it rarely matters',
      points: [
        'The main Reflection page\'s Performance section shows compiling a <code>PropertyInfo</code> access into a typed delegate via <code>Expression.Lambda(...).Compile()</code>, describing this as reaching "near-direct-call performance." <code>System.Reflection.Emit</code> (via <code>DynamicMethod</code> or a full <code>AssemblyBuilder</code>) is a lower-level API that writes RAW IL INSTRUCTIONS directly, bypassing the expression tree layer entirely — the question worth understanding is exactly what that buys you, and why the main page\'s own expression-tree approach is usually the better stopping point.',
      ],
    },
    {
      heading: 'Expression trees compile TO IL themselves — Reflection.Emit is one layer lower, writing that IL by hand',
      points: [
        '<code>Expression.Lambda(...).Compile()</code> already produces genuine, JIT-compiled IL under the hood — it is NOT an interpreter. The "compile" step builds an actual dynamic method and emits IL from the expression tree\'s structure automatically. <code>System.Reflection.Emit</code>\'s <code>ILGenerator</code> lets you write that IL YOURSELF, instruction by instruction (<code>Ldarg</code>, <code>Callvirt</code>, <code>Ret</code>, etc.) — the same end result, reached by hand instead of having the expression-tree compiler generate it for you.',
        'The practical difference in RUNTIME PERFORMANCE between a well-written expression-tree-compiled delegate and hand-emitted IL doing the exact same job is typically negligible — both end up as genuine JIT-compiled machine code. The real difference is in what each API lets you EXPRESS: expression trees are limited to constructs representable as a tree of <code>Expression</code> nodes (no arbitrary loops, no complex control flow), while raw IL emission has no such ceiling — you can emit literally anything the CLR supports, including constructs expression trees cannot represent at all.',
      ],
    },
    {
      heading: 'The real trade-off: raw IL emission is drastically harder to write and debug correctly',
      points: [
        'Writing correct IL by hand means tracking the evaluation stack\'s exact state at every instruction, matching opcodes to the correct operand types, and getting subtle rules right (e.g. <code>Callvirt</code> vs <code>Call</code> for virtual dispatch, boxing/unboxing instructions for value types) — mistakes here don\'t always fail at compile time; some only surface as a runtime <code>InvalidProgramException</code> or, worse, a JIT crash. Expression trees are validated and lowered by the compiler\'s own tooling, giving you a much larger safety net for the same performance destination.',
        'This is exactly why <code>System.Reflection.Emit</code> shows up almost exclusively inside serialization libraries, ORMs, and DI containers\' own INTERNALS (they need the absolute floor on per-call overhead, amortized across millions of calls, and have dedicated maintainers who can get the IL right) — application code virtually never needs to reach this far. The main page\'s own recommended ladder (cache MemberInfo → compile expression trees → prefer source generators for the ultimate destination) already covers essentially every real-world scenario without ever touching raw IL emission directly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s expression-tree approach, side by side with hand-emitted IL doing the same job',
      language: 'csharp',
      code: `// Expression-tree approach (from the main page) — the compiler
// builds the IL for you from the tree structure:
PropertyInfo nameProp = typeof(Customer).GetProperty("Name")!;
var param  = Expression.Parameter(typeof(Customer), "c");
var access = Expression.Property(param, nameProp);
Func<Customer, string> getName =
    Expression.Lambda<Func<Customer, string>>(access, param).Compile();

// Reflection.Emit approach — the SAME job, IL written by hand:
var dynamicMethod = new DynamicMethod(
    "GetName", typeof(string), new[] { typeof(Customer) });

ILGenerator il = dynamicMethod.GetILGenerator();
il.Emit(OpCodes.Ldarg_0);                          // load "customer" argument
il.Emit(OpCodes.Callvirt, nameProp.GetGetMethod()!); // call the getter
il.Emit(OpCodes.Ret);                               // return its result

var getNameEmitted =
    (Func<Customer, string>)dynamicMethod.CreateDelegate(typeof(Func<Customer, string>));

// Both "getName" and "getNameEmitted" perform IDENTICALLY at runtime —
// the expression-tree version reached the same destination with a
// much smaller, safer amount of code to get right.`,
    },
    {
      label: 'What raw IL emission can express that expression trees cannot',
      language: 'csharp',
      code: `// Expression trees CANNOT represent arbitrary loops, labels, or
// unstructured control flow — they model a TREE of expressions, not
// a general instruction sequence. A hand-written IL loop with an
// early exit via a label/branch has no expression-tree equivalent:

var dm = new DynamicMethod("SumUntilNegative", typeof(int), new[] { typeof(int[]) });
ILGenerator il = dm.GetILGenerator();

var sum   = il.DeclareLocal(typeof(int));
var i     = il.DeclareLocal(typeof(int));
var loopStart = il.DefineLabel();
var loopEnd   = il.DefineLabel();

// (Simplified sketch — a real implementation needs several more
// instructions for bounds-checking and array element loads.)
il.Emit(OpCodes.Ldc_I4_0);
il.Emit(OpCodes.Stloc, sum);
il.MarkLabel(loopStart);
// ... loop body: load arr[i], branch to loopEnd if negative, add to sum ...
il.Emit(OpCodes.Br, loopStart);
il.MarkLabel(loopEnd);
il.Emit(OpCodes.Ldloc, sum);
il.Emit(OpCodes.Ret);

// This kind of arbitrary branching/looping IL has NO direct expression-
// tree equivalent — Expression.Loop/Expression.Label exist and CAN
// model loops, but the moment the logic gets sufficiently irregular,
// hand-written IL becomes the only option left, at the cost of a much
// higher correctness burden on the author.`,
    },
    {
      label: 'Why this almost never belongs in application code',
      language: 'csharp',
      code: `// A mistake in hand-written IL doesn't always fail where you'd
// expect — some errors only surface as an opaque runtime exception:
var badMethod = new DynamicMethod("Broken", typeof(string), new[] { typeof(Customer) });
ILGenerator badIl = badMethod.GetILGenerator();
badIl.Emit(OpCodes.Ldarg_0);
// Forgot to call the getter or push a return value onto the stack —
badIl.Emit(OpCodes.Ret);
// Depending on the CLR version and JIT tier, this can throw
// InvalidProgramException at INVOCATION time, or in rarer cases
// produce genuinely undefined behavior — there is no compile-time
// safety net the way there is for expression trees or ordinary C#.

// This is exactly why System.Reflection.Emit shows up almost
// exclusively inside serialization libraries, ORMs, and DI container
// internals — not in application code. The main page's own ladder
// (cache MemberInfo -> compile expression trees -> source generators
// for the ultimate destination) already covers the real-world need
// without ever requiring hand-written IL.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants to hand-write IL via Reflection.Emit for a property setter used a few hundred times per application run (not a hot path called millions of times). Explain why this is very likely the wrong trade-off, using the main topic page\'s own performance ladder.',
    hint: 'Consider the main page\'s own mitigation ladder — cache MemberInfo, compile expression trees, then source generators — and where "a few hundred calls per run" falls on the cost-benefit curve versus the correctness risk of hand-written IL.',
    solution: `// The main page's own performance ladder, in order of effort vs payoff:
//
// 1. Cache MemberInfo (PropertyInfo/MethodInfo) per type — cheap to
//    write, large win over uncached reflection, appropriate for
//    almost ANY reflection-based code, including infrequent calls.
//
// 2. Compile expression trees into typed delegates — moderate
//    complexity, reaches near-direct-call speed, appropriate when the
//    SAME member is accessed enough times that the one-time compile
//    cost pays for itself (typically thousands+ calls).
//
// 3. Hand-written IL via Reflection.Emit — highest complexity and
//    correctness risk (silent runtime failures like
//    InvalidProgramException, much harder to debug), justified ONLY
//    when the per-call overhead of option 2 is STILL measurably too
//    high at truly extreme call volumes (millions+ calls, the
//    domain of serializer/ORM internals).
//
// For "a few hundred calls per application run," option 1 (simple
// MemberInfo caching) is almost certainly already fast enough that
// the difference between it and hand-written IL is not observable
// at all in real-world terms — the team would be taking on
// significant correctness risk and maintenance burden (IL is far
// harder to read, modify, and debug than ordinary C#) for a
// performance gain that is undetectable at this call volume. Reserve
// Reflection.Emit for genuinely hot paths where profiling has
// confirmed expression-tree-compiled delegates are still the
// bottleneck — which "a few hundred calls" almost never is.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'expression trees are an interpreted, slower alternative to "real" compiled code like Reflection.Emit produces.',
      reality: 'Expression.Lambda(...).Compile() genuinely produces JIT-compiled IL under the hood, not an interpreter — the runtime performance difference between a well-written compiled expression tree and hand-emitted IL doing the same job is typically negligible.',
    },
    {
      thought: 'Reflection.Emit is simply a "more advanced" tool that should be reached for whenever expression trees feel limiting.',
      reality: 'raw IL emission carries a much higher correctness risk — mistakes can produce opaque runtime failures like InvalidProgramException with no compile-time safety net — and is justified almost exclusively inside serializer/ORM/DI-container internals at extreme call volumes, not general application code.',
    },
    {
      thought: 'if a team needs the absolute fastest reflection-adjacent code, hand-written IL via Reflection.Emit is always the correct next step after expression trees.',
      reality: 'for the vast majority of real-world call volumes, simple MemberInfo caching (the main page\'s own first mitigation step) is already sufficient — reaching for Reflection.Emit without first profiling and confirming expression-tree-compiled delegates are still the bottleneck is a common overengineering trap.',
    },
  ];
}
