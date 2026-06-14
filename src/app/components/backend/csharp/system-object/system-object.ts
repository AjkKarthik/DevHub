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
  selector: 'app-csharp-system-object',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './system-object.html',
  styleUrl: './system-object.scss',
})
export class CsharpSystemObject {

  quickRef: QuickRefItem[] = [
    { name: 'ToString()',           type: 'method',    desc: 'Returns a string representation of the object — override for meaningful debug/log output', since: 'C# 1' },
    { name: 'Equals(object)',       type: 'method',    desc: 'Value-equality check — override alongside GetHashCode when semantic equality matters', since: 'C# 1' },
    { name: 'GetHashCode()',        type: 'method',    desc: 'Returns an integer hash — must be consistent with Equals; equal objects must have the same hash', since: 'C# 1' },
    { name: 'GetType()',            type: 'method',    desc: 'Returns the runtime Type of the instance — sealed, cannot be overridden', since: 'C# 1' },
    { name: 'ReferenceEquals()',    type: 'method',    desc: 'Static method — returns true only if both references point to the exact same object in memory', since: 'C# 1' },
    { name: 'MemberwiseClone()',    type: 'method',    desc: 'Protected method — creates a shallow copy; call from a public Clone() method in your type', since: 'C# 1' },
    { name: 'typeof(T)',            type: 'operator',  desc: 'Compile-time operator that returns the Type object for T — faster than GetType() on a known type', since: 'C# 1' },
    { name: 'is / as',             type: 'operator',  desc: 'Runtime type-checking operators — is returns bool, as returns null on failure instead of throwing', since: 'C# 1' },
    { name: 'IEquatable<T>',       type: 'interface', desc: 'Strongly-typed Equals(T) overload — avoids boxing for value types; used by List<T> and EqualityComparer<T>', since: 'C# 2' },
    { name: 'HashCode.Combine()',   type: 'method',    desc: '.NET Core+ helper that produces a high-quality hash from multiple fields with no boilerplate', since: '.NET Core 2.1' },
    { name: 'EqualityComparer<T>', type: 'class',     desc: 'Provides a default equality comparer for any type; uses IEquatable<T> if available to avoid boxing', since: 'C# 2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'object is the root of every type',
      points: [
        'Every type in C# — value types, reference types, interfaces, enums, delegates — ultimately derives from <code>System.Object</code> (aliased as <code>object</code>). This is the single root of the entire type hierarchy.',
        'Every variable of any type can be assigned to an <code>object</code> variable, and every type inherits the four core members: <code>ToString</code>, <code>Equals</code>, <code>GetHashCode</code>, and <code>GetType</code>.',
        'The <code>object</code> keyword is a C# alias for <code>System.Object</code> — they compile to identical IL. Use <code>object</code> in code for consistency with modern style guides.',
        'Understanding the contract of these four methods is essential for correct behaviour in collections (Dictionary, HashSet), logging, debugger visualisation, and serialisation.',
        'Value types are sealed implicitly (they inherit from <code>System.ValueType</code>, which inherits <code>object</code>). You can override <code>ToString</code>, <code>Equals</code>, and <code>GetHashCode</code> on structs, but not <code>GetType</code>.',
      ],
    },
    {
      heading: 'ToString() — human-readable representation',
      points: [
        'The default <code>ToString()</code> returns the fully qualified type name, e.g. <code>"MyApp.Order"</code>. That is almost never useful for debugging or logging.',
        'Override <code>ToString()</code> to produce a meaningful summary. Include the key identifier and state fields so a single line in a log tells you exactly what the object is.',
        'When you write <code>$"result: {obj}"</code> in an interpolated string or use <code>Console.WriteLine(obj)</code>, <code>ToString()</code> is called implicitly — so a good override is immediately visible everywhere.',
        'Keep <code>ToString()</code> fast, side-effect-free, and non-throwing — it is called by debuggers on every hover, by loggers on every line, and sometimes in tight loops. Never do I/O or heavy computation inside it.',
        'For types that need format control (e.g. <code>"N2"</code> vs <code>"C"</code>), implement <code>IFormattable</code> in addition to overriding <code>ToString()</code>. This gives callers access to <code>$"{obj:C}"</code>-style formatting.',
      ],
    },
    {
      heading: 'Equals() and the equality contract',
      points: [
        'The default <code>Equals</code> on a class performs <em>reference equality</em> — two objects are equal only if they are the same instance in memory. This is rarely what you want for domain model objects.',
        'Override <code>Equals(object)</code> to implement <em>value equality</em> (equal when contents match). The golden rule: <strong>always override <code>GetHashCode</code> at the same time</strong> — they form a contract, not two independent methods.',
        '<strong>The full contract:</strong> <ul><li>Reflexive: <code>x.Equals(x)</code> is always <code>true</code></li><li>Symmetric: <code>x.Equals(y)</code> ⟺ <code>y.Equals(x)</code></li><li>Transitive: if <code>x == y</code> and <code>y == z</code>, then <code>x == z</code></li><li>Consistent: same result on repeated calls with unchanged objects</li></ul>',
        'Implement <code>IEquatable&lt;T&gt;</code> alongside the <code>Equals(object)</code> override. This provides a strongly-typed <code>Equals(T other)</code> overload that avoids boxing for value types and is preferred by <code>List&lt;T&gt;.Contains</code>, <code>EqualityComparer&lt;T&gt;.Default</code>, and similar generic infrastructure.',
        'Records (C# 9+) auto-generate all equality members from their constructor parameters — you get <code>Equals</code>, <code>GetHashCode</code>, <code>==</code>, and <code>!=</code> for free. Prefer records over classes when value equality is the natural semantic.',
      ],
    },
    {
      heading: 'GetHashCode() — the critical contract',
      points: [
        '<strong>Equal objects must always return the same hash code.</strong> Breaking this rule silently corrupts <code>Dictionary</code> and <code>HashSet</code> — keys become unfindable after insertion, and items appear to duplicate.',
        'The reverse is not required — different objects may share a hash code (a "collision"). Collisions degrade performance (O(n) lookup instead of O(1)) but do not break correctness.',
        'Hash codes must not change for the lifetime of an object while it is stored in a hash-based collection. If your type is mutable, either base the hash on <em>immutable</em> fields only, or document that instances must not be mutated while inside a dictionary.',
        'Use <code>HashCode.Combine(field1, field2, ...)</code> (.NET Core 2.1+) for a high-quality, avalanche-effect hash with minimal boilerplate. Avoid XOR-only hashes — <code>a ^ b ^ b == a</code>, so XOR hashes often produce poor distributions for symmetric data.',
        'Do not include mutable fields in <code>GetHashCode</code>. If you must use mutable objects as dictionary keys, override with a stable subset of fields — or use an immutable wrapper type.',
      ],
    },
    {
      heading: 'GetType(), typeof(), and the type system',
      points: [
        '<code>GetType()</code> returns the actual runtime type of an instance — if an <code>Animal</code> variable holds a <code>Dog</code>, <code>GetType()</code> returns <code>typeof(Dog)</code>. It cannot be overridden.',
        '<code>typeof(T)</code> is a compile-time operator that returns the <code>Type</code> object for the statically-known type <code>T</code>. No virtual dispatch, no instance needed — faster than <code>GetType()</code> when the type is known at compile time.',
        'Use <code>obj.GetType() == typeof(MyClass)</code> for an <em>exact</em> type check that excludes derived types. Use <code>obj is MyClass</code> for an <em>inheritance-aware</em> check that includes subclasses — prefer the latter in most polymorphic code.',
        '<code>Type</code> objects are singletons per type per AppDomain: <code>ReferenceEquals(typeof(int), 42.GetType())</code> is always <code>true</code>. This makes type comparison fast and allocation-free.',
        'The <code>Type</code> API is the entry point for reflection — <code>type.GetProperties()</code>, <code>type.GetMethod("Foo")</code>, <code>type.MakeGenericType(...)</code>. Cache <code>Type</code> objects and their reflected members; reflection calls are expensive on first access.',
      ],
    },
    {
      heading: 'ReferenceEquals, operator ==, and the equality hierarchy',
      points: [
        '<code>object.ReferenceEquals(a, b)</code> always checks physical identity — it cannot be overloaded. Use it when you explicitly need to test "same object in memory" even for types that override <code>==</code>.',
        'The <code>==</code> operator on <code>object</code> also defaults to reference equality, but derived types can overload it to mean value equality. <code>string</code> does this — <code>"abc" == "abc"</code> is <code>true</code> even for different string instances.',
        'When you overload <code>==</code>, you must also overload <code>!=</code> (the compiler enforces this) and keep them consistent with <code>Equals</code> and <code>GetHashCode</code>.',
        'For structs, <code>==</code> is <em>not</em> defined unless you explicitly provide an operator overload. The compiler provides a generic <code>Equals</code> for structs that compares all fields by value, but you should still override it (the default uses slow reflection for structs with reference-type fields).',
        'Null-safe pattern for custom <code>==</code>: <code>left?.Equals(right) ?? right is null</code> handles the case where either operand is null without a NullReferenceException, and reads clearly.',
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
    public int     Id       { get; init; }
    public string  Customer { get; init; } = "";
    public decimal Total    { get; init; }

    public override string ToString() =>
        \`Order #\${Id} — \${Customer} — £\${Total:F2}\`;
}

var o = new Order { Id = 42, Customer = "Alice", Total = 199.99m };
Console.WriteLine(o);                // Order #42 — Alice — £199.99
Console.WriteLine(\`Shipped: \${o}\`);  // Shipped: Order #42 — Alice — £199.99

// ── IFormattable — support format specifiers ───────────────────────────
public class Temperature : IFormattable
{
    public double Celsius { get; }
    public Temperature(double c) => Celsius = c;

    public override string ToString() => ToString("C", null);

    public string ToString(string? format, IFormatProvider? provider) =>
        (format?.ToUpper() ?? "C") switch
        {
            "F" => \`\${Celsius * 9 / 5 + 32:F1}°F\`,
            _   => \`\${Celsius:F1}°C\`,
        };
}

var t = new Temperature(100);
Console.WriteLine(t);       // 100.0°C
Console.WriteLine(\`\${t:F}\`); // 212.0°F`,
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

    // ── Equals — implement IEquatable<T> to avoid boxing ──────────────
    public override bool Equals(object? obj) => Equals(obj as Money);

    public bool Equals(Money? other) =>
        other is not null &&
        Amount   == other.Amount &&
        Currency == other.Currency;

    // ── GetHashCode — must match Equals ───────────────────────────────
    // HashCode.Combine produces a high-quality avalanche-effect hash
    public override int GetHashCode() =>
        HashCode.Combine(Amount, Currency);

    // ── == / != operators — keep consistent with Equals ───────────────
    public static bool operator ==(Money? left, Money? right) =>
        left?.Equals(right) ?? right is null;

    public static bool operator !=(Money? left, Money? right) => !(left == right);

    public override string ToString() => \`\${Amount} \${Currency}\`;
}

var a = new Money(10m, "GBP");
var b = new Money(10m, "GBP");
var c = new Money(20m, "GBP");

Console.WriteLine(a.Equals(b));          // True  — value equality
Console.WriteLine(a == b);               // True
Console.WriteLine(a == c);               // False
Console.WriteLine(a.GetHashCode() == b.GetHashCode()); // True
Console.WriteLine(object.ReferenceEquals(a, b));       // False — different instances

// Works correctly in collections because Equals + GetHashCode are consistent
var prices = new Dictionary<Money, string> { [a] = "ten pounds" };
Console.WriteLine(prices[b]);  // ten pounds — key lookup by value succeeds

var set = new HashSet<Money> { a };
Console.WriteLine(set.Contains(b));  // True`,
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
Console.WriteLine(ReferenceEquals(t1, t2));  // True — same Type instance

// ── Reflection entry point ────────────────────────────────────────────
var type = typeof(Money);
foreach (var prop in type.GetProperties())
    Console.WriteLine(\`\${prop.Name}: \${prop.PropertyType.Name}\`);
// Amount: Decimal
// Currency: String`,
    },
    {
      label: 'ReferenceEquals & ==',
      language: 'csharp',
      code: `// ── ReferenceEquals — cannot be overloaded ───────────────────────────
var a = new Money(10m, "GBP");
var b = new Money(10m, "GBP");
var same = a;

Console.WriteLine(object.ReferenceEquals(a, b));     // False — different instances
Console.WriteLine(object.ReferenceEquals(a, same));  // True — same reference

// ── string == overloads to value equality ─────────────────────────────
string s1 = "hello";
string s2 = new string('h', 'e', 'l', 'l', 'o'); // won't compile like this, just for illustration
string s2b = string.Concat("hel", "lo");           // new instance

Console.WriteLine(s1 == s2b);                        // True — value equality (overloaded ==)
Console.WriteLine(object.ReferenceEquals(s1, s2b));  // may be False

// ── String interning edge case ────────────────────────────────────────
string lit1 = "abc";
string lit2 = "abc";
Console.WriteLine(object.ReferenceEquals(lit1, lit2)); // True — literals are interned

// ── Null-safe == pattern for custom types ─────────────────────────────
// null == a:  left?.Equals(right) → null?.Equals(a) → null → false ✓
// a == null:  a?.Equals(null)     → a.Equals(null)  → false ✓
// null == null: null?.Equals(null) → null → ?? right is null → true ✓

// ── Struct: == is NOT defined by default ─────────────────────────────
public struct Point
{
    public int X, Y;
    // Without overloading ==, you cannot write: p1 == p2
    // You must call p1.Equals(p2) (uses ValueType.Equals — slow reflection)
}

// With explicit overload:
public struct PointV2
{
    public int X, Y;
    public override bool Equals(object? obj) => obj is PointV2 p && X == p.X && Y == p.Y;
    public override int GetHashCode() => HashCode.Combine(X, Y);
    public static bool operator ==(PointV2 l, PointV2 r) => l.Equals(r);
    public static bool operator !=(PointV2 l, PointV2 r) => !l.Equals(r);
}`,
    },
    {
      label: 'MemberwiseClone',
      language: 'csharp',
      code: `// ── MemberwiseClone — shallow copy ────────────────────────────────────
public class UserProfile : ICloneable
{
    public string       Name    { get; set; } = "";
    public int          Age     { get; set; }
    public List<string> Tags    { get; set; } = new();

    // MemberwiseClone is protected — expose via a public method
    public UserProfile ShallowClone() => (UserProfile)MemberwiseClone();

    // Deep clone — must copy mutable reference fields manually
    public UserProfile DeepClone() =>
        new UserProfile
        {
            Name = Name,
            Age  = Age,
            Tags = new List<string>(Tags),  // new list, same string elements (strings are immutable)
        };

    public object Clone() => DeepClone();   // ICloneable
}

var original = new UserProfile { Name = "Alice", Age = 30, Tags = { "admin", "user" } };

var shallow = original.ShallowClone();
shallow.Name = "Bob";          // string is immutable — original.Name stays "Alice"
shallow.Tags.Add("guest");     // Tags is the SAME List reference — original is affected!

Console.WriteLine(original.Name);           // Alice — value type field safe
Console.WriteLine(original.Tags.Count);     // 3 — shallow copy pitfall!

var deep = original.DeepClone();
deep.Tags.Add("superuser");
Console.WriteLine(original.Tags.Count);     // 3 — deep clone has its own list

// ── Records get copy semantics with with-expressions ──────────────────
public record PersonRecord(string Name, int Age, IReadOnlyList<string> Tags);

var pr = new PersonRecord("Alice", 30, new[] { "admin" });
var pr2 = pr with { Name = "Bob" };  // shallow copy with one field changed
Console.WriteLine(pr.Name);   // Alice
Console.WriteLine(pr2.Name);  // Bob`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Overriding Equals without GetHashCode',
      wrong: `public override bool Equals(object? obj) =>
    obj is Product p && Sku == p.Sku;
// GetHashCode not overridden — compiler warns, Dictionary silently breaks`,
      right: `public override bool Equals(object? obj) =>
    obj is Product p && Sku == p.Sku;

public override int GetHashCode() => HashCode.Combine(Sku);`,
      explanation: 'Equals and GetHashCode form a contract. If two objects are Equal, they must have the same hash. Without overriding GetHashCode, Dictionary<K,V> and HashSet<T> use identity-based hashes and will fail to find items that are "equal" — producing silent data loss or apparent duplicates.',
    },
    {
      title: 'Using mutable fields in GetHashCode',
      wrong: `public class Tag
{
    public string Name { get; set; } = ""; // mutable!
    public override int GetHashCode() => HashCode.Combine(Name);
}
var t = new Tag { Name = "admin" };
var set = new HashSet<Tag> { t };
t.Name = "superuser"; // hash changes — t is now "lost" in the set!
Console.WriteLine(set.Contains(t)); // False!`,
      right: `public class Tag
{
    public string Name { get; init; } = ""; // immutable after construction
    public override int GetHashCode() => HashCode.Combine(Name);
    public override bool Equals(object? obj) => obj is Tag t && Name == t.Name;
}`,
      explanation: 'If a field used in GetHashCode changes after the object is inserted into a dictionary or set, the object moves to a different hash bucket but stays in the old one. The item becomes permanently lost. Either use only immutable fields in GetHashCode, or document that mutating keys is forbidden.',
    },
    {
      title: 'Using GetType() == typeof(T) instead of is for polymorphic checks',
      wrong: `Animal animal = new Dog();
if (animal.GetType() == typeof(Animal))  // False — runtime type is Dog
    HandleAnimal(animal);`,
      right: `Animal animal = new Dog();
if (animal is Animal a)  // True — Dog inherits from Animal
    HandleAnimal(a);`,
      explanation: 'GetType() == typeof(T) is an exact check that excludes derived types. Use it only when you specifically want to prevent subclasses from matching. For polymorphic scenarios (which is most code), use the is operator or switch expressions — they check the inheritance chain correctly.',
    },
    {
      title: 'Relying on MemberwiseClone with mutable reference-type fields',
      wrong: `var original = new UserProfile { Tags = new List<string> { "admin" } };
var copy = original.ShallowClone(); // MemberwiseClone
copy.Tags.Add("guest");             // also adds to original.Tags!`,
      right: `// Deep clone mutable reference fields manually
var copy = new UserProfile
{
    Name = original.Name,
    Age  = original.Age,
    Tags = new List<string>(original.Tags), // independent copy
};`,
      explanation: 'MemberwiseClone copies field values — for reference-type fields, it copies the reference, not the object. Both instances then share the same List, Dictionary, or array. Any mutation via the copy is visible in the original. Always deep-clone mutable reference fields when true isolation is needed.',
    },
    {
      title: 'Not implementing IEquatable<T> alongside Equals(object)',
      wrong: `public struct Temperature
{
    public double Celsius { get; }
    public override bool Equals(object? obj) =>  // boxes every comparison
        obj is Temperature t && Celsius == t.Celsius;
}`,
      right: `public struct Temperature : IEquatable<Temperature>
{
    public double Celsius { get; }
    public bool Equals(Temperature other) => Celsius == other.Celsius; // no boxing
    public override bool Equals(object? obj) => obj is Temperature t && Equals(t);
    public override int GetHashCode() => Celsius.GetHashCode();
}`,
      explanation: 'Without IEquatable<T>, generic infrastructure (List<T>.Contains, HashSet<T>, LINQ) falls back to Equals(object), which boxes the value type on every comparison. Implementing IEquatable<T> provides a non-boxing overload used automatically by all generic collections — a measurable difference in hot paths.',
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
      explanation: 'Unless overridden, <code>Object.Equals</code> on a class performs <em>reference equality</em> — it returns <code>true</code> only if both references point to the same object in memory. Value types (structs) get field-by-field comparison via <code>ValueType.Equals</code>, but this uses reflection for struct fields of reference type and is slow.',
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
      explanation: 'The contract requires: if <code>a.Equals(b)</code> is <code>true</code>, then <code>a.GetHashCode() == b.GetHashCode()</code> must also be <code>true</code>. Violating this breaks <code>Dictionary</code> and <code>HashSet</code> silently. The reverse — different objects having the same hash — is allowed (a "collision") and only hurts performance, not correctness.',
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
      explanation: '<code>IEquatable&lt;T&gt;</code> adds an <code>Equals(T other)</code> overload. For value types, this avoids boxing — the base <code>Equals(object)</code> would box every comparison. Generic collections like <code>List&lt;T&gt;</code> and <code>EqualityComparer&lt;T&gt;.Default</code> prefer the <code>IEquatable&lt;T&gt;</code> overload when available.',
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
      explanation: '<code>ReferenceEquals</code> is a static method on <code>object</code> that always checks physical identity. Unlike the <code>==</code> operator, it cannot be overloaded, so it always means "same instance" regardless of type. String interning means <code>ReferenceEquals</code> can return <code>true</code> for string literals that look like different instances.',
    },
    {
      q: 'You add an object to a HashSet, then mutate a field that is part of GetHashCode. What happens?',
      options: [
        'The HashSet automatically rehashes the object to the new bucket',
        'The HashSet throws InvalidOperationException',
        'The object is now in the wrong bucket and cannot be found or removed — it is effectively lost',
        'Nothing — HashSet does not use GetHashCode for lookup',
      ],
      answer: 2,
      explanation: 'A <code>HashSet</code> computes the hash at insert time and places the object in that bucket. If you mutate a field that changes the hash, the object stays in the old bucket but future lookups compute the new hash and look in the wrong bucket — the item appears to disappear. Always use only immutable fields in <code>GetHashCode</code>.',
    },
    {
      q: 'What is the result of <code>dog.GetType() == typeof(Animal)</code> when dog is declared as <code>Animal dog = new Dog()</code>?',
      options: [
        'true — Animal is the declared type of the variable',
        'false — GetType() returns the runtime type Dog, not Animal',
        'Throws InvalidCastException',
        'true — Dog inherits from Animal so they share the same Type object',
      ],
      answer: 1,
      explanation: '<code>GetType()</code> returns the <em>runtime</em> type of the instance, which is <code>Dog</code> — not the declared type <code>Animal</code> of the variable. <code>dog.GetType() == typeof(Dog)</code> is <code>true</code>. Use <code>dog is Animal</code> instead for an inheritance-aware check.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What happens if I override Equals but not GetHashCode?',
      a: 'You get a compiler warning, and your type silently breaks in any hash-based collection. Two objects that are <em>equal</em> according to your <code>Equals</code> may have different hash codes (the default is identity-based), so a <code>Dictionary</code> or <code>HashSet</code> places them in different buckets and fails to find one when looking up the other. Always override both together — they form a single contract, not two independent methods.',
    },
    {
      q: 'Should I override == when I override Equals?',
      a: 'For classes, it is optional but strongly recommended for consistency — users expect <code>a == b</code> to behave like <code>a.Equals(b)</code>. If you override <code>==</code>, the compiler requires you to also override <code>!=</code>, and you must keep both consistent with <code>Equals</code> and <code>GetHashCode</code>. For structs, <code>==</code> is not defined at all unless you explicitly provide an operator overload, so you should always define it on structs that override <code>Equals</code>.',
    },
    {
      q: 'When would I use MemberwiseClone vs a copy constructor?',
      a: '<code>MemberwiseClone</code> is quick to implement for shallow copies — it copies every field without you listing them individually. However, it always produces a <em>shallow</em> copy: reference-type fields still point to the same objects. A copy constructor gives you full control over which fields are deep-copied and which are shared. Use <code>MemberwiseClone</code> for immutable types or truly flat objects; use a copy constructor (or <code>record with { }</code>) when the object contains mutable reference-type fields.',
    },
    {
      q: 'What is the difference between is and GetType() == typeof(T)?',
      a: '<code>is</code> performs an <em>inheritance-aware</em> check: <code>dog is Animal</code> returns <code>true</code> even if <code>dog</code> is a <code>Dog</code>. <code>obj.GetType() == typeof(Animal)</code> is an <em>exact</em> type check — it returns <code>false</code> for <code>Dog</code>. Use <code>is</code> for polymorphic code (the common case). Use the exact check only when you specifically want to exclude subclasses, such as in serialisers or factory dispatch logic.',
    },
    {
      q: 'How does string equality work given that string is a class?',
      a: 'The <code>string</code> class overrides both <code>Equals</code> and the <code>==</code> operator to perform <em>value (content) equality</em>. So <code>"abc" == "abc"</code> is <code>true</code> even for two different string instances. <code>object.ReferenceEquals("abc", "abc")</code> may also return <code>true</code> for identical <em>literals</em> due to <strong>string interning</strong> — the runtime reuses the same string object for compile-time literals. However, you must never rely on interning for non-literal strings; use <code>==</code> or <code>Equals</code> instead.',
    },
    {
      q: 'Why does the default struct Equals use reflection and why is it slow?',
      a: 'The default <code>ValueType.Equals</code> provided by the runtime must compare all fields generically without knowing the struct\'s layout. For fields that are <em>blittable</em> (pure value types with no references), it can do a fast memcmp-style comparison. But when a struct contains any reference-type field, it falls back to reflection to enumerate and compare fields — which is orders of magnitude slower. This is why every struct with reference fields should override <code>Equals</code> and <code>GetHashCode</code> explicitly.',
    },
    {
      q: 'What does HashCode.Combine do better than a simple XOR of field hashes?',
      a: '<code>HashCode.Combine</code> uses the same non-cryptographic hashing algorithm as the .NET runtime (based on Marvin32), which has good avalanche properties — small input differences produce very different outputs. XOR hashes (<code>a.GetHashCode() ^ b.GetHashCode()</code>) have a critical weakness: XOR is commutative, so <code>Combine(A, B)</code> and <code>Combine(B, A)</code> produce the same hash. This causes poor distribution for collections containing pairs or ordered data, leading to O(n) lookup degradation. <code>HashCode.Combine</code> is order-sensitive by design.',
    },
  ];

  challenge: Challenge = {
    title: 'Value-Equality Product',
    description: `Implement a <code>Product</code> class with correct <code>System.Object</code> overrides.
1. Properties: <code>string Sku</code>, <code>string Name</code>, <code>decimal Price</code>.
2. Two <code>Product</code> instances are equal if their <code>Sku</code> values are equal (SKU is the unique identifier — name and price can differ).
3. Override <code>Equals</code>, <code>GetHashCode</code>, and <code>==</code> / <code>!=</code> operators.
4. Implement <code>IEquatable&lt;Product&gt;</code> for the strongly-typed overload.
5. Override <code>ToString()</code> to return a meaningful summary.`,
    language: 'csharp',
    hints: [
      'Equality is SKU-only: Equals checks only Sku, GetHashCode hashes only Sku',
      'Use HashCode.Combine(Sku) for a good quality hash',
      'Implement IEquatable<Product> with Equals(Product? other) => other is not null && Sku == other.Sku',
      'Null-safe operator pattern: left?.Equals(right) ?? right is null',
    ],
    starterCode: `public class Product : IEquatable<Product>
{
    public string  Sku   { get; init; } = "";
    public string  Name  { get; set; }  = "";
    public decimal Price { get; set; }

    public override string ToString() => throw new NotImplementedException();

    // IEquatable<T> — strongly typed, no boxing
    public bool Equals(Product? other) => throw new NotImplementedException();

    // Object.Equals — delegates to the typed overload
    public override bool Equals(object? obj) => throw new NotImplementedException();

    public override int GetHashCode() => throw new NotImplementedException();

    public static bool operator ==(Product? left, Product? right) =>
        throw new NotImplementedException();

    public static bool operator !=(Product? left, Product? right) =>
        throw new NotImplementedException();
}

var p1 = new Product { Sku = "WGT-001", Name = "Widget",     Price = 9.99m };
var p2 = new Product { Sku = "WGT-001", Name = "Widget Pro", Price = 14.99m };
var p3 = new Product { Sku = "GAD-002", Name = "Gadget",     Price = 4.99m };

Console.WriteLine(p1 == p2);   // True
Console.WriteLine(p1 == p3);   // False
Console.WriteLine(p1.GetHashCode() == p2.GetHashCode()); // True
Console.WriteLine(p1);         // [WGT-001] Widget £9.99

var set = new HashSet<Product> { p1 };
Console.WriteLine(set.Contains(p2)); // True`,
    solution: `public class Product : IEquatable<Product>
{
    public string  Sku   { get; init; } = "";
    public string  Name  { get; set; }  = "";
    public decimal Price { get; set; }

    public override string ToString() => \`[\${Sku}] \${Name} £\${Price:F2}\`;

    // Strongly-typed: no boxing, preferred by generic infrastructure
    public bool Equals(Product? other) =>
        other is not null && Sku == other.Sku;

    // Object.Equals delegates to the typed overload
    public override bool Equals(object? obj) => Equals(obj as Product);

    // Hash on the same field(s) as Equals
    public override int GetHashCode() => HashCode.Combine(Sku);

    // Null-safe == operator
    public static bool operator ==(Product? left, Product? right) =>
        left?.Equals(right) ?? right is null;

    public static bool operator !=(Product? left, Product? right) => !(left == right);
}

var p1 = new Product { Sku = "WGT-001", Name = "Widget",     Price = 9.99m };
var p2 = new Product { Sku = "WGT-001", Name = "Widget Pro", Price = 14.99m };
var p3 = new Product { Sku = "GAD-002", Name = "Gadget",     Price = 4.99m };

Console.WriteLine(p1 == p2);   // True
Console.WriteLine(p1 == p3);   // False
Console.WriteLine(p1.GetHashCode() == p2.GetHashCode()); // True
Console.WriteLine(p1);         // [WGT-001] Widget £9.99

var set = new HashSet<Product> { p1 };
Console.WriteLine(set.Contains(p2)); // True — value-based lookup works`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Every C# type inherits ToString, Equals, GetHashCode, and GetType from System.Object. Overriding Equals without GetHashCode silently breaks hash collections; IEquatable<T> avoids boxing; and mutable fields in GetHashCode lose objects in dictionaries.',
    mustKnow: [
      'Default class <code>Equals</code> is reference equality — override for value equality, always paired with <code>GetHashCode</code>',
      'Equal objects must return the same hash code — the reverse is not required (collisions are allowed)',
      'Mutable fields in <code>GetHashCode</code> lose objects in <code>Dictionary</code>/<code>HashSet</code> after mutation',
      '<code>IEquatable&lt;T&gt;</code> provides a strongly-typed, non-boxing <code>Equals(T)</code> overload preferred by generic collections',
      '<code>GetType()</code> returns runtime type (exact); <code>is T</code> is inheritance-aware — use <code>is</code> in most polymorphic code',
      '<code>ReferenceEquals</code> cannot be overloaded — always checks physical identity regardless of <code>==</code> overloads',
      '<code>MemberwiseClone</code> is shallow — reference-type fields are shared; deep clone mutable fields manually',
    ],
    interviewFocus: [
      'What happens if you override Equals but not GetHashCode? Give a concrete example of the breakage.',
      'Why must GetHashCode return the same value for equal objects? What happens if it doesn\'t?',
      'What is the difference between <code>is Animal</code> and <code>GetType() == typeof(Animal)</code>?',
      'Why implement IEquatable<T> alongside Equals(object)? What advantage does it give?',
      'Why is XOR a bad hash-combining strategy and how does HashCode.Combine fix it?',
    ],
  };
}
