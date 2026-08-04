import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Theory Bullet That Grouped Two Different Situations Together',
    points: [
      'The main page\'s ".NET Examples" section originally listed ' +
      '"<code>IEnumerable&lt;T&gt;</code> adapters for <code>IQueryable&lt;T&gt;</code>, ' +
      '<code>IObservable&lt;T&gt;</code>" as one bullet — implying both interfaces need an Adapter to work ' +
      'with <code>IEnumerable&lt;T&gt;</code>. Only one of them actually does.',
      '<code>IQueryable&lt;T&gt;</code> is declared as ' +
      '<code>IQueryable&lt;T&gt; : IEnumerable&lt;T&gt;, IQueryable, IEnumerable</code> — it extends ' +
      '<code>IEnumerable&lt;T&gt;</code> directly through ordinary interface inheritance. Anything that is an ' +
      '<code>IQueryable&lt;T&gt;</code> already IS an <code>IEnumerable&lt;T&gt;</code>, with zero translation ' +
      'code required — that is what interface inheritance means.',
      '<code>IObservable&lt;T&gt;</code>, by contrast, shares NO inheritance relationship with ' +
      '<code>IEnumerable&lt;T&gt;</code> at all — they are two genuinely different, incompatible contracts, ' +
      'which is precisely the situation the Adapter pattern exists for.',
    ],
  },
  {
    heading: 'Why IQueryable<T> Needs No Adapter',
    points: [
      'Every LINQ method available on <code>IEnumerable&lt;T&gt;</code> is therefore also callable directly on ' +
      'any <code>IQueryable&lt;T&gt;</code> value — no wrapper class, no translation method, nothing to write. ' +
      'The compiler treats the assignment as a plain interface-to-base-interface conversion.',
      'What makes <code>IQueryable&lt;T&gt;</code> DIFFERENT from <code>IEnumerable&lt;T&gt;</code> is not a ' +
      'different set of members to translate — it is that its LINQ operators build an ' +
      '<code>Expression</code> tree instead of running eagerly, so a provider (EF Core, for example) can turn ' +
      'the whole query into SQL. That is a different EXECUTION STRATEGY behind the same inherited interface, ' +
      'not an interface mismatch Adapter would solve.',
    ],
  },
  {
    heading: 'Why IObservable<T> Genuinely Does',
    points: [
      '<code>IEnumerable&lt;T&gt;</code> is PULL-based: the consumer calls <code>MoveNext()</code> to ask for ' +
      'the next value, on its own schedule. <code>IObservable&lt;T&gt;</code> is PUSH-based: the producer calls ' +
      '<code>OnNext()</code> on every subscriber whenever a new value exists, on the producer\'s own schedule. ' +
      'These are structurally opposite control flows — genuinely incompatible interfaces, the textbook Adapter ' +
      'situation.',
      'Rx.NET\'s own <code>Observable.ToEnumerable()</code> and <code>Enumerable.ToObservable()</code> are real ' +
      'Adapters bridging these two models — internally, <code>ToEnumerable()</code> wraps a subscription that ' +
      'buffers pushed values into a blocking queue a pull-based enumerator can then read from at its own pace.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Real Adapter: Push to Pull',
    language: 'csharp',
    code: `// IObservable<T> (push) genuinely needs an adapter to become
// IEnumerable<T> (pull) — there is no inheritance relationship to lean on.
using System.Collections.Concurrent;

public sealed class ObservableToEnumerableAdapter<T> : IEnumerable<T>
{
    private readonly IObservable<T> _source;
    public ObservableToEnumerableAdapter(IObservable<T> source) => _source = source;

    public IEnumerator<T> GetEnumerator()
    {
        var buffer = new BlockingCollection<T>();

        // Push side: every OnNext() call enqueues a value for the pull side to read.
        using var subscription = _source.Subscribe(
            onNext:  value => buffer.Add(value),
            onError: _     => buffer.CompleteAdding(),
            onCompleted:   () => buffer.CompleteAdding());

        // Pull side: GetConsumingEnumerable() blocks until a value is pushed,
        // or stops once CompleteAdding() has been called.
        foreach (var item in buffer.GetConsumingEnumerable())
            yield return item;
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();
}

// Usage — a push-based stream, consumed with an ordinary pull-based foreach
IObservable<int> ticks = Observable.Interval(TimeSpan.FromSeconds(1)).Select(i => (int)i);
foreach (var tick in new ObservableToEnumerableAdapter<int>(ticks).Take(3))
    Console.WriteLine(tick); // blocks between each value, exactly like Rx.NET's own ToEnumerable()`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A junior developer proposes writing an "IQueryableToEnumerableAdapter" class, arguing that ' +
    '<code>IQueryable&lt;T&gt;</code> and <code>IEnumerable&lt;T&gt;</code> are different interfaces so ' +
    'converting between them must need an Adapter, the same way ' +
    '<code>IObservable&lt;T&gt;</code>-to-<code>IEnumerable&lt;T&gt;</code> does. What is wrong with the ' +
    'premise?',
  hint:
    'Check the actual interface declaration: does <code>IQueryable&lt;T&gt;</code> implement ' +
    '<code>IEnumerable&lt;T&gt;</code>, or merely resemble it?',
  solution:
    'IQueryable<T> is declared as IQueryable<T> : IEnumerable<T>, IQueryable, IEnumerable — it directly ' +
    'extends IEnumerable<T> through interface inheritance, so every IQueryable<T> value already IS an ' +
    'IEnumerable<T> value with no conversion needed at all; you can assign one to the other directly. This is ' +
    'completely different from IObservable<T>, which shares no inheritance relationship with IEnumerable<T> — ' +
    'the two interfaces are genuinely incompatible, which is exactly the situation Adapter exists to solve. ' +
    'The junior developer is treating "these are two different interface NAMES" as equivalent to "these are ' +
    'two INCOMPATIBLE interfaces," but inheritance already makes IQueryable<T> compatible with IEnumerable<T> ' +
    'without any adapter at all.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Any two interfaces with different names and different intended use cases need an Adapter to ' +
      'convert between them.',
    reality:
      'Whether an Adapter is needed depends on whether the interfaces are actually INCOMPATIBLE at the ' +
      'member-signature level — not on whether they have different names or serve different conceptual ' +
      'purposes. <code>IQueryable&lt;T&gt;</code> and <code>IEnumerable&lt;T&gt;</code> serve very different ' +
      'purposes (deferred, translatable queries vs. immediate in-memory iteration) but share full member ' +
      'compatibility through inheritance, so no Adapter is needed at all.',
  },
  {
    thought: 'IQueryable&lt;T&gt; is "basically the same as" IEnumerable&lt;T&gt;, just with LINQ providers ' +
      'attached.',
    reality:
      'Structurally it is not just "the same interface plus extras" — its LINQ extension methods build an ' +
      'Expression tree instead of running eagerly, which is what lets a provider translate the whole query ' +
      'into SQL before anything executes. The member compatibility with IEnumerable&lt;T&gt; comes from direct ' +
      'inheritance; the different EXECUTION behavior comes from a different set of LINQ extension methods ' +
      'being selected by the compiler, a separate mechanism from the interface relationship itself.',
  },
  {
    thought: 'Push-based and pull-based data sources are just two implementation details of the same idea, ' +
      'interchangeable at will.',
    reality:
      'They represent genuinely opposite control flows: pull means the CONSUMER decides when the next value ' +
      'is retrieved; push means the PRODUCER decides when the next value is delivered. Converting between them ' +
      'always requires some kind of buffering or blocking mechanism (as the BlockingCollection above shows) — ' +
      'it is real translation work, not a cosmetic difference, which is why it is the genuine Adapter case on ' +
      'this page.',
  },
];

@Component({
  selector: 'app-adapter-iobservable-vs-iqueryable-real-adapter-need',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './iobservable-vs-iqueryable-real-adapter-need.html',
  styleUrl: './iobservable-vs-iqueryable-real-adapter-need.scss',
})
export class IobservableVsIqueryableRealAdapterNeedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
