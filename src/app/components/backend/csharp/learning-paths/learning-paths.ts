import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Step {
  route: string;
  label: string;
  why: string;
}

interface Path {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  duration: string;
  steps: Step[];
}

@Component({
  selector: 'app-csharp-learning-paths',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './learning-paths.html',
  styleUrl: './learning-paths.scss',
})
export class CsharpLearningPaths {
  paths: Path[] = [
    {
      id: 'beginner',
      title: 'Beginner Path',
      subtitle: 'New to C#? Foundations → OOP basics.',
      icon: '🌱',
      color: '#16a34a',
      duration: '~4–6 weeks',
      steps: [
        { route: 'basics',              label: 'C# Basics',              why: 'Variables, types, operators, and control flow — the foundation of everything.' },
        { route: 'type-conversion',     label: 'Type Conversion',        why: 'Implicit vs explicit casts, Parse/TryParse, and Convert.' },
        { route: 'fields',              label: 'Fields',                 why: 'How state lives inside a class — instance vs static, readonly, const.' },
        { route: 'methods',             label: 'Methods',                why: 'Parameters, overloading, ref/out, and expression-bodied members.' },
        { route: 'constructors',        label: 'Constructors',           why: 'How objects are created and initialized, including chaining.' },
        { route: 'properties-indexers', label: 'Properties & Indexers',  why: 'Encapsulate fields the idiomatic C# way with get/set/init.' },
        { route: 'namespaces',          label: 'Namespaces',             why: 'Organize code and understand using directives.' },
        { route: 'oop',                 label: 'OOP Fundamentals',       why: 'Encapsulation, abstraction, and how classes model the real world.' },
        { route: 'inheritance',         label: 'Inheritance',            why: 'Base/derived classes, virtual/override, and polymorphism.' },
        { route: 'abstract-interfaces', label: 'Abstract & Interfaces',  why: 'Contracts and abstract base types — the heart of C# design.' },
        { route: 'static-enums',        label: 'Static & Enums',         why: 'Static members, static classes, and type-safe enum constants.' },
        { route: 'exceptions',          label: 'Exceptions',             why: 'try/catch/finally and writing code that fails gracefully.' },
      ],
    },
    {
      id: 'intermediate',
      title: 'Intermediate Path',
      subtitle: 'Comfortable with basics? Level up.',
      icon: '🚀',
      color: '#4f46e5',
      duration: '~4–6 weeks',
      steps: [
        { route: 'structures',        label: 'Structs',              why: 'Value types vs reference types — when stack semantics win.' },
        { route: 'system-object',     label: 'System.Object',        why: 'ToString, Equals, GetHashCode — what every type inherits.' },
        { route: 'records',           label: 'Records',              why: 'Immutable data with value equality and with-expressions.' },
        { route: 'generics',          label: 'Generics',             why: 'Type-safe reusable code — List<T>, constraints, and variance.' },
        { route: 'arrays',            label: 'Arrays',               why: 'Single, multi-dimensional, and jagged arrays plus Span basics.' },
        { route: 'collections',       label: 'Collections',          why: 'List, Dictionary, HashSet, Queue, Stack — pick the right tool.' },
        { route: 'linq',              label: 'LINQ',                 why: 'Query any collection: Where, Select, GroupBy, joins, and deferred execution.' },
        { route: 'pattern-matching',  label: 'Pattern Matching',     why: 'switch expressions, property/relational/list patterns.' },
        { route: 'null-safety',       label: 'Null Safety',          why: 'Nullable reference types, ?. ?? operators — kill NullReferenceException.' },
        { route: 'tuples',            label: 'Tuples',               why: 'Lightweight multi-value returns and deconstruction.' },
        { route: 'extension-methods', label: 'Extension Methods',    why: 'Add methods to types you don\'t own — how LINQ itself is built.' },
        { route: 'strings-datetime',  label: 'Strings & DateTime',   why: 'Formatting, interpolation, StringBuilder, and date arithmetic.' },
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced Path',
      subtitle: 'Concurrency, memory, and production-grade C#.',
      icon: '🏆',
      color: '#7c3aed',
      duration: '~6–8 weeks',
      steps: [
        { route: 'delegates',         label: 'Delegates & Events',   why: 'Func, Action, events — functions as first-class values.' },
        { route: 'io-serialization',  label: 'I/O & Serialization',  why: 'Files, streams, and System.Text.Json in depth.' },
        { route: 'gc-disposable',     label: 'GC & IDisposable',     why: 'How the garbage collector works; using statements and finalizers.' },
        { route: 'threading',         label: 'Threading',            why: 'Threads, locks, race conditions, and thread-safe collections.' },
        { route: 'tasks',             label: 'Tasks & TPL',          why: 'Task.Run, WhenAll/WhenAny, continuations, and cancellation.' },
        { route: 'async',             label: 'async/await',          why: 'The async state machine, ConfigureAwait, and async streams.' },
        { route: 'whats-new-9-10',    label: 'What\'s New in C# 9/10',  why: 'Records, top-level statements, global usings, file-scoped namespaces.' },
        { route: 'whats-new-11-12',   label: 'What\'s New in C# 11/12', why: 'Raw strings, required members, primary constructors, collection expressions.' },
        { route: 'whats-new-latest',  label: 'Latest C# Features',   why: 'Stay current with the newest language additions.' },
      ],
    },
    {
      id: 'interview',
      title: 'Interview Prep Path',
      subtitle: 'The most-asked C# interview topics.',
      icon: '🎯',
      color: '#db2777',
      duration: '~2–3 weeks',
      steps: [
        { route: 'oop',               label: 'OOP Pillars',          why: 'The #1 interview topic — explain all four pillars with examples.' },
        { route: 'structures',        label: 'Value vs Reference',   why: 'Classic question: struct vs class, stack vs heap, boxing.' },
        { route: 'abstract-interfaces', label: 'Abstract vs Interface', why: 'Asked in almost every interview — know the differences cold.' },
        { route: 'system-object',     label: 'Equals & GetHashCode', why: 'Equality contracts trip up many candidates.' },
        { route: 'generics',          label: 'Generics & Constraints', why: 'Explain where T : class, covariance, and why generics exist.' },
        { route: 'linq',              label: 'LINQ Internals',       why: 'Deferred execution and IEnumerable vs IQueryable questions.' },
        { route: 'delegates',         label: 'Delegates vs Events',  why: 'Be ready to write an event from scratch on a whiteboard.' },
        { route: 'gc-disposable',     label: 'GC & Dispose Pattern', why: 'Generations, LOH, and the full IDisposable pattern.' },
        { route: 'async',             label: 'async/await Pitfalls', why: 'Deadlocks, async void, and "what does await actually do?"' },
        { route: 'exceptions',        label: 'Exception Handling',   why: 'Custom exceptions, filters, and rethrowing correctly.' },
        { route: 'errors',            label: 'Common Errors',        why: 'Recognize and fix the compiler/runtime errors interviewers probe.' },
        { route: 'cheatsheet',        label: 'Cheatsheet Review',    why: 'Final rapid revision of syntax and idioms before the interview.' },
      ],
    },
    {
      id: 'web',
      title: '.NET Web Developer Path',
      subtitle: 'C# skills that lead into ASP.NET Core.',
      icon: '🌐',
      color: '#0891b2',
      duration: '~4–5 weeks',
      steps: [
        { route: 'oop',              label: 'OOP & DI Mindset',     why: 'ASP.NET Core is built on interfaces and dependency injection.' },
        { route: 'properties-indexers', label: 'Properties',        why: 'Model binding and DTOs are all about properties.' },
        { route: 'records',          label: 'Records as DTOs',      why: 'Records are the modern way to shape API request/response models.' },
        { route: 'collections',      label: 'Collections',          why: 'Every API returns and consumes collections.' },
        { route: 'linq',             label: 'LINQ',                 why: 'The query language of Entity Framework Core.' },
        { route: 'null-safety',      label: 'Null Safety',          why: 'Nullable annotations drive API contract validation.' },
        { route: 'io-serialization', label: 'JSON Serialization',   why: 'System.Text.Json powers ASP.NET Core request/response bodies.' },
        { route: 'exceptions',       label: 'Exceptions',           why: 'Middleware-based error handling starts with solid exception skills.' },
        { route: 'tasks',            label: 'Tasks',                why: 'Every controller action in modern ASP.NET is Task-based.' },
        { route: 'async',            label: 'async/await',          why: 'Async endpoints, async EF queries — non-negotiable for web work. ASP.NET Core content coming soon!' },
      ],
    },
  ];
}
