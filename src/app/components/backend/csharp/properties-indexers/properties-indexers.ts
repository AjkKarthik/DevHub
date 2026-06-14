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
  selector: 'app-csharp-properties-indexers',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './properties-indexers.html',
  styleUrl: './properties-indexers.scss',
})
export class CsharpPropertiesIndexers {

  quickRef: QuickRefItem[] = [
    { name: '{ get; set; }',         type: 'syntax',  desc: 'Auto-property. Compiler generates a hidden backing field. Readable and writable from anywhere.', since: 'C# 3' },
    { name: '{ get; private set; }', type: 'syntax',  desc: 'Readable publicly, writable only inside the class. Backing field still exists.', since: 'C# 3' },
    { name: '{ get; init; }',        type: 'syntax',  desc: 'init-only setter. Value can be set during object initialization but never again after construction.', since: 'C# 9' },
    { name: '=> expr',               type: 'syntax',  desc: 'Expression-bodied property. Shorthand for a get-only property that returns a computed value each read.', since: 'C# 6' },
    { name: '{ get; } = value;',     type: 'syntax',  desc: 'Get-only auto-property with initializer. Value is set once at construction time, not recomputed.', since: 'C# 6' },
    { name: 'required',              type: 'keyword', desc: 'Forces callers to set the property via an object initializer. Compile-time enforced.', since: 'C# 11' },
    { name: 'this[T index]',         type: 'syntax',  desc: 'Indexer declaration. Lets instances be accessed with bracket syntax: obj[key].', since: 'C# 1' },
    { name: 'field',                 type: 'keyword', desc: 'C# 14 preview. References the compiler-generated backing field inside a property accessor.', since: 'C# 14' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Auto-properties and backing fields',
      points: [
        'An auto-property (<code>public int Age { get; set; }</code>) tells the compiler to generate an anonymous backing field. You write clean, short syntax; the compiler does the plumbing.',
        'You can set a default value inline: <code>public string Status { get; set; } = "Active";</code>. The field is initialized before any user constructor code runs.',
        'When you need validation or side effects on set, switch to a <strong>full property</strong> with an explicit backing field and write the logic in the setter body.',
        'Prefer auto-properties for simple data; upgrade to full properties only when behaviour is needed — premature full properties are noise.',
        'A get-only auto-property with initializer — <code>public string Id { get; } = Guid.NewGuid().ToString();</code> — is set once at field-initialization time and is read-only thereafter (immutable without <code>init</code>).',
      ],
    },
    {
      heading: 'Controlling access: private set and init',
      points: [
        '<code>{ get; private set; }</code> allows public reads but restricts writes to the class body. Useful for state that changes over time but should not be externally mutated.',
        '<code>{ get; init; }</code> (C# 9) allows setting the value during object construction (including object initializers) but makes it immutable thereafter — no setter exists at runtime.',
        '<code>init</code> is the property-level equivalent of <code>readonly</code> on a field. It enables immutable data classes while still supporting convenient object-initializer syntax.',
        'Records use <code>init</code> setters by default for all generated properties, which is why <code>with</code> expressions work — they create a new instance using init setters.',
        'The CLR enforces <code>init</code> with a <code>modreq(IsExternalInit)</code> marker on the setter — it is not just a language convention but a runtime constraint, ensuring no reflection tricks can bypass it.',
      ],
    },
    {
      heading: 'Expression-bodied and computed properties',
      points: [
        'A property can contain arbitrary logic in its getter. This is called a <strong>computed property</strong> — it derives its value from other state rather than storing it.',
        'The expression-bodied shorthand (<code>=></code>) is ideal for single-expression computed properties: <code>public string FullName => $"{First} {Last}";</code>',
        'Computed properties are re-evaluated on <em>every read</em>. If the computation is expensive, consider caching the result in a backing field (lazily computed via <code>Lazy&lt;T&gt;</code>) or converting it to a method to set caller expectations.',
        'Avoid side effects in property getters — callers do not expect <code>obj.Name</code> to trigger a network call, increment a counter, or throw unexpectedly. Keep getters fast and pure.',
        'The distinction between <code>{ get; } = expr</code> (evaluated once at construction time) and <code>=> expr</code> (evaluated on each access) is critical for correctness when <code>expr</code> involves mutable state.',
      ],
    },
    {
      heading: 'init-only setters for immutable construction',
      points: [
        '<code>init</code> setters exist only during the object initialization phase — the constructor body and any object initializer. Once complete, the property is effectively read-only.',
        'This is enforced by the compiler and CLR using a <code>modreq(IsExternalInit)</code> marker on the setter — not just a convention.',
        'Combined with <code>required</code>, you can build types that are both immutable-after-construction AND guaranteed to have specific values set: <code>public required string Name { get; init; }</code>.',
        'If you need to create a modified copy, use the <code>with</code> expression (available on records and any type with init setters in C# 10+): <code>var updated = original with { Email = "new@corp.com" };</code>.',
        'Inside an <code>init</code> accessor, you can also assign to <code>readonly</code> fields of the same class — the compiler relaxes the readonly restriction during initialization to support this pattern.',
      ],
    },
    {
      heading: 'Indexers',
      points: [
        'An indexer lets a class instance behave like an array or dictionary: <code>matrix[0, 1]</code> or <code>config["timeout"]</code>.',
        'Syntax: <code>public T this[int index] { get { ... } set { ... } }</code>. You can overload indexers with different parameter types — e.g. both <code>this[int]</code> and <code>this[string]</code>.',
        'Indexers can have multiple parameters for multi-dimensional access: <code>public double this[int row, int col]</code>.',
        'Use indexers when your type is conceptually a <em>collection</em> or <em>keyed store</em>. Prefer methods over indexers when the access has significant side effects or the semantics are not obvious from bracket notation.',
        'Indexers can have asymmetric access modifiers: <code>public string this[string key] { get => ...; private set => ...; }</code> — useful for read-heavy stores where writes are internal.',
      ],
    },
    {
      heading: 'required properties (C# 11)',
      points: [
        '<code>required</code> on a property forces the caller to provide a value via an object initializer. It is a <em>compile-time</em> check, not a runtime null check.',
        'It is especially useful with <code>init</code>: you get mandatory, immutable properties without needing a parameterized constructor.',
        'A constructor annotated with <code>[SetsRequiredMembers]</code> is trusted to set all required members internally — callers of that constructor are not required to use an initializer.',
        '<code>required</code> does not replace null checks — a <code>required string? Name</code> still allows <code>null</code> to be passed. Combine with a non-nullable type (<code>required string Name</code>) for full compile-time safety.',
        '<code>required</code> members are tracked by the compiler per call site — if a caller uses the <code>[SetsRequiredMembers]</code>-annotated constructor path, no object initializer is needed; if a caller uses the parameterless constructor, all required members must appear in the initializer.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Auto-properties & access',
      language: 'csharp',
      code: `public class Employee
{
    // Fully mutable auto-property
    public string Department { get; set; } = "Unassigned";

    // Read-only outside the class, settable inside
    public string Name { get; private set; }

    // init-only — set once during construction, immutable after
    public string EmployeeId { get; init; }

    // Required + init — caller MUST provide this value
    public required string Email { get; init; }

    public Employee(string name)
    {
        Name       = name;
        EmployeeId = Guid.NewGuid().ToString("N")[..8].ToUpper();
    }

    public void Promote(string newDepartment)
    {
        // private set is accessible here
        Department = newDepartment;
        // EmployeeId = "x"; // Error: init-only property
    }
}

var emp = new Employee("Alice") { Email = "alice@corp.com" };
emp.Department = "Engineering";  // OK — public set
// emp.Name = "Bob";             // Error — private set
// emp.EmployeeId = "X";         // Error — init-only
Console.WriteLine($"{emp.Name} [{emp.EmployeeId}] - {emp.Department}");`,
    },
    {
      label: 'Computed & expression-bodied',
      language: 'csharp',
      code: `public class Rectangle
{
    public double Width  { get; set; }
    public double Height { get; set; }

    // Expression-bodied computed properties — recalculated on each read
    public double Area        => Width * Height;
    public double Perimeter   => 2 * (Width + Height);
    public double Diagonal    => Math.Sqrt(Width * Width + Height * Height);
    public bool   IsSquare    => Width == Height;

    // Full property with validation in setter
    private double _aspectRatio;
    public double AspectRatio
    {
        get => _aspectRatio;
        private set
        {
            if (value <= 0) throw new ArgumentOutOfRangeException(nameof(value));
            _aspectRatio = value;
        }
    }

    // Get-only with initializer — evaluated ONCE at construction
    public DateTime CreatedAt { get; } = DateTime.UtcNow;

    public Rectangle(double width, double height)
    {
        Width       = width;
        Height      = height;
        AspectRatio = width / height;
    }
}

var r = new Rectangle(16, 9);
Console.WriteLine($"Area: {r.Area}");             // 144
Console.WriteLine($"Aspect: {r.AspectRatio:F4}"); // 1.7778
Console.WriteLine($"Diagonal: {r.Diagonal:F2}");  // 18.36`,
    },
    {
      label: 'Indexers',
      language: 'csharp',
      code: `// String-keyed configuration store using an indexer
public class ConfigStore
{
    private readonly Dictionary<string, string> _data = new(StringComparer.OrdinalIgnoreCase);

    // Single-parameter indexer — asymmetric access
    public string this[string key]
    {
        get => _data.TryGetValue(key, out var v) ? v : throw new KeyNotFoundException(key);
        set => _data[key] = value ?? throw new ArgumentNullException(nameof(value));
    }

    public bool Contains(string key) => _data.ContainsKey(key);
    public int  Count => _data.Count;
}

// 2D matrix with multi-parameter indexer
public class Matrix
{
    private readonly double[,] _data;
    public int Rows { get; }
    public int Cols { get; }

    public Matrix(int rows, int cols)
    {
        Rows  = rows;
        Cols  = cols;
        _data = new double[rows, cols];
    }

    // Multi-parameter indexer
    public double this[int row, int col]
    {
        get => _data[row, col];
        set => _data[row, col] = value;
    }
}

// Usage
var cfg = new ConfigStore();
cfg["timeout"] = "30";
cfg["baseUrl"]  = "https://api.example.com";
Console.WriteLine(cfg["Timeout"]); // "30" — case-insensitive

var m = new Matrix(3, 3);
m[0, 0] = 1; m[1, 1] = 1; m[2, 2] = 1; // identity diagonal
Console.WriteLine(m[1, 1]); // 1`,
    },
    {
      label: 'init + required patterns',
      language: 'csharp',
      code: `// Immutable DTO with required init-only properties
public class CreateOrderRequest
{
    public required int      CustomerId  { get; init; }
    public required string   ProductSku  { get; init; }
    public required int      Quantity    { get; init; }
    public          decimal? DiscountPct { get; init; }  // optional
}

// Usage — clean object initializer syntax
var req = new CreateOrderRequest
{
    CustomerId = 42,
    ProductSku = "SKU-001",
    Quantity   = 3,
};

// with-expression creates a modified copy (works on any type with init setters)
var bulkReq = req with { Quantity = 100, DiscountPct = 5m };

Console.WriteLine($"Order for customer {req.CustomerId}: {req.Quantity}x {req.ProductSku}");
Console.WriteLine($"Bulk order: {bulkReq.Quantity}x at {bulkReq.DiscountPct}% discount");

// [SetsRequiredMembers] — constructor that handles required members internally
public class FullyInitialised
{
    public required string Name  { get; init; }
    public required string Email { get; init; }

    [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
    public FullyInitialised(string name, string email)
    {
        Name  = name;
        Email = email;
    }
}

// No object initializer needed — constructor satisfies required contract
var obj = new FullyInitialised("Alice", "alice@corp.com");

// Immutable value object — expression-bodied read-only + init
public readonly struct Temperature
{
    public double Celsius    { get; init; }
    public double Fahrenheit => Celsius * 9.0 / 5.0 + 32;
    public double Kelvin     => Celsius + 273.15;

    public static Temperature FromFahrenheit(double f) =>
        new() { Celsius = (f - 32) * 5.0 / 9.0 };
}

var boiling = new Temperature { Celsius = 100 };
Console.WriteLine($"{boiling.Celsius}°C = {boiling.Fahrenheit}°F"); // 100°C = 212°F`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Confusing { get; } = expr with => expr — one is fixed, the other is recomputed',
      wrong: `public class Order
{
    // WRONG: developer thinks this re-checks the list on every access
    public bool HasItems { get; } = Items.Count > 0;  // won't even compile — Items not yet known
    public List<string> Items { get; } = new();
}`,
      right: `public class Order
{
    public List<string> Items { get; } = new();

    // => recalculates on every read — correct for derived/live state
    public bool HasItems => Items.Count > 0;

    // { get; } = expr — evaluated ONCE during field init, then frozen
    public DateTime CreatedAt { get; } = DateTime.UtcNow;
}`,
      explanation: '{ get; } = expr assigns the value once when the object is constructed — like a readonly field initializer. => expr evaluates the expression on every property access. Use => for properties that should reflect current state; use { get; } = for values that should be fixed at construction time.',
    },
    {
      title: 'Putting side effects or expensive work in a property getter',
      wrong: `public class ReportService
{
    public Report LatestReport => LoadFromDatabase();  // DB call every access!

    private Report LoadFromDatabase() { /* expensive */ }
}

// Caller innocently iterates — 1000 DB calls
foreach (var item in service.LatestReport.Items)
    Console.WriteLine(item);`,
      right: `public class ReportService
{
    // Option 1: method — communicates "this does work"
    public Report GetLatestReport() => LoadFromDatabase();

    // Option 2: lazy cached property
    private Report? _cached;
    public Report LatestReport => _cached ??= LoadFromDatabase();

    private Report LoadFromDatabase() { /* expensive */ }
}`,
      explanation: 'Property getters should be fast, predictable, and side-effect-free. Callers expect obj.Prop to be cheap — a single innocent usage like foreach (var x in obj.Prop) or Console.WriteLine(obj.Prop) can unexpectedly trigger many DB calls or network requests. Use a method name to signal cost, or cache the result.',
    },
    {
      title: 'Assuming required prevents null — it only enforces assignment',
      wrong: `public class User
{
    public required string Name { get; init; }
    // ...
}

// Compiles and runs — required does NOT check for null!
var u = new User { Name = null! };   // runtime NullReferenceException later
Console.WriteLine(u.Name.Length);`,
      right: `// The non-nullable type + required gives compile-time protection
public class User
{
    public required string Name { get; init; }   // non-nullable string
}

// Compiler warns/errors on null assignment in nullable-enabled context
var u = new User { Name = null! };  // still compiles with ! but at least you see the danger
var v = new User { Name = "Alice" };  // correct`,
      explanation: 'required enforces that a caller must supply the property in an object initializer — but it does not verify the value is non-null. Enable C# nullable reference types (#nullable enable) so the compiler warns when null is assigned to a non-nullable required property. required + non-nullable type = compile-time enforced non-null assignment.',
    },
    {
      title: 'Using private set instead of init when the property should be immutable after construction',
      wrong: `public class Invoice
{
    public string Number { get; private set; }

    public Invoice(string number) => Number = number;

    // Someone adds a "helper" inside the class later and mutates it accidentally
    public void Regenerate() => Number = Guid.NewGuid().ToString();  // was this intended?
}`,
      right: `public class Invoice
{
    public string Number { get; init; }

    public Invoice(string number) => Number = number;

    // Compile error if someone tries to mutate Number in a method — intention is clear
}`,
      explanation: 'private set allows mutation anywhere inside the class — current and future methods. If a property should be immutable after construction, use init instead. The compiler enforces the intent and makes it impossible for future internal code to accidentally re-assign the property.',
    },
    {
      title: 'Implementing an indexer for non-collection types making intent unclear',
      wrong: `public class UserService
{
    // Indexer on a service? What does this mean?
    public User this[int id] => _repository.Find(id);
}

// Caller: is this a lookup? Does it throw? Does it cache?
var user = userService[42];`,
      right: `public class UserService
{
    // Named method — communicates intent, can throw KeyNotFoundException clearly
    public User GetById(int id) => _repository.Find(id)
        ?? throw new KeyNotFoundException($"User {id} not found");
}

var user = userService.GetById(42);`,
      explanation: 'Indexers make sense when the type conceptually IS a collection or map — Dictionary<K,V>, Matrix, ConfigStore. On a service class, bracket syntax misleads callers about what the operation does (lookup? load? cache?), whether it throws, and what the cost is. Use a descriptive method name instead.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a typed Row class with an indexer',
    language: 'csharp',
    description: `Create a <code>DataRow</code> class that stores named column values and exposes them via both a string indexer and typed properties.

**Requirements:**
1. A <code>required string[] Columns { get; init; }</code> property that defines the column names.
2. A string indexer <code>this[string column]</code> that gets/sets values by column name (case-insensitive). Throw <code>KeyNotFoundException</code> for unknown columns.
3. An int indexer <code>this[int index]</code> that gets/sets values by position. Throw <code>IndexOutOfRangeException</code> for out-of-bounds.
4. A computed read-only property <code>int ColumnCount</code> that returns the number of columns.
5. A computed read-only property <code>bool IsEmpty</code> that returns true if all values are null or empty string.
6. A <code>ToDict()</code> method returning a <code>Dictionary&lt;string, string?&gt;</code>.

Test it with columns ["Id", "Name", "Email"].`,
    starterCode: `public class DataRow
{
    public required string[] Columns { get; init; }

    // TODO: internal storage for values

    // TODO: string indexer (by column name, case-insensitive)

    // TODO: int indexer (by position)

    // TODO: ColumnCount computed property

    // TODO: IsEmpty computed property

    public Dictionary<string, string?> ToDict()
    {
        throw new NotImplementedException();
    }
}

// Expected usage:
// var row = new DataRow { Columns = ["Id", "Name", "Email"] };
// row["Id"]   = "1";
// row[1]      = "Alice";
// row["Email"] = "alice@example.com";
// Console.WriteLine(row["name"]); // "Alice" — case-insensitive
// Console.WriteLine(row.ColumnCount); // 3
// Console.WriteLine(row.IsEmpty);     // false`,
    solution: `public class DataRow
{
    public required string[] Columns { get; init; }

    private readonly Dictionary<string, string?> _values;

    public DataRow()
    {
        _values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
    }

    public string? this[string column]
    {
        get
        {
            if (!Array.Exists(Columns, c => c.Equals(column, StringComparison.OrdinalIgnoreCase)))
                throw new KeyNotFoundException($"Unknown column: {column}");
            _values.TryGetValue(column, out var v);
            return v;
        }
        set
        {
            if (!Array.Exists(Columns, c => c.Equals(column, StringComparison.OrdinalIgnoreCase)))
                throw new KeyNotFoundException($"Unknown column: {column}");
            _values[column] = value;
        }
    }

    public string? this[int index]
    {
        get
        {
            if (index < 0 || index >= Columns.Length)
                throw new IndexOutOfRangeException($"Index {index} is out of range.");
            return this[Columns[index]];
        }
        set
        {
            if (index < 0 || index >= Columns.Length)
                throw new IndexOutOfRangeException($"Index {index} is out of range.");
            this[Columns[index]] = value;
        }
    }

    public int  ColumnCount => Columns.Length;
    public bool IsEmpty     => Columns.All(c => string.IsNullOrEmpty(this[c]));

    public Dictionary<string, string?> ToDict() =>
        Columns.ToDictionary(c => c, c => this[c], StringComparer.OrdinalIgnoreCase);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between { get; private set; } and { get; init; }?',
      options: [
        'There is no difference — both prevent external mutation.',
        'private set allows the class to mutate after construction; init only allows setting during construction.',
        'init generates a public setter; private set does not.',
        'private set is C# 9+; init has been available since C# 3.',
      ],
      answer: 1,
      explanation: '<code>private set</code> allows mutation at any time inside the class (methods, etc.). <code>init</code> is write-once — the property can only be set during object construction or an object initializer, then becomes immutable.',
    },
    {
      q: 'What does an expression-bodied property (=>) represent?',
      options: [
        'A property with both get and set, written concisely.',
        'A get-only property whose value is computed by an expression, re-evaluated on each read.',
        'A cached computed property — the expression runs once and is stored.',
        'A static property shorthand.',
      ],
      answer: 1,
      explanation: 'The <code>=></code> syntax is shorthand for a get-only property. The expression is evaluated every time the property is read — it is not cached. Use <code>{ get; } = expr</code> instead when you want a one-time evaluation at construction.',
    },
    {
      q: 'When should you use an indexer instead of a method?',
      options: [
        'Always — indexers are always more readable.',
        'When the operation has significant side effects.',
        'When the type conceptually represents a collection or keyed store and bracket access feels natural.',
        'Only when implementing IList or IDictionary.',
      ],
      answer: 2,
      explanation: 'Indexers are idiomatic when the type <em>behaves like a collection or map</em>. For operations with side effects or non-obvious semantics, a named method is clearer — it communicates intent and expected cost.',
    },
    {
      q: 'What does the required keyword guarantee at compile time?',
      options: [
        'The property cannot be null at runtime.',
        'The caller must supply a value for the property via an object initializer.',
        'The property has a non-null default value.',
        'The property is set before the constructor body runs.',
      ],
      answer: 1,
      explanation: '<code>required</code> is a compile-time check that the property is assigned in an object initializer. It does <em>not</em> affect null-safety — a <code>required string?</code> can still be set to <code>null</code>. Combine with non-nullable types for full safety.',
    },
    {
      q: 'What is the difference between public string Name { get; } = "default" and public string Name => "default"?',
      options: [
        'They are identical — both return "default" always.',
        'The first sets the value once at construction; the second evaluates the expression on every read.',
        'The first uses lazy evaluation; the second uses eager evaluation.',
        'The second form requires a backing field; the first does not.',
      ],
      answer: 1,
      explanation: '<code>{ get; } = "default"</code> is a get-only auto-property initializer — the value is assigned once during object initialization (like a readonly field) and then fixed. <code>=> "default"</code> is an expression-bodied property that re-evaluates on every access. The distinction matters when the expression involves mutable state or produces different values over time.',
    },
    {
      q: 'Can a class have more than one indexer?',
      options: [
        'No — only one indexer per class is allowed.',
        'Yes — indexers can be overloaded by parameter type or count.',
        'Yes — but only if the class implements IIndexable.',
        'No — you must use different method names instead.',
      ],
      answer: 1,
      explanation: 'Indexers can be overloaded just like methods. A class can define <code>this[int index]</code> and <code>this[string key]</code> simultaneously. The compiler resolves the correct overload based on the argument type at the call site.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I have a property with a public getter and an init setter but also change it internally?',
      a: 'No — <code>init</code> setters are accessible only during the object initialization phase (constructor + object initializer). Even inside the class, you cannot assign to an <code>init</code> property in a regular method. If you need internal mutability, use <code>private set</code> instead.',
    },
    {
      q: 'Can indexers be overloaded?',
      a: 'Yes — a class can define multiple indexers as long as their parameter lists differ in type or count. For example, you can have both <code>this[int i]</code> and <code>this[string key]</code> on the same class. The compiler resolves the correct overload based on the argument type at the call site.',
    },
    {
      q: 'How is a computed property different from a method with no parameters?',
      a: 'Semantically, a computed property should feel like an <em>attribute</em> of the object — fast, side-effect-free, and logically a "characteristic." A method communicates <em>action</em>. If the computation is expensive, has side effects, or can fail in non-trivial ways, use a method. Simple derivations like <code>FullName</code> or <code>IsEmpty</code> are idiomatic as properties.',
    },
    {
      q: 'What is the field keyword in C# 14?',
      a: 'The <code>field</code> keyword (C# 14 preview) lets you reference the compiler-generated backing field of an auto-property directly inside the accessor body. This means you can add a custom getter or setter <em>without</em> declaring a separate private backing field: <code>public string Name { get => field; set => field = value.Trim(); }</code>. It eliminates the need to manually maintain a backing field just to add simple accessor logic.',
    },
    {
      q: 'How does [SetsRequiredMembers] work with required properties?',
      a: 'When a constructor is annotated with <code>[SetsRequiredMembers]</code>, the compiler trusts that the constructor body will assign all required members. Callers who use that constructor path do not need to provide an object initializer. Callers who use the parameterless constructor (or a non-annotated constructor) must still satisfy all required members in an object initializer. This allows library authors to offer both a convenient parameterized constructor and the object-initializer style.',
    },
    {
      q: 'When should I upgrade from an auto-property to a full property with a backing field?',
      a: 'Upgrade when you need one of: validation on set (e.g. range check, null guard), notification of changes (e.g. INotifyPropertyChanged), lazy initialization, logging or debugging hooks, or asymmetric access logic (e.g. translate from internal units to display units). Keep auto-properties for simple data bags; resist the urge to make full properties "just in case" — they add noise with no benefit unless the logic is actually needed.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Properties are type-safe access points to state. auto-properties for simple data, init for immutable construction, required to enforce assignment, expression-bodied for computed values, indexers for collection-like access.',
    mustKnow: [
      '<code>{ get; set; }</code> auto-property generates a compiler backing field. <code>private set</code> restricts writes to the class; <code>init</code> restricts writes to construction time.',
      '<code>=> expr</code> (expression-bodied): recalculated on every read. <code>{ get; } = expr</code>: evaluated once at construction and then frozen.',
      '<code>required</code> (C# 11): compile-time check that callers assign the property in an object initializer. Does NOT guarantee non-null — combine with non-nullable types.',
      '<code>init</code> + <code>with</code>: enables immutable types that still support the convenient object-initializer style. Records use init by default.',
      'Indexers: <code>public T this[int i] { get; set; }</code>. Can be overloaded by parameter type. Use only when the type is conceptually a collection or keyed store.',
      'Property getters must be fast and side-effect-free — callers do not expect a network call or counter increment from <code>obj.Name</code>.',
      '<code>field</code> keyword (C# 14 preview): reference the compiler-generated backing field inside an accessor without declaring a separate private field.',
    ],
    interviewFocus: [
      'What is the difference between init and private set? (init: write-only during construction; private set: mutable any time inside the class)',
      'What is the difference between => expr and { get; } = expr? (=>: recomputed each access; = expr: set once at construction)',
      'What does required guarantee — does it prevent null? (compile-time assignment check only; does not prevent null)',
      'When is an indexer appropriate? (collection/keyed-store types with natural bracket semantics; avoid on service classes)',
      'How do you make a property immutable after construction while still using object-initializer syntax? (init setter)',
    ],
  };
}
