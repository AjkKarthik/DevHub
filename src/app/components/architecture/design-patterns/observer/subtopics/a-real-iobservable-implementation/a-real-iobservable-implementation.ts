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
    heading: 'Named Twice, Shown Nowhere',
    points: [
      'The main page\'s own quick reference lists <code>IObservable&lt;T&gt;</code> as a term, and its theory ' +
      'section has an entire dedicated heading, "IObservable&lt;T&gt; / IObserver&lt;T&gt;: Reactive ' +
      'Observer," describing <code>OnNext</code>, <code>OnError</code>, and <code>OnCompleted</code>. Neither ' +
      'codeTab on the page actually implements this protocol — both use either a hand-rolled interface ' +
      '(<code>IStockObserver</code>) or C# events, never the .NET-standard reactive interfaces themselves.',
      '<code>IObservable&lt;T&gt;</code> and <code>IObserver&lt;T&gt;</code> are BUILT-IN .NET interfaces (in ' +
      '<code>System</code>), not something you need a library for — Rx.NET adds LINQ-style OPERATORS on top ' +
      'of them, but the base protocol itself ships in the framework and can be implemented directly with zero ' +
      'dependencies.',
    ],
  },
  {
    heading: 'The Three Callbacks and the Completion Contract',
    points: [
      '<code>IObserver&lt;T&gt;</code> declares exactly three methods: <code>OnNext(T value)</code> (a new ' +
      'value arrived), <code>OnError(Exception error)</code> (the stream failed), and ' +
      '<code>OnCompleted()</code> (the stream ended normally, no more values will ever arrive).',
      'The interface\'s own documented contract (the "Rx Design Guidelines") specifies that after either ' +
      '<code>OnError</code> or <code>OnCompleted</code> is called, NO further calls to that observer are ' +
      'made — this is the "grammar" of an Observable sequence: <code>OnNext*</code> (zero or more), followed ' +
      'by at most one of <code>OnError</code> or <code>OnCompleted</code>.',
      'This grammar is exactly what distinguishes <code>IObservable&lt;T&gt;</code> from the main page\'s own ' +
      'hand-rolled <code>IStockObserver</code>: <code>IStockObserver.OnPriceChanged</code> has no equivalent ' +
      'of "the stream is now permanently done" — a C# event similarly has no built-in notion of ' +
      '"unsubscribe everyone, this will never fire again."',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Minimal IObservable<T> Subject',
    language: 'csharp',
    code: `// A minimal, dependency-free Subject implementing the actual
// .NET-standard IObservable<T> / IObserver<T> protocol — the thing
// the main page names but never builds.
public class PriceStream : IObservable<decimal>
{
    private readonly List<IObserver<decimal>> _observers = new();
    private bool _completed;

    public IDisposable Subscribe(IObserver<decimal> observer)
    {
        if (_completed)
        {
            // Per the grammar: a late subscriber to an already-completed
            // stream should immediately receive OnCompleted, not silently
            // never hear from the stream again.
            observer.OnCompleted();
            return System.Reactive.Disposables.Disposable.Empty;
        }
        _observers.Add(observer);
        return new Unsubscriber(_observers, observer);
    }

    public void Publish(decimal price)
    {
        if (_completed) return; // grammar: no OnNext after completion
        foreach (var obs in _observers.ToList())
            obs.OnNext(price);
    }

    public void Complete()
    {
        if (_completed) return;
        _completed = true;
        foreach (var obs in _observers.ToList())
            obs.OnCompleted(); // grammar: exactly once, terminal
        _observers.Clear();
    }

    // Subscribe() itself returns an IDisposable — the standard way an
    // IObservable<T> subscriber unsubscribes (Dispose() instead of -=).
    private sealed class Unsubscriber(List<IObserver<decimal>> observers, IObserver<decimal> observer)
        : IDisposable
    {
        public void Dispose() => observers.Remove(observer);
    }
}

// A concrete IObserver<decimal>
public class PriceLoggerObserver : IObserver<decimal>
{
    public void OnNext(decimal price) => Console.WriteLine($"price: {price:C}");
    public void OnError(Exception error) => Console.WriteLine($"stream failed: {error.Message}");
    public void OnCompleted() => Console.WriteLine("stream ended — no more prices will arrive");
}

// Usage
var stream = new PriceStream();
var subscription = stream.Subscribe(new PriceLoggerObserver());

stream.Publish(100m);
stream.Publish(105m);
stream.Complete(); // "stream ended — no more prices will arrive"

subscription.Dispose(); // idiomatic IObservable<T> unsubscribe`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If a new observer calls <code>stream.Subscribe(...)</code> AFTER <code>stream.Complete()</code> has ' +
    'already run, what does <code>PriceStream.Subscribe()</code> above do, and why does that matter for ' +
    'correctness compared to a plain C# event?',
  hint:
    'Check the very first lines of <code>Subscribe()</code> — what does it do differently when ' +
    '<code>_completed</code> is already true?',
  solution:
    'It immediately calls observer.OnCompleted() on the new subscriber and returns without ever adding it to ' +
    '_observers. This matters because the IObservable grammar guarantees every observer eventually learns ' +
    'the stream is done — a late subscriber still gets told, rather than silently hanging with no further ' +
    'information. A plain C# event has no equivalent: subscribing to an event AFTER the publisher has ' +
    'logically "finished" just means the new handler is registered but will simply never be invoked again, ' +
    'with nothing in the event mechanism itself communicating that the stream is over.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'IObservable<T> is basically the same thing as a C# event with extra steps — Subscribe() instead ' +
      'of +=.',
    reality:
      'The mechanical similarity (register a callback, get notified) hides a real semantic difference: ' +
      '<code>IObservable&lt;T&gt;</code> has a formal, three-state grammar (values, then an explicit ' +
      'terminal error-or-complete signal) that a plain event has no equivalent of. This is exactly what lets ' +
      'Rx.NET build operators like <code>TakeUntil</code> or <code>Concat</code> that need to know a sequence ' +
      'has genuinely ended — there is no reliable "this event will never fire again" signal to build the same ' +
      'operators on top of a bare C# event.',
  },
  {
    thought: 'You need to install the Rx.NET NuGet package to implement IObservable<T> — it\'s a ' +
      'third-party interface.',
    reality:
      '<code>IObservable&lt;T&gt;</code> and <code>IObserver&lt;T&gt;</code> are part of the base class ' +
      'library (<code>System</code> namespace) — the subject implemented above needs no external package at ' +
      'all. Rx.NET is a SEPARATE library that adds LINQ-style operators (<code>Select</code>, ' +
      '<code>Where</code>, <code>Throttle</code>, ...) on top of the base interfaces — you can implement and ' +
      'consume plain <code>IObservable&lt;T&gt;</code> with zero dependencies, exactly as shown above.',
  },
];

@Component({
  selector: 'app-observer-a-real-iobservable-implementation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-iobservable-implementation.html',
  styleUrl: './a-real-iobservable-implementation.scss',
})
export class ARealIobservableImplementationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
