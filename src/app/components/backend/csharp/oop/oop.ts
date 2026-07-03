import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-csharp-oop',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './oop.html',
  styleUrl: './oop.scss',
})
export class CsharpOop {

  quickRef: QuickRefItem[] = [
    { name: 'class',              type: 'keyword',   desc: 'Reference type that supports encapsulation, inheritance, and polymorphism' },
    { name: 'interface',          type: 'interface', desc: 'Contract defining what a type must do — no fields, supports multiple implementation' },
    { name: 'abstract',           type: 'keyword',   desc: 'Marks a class or member as incomplete — cannot instantiate, must be overridden' },
    { name: 'sealed',             type: 'keyword',   desc: 'Prevents a class from being inherited or a virtual member from being overridden further' },
    { name: 'override',           type: 'keyword',   desc: 'Provides a new implementation for a virtual or abstract member in a derived class' },
    { name: 'virtual',            type: 'keyword',   desc: 'Marks a method or property as overridable by derived classes' },
    { name: 'partial',            type: 'keyword',   desc: 'Splits a class/struct/interface definition across multiple files — merged by the compiler' },
    { name: 'base',               type: 'keyword',   desc: 'Accesses members of the base class from a derived class, including constructors' },
    { name: 'this',               type: 'keyword',   desc: 'Refers to the current instance; also used to chain constructors within a class' },
    { name: 'protected',          type: 'keyword',   desc: 'Visible within the class and all derived classes' },
    { name: 'protected internal', type: 'keyword',   desc: 'Visible in derived classes OR in the same assembly — union of both' },
    { name: 'private protected',  type: 'keyword',   desc: 'Visible in derived classes in the SAME assembly only — intersection' },
    { name: 'new (hiding)',       type: 'keyword',   desc: 'Hides an inherited member without polymorphism — avoid; prefer override' },
    { name: 'is / as',            type: 'syntax',    desc: 'Type-check (is) and safe cast (as). as returns null instead of throwing' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Encapsulation — hide implementation, expose behaviour',
      points: [
        'Encapsulation means grouping data and the methods that operate on it inside a class, and controlling access with modifiers.',
        '<code>public</code> — accessible anywhere. <code>private</code> — only within the class. <code>protected</code> — class and derived classes. <code>internal</code> — within the same assembly.',
        'Use <strong>properties</strong> (with getters/setters) rather than public fields — they let you add validation or computed logic without breaking callers.',
        'Mark fields <code>private readonly</code> when they should not change after construction — the compiler enforces it.',
        'C# 11 <code>required</code> + <code>init</code> properties combine the safety of constructor parameters with the flexibility of object initializers for data-carrier types.',
      ],
    },
    {
      heading: 'Inheritance and polymorphism',
      points: [
        'A <em>derived</em> class (<code>class Dog : Animal</code>) inherits all accessible members of the <em>base</em> class.',
        'Mark methods <code>virtual</code> in the base class to allow derived classes to <code>override</code> them. Without <code>virtual</code>, the method cannot be polymorphically overridden.',
        'Polymorphism: a variable of type <code>Animal</code> can hold a <code>Dog</code> or <code>Cat</code> and the correct overridden method is dispatched at runtime via the vtable.',
        'Use <code>base.Method()</code> to call the base implementation from an override — useful when extending rather than replacing behaviour.',
        'C# supports single-class inheritance only. Use interfaces for multiple capability contracts. <code>sealed</code> prevents any further subclassing of a class.',
      ],
    },
    {
      heading: 'Interfaces as contracts',
      points: [
        'An interface specifies <em>what</em> a type must do, not <em>how</em>. Any class implementing it must provide all members.',
        'A class can implement multiple interfaces: <code>class Service : IRepository&lt;T&gt;, IDisposable</code>.',
        'Interfaces enable Dependency Injection — code against <code>IOrderRepository</code> and inject any concrete implementation at runtime.',
        'Since C# 8, interfaces may have <strong>default method implementations</strong> — useful for adding methods without breaking existing implementors.',
        'Name interfaces with an <code>I</code> prefix by convention: <code>ILogger</code>, <code>IDisposable</code>, <code>IComparable&lt;T&gt;</code>.',
      ],
    },
    {
      heading: 'Access modifiers in depth',
      points: [
        '<code>public</code>: everywhere. <code>private</code>: only inside the declaring type. <code>protected</code>: declaring type + derived types (any assembly).',
        '<code>internal</code>: accessible anywhere within the same assembly (.dll or .exe) — useful for library internals that should not be part of the public API.',
        '<code>protected internal</code>: the <em>union</em> — accessible from derived classes anywhere <em>OR</em> from any code in the same assembly.',
        '<code>private protected</code> (C# 7.2): the <em>intersection</em> — accessible from derived classes that are in the same assembly only. More restrictive than either alone.',
        'The default access for class members is <code>private</code>. The default for top-level types is <code>internal</code>. Always be explicit to communicate intent.',
      ],
    },
    {
      heading: 'partial classes and sealed',
      points: [
        '<code>partial</code> lets you split a class definition across multiple files. The compiler merges them into one type. All parts must be in the same assembly and namespace.',
        'Primary use for <code>partial</code>: keeping hand-written logic separate from code generated by tools (EF Core model scaffolding, WinForms designer, Roslyn source generators).',
        'All partial parts can have their own methods, fields, and properties — but only one part may contain the base class and any attributes.',
        '<code>sealed</code> on a class prevents derivation entirely. On a method, it stops a virtual member from being overridden further down an inheritance chain.',
        'The JIT can de-virtualise calls on sealed types, eliminating vtable dispatch overhead. Seal classes when inheritance would break class invariants or when performance matters.',
      ],
    },
    {
      heading: 'Prefer composition over inheritance',
      points: [
        'Deep inheritance hierarchies are brittle — a change in the base class ripples through every derived class and can break the Liskov Substitution Principle.',
        'Favour <strong>composition</strong>: inject dependencies as constructor parameters typed to interfaces rather than inheriting from them.',
        'An <code>OrderService</code> that receives <code>IRepository&lt;Order&gt;</code> and <code>IEmailSender</code> is easy to test, swap, and evolve independently.',
        'Abstract base classes are useful for true "is-a" relationships with shared implementation — but keep hierarchies shallow (1–2 levels) and prefer them only when composition is genuinely awkward.',
        'Ask: "Is <em>X</em> a <em>Y</em>?" for inheritance. "Does <em>X</em> use a <em>Y</em>?" for composition. When in doubt, compose.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Classes & Properties',
      language: 'csharp',
      code: `// Auto-implemented properties — compiler generates the backing field
public class Product
{
    public required string Name { get; set; }           // C# 11 required
    public Guid    Id    { get; init; } = Guid.NewGuid(); // init-only
    public decimal Price { get; private set; }          // only class writes

    // Computed property — no backing field
    public bool IsExpensive => Price > 500m;

    private readonly DateTime _createdAt;

    public Product(decimal price)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(price);
        Price     = price;
        _createdAt = DateTime.UtcNow;
    }

    public void ApplyDiscount(decimal pct)
    {
        if (pct is <= 0 or > 100)
            throw new ArgumentOutOfRangeException(nameof(pct), "Must be 1–100");
        Price *= (1 - pct / 100m);
    }

    public override string ToString() => $"{Name} — £{Price:F2}";
}

// C# 12 primary constructor
public class Point(double x, double y)
{
    public double X { get; } = x;
    public double Y { get; } = y;
    public double DistanceTo(Point other)
        => Math.Sqrt(Math.Pow(X - other.X, 2) + Math.Pow(Y - other.Y, 2));
}

var laptop = new Product(999m) { Name = "Laptop Pro" };
laptop.ApplyDiscount(10);
Console.WriteLine(laptop);             // Laptop Pro — £899.10
Console.WriteLine(laptop.IsExpensive); // True`,
    },
    {
      label: 'Inheritance',
      language: 'csharp',
      code: `public abstract class Shape
{
    public string Colour { get; init; } = "black";
    public abstract double Area();
    public abstract double Perimeter();

    public string Describe() =>
        $"{GetType().Name}: area={Area():F2}, perimeter={Perimeter():F2}, colour={Colour}";
}

public class Circle(double radius) : Shape
{
    public override double Area()      => Math.PI * radius * radius;
    public override double Perimeter() => 2 * Math.PI * radius;
}

public class Rectangle(double width, double height) : Shape
{
    public override double Area()      => width * height;
    public override double Perimeter() => 2 * (width + height);
}

// sealed — no further subclassing allowed
public sealed class Square(double side) : Shape
{
    public override double Area()      => side * side;
    public override double Perimeter() => 4 * side;
}

// Polymorphism: base-type reference, runtime dispatch
Shape[] shapes = [
    new Circle(5)       { Colour = "red" },
    new Rectangle(4, 6) { Colour = "blue" },
    new Square(3)       { Colour = "green" },
];

foreach (var s in shapes)
    Console.WriteLine(s.Describe());

// override vs new
public class Animal
{
    public virtual  string Speak() => "...";
    public          string Identify() => "Animal";
}

public class Dog : Animal
{
    public override string Speak()    => "Woof!";  // polymorphic
    public new      string Identify() => "Dog";    // hides — NOT polymorphic
}

Animal a = new Dog();
Console.WriteLine(a.Speak());     // Woof!  — override dispatches to Dog
Console.WriteLine(a.Identify());  // Animal — new hides, base called`,
    },
    {
      label: 'Interfaces',
      language: 'csharp',
      code: `public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body);
}

// Concrete implementation
public class SqlOrderRepository(AppDbContext db) : IRepository<Order>
{
    public async Task<Order?> GetByIdAsync(int id, CancellationToken ct = default)
        => await db.Orders.FindAsync([id], ct);

    public async Task AddAsync(Order order, CancellationToken ct = default)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var order = await GetByIdAsync(id, ct);
        if (order is not null) { db.Orders.Remove(order); await db.SaveChangesAsync(ct); }
    }
}

// Service depends on interfaces only — testable, swappable
public class OrderService(IRepository<Order> repo, IEmailSender email)
{
    public async Task PlaceOrderAsync(Order order)
    {
        await repo.AddAsync(order);
        await email.SendAsync(order.CustomerEmail, "Order confirmed",
            $"Order #{order.Id} placed.");
    }
}

// Multiple interfaces + C# 8 default method
public interface INotifier
{
    Task NotifyAsync(string message);
    // Default implementation — existing implementors don't need to override
    Task NotifyUrgentAsync(string message) => NotifyAsync($"URGENT: {message}");
}`,
    },
    {
      label: 'Access Modifiers & partial',
      language: 'csharp',
      code: `// ── Access modifier summary ──────────────────────────────────────────
public class BankAccount
{
    private decimal _balance;             // only inside BankAccount
    protected void SetBalance(decimal v) => _balance = v;  // class + derived
    internal void ApplyInterest(decimal r) => _balance += _balance * r;  // same assembly
    private protected void Audit(string m) => Console.WriteLine($"[AUDIT] {m}");
    // private protected = derived classes in SAME assembly only

    public decimal Balance { get; private set; }

    public BankAccount(string number, decimal initial) => (Balance, _balance) = (initial, initial);
}

// SavingsAccount can use protected and private protected (same assembly)
public class SavingsAccount(string n, decimal b, decimal r) : BankAccount(n, b)
{
    public void AddInterest() => SetBalance(Balance + Balance * r); // protected OK
}

// ── partial class — split across files ───────────────────────────────
// File: Order.cs (hand-written business logic)
public partial class Order
{
    public bool CanBeCancelled() => Status == OrderStatus.Pending;
    public void Cancel() { Status = OrderStatus.Cancelled; }
}

// File: Order.Generated.cs (generated by EF Core or a source generator)
public partial class Order
{
    public int    Id             { get; set; }
    public string CustomerEmail  { get; set; } = "";
    public OrderStatus Status   { get; set; }
}

// ── sealed method — stop override at this level ───────────────────────
public class Base    { public virtual  void Log() => Console.WriteLine("Base"); }
public class Middle  : Base { public sealed override void Log() => Console.WriteLine("Middle"); }
// public class Leaf : Middle { public override void Log() { } }  // CS0239 — sealed`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using new (hiding) instead of override — breaks polymorphism',
      wrong: `public class Animal { public virtual string Speak() => "..."; }
public class Dog : Animal
{
    public new string Speak() => "Woof!";  // hides, NOT polymorphic
}

Animal a = new Dog();
Console.WriteLine(a.Speak());  // "..." — calls Animal.Speak, not Dog.Speak`,
      right: `public class Dog : Animal
{
    public override string Speak() => "Woof!";  // polymorphic
}

Animal a = new Dog();
Console.WriteLine(a.Speak());  // "Woof!" — correct runtime dispatch`,
      explanation: 'new (hiding) only changes the compile-time behavior: calling through a base-type reference still invokes the original. override replaces the method in the vtable so the runtime always dispatches to the most-derived version. Unless you intentionally want non-polymorphic shadowing (very rare), always use override.',
    },
    {
      title: 'Exposing all properties with public setters — no encapsulation',
      wrong: `public class BankAccount
{
    public decimal Balance { get; set; }   // anyone can set any value
    public string Status   { get; set; }
}

// External code:
account.Balance = -999999m;  // no validation, state corruption`,
      right: `public class BankAccount
{
    public decimal Balance { get; private set; }
    public string  Status  { get; private set; } = "Active";

    public bool Withdraw(decimal amount)
    {
        if (amount > Balance) return false;
        Balance -= amount;
        return true;
    }
}`,
      explanation: 'Public setters on every property are the "anemic domain model" anti-pattern. They let callers put the object into any state, bypassing validation and business rules. Keep setters private and expose behaviour through methods that enforce invariants.',
    },
    {
      title: 'Building deep inheritance hierarchies instead of composing',
      wrong: `public class Animal { }
public class Pet : Animal { }
public class Dog : Pet { }
public class TrainedDog : Dog { }
public class ServiceDog : TrainedDog { }
// 5 levels deep — a change in Animal breaks everything below`,
      right: `// Compose capabilities instead of stacking inheritance
public class Dog
{
    private readonly ITrainingProgram _training;
    private readonly IHealthRecord    _health;

    public Dog(ITrainingProgram training, IHealthRecord health)
    {
        _training = training;
        _health   = health;
    }
}`,
      explanation: 'Each additional inheritance level tightly couples every derived class to the base. A change to Animal\'s constructor signature propagates through all 5 levels. Composition through interfaces keeps classes loosely coupled — each injected dependency can be swapped independently, and the class only knows what it needs.',
    },
    {
      title: 'Choosing abstract class over interface when no shared state is needed',
      wrong: `// No fields, no shared implementation — abstract class is wrong here
public abstract class ILogger     // misleadingly named
{
    public abstract void Log(string message);
    public abstract void LogError(string message);
}
// Prevents implementing a second abstract class simultaneously`,
      right: `public interface ILogger
{
    void Log(string message);
    void LogError(string message);
    // C# 8 default implementation — optional
    void LogWarning(string message) => Log($"[WARN] {message}");
}

// A class can now implement both ILogger and IDisposable, etc.`,
      explanation: 'Use an abstract class only when you have shared fields or shared implementation that derived types genuinely reuse. If you just want to define a contract with no shared state, use an interface — it allows implementors to also implement other interfaces and is the right tool for capability contracts.',
    },
    {
      title: 'Not understanding protected internal vs private protected',
      wrong: `// Intended: accessible only in derived classes WITHIN this assembly
protected internal void InternalHelper() { }
// Actually: accessible in derived classes anywhere OR any code in this assembly
// External derived class in another assembly can also call this!`,
      right: `// Correct modifier for "derived classes in this assembly only"
private protected void InternalHelper() { }

// protected internal = derived types (any assembly) OR same assembly (any type)
// private protected  = derived types AND same assembly (intersection, more restrictive)`,
      explanation: 'protected internal and private protected are easy to confuse. protected internal is the union — either condition allows access. private protected is the intersection — both conditions must be true. Use private protected when you want to expose a member to subclasses but not to external assemblies.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between an abstract class and an interface in C#?',
      options: [
        'An abstract class can have fields and constructors; an interface cannot (aside from default methods)',
        'An interface is faster than an abstract class',
        'A class can inherit multiple abstract classes',
        'Abstract classes cannot have any implemented methods',
      ],
      answer: 0,
      explanation: 'An abstract class can carry fields, constructors, and fully-implemented methods — shared state and logic for derived types. An interface is a pure contract (no fields) and a class may implement many. Use abstract class for "is-a" with shared implementation; interface for capabilities.',
    },
    {
      q: 'What does the sealed keyword do when applied to a class?',
      options: [
        'Makes all properties read-only',
        'Prevents the class from being inherited by other classes',
        'Prevents the class from implementing interfaces',
        'Makes the class thread-safe',
      ],
      answer: 1,
      explanation: '<code>sealed</code> on a class prevents derivation — no other class can extend it. The JIT can de-virtualise method calls on sealed types, eliminating vtable dispatch overhead. Use it when inheritance would break invariants your class maintains.',
    },
    {
      q: 'What is the difference between override and new when redefining an inherited method?',
      options: [
        'They are identical — just different syntax',
        'override participates in polymorphism; new hides the member without polymorphism',
        'new is for virtual methods; override is for non-virtual',
        'override only works on static methods',
      ],
      answer: 1,
      explanation: '<code>override</code> replaces the base method in the vtable — calling through a base-type reference dispatches to the derived method. <code>new</code> hides the member at compile time only — calling through a base-type reference still invokes the original. Avoid <code>new</code>; it leads to confusing non-polymorphic behaviour.',
    },
    {
      q: 'Which access modifier makes a member visible only within the declaring class and its derived classes?',
      options: [
        'internal',
        'private',
        'protected',
        'protected internal',
      ],
      answer: 2,
      explanation: '<code>protected</code> means "this class and any class that derives from it" — in any assembly. <code>internal</code> is assembly-scoped. <code>protected internal</code> is the union — accessible in derived classes anywhere OR anything in the same assembly.',
    },
    {
      q: 'What is private protected (C# 7.2)?',
      options: [
        'A synonym for protected internal',
        'Accessible in derived classes in the same assembly only — intersection of protected and internal',
        'Accessible only to private classes within the same file',
        'Accessible to any code in the same assembly or any derived class',
      ],
      answer: 1,
      explanation: '<code>private protected</code> is the intersection: both conditions must be true — the caller must be in a derived class AND in the same assembly. This is more restrictive than either alone. It prevents external assemblies from accessing "internal hooks" in your class hierarchy.',
    },
    {
      q: 'What is the primary use case for partial classes?',
      options: [
        'Improving runtime performance by splitting large classes',
        'Keeping hand-written code separate from tool-generated code in the same type',
        'Allowing two different assemblies to contribute to one class',
        'Enabling classes to implement more than one base class',
      ],
      answer: 1,
      explanation: 'Partial classes are merged by the compiler into a single type. The main use case is keeping hand-written business logic separate from code generated by tools — EF Core scaffolding, WinForms designer, Blazor code-behind, source generators. Both parts live in the same assembly and namespace.',
    },
    {
      q: 'You call a method through an Animal variable that holds a Dog object. The method is marked with new in Dog. What runs?',
      options: [
        'Dog\'s version — the runtime always picks the most-derived override',
        'Animal\'s version — new hides but is not polymorphic; the compile-time type determines dispatch',
        'Both versions run sequentially',
        'A MissingMethodException is thrown',
      ],
      answer: 1,
      explanation: '<code>new</code> (hiding) only affects the compile-time type. When the variable is declared as <code>Animal</code>, the compiler resolves to <code>Animal.Method()</code>. Only <code>override</code> updates the vtable so that runtime dispatch picks the most-derived implementation regardless of the variable\'s declared type.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use an abstract class versus an interface?',
      a: 'Use an <code>abstract class</code> when you have shared implementation or shared state that all derived types genuinely need — for example, a base <code>Repository&lt;T&gt;</code> that holds the <code>DbContext</code>. Use an <code>interface</code> when you are defining a <em>capability</em> that unrelated types can implement (<code>IDisposable</code>, <code>IComparable&lt;T&gt;</code>). Remember: a class can implement many interfaces but only inherit one base class. When in doubt, start with an interface — it is easier to add implementation later than to undo a base class dependency.',
    },
    {
      q: 'Why would I mark a class sealed?',
      a: 'Two reasons: <strong>correctness</strong> — if the class relies on invariants that subclass overrides could violate, sealing prevents accidental breakage. <strong>Performance</strong> — the JIT can de-virtualise method calls on sealed types, eliminating vtable dispatch overhead. The BCL seals many types (e.g. <code>string</code>) for both reasons. Prefer sealing non-leaf classes in library code to control your API surface.',
    },
    {
      q: 'A developer redefines a base class method in a derived class using `new` without realizing they forgot the `override` keyword (perhaps the base method was virtual and they intended to override it). Does the compiler flag this mistake, and how would a caller notice something is wrong?',
      a: 'The compiler DOES flag it, but only with a warning (CS0114), not an error — "\'Derived.Speak()\' hides inherited member \'Base.Speak()\'. To make the current member override that implementation, add the override keyword. Otherwise add the new keyword" — so the code compiles and runs with the (usually unintended) hiding behavior unless someone notices and reads the warning. The way this bug typically surfaces to a caller is subtle and easy to miss: code that calls the method through a base-typed reference or interface (very common in dependency-injected code, collections of a base type, or polymorphic method parameters) silently gets the BASE class behavior instead of the derived override the developer intended, producing wrong behavior with no exception or obvious error — exactly the kind of bug that survives code review unless the CS0114 warning is treated as a build-breaking issue (many teams configure warnings-as-errors specifically to catch this class of mistake).',
    },
    {
      q: 'What does "prefer composition over inheritance" mean in practice?',
      a: 'Instead of building an <code>EmailOrderService extends OrderService</code> hierarchy, inject both an <code>IRepository&lt;Order&gt;</code> and an <code>IEmailSender</code> as constructor parameters. Each dependency has a single, clear responsibility. Your class stays thin and every dependency can be swapped or mocked independently in tests. A rough guide: "is-a" → inheritance; "has-a" / "uses-a" → composition.',
    },
    {
      q: 'When should I use partial classes?',
      a: 'The canonical use case is keeping hand-written business logic separate from tool-generated code. EF Core scaffolding, WinForms/WPF designer, Blazor code-behind files, and Roslyn source generators all emit partial classes. You add your logic in a second partial file — the compiler merges them. The only restriction: all parts must be in the same assembly and the same namespace, and only one part can specify the base class.',
    },
    {
      q: 'What are the six access modifiers in C# and when do you use each?',
      a: '<code>public</code>: everywhere. <code>private</code>: only inside the declaring type. <code>protected</code>: declaring type + derived types (any assembly). <code>internal</code>: same assembly only. <code>protected internal</code>: union — protected OR internal (derived types anywhere + same assembly). <code>private protected</code> (C# 7.2): intersection — derived types in the same assembly only, more restrictive than either alone. The default for class members is <code>private</code>; for top-level types it is <code>internal</code>.',
    },
  ];

  challenge: Challenge = {
    title: 'Shape hierarchy with total area',
    description: `Implement a Shape hierarchy in C#:
1. An abstract class Shape with an abstract Area() method returning double, and a non-abstract Describe() method returning a formatted string.
2. A Circle class that takes a radius in its constructor.
3. A Rectangle class that takes width and height.
4. A sealed Square class extending Shape (not Rectangle).
5. A static method TotalArea(IEnumerable<Shape> shapes) returning the sum of all areas.`,
    language: 'csharp',
    hints: [
      'Mark Shape as abstract and declare "public abstract double Area();"',
      'Both Circle and Rectangle extend Shape and override Area()',
      'Use Math.PI * r * r for circle; width * height for rectangle; side * side for square',
      'TotalArea uses LINQ: shapes.Sum(s => s.Area())',
      'sealed class Square : Shape — not Square : Rectangle',
    ],
    starterCode: `public abstract class Shape
{
    public string Colour { get; init; } = "black";
    // TODO: abstract Area() method
    // TODO: Describe() method: "TypeName: area=X.XX, colour=Y"
}

public class Circle : Shape
{
    // TODO: constructor + override Area()
}

public class Rectangle : Shape
{
    // TODO: constructor + override Area()
}

public sealed class Square : Shape
{
    // TODO: constructor + override Area()
}

public static class ShapeUtils
{
    // TODO: TotalArea(IEnumerable<Shape> shapes) -> double
}`,
    solution: `public abstract class Shape
{
    public string Colour { get; init; } = "black";
    public abstract double Area();
    public string Describe() =>
        $"{GetType().Name}: area={Area():F2}, colour={Colour}";
}

public class Circle(double radius) : Shape
{
    public override double Area() => Math.PI * radius * radius;
}

public class Rectangle(double width, double height) : Shape
{
    public override double Area() => width * height;
}

public sealed class Square(double side) : Shape
{
    public override double Area() => side * side;
}

public static class ShapeUtils
{
    public static double TotalArea(IEnumerable<Shape> shapes)
        => shapes.Sum(s => s.Area());
}

// Usage
Shape[] shapes = [
    new Circle(5)       { Colour = "red" },
    new Rectangle(4, 6) { Colour = "blue" },
    new Square(3)       { Colour = "green" },
];
foreach (var s in shapes) Console.WriteLine(s.Describe());
Console.WriteLine($"Total: {ShapeUtils.TotalArea(shapes):F2}");
// 78.54 + 24.00 + 9.00 = 111.54`,
  };

  revision: RevisionSummary = {
    oneLiner: 'OOP in C# rests on four pillars: encapsulation (private fields + properties), inheritance (virtual/override), polymorphism (runtime dispatch), and abstraction (abstract classes + interfaces).',
    mustKnow: [
      'Encapsulation: keep fields private, expose via properties. Use <code>private set</code> / <code>init</code> / <code>required</code> to control mutation.',
      '<code>virtual</code> + <code>override</code> = polymorphism — runtime dispatches to most-derived version. <code>new</code> hides without polymorphism — almost always wrong.',
      'Abstract class: can have fields, constructors, shared implementation. Interface: pure contract, no fields, multiple implementation. A class inherits one but implements many.',
      '<code>sealed</code> on a class prevents inheritance; on a method, stops further overriding. JIT can de-virtualise sealed type calls for performance.',
      '<code>partial</code> splits a class across files — compiler merges them. Used to keep generated code separate from hand-written code.',
      'Access modifiers: public / private / protected / internal / protected internal (union) / private protected (intersection, same assembly).',
      'Prefer composition: inject dependencies via interfaces rather than inheriting; keep hierarchies ≤ 2 levels deep.',
    ],
    interviewFocus: [
      'What is the difference between override and new? (vtable replacement vs compile-time hiding)',
      'Abstract class vs interface — when to use each? (shared state/implementation vs capability contract)',
      'What is protected internal vs private protected? (union vs intersection)',
      'What does sealed do and why use it? (prevents inheritance; enables JIT de-virtualization)',
      'What is a partial class used for? (separate generated code from hand-written code)',
    ],
  };
}
