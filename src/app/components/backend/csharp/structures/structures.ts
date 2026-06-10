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
  selector: 'app-csharp-structures',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './structures.html',
  styleUrl: './structures.scss',
})
export class CsharpStructures {

  quickRef: QuickRefItem[] = [
    { name: 'struct',            type: 'keyword',  desc: 'Value type — allocated on the stack (or inline in containing type), copied on assignment', since: 'C# 1' },
    { name: 'readonly struct',   type: 'keyword',  desc: 'Immutable struct — all fields are readonly; enables compiler optimisations, avoids defensive copies', since: 'C# 7.2' },
    { name: 'ref struct',        type: 'keyword',  desc: 'Stack-only struct — cannot be boxed, stored on the heap, or used in async/lambda; used for Span<T>', since: 'C# 7.2' },
    { name: 'record struct',     type: 'keyword',  desc: 'Value-type record with auto-generated equality, ToString, Deconstruct, and with-expression support', since: 'C# 10' },
    { name: 'default(T)',        type: 'syntax',   desc: 'Returns the zero-initialised default value of a type — all-zero bits for structs', since: 'C# 1' },
    { name: 'in parameter',      type: 'keyword',  desc: 'Passes a struct by readonly reference — avoids copying without allowing mutation', since: 'C# 7.2' },
    { name: 'boxing',            type: 'type',     desc: 'Wrapping a value type in an object reference — allocates on the heap and incurs GC pressure', since: 'C# 1' },
    { name: 'Span<T>',           type: 'type',     desc: 'Stack-allocated slice over memory; backed by ref struct so it stays on the stack', since: '.NET Core 2.1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'struct is a value type',
      points: [
        'A <code>struct</code> is a value type. Instances are typically stored on the stack (or inline inside another type), not on the managed heap.',
        'Assignment copies the entire struct — changing a copy does not affect the original. This is called <em>copy semantics</em>.',
        'Because structs are not heap-allocated, there is no garbage-collector overhead for short-lived small values.',
        'Structs cannot inherit from other structs or classes (beyond <code>System.ValueType</code>), and cannot be used as a base type. They <em>can</em> implement interfaces.',
      ],
    },
    {
      heading: 'readonly struct — immutable and optimised',
      points: [
        'Marking a struct <code>readonly</code> tells the compiler every field is <code>readonly</code>. The compiler enforces this and prevents accidental mutation.',
        'Without <code>readonly</code>, passing a struct to an <code>in</code> parameter can trigger a hidden <em>defensive copy</em> if any member is potentially mutating. <code>readonly struct</code> eliminates that copy.',
        'Prefer <code>readonly struct</code> whenever your struct represents an immutable value object.',
        'All auto-properties in a <code>readonly struct</code> must be <code>get</code>-only (or <code>init</code>-only in C# 10+).',
      ],
    },
    {
      heading: 'ref struct — stack-only types',
      points: [
        'A <code>ref struct</code> is restricted to the stack. It cannot be boxed to <code>object</code>, stored in a field of a class, used as a generic type argument, or captured in a lambda or async method.',
        'These constraints allow the runtime to guarantee the ref struct never escapes the stack, enabling safe use of stack-allocated or pinned memory.',
        '<code>Span&lt;T&gt;</code> and <code>ReadOnlySpan&lt;T&gt;</code> are the primary examples — they represent a contiguous slice of memory with zero heap allocation.',
        'Use <code>ref struct</code> when writing high-performance parsing, serialisation, or buffer manipulation code.',
      ],
    },
    {
      heading: 'record struct',
      points: [
        'A <code>record struct</code> is a value-type record. It adds auto-generated value equality, <code>ToString</code>, <code>Deconstruct</code>, and <code>with</code> expression support to an ordinary struct.',
        'Unlike <code>record class</code>, a <code>record struct</code> is mutable by default. Use <code>readonly record struct</code> for immutability.',
        'Great for small data bags that need value equality without the boilerplate: <code>record struct Point(int X, int Y);</code>',
        '<code>with</code> expressions work on <code>record struct</code> just like on <code>record class</code>, returning a new copy with overridden fields.',
      ],
    },
    {
      heading: 'Boxing and when to avoid it',
      points: [
        '<em>Boxing</em> wraps a value type in a heap-allocated <code>object</code> wrapper. It is triggered by assigning a struct to an <code>object</code>, <code>dynamic</code>, or an interface variable.',
        '<em>Unboxing</em> is the reverse — casting the <code>object</code> back to the value type. Both operations are implicit but involve heap allocation and a cast check.',
        'Frequent boxing in hot paths causes GC pressure and can dramatically reduce throughput. Use generics (<code>List&lt;T&gt;</code> instead of <code>ArrayList</code>) to avoid it.',
        'Interfaces on structs are a common boxing trap: <code>IComparable x = myStruct;</code> boxes. Use <code>in</code> parameters or generic constraints instead.',
      ],
    },
    {
      heading: 'When to choose struct over class',
      points: [
        'Choose <code>struct</code> when the value is <strong>small</strong> (guideline: ≤ 16 bytes), <strong>immutable</strong>, and logically represents a single value rather than an entity.',
        'Good candidates: coordinates (<code>Point</code>, <code>Vector3</code>), colours, date ranges, physical units, 2D sizes.',
        'Avoid struct when the type contains many fields, is frequently boxed, benefits from inheritance, or represents an entity with identity.',
        'A <code>struct</code> always has a public parameterless constructor that zero-initialises all fields — you cannot make construction fail for the default case.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'struct Basics',
      language: 'csharp',
      code: `// ── Simple struct ──────────────────────────────────────────────────────
public struct Point
{
    public int X;
    public int Y;

    public Point(int x, int y) { X = x; Y = y; }

    public double DistanceTo(Point other)
    {
        int dx = X - other.X;
        int dy = Y - other.Y;
        return Math.Sqrt(dx * dx + dy * dy);
    }

    public override string ToString() => \`(\${X}, \${Y})\`;
}

var a = new Point(0, 0);
var b = new Point(3, 4);

// Copy semantics — b is a full copy
var c = b;
c.X = 99;
Console.WriteLine(b.X);  // 3 — b is unchanged
Console.WriteLine(c.X);  // 99

Console.WriteLine(a.DistanceTo(b));  // 5

// default(T) zero-initialises every field
var origin = default(Point);
Console.WriteLine(origin);  // (0, 0)`,
    },
    {
      label: 'readonly struct',
      language: 'csharp',
      code: `// ── readonly struct — immutable value type ────────────────────────────
public readonly struct Vector2D
{
    public float X { get; }
    public float Y { get; }

    public Vector2D(float x, float y) { X = x; Y = y; }

    public float Length => MathF.Sqrt(X * X + Y * Y);

    // Returns a new vector — no mutation
    public Vector2D Normalise() => new Vector2D(X / Length, Y / Length);

    public static Vector2D operator +(Vector2D a, Vector2D b) =>
        new Vector2D(a.X + b.X, a.Y + b.Y);

    public override string ToString() => \`<\${X:F2}, \${Y:F2}>\`;
}

var v1 = new Vector2D(3, 4);
var v2 = new Vector2D(1, 0);

Console.WriteLine(v1.Length);          // 5
Console.WriteLine(v1.Normalise());     // <0.60, 0.80>
Console.WriteLine(v1 + v2);           // <4.00, 4.00>

// ── in parameter — pass by readonly reference (no copy, no mutation) ──
static float Dot(in Vector2D a, in Vector2D b) => a.X * b.X + a.Y * b.Y;
Console.WriteLine(Dot(v1, v2));  // 3`,
    },
    {
      label: 'ref struct & Span<T>',
      language: 'csharp',
      code: `// ── ref struct basics ─────────────────────────────────────────────────
ref struct StackBuffer
{
    private Span<byte> _data;

    public StackBuffer(Span<byte> data) { _data = data; }
    public int Length => _data.Length;
    public byte this[int i] { get => _data[i]; set => _data[i] = value; }
}

Span<byte> raw = stackalloc byte[8];
var buf = new StackBuffer(raw);
buf[0] = 0xFF;
Console.WriteLine(buf[0]);   // 255
Console.WriteLine(buf.Length); // 8

// ── Span<T> — zero-allocation slicing ─────────────────────────────────
string csv = "alpha,beta,gamma,delta";
ReadOnlySpan<char> span = csv.AsSpan();

int start = 0;
while (true)
{
    int comma = span[start..].IndexOf(',');
    if (comma < 0) { Console.WriteLine(span[start..]); break; }
    Console.WriteLine(span.Slice(start, comma));
    start += comma + 1;
}
// Prints: alpha  beta  gamma  delta
// No substring allocations — all slices reference the original string`,
    },
    {
      label: 'record struct',
      language: 'csharp',
      code: `// ── Mutable record struct ─────────────────────────────────────────────
public record struct Color(byte R, byte G, byte B);

var red  = new Color(255, 0, 0);
var red2 = new Color(255, 0, 0);

Console.WriteLine(red == red2);   // True — value equality
Console.WriteLine(red);           // Color { R = 255, G = 0, B = 0 }

// with expression — returns a copy
var orange = red with { G = 165 };
Console.WriteLine(orange);        // Color { R = 255, G = 165, B = 0 }
Console.WriteLine(red);           // Color { R = 255, G = 0, B = 0 } — unchanged

// ── readonly record struct — immutable + value equality ───────────────
public readonly record struct Temperature(double Celsius)
{
    public double Fahrenheit => Celsius * 9 / 5 + 32;
    public Temperature ToKelvin() => this with { Celsius = Celsius + 273.15 };
}

var boiling = new Temperature(100);
Console.WriteLine(boiling.Fahrenheit);         // 212
Console.WriteLine(boiling.ToKelvin().Celsius); // 373.15`,
    },
    {
      label: 'Boxing / Unboxing',
      language: 'csharp',
      code: `// ── Boxing — struct wrapped in object (heap allocation) ──────────────
int x = 42;
object boxed = x;          // boxing: heap allocation occurs here
int y = (int)boxed;        // unboxing: type check + copy back

Console.WriteLine(ReferenceEquals(x, boxed)); // False — different objects

// ── Interface boxing trap ──────────────────────────────────────────────
interface IHasValue { int Value { get; } }

struct Counter : IHasValue
{
    public int Value { get; private set; }
    public void Increment() => Value++;
}

IHasValue iface = new Counter();  // BOXING — Counter is copied to heap!
// Mutations on 'iface' don't affect the original Counter value.

// ── Avoid boxing with generics ─────────────────────────────────────────
static T GetDefault<T>() where T : struct => default;

int    defInt  = GetDefault<int>();    // No boxing
double defDbl  = GetDefault<double>(); // No boxing

// ── Where boxing sneaks in ─────────────────────────────────────────────
// ArrayList (legacy)  → stores object, every int is boxed
// string.Format("{0}", myStruct)  → boxes the struct
// Non-generic collections          → always box value types`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What happens when you assign a struct to another variable?',
      options: [
        'Both variables share the same instance',
        'A full copy of the struct is made — changes to one do not affect the other',
        'A reference to the original struct is created',
        'The struct is boxed into an object',
      ],
      answer: 1,
      explanation: 'Structs have <em>value semantics</em> — assignment copies every field. This differs from classes (reference types), where assignment copies only the reference, so both variables point at the same object.',
    },
    {
      q: 'What is the primary purpose of readonly struct?',
      options: [
        'To prevent the struct from being used as a method parameter',
        'To make the struct heap-allocated like a class',
        'To guarantee immutability and eliminate hidden defensive copies in in-parameter contexts',
        'To allow the struct to inherit from a base struct',
      ],
      answer: 2,
      explanation: 'Without <code>readonly</code>, the compiler may emit a hidden defensive copy when passing a struct through an <code>in</code> parameter if any member could mutate state. <code>readonly struct</code> tells the compiler no mutation is possible, so no copy is needed.',
    },
    {
      q: 'Which of the following can a ref struct NOT do?',
      options: [
        'Implement an interface',
        'Have methods and properties',
        'Be stored in a class field or boxed to object',
        'Be passed as a parameter to a method',
      ],
      answer: 2,
      explanation: '<code>ref struct</code> is stack-only. It cannot be boxed, stored on the heap (class fields, arrays, etc.), used as a generic type argument, or captured in lambdas or async methods. These constraints guarantee it never escapes the stack.',
    },
    {
      q: 'What triggers boxing of a value type?',
      options: [
        'Passing a struct to a method accepting the same struct type',
        'Assigning a struct to an object, dynamic, or interface variable',
        'Calling a method defined directly on the struct',
        'Using default(T) to create a struct instance',
      ],
      answer: 1,
      explanation: 'Boxing occurs when a value type is implicitly or explicitly converted to <code>object</code>, <code>dynamic</code>, or any interface it implements. The runtime wraps the value in a heap-allocated object, which adds GC pressure.',
    },
    {
      q: 'What is the correct guideline for choosing struct over class?',
      options: [
        'Use struct for all types that have methods',
        'Use struct for small (≤ 16 bytes), immutable, logically single-value types with no need for inheritance',
        'Use struct whenever you need reference equality',
        'Use struct when the type will frequently be stored in collections',
      ],
      answer: 1,
      explanation: 'The guideline is: structs work best when small (fitting in roughly two pointers), immutable, and representing a single logical value rather than an entity. Large or frequently-boxed structs often perform worse than classes.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can a struct have a parameterless constructor?',
      a: 'Yes, since C# 10. Prior to C# 10, structs always had an implicit parameterless constructor that zero-initialised all fields and you could not define your own. From C# 10 onwards you can declare a custom parameterless constructor. However, <code>default(T)</code> and array creation always use the zero-init path regardless of any custom constructor, so you cannot make the default value "fail".',
    },
    {
      q: 'Why does Span<T> have to be a ref struct?',
      a: '<code>Span&lt;T&gt;</code> holds a pointer and a length into memory that may be stack-allocated (via <code>stackalloc</code>), pinned heap memory, or unmanaged memory. If a <code>Span</code> could escape to the heap (e.g. boxed or stored in a class field), the pointed-to memory might already be freed — a dangling pointer. Restricting it to a <code>ref struct</code> guarantees the span can never outlive the stack frame that created it, making it safe.',
    },
    {
      q: 'Does a struct implement Equals and GetHashCode automatically?',
      a: 'Yes, but the default <code>ValueType.Equals</code> uses reflection to compare every field, which is slow. The default <code>GetHashCode</code> also has platform-specific behaviour. For any struct used in a <code>Dictionary</code>, <code>HashSet</code>, or tested for equality frequently, you should override both members (or use <code>record struct</code> which auto-generates them).',
    },
    {
      q: 'Can a struct implement an interface without boxing?',
      a: 'When called through a <em>generic type parameter constrained to the interface</em> (e.g. <code>void Process&lt;T&gt;(T item) where T : IMyInterface</code>), the JIT can inline calls without boxing. When assigned to the interface type directly (<code>IMyInterface x = myStruct</code>), boxing occurs. C# 11 also introduced <em>static abstract interface members</em>, which allow interface-based polymorphism on value types at zero boxing cost.',
    },
    {
      q: 'What is the difference between record struct and readonly record struct?',
      a: 'A plain <code>record struct</code> is <em>mutable</em> — its auto-generated properties have both a getter and a setter. A <code>readonly record struct</code> is <em>immutable</em> — all properties are <code>get</code>-only. Both support value equality and <code>with</code> expressions. Prefer <code>readonly record struct</code> when the value should not change after creation.',
    },
  ];

  challenge: Challenge = {
    title: 'Immutable 2D Rectangle',
    description: `Create a <code>readonly record struct</code> called <code>Rect</code> representing a 2D rectangle.
1. It should have four <code>float</code> properties: <code>X</code>, <code>Y</code> (top-left corner), <code>Width</code>, <code>Height</code>.
2. Add a computed property <code>Area</code> returning <code>Width * Height</code>.
3. Add a method <code>Translate(float dx, float dy)</code> that returns a new <code>Rect</code> shifted by the given delta (use <code>with</code>).
4. Add a method <code>Contains(float px, float py)</code> that returns <code>true</code> if the point is inside or on the edge of the rectangle.
5. Verify that two <code>Rect</code> instances with the same values are equal.`,
    language: 'csharp',
    hints: [
      'Declare: public readonly record struct Rect(float X, float Y, float Width, float Height)',
      'Area => Width * Height',
      'Translate: return this with { X = X + dx, Y = Y + dy }',
      'Contains: px >= X && px <= X + Width && py >= Y && py <= Y + Height',
    ],
    starterCode: `public readonly record struct Rect(float X, float Y, float Width, float Height)
{
    // TODO: Area computed property
    public float Area => throw new NotImplementedException();

    // TODO: Translate — return shifted copy using with expression
    public Rect Translate(float dx, float dy) => throw new NotImplementedException();

    // TODO: Contains — point-in-rectangle test
    public bool Contains(float px, float py) => throw new NotImplementedException();
}

var r1 = new Rect(0, 0, 10, 5);
var r2 = new Rect(0, 0, 10, 5);
Console.WriteLine(r1 == r2);          // True
Console.WriteLine(r1.Area);           // 50
Console.WriteLine(r1.Contains(5, 3)); // True
Console.WriteLine(r1.Contains(11, 0)); // False
var r3 = r1.Translate(2, 3);
Console.WriteLine(r3);               // Rect { X = 2, Y = 3, Width = 10, Height = 5 }`,
    solution: `public readonly record struct Rect(float X, float Y, float Width, float Height)
{
    public float Area => Width * Height;

    public Rect Translate(float dx, float dy) =>
        this with { X = X + dx, Y = Y + dy };

    public bool Contains(float px, float py) =>
        px >= X && px <= X + Width && py >= Y && py <= Y + Height;
}

var r1 = new Rect(0, 0, 10, 5);
var r2 = new Rect(0, 0, 10, 5);
Console.WriteLine(r1 == r2);           // True
Console.WriteLine(r1.Area);            // 50
Console.WriteLine(r1.Contains(5, 3));  // True
Console.WriteLine(r1.Contains(11, 0)); // False
var r3 = r1.Translate(2, 3);
Console.WriteLine(r3); // Rect { X = 2, Y = 3, Width = 10, Height = 5 }`,
  };
}
