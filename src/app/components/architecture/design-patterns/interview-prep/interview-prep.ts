import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface QnaEntry {
  q: string;
  a: string;
  category: 'Creational' | 'Structural' | 'Behavioral' | 'Enterprise' | 'Principles';
  difficulty: 'Junior' | 'Mid' | 'Senior';
}

const QNA: QnaEntry[] = [
  // Creational
  { category: 'Creational', difficulty: 'Junior', q: 'What problem does Singleton solve and when is it overused?', a: 'Singleton ensures only one instance exists — used for shared resources like loggers, config, caches. Overused when it becomes global mutable state: hidden dependencies, untestable (cannot be mocked), tight coupling. Prefer DI-registered singletons over hand-rolled Singleton classes — the container manages the lifetime; you keep the interface.' },
  { category: 'Creational', difficulty: 'Mid', q: 'When would you use Builder over a constructor with many parameters?', a: 'Use Builder when: (1) many optional parameters — constructor telescoping becomes unreadable, (2) the construction process has multiple ordered steps, (3) you want a fluent API (WebApplicationBuilder, Polly pipeline). The builder validates as it goes and returns a fully constructed, valid object. Avoid Builder for simple objects with 2-3 required parameters.' },
  { category: 'Creational', difficulty: 'Mid', q: 'What is the difference between Factory Method and Abstract Factory?', a: 'Factory Method: one factory method in a creator class — subclasses override it to change the product type. Creates ONE product. Abstract Factory: an interface with multiple factory methods — creates FAMILIES of related products (Button + Dialog + Menu all for Dark theme). Use Abstract Factory when products must be consistent with each other.' },
  // Structural
  { category: 'Structural', difficulty: 'Junior', q: 'What is the difference between Adapter and Decorator?', a: 'Adapter changes the interface — wraps an incompatible object to match a target interface (StripeAdapter : IPaymentGateway). Decorator keeps the same interface — wraps an object to add behaviour without changing the interface (LoggingRepository : IRepository adds logging). Adapter = interface conversion; Decorator = behaviour extension.' },
  { category: 'Structural', difficulty: 'Mid', q: 'When would you use Facade vs Adapter?', a: 'Facade simplifies a complex subsystem for clients — hides multiple classes behind one simple API (OrderFacade wraps Repository + Email + Inventory). Adapter makes an incompatible interface compatible — translates one interface to another. Facade is about simplicity; Adapter is about compatibility.' },
  { category: 'Structural', difficulty: 'Senior', q: 'How does Proxy differ from Decorator?', a: 'Both wrap the same interface. Proxy controls ACCESS to the subject: virtual proxy (lazy load), protection proxy (auth), remote proxy (marshalling). Decorator ADDS BEHAVIOUR: logging, caching, metrics. Proxies often control when/whether the subject is called; Decorators always delegate. In practice the line blurs — EF Core lazy loading uses a Proxy; caching middleware resembles a Decorator.' },
  // Behavioral
  { category: 'Behavioral', difficulty: 'Junior', q: 'Explain Observer pattern and how it relates to C# events.', a: 'Observer defines a one-to-many dependency — when Subject changes state, all Observers are notified automatically. C# events are the built-in Observer implementation: EventHandler delegates, += subscribe, -= unsubscribe, event keyword encapsulates the multicast delegate. INotifyPropertyChanged uses Observer. Rx.NET (IObservable<T>/IObserver<T>) is a richer, async Observer with LINQ operators.' },
  { category: 'Behavioral', difficulty: 'Mid', q: 'What is the difference between Strategy and Template Method?', a: 'Template Method: uses inheritance — subclass fills in specific steps of a fixed algorithm skeleton. Behaviour decided at compile time. Strategy: uses composition — algorithm injected as an object, swappable at runtime. Strategy is generally preferred (composition over inheritance) for runtime flexibility. Use Template Method only when the algorithm structure is genuinely fixed and subclassing is appropriate.' },
  { category: 'Behavioral', difficulty: 'Mid', q: 'When would you use Chain of Responsibility vs Strategy?', a: 'Chain of Responsibility: a request passes through a chain of handlers until one handles it — good when multiple handlers may apply and the sender does not know which. ASP.NET Core middleware is CoR. Strategy: selects ONE algorithm from a set for a specific task — no chaining. Use CoR for pipelines; Strategy for algorithm selection.' },
  { category: 'Behavioral', difficulty: 'Senior', q: 'What is double dispatch in the Visitor pattern and why is it needed?', a: 'Single dispatch selects a method based on ONE object\'s type (normal virtual calls). Visitor needs to select the method based on TWO types: the element type AND the visitor type. Double dispatch: element.Accept(visitor) dispatches on the element type → inside Accept, visitor.Visit(this) dispatches on the visitor type. Without Accept(), the caller must cast the element — tight coupling. Double dispatch enables adding new operations (new Visitor) without modifying elements.' },
  { category: 'Behavioral', difficulty: 'Senior', q: 'Memento vs Command for implementing undo — when to use each?', a: 'Command: encapsulates the action + its inverse (Execute + Undo). Good when undo is a known business operation. Memento: captures the full state snapshot before an action, restored on undo. Good for complex state that is hard to invert (text editors, design tools). Command undo is more efficient (only stores the delta); Memento undo is simpler to implement (just restore the snapshot). Many real editors use both: Commands for coarse undo, Mementos for fine-grained state.' },
  // Enterprise
  { category: 'Enterprise', difficulty: 'Mid', q: 'Why should repositories NOT return IQueryable<T>?', a: 'IQueryable<T> is an EF Core abstraction — leaking it means callers can write any LINQ query, bypassing the repository abstraction. This couples callers to EF Core, prevents switching data sources, and breaks encapsulation. Return materialised IReadOnlyList<T> or use the Specification pattern (Find(ISpecification<T>)) to keep query logic inside the repository.' },
  { category: 'Enterprise', difficulty: 'Mid', q: 'What is the difference between CQRS and Event Sourcing? Are they always paired?', a: 'CQRS separates read and write code paths — commands change state, queries read it. Event Sourcing stores state as an immutable event log. They are often paired (CQRS commands raise events; CQRS queries read projections built from events) but are independent. You can use CQRS without Event Sourcing (same DB, different code paths). You can use Event Sourcing without CQRS (but CQRS makes read-side projections natural). Pair them for domains with complex audit and read requirements.' },
  { category: 'Enterprise', difficulty: 'Senior', q: 'Explain the dual-write problem and how the Outbox pattern solves it.', a: 'Dual-write: after saving to the database, you publish an event to a message broker — two separate operations. If the DB commits but the broker publish fails, the event is lost (downstream services never know). The Outbox pattern writes the event to an outbox table IN THE SAME database transaction as the domain change. A relay process publishes from the outbox asynchronously. If the relay fails, it retries — consumers must be idempotent (at-least-once guarantee).' },
  { category: 'Enterprise', difficulty: 'Senior', q: 'Saga vs 2-phase commit — why do microservices prefer Saga?', a: '2-phase commit (2PC) uses a distributed coordinator that acquires locks across all services before committing — fragile (coordinator failure leaves services locked), high latency, not supported by most message brokers and NoSQL stores. Saga uses local transactions + compensating transactions: each service commits locally; failures trigger compensating events (ReleaseInventory, RefundPayment). Sagas achieve eventual consistency without global locks and work naturally with async messaging.' },
  { category: 'Enterprise', difficulty: 'Senior', q: 'When is Clean Architecture over-engineering?', a: 'Clean Architecture adds multi-project complexity (Domain, Application, Infrastructure, Presentation), interfaces for every dependency, and Composition Root wiring. It pays off when: domain logic is complex, multiple delivery mechanisms exist, infrastructure may change, or the codebase is long-lived. Over-engineering for: simple CRUD APIs with minimal business logic, short-lived projects, single-developer tools, or any scenario where the abstraction cost exceeds the benefit. Start simple and extract layers as the domain grows.' },
  // Principles
  { category: 'Principles', difficulty: 'Junior', q: 'What does SOLID stand for and which principle is most important?', a: 'S: Single Responsibility. O: Open/Closed. L: Liskov Substitution. I: Interface Segregation. D: Dependency Inversion. Most debated "most important": DIP makes testing possible (inject mocks). SRP keeps classes focused and changeable. OCP enables extension without modification. In practice all five reinforce each other — DIP often has the most immediate impact on testability in modern .NET code.' },
  { category: 'Principles', difficulty: 'Mid', q: 'What is a Liskov Substitution Principle violation and give an example?', a: 'LSP: objects of a subtype must be substitutable for their supertype without breaking the program. Classic violation: Square inherits Rectangle. Setting Width=5 on a Square also sets Height=5 — rect.Width = 5; rect.Height = 3; rect.Area => 25 (not 15). LSP is violated because the subtype breaks the base\'s postcondition. Fix: do not inherit; use separate types. Another violation: override to throw NotSupportedException — breaks substitutability.' },
  { category: 'Principles', difficulty: 'Mid', q: 'DRY says "Do not repeat yourself" — does this mean never write similar code?', a: 'No. DRY is about knowledge duplication, not code similarity. Two loops that look alike but encode different business rules are NOT a DRY violation — forcing them into one function couples independent concepts. DRY violation: the same business rule (tax rate, validation logic) written in two places — change requires finding all copies. Similar-looking code encoding different knowledge should stay separate. Rule of Three: abstract after three occurrences, not two.' },
  { category: 'Principles', difficulty: 'Senior', q: 'What is the difference between DIP (Dependency Inversion Principle) and Dependency Injection?', a: 'DIP is the design principle: high-level modules should not depend on low-level modules — both should depend on abstractions. Dependency Injection is the implementation technique: dependencies (as interface parameters) are provided by an external container rather than constructed inside the class. DI is how you implement DIP. Without DI you can still follow DIP (manually passing interfaces); with DI you can still violate DIP (injecting concrete classes). In modern .NET, AddScoped<IOrderRepository, SqlOrderRepository>() is DI implementing DIP.' },
];

const CATEGORIES = ['All', 'Creational', 'Structural', 'Behavioral', 'Enterprise', 'Principles'] as const;
const DIFFICULTIES = ['All', 'Junior', 'Mid', 'Senior'] as const;
type Cat  = typeof CATEGORIES[number];
type Diff = typeof DIFFICULTIES[number];

@Component({
  selector: 'app-dp-interview-prep',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class DpInterviewPrep {
  search     = signal('');
  activeCat  = signal<Cat>('All');
  activeDiff = signal<Diff>('All');
  expanded   = signal<Set<number>>(new Set());

  readonly categories   = CATEGORIES;
  readonly difficulties = DIFFICULTIES;

  filtered = computed(() => {
    const q    = this.search().toLowerCase();
    const cat  = this.activeCat();
    const diff = this.activeDiff();
    return QNA.filter(e => {
      const matchCat  = cat  === 'All' || e.category   === cat;
      const matchDiff = diff === 'All' || e.difficulty === diff;
      if (!q) return matchCat && matchDiff;
      return matchCat && matchDiff && (
        e.q.toLowerCase().includes(q) || e.a.toLowerCase().includes(q)
      );
    });
  });

  toggle(i: number) {
    const s = new Set(this.expanded());
    s.has(i) ? s.delete(i) : s.add(i);
    this.expanded.set(s);
  }

  isOpen(i: number) { return this.expanded().has(i); }
  setCat(c: Cat)    { this.activeCat.set(c); }
  setDiff(d: Diff)  { this.activeDiff.set(d); }
}
