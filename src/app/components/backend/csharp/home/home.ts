import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LowerCasePipe, TitleCasePipe } from '@angular/common';

interface CsharpTopic {
  title: string;
  description: string;
  route: string;
  badge: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  time: string;
  keyPoints: string[];
}

const ALL_TOPICS: CsharpTopic[] = [
  {
    title: 'Variables & Types',
    route: '/csharp/basics',
    badge: 'Foundations',
    difficulty: 'beginner',
    time: '25 min',
    description:
      'Built-in types, var/const, string interpolation, operators, control flow (if/switch/for/foreach/while).',
    keyPoints: [
      'string is an alias for System.String',
      'var infers the type at compile time',
      'switch expressions replace verbose switch statements',
    ],
  },
  {
    title: 'OOP & Classes',
    route: '/csharp/oop',
    badge: 'Core',
    difficulty: 'intermediate',
    time: '35 min',
    description:
      'Classes, constructors, properties, inheritance, interfaces, abstract classes, polymorphism, access modifiers.',
    keyPoints: [
      'Prefer composition over deep inheritance',
      'interfaces define contracts without implementation',
      'sealed prevents further inheritance',
    ],
  },
  {
    title: 'Records & Structs',
    route: '/csharp/records',
    badge: 'Core',
    difficulty: 'intermediate',
    time: '20 min',
    description:
      'Immutable record types, record struct, init-only properties, with expressions, value equality.',
    keyPoints: [
      'record gives you value equality for free',
      'with creates a shallow copy with overrides',
      'record struct is a value type — stack allocated',
    ],
  },
  {
    title: 'Generics',
    route: '/csharp/generics',
    badge: 'Core',
    difficulty: 'intermediate',
    time: '25 min',
    description:
      'Generic classes and methods, type constraints (where T :), covariance/contravariance with in/out.',
    keyPoints: [
      'Constraints give compile-time type safety',
      'INumber<T> enables arithmetic on generics (.NET 7+)',
      'default(T) returns null/zero depending on type kind',
    ],
  },
  {
    title: 'Collections',
    route: '/csharp/collections',
    badge: 'Data',
    difficulty: 'beginner',
    time: '30 min',
    description:
      'Array, List<T>, Dictionary<K,V>, HashSet<T>, Queue/Stack, IEnumerable<T>, Span<T>, ImmutableList.',
    keyPoints: [
      'Return IEnumerable<T> from methods for flexibility',
      'Span<T> avoids heap allocation for slices',
      'Dictionary does not guarantee insertion order',
    ],
  },
  {
    title: 'LINQ',
    route: '/csharp/linq',
    badge: 'Data',
    difficulty: 'intermediate',
    time: '35 min',
    description:
      'Where, Select, GroupBy, OrderBy, Join, deferred execution, method vs query syntax, aggregation.',
    keyPoints: [
      'LINQ is lazy — nothing runs until you enumerate',
      'FirstOrDefault() is safer than First()',
      'Chain operators; ToList() only once at the end',
    ],
  },
  {
    title: 'async / await',
    route: '/csharp/async',
    badge: 'Async',
    difficulty: 'intermediate',
    time: '30 min',
    description:
      'async/await, Task<T>, CancellationToken, ConfigureAwait, ValueTask, async streams (IAsyncEnumerable).',
    keyPoints: [
      'async void is only for event handlers',
      'ConfigureAwait(false) prevents deadlocks in libraries',
      'Prefer ValueTask for hot paths that rarely yield',
    ],
  },
  {
    title: 'Null Safety',
    route: '/csharp/null-safety',
    badge: 'Safety',
    difficulty: 'intermediate',
    time: '20 min',
    description:
      'Nullable value types, nullable reference types, ?., ??, ??=, null patterns, ThrowIfNull.',
    keyPoints: [
      'Enable #nullable in .csproj project-wide',
      '! operator suppresses warnings but not runtime errors',
      'ThrowIfNull replaces manual null guard boilerplate',
    ],
  },
  {
    title: 'Pattern Matching',
    route: '/csharp/pattern-matching',
    badge: 'Advanced',
    difficulty: 'advanced',
    time: '25 min',
    description:
      'is patterns, switch expressions, property/positional/list patterns, when guards, and/or/not patterns.',
    keyPoints: [
      'switch expressions are exhaustive by default',
      'Property patterns match named members',
      '_ discard catches everything — put it last',
    ],
  },
  {
    title: 'Exceptions',
    route: '/csharp/exceptions',
    badge: 'Safety',
    difficulty: 'intermediate',
    time: '20 min',
    description:
      'try/catch/finally, exception filters (when), custom exceptions, AggregateException, Result pattern.',
    keyPoints: [
      'Catch specific exceptions before generic ones',
      'throw; (bare) preserves the stack trace',
      'finally always runs — even after a return',
    ],
  },
  {
    title: 'Delegates & Events',
    route: '/csharp/delegates',
    badge: 'Advanced',
    difficulty: 'advanced',
    time: '25 min',
    description:
      'delegate keyword, Func/Action/Predicate, multicast delegates, events, EventHandler<T>, lambda closures.',
    keyPoints: [
      'Prefer Func<>/Action<> over custom delegates',
      'Events are multicast delegates with add/remove',
      'Lambdas close over the variable, not its value',
    ],
  },
];

@Component({
  selector: 'app-csharp-home',
  standalone: true,
  imports: [RouterLink, LowerCasePipe, TitleCasePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class CsharpHome {
  readonly topics = ALL_TOPICS;
}
