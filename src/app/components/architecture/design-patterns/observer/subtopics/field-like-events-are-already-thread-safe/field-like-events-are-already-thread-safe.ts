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
    heading: 'Two Different Subjects on the Same Page, Two Different Answers',
    points: [
      'The main page\'s own thread-safety QnA lists "multiple threads may register observers simultaneously ' +
      'corrupting the list" as a problem to solve with manual locking or <code>Interlocked</code> — but the ' +
      'page has TWO genuinely different Subject implementations, and only ONE of them actually needs that ' +
      'advice.',
      'The "Classic Observer" codeTab\'s <code>StockMarket</code> stores subscribers in a hand-rolled ' +
      '<code>List&lt;IStockObserver&gt;</code> — a plain mutable collection with no built-in synchronization ' +
      'at all. Two threads calling <code>Subscribe()</code> concurrently on this CAN corrupt the list or lose ' +
      'an update; this genuinely needs the manual locking the QnA describes.',
      'The "C# Events" codeTab\'s <code>OrderService.OrderPlaced</code> is a genuine field-like C# event ' +
      '(<code>public event EventHandler&lt;OrderEventArgs&gt;? OrderPlaced;</code>). Since C# 4 (2010), the ' +
      'compiler generates LOCK-FREE, compare-and-swap add/remove accessors for exactly this declaration form ' +
      '— concurrent <code>+=</code>/<code>-=</code> calls from multiple threads are safe by default, with no ' +
      'code the developer has to write.',
    ],
  },
  {
    heading: 'What "Thread-Safe by Default" Does and Doesn\'t Cover',
    points: [
      'The C# 4 guarantee is specifically about the ADD/REMOVE operation itself — the compiler ensures ' +
      '"all add and remove calls will be effectively serial, regardless of the threads the calls take place ' +
      'on" (Microsoft\'s own words describing the change). It does NOT mean the event is somehow globally ' +
      'synchronized with everything else happening in the program.',
      'A thread that captures <code>OrderPlaced</code> into a local variable before calling ' +
      '<code>?.Invoke()</code> (or uses the null-conditional pattern directly) is safe from a DIFFERENT thread ' +
      'unsubscribing mid-invocation, because that specific captured delegate\'s own invocation list is an ' +
      'immutable snapshot — this is the SEPARATE guarantee the main page\'s original QnA phrasing was ' +
      'actually describing ("avoiding modification-during-iteration issues"), distinct from the add/remove ' +
      'race the C# 4 change fixes.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Needs Locking vs. Already Safe',
    language: 'csharp',
    code: `// NEEDS MANUAL SYNCHRONIZATION — a hand-rolled List<T> Subject,
// exactly like the main page's own StockMarket.
public class StockMarket
{
    private readonly List<IStockObserver> _observers = new();
    private readonly object _lock = new();

    public void Subscribe(IStockObserver observer)
    {
        lock (_lock) { _observers.Add(observer); }
        // Without the lock, two threads calling Subscribe()
        // concurrently on a plain List<T> can corrupt its internal
        // state, or one thread's Add() can be silently lost.
    }

    public void Unsubscribe(IStockObserver observer)
    {
        lock (_lock) { _observers.Remove(observer); }
    }
}

// ALREADY SAFE FOR ADD/REMOVE — a genuine field-like C# event,
// exactly like the main page's own OrderService.
public class OrderService
{
    public event EventHandler<OrderEventArgs>? OrderPlaced;
    // No lock needed here. Since C# 4, the compiler generates the
    // add/remove accessors using a lock-free compare-and-swap loop
    // on the backing delegate field — concurrent += / -= calls from
    // any number of threads are serialized correctly by the compiler
    // itself, not by any code you write.
}

// If you decompile OrderService with ildasm/sharplab, the generated
// add accessor looks conceptually like:
// add {
//   EventHandler<OrderEventArgs> current = OrderPlaced;
//   while (true) {
//     var combined = (EventHandler<OrderEventArgs>)Delegate.Combine(current, value);
//     var original = Interlocked.CompareExchange(ref OrderPlaced, combined, current);
//     if (ReferenceEquals(original, current)) break;
//     current = original; // someone else won the race — retry
//   }
// }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own QnA recommends "Use ConcurrentList or lock the list during add/remove but iterate ' +
    'a snapshot during notify." Does <code>OrderService.OrderPlaced</code> (the C# events codeTab) need ANY ' +
    'of this advice applied to it?',
  hint:
    'Separate the TWO different things the QnA is protecting against — corrupting the SUBSCRIBER LIST during ' +
    'concurrent add/remove, versus an observer unsubscribing WHILE a notification loop is iterating.',
  solution:
    'No — for a genuine field-like C# event, NEITHER concern needs manual code. Concurrent add/remove is ' +
    'handled by the compiler\'s own compare-and-swap accessors (since C# 4). And "iterating during ' +
    'modification" doesn\'t apply the same way it does to a <code>List&lt;T&gt;</code> either: invoking an ' +
    'event captures ONE specific delegate reference, whose own invocation list is immutable — a concurrent ' +
    'subscribe/unsubscribe changes what the EVENT FIELD points to next time, but never mutates the delegate ' +
    'object already captured for an in-flight <code>Invoke()</code> call. This advice is specifically for ' +
    'the OTHER codeTab\'s hand-rolled <code>List&lt;IStockObserver&gt;</code>, which has neither guarantee.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'C# events have always been thread-safe for concurrent subscribe/unsubscribe — that\'s just how ' +
      'delegates work.',
    reality:
      'This was NOT always true. Before C# 4 (2010), the compiler generated add/remove accessors that took a ' +
      '<code>lock (this)</code> — a genuinely bad pattern (locking on a publicly-reachable object risks ' +
      'deadlocks) that Microsoft\'s own compiler team explicitly moved away from. The CURRENT lock-free ' +
      'compare-and-swap behavior is a specific, dateable C# 4 compiler change, not an inherent property of ' +
      'delegates that has always held.',
  },
  {
    thought: 'Since C# events are thread-safe by default, the main page\'s own StockMarket (List-based) ' +
      'Subject is just an inferior, outdated way to write Observer that should always be replaced with ' +
      'events.',
    reality:
      'A hand-rolled interface-based Subject like <code>StockMarket</code> has real advantages events don\'t: ' +
      'it can expose ADDITIONAL methods beyond subscribe/notify (e.g. querying current subscriber count), ' +
      'support MULTIPLE distinct notification methods on one observer interface without needing a separate ' +
      'event per method, and doesn\'t require every subscriber to match a specific delegate signature. The ' +
      'thread-safety difference is a real trade-off to know about, not a reason to always prefer one over the ' +
      'other.',
  },
];

@Component({
  selector: 'app-observer-field-like-events-are-already-thread-safe',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './field-like-events-are-already-thread-safe.html',
  styleUrl: './field-like-events-are-already-thread-safe.scss',
})
export class FieldLikeEventsAreAlreadyThreadSafeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
