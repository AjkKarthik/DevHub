import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Intent',     type: 'keyword',   desc: 'Define a one-to-many dependency so that when one object changes state, all dependents are notified automatically.' },
  { name: 'Subject',    type: 'class',     desc: 'The observable — maintains a list of observers and notifies them on state changes.' },
  { name: 'Observer',   type: 'interface', desc: 'Declares the Update() method called by the Subject when it changes state.' },
  { name: 'IObservable<T>', type: 'interface', desc: '.NET reactive push-based observer protocol — subscriber receives OnNext, OnError, OnCompleted.' },
  { name: 'event/delegate', type: 'keyword', desc: 'C# events are the idiomatic Observer: publisher raises event; subscribers handle it.' },
  { name: 'Loose Coupling', type: 'keyword', desc: 'Subject knows only IObserver — observers can be added/removed at runtime without changing the subject.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Observer Pattern?',
    points: [
      'Observer defines a one-to-many relationship: when the Subject changes state, all registered Observers are notified.',
      'The Subject maintains a list of observers; observers register/unregister at runtime.',
      'Subject knows only the IObserver interface — it doesn\'t know anything about concrete observers.',
      'Observers react independently — adding or removing an observer does not affect others.',
    ],
  },
  {
    heading: 'C# Events: The Idiomatic Observer',
    points: [
      'C# events are a language-level implementation of Observer — delegate multicast + add/remove syntax.',
      'Publisher declares an event; subscribers add handlers with +=; unsubscribe with -=.',
      'EventHandler<TEventArgs> is the standard delegate for .NET events.',
      'Events enforce that only the publisher can raise the event; observers can only subscribe.',
    ],
  },
  {
    heading: 'IObservable<T> / IObserver<T>: Reactive Observer',
    points: [
      'IObservable<T>: the Subject — has Subscribe(IObserver<T>).',
      'IObserver<T>: declares OnNext(T), OnError(Exception), OnCompleted().',
      'Reactive Extensions (Rx.NET) builds LINQ-style operators on top of IObservable<T>.',
      'Ideal for async event streams: HTTP responses, UI events, sensor data, stock prices.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'C# events: Button.Click, Form.Load, HttpClient pipeline events.',
      'INotifyPropertyChanged: WPF/MAUI property binding — implements Observer via PropertyChanged event.',
      'Rx.NET: Observable.FromEventPattern, Observable.Interval for time-based streams.',
      'SignalR: server-side hub pushes to all subscribed clients — Observer over network.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Classic Observer',
    language: 'csharp',
    code: `// Observer interface
public interface IStockObserver
{
    void OnPriceChanged(string ticker, decimal price);
}

// Subject
public class StockMarket
{
    private readonly Dictionary<string, decimal> _prices = new();
    private readonly List<IStockObserver>         _observers = new();

    public void Subscribe(IStockObserver observer)   => _observers.Add(observer);
    public void Unsubscribe(IStockObserver observer) => _observers.Remove(observer);

    public void UpdatePrice(string ticker, decimal price)
    {
        _prices[ticker] = price;
        NotifyAll(ticker, price);
    }

    private void NotifyAll(string ticker, decimal price)
    {
        foreach (var obs in _observers.ToList()) // ToList: safe if observer unsubscribes during notification
            obs.OnPriceChanged(ticker, price);
    }
}

// Concrete Observers
public class PriceAlertService(string ticker, decimal threshold) : IStockObserver
{
    public void OnPriceChanged(string t, decimal price)
    {
        if (t == ticker && price > threshold)
            Console.WriteLine($"ALERT: {ticker} hit {price} (threshold: {threshold})");
    }
}

public class PriceLogger : IStockObserver
{
    public void OnPriceChanged(string ticker, decimal price) =>
        Console.WriteLine($"LOG: {ticker} = {price:C}");
}

// Usage
var market = new StockMarket();
market.Subscribe(new PriceLogger());
market.Subscribe(new PriceAlertService("AAPL", 200m));

market.UpdatePrice("AAPL", 195m);
market.UpdatePrice("AAPL", 205m); // triggers alert`,
  },
  {
    label: 'C# Events',
    language: 'csharp',
    code: `// C# events: idiomatic Observer in .NET
public class OrderService
{
    // Publisher: declares event with strongly-typed args
    public event EventHandler<OrderEventArgs>? OrderPlaced;
    public event EventHandler<OrderEventArgs>? OrderShipped;

    public async Task<Order> PlaceOrderAsync(CartSummary cart)
    {
        var order = await CreateOrderAsync(cart);

        // Raise event — notifies all subscribers
        OrderPlaced?.Invoke(this, new OrderEventArgs(order));
        return order;
    }
}

public record OrderEventArgs(Order Order) : EventArgs;

// Subscribers — can be added/removed at runtime
public class EmailNotifier
{
    public void OnOrderPlaced(object? sender, OrderEventArgs e) =>
        Console.WriteLine($"Email: Order {e.Order.Id} confirmed");
}

public class AnalyticsTracker
{
    public void OnOrderPlaced(object? sender, OrderEventArgs e) =>
        Console.WriteLine($"Analytics: order tracked {e.Order.Id}");
}

// Wire up
var orderService = new OrderService();
var emailer      = new EmailNotifier();
var analytics    = new AnalyticsTracker();

orderService.OrderPlaced += emailer.OnOrderPlaced;
orderService.OrderPlaced += analytics.OnOrderPlaced;

// INotifyPropertyChanged — Observer for WPF/MAUI binding
public class ProductViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    private decimal _price;
    public decimal Price
    {
        get => _price;
        set { _price = value; PropertyChanged?.Invoke(this, new(nameof(Price))); }
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not unsubscribing from events — memory leaks',
    wrong: `orderService.OrderPlaced += emailer.OnOrderPlaced;
// emailer is now held alive by orderService even after emailer "goes away"`,
    right: `// Unsubscribe when the observer is no longer needed
orderService.OrderPlaced -= emailer.OnOrderPlaced;
// Or use WeakReference<T>, or IDisposable subscription tokens`,
    explanation: 'In .NET, event subscriptions keep the subscriber alive via the delegate chain — this is one of the most common memory leak sources. Always unsubscribe when the observer\'s lifetime ends.',
  },
  {
    title: 'Iterating the observer list without a copy during notification',
    wrong: `foreach (var obs in _observers)
    obs.OnPriceChanged(ticker, price); // observer may unsubscribe mid-loop → InvalidOperationException`,
    right: `foreach (var obs in _observers.ToList()) // copy — safe for concurrent unsubscription
    obs.OnPriceChanged(ticker, price);`,
    explanation: 'Observers can unsubscribe themselves in response to a notification (e.g., "one-shot" observers). Iterating the original list while it is being modified throws. Always iterate a copy.',
  },
  {
    title: 'Subject knowing about concrete observer types',
    wrong: `private readonly List<EmailNotifier> _notifiers; // coupled to concrete type`,
    right: `private readonly List<IStockObserver> _observers; // only knows the interface`,
    explanation: 'The Subject must know only the IObserver interface. Coupling to concrete observer types defeats loose coupling — the Subject now depends on all observer implementations.',
  },
  {
    title: 'Raising events without null check',
    wrong: `OrderPlaced.Invoke(this, new OrderEventArgs(order)); // NullReferenceException if no subscribers`,
    right: `OrderPlaced?.Invoke(this, new OrderEventArgs(order)); // null-conditional: safe with 0 subscribers`,
    explanation: 'If no subscribers have been added, the event delegate is null. Always use ?.Invoke() (null-conditional) or check for null before invoking. This is a very common C# bug.',
  },
];

const challenge: Challenge = {
  title: 'Weather Station',
  language: 'typescript',
  description: `Implement Observer for a weather station.
IWeatherObserver has update(temp, humidity).
WeatherStation (Subject) maintains observers and notifies on data change.
Add TemperatureDisplay and HumidityAlert as concrete observers.`,
  hints: [
    'WeatherStation has subscribe/unsubscribe/notify methods',
    'TemperatureDisplay logs every update',
    'HumidityAlert only logs when humidity > 80',
  ],
  starterCode: `interface IWeatherObserver {
  update(temp: number, humidity: number): void;
}

class WeatherStation {
  private observers: IWeatherObserver[] = [];
  private temp = 0; private humidity = 0;

  subscribe(o: IWeatherObserver): void { this.observers.push(o); }
  unsubscribe(o: IWeatherObserver): void {
    this.observers = this.observers.filter(x => x !== o);
  }
  // TODO: setWeather(temp, humidity) and notify all observers
}

// TODO: TemperatureDisplay, HumidityAlert`,
  solution: `interface IWeatherObserver {
  update(temp: number, humidity: number): void;
}

class WeatherStation {
  private observers: IWeatherObserver[] = [];
  private temp = 0; private humidity = 0;

  subscribe(o: IWeatherObserver): void { this.observers.push(o); }
  unsubscribe(o: IWeatherObserver): void {
    this.observers = this.observers.filter(x => x !== o);
  }

  setWeather(temp: number, humidity: number): void {
    this.temp = temp; this.humidity = humidity;
    for (const o of [...this.observers]) o.update(temp, humidity);
  }
}

class TemperatureDisplay implements IWeatherObserver {
  update(temp: number, _: number): void {
    console.log(\`Display: Temperature is \${temp}°C\`);
  }
}

class HumidityAlert implements IWeatherObserver {
  update(_: number, humidity: number): void {
    if (humidity > 80) console.log(\`ALERT: High humidity \${humidity}%!\`);
  }
}

const station = new WeatherStation();
station.subscribe(new TemperatureDisplay());
station.subscribe(new HumidityAlert());
station.setWeather(22, 65); // Display only
station.setWeather(30, 90); // Display + Alert`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'In C#, what happens if you invoke an event that has no subscribers?',
    options: [
      'Nothing — C# automatically handles null events',
      'NullReferenceException — the event delegate is null with no subscribers',
      'An empty collection is iterated with no side effects',
      'The event is queued for the next subscriber that registers',
    ],
    answer: 1,
    explanation: 'An event with no subscribers is null in C#. Calling `OrderPlaced.Invoke(...)` throws NullReferenceException. Use `OrderPlaced?.Invoke(...)` (null-conditional) to safely handle zero subscribers.',
  },
  {
    q: 'What is the most common memory leak pattern caused by Observer in .NET?',
    options: [
      'Creating too many observer instances',
      'Not unsubscribing from events — the subject holds a strong reference to the subscriber via the delegate',
      'Using IObservable<T> instead of events',
      'Having more than 10 subscribers to a single event',
    ],
    answer: 1,
    explanation: 'Event subscriptions (+=) add the subscriber\'s delegate to the event\'s invocation list, keeping a strong reference to the subscriber alive. If you never unsubscribe (-=), the subject keeps the subscriber alive even after it should be garbage-collected.',
  },
  {
    q: 'INotifyPropertyChanged in .NET implements which pattern?',
    options: ['Command', 'Mediator', 'Observer', 'Strategy'],
    answer: 2,
    explanation: 'INotifyPropertyChanged is Observer — the ViewModel (Subject) raises the PropertyChanged event; WPF/MAUI bindings (Observers) subscribe and update the UI. This is the foundation of MVVM data binding in .NET.',
  },
  { q: 'What is the Observer pattern and what relationship does it define?', options: ['A monitoring pattern for recording system metrics and logs', 'A behavioral pattern defining a one-to-many dependency where changes in the subject automatically notify and update all registered observers', 'A surveillance pattern for monitoring user actions in an application', 'A pattern for watching file system changes and triggering rebuild scripts'], answer: 1, explanation: 'Observer defines a one-to-many dependency: one subject (publisher/observable) and many observers (subscribers/listeners). When the subject state changes, all registered observers are notified automatically. Core operations: subscribe(observer) adds an observer, unsubscribe(observer) removes one, notify() iterates all observers and calls update(). This decouples the subject from knowledge of which observers exist or how many. Observers self-register; the subject just notifies. Used everywhere: event systems, reactive programming, MVC (model notifies views), message queues, and GUI event listeners.' },
  { q: 'What is the difference between push and pull models in the Observer pattern?', options: ['Push sends notifications in real time; pull checks for updates on a timer', 'Push: the subject sends detailed change data directly in the notification call; pull: the subject sends only a notification and observers query the subject for details', 'Push is asynchronous; pull is synchronous', 'Push allows filtering notifications; pull forces observers to receive all notifications'], answer: 1, explanation: 'Push model: subject calls observer.update(changedData) passing the relevant data directly. Efficient: observers receive exactly what changed without querying. Drawback: subject must know what data each observer needs; may send unnecessary data to some observers. Pull model: subject calls observer.update(this) passing a reference to itself. Observers call subject.getData() to fetch what they need. Decoupled: subject does not know what data each observer cares about. Drawback: observers may call multiple methods on the subject. Hybrid: pass the event type in the notification; observers pull full data only if interested in that event type.' },
  { q: 'What is the difference between Observer pattern and an Event Bus?', options: ['They are identical; the terms are interchangeable', 'Observer pattern: the subject directly references observers; Event Bus: publisher and subscriber are fully decoupled via a central message broker', 'Event Bus is synchronous; Observer is always asynchronous', 'Observer is for single-process systems; Event Bus is for distributed systems only'], answer: 1, explanation: 'Classic Observer: the subject holds direct references to registered observers and calls them. Publisher knows (references) its subscribers. Tight(er) coupling. Event Bus (publish/subscribe): publishers emit events to a bus/broker by topic. Subscribers register interest in topics on the bus. Publisher and subscriber do not know each other; all coupling goes through the bus. The bus can persist events, route to multiple subscribers, and support async delivery. Event Bus is Observer with an intermediary that fully decouples publisher from subscriber. Both implement the same conceptual publish/subscribe behavior at different coupling levels.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use IObservable<T> vs C# events?',
    a: 'Use C# events for simple notifications with a few well-known event types (Button.Click, OrderPlaced). Use IObservable<T> for complex async event streams where you need LINQ-style composition (filter, throttle, merge, buffer) — Rx.NET shines for sensor streams, real-time data, and complex UI interactions.',
  },
  {
    q: 'How do I avoid memory leaks with event subscriptions?',
    a: 'Three approaches: (1) always unsubscribe in Dispose() — implement IDisposable; (2) use WeakReference<T> event handlers so the subscriber can be garbage-collected even when subscribed; (3) for IObservable<T>, Subscribe() returns an IDisposable — dispose it when done. Rx.NET CompositeDisposable helps manage multiple subscriptions.',
  },
  { q: 'How do you prevent memory leaks with the Observer pattern?', a: 'Memory leaks occur when observers register but never unregister. The subject holds strong references to all observers, preventing garbage collection. Solutions: always unsubscribe in the cleanup/disposal logic. In C# events, use -= to detach. In Angular, store Subscriptions and call unsubscribe() in ngOnDestroy. Weak reference observers: the subject holds WeakReference to observers; if an observer is garbage collected (no other references), the weak reference expires and the dead observer is cleaned up on next notification. Filter dead weak references before notifying. In RxJS, use takeUntil(this.destroy$) or AsyncPipe which auto-unsubscribes. Event aggregators in frameworks often provide automatic cleanup hooks.' },
  { q: 'How does the Observer pattern relate to Reactive Programming (RxJS, Reactor)?', a: 'Reactive programming libraries (RxJS in JavaScript, Reactor in Java, RxPY in Python) formalize and extend the Observer pattern. Observable in RxJS is the subject; Observer is the subscriber. The subscription protocol is standardized: next(value), error(err), complete(). Reactive adds: composable operators (map, filter, merge, combineLatest) to transform event streams before observers receive them. Backpressure handling for slow consumers. Automatic error propagation through the stream. Schedulers for controlling execution context. Observable is the Observer pattern with a rich composition algebra. In Angular, the async pipe in templates is the standard Observer-based approach for reactive UI updates.' },
  { q: 'What is the ObservableCollection approach in .NET?', a: 'INotifyPropertyChanged and INotifyCollectionChanged (ObservableCollection<T>) are the .NET standard Observer pattern implementations for data binding. PropertyChanged event fires when a property value changes. CollectionChanged fires when items are added or removed. WPF, WinForms, MAUI, and Blazor UI frameworks subscribe to these events to update bound UI elements automatically. ObservableCollection<T> fires CollectionChanged on Add, Remove, Replace, Move, and Reset operations. The UI framework subscribes as an observer; the domain class (ViewModel) is the subject. This is the foundation of MVVM: the ViewModel exposes observable state; the View subscribes via data binding.' },
  { q: 'How do you implement Observer with thread safety for multithreaded subjects?', a: 'Thread-safety issues: an observer may unsubscribe while notify() is iterating the observer list, causing ConcurrentModificationException. Multiple threads may register observers simultaneously corrupting the list. Solutions: copy-on-write observer list: iterate a snapshot for notification; registrations modify a new copy. Use ConcurrentList or lock the list during add/remove but iterate a snapshot during notify. Use Interlocked or lock in subscribe/unsubscribe. In .NET, event handlers (MulticastDelegate) are immutable: each add or remove creates a new delegate chain, avoiding modification-during-iteration issues. In Java, CopyOnWriteArrayList is commonly used for the observer list in concurrent event sources.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Observer defines one-to-many notification: Subject maintains a list of Observers and notifies all when its state changes — C# events are the idiomatic .NET implementation.',
  mustKnow: [
    'Subject knows only IObserver interface — observers registered/removed at runtime',
    'Always use ?.Invoke() for events — null with no subscribers',
    'Always unsubscribe (-=) to avoid memory leaks',
    'Iterate a copy of observers list during notification (ToList()) for safety',
    'INotifyPropertyChanged is Observer — foundation of MVVM data binding',
  ],
  interviewFocus: [
    'How do event subscriptions cause memory leaks in .NET?',
    'Observer vs Mediator — when to use each?',
    'When would you use IObservable<T> over C# events?',
  ],
};

@Component({
  selector: 'app-dp-observer',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './observer.html',
  styleUrl: './observer.scss',
})
export class DpObserver {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
