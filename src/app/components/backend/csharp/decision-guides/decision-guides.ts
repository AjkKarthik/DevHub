import { Component, signal, computed } from '@angular/core';

interface Guide {
  title: string;
  options: string[];
  rows: { criterion: string; cells: string[] }[];
  ruleOfThumb: string;
  verdict: string;
}

@Component({
  selector: 'app-csharp-decision-guides',
  standalone: true,
  imports: [],
  templateUrl: './decision-guides.html',
  styleUrl: './decision-guides.scss',
})
export class CsharpDecisionGuides {
  active = signal(0);

  guides: Guide[] = [
    {
      title: 'List<T> vs Array vs Span<T>',
      options: ['List<T>', 'T[] array', 'Span<T>'],
      rows: [
        { criterion: 'Resizable', cells: ['✓ Add/Remove', '✗ fixed length', '✗ a view, not storage'] },
        { criterion: 'Heap allocation', cells: ['Object + backing array', 'One array', '✓ none (ref struct)'] },
        { criterion: 'Slicing without copying', cells: ['✗ copies', '✗ copies', '✓ Slice() is free'] },
        { criterion: 'Can be a field / stored in async', cells: ['✓', '✓', '✗ stack-only'] },
        { criterion: 'Can wrap stackalloc memory', cells: ['✗', '✗', '✓'] },
        { criterion: 'Best for', cells: ['General collections', 'Fixed-size, interop, perf-known sizes', 'Hot-path parsing/slicing'] },
      ],
      ruleOfThumb: 'List<T> by default; array when the size is fixed forever; Span<T> only inside performance-critical methods.',
      verdict: 'Use List<T> for everyday code and treat Span<T> as a zero-copy optimization inside a method, not a storage type.',
    },
    {
      title: 'class vs struct vs record',
      options: ['class', 'struct', 'record'],
      rows: [
        { criterion: 'Semantics', cells: ['Reference', '✓ value, copied on assign', 'Reference (record struct exists)'] },
        { criterion: 'Equality', cells: ['Reference identity', '✓ field-by-field', '✓ value-based, auto-generated'] },
        { criterion: 'Inheritance', cells: ['✓ full', '✗ interfaces only', '✓ records can inherit records'] },
        { criterion: 'Immutability ergonomics', cells: ['Manual', 'readonly struct', '✓ init + with expressions'] },
        { criterion: 'Allocation', cells: ['Heap', '✓ inline/stack, no GC', 'Heap'] },
        { criterion: 'Best for', cells: ['Services, entities with identity', 'Small (<16B) data like Point, Money', 'Immutable data / DTOs'] },
      ],
      ruleOfThumb: 'Data that "is" something → record. Tiny value-like data → struct. Behavior and identity → class.',
      verdict: 'Records for data carriers, classes for behavior, structs for small high-frequency values.',
    },
    {
      title: 'Task vs ValueTask',
      options: ['Task / Task<T>', 'ValueTask / ValueTask<T>'],
      rows: [
        { criterion: 'Allocation when completing synchronously', cells: ['Heap allocation (unless cached)', '✓ none'] },
        { criterion: 'Await multiple times', cells: ['✓ safe', '✗ await exactly once'] },
        { criterion: 'Task.WhenAll / combinators', cells: ['✓ direct', 'Must call AsTask() first'] },
        { criterion: 'API ergonomics', cells: ['✓ simple, well understood', 'Easy to misuse'] },
        { criterion: 'Best for', cells: ['Almost all async APIs', 'Hot paths that often complete sync (caches)'] },
      ],
      ruleOfThumb: 'Return Task unless profiling shows allocation pressure on a method that usually completes synchronously.',
      verdict: 'Task is the safe default; ValueTask is a measured optimization with sharp edges.',
    },
    {
      title: 'interface vs abstract class',
      options: ['interface', 'abstract class'],
      rows: [
        { criterion: 'Multiple inheritance', cells: ['✓ implement many', '✗ single base class'] },
        { criterion: 'State (fields)', cells: ['✗ no instance fields', '✓ fields, constructors'] },
        { criterion: 'Shared implementation', cells: ['Default interface methods (limited)', '✓ protected helpers, template method'] },
        { criterion: 'Works on structs', cells: ['✓', '✗'] },
        { criterion: 'Versioning', cells: ['Adding members breaks implementers (unless default)', '✓ add virtual members safely'] },
        { criterion: 'Expresses', cells: ['"can do" capability', '"is a" with shared machinery'] },
      ],
      ruleOfThumb: 'Define contracts with interfaces; add an abstract base class only when implementations share real code or state.',
      verdict: 'Prefer interfaces for public contracts; abstract classes are an implementation-sharing tool behind them.',
    },
    {
      title: 'const vs readonly vs static readonly',
      options: ['const', 'readonly', 'static readonly'],
      rows: [
        { criterion: 'When value is fixed', cells: ['✓ compile time', 'Per instance, at construction', 'Once, at type init'] },
        { criterion: 'Allowed types', cells: ['Primitives, string, enums', '✓ any type', '✓ any type'] },
        { criterion: 'Baked into consuming assemblies', cells: ['✗ yes — recompile consumers on change', '✓ no', '✓ no'] },
        { criterion: 'Per-instance values', cells: ['✗', '✓', '✗ shared'] },
        { criterion: 'Best for', cells: ['True universal constants (Math.PI)', 'Injected/ctor-set immutables', 'Shared computed values, config'] },
      ],
      ruleOfThumb: 'const only for values that can never change in any version; otherwise static readonly for shared, readonly for per-instance.',
      verdict: 'The cross-assembly inlining of const is the trap — when in doubt, static readonly.',
    },
    {
      title: 'IEnumerable<T> vs IQueryable<T> vs List<T> Return Types',
      options: ['IEnumerable<T>', 'IQueryable<T>', 'List<T>'],
      rows: [
        { criterion: 'Execution', cells: ['Deferred, in-memory', 'Deferred, translated (SQL)', '✓ already materialized'] },
        { criterion: 'Caller can add Where → SQL', cells: ['✗ filters in memory', '✓ composes into the query', '✗'] },
        { criterion: 'Risk of multiple enumeration', cells: ['✗ yes, re-runs source', '✗ yes, re-queries DB', '✓ safe'] },
        { criterion: 'Hides persistence details', cells: ['✓', '✗ leaks query provider', '✓'] },
        { criterion: 'Best for', cells: ['Lazy pipelines, iterator methods', 'Repository internals / EF layers', 'Public API results, DTO lists'] },
      ],
      ruleOfThumb: 'Return materialized List/IReadOnlyList from service boundaries; keep IQueryable inside the data layer.',
      verdict: 'Deferred types are great inside a pipeline but dangerous as public return types — materialize at the boundary.',
    },
    {
      title: 'lock vs SemaphoreSlim vs Interlocked',
      options: ['lock', 'SemaphoreSlim', 'Interlocked'],
      rows: [
        { criterion: 'Works with await inside', cells: ['✗ cannot await in lock', '✓ WaitAsync()', 'n/a'] },
        { criterion: 'Protects compound logic', cells: ['✓ any critical section', '✓ any critical section', '✗ single variable ops only'] },
        { criterion: 'Limit to N concurrent', cells: ['✗ exactly 1', '✓ counted (N slots)', '✗'] },
        { criterion: 'Overhead', cells: ['Low', 'Higher (kernel-ish, disposable)', '✓ lowest, lock-free'] },
        { criterion: 'Best for', cells: ['Sync critical sections', 'Async code, throttling', 'Counters, flags, simple swaps'] },
      ],
      ruleOfThumb: 'Incrementing a counter → Interlocked. Sync critical section → lock. Anything with await or throttling → SemaphoreSlim.',
      verdict: 'Pick the lightest tool that covers the scope: Interlocked < lock < SemaphoreSlim.',
    },
    {
      title: 'String Concat vs StringBuilder vs Interpolation',
      options: ['+ concat', 'StringBuilder', '$"interpolation"'],
      rows: [
        { criterion: 'Readability', cells: ['OK for 2-3 parts', '✗ verbose', '✓ best'] },
        { criterion: 'Few known parts (one expression)', cells: ['✓ compiler optimizes', 'Overkill', '✓ compiles to efficient code'] },
        { criterion: 'Building in a loop', cells: ['✗ O(n²) allocations', '✓ amortized buffer', '✗ same problem as +'] },
        { criterion: 'Formatting (alignment, format specs)', cells: ['✗ manual', 'AppendFormat', '✓ {value:C2} inline'] },
        { criterion: 'Best for', cells: ['Trivial joins', 'Loops, large/incremental builds', 'Everyday message building'] },
      ],
      ruleOfThumb: 'Interpolation for readability everywhere; switch to StringBuilder only when appending inside a loop.',
      verdict: 'The loop is the deciding factor — single expressions are fine however you write them.',
    },
  ];

  guide = computed(() => this.guides[this.active()]);
}
