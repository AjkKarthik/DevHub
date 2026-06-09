import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-oop',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './oop.html',
  styleUrl: './oop.scss',
})
export class CsharpOop {

  quickRef: QuickRefItem[] = [
    { name: 'class',            type: 'keyword',   desc: 'Reference type that supports encapsulation, inheritance, and polymorphism' },
    { name: 'interface',        type: 'interface', desc: 'Contract defining what a type must do — no fields, supports multiple implementation' },
    { name: 'abstract',         type: 'keyword',   desc: 'Marks a class or member as incomplete — cannot instantiate, must be overridden' },
    { name: 'sealed',           type: 'keyword',   desc: 'Prevents a class from being inherited or a virtual member from being overridden further' },
    { name: 'override',         type: 'keyword',   desc: 'Provides a new implementation for a virtual or abstract member in a derived class' },
    { name: 'virtual',          type: 'keyword',   desc: 'Marks a method or property as overridable by derived classes' },
    { name: 'base',             type: 'keyword',   desc: 'Accesses members of the base class from a derived class, including constructors' },
    { name: 'this',             type: 'keyword',   desc: 'Refers to the current instance; also used to chain constructors within a class' },
    { name: 'protected',        type: 'keyword',   desc: 'Access modifier — visible within the class and all derived classes' },
    { name: 'readonly',         type: 'keyword',   desc: 'Field can only be assigned at declaration or in a constructor — immutable after that' },
    { name: 'new (hiding)',     type: 'keyword',   desc: 'Hides an inherited member without polymorphism — avoid; prefer override instead' },
    { name: 'is / as',          type: 'syntax',    desc: 'Type-check (is) and safe cast (as) operators — as returns null instead of throwing' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Encapsulation — hide implementation, expose behaviour',
      points: [
        'Encapsulation means grouping data and the methods that operate on it inside a class, and controlling access with modifiers.',
        '<code>public</code> — accessible anywhere. <code>private</code> — only within the class. <code>protected</code> — class and derived classes. <code>internal</code> — within the same assembly.',
        'Use <strong>properties</strong> (with getters/setters) rather than public fields — they let you add validation or computed logic without breaking callers.',
        'Mark fields <code>private readonly</code> when they should not change after construction — the compiler enforces it.',
      ],
    },
    {
      heading: 'Inheritance and polymorphism',
      points: [
        'A <em>derived</em> class (<code>class Dog : Animal</code>) inherits all accessible members of the <em>base</em> class.',
        'Mark methods <code>virtual</code> in the base class to allow derived classes to <code>override</code> them. Without <code>virtual</code>, the method cannot be overridden.',
        'Polymorphism: a variable of type <code>Animal</code> can hold a <code>Dog</code> or <code>Cat</code> and the correct overridden method is dispatched at runtime.',
        'Use <code>base.Method()</code> to call the base implementation from an override — useful when extending rather than replacing behaviour.',
        'C# supports single-class inheritance only. Use interfaces for multiple capability contracts.',
      ],
    },
    {
      heading: 'Interfaces as contracts',
      points: [
        'An interface specifies <em>what</em> a type must do, not <em>how</em>. Any class implementing it must provide all members.',
        'A class can implement multiple interfaces: <code>class Service : IRepository&lt;T&gt;, IDisposable</code>.',
        'Interfaces enable Dependency Injection — code against <code>IRepository&lt;T&gt;</code>, inject any concrete implementation at runtime.',
        'Since C# 8, interfaces may have <strong>default method implementations</strong> — useful for adding methods without breaking existing implementors.',
        'Name interfaces with an <code>I</code> prefix by convention: <code>ILogger</code>, <code>IDisposable</code>, <code>IComparable&lt;T&gt;</code>.',
      ],
    },
    {
      heading: 'Prefer composition over inheritance',
      points: [
        'Deep inheritance hierarchies are brittle — a change in the base class ripples through every derived class.',
        'Favour <strong>composition</strong>: inject dependencies as constructor parameters typed to interfaces rather than inheriting from them.',
        'An <code>OrderService</code> that receives <code>IRepository&lt;Order&gt;</code> and <code>IEmailSender</code> in its constructor is easy to test in isolation.',
        'Abstract base classes are useful for true "is-a" relationships with shared implementation — but keep hierarchies shallow (1–2 levels).',
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
    // required (C# 11) — must be set in object initialiser
    public required string Name { get; set; }

    // init-only — set at construction, immutable afterwards
    public Guid Id { get; init; } = Guid.NewGuid();

    // Private setter — only mutated inside the class
    public decimal Price { get; private set; }

    // Computed property — no setter
    public bool IsExpensive => Price > 500m;

    // readonly field — set once in constructor
    private readonly DateTime _createdAt;

    public Product(decimal price)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(price);
        Price = price;
        _createdAt = DateTime.UtcNow;
    }

    public void ApplyDiscount(decimal pct)
    {
        if (pct is <= 0 or > 100)
            throw new ArgumentOutOfRangeException(nameof(pct), "Must be 1-100");
        Price *= (1 - pct / 100m);
    }

    // Expression-bodied method
    public override string ToString() => $"{Name} — £{Price:F2}";
}

// C# 12 — Primary constructor (concise syntax)
public class Point(double x, double y)
{
    public double X { get; } = x;
    public double Y { get; } = y;
    public double DistanceTo(Point other)
        => Math.Sqrt(Math.Pow(X - other.X, 2) + Math.Pow(Y - other.Y, 2));
}

// Object initialiser using required properties
var laptop = new Product(999m) { Name = "Laptop Pro" };
laptop.ApplyDiscount(10);
Console.WriteLine(laptop);          // Laptop Pro — £899.10
Console.WriteLine(laptop.IsExpensive); // True`,
    },
    {
      label: 'Inheritance',
      language: 'csharp',
      code: `// Base class — virtual members can be overridden
public class Animal
{
    public string Name { get; }

    public Animal(string name) => Name = name;

    // virtual — derived classes may override
    public virtual string Speak() => "...";

    public override string ToString() => $"{GetType().Name}({Name})";
}

// Abstract class — cannot be instantiated, enforces contract
public abstract class Shape
{
    public string Colour { get; init; } = "black";

    // abstract — no body here, derived class MUST implement
    public abstract double Area();
    public abstract double Perimeter();

    // Non-abstract method — shared implementation
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

// sealed — no further inheritance allowed
public sealed class Square(double side) : Shape
{
    public override double Area()      => side * side;
    public override double Perimeter() => 4 * side;
}

// Polymorphism in action
Shape[] shapes = [
    new Circle(5)       { Colour = "red" },
    new Rectangle(4, 6) { Colour = "blue" },
    new Square(3)       { Colour = "green" },
];

foreach (var s in shapes)
    Console.WriteLine(s.Describe());

// base — calling base constructor and methods
public class Dog(string name) : Animal(name)
{
    public override string Speak() => "Woof!";

    // Extend, not replace — call base first
    public string FullGreeting() => $"{base.Speak()} {Speak()} I'm {Name}!";
}`,
    },
    {
      label: 'Interfaces',
      language: 'csharp',
      code: `// Generic repository interface — contract, no implementation
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

// Separate notification contract
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body);
}

// Concrete implementation — class fulfils the contract
public class SqlOrderRepository : IRepository<Order>
{
    private readonly AppDbContext _db;
    public SqlOrderRepository(AppDbContext db) => _db = db;

    public async Task<Order?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _db.Orders.FindAsync([id], ct);

    public async Task<IReadOnlyList<Order>> GetAllAsync(CancellationToken ct = default)
        => await _db.Orders.ToListAsync(ct);

    public async Task AddAsync(Order order, CancellationToken ct = default)
    {
        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Order order, CancellationToken ct = default)
    {
        _db.Orders.Update(order);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var order = await GetByIdAsync(id, ct);
        if (order is not null) { _db.Orders.Remove(order); await _db.SaveChangesAsync(ct); }
    }
}

// Service depends on interfaces — not concrete classes
public class OrderService(IRepository<Order> repo, IEmailSender email)
{
    public async Task PlaceOrderAsync(Order order)
    {
        await repo.AddAsync(order);
        await email.SendAsync(order.CustomerEmail, "Order confirmed", $"Order #{order.Id} placed.");
    }
}

// A class can implement multiple interfaces
public class InMemoryOrderRepository : IRepository<Order>, IDisposable
{
    private readonly List<Order> _store = [];

    public Task<Order?> GetByIdAsync(int id, CancellationToken ct = default)
        => Task.FromResult(_store.FirstOrDefault(o => o.Id == id));

    public Task<IReadOnlyList<Order>> GetAllAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<Order>>(_store.AsReadOnly());

    public Task AddAsync(Order order, CancellationToken ct = default)
        { _store.Add(order); return Task.CompletedTask; }

    public Task UpdateAsync(Order order, CancellationToken ct = default)
        { var i = _store.FindIndex(o => o.Id == order.Id); if (i >= 0) _store[i] = order; return Task.CompletedTask; }

    public Task DeleteAsync(int id, CancellationToken ct = default)
        { _store.RemoveAll(o => o.Id == id); return Task.CompletedTask; }

    public void Dispose() => _store.Clear();
}`,
    },
    {
      label: 'Access Modifiers',
      language: 'csharp',
      code: `// public — accessible from anywhere
public class BankAccount
{
    // private — only visible inside BankAccount
    private decimal _balance;
    private readonly string _accountNumber;

    // public — anyone can read; private set — only the class writes
    public decimal Balance { get => _balance; private set => _balance = value; }

    // protected — BankAccount and derived classes only
    protected void SetBalance(decimal amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(amount);
        _balance = amount;
    }

    // internal — visible within the same assembly (.dll / .exe) only
    internal void ApplyInterest(decimal rate) => _balance += _balance * rate;

    // private protected — derived classes in the SAME assembly only
    private protected void AuditLog(string message)
        => Console.WriteLine($"[AUDIT] {_accountNumber}: {message}");

    // public constructor
    public BankAccount(string accountNumber, decimal initialBalance)
    {
        _accountNumber = accountNumber;
        _balance       = initialBalance;
    }

    public bool Withdraw(decimal amount)
    {
        if (amount > _balance) return false;
        _balance -= amount;
        AuditLog($"Withdrew {amount:C}");
        return true;
    }
}

// Derived class — can access protected and private protected members
public class SavingsAccount(string number, decimal balance, decimal rate)
    : BankAccount(number, balance)
{
    private readonly decimal _interestRate = rate;

    public void AddMonthlyInterest()
    {
        var interest = Balance * _interestRate;
        SetBalance(Balance + interest);      // protected — OK
        // _balance is private — NOT accessible here (compile error)
    }
}

// readonly on struct fields — immutable value type members
public readonly struct Money(decimal amount, string currency)
{
    public decimal Amount   { get; } = amount;
    public string  Currency { get; } = currency;

    // readonly method — cannot mutate state (struct)
    public Money ConvertTo(string toCurrency, decimal rate)
        => new(Amount * rate, toCurrency);
}`,
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
      explanation: 'An abstract class can carry fields, constructors, and fully-implemented methods — shared state and logic for derived types. An interface is a pure contract (fields not allowed) and a class may implement many. Use abstract class for "is-a" with shared implementation; interface for capabilities.',
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
      explanation: '<code>sealed</code> on a class prevents derivation — no other class can extend it. This is also a performance hint: the runtime can de-virtualise method calls on sealed types. Use it when inheritance would break the invariants your class maintains.',
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
      explanation: '<code>override</code> replaces the base method in the vtable — calling through a base-type reference dispatches to the derived method. <code>new</code> hides the member at compile time only — calling through a base-type reference still invokes the original. Avoid <code>new</code>; it leads to confusing, non-polymorphic behaviour.',
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
      explanation: '<code>protected</code> means "this class and any class that derives from it". <code>internal</code> is assembly-scoped. <code>protected internal</code> is the union — accessible by derived classes OR anything in the same assembly.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use an abstract class versus an interface?',
      a: 'Use an <code>abstract class</code> when you have shared implementation or shared state that all derived types genuinely need — for example, a base <code>Repository&lt;T&gt;</code> that holds the <code>DbContext</code>. Use an <code>interface</code> when you are defining a <em>capability</em> that unrelated types can implement (<code>IDisposable</code>, <code>IComparable&lt;T&gt;</code>). Remember: a class can implement many interfaces but only inherit one base class.',
    },
    {
      q: 'Why would I mark a class sealed?',
      a: 'Two reasons: <strong>correctness</strong> — if the class relies on invariants that subclass overrides could violate, sealing prevents accidental breakage. <strong>Performance</strong> — the JIT can de-virtualise method calls on sealed types, eliminating vtable dispatch overhead. The BCL seals many types (e.g. <code>string</code>) for both reasons.',
    },
    {
      q: 'What is the difference between method hiding (new) and overriding (override)?',
      a: 'With <code>override</code> the runtime dispatches based on the actual type of the object — polymorphic behaviour. With <code>new</code> (hiding) the compile-time type of the variable determines which method is called. If you hold a <code>Dog</code> in an <code>Animal</code> variable and call <code>Speak()</code>, <code>override</code> gives you the <code>Dog</code> version; <code>new</code> gives you the <code>Animal</code> version. Hiding is almost always a design mistake.',
    },
    {
      q: 'What does "prefer composition over inheritance" mean in practice?',
      a: 'Instead of building an <code>EmailOrderService extends OrderService</code> hierarchy, inject both an <code>IRepository&lt;Order&gt;</code> and an <code>IEmailSender</code> as constructor parameters. Each dependency has a single, clear responsibility. Your class stays thin and every dependency can be swapped or mocked independently in tests — making unit testing straightforward without complex base-class setup.',
    },
  ];

  challenge: Challenge = {
    title: 'Shape hierarchy with total area',
    description: `Implement a Shape hierarchy in C#:
1. An abstract class Shape with an abstract Area() method that returns double
2. A Circle class that takes a radius in its constructor
3. A Rectangle class that takes width and height
4. A static method TotalArea(IEnumerable<Shape> shapes) that returns the sum of all areas`,
    language: 'csharp',
    hints: [
      'Mark Shape as abstract and Area() as abstract double Area()',
      'Both Circle and Rectangle extend Shape and override Area()',
      'Math.PI * r * r for circle area; width * height for rectangle',
      'TotalArea can use LINQ: shapes.Sum(s => s.Area())',
    ],
    starterCode: `public abstract class Shape
{
    // TODO: declare abstract Area()
}

public class Circle : Shape
{
    // TODO: constructor + override Area()
}

public class Rectangle : Shape
{
    // TODO: constructor + override Area()
}

public static class ShapeUtils
{
    // TODO: TotalArea(IEnumerable<Shape> shapes) -> double
}`,
    solution: `public abstract class Shape
{
    public abstract double Area();
}

public class Circle(double radius) : Shape
{
    public override double Area() => Math.PI * radius * radius;
}

public class Rectangle(double width, double height) : Shape
{
    public override double Area() => width * height;
}

public static class ShapeUtils
{
    public static double TotalArea(IEnumerable<Shape> shapes)
        => shapes.Sum(s => s.Area());
}

// Usage
Shape[] shapes = [new Circle(5), new Rectangle(4, 6), new Circle(3)];
Console.WriteLine(ShapeUtils.TotalArea(shapes));
// 78.54 + 24.00 + 28.27 = 130.81`,
  };
}
