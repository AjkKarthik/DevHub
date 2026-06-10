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
  selector: 'app-csharp-properties-indexers',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './properties-indexers.html',
  styleUrl: './properties-indexers.scss',
})
export class CsharpPropertiesIndexers {

  quickRef: QuickRefItem[] = [
    { name: '{ get; set; }',    type: 'syntax',  desc: 'Auto-property. Compiler generates a hidden backing field. Readable and writable from anywhere.', since: 'C# 3' },
    { name: '{ get; private set; }', type: 'syntax', desc: 'Readable publicly, writable only inside the class. Backing field still exists.', since: 'C# 3' },
    { name: '{ get; init; }',   type: 'syntax',  desc: 'init-only setter. Value can be set during object initialization but never again after construction.', since: 'C# 9' },
    { name: '=> expr',          type: 'syntax',  desc: 'Expression-bodied property. Shorthand for a get-only property that returns a computed value.', since: 'C# 6' },
    { name: 'required',         type: 'keyword', desc: 'Forces callers to set the property via an object initializer. Compile-time enforced.', since: 'C# 11' },
    { name: 'this[T index]',    type: 'syntax',  desc: 'Indexer declaration. Lets instances be accessed with bracket syntax: obj[key].', since: 'C# 1' },
    { name: 'field',            type: 'keyword', desc: 'C# 14 preview. References the compiler-generated backing field inside a property accessor.', since: 'C# 14' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Auto-properties and backing fields',
      points: [
        'An auto-property (<code>public int Age { get; set; }</code>) tells the compiler to generate an anonymous backing field. You write clean, short syntax; the compiler does the plumbing.',
        'You can set a default value inline: <code>public string Status { get; set; } = "Active";</code>. The field is initialized in the constructor before any user code runs.',
        'When you need validation or side effects on set, switch to a <strong>full property</strong> with an explicit backing field and write the logic in the setter body.',
        'Prefer auto-properties for simple data; upgrade to full properties only when behavior is needed — premature full properties are noise.',
      ],
    },
    {
      heading: 'Controlling access: private set and init',
      points: [
        '<code>{ get; private set; }</code> allows public reads but restricts writes to the class body. Useful for state that changes over time but should not be externally mutated.',
        '<code>{ get; init; }</code> (C# 9) allows setting the value during object construction (including object initializers) but makes it immutable thereafter — no setter exists at runtime.',
        '<code>init</code> is the property-level equivalent of <code>readonly</code> on a field. It enables immutable data classes while still supporting object-initializer syntax.',
        'Records use <code>init</code> setters by default for all generated properties, which is why <code>with</code> expressions work — they create a new instance using init setters.',
      ],
    },
    {
      heading: 'Expression-bodied and computed properties',
      points: [
        'A property can contain arbitrary logic in its getter. This is called a <strong>computed property</strong> — it derives its value from other state rather than storing it.',
        'The expression-bodied shorthand (<code>=></code>) is ideal for single-expression computed properties: <code>public string FullName => \`\${First} \${Last}\`;</code>',
        'Computed properties are re-evaluated on every read. If the computation is expensive, consider caching the result in a backing field or using <code>Lazy&lt;T&gt;</code>.',
        'Avoid side effects in property getters — callers do not expect <code>obj.Name</code> to trigger a network call or throw unexpectedly. Keep getters fast and pure.',
      ],
    },
    {
      heading: 'init-only setters for immutable construction',
      points: [
        '<code>init</code> setters exist only during the object initialization phase. Once the constructor and any object initializer complete, the property is effectively read-only.',
        'This is enforced by the compiler and CLR using a <code>modreq(IsExternalInit)</code> marker — not just a convention.',
        'Combined with <code>required</code>, you can build types that are both immutable-after-construction AND guaranteed to have specific values set: <code>public required string Name { get; init; }</code>.',
        'If you need to create a modified copy, use the <code>with</code> expression (available on records and any type with init setters in C# 10+).',
      ],
    },
    {
      heading: 'Indexers',
      points: [
        'An indexer lets a class instance behave like an array or dictionary: <code>matrix[0, 1]</code> or <code>config["timeout"]</code>.',
        'Syntax: <code>public T this[int index] { get { ... } set { ... } }</code>. You can overload indexers with different parameter types.',
        'Indexers can have multiple parameters for multi-dimensional access: <code>public double this[int row, int col]</code>.',
        'Use indexers when your type is conceptually a <em>collection</em> or <em>keyed store</em>. Prefer methods over indexers when the access has side effects or the semantics are not obvious from bracket notation.',
      ],
    },
    {
      heading: 'required properties (C# 11)',
      points: [
        '<code>required</code> on a property forces the caller to provide a value via an object initializer. It is a compile-time check, not a runtime null check.',
        'It is especially useful with <code>init</code>: you get mandatory, immutable properties without needing a parameterized constructor.',
        'A constructor annotated with <code>[SetsRequiredMembers]</code> is trusted to set all required members internally — callers of that constructor are not required to use an initializer.',
        '<code>required</code> does not replace null checks — a <code>required string? Name</code> still allows <code>null</code> to be passed. Combine with <code>string</code> (non-nullable) for full safety.',
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
Console.WriteLine(\`\${emp.Name} [\${emp.EmployeeId}] - \${emp.Department}\`);`,
    },
    {
      label: 'Computed & expression-bodied',
      language: 'csharp',
      code: `public class Rectangle
{
    public double Width  { get; set; }
    public double Height { get; set; }

    // Expression-bodied computed property
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

    public Rectangle(double width, double height)
    {
        Width       = width;
        Height      = height;
        AspectRatio = width / height;
    }
}

var r = new Rectangle(16, 9);
Console.WriteLine(\`Area: \${r.Area}\`);          // 144
Console.WriteLine(\`Aspect: \${r.AspectRatio:F4}\`); // 1.7778
Console.WriteLine(\`Diagonal: \${r.Diagonal:F2}\`);  // 18.36`,
    },
    {
      label: 'Indexers',
      language: 'csharp',
      code: `// String-keyed configuration store using an indexer
public class ConfigStore
{
    private readonly Dictionary<string, string> _data = new(StringComparer.OrdinalIgnoreCase);

    // Single-parameter indexer
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
    public required int      CustomerId { get; init; }
    public required string   ProductSku { get; init; }
    public required int      Quantity   { get; init; }
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

Console.WriteLine(\`Order for customer \${req.CustomerId}: \${req.Quantity}x \${req.ProductSku}\`);
Console.WriteLine(\`Bulk order: \${bulkReq.Quantity}x at \${bulkReq.DiscountPct}% discount\`);

// Immutable value object — expression-bodied read-only property + init
public readonly struct Temperature
{
    public double Celsius    { get; init; }
    public double Fahrenheit => Celsius * 9.0 / 5.0 + 32;
    public double Kelvin     => Celsius + 273.15;

    public static Temperature FromFahrenheit(double f) =>
        new() { Celsius = (f - 32) * 5.0 / 9.0 };
}

var boiling = new Temperature { Celsius = 100 };
Console.WriteLine(\`\${boiling.Celsius}°C = \${boiling.Fahrenheit}°F\`); // 100°C = 212°F`,
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
                throw new KeyNotFoundException(\`Unknown column: \${column}\`);
            _values.TryGetValue(column, out var v);
            return v;
        }
        set
        {
            if (!Array.Exists(Columns, c => c.Equals(column, StringComparison.OrdinalIgnoreCase)))
                throw new KeyNotFoundException(\`Unknown column: \${column}\`);
            _values[column] = value;
        }
    }

    public string? this[int index]
    {
        get
        {
            if (index < 0 || index >= Columns.Length)
                throw new IndexOutOfRangeException(\`Index \${index} is out of range.\`);
            return this[Columns[index]];
        }
        set
        {
            if (index < 0 || index >= Columns.Length)
                throw new IndexOutOfRangeException(\`Index \${index} is out of range.\`);
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
      explanation: 'private set allows mutation at any time inside the class (methods, etc.). init is write-once — the property can only be set during object construction, then becomes immutable.',
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
      explanation: 'The => syntax is shorthand for a get-only property. The expression is evaluated every time the property is read — it is not cached.',
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
      explanation: 'Indexers are idiomatic when the type behaves like a collection or map. For operations with side effects or non-obvious semantics, a named method is clearer.',
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
      explanation: 'required is a compile-time check that the property is assigned in an object initializer. It does not affect null-safety — a required string? can still be set to null.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I have a property with a public getter and an init setter but also change it internally?',
      a: 'No — <code>init</code> setters are accessible only during the object initialization phase (constructor + object initializer). Even inside the class, you cannot assign to an init property in a regular method. If you need internal mutability, use <code>private set</code> instead.',
    },
    {
      q: 'Can indexers be overloaded?',
      a: 'Yes — a class can define multiple indexers as long as their parameter lists differ in type or count. For example, you can have both <code>this[int i]</code> and <code>this[string key]</code> on the same class. The compiler resolves the correct overload based on the argument type at the call site.',
    },
    {
      q: 'How is a computed property different from a method with no parameters?',
      a: 'Semantically, a computed property should feel like an attribute of the object — fast, side-effect-free, and logically a "characteristic." A method communicates <em>action</em>. If the computation is expensive, has side effects, or can fail in non-trivial ways, use a method. Simple derivations like <code>FullName</code> or <code>IsEmpty</code> are idiomatic as properties.',
    },
    {
      q: 'What is the field keyword in C# 14?',
      a: 'The <code>field</code> keyword (C# 14 preview) lets you reference the compiler-generated backing field of an auto-property directly inside the accessor body. This means you can add a custom getter or setter <em>without</em> declaring a separate private backing field: <code>public string Name { get => field; set => field = value.Trim(); }</code>. It eliminates the need to manually maintain a backing field just to add simple accessor logic.',
    },
  ];
}
