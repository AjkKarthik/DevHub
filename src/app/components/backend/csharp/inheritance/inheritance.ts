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
  selector: 'app-csharp-inheritance',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
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
    { name: 'GetType()',          type: 'method',   desc: 'Returns the runtime type of the object — useful for polymorphic logging/debugging' },
    { name: 'is',                 type: 'operator', desc: 'Type-check: if (animal is Dog dog) — also binds to a typed variable' },
    { name: 'as',                 type: 'operator', desc: 'Safe cast — returns null instead of throwing if the cast fails' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Single inheritance with :',
      points: [
        'C# supports single class inheritance. A derived class is written <code>class Dog : Animal</code>.',
        'The derived class inherits all <code>public</code> and <code>protected</code> members of the base class (fields, properties, methods).',
        'The base class constructor is called first, before the derived constructor body runs. If you do not specify which base constructor to use, the parameterless one is called.',
        'C# does <strong>not</strong> support multiple class inheritance, but a class can implement many interfaces, which fills that role.',
      ],
    },
    {
      heading: 'virtual and override — polymorphism',
      points: [
        'Mark a method <code>virtual</code> in the base class to signal that derived classes may provide their own implementation.',
        'A derived class uses <code>override</code> to replace the method. The replacement is installed in the vtable (virtual dispatch table) and called even when the object is referenced through a base-class variable.',
        'Call <code>base.MethodName()</code> from inside an override to invoke the original base implementation — useful when extending rather than fully replacing behaviour.',
        'If a base method is not marked <code>virtual</code> (or <code>abstract</code>), it <em>cannot</em> be overridden — only hidden with <code>new</code>.',
      ],
    },
    {
      heading: 'new — hiding, not overriding',
      points: [
        'The <code>new</code> modifier on a derived method <em>hides</em> the base member. Unlike <code>override</code>, the hidden method does <strong>not</strong> participate in virtual dispatch.',
        'If you hold the derived object in a base-type variable and call the method, you get the <em>base</em> version — not the hidden one.',
        'Hiding is almost always a design mistake. Reserve it for the rare case where you intentionally want a member with the same name but completely unrelated semantics.',
        'The compiler emits a warning if you shadow a base member without the <code>new</code> keyword — adding <code>new</code> silences the warning but does not change runtime behaviour.',
      ],
    },
    {
      heading: 'sealed — locking the hierarchy',
      points: [
        '<code>sealed class</code> prevents any class from inheriting it. <code>string</code> in the BCL is sealed, for example.',
        '<code>sealed override</code> overrides a virtual member <em>and</em> prevents further derived classes from overriding it again.',
        'Sealing is a correctness tool — use it when subclassing would break invariants your class relies on.',
        'The JIT can de-virtualise calls on sealed types, making virtual dispatch as fast as a direct call — a secondary performance benefit.',
      ],
    },
    {
      heading: 'base keyword and constructor chaining',
      points: [
        '<code>base.Method()</code> inside a derived method calls the base class version explicitly — useful in overrides that extend rather than replace.',
        '<code>: base(arg1, arg2)</code> in a constructor signature chains to a specific base constructor.',
        'Base constructors always run before the derived constructor body. The order for a three-level hierarchy: grandparent → parent → child.',
        'If no base constructor is specified and the base has no parameterless constructor, you get a compile error.',
      ],
    },
    {
      heading: 'Favour composition over deep inheritance',
      points: [
        'Deep hierarchies are brittle — a change in a base class can break all derived classes in unexpected ways.',
        'Prefer injecting dependencies via constructor parameters typed to interfaces (<strong>composition</strong>) rather than inheriting implementation.',
        'Inheritance is best reserved for true "is-a" relationships with genuinely shared behaviour — keep hierarchies shallow (1–2 levels).',
        'Ask: "Does the derived class truly specialise the base?" If the answer is "it just needs some of its methods", composition is a better fit.',
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

    // virtual — derived classes may override
    public virtual string Speak() => "...";

    // virtual property — can be overridden too
    public virtual string Description => \`\${GetType().Name} named \${Name}\`;
}

public class Dog : Animal
{
    public Dog(string name) : base(name) { }   // call base constructor

    // override — participates in virtual dispatch
    public override string Speak() => "Woof!";

    // override + extend — call base to keep base text
    public override string Description => \`\${base.Description} (domestic)\`;
}

public class Cat : Animal
{
    public Cat(string name) : base(name) { }

    public override string Speak() => "Meow!";
}

// Polymorphism — base-type reference, derived-type implementation
Animal[] animals = [new Dog("Rex"), new Cat("Whiskers"), new Dog("Buddy")];

foreach (var a in animals)
    Console.WriteLine(\`\${a.Name}: \${a.Speak()}\`);
// Rex: Woof!
// Whiskers: Meow!
// Buddy: Woof!

// Runtime type check
foreach (var a in animals)
{
    if (a is Dog dog)
        Console.WriteLine(\`\${dog.Description}\`);
}`,
    },
    {
      label: 'new vs override',
      language: 'csharp',
      code: `public class Base
{
    // NOT virtual — cannot be overridden
    public string Greet() => "Hello from Base";

    // Virtual — can be overridden
    public virtual string Info() => "Base.Info";
}

public class DerivedWithNew : Base
{
    // new — hides base Greet() without polymorphism
    public new string Greet() => "Hello from DerivedWithNew";

    public override string Info() => "DerivedWithNew.Info";
}

public class DerivedWithOverride : Base
{
    // Cannot override Greet() — not virtual
    // Can override Info()
    public override string Info() => "DerivedWithOverride.Info";
}

// Demonstrate the hiding trap
DerivedWithNew derived = new DerivedWithNew();
Base asBase = derived;        // same object, different reference type

Console.WriteLine(derived.Greet());    // "Hello from DerivedWithNew"  (compile-time: DerivedWithNew)
Console.WriteLine(asBase.Greet());     // "Hello from Base"            (compile-time: Base  ← TRAP!)

// Override is always polymorphic
Console.WriteLine(derived.Info());     // "DerivedWithNew.Info"
Console.WriteLine(asBase.Info());      // "DerivedWithNew.Info"  ← correct!

// Lesson: always use override + virtual. new is almost always wrong.`,
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
        Console.WriteLine(\`Vehicle ctor: \${make} (\${year})\`);
    }

    public virtual string Describe() => \`\${Year} \${Make}\`;
}

public class Car : Vehicle
{
    public int Doors { get; }

    // : base(make, year) — calls Vehicle constructor
    public Car(string make, int year, int doors) : base(make, year)
    {
        Doors = doors;
        Console.WriteLine(\`Car ctor: \${doors} doors\`);
    }

    public override string Describe() => \`\${base.Describe()}, \${Doors}-door car\`;
}

// sealed — no class may derive from ElectricCar
public sealed class ElectricCar : Car
{
    public int RangeKm { get; }

    public ElectricCar(string make, int year, int doors, int rangeKm)
        : base(make, year, doors)
    {
        RangeKm = rangeKm;
        Console.WriteLine(\`ElectricCar ctor: \${rangeKm} km range\`);
    }

    // sealed override — overrides AND locks further overriding
    public sealed override string Describe()
        => \`\${base.Describe()}, EV \${RangeKm} km range\`;
}

// Constructor order: Vehicle → Car → ElectricCar
var ev = new ElectricCar("Tesla", 2024, 4, 560);
Console.WriteLine(ev.Describe());
// Tesla — 2024, 4-door car, EV 560 km range

// class SportElectricCar : ElectricCar { }  ← compile error: sealed`,
    },
    {
      label: 'Polymorphism patterns',
      language: 'csharp',
      code: `// Logger hierarchy — practical polymorphism
public abstract class Logger
{
    // Template method pattern — fixed algorithm, variable steps
    public void Log(string level, string message)
    {
        if (!ShouldLog(level)) return;
        var formatted = Format(level, message);
        Write(formatted);
    }

    protected virtual bool ShouldLog(string level) => true;
    protected virtual string Format(string level, string msg)
        => \`[\${DateTime.UtcNow:HH:mm:ss}] [\${level}] \${msg}\`;

    // abstract — every derived logger must know how to write
    protected abstract void Write(string entry);
}

public class ConsoleLogger : Logger
{
    protected override void Write(string entry)
        => Console.WriteLine(entry);
}

public sealed class FileLogger : Logger
{
    private readonly string _path;
    public FileLogger(string path) => _path = path;

    protected override void Write(string entry)
        => File.AppendAllText(_path, entry + Environment.NewLine);
}

public class DebugOnlyLogger : Logger
{
    // Override filter — only emit DEBUG messages
    protected override bool ShouldLog(string level)
        => level.Equals("DEBUG", StringComparison.OrdinalIgnoreCase);

    protected override void Write(string entry)
        => Console.ForegroundColor = ConsoleColor.Cyan;
    // (simplified — real impl would reset colour after)
}

// All loggers share the same contract via the base reference
Logger[] loggers = [new ConsoleLogger(), new DebugOnlyLogger()];

foreach (var logger in loggers)
    logger.Log("INFO", "Application started");   // DebugOnlyLogger filters this out

// is/as patterns — safe type interrogation
foreach (var logger in loggers)
{
    if (logger is FileLogger fl)
        Console.WriteLine(\`Writing to: \${fl}\`);  // only FileLogger branch runs

    var debugLogger = logger as DebugOnlyLogger;
    if (debugLogger is not null)
        Console.WriteLine("Found a debug-only logger");
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Employee payroll hierarchy',
    description: `Build a small payroll hierarchy in C#:
1. A base class Employee with Name (string) and BaseSalary (decimal) properties, and a virtual CalculatePay() method that returns BaseSalary.
2. A FullTimeEmployee that inherits Employee and returns BaseSalary unchanged.
3. A ContractEmployee that adds an HourlyRate and HoursWorked property, and overrides CalculatePay() to return HourlyRate * HoursWorked.
4. A Manager that inherits FullTimeEmployee and adds a Bonus property, overriding CalculatePay() to return BaseSalary + Bonus.
5. A static method TotalPayroll(IEnumerable<Employee> employees) that sums all pay.`,
    language: 'csharp',
    hints: [
      'Use : base(name, salary) to chain constructors',
      'ContractEmployee does NOT use BaseSalary — override CalculatePay() to return HourlyRate * HoursWorked',
      'Manager calls base.CalculatePay() and adds the Bonus on top',
      'TotalPayroll can use LINQ: employees.Sum(e => e.CalculatePay())',
    ],
    starterCode: `public class Employee
{
    // TODO: Name, BaseSalary, virtual CalculatePay()
}

public class FullTimeEmployee : Employee
{
    // TODO: constructor, CalculatePay returns BaseSalary
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
    // TODO: TotalPayroll(IEnumerable<Employee>) -> decimal
}`,
    solution: `public class Employee
{
    public string Name { get; }
    public decimal BaseSalary { get; }

    public Employee(string name, decimal baseSalary)
    {
        Name = name;
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
    public decimal HourlyRate { get; }
    public decimal HoursWorked { get; }

    public ContractEmployee(string name, decimal hourlyRate, decimal hoursWorked)
        : base(name, 0)
    {
        HourlyRate = hourlyRate;
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
    public static decimal TotalPayroll(IEnumerable<Employee> employees)
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
    Console.WriteLine(\`\${e.Name}: \${e.CalculatePay():C}\`);

Console.WriteLine(\`Total: \${Payroll.TotalPayroll(staff):C}\`);
// Alice: £4,000.00 | Bob: £6,000.00 | Carol: £7,500.00 | Total: £17,500.00`,
  };

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
      explanation: '<code>override</code> replaces the base method in the vtable — calling through a base-type reference dispatches to the derived version. <code>new</code> hides the member at the compile-time call site only — a base-type reference still calls the base version. Prefer <code>override</code>; <code>new</code> leads to confusing, non-polymorphic behaviour.',
    },
    {
      q: 'Given `class Cat : Animal`, how do you call Animal\'s constructor from Cat\'s constructor?',
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
      explanation: '<code>sealed class</code> prevents derivation — no other class can extend it. It does not affect interface implementation, field mutability, or method visibility. A secondary benefit is that the JIT can de-virtualise calls on sealed types for a small performance gain.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can a derived class call the base class\'s original virtual method from inside its override?',
      a: 'Yes — use <code>base.MethodName()</code> inside the override. This is the <em>extend-not-replace</em> pattern. For example, <code>override string Describe() => \`\${base.Describe()}, extra info\`</code>. It is especially common in constructors and in the Template Method pattern where you want to add to the base behaviour rather than discard it entirely.',
    },
    {
      q: 'Why is method hiding with new almost always wrong?',
      a: 'Because it breaks the Liskov Substitution Principle — a <code>DerivedClass</code> object referenced as a <code>BaseClass</code> silently calls the old method. This creates hard-to-spot bugs when code passes a derived object to a method that expects the base type. If you need different behaviour, make the base method <code>virtual</code> and use <code>override</code> instead.',
    },
    {
      q: 'What is the constructor execution order in an inheritance chain?',
      a: 'Base constructors always execute before derived ones. For a chain <code>A → B → C</code>, the order is A\'s constructor first, then B\'s, then C\'s. The <code>: base()</code> call is evaluated before the constructor body. Field initialisers run just before their class\'s constructor body, so A\'s field initialisers → A\'s ctor body → B\'s field initialisers → B\'s ctor body → C\'s field initialisers → C\'s ctor body.',
    },
    {
      q: 'When should I prefer composition over inheritance?',
      a: 'When the "is-a" relationship does not hold cleanly, or when you want to mix capabilities from multiple sources (C# only allows one base class). Inject dependencies as constructor parameters typed to interfaces rather than inheriting their implementations. This keeps your class thin, each dependency independently swappable, and the whole thing easy to unit-test without setting up complex base-class state.',
    },
  ];
}
