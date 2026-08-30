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
  { name: 'S — SRP', type: 'keyword', desc: 'Single Responsibility: a class has one reason to change — one job, one concern.' },
  { name: 'O — OCP', type: 'keyword', desc: 'Open/Closed: open for extension, closed for modification — add behaviour without editing existing code.' },
  { name: 'L — LSP', type: 'keyword', desc: 'Liskov Substitution: subclasses must be substitutable for their base class without breaking the program.' },
  { name: 'I — ISP', type: 'keyword', desc: 'Interface Segregation: clients should not depend on methods they do not use — split fat interfaces.' },
  { name: 'D — DIP', type: 'keyword', desc: 'Dependency Inversion: depend on abstractions, not concretions — inject interfaces, not concrete classes.' },
  { name: 'Robert C. Martin', type: 'keyword', desc: '"Uncle Bob" coined SOLID in the early 2000s as principles for maintainable OOP design.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'S — Single Responsibility Principle',
    points: [
      'A class should have only one reason to change — it should do one thing well.',
      'Violation: UserService that handles authentication, email, profile updates, and payments.',
      'Fix: AuthService, EmailService, ProfileService, PaymentService — each with one responsibility.',
      'Ask: "If X changes, does this class need to change?" If multiple X → SRP violation.',
    ],
  },
  {
    heading: 'O — Open/Closed Principle',
    points: [
      'Software entities should be open for extension but closed for modification.',
      'Violation: adding a new payment method requires editing a PaymentProcessor switch statement.',
      'Fix: IPaymentMethod interface — new providers implement it without touching existing code.',
      'Strategy and Decorator patterns directly implement OCP.',
    ],
  },
  {
    heading: 'L — Liskov Substitution Principle',
    points: [
      'Subclasses must be usable in place of their base class without breaking the program.',
      'Classic violation: Square inherits Rectangle — setting width/height independently breaks Square\'s invariant.',
      'LSP violation signals: overriding methods to throw NotSupportedException, postconditions weaker than base.',
      'Fix: when the "is-a" relationship has special constraints, either drop the inheritance entirely (two unrelated types, as shown below) or use composition (one type holds an instance of the other internally) — whichever avoids the broken substitutability, since the specific technique depends on whether any shared behaviour genuinely needs reusing.',
    ],
  },
  {
    heading: 'I — Interface Segregation Principle',
    points: [
      'Clients should not be forced to depend on interfaces they do not use.',
      'Violation: IWorker has Work(), Eat(), Sleep() — a Robot implements Work() but throws on Eat().',
      'Fix: IWorkable { Work() }, IFeedable { Eat() }, ISleepable { Sleep() } — compose what each class needs.',
      'Fat interfaces cause compilation coupling — every change to the interface forces all implementors to recompile.',
    ],
  },
  {
    heading: 'SOLID as a Coherent Set, Not Five Independent Rules',
    points: [
      'The five SOLID principles reinforce each other rather than operating independently — a class violating Single Responsibility (doing too much) typically also becomes harder to extend without modification (violating Open/Closed), since its many responsibilities are entangled together within one class.',
      'Liskov Substitution and Interface Segregation work together to keep abstractions honest — Liskov ensures a subtype can genuinely stand in for its base type without surprising behavior, while Interface Segregation prevents interfaces from being so broad that satisfying Liskov substitutability becomes awkward or forces meaningless implementations.',
      'Dependency Inversion is often the principle that makes the other four practically achievable at scale — depending on abstractions rather than concrete implementations is what allows Open/Closed extension (new implementations of an abstraction) without modifying code that depends on that abstraction.',
      'SOLID principles are heuristics for managing complexity as software grows, not rules to apply dogmatically to every single class regardless of size or stability — a small, simple, rarely-changing class does not necessarily benefit from strict SOLID compliance the way a large, evolving, business-critical class does.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'SRP + OCP',
    language: 'csharp',
    code: `// ── Single Responsibility Principle ───────────────────────────────────────────

// WRONG: one class, multiple reasons to change
public class UserManager
{
    public User GetUser(Guid id) { /* DB query */ }
    public void SendWelcomeEmail(User user) { /* SMTP */ }  // email concern
    public void UpdateUserProfile(User user) { /* DB write */ }
    public string GenerateReport(User user) { /* formatting */ } // report concern
}

// RIGHT: each class has one responsibility
public class UserRepository   { public User? GetUser(Guid id) { /*...*/ } }
public class UserEmailService { public Task SendWelcomeEmailAsync(User user) { /*...*/ } }
public class UserReportService { public string GenerateReport(User user) { /*...*/ } }

// ── Open/Closed Principle ─────────────────────────────────────────────────────

// WRONG: extending requires modifying existing code
public class DiscountCalculator
{
    public decimal Calculate(Order order, string type) => type switch
    {
        "seasonal"  => order.Total * 0.1m,
        "employee"  => order.Total * 0.2m,
        // Adding "VIP" requires editing this class ← OCP violation
        _ => 0m
    };
}

// RIGHT: open for extension via interface
public interface IDiscountStrategy
{
    bool Applies(Order order);
    decimal Calculate(Order order);
}

public class SeasonalDiscount : IDiscountStrategy
{
    public bool Applies(Order order) => DateTime.Now.Month is 11 or 12;
    public decimal Calculate(Order order) => order.Total * 0.1m;
}

public class EmployeeDiscount : IDiscountStrategy
{
    public bool Applies(Order order) => order.Customer.IsEmployee;
    public decimal Calculate(Order order) => order.Total * 0.2m;
}

// Adding VipDiscount = new class, zero changes to existing code ← OCP satisfied
public class VipDiscount : IDiscountStrategy
{
    public bool Applies(Order order) => order.Customer.Tier == Tier.Vip;
    public decimal Calculate(Order order) => order.Total * 0.15m;
}

public class DiscountCalculator(IEnumerable<IDiscountStrategy> strategies)
{
    public decimal Calculate(Order order) =>
        strategies.Where(s => s.Applies(order)).Sum(s => s.Calculate(order));
}`,
  },
  {
    label: 'LSP + ISP + DIP',
    language: 'csharp',
    code: `// ── Liskov Substitution Principle ────────────────────────────────────────────

// WRONG: Square breaks Rectangle's contract
public class Rectangle { public virtual int Width { get; set; } public virtual int Height { get; set; } }
public class Square : Rectangle
{
    public override int Width  { set { base.Width = base.Height = value; } }  // breaks width/height independence
    public override int Height { set { base.Width = base.Height = value; } }
}
// Client code: rect.Width = 5; rect.Height = 3; Assert(rect.Area == 15) → FAILS for Square

// RIGHT: separate types, no inheritance
public class Rectangle(int width, int height) { public int Area => width * height; }
public class Square(int side) { public int Area => side * side; }

// ── Interface Segregation Principle ──────────────────────────────────────────

// WRONG: fat interface forces Robot to implement Eat/Sleep
public interface IWorker { void Work(); void Eat(); void Sleep(); }
public class Robot : IWorker
{
    public void Work() { /* processes */ }
    public void Eat()  => throw new NotSupportedException(); // ISP violation
    public void Sleep() => throw new NotSupportedException(); // ISP violation
}

// RIGHT: segregated interfaces
public interface IWorkable  { void Work(); }
public interface IFeedable  { void Eat(); }
public interface ISleepable { void Sleep(); }

public class Robot : IWorkable            { public void Work() { /* ok */ } }
public class Human : IWorkable, IFeedable, ISleepable
{
    public void Work()  { /* ok */ }
    public void Eat()   { /* ok */ }
    public void Sleep() { /* ok */ }
}

// ── Dependency Inversion Principle ────────────────────────────────────────────

// WRONG: high-level module depends on concrete low-level module
public class OrderService
{
    private readonly SqlOrderRepository _repo = new(); // concrete dependency
    public void Process(Order order) { _repo.Save(order); }
}

// RIGHT: both depend on the abstraction
public interface IOrderRepository { Task SaveAsync(Order order); }

public class OrderService(IOrderRepository repo) // depends on abstraction
{
    public async Task ProcessAsync(Order order) => await repo.SaveAsync(order);
}

// Registered via DI — concrete wired at composition root only
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Applying SRP as "one method per class"',
    wrong: `// 50 classes, each with a single method — over-engineered
public class UserEmailSender { public void Send(User u) { } }
public class UserEmailValidator { public bool Validate(string e) { } }`,
    right: `// "One reason to change" — not "one method"
// EmailService handles all email concerns: send, validate, template — one responsibility`,
    explanation: 'SRP means one reason to change, not one method per class. A class cohesively handling all email-related behaviour is a single responsibility. Splitting by method creates excessive class proliferation and fragmented cohesion.',
  },
  {
    title: 'LSP violation: throwing NotImplementedException in overrides',
    wrong: `public class ReadOnlyRepository : IRepository
{
    public void Add(Entity e) => throw new NotImplementedException(); // LSP violation
}`,
    right: `public interface IReadRepository<T> { Task<T?> GetByIdAsync(Guid id); }
public interface IWriteRepository<T> : IReadRepository<T> { Task AddAsync(T entity); }
// ReadOnlyRepository implements only IReadRepository<T>`,
    explanation: 'Throwing NotImplementedException in an override means the subtype is NOT substitutable for its base — a direct LSP violation. Fix by splitting the interface so the read-only implementation only exposes read methods.',
  },
  {
    title: 'Injecting concrete classes instead of interfaces (DIP violation)',
    wrong: `public class ReportService(SqlReportRepository repo) // tied to SQL implementation`,
    right: `public class ReportService(IReportRepository repo) // depends on abstraction`,
    explanation: 'Depending on concrete classes means you cannot swap implementations for testing or different environments without modifying the class. Inject interfaces and let the DI container wire the concrete class — this is the Dependency Inversion Principle.',
  },
  {
    title: 'Creating one giant interface (ISP violation)',
    wrong: `public interface IUserService
{
    User GetUser(Guid id);
    void UpdateProfile(User user);
    void SendEmail(string to, string body);
    string GenerateReport(User user);
    bool ValidatePassword(string password);
}`,
    right: `public interface IUserRepository   { User GetUser(Guid id); void UpdateProfile(User u); }
public interface IEmailService      { void SendEmail(string to, string body); }
public interface IReportService     { string GenerateReport(User user); }
public interface IPasswordValidator { bool Validate(string password); }`,
    explanation: 'A single large interface forces every implementation to depend on all methods — even the ones they don\'t use. Split into focused interfaces. Clients depend only on the interfaces relevant to their needs.',
  },
];

const challenge: Challenge = {
  title: 'SOLID Payment System',
  language: 'typescript',
  description: `Apply SOLID to a payment system.
IPaymentProcessor has processPayment(amount): boolean.
CreditCardProcessor and CryptoProcessor implement it (OCP/DIP).
PaymentService depends on IPaymentProcessor (DIP).
Each processor has one responsibility (SRP).`,
  hints: [
    'IPaymentProcessor is the abstraction (DIP + OCP)',
    'PaymentService constructor takes IPaymentProcessor',
    'CreditCardProcessor and CryptoProcessor are separate classes',
  ],
  starterCode: `interface IPaymentProcessor {
  processPayment(amount: number): boolean;
}

// TODO: CreditCardProcessor, CryptoProcessor
// TODO: PaymentService(processor: IPaymentProcessor)`,
  solution: `interface IPaymentProcessor {
  processPayment(amount: number): boolean;
}

// SRP: each processor has one responsibility
// OCP: new processors added without changing PaymentService
class CreditCardProcessor implements IPaymentProcessor {
  processPayment(amount: number): boolean {
    console.log(\`Credit card charged: $\${amount}\`);
    return true;
  }
}

class CryptoProcessor implements IPaymentProcessor {
  processPayment(amount: number): boolean {
    console.log(\`Crypto payment sent: \${amount} BTC equivalent\`);
    return amount <= 1000; // crypto limit example
  }
}

// DIP: PaymentService depends on abstraction, not concrete class
class PaymentService {
  constructor(private processor: IPaymentProcessor) {}
  checkout(amount: number): void {
    const ok = this.processor.processPayment(amount);
    console.log(ok ? 'Payment successful' : 'Payment failed');
  }
}

const cardService   = new PaymentService(new CreditCardProcessor());
const cryptoService = new PaymentService(new CryptoProcessor());

cardService.checkout(99.99);
cryptoService.checkout(500);
cryptoService.checkout(2000); // fails — over limit`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does the Liskov Substitution Principle state?',
    options: [
      'Subclasses must override all methods of their base class',
      'Objects of a subtype must be substitutable for their supertype without altering program correctness',
      'Every class must implement at least one interface',
      'Interfaces must be larger than the classes that implement them',
    ],
    answer: 1,
    explanation: 'LSP states that if S is a subtype of T, then objects of type T may be replaced with objects of type S without breaking the program. Classic violation: Square inheriting Rectangle and breaking width/height independence. Fix: prefer composition when the "is-a" relationship has special constraints.',
  },
  {
    q: 'Which SOLID principle is violated when a class has methods like SendEmail(), SaveToDatabase(), and GeneratePDF()?',
    options: [
      'Open/Closed Principle',
      'Single Responsibility Principle',
      'Interface Segregation Principle',
      'Dependency Inversion Principle',
    ],
    answer: 1,
    explanation: 'A class combining email, database, and PDF concerns has three reasons to change — a SRP violation. Separate into EmailService, Repository, and PdfService, each with one responsibility.',
  },
  {
    q: 'The Open/Closed Principle says code should be open for extension and closed for modification. Which pattern directly implements this?',
    options: [
      'Singleton — ensuring one instance',
      'Strategy — adding behaviour via new implementations without modifying existing classes',
      'Factory Method — creating objects without specifying the class',
      'Observer — notifying dependents of changes',
    ],
    answer: 1,
    explanation: 'Strategy encapsulates algorithms behind an interface — adding a new algorithm means a new class implementing the interface, with zero changes to the context or existing strategies. This directly implements OCP. Decorator also implements OCP by wrapping existing behaviour.',
  },
  { q: 'What does the Single Responsibility Principle require?', options: ['Each class should have only one method', 'A class should have only one reason to change, meaning it should be responsible for only one part of the system functionality', 'Each module should perform one type of computation', 'A function should accept only one parameter'], answer: 1, explanation: 'SRP (Robert C. Martin): a class should have only one reason to change. If a class handles both business logic and database persistence, a business rule change and a database schema change are both reasons to modify it — two responsibilities, two reasons to change. Split into two classes: one for business logic, one for persistence. Lower coupling, higher cohesion result. Common SRP violations: a class that formats data, validates it, persists it, and sends email notifications. A class with methods that belong to clearly different abstractions. A class whose test file covers completely unrelated concerns.' },
  { q: 'What is the Liskov Substitution Principle and what must a subclass guarantee?', options: ['Subclasses must call super() in all constructors', 'Objects of a subtype must be substitutable for objects of the supertype without breaking the correctness of the program', 'Superclasses should not have more methods than subclasses', 'Each class should directly extend only one abstract parent'], answer: 1, explanation: 'LSP (Barbara Liskov): if S is a subtype of T, then objects of type T may be replaced with objects of type S without altering the desirable properties of the program. Violations: Square extends Rectangle: setWidth(5) on a Square also sets height to 5 (square invariant). But Rectangle clients expect setting width not to affect height. Substituting Square for Rectangle breaks client assumptions. A ReadOnlyList that extends List but throws UnsupportedOperationException on add() violates LSP: callers expecting a List cannot safely use ReadOnlyList. Rule: subtypes must honor the contracts (pre/post-conditions, invariants) of the supertype.' },
  { q: 'What does the Interface Segregation Principle require?', options: ['All interfaces should be merged into one large interface to avoid many small interfaces', 'Clients should not be forced to depend on methods they do not use; prefer many small, focused interfaces over one large, general-purpose interface', 'Interfaces should be internal to the module that defines them', 'All interface methods must be abstract with no default implementations'], answer: 1, explanation: 'ISP (Robert C. Martin): fat interfaces force implementors to provide methods they do not need and force clients to depend on methods they never call. A class forced to implement 20 methods it does not use is likely misplaced in the hierarchy. Split fat interfaces into focused, cohesive interfaces. IWorker (work(), eat()) should be split: IWorker (work()) and IEater (eat()). Robot implements IWorker but not IEater. This prevents robots from having a no-op eat() method. ISP also applies to callers: depend only on the interface methods you actually use. This reduces coupling and makes code easier to test with smaller mocks.' },
];

const qna: QnaItem[] = [
  {
    q: 'Are the SOLID principles always applicable?',
    a: 'SOLID principles are guidelines, not absolute rules. In small scripts, scripts-of-record, or simple CRUD apps, strict SOLID application creates unnecessary abstractions. Apply them when: the codebase will be long-lived, multiple developers work on it, the domain is complex, or testing is important. Premature SOLID (splitting every class before the need arises) is a form of over-engineering — wait for the pain before applying the principle.',
  },
  {
    q: 'What is the relationship between DIP and Dependency Injection?',
    a: 'They are complementary but distinct. DIP is the principle: high-level modules should not depend on low-level modules; both should depend on abstractions. Dependency Injection is the mechanism: abstractions (interfaces) are injected by an external container (the DI container) rather than constructed inside the class. DI is how you implement DIP in practice. Without DI, you would have to manually inject concrete implementations; DI containers automate this wiring.',
  },
  { q: 'How does the Open/Closed Principle guide extensibility design?', a: 'OCP (Bertrand Meyer): software entities should be open for extension but closed for modification. When a new requirement arrives, extend behavior by adding new code (new classes, new implementations) rather than modifying existing code. Modification risks breaking existing tests and behavior. Extension adds in isolation. OCP is achieved through: abstractions (interfaces, abstract classes) that callers depend on, and new implementations added without changing callers. Strategy pattern: add a new sort algorithm by adding a new ISort implementation without modifying the code that uses sorting. Plugin architectures, template method, and decorator all implement OCP. Note: no design can be closed against all types of change; anticipate the likely axes of change in your domain.' },
  { q: 'How do the SOLID principles work together?', a: 'SOLID principles reinforce each other. SRP defines focused classes. OCP guides extension without modification. LSP ensures correct substitutability. ISP enforces focused interfaces. DIP decouples high-level and low-level modules through abstractions. Together: SRP produces focused classes (ISP at the class level). DIP requires abstractions (interfaces), which OCP uses for extension points. LSP ensures those interfaces have correct implementations. A violation of one often implies a violation of another: a fat class violating SRP often violates ISP (fat interface) and OCP (hard to extend without touching the class). Apply them together as a system rather than individually in isolation.' },
  { q: 'What are common misapplications of SOLID principles?', a: 'Misapplications: applying SRP so aggressively that every function becomes a class. Result: hundreds of tiny classes that are hard to navigate. OCP taken too far: everything is an extension point, creating unnecessary abstraction layers for code that will never change. LSP used as justification for deep inheritance hierarchies: prefer composition over deep inheritance. ISP causing interface explosion: dozens of single-method interfaces when two or three broader interfaces would be clearer. DIP applied to every dependency including simple value objects (over-injection). The rule of thumb: apply SOLID principles where change is expected or where the code is complex enough that the principles clarify structure. Simple, stable code does not need all five principles applied simultaneously.' },
  { q: 'How does Dependency Inversion Principle affect project structure?', a: 'DIP applied architecturally: high-level modules (domain, application layer) define interfaces (IOrderRepository, IEmailService). Low-level modules (infrastructure layer) provide implementations (SqlOrderRepository, SmtpEmailService). Source code dependency direction: infrastructure imports from domain/application to implement interfaces, but domain/application never import from infrastructure. This creates the Clean Architecture or Onion Architecture dependency rule. Project structure: Domain project (entities, interfaces). Application project (use cases, depends on Domain). Infrastructure project (implementations, depends on Domain). Web API project (controllers, depends on Application). Dependencies point inward; the domain has no external dependencies.' },
];

const revision: RevisionSummary = {
  oneLiner: 'SOLID is five principles for maintainable OOP: one job per class, extend without modifying, substitutable subtypes, focused interfaces, and depend on abstractions.',
  mustKnow: [
    'S: Single Responsibility — one reason to change per class',
    'O: Open/Closed — extend behaviour via new classes, not by editing existing ones',
    'L: Liskov Substitution — subtype must not break base class contract; throwing NotImplementedException is a violation',
    'I: Interface Segregation — split fat interfaces so clients depend only on what they use',
    'D: Dependency Inversion — depend on interfaces (IOrderRepository), inject concretions via DI',
  ],
  interviewFocus: [
    'What is the LSP violation with Square/Rectangle?',
    'How does Strategy pattern implement OCP?',
    'What is the difference between DIP and Dependency Injection?',
  ],
};

@Component({
  selector: 'app-dp-solid',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './solid.html',
  styleUrl: './solid.scss',
})
export class DpSolid {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
