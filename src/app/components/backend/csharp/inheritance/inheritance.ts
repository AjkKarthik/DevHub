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
  selector: 'app-csharp-inheritance',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './inheritance.html',
  styleUrl: './inheritance.scss',
})
export class CsharpInheritance {

  quickRef: QuickRefItem[] = [
    { name: 'class Dog : Animal', type: 'syntax',   desc: 'Single inheritance — Dog derives from Animal, inheriting all accessible members' },
    { name: 'virtual',            type: 'keyword',  desc: 'Marks a method or property as overridable by derived classes' },
    { name: 'override',           type: 'keyword',  desc: 'Provides a new polymorphic implementation for a virtual or abstract member' },
    { name: 'new (hiding)',       type: 'keyword',  desc: 'Hides a base member without polymorphism — compile-time type decides which runs' },
    { name: 'sealed class',       type: 'keyword',  desc: 'Prevents any further derivation from this class' },
    { name: 'sealed override',    type: 'keyword',  desc: 'Overrides a virtual member AND prevents it from being overridden further down' },
    { name: 'base',               type: 'keyword',  desc: 'References the base class — used to call base constructors or methods' },
    { name: 'base(args)',         type: 'syntax',   desc: 'Calls the base class constructor from a derived constructor' },
    { name: 'protected',          type: 'keyword',  desc: 'Access modifier visible to the class and all derived classes' },
    { name: 'GetType()',          type: 'method',   desc: 'Returns the runtime type of the object — always the most-derived type' },
    { name: 'is',                 type: 'operator', desc: 'Type-check and optional binding: if (animal is Dog dog) { ... }' },
    { name: 'as',                 type: 'operator', desc: 'Safe cast — returns null instead of throwing if the cast fails' },
    { name: 'covariant return',   type: 'syntax',   desc: 'C# 9: override can return a more derived type than the base method declared' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Single inheritance with :',
      points: [
        'C# supports single class inheritance. A derived class is written <code>class Dog : Animal</code>.',
        'The derived class inherits all <code>public</code> and <code>protected</code> members of the base class (fields, properties, methods, events).',
        'The base class constructor is called first, before the derived constructor body runs. If you do not specify which base constructor to use with <code>: base(...)</code>, the parameterless one is called automatically.',
        'C# does <strong>not</strong> support multiple class inheritance — a class can have exactly one base class. Implement multiple interfaces to achieve the effect of multiple inheritance for contracts.',
        'Every class ultimately inherits from <code>System.Object</code>, which provides <code>ToString()</code>, <code>Equals()</code>, <code>GetHashCode()</code>, and <code>GetType()</code> to all types.',
      ],
    },
    {
      heading: 'virtual and override — polymorphism',
      points: [
        'Mark a method <code>virtual</code> in the base class to signal that derived classes may provide their own implementation.',
        'A derived class uses <code>override</code> to replace the method. The replacement is installed in the vtable (virtual dispatch table) and is called even when the object is referenced through a base-class variable.',
        'Call <code>base.MethodName()</code> from inside an override to invoke the original base implementation — useful when extending rather than fully replacing behaviour.',
        'If a base method is not marked <code>virtual</code> (or <code>abstract</code>), it <em>cannot</em> be overridden — only hidden with <code>new</code>.',
        'Properties can also be <code>virtual</code> and <code>override</code>: <code>public virtual string Name { get; }</code> in the base, <code>public override string Name => base.Name.ToUpper();</code> in the derived.',
      ],
    },
    {
      heading: 'new — hiding, not overriding',
      points: [
        'The <code>new</code> modifier on a derived method <em>hides</em> the base member. Unlike <code>override</code>, the hidden method does <strong>not</strong> participate in virtual dispatch.',
        'If you hold the derived object in a base-type variable and call the method, you get the <em>base</em> version — not the hidden one. This is the hiding trap.',
        'The compiler emits a warning if you shadow a base member without the <code>new</code> keyword — adding <code>new</code> silences the warning but does not change runtime behaviour.',
        'Hiding is almost always a design mistake. Reserve it for the rare case where you intentionally want a member with the same name but completely unrelated semantics (e.g. a property that returns a more specific type).',
        'C# 9 covariant return types provide a type-safe alternative to one common <code>new</code> use case — see the section below.',
      ],
    },
    {
      heading: 'sealed — locking the hierarchy',
      points: [
        '<code>sealed class</code> prevents any class from inheriting it. <code>string</code> in the BCL is sealed, for example.',
        '<code>sealed override</code> overrides a virtual member <em>and</em> prevents further derived classes from overriding it again — useful in middle layers of a hierarchy.',
        'Sealing is a correctness tool — use it when subclassing would break invariants your class relies on, or when the class\'s semantics are only correct as implemented.',
        'The JIT can de-virtualise calls on sealed types, making virtual dispatch as fast as a direct call — a secondary performance benefit that is measurable in hot loops.',
        'Sealed methods are useful even when the class itself is not sealed: <code>public sealed override void Validate()</code> stops a specific override from being re-overridden without sealing the whole class.',
      ],
    },
    {
      heading: 'base keyword and constructor chaining',
      points: [
        '<code>base.Method()</code> inside a derived method calls the base class version explicitly — useful in overrides that extend rather than replace.',
        '<code>: base(arg1, arg2)</code> in a constructor signature chains to a specific base constructor.',
        'Base constructors always run before the derived constructor body. The order for a three-level hierarchy: grandparent → parent → child.',
        'If no base constructor is specified and the base has no parameterless constructor, you get a compile error — you must explicitly call one with <code>: base(...)</code>.',
        'Field initializers run before the constructor body of their own class. So for A → B → C: A\'s fields → A\'s ctor body → B\'s fields → B\'s ctor body → C\'s fields → C\'s ctor body.',
      ],
    },
    {
      heading: 'Covariant return types (C# 9)',
      points: [
        'Before C# 9, an override had to return the exact same type as the base method. C# 9 relaxed this: an override can return a <em>more derived</em> (more specific) type.',
        'Example: base class declares <code>virtual Animal GetAnimal()</code>; derived class can <code>override Dog GetAnimal()</code> — returning <code>Dog</code> (which is-an Animal). This is type-safe because a <code>Dog</code> is always a valid <code>Animal</code>.',
        'This eliminates the need for a <code>new</code> method or a cast at the call site when callers know they have the derived type: <code>Dog d = myDogFactory.GetAnimal();</code> — no cast needed.',
        'Covariant return types are a cleaner alternative to one of the most common legitimate uses of method hiding (<code>new</code>).',
        'The CLR has always supported covariant return types; C# 9 simply exposes this capability at the language level. Under the hood the compiler emits both the covariant override and a bridge method satisfying the original signature.',
      ],
    },
    {
      heading: 'Favour composition over deep inheritance',
      points: [
        'Deep hierarchies are brittle — a change in a base class can break all derived classes in unexpected ways, especially when the Liskov Substitution Principle is violated.',
        'Prefer injecting dependencies via constructor parameters typed to interfaces (<strong>composition</strong>) rather than inheriting implementation.',
        'Inheritance is best reserved for true "is-a" relationships with genuinely shared behaviour — keep hierarchies shallow (1–2 levels).',
        'Ask: "Does the derived class truly specialise the base?" If the answer is "it just needs some of its methods", composition is a better fit.',
        'The Gang of Four design patterns that replace deep inheritance: Strategy (inject behaviour), Decorator (wrap and extend), and Composite (tree of objects).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'virtual & override',
      language: 'csharp',
      code: `// Base class with virtual members
public class Animal
{
    public string Name { get; }
    public Animal(string name) => Name = name;

    public virtual string Speak() => "...";

    // Virtual property — can be overridden too
    public virtual string Description => $"{GetType().Name} named {Name}";
}

public class Dog : Animal
{
    public Dog(string name) : base(name) { }

    public override string Speak() => "Woof!";

    // override + extend — call base to keep base text
    public override string Description => $"{base.Description} (domestic)";
}

public class Cat : Animal
{
    public Cat(string name) : base(name) { }
    public override string Speak() => "Meow!";
}

// Polymorphism — base-type reference, derived-type implementation
Animal[] animals = [new Dog("Rex"), new Cat("Whiskers"), new Dog("Buddy")];

foreach (var a in animals)
    Console.WriteLine($"{a.Name}: {a.Speak()}");
// Rex: Woof!
// Whiskers: Meow!
// Buddy: Woof!

// Runtime type check with pattern matching
foreach (var a in animals)
{
    if (a is Dog dog)
        Console.WriteLine(dog.Description);  // only Dogs enter here
}`,
    },
    {
      label: 'new vs override',
      language: 'csharp',
      code: `public class Base
{
    public string Greet() => "Hello from Base";   // NOT virtual
    public virtual string Info() => "Base.Info";
}

public class Derived : Base
{
    // new — hides base Greet() without polymorphism
    public new string Greet() => "Hello from Derived";

    public override string Info() => "Derived.Info";
}

// Demonstrate the hiding trap
Derived d = new Derived();
Base b = d;             // same object, different reference type

Console.WriteLine(d.Greet());   // "Hello from Derived"  (compile-time: Derived)
Console.WriteLine(b.Greet());   // "Hello from Base"     (compile-time: Base ← TRAP!)

// Override is always polymorphic — runtime type wins
Console.WriteLine(d.Info());    // "Derived.Info"
Console.WriteLine(b.Info());    // "Derived.Info" ← correct!

// ── C# 9 covariant return type — type-safe alternative to new ─────────
public class AnimalFactory
{
    public virtual Animal Create(string name) => new Animal(name);
}

public class DogFactory : AnimalFactory
{
    // Covariant return: override returns Dog (more derived than Animal)
    // Callers using DogFactory get a Dog without casting
    public override Dog Create(string name) => new Dog(name);
}

DogFactory df = new DogFactory();
Dog myDog = df.Create("Rex");         // no cast needed
Animal a2  = df.Create("Spot");       // also valid — Dog is-an Animal`,
    },
    {
      label: 'sealed & base()',
      language: 'csharp',
      code: `// Three-level hierarchy — constructors chain upward
public class Vehicle
{
    public string Make { get; }
    public int Year { get; }

    public Vehicle(string make, int year)
    {
        Make = make;
        Year = year;
        Console.WriteLine($"Vehicle ctor: {make} ({year})");
    }

    public virtual string Describe() => $"{Year} {Make}";
}

public class Car : Vehicle
{
    public int Doors { get; }

    public Car(string make, int year, int doors) : base(make, year)
    {
        Doors = doors;
        Console.WriteLine($"Car ctor: {doors} doors");
    }

    public override string Describe() => $"{base.Describe()}, {Doors}-door car";
}

// sealed — no class may derive from ElectricCar
public sealed class ElectricCar : Car
{
    public int RangeKm { get; }

    public ElectricCar(string make, int year, int doors, int rangeKm)
        : base(make, year, doors)
    {
        RangeKm = rangeKm;
        Console.WriteLine($"ElectricCar ctor: {rangeKm} km range");
    }

    // sealed override — overrides AND locks further overriding
    public sealed override string Describe()
        => $"{base.Describe()}, EV {RangeKm} km range";
}

// Constructor order: Vehicle → Car → ElectricCar
var ev = new ElectricCar("Tesla", 2024, 4, 560);
Console.WriteLine(ev.Describe());
// Tesla (2024) → 2024 Tesla, 4-door car, EV 560 km range

// class SportEV : ElectricCar { }  ← CS0509: sealed class`,
    },
    {
      label: 'Polymorphism patterns',
      language: 'csharp',
      code: `// Template Method pattern using abstract + virtual
public abstract class Logger
{
    // Fixed algorithm — variable steps
    public void Log(string level, string message)
    {
        if (!ShouldLog(level)) return;
        var formatted = Format(level, message);
        Write(formatted);
    }

    protected virtual bool ShouldLog(string level) => true;
    protected virtual string Format(string level, string msg)
        => $"[{DateTime.UtcNow:HH:mm:ss}] [{level}] {msg}";

    protected abstract void Write(string entry);   // must implement
}

public class ConsoleLogger : Logger
{
    protected override void Write(string entry) => Console.WriteLine(entry);
}

public sealed class FileLogger : Logger
{
    private readonly string _path;
    public FileLogger(string path) => _path = path;

    protected override void Write(string entry)
        => File.AppendAllText(_path, entry + Environment.NewLine);
}

public class DebugLogger : Logger
{
    // Only log DEBUG-level messages
    protected override bool ShouldLog(string level)
        => level.Equals("DEBUG", StringComparison.OrdinalIgnoreCase);

    protected override void Write(string entry)
        => Console.WriteLine($"[DEBUG] {entry}");
}

// All loggers through the same contract
Logger[] loggers = [new ConsoleLogger(), new DebugLogger()];

foreach (var logger in loggers)
{
    logger.Log("INFO",  "Server started");  // DebugLogger filters this out
    logger.Log("DEBUG", "Cache miss");      // both log this
}

// is / as for safe type interrogation
foreach (var logger in loggers)
{
    if (logger is FileLogger fl)
        Console.WriteLine($"File logger path: {fl}");

    var dl = logger as DebugLogger;
    if (dl is not null)
        Console.WriteLine("Found debug logger");
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using new (hiding) expecting polymorphic behaviour',
      wrong: `public class Renderer
{
    public string Render() => "<base>";
}

public class HtmlRenderer : Renderer
{
    public new string Render() => "<html>";  // hiding, not polymorphic
}

Renderer r = new HtmlRenderer();
Console.WriteLine(r.Render());  // "<base>" — callers get the wrong version!`,
      right: `public class Renderer
{
    public virtual string Render() => "<base>";
}

public class HtmlRenderer : Renderer
{
    public override string Render() => "<html>";
}

Renderer r = new HtmlRenderer();
Console.WriteLine(r.Render());  // "<html>" — correct runtime dispatch`,
      explanation: 'new hides the method at compile time only. Calling through a base-type reference (the common case when polymorphism is the goal) always invokes the base version. Make the base method virtual and use override to get the runtime dispatch you almost certainly intended.',
    },
    {
      title: 'Forgetting : base() when the base class has no parameterless constructor',
      wrong: `public class Shape
{
    public string Colour { get; }
    public Shape(string colour) { Colour = colour; }
    // No parameterless constructor!
}

public class Circle : Shape
{
    public double Radius { get; }
    public Circle(double radius)  // CS7036: no base() call
    {
        Radius = radius;
    }
}`,
      right: `public class Circle : Shape
{
    public double Radius { get; }
    public Circle(double radius, string colour)
        : base(colour)   // explicit base constructor call
    {
        Radius = radius;
    }
}`,
      explanation: 'When a base class defines only parameterized constructors, the compiler cannot automatically call one — you must provide : base(args) explicitly. Omitting it is a compile error (CS7036). If you want both styles, add a parameterless constructor to the base, or add a default-colour overload to the derived class.',
    },
    {
      title: 'Building hierarchies deeper than 2–3 levels',
      wrong: `// 5-level hierarchy — brittle, hard to follow
public class Entity { }
public class NamedEntity : Entity { }
public class AddressableEntity : NamedEntity { }
public class Customer : AddressableEntity { }
public class PremiumCustomer : Customer { }
// A change in Entity ripples through all 5 levels`,
      right: `// Shallow hierarchy + composition
public class Customer
{
    public required string Name    { get; init; }
    public required Address Address { get; init; }
    public CustomerTier Tier { get; private set; } = CustomerTier.Standard;

    public void Upgrade() => Tier = CustomerTier.Premium;
}`,
      explanation: 'Each inheritance level tightly couples every derived class to the one above. A rename or new required field in Entity propagates through 5 files. The composition alternative flattens the hierarchy: Customer holds its dependencies as properties or injected collaborators, making each independently changeable.',
    },
    {
      title: 'Calling a virtual method from a constructor',
      wrong: `public class Base
{
    protected string _name;
    public Base() { Initialize(); }        // calls the overridden version
    public virtual void Initialize() => _name = "Base";
}

public class Derived : Base
{
    private readonly string _prefix = "Mr.";

    public override void Initialize()
        => _name = _prefix + " " + _name;  // _prefix is null here!
}`,
      right: `public class Base
{
    protected string _name = "Base";
    // Do NOT call virtual in constructor
    // Use a factory method or Initialize-after-construction pattern
}

public class Derived : Base
{
    private readonly string _prefix = "Mr.";
    public void SetupName() => _name = $"{_prefix} {_name}";
}`,
      explanation: 'When a base constructor calls a virtual method, the derived override runs — but at that point the derived class\'s fields may not yet be initialized (field initializers run after the base constructor). This produces null references or default values. Never call virtual or abstract methods from constructors.',
    },
    {
      title: 'Overriding without calling base() when the base has critical logic',
      wrong: `public class AuditedRepository : Repository
{
    public override async Task SaveAsync(Entity e)
    {
        // Completely replaced — base.SaveAsync never called
        await _db.SaveChangesAsync();
        // Missing: base validation, transaction scope, retry logic
    }
}`,
      right: `public class AuditedRepository : Repository
{
    public override async Task SaveAsync(Entity e)
    {
        await base.SaveAsync(e);           // run base logic first
        await _auditLog.RecordAsync(e);    // then extend with audit
    }
}`,
      explanation: 'Overriding a method completely replaces it — base logic is silently skipped. If the base class does important work (validation, transaction management, logging), always call base.SaveAsync() unless you intentionally take over all responsibility. Document the decision when you intentionally omit the base call.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What happens when you call a virtual method through a base-class reference that points to a derived instance?',
      options: [
        'The base class version always runs',
        'A compile error is thrown',
        'The derived override runs — virtual dispatch selects the runtime type',
        'The behaviour is undefined',
      ],
      answer: 2,
      explanation: 'This is the heart of polymorphism. When a method is <code>virtual</code> and the derived class <code>override</code>s it, the runtime looks up the actual type of the object and dispatches to the most-derived override — regardless of the variable\'s declared type.',
    },
    {
      q: 'What is the difference between override and new when redefining an inherited method?',
      options: [
        'They are interchangeable — just different syntax',
        'override participates in virtual dispatch; new hides the member at compile time only',
        'new works on virtual methods; override works on non-virtual',
        'override only applies to static methods',
      ],
      answer: 1,
      explanation: '<code>override</code> replaces the base method in the vtable — calling through a base-type reference dispatches to the derived version. <code>new</code> hides the member at the compile-time call site only — a base-type reference still calls the base version. Prefer <code>override</code> + <code>virtual</code>.',
    },
    {
      q: 'How do you call Animal\'s constructor from Cat\'s constructor?',
      options: [
        'super(name) inside the Cat constructor body',
        ': base(name) after the Cat constructor\'s parameter list',
        'base.Animal(name) inside the constructor body',
        'Animal(name) as the first statement in the Cat constructor',
      ],
      answer: 1,
      explanation: 'In C# you chain to a base constructor with <code>: base(args)</code> on the constructor declaration — for example <code>public Cat(string name) : base(name) { }</code>. The base constructor always runs before the derived body.',
    },
    {
      q: 'What does sealing a class prevent?',
      options: [
        'The class from implementing interfaces',
        'Its methods from being called externally',
        'Other classes from inheriting from it',
        'Its fields from being modified after construction',
      ],
      answer: 2,
      explanation: '<code>sealed class</code> prevents derivation — no other class can extend it. It does not affect interface implementation, field mutability, or method visibility. The JIT can de-virtualise calls on sealed types as a secondary performance benefit.',
    },
    {
      q: 'What does C# 9 covariant return type enable?',
      options: [
        'A method can be overridden to return a less derived type',
        'An override can return a more derived type than declared in the base method',
        'Return types can be inferred automatically',
        'Virtual methods can return value types instead of reference types',
      ],
      answer: 1,
      explanation: 'C# 9 covariant returns allow an override to declare a more specific (more derived) return type than the base method. If the base says <code>virtual Animal Create()</code>, a derived factory can say <code>override Dog Create()</code> — type-safe because Dog is-an Animal. Callers holding a reference to the derived factory get Dog without casting.',
    },
    {
      q: 'In what order do constructors run when creating an instance of C, which inherits from B, which inherits from A?',
      options: [
        'C → B → A',
        'A → B → C',
        'A, B, and C constructors run simultaneously',
        'Only C\'s constructor runs; base constructors are implicit',
      ],
      answer: 1,
      explanation: 'Base constructors always run before derived ones. For A → B → C, the order is A\'s constructor first, then B\'s, then C\'s. Field initializers for each class run just before their own constructor body: A\'s fields → A\'s ctor body → B\'s fields → B\'s ctor body → C\'s fields → C\'s ctor body.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can a derived class call the base class\'s original virtual method from inside its override?',
      a: 'Yes — use <code>base.MethodName()</code> inside the override. This is the <em>extend-not-replace</em> pattern: <code>public override string Describe() => $"{base.Describe()}, extra info";</code>. It is especially useful in constructors and in the Template Method pattern where you want to add to the base behaviour rather than discard it entirely.',
    },
    {
      q: 'Why is method hiding with new almost always wrong?',
      a: 'Because it breaks the Liskov Substitution Principle — a <code>DerivedClass</code> object referenced as a <code>BaseClass</code> silently calls the old method. This creates hard-to-spot bugs when code passes a derived object to a method that expects the base type. If you need different behaviour, make the base method <code>virtual</code> and use <code>override</code> instead. Reserve <code>new</code> for the rare case where you genuinely need a member with the same name but completely different semantics.',
    },
    {
      q: 'What is the constructor execution order in an inheritance chain?',
      a: 'Base constructors always execute before derived ones. For a chain <code>A → B → C</code>, the order is A\'s constructor first, then B\'s, then C\'s. Field initializers run just before their own class\'s constructor body: A\'s fields → A\'s ctor body → B\'s fields → B\'s ctor body → C\'s fields → C\'s ctor body. The <code>: base()</code> call triggers this chain.',
    },
    {
      q: 'When should I prefer composition over inheritance?',
      a: 'When the "is-a" relationship does not hold cleanly, or when you want to mix capabilities from multiple sources (C# only allows one base class). Inject dependencies as constructor parameters typed to interfaces rather than inheriting their implementations. This keeps classes thin, each dependency independently swappable, and the whole thing easy to unit-test without complex base-class setup.',
    },
    {
      q: 'What is a covariant return type and when would I use it?',
      a: 'Introduced in C# 9, a covariant return type lets an override declare a more specific return type than the base method. If a factory base class declares <code>virtual Animal Create()</code>, a dog factory can override it as <code>override Dog Create()</code> — callers with a <code>DogFactory</code> reference get a <code>Dog</code> without casting. It eliminates a common reason to use <code>new</code> (hiding) for type-narrowing purposes.',
    },
    {
      q: 'Is it safe to call a virtual method from a constructor?',
      a: 'No — it is a well-known anti-pattern. When a base constructor calls a virtual method, the most-derived override runs — but at that point the derived class\'s field initializers have run, so the fields have their default/initialized values, but the derived constructor body has NOT yet run. If the override depends on constructor-assigned state (from the derived constructor), it reads stale or default values. Never call virtual or abstract methods from constructors.',
    },
  ];

  challenge: Challenge = {
    title: 'Employee payroll hierarchy',
    description: `Build a small payroll hierarchy in C#:
1. A base class Employee with Name (string) and BaseSalary (decimal), and a virtual CalculatePay() returning BaseSalary.
2. FullTimeEmployee: inherits Employee, CalculatePay() returns BaseSalary unchanged.
3. ContractEmployee: adds HourlyRate and HoursWorked, overrides CalculatePay() to return HourlyRate * HoursWorked.
4. Manager: inherits FullTimeEmployee, adds Bonus, overrides CalculatePay() to return base.CalculatePay() + Bonus.
5. Static method Payroll.Total(IEnumerable<Employee>) returning the sum of all pay.`,
    language: 'csharp',
    hints: [
      'Use : base(name, salary) to chain constructors',
      'ContractEmployee passes 0 for BaseSalary and ignores it — override CalculatePay()',
      'Manager calls base.CalculatePay() and adds Bonus on top',
      'Payroll.Total uses LINQ: employees.Sum(e => e.CalculatePay())',
    ],
    starterCode: `public class Employee
{
    // TODO: Name, BaseSalary, virtual CalculatePay()
}

public class FullTimeEmployee : Employee
{
    // TODO: constructor chaining to base
}

public class ContractEmployee : Employee
{
    // TODO: HourlyRate, HoursWorked, override CalculatePay()
}

public class Manager : FullTimeEmployee
{
    // TODO: Bonus, override CalculatePay() = base + Bonus
}

public static class Payroll
{
    // TODO: Total(IEnumerable<Employee>) -> decimal
}`,
    solution: `public class Employee
{
    public string Name { get; }
    public decimal BaseSalary { get; }

    public Employee(string name, decimal baseSalary)
    {
        Name       = name;
        BaseSalary = baseSalary;
    }

    public virtual decimal CalculatePay() => BaseSalary;
}

public class FullTimeEmployee : Employee
{
    public FullTimeEmployee(string name, decimal salary) : base(name, salary) { }
    // CalculatePay() inherited — returns BaseSalary
}

public class ContractEmployee : Employee
{
    public decimal HourlyRate  { get; }
    public decimal HoursWorked { get; }

    public ContractEmployee(string name, decimal hourlyRate, decimal hoursWorked)
        : base(name, 0m)
    {
        HourlyRate  = hourlyRate;
        HoursWorked = hoursWorked;
    }

    public override decimal CalculatePay() => HourlyRate * HoursWorked;
}

public class Manager : FullTimeEmployee
{
    public decimal Bonus { get; }

    public Manager(string name, decimal salary, decimal bonus)
        : base(name, salary) => Bonus = bonus;

    public override decimal CalculatePay() => base.CalculatePay() + Bonus;
}

public static class Payroll
{
    public static decimal Total(IEnumerable<Employee> employees)
        => employees.Sum(e => e.CalculatePay());
}

// Usage
Employee[] staff =
[
    new FullTimeEmployee("Alice", 4000m),
    new ContractEmployee("Bob", 50m, 120m),
    new Manager("Carol", 6000m, 1500m),
];
foreach (var e in staff)
    Console.WriteLine($"{e.Name}: {e.CalculatePay():C}");
Console.WriteLine($"Total: {Payroll.Total(staff):C}");
// Alice: £4,000.00 | Bob: £6,000.00 | Carol: £7,500.00 | Total: £17,500.00`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Inheritance is the "is-a" mechanism: derived classes specialise base classes. virtual + override = polymorphism. new = hiding (almost always wrong). sealed = no further derivation.',
    mustKnow: [
      '<code>virtual</code> + <code>override</code> enables polymorphism — runtime dispatch picks the most-derived override regardless of the variable\'s declared type.',
      '<code>new</code> hides the base method at compile time only. Calling through a base-type reference still runs the base version. Almost always wrong — use <code>override</code>.',
      'Constructor chain order: A\'s ctor → B\'s ctor → C\'s ctor. Field initializers run before each class\'s own constructor body.',
      '<code>sealed class</code> prevents derivation. <code>sealed override</code> overrides AND prevents further overriding. The JIT can de-virtualise sealed-type calls.',
      'C# 9 covariant return types: an override can return a more derived type than the base method declared — eliminates casting at call sites.',
      'Never call virtual methods from constructors — the derived override runs before derived constructor-assigned state is ready.',
      'Keep hierarchies shallow (1–2 levels). For deeper capability needs, prefer composition via injected interfaces.',
    ],
    interviewFocus: [
      'What is virtual dispatch and how does it differ from new (hiding)? (vtable replacement vs compile-time shadow)',
      'What is the constructor execution order in A → B → C? (A → B → C; fields before body at each level)',
      'Why is calling a virtual method from a constructor dangerous? (override runs before derived constructor body; state is incomplete)',
      'What does sealed do and why use it? (prevents inheritance; enables JIT de-virtualization)',
      'What is a covariant return type (C# 9)? (override returns more-derived type; no cast needed at call site)',
    ],
  };
}
