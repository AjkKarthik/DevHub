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
  selector: 'app-csharp-system-object',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './system-object.html',
  styleUrl: './system-object.scss',
})
export class CsharpSystemObject {

  quickRef: QuickRefItem[] = [
    { name: 'ToString()',           type: 'method',  desc: 'Returns a string representation of the object — override for meaningful debug/log output', since: 'C# 1' },
    { name: 'Equals(object)',       type: 'method',  desc: 'Value-equality check — override alongside GetHashCode when semantic equality matters', since: 'C# 1' },
    { name: 'GetHashCode()',        type: 'method',  desc: 'Returns an integer hash — must be consistent with Equals; equal objects must have the same hash', since: 'C# 1' },
    { name: 'GetType()',            type: 'method',  desc: 'Returns the runtime Type of the instance — sealed, cannot be overridden', since: 'C# 1' },
    { name: 'ReferenceEquals()',    type: 'method',  desc: 'Static method — returns true only if both references point to the exact same object in memory', since: 'C# 1' },
    { name: 'MemberwiseClone()',    type: 'method',  desc: 'Protected method — creates a shallow copy; call from a public Clone() method in your type', since: 'C# 1' },
    { name: 'typeof(T)',            type: 'operator',desc: 'Compile-time operator that returns the Type object for T — faster than GetType() on a known type', since: 'C# 1' },
    { name: 'is / as',              type: 'operator',desc: 'Runtime type-checking operators — is returns bool, as returns null on failure instead of throwing', since: 'C# 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'object is the root of every type',
      points: [
        'Every type in C# — value types, reference types, interfaces, enums, delegates — ultimately derives from <code>System.Object</code> (aliased as <code>object</code>).',
        'This means every variable of any type can be assigned to an <code>object</code> variable, and every type inherits the core members: <code>ToString</code>, <code>Equals</code>, <code>GetHashCode</code>, and <code>GetType</code>.',
        'The <code>object</code> keyword is simply a C# alias for <code>System.Object</code> — they are identical.',
        'Understanding the contract of these four methods is essential for correct collections, logging, and equality behaviour.',
      ],
    },
    {
      heading: 'ToString() — human-readable representation',
      points: [
        'The default <code>ToString()</code> returns the fully qualified type name, e.g. <code>"MyApp.Order"</code>. That is rarely useful.',
        'Override <code>ToString()</code> to produce a meaningful summary for debugging, logging, and string interpolation.',
        'When you write <code>\`\${obj}\`</code> in an interpolated string, <code>ToString()</code> is called implicitly.',
        'Keep <code>ToString()</code> fast and side-effect-free — it is called frequently by debuggers and loggers.',
      ],
    },
    {
      heading: 'Equals() and the equality contract',
      points: [
        'The default <code>Equals</code> on a class performs <em>reference equality</em> — two objects are equal only if they are the same instance in memory.',
        'Override <code>Equals(object)</code> to implement <em>value equality</em> (equal when contents are equal). Always override <code>GetHashCode</code> at the same time.',
        '<strong>The contract:</strong> reflexive (<code>x.Equals(x)</code> is true), symmetric (<code>x.Equals(y)</code> ⟺ <code>y.Equals(x)</code>), transitive, and consistent across calls.',
        'Consider also implementing <code>IEquatable&lt;T&gt;</code> for a strongly-typed overload that avoids boxing for value types.',
      ],
    },
    {
      heading: 'GetHashCode() — the critical contract',
      points: [
        '<strong>Equal objects must always return the same hash code.</strong> Breaking this rule silently corrupts <code>Dictionary</code> and <code>HashSet</code> behaviour.',
        'The reverse is not required — different objects may share a hash code (a "collision"). Collisions degrade performance but do not break correctness.',
        'Hash codes must not change for the lifetime of an object while it lives in a hash-based collection. If your type is mutable, either make the hash based on immutable fields only, or don\'t use it as a dictionary key.',
        'Use <code>HashCode.Combine(field1, field2, ...)</code> (.NET Core+) for a high-quality hash with minimal boilerplate.',
      ],
    },
    {
      heading: 'GetType(), typeof(), and the type system',
      points: [
        '<code>GetType()</code> returns the actual runtime type of an instance — useful for reflection and diagnostic output.',
        '<code>typeof(T)</code> is a compile-time operator that returns the <code>Type</code> for the known type <code>T</code>. It is faster because no virtual dispatch is needed.',
        'Use <code>obj.GetType() == typeof(MyClass)</code> for an exact type check, or <code>obj is MyClass</code> for a check that includes derived types.',
        '<code>Type</code> objects are singletons per type per AppDomain — <code>ReferenceEquals(typeof(int), typeof(int))</code> is always true.',
      ],
    },
    {
      heading: 'ReferenceEquals and operator ==',
      points: [
        '<code>object.ReferenceEquals(a, b)</code> always checks physical identity — it cannot be overloaded. Use it when you explicitly want to test "same object".',
        'The <code>==</code> operator on <code>object</code> also defaults to reference equality, but derived classes can overload it to mean value equality (e.g. <code>string</code> does this).',
        'When you overload <code>==</code>, also overload <code>!=</code> and ensure consistency with <code>Equals</code>.',
        'For structs, <code>==</code> is not defined unless you explicitly overload it, so you often need to implement both <code>==</code> and <code>Equals</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ToString Override',
      language: 'csharp',
      code: `// ── Default ToString is almost useless ────────────────────────────────
public class OrderBad
{
    public int Id { get; set; }
    public string Customer { get; set; } = "";
}
var bad = new OrderBad { Id = 1, Customer = "Alice" };
Console.WriteLine(bad);  // OrderBad  ← full type name, not helpful

// ── Override ToString for readable output ─────────────────────────────
public class Order
{
    public int    Id       { get; init; }
    public string Customer { get; init; } = "";
    public decimal Total   { get; init; }

    public override string ToString() =>
        \`Order #\${Id} — \${Customer} — £\${Total:F2}\`;
}

var o = new Order { Id = 42, Customer = "Alice", Total = 199.99m };
Console.WriteLine(o);               // Order #42 — Alice — £199.99
Console.WriteLine(\`Shipped: \${o}\`); // Shipped: Order #42 — Alice — £199.99

// ── String interpolation calls ToString() implicitly ──────────────────
object obj = 3.14;
string s = \`Value: \${obj}\`;   // calls obj.ToString() → "3.14"`,
    },
    {
      label: 'Equals & GetHashCode',
      language: 'csharp',
      code: `public sealed class Money : IEquatable<Money>
{
    public decimal Amount   { get; }
    public string  Currency { get; }

    public Money(decimal amount, string currency)
    {
        Amount   = amount;
        Currency = currency ?? throw new ArgumentNullException(nameof(currency));
    }

    // ── Equals ──────────────────────────────────────────────────────────
    public override bool Equals(object? obj) => Equals(obj as Money);

    // IEquatable<T> — strongly-typed overload avoids boxing
    public bool Equals(Money? other) =>
        other is not null &&
        Amount   == other.Amount &&
        Currency == other.Currency;

    // ── GetHashCode — must be consistent with Equals ───────────────────
    public override int GetHashCode() =>
        HashCode.Combine(Amount, Currency);

    // ── == / != operators ─────────────────────────────────────────────
    public static bool operator ==(Money? left, Money? right) =>
        left?.Equals(right) ?? right is null;

    public static bool operator !=(Money? left, Money? right) => !(left == right);

    public override string ToString() => \`\${Amount} \${Currency}\`;
}

var a = new Money(10m, "GBP");
var b = new Money(10m, "GBP");
var c = new Money(20m, "GBP");

Console.WriteLine(a.Equals(b));          // True
Console.WriteLine(a == b);               // True
Console.WriteLine(a == c);               // False
Console.WriteLine(a.GetHashCode() == b.GetHashCode()); // True — same values
Console.WriteLine(object.ReferenceEquals(a, b));        // False — different instances

// Works correctly in a dictionary
var prices = new Dictionary<Money, string> { [a] = "ten pounds" };
Console.WriteLine(prices[b]);  // ten pounds — lookup by value succeeds`,
    },
    {
      label: 'GetType & typeof',
      language: 'csharp',
      code: `// ── GetType() — runtime type ──────────────────────────────────────────
object num  = 42;
object text = "hello";
object list = new List<int> { 1, 2, 3 };

Console.WriteLine(num.GetType());   // System.Int32
Console.WriteLine(text.GetType());  // System.String
Console.WriteLine(list.GetType());  // System.Collections.Generic.List\`1[System.Int32]

// ── typeof() — compile-time type ─────────────────────────────────────
Console.WriteLine(typeof(int));           // System.Int32
Console.WriteLine(typeof(List<string>));  // System.Collections.Generic.List\`1[System.String]

// ── Exact type check vs inheritance-aware check ───────────────────────
class Animal { }
class Dog : Animal { }

Animal dog = new Dog();

Console.WriteLine(dog.GetType() == typeof(Dog));    // True  — exact match
Console.WriteLine(dog.GetType() == typeof(Animal)); // False — Dog, not Animal
Console.WriteLine(dog is Animal);                   // True  — includes derived types
Console.WriteLine(dog is Dog);                      // True

// ── Type objects are singletons ───────────────────────────────────────
var t1 = 42.GetType();
var t2 = typeof(int);
Console.WriteLine(ReferenceEquals(t1, t2));  // True — same Type instance`,
    },
    {
      label: 'MemberwiseClone',
      language: 'csharp',
      code: `// ── MemberwiseClone — shallow copy ────────────────────────────────────
public class UserProfile : ICloneable
{
    public string   Name    { get; set; } = "";
    public int      Age     { get; set; }
    public List<string> Tags { get; set; } = new();

    // MemberwiseClone is protected — expose via a public method
    public UserProfile ShallowClone() => (UserProfile)MemberwiseClone();

    // Deep clone — must copy mutable reference fields manually
    public UserProfile DeepClone() =>
        new UserProfile
        {
            Name = Name,
            Age  = Age,
            Tags = new List<string>(Tags),  // copy the list, not the reference
        };

    // ICloneable implementation
    public object Clone() => DeepClone();
}

var original = new UserProfile { Name = "Alice", Age = 30, Tags = { "admin", "user" } };

var shallow = original.ShallowClone();
shallow.Name = "Bob";         // doesn't affect original — Name is a value (string is immutable)
shallow.Tags.Add("guest");    // DOES affect original — Tags is the same List reference!

Console.WriteLine(original.Name);           // Alice — unchanged
Console.WriteLine(original.Tags.Count);     // 3 — Tags list was shared!

var deep = original.DeepClone();
deep.Tags.Add("superuser");
Console.WriteLine(original.Tags.Count);     // 3 — deep clone has its own list`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does the default Equals() implementation do for a class?',
      options: [
        'Compares all public properties by value',
        'Compares references — returns true only if both variables point to the same instance',
        'Throws NotImplementedException until overridden',
        'Compares types and then properties by value',
      ],
      answer: 1,
      explanation: 'Unless overridden, <code>Object.Equals</code> on a class performs <em>reference equality</em> — it returns <code>true</code> only if both references point to the same object in memory. Value types (structs) override this with field-by-field comparison via <code>ValueType.Equals</code>.',
    },
    {
      q: 'What is the golden rule of GetHashCode?',
      options: [
        'Every object must have a unique hash code',
        'Hash codes must never change during the lifetime of the application',
        'Objects that are equal according to Equals must return the same hash code',
        'Hash codes must be positive integers',
      ],
      answer: 2,
      explanation: 'The contract requires that if <code>a.Equals(b)</code> is <code>true</code>, then <code>a.GetHashCode() == b.GetHashCode()</code> must also be true. Violating this breaks <code>Dictionary</code> and <code>HashSet</code>. The reverse — different objects having the same hash — is allowed (collision) but hurts performance.',
    },
    {
      q: 'What is the difference between GetType() and typeof(T)?',
      options: [
        'GetType() works only on value types; typeof() works on reference types',
        'GetType() returns the declared type; typeof() returns the runtime type',
        'GetType() returns the actual runtime type of an instance; typeof(T) is a compile-time operator for a known type',
        'They are identical — typeof(T) is just syntax sugar for instance.GetType()',
      ],
      answer: 2,
      explanation: '<code>GetType()</code> is a virtual method called on an instance at runtime, returning the concrete type. <code>typeof(T)</code> is a compiler operator that resolves to a <code>Type</code> object at compile time with no virtual dispatch. For a <code>Dog</code> stored in an <code>Animal</code> variable, <code>GetType()</code> returns <code>Dog</code>; <code>typeof(Animal)</code> returns <code>Animal</code>.',
    },
    {
      q: 'Why should you also implement IEquatable<T> when overriding Equals?',
      options: [
        'It is required by the compiler — the code will not compile otherwise',
        'It provides a strongly-typed overload that avoids boxing for value types and is used by generic collections',
        'It makes ToString() work correctly',
        'It automatically generates GetHashCode()',
      ],
      answer: 1,
      explanation: '<code>IEquatable&lt;T&gt;</code> adds an <code>Equals(T other)</code> overload. For value types this avoids boxing (the base <code>Equals(object)</code> would box). Generic collections like <code>List&lt;T&gt;</code> and <code>EqualityComparer&lt;T&gt;.Default</code> prefer the <code>IEquatable&lt;T&gt;</code> overload for performance.',
    },
    {
      q: 'What does object.ReferenceEquals(a, b) check?',
      options: [
        'Whether a and b have the same type',
        'Whether a and b are equal according to their Equals() method',
        'Whether a and b are the exact same object in memory — cannot be overloaded',
        'Whether a and b have the same hash code',
      ],
      answer: 2,
      explanation: '<code>ReferenceEquals</code> is a static method on <code>object</code> that always checks physical identity. Unlike the <code>==</code> operator, it cannot be overloaded, so it always means "same instance" regardless of type.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What happens if I override Equals but not GetHashCode?',
      a: 'You will get a compiler warning, and more importantly, your type will behave incorrectly in any hash-based collection. Two objects that are <em>equal</em> according to your <code>Equals</code> may have different hash codes (the default hash is based on identity), so a <code>Dictionary</code> or <code>HashSet</code> will fail to find existing entries and may store duplicates. Always override both together.',
    },
    {
      q: 'Should I override == when I override Equals?',
      a: 'For classes, it is optional but strongly recommended for consistency — users expect <code>a == b</code> to behave the same as <code>a.Equals(b)</code>. If you do override <code>==</code>, also override <code>!=</code> and ensure the implementations are consistent with <code>Equals</code> and <code>GetHashCode</code>. For structs, <code>==</code> is not defined at all unless you explicitly provide an operator overload.',
    },
    {
      q: 'When would I use MemberwiseClone vs a copy constructor?',
      a: '<code>MemberwiseClone</code> is quick to implement for shallow copies: it copies every field without you listing them. However, it always produces a shallow copy — reference-type fields still point to the same objects. A copy constructor gives you full control over deep vs shallow copying and is the better choice when the type contains mutable reference-type fields. For immutable types (or types where shallow copy is fine), <code>MemberwiseClone</code> is perfectly adequate.',
    },
    {
      q: 'What is the difference between is and GetType() == typeof(T)?',
      a: '<code>is</code> performs an <em>inheritance-aware</em> check: <code>dog is Animal</code> returns <code>true</code> even if <code>dog</code> is a <code>Dog</code>. <code>obj.GetType() == typeof(Animal)</code> is an <em>exact</em> type check — it returns <code>false</code> for <code>Dog</code>. Use <code>is</code> when you care about polymorphism (most cases), and the exact check when you specifically want to exclude derived types.',
    },
    {
      q: 'How does string equality work given that string is a class?',
      a: 'The <code>string</code> class overrides both <code>Equals</code> and the <code>==</code> operator to perform value (content) equality. So <code>"abc" == "abc"</code> is <code>true</code> even for two different string instances. <code>object.ReferenceEquals("abc", "abc")</code> may also return <code>true</code> in some cases due to string interning — the runtime may reuse the same string object for identical literals — but you should never rely on that.',
    },
  ];

  challenge: Challenge = {
    title: 'Value-Equality Product',
    description: `Implement a <code>Product</code> class with correct <code>System.Object</code> overrides.
1. Properties: <code>string Sku</code>, <code>string Name</code>, <code>decimal Price</code>.
2. Two <code>Product</code> instances are equal if their <code>Sku</code> values are equal (SKU is the unique identifier — name and price can differ).
3. Override <code>Equals</code>, <code>GetHashCode</code>, and <code>==</code> / <code>!=</code> operators accordingly.
4. Override <code>ToString()</code> to return a meaningful summary.
5. Add a <code>Clone()</code> method that uses <code>MemberwiseClone</code> to return a shallow copy.`,
    language: 'csharp',
    hints: [
      'Equality is SKU-only: Equals checks only Sku, GetHashCode hashes only Sku',
      'Use HashCode.Combine(Sku) or Sku.GetHashCode()',
      'ToString: return $"[{Sku}] {Name} £{Price:F2}"',
      'Clone: return (Product)MemberwiseClone();',
    ],
    starterCode: `public class Product
{
    public string  Sku   { get; init; } = "";
    public string  Name  { get; set; }  = "";
    public decimal Price { get; set; }

    public override string ToString() => throw new NotImplementedException();

    public override bool Equals(object? obj) => throw new NotImplementedException();

    public override int GetHashCode() => throw new NotImplementedException();

    public static bool operator ==(Product? left, Product? right) =>
        throw new NotImplementedException();

    public static bool operator !=(Product? left, Product? right) =>
        throw new NotImplementedException();

    public Product Clone() => throw new NotImplementedException();
}

var p1 = new Product { Sku = "WGT-001", Name = "Widget", Price = 9.99m };
var p2 = new Product { Sku = "WGT-001", Name = "Widget Pro", Price = 14.99m };
var p3 = new Product { Sku = "GAD-002", Name = "Gadget",  Price = 4.99m };

Console.WriteLine(p1 == p2);            // True — same SKU
Console.WriteLine(p1 == p3);            // False
Console.WriteLine(p1.GetHashCode() == p2.GetHashCode()); // True
Console.WriteLine(p1);                  // [WGT-001] Widget £9.99
var clone = p1.Clone();
clone.Name = "Widget Clone";
Console.WriteLine(p1.Name);             // Widget — original unchanged`,
    solution: `public class Product
{
    public string  Sku   { get; init; } = "";
    public string  Name  { get; set; }  = "";
    public decimal Price { get; set; }

    public override string ToString() => \`[\${Sku}] \${Name} £\${Price:F2}\`;

    public override bool Equals(object? obj) =>
        obj is Product other && Sku == other.Sku;

    public override int GetHashCode() => HashCode.Combine(Sku);

    public static bool operator ==(Product? left, Product? right) =>
        left?.Equals(right) ?? right is null;

    public static bool operator !=(Product? left, Product? right) => !(left == right);

    public Product Clone() => (Product)MemberwiseClone();
}

var p1 = new Product { Sku = "WGT-001", Name = "Widget",     Price = 9.99m };
var p2 = new Product { Sku = "WGT-001", Name = "Widget Pro", Price = 14.99m };
var p3 = new Product { Sku = "GAD-002", Name = "Gadget",     Price = 4.99m };

Console.WriteLine(p1 == p2);  // True
Console.WriteLine(p1 == p3);  // False
Console.WriteLine(p1.GetHashCode() == p2.GetHashCode()); // True
Console.WriteLine(p1);        // [WGT-001] Widget £9.99
var clone = p1.Clone();
clone.Name = "Widget Clone";
Console.WriteLine(p1.Name);   // Widget`,
  };
}
