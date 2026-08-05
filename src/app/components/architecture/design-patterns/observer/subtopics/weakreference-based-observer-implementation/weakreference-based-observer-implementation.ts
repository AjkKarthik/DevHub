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
    heading: 'Discussed Twice in Prose, Never Once in Code',
    points: [
      'The main page has TWO separate QnAs about WeakReference-based Observer: one names it as one of three ' +
      '"approaches" to avoiding memory leaks, the other explains at length WHY it avoids leaks without ' +
      'requiring callers to unsubscribe, and its exact trade-off. Neither codeTab on the page shows what this ' +
      'actually looks like in code.',
      'The core idea: instead of the Subject storing a STRONG reference to each observer (which is what keeps ' +
      'a forgotten, un-unsubscribed observer alive forever), it stores a <code>WeakReference&lt;T&gt;</code> ' +
      'to each observer instead — a reference the garbage collector is free to ignore when deciding what is ' +
      'still reachable.',
    ],
  },
  {
    heading: 'The Trade-off the Main Page\'s Own QnA Names, Made Concrete',
    points: [
      'The page\'s own second QnA states the trade-off precisely: this "shifts a deterministic bug... into a ' +
      'non-deterministic one." A forgotten <code>Unsubscribe()</code> call with a STRONG reference is a ' +
      'reliable, reproducible leak you can catch with a memory profiler every time. A WeakReference-based ' +
      'Subject instead makes notifications silently stop arriving whenever the GC HAPPENS to collect the ' +
      'observer — which could be immediately, or could be much later, depending on memory pressure and GC ' +
      'timing that a unit test has no reliable control over.',
      'A WeakReference-based Subject also needs one thing a strong-reference Subject does not: some way to ' +
      'notice and clean up dead (already-collected) entries in its own observer list, or the list grows ' +
      'forever with entries that will never fire again — trading a memory leak of LIVE observers for a much ' +
      'smaller, bounded leak of dead <code>WeakReference&lt;T&gt;</code> wrapper objects until cleanup runs.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'WeakReference-Based Subject',
    language: 'csharp',
    code: `// A Subject that does NOT keep its observers alive — matching the
// main page's own two QnAs on this technique, made concrete.
public class WeakStockMarket
{
    private readonly List<WeakReference<IStockObserver>> _observers = new();

    public void Subscribe(IStockObserver observer) =>
        _observers.Add(new WeakReference<IStockObserver>(observer));
    // Note: there is no Unsubscribe() call anywhere in this usage
    // example below — that is the entire point of this variant.

    public void UpdatePrice(string ticker, decimal price)
    {
        // Iterate a copy — the same "safe during notification" rule
        // as the main page's own List<IStockObserver> Subject.
        foreach (var weakRef in _observers.ToList())
        {
            if (weakRef.TryGetTarget(out var observer))
                observer.OnPriceChanged(ticker, price);
            else
                _observers.Remove(weakRef); // already collected — prune it
        }
    }
}

// Demonstrating the trade-off directly.
var market = new WeakStockMarket();

void SubscribeATemporaryObserver()
{
    var logger = new PriceLogger(); // no other reference kept anywhere
    market.Subscribe(logger);
    // logger goes out of scope the instant this method returns —
    // with a STRONG-reference Subject, it would live forever inside
    // market's own observer list from this point on.
}

SubscribeATemporaryObserver();
GC.Collect();               // force collection to make the timing
GC.WaitForPendingFinalizers(); // deterministic for this demonstration

market.UpdatePrice("AAPL", 200m);
// Prints NOTHING for the collected logger — TryGetTarget returns
// false, the dead entry is silently pruned, and no exception or
// warning is raised anywhere. Compare this to a strong-reference
// Subject, where the exact same code would still print the logger's
// output, because market itself was keeping logger alive.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'If <code>GC.Collect()</code> were NOT called in the usage example above (i.e. just ordinary program ' +
    'execution, no forced collection), would <code>market.UpdatePrice(...)</code> reliably print nothing for ' +
    'the temporary logger?',
  hint:
    'Think about what the main page\'s own QnA specifically calls out as the trade-off of this technique — ' +
    'is GC timing something a program can rely on happening at a specific moment?',
  solution:
    'No — without forcing collection, the outcome becomes genuinely UNRELIABLE. The .NET garbage collector ' +
    'runs on its own schedule, driven by memory pressure and internal heuristics, not by when an object ' +
    'becomes eligible for collection. The logger MIGHT still be alive (and still print) the next instant, or ' +
    'it might already be gone — there is no guarantee either way without an explicit forced collection like ' +
    'the demonstration uses. This unreliability is exactly the "non-deterministic" trade-off the main page\'s ' +
    'own QnA names: the technique trades a reliably-reproducible leak for a timing-dependent one that is ' +
    'much harder to write a deterministic test against.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'A WeakReference-based Subject is a strictly better default than remembering to call ' +
      'Unsubscribe() — why wouldn\'t you always use it?',
    reality:
      'The main page\'s own QnA is explicit that most teams prefer EXPLICIT unsubscription (disposables, ' +
      '<code>-=</code>) specifically BECAUSE the failure mode is more predictable. A missed ' +
      '<code>Unsubscribe()</code> call with a strong reference is a bug you can catch reliably, every time, ' +
      'with a memory profiler. A WeakReference-based Subject trades that for a bug (a notification silently ' +
      'never arriving) that depends on exactly when the GC happens to run — often HARDER to track down in ' +
      'production, not easier.',
  },
  {
    thought: 'Calling GC.Collect() in the demonstration code above is standard, safe production practice for ' +
      'a WeakReference-based Subject to use internally.',
    reality:
      'It is a demonstration-only technique used here specifically to make an otherwise non-deterministic ' +
      'timing outcome reproducible for this example. Forcing a full garbage collection in real production ' +
      'code is generally discouraged — it defeats the GC\'s own performance tuning and forces expensive, ' +
      'unnecessary collection work. A production <code>WeakStockMarket</code> would simply let the GC run on ' +
      'its own normal schedule and accept the resulting non-determinism as the trade-off it is.',
  },
];

@Component({
  selector: 'app-observer-weakreference-based-observer-implementation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './weakreference-based-observer-implementation.html',
  styleUrl: './weakreference-based-observer-implementation.scss',
})
export class WeakreferenceBasedObserverImplementationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
