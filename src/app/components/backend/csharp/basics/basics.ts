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
  selector: 'app-csharp-basics',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './basics.html',
  styleUrl: './basics.scss',
})
export class CsharpBasics {

  quickRef: QuickRefItem[] = [
    { name: 'int',               type: 'type',    desc: '32-bit signed integer. Range: –2,147,483,648 to 2,147,483,647', since: 'C# 1' },
    { name: 'decimal',           type: 'type',    desc: '128-bit precise decimal for financial calculations. Use the m suffix: 9.99m', since: 'C# 1' },
    { name: 'string',            type: 'type',    desc: 'Immutable sequence of UTF-16 characters. Reference type on the heap', since: 'C# 1' },
    { name: 'bool',              type: 'type',    desc: 'Boolean value: true or false only', since: 'C# 1' },
    { name: 'var',               type: 'keyword', desc: 'Implicitly typed local variable — compiler infers the type from the right-hand side', since: 'C# 3' },
    { name: 'const',             type: 'keyword', desc: 'Compile-time constant — value is inlined by the compiler at the call site', since: 'C# 1' },
    { name: 'foreach',           type: 'syntax',  desc: 'Iterate over any IEnumerable<T> without managing indices', since: 'C# 1' },
    { name: 'switch expression', type: 'syntax',  desc: 'C# 8+ expression that returns a value; exhaustiveness checked at compile time', since: 'C# 8' },
    { name: '$"..."',            type: 'operator', desc: 'String interpolation — embed expressions directly in string literals', since: 'C# 6' },
    { name: 'StringBuilder',     type: 'class',   desc: 'Mutable string buffer — use instead of + in loops to avoid O(n²) allocations', since: 'C# 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'C# is statically typed',
      points: [
        'Every variable has a type known at compile time — the compiler rejects type mismatches before the program runs, catching entire classes of bugs at the earliest possible moment.',
        'Even <code>var</code> is statically typed — the type is inferred once at the declaration and then fixed. There is no runtime type-switching: <code>var x = 42;</code> makes <code>x</code> permanently an <code>int</code>.',
        'Nullable reference types (<code>string?</code>) extend the type system: enabling <code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code> in the project file makes the compiler warn whenever you dereference something that might be null.',
        'Static typing means better tooling — autocomplete, rename refactors, and "Find all references" work reliably because the compiler knows the type of every expression.',
        'Contrast with <code>dynamic</code>: a <code>dynamic</code> variable bypasses compile-time checking entirely and resolves member access at runtime — useful for COM interop and scripting scenarios, but loses all type safety.',
      ],
    },
    {
      heading: 'Value types vs reference types',
      points: [
        '<strong>Value types</strong> (<code>int</code>, <code>bool</code>, <code>double</code>, <code>struct</code>, <code>enum</code>) store their data directly where the variable lives — usually the stack for locals. Assigning copies the entire value.',
        '<strong>Reference types</strong> (<code>string</code>, <code>class</code>, arrays, delegates) store a pointer on the stack; the actual object lives on the managed heap. Assigning copies the pointer, so multiple variables can refer to the same object.',
        'Because <code>string</code> is a reference type but <em>immutable</em>, every mutating operation (ToUpper, Replace, Trim) returns a new string — the original is never altered. This makes sharing safe without defensive copying.',
        'Copying a large <code>struct</code> by value is expensive — each assignment duplicates all its fields. Pass large structs with <code>ref</code> or <code>in</code> (read-only ref) to avoid the copy. Prefer <code>class</code> for objects with many fields.',
        'Default values differ: value types default to their zero equivalent (<code>int → 0</code>, <code>bool → false</code>); reference types default to <code>null</code>. Forgetting this causes <code>NullReferenceException</code> on uninitialized fields.',
      ],
    },
    {
      heading: 'Boxing and unboxing',
      points: [
        'Boxing converts a value type to <code>object</code> (or an interface): the value is copied to a heap-allocated wrapper. Unboxing extracts it back — requiring an explicit cast.',
        'Example: <code>object o = 42;</code> boxes the integer. <code>int n = (int)o;</code> unboxes it. Both operations allocate and copy, which costs CPU and GC pressure.',
        'Boxing commonly happens in old <code>ArrayList</code> / non-generic <code>IEnumerable</code> APIs, format strings (<code>Console.WriteLine("{0}", myInt)</code>), and locking on value types — all anti-patterns to avoid.',
        'Generic collections (<code>List&lt;int&gt;</code>, <code>Dictionary&lt;int,T&gt;</code>) avoid boxing entirely because the JIT generates specialised code for value type type parameters.',
        'Interview trap: <code>interface ISomething { void Do(); } struct MyStruct : ISomething { ... }</code> — assigning <code>MyStruct</code> to an <code>ISomething</code> variable boxes it silently.',
      ],
    },
    {
      heading: 'Type inference with var',
      points: [
        '<code>var</code> lets the compiler determine the type from the right-hand side. The variable is still strongly typed — it is syntactic sugar, not a dynamic type.',
        'Use <code>var</code> when the type is obvious: <code>var dict = new Dictionary&lt;string, int&gt;()</code> avoids repeating the long generic type name. Readability improves.',
        'Avoid <code>var</code> when the return type of a method call is not clear from the name: <code>var result = Process(data);</code> forces the reader to look up the method signature.',
        'Numeric literal pitfall: <code>var price = 9.99;</code> infers <code>double</code>, not <code>decimal</code>. Always use the suffix when the type matters: <code>decimal price = 9.99m;</code>.',
        '<code>var</code> cannot be used for fields, method parameters, return types, or catch clauses — only for local variables inside method bodies.',
      ],
    },
    {
      heading: 'Modern switch expressions (C# 8+)',
      points: [
        'A switch expression returns a value; no <code>break</code>, no fall-through, no ceremony. The compiler enforces exhaustiveness: if any input is unhandled and there is no <code>_</code> discard, you get a warning.',
        'Arms use the <code>=></code> arrow. Relational patterns (<code>&gt;= 90</code>), property patterns (<code>{ Age: &gt; 18 }</code>), and type patterns (<code>is Circle c</code>) are all valid in arms.',
        'The <code>and</code> / <code>or</code> / <code>not</code> combinators allow complex pattern conditions without nested switches: <code>x is &gt;= 0 and &lt; 100</code>.',
        'Throw expressions are legal in arms: <code>_ => throw new ArgumentOutOfRangeException()</code> — useful for enforcing that all valid inputs are explicitly handled.',
        'Switch expressions replace long if/else chains with something more readable and less prone to missing cases. They compose naturally with LINQ and expression-bodied members.',
      ],
    },
    {
      heading: 'Top-level statements and program structure (C# 9+)',
      points: [
        'Before C# 9, every program needed a <code>namespace</code>, a <code>class Program</code>, and a <code>static void Main(string[] args)</code>. Top-level statements remove all that boilerplate.',
        'In a top-level program, statements at the top of the entry-point file execute directly. <code>Console.WriteLine("Hello");</code> is a complete, valid C# program.',
        'The <code>args</code> string array is still available implicitly, and you can still define classes and methods <em>below</em> the top-level statements in the same file.',
        'File-scoped namespaces (<code>namespace MyApp;</code>) flatten the indentation level compared to block-scoped namespaces — one less level of nesting across every file.',
        'Global using directives (<code>global using System.Text;</code> in a dedicated file) apply the <code>using</code> to every file in the project — .NET 6 SDK-style projects include the most common ones automatically.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Built-in Types',
      language: 'csharp',
      code: `// ── Integer types ────────────────────────────────────────────────
byte   b  = 255;              // 0–255      (8-bit unsigned)
short  s  = 32_767;           // ±32 k      (16-bit signed) — underscores aid readability
int    i  = 2_147_483_647;    // ±2.1 B     (32-bit signed) — most common integer type
long   l  = 9_223_372_036_854_775_807L; // ±9.2 E (64-bit signed)

// ── Floating-point types ──────────────────────────────────────────
float   f = 3.14f;            // ~7 decimal digits   (32-bit, IEEE 754)
double  d = 3.14159265358979; // ~15-16 digits       (64-bit, IEEE 754)
decimal m = 9.99m;            // 28-29 digits        (128-bit, base-10 exact)

// float/double are binary fractions — never use for money:
Console.WriteLine(0.1 + 0.2);    // 0.30000000000000004  ← rounding error
Console.WriteLine(0.1m + 0.2m);  // 0.3                  ← decimal is exact

// ── Boolean & char ────────────────────────────────────────────────
bool isActive  = true;
char letter    = 'A';         // single UTF-16 character

// ── String ────────────────────────────────────────────────────────
string name   = "Alice";      // reference type, immutable
string? alias = null;         // nullable reference type (requires <Nullable>enable</Nullable>)

// ── Type inference with var ───────────────────────────────────────
var count = 42;               // int  — inferred from literal (NOT dynamic!)
var price = 19.99m;           // decimal — suffix drives the type
var words = new[] { "hello", "world" };  // string[]

// ── Constants ─────────────────────────────────────────────────────
const double Pi         = 3.14159265358979;
const int    MaxRetries = 3;
// Pi = 3;  // compile error — compile-time constants are immutable`,
    },
    {
      label: 'Control Flow',
      language: 'csharp',
      code: `// ── if / else if / else ──────────────────────────────────────────
int score = 72;
if (score >= 90)      Console.WriteLine("A");
else if (score >= 75) Console.WriteLine("B");
else if (score >= 60) Console.WriteLine("C");
else                  Console.WriteLine("F");

// ── for loop ─────────────────────────────────────────────────────
for (int i = 0; i < 5; i++)
    Console.Write(i + " ");  // 0 1 2 3 4

// ── foreach (preferred for collections) ───────────────────────────
string[] fruits = ["apple", "banana", "cherry"];
foreach (string fruit in fruits)
    Console.WriteLine(fruit.ToUpper()); // APPLE BANANA CHERRY

// ── while / do-while ─────────────────────────────────────────────
int n = 1;
while (n <= 8) { Console.Write(n + " "); n *= 2; }  // 1 2 4 8

int rolls = 0;
do { rolls++; } while (rolls < 3);
Console.WriteLine(rolls);  // 3

// ── switch expression (C# 8+) ─────────────────────────────────────
static string Grade(int s) => s switch
{
    >= 90           => "A",
    >= 75           => "B",
    >= 60           => "C",
    >= 0 and < 60   => "F",
    _               => throw new ArgumentOutOfRangeException(nameof(s)),
};

// Pattern matching with type and property patterns
static string Describe(object obj) => obj switch
{
    int x when x < 0       => "negative",
    int x                  => \$"int: {x}",
    string { Length: 0 }   => "empty string",
    string s               => \$"string: {s}",
    null                   => "null",
    _                      => "something else",
};`,
    },
    {
      label: 'String Features',
      language: 'csharp',
      code: `// ── String interpolation ($"...") ────────────────────────────────
string first = "Alice";
int age = 30;
string greeting = \$"Hello, {first}! You are {age} years old.";

// Expressions and format specifiers inside {}
string fmt = \$"Price: {9.99m:C}";              // "Price: £9.99"
string pad = \$"{"left",-10}|{"right",10}";     // "left      |     right"

// ── Verbatim strings (@"...") ─────────────────────────────────────
// Backslashes are literal — ideal for file paths and regex patterns
string path  = @"C:\Users\Alice\Documents\file.txt";
string regex = @"^\d{3}-\d{4}$";

// ── Raw string literals (C# 11+) ──────────────────────────────────
string json = """
    {
        "name": "Alice",
        "age": 30
    }
    """;

// ── String methods ────────────────────────────────────────────────
string s = "  Hello, World!  ";
Console.WriteLine(s.Trim());                   // "Hello, World!"
Console.WriteLine(s.ToLower());                // "  hello, world!  "
Console.WriteLine(s.Replace("World", "C#"));   // "  Hello, C#!  "
Console.WriteLine(s.Contains("World"));        // True

string csv = "apple,banana,cherry";
string[] items = csv.Split(',');
string rejoined = string.Join(" | ", items);   // "apple | banana | cherry"

// ── StringBuilder (avoid + in loops) ─────────────────────────────
var sb = new System.Text.StringBuilder();
for (int i = 0; i < 1000; i++)
    sb.Append(i).Append(',');
string result = sb.ToString();  // one allocation, not 1000`,
    },
    {
      label: 'Boxing & Modern Program Structure',
      language: 'csharp',
      code: `// ── Boxing and unboxing ──────────────────────────────────────────
int value  = 42;
object box = value;         // boxing: int copied to heap wrapper
int   back = (int)box;      // unboxing: extracted with explicit cast

// Hidden boxing pitfalls
var list = new System.Collections.ArrayList();
list.Add(42);               // boxes every int — use List<int> instead

// Interface boxing trap (even for small structs!)
interface IGreet { string Hello(); }
struct Point : IGreet { public int X, Y; public string Hello() => \$"({X},{Y})"; }
IGreet g = new Point { X = 1, Y = 2 };  // boxes! Point is now on the heap

// ── Top-level statements (C# 9+) ──────────────────────────────────
// A complete valid C# 9+ program — no class, no Main():
//   using System;
//   Console.WriteLine("Hello, World!");
//   Greet(args[0]);
//
//   void Greet(string name) => Console.WriteLine(\$"Hi {name}");
//   record Person(string Name, int Age);  // types can still be declared below

// ── File-scoped namespaces (C# 10+) ───────────────────────────────
// Traditional (extra indentation):
// namespace MyApp { class Foo { } }

// File-scoped (cleaner):
// namespace MyApp;
// class Foo { }          // no extra brace level

// ── Global usings (C# 10+) ───────────────────────────────────────
// In a file like GlobalUsings.cs:
// global using System.Text;
// global using System.Collections.Generic;
// Now every file in the project has these — SDK projects add the most common ones.`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using double/float for monetary values',
      wrong: `decimal total = 0;
foreach (var item in cart)
    total += (double)item.Price;   // cast to double for "performance"`,
      right: `decimal total = 0;
foreach (var item in cart)
    total += item.Price;           // item.Price is decimal — keep it decimal`,
      explanation: 'double is a binary floating-point type that cannot represent 0.1 exactly. Summing monetary values in double produces rounding errors (0.1 + 0.2 = 0.30000000000000004). Always keep financial arithmetic in decimal end-to-end.',
    },
    {
      title: 'var with ambiguous numeric literals',
      wrong: `var price = 9.99;       // infers double — not decimal
var id    = 1000000000000;  // infers int? Actually compile error — too large for int`,
      right: `decimal price = 9.99m;  // explicit type + m suffix
long    id    = 1_000_000_000_000L; // explicit long + L suffix`,
      explanation: 'var infers the type from the literal suffix (or lack of one). 9.99 without m is double; a large integer without L overflows int. When the numeric type matters, declare it explicitly rather than relying on inference.',
    },
    {
      title: 'String concatenation inside a loop',
      wrong: `string result = "";
for (int i = 0; i < 10_000; i++)
    result += i + ",";   // creates a new string object on every iteration`,
      right: `var sb = new System.Text.StringBuilder();
for (int i = 0; i < 10_000; i++)
    sb.Append(i).Append(',');
string result = sb.ToString();`,
      explanation: 'string is immutable. Every += allocates a new string and copies both sides, giving O(n²) total characters written. StringBuilder maintains a resizable buffer and allocates exactly once at ToString() — orders of magnitude faster for large loops.',
    },
    {
      title: 'Confusing const and readonly',
      wrong: `// In Library.dll
public const string Version = "1.0.0";
// Consumer.dll bakes "1.0.0" into its IL at compile time.
// Updating Library.dll to "1.0.1" has NO effect unless Consumer.dll is recompiled.`,
      right: `public static readonly string Version = "1.0.0";
// Value read at runtime from Library.dll — consumers always see the current value.`,
      explanation: 'const values are inlined at the call site by the compiler. If a const in a referenced DLL changes, all callers must be recompiled to pick up the new value. Use static readonly for values that might change between releases.',
    },
    {
      title: 'Not using string.IsNullOrWhiteSpace',
      wrong: `if (input != null && input != "")
    Process(input);   // misses "   " (whitespace-only)`,
      right: `if (!string.IsNullOrWhiteSpace(input))
    Process(input);`,
      explanation: 'Whitespace-only strings are semantically empty in most business logic but pass != "" checks. string.IsNullOrWhiteSpace covers null, empty string, and strings containing only spaces/tabs/newlines in a single readable call.',
    },
    {
      title: 'Boxing a value type through an interface',
      wrong: `interface IArea { double Compute(); }
struct Circle : IArea { double R; public double Compute() => Math.PI * R * R; }

IArea shape = new Circle { R = 5 };  // BOXES — Circle is now on the heap
shape.Compute();                       // virtual dispatch through box`,
      right: `// Option 1: make Circle a class if it needs polymorphic dispatch
// Option 2: use generics to avoid boxing
static T UseArea<T>(T shape) where T : IArea => shape;
var c = new Circle { R = 5 };
UseArea(c).Compute();  // no box — JIT specialises for Circle`,
      explanation: 'Assigning a struct to an interface variable boxes the struct silently. The box is a separate heap object — mutations to it do not affect the original struct. Use generics constrained to the interface to avoid boxing when performance matters.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between <code>double</code> and <code>decimal</code> in C#?',
      options: [
        'double is slower; decimal is faster',
        'decimal is 64-bit; double is 128-bit',
        'double uses binary floating point (approximate); decimal uses base-10 (exact for currency)',
        'They are identical — just different names',
      ],
      answer: 2,
      explanation: '<code>double</code> is an IEEE 754 binary float — it cannot represent 0.1 exactly, leading to rounding surprises like 0.1 + 0.2 = 0.30000000000000004. <code>decimal</code> is a base-10 128-bit type designed for financial calculations. Always use <code>decimal</code> for money.',
    },
    {
      q: 'What type does <code>var count = 42;</code> produce?',
      options: [
        'dynamic — the type can change later',
        'object — the base type of everything',
        'int — statically inferred at compile time',
        'var — a special flexible type',
      ],
      answer: 2,
      explanation: '<code>var</code> is syntactic sugar for the inferred type. The compiler sees <code>42</code> (an <code>int</code> literal) and permanently locks <code>count</code> to <code>int</code>. You cannot later assign a <code>string</code> to it — it is fully statically typed, not dynamic.',
    },
    {
      q: 'Which statement about switch expressions (C# 8+) is true?',
      options: [
        'They require a break statement at the end of each arm',
        'They can only match on integer values',
        'They return a value and the compiler warns if not all inputs are covered',
        'They are slower than if/else chains at runtime',
      ],
      answer: 2,
      explanation: 'Switch expressions return a value directly (no <code>break</code> needed). The compiler performs exhaustiveness checking — if you forget a case and have no <code>_</code> discard, you get a compile-time warning. This makes them safer and more concise than traditional switch statements.',
    },
    {
      q: 'Why does <code>string</code> behave like a value type even though it is a reference type?',
      options: [
        'string is actually a value type — the documentation is wrong',
        'Strings are immutable, so sharing a reference is safe; operations always return new strings',
        'The CLR secretly copies strings on every assignment',
        'Strings live on the stack in modern .NET',
      ],
      answer: 1,
      explanation: '<code>string</code> is heap-allocated (a reference type), but because strings are immutable — you can never change characters in place — sharing references between variables is safe. Methods like <code>ToUpper()</code> return a new string; the original is unchanged. This gives value-type semantics without value-type copy cost.',
    },
    {
      q: 'What happens when you assign an <code>int</code> to an <code>object</code> variable?',
      options: [
        'A compile error — int cannot be assigned to object',
        'The int is boxed: copied to a heap-allocated wrapper object',
        'The int is automatically converted to string',
        'Nothing special — object variables already store integers natively',
      ],
      answer: 1,
      explanation: 'Boxing wraps the value-type value in a heap-allocated object. This allows value types to be used polymorphically (e.g. stored in a non-generic <code>ArrayList</code>), but at a cost: heap allocation, GC pressure, and an extra pointer dereference. Generic collections eliminate boxing.',
    },
    {
      q: 'What does <code>const</code> do that <code>static readonly</code> does not?',
      options: [
        'const can be used for any type; static readonly only works for strings',
        'const values are baked into the caller\'s IL at compile time; readonly is read at runtime',
        'const fields can be changed at runtime; readonly cannot',
        'They are identical — const is just shorthand for static readonly',
      ],
      answer: 1,
      explanation: 'The compiler inlines <code>const</code> values at every call site. If the constant lives in a DLL and you change its value, all callers must be recompiled to see the new value — they hold a copy, not a reference. <code>static readonly</code> is read from the DLL at runtime, so callers always see the current value without recompilation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use int vs long vs decimal?',
      a: 'Use <code>int</code> for general whole-number counting and indexing — it is the default and fastest on 32/64-bit CPUs. Use <code>long</code> when values can exceed ±2.1 billion (large database IDs, file sizes in bytes, Unix timestamps). Use <code>decimal</code> for any monetary or financial value — it is base-10 exact and avoids the binary rounding surprises of <code>double</code>.',
    },
    {
      q: 'What is the difference between const and readonly?',
      a: '<code>const</code> is a compile-time constant — the value is baked directly into the IL at the call site. It must be a primitive or string and can never change. <code>readonly</code> is a runtime constant — assigned once in a constructor or at declaration, but computed at runtime. The key practical difference: if a <code>const</code> in a library DLL changes, consumers must be recompiled; a <code>static readonly</code> value is read fresh from the DLL at startup.',
    },
    {
      q: 'Is var bad practice? When should I avoid it?',
      a: '<code>var</code> is perfectly fine when the type is obvious from the right-hand side: <code>var list = new List&lt;int&gt;()</code>. Avoid it when the right-hand side is an opaque method call: <code>var result = Process(data);</code> — the reader must look up the method signature. Also avoid for numeric literals where type matters: write <code>decimal price = 9.99m;</code>, not <code>var price = 9.99m;</code>, so the intent is unambiguous.',
    },
    {
      q: 'Why does string concatenation with + in a loop perform poorly?',
      a: 'Because <code>string</code> is immutable, every <code>+=</code> creates a new string object and copies both sides into it. In a loop of N iterations, you allocate strings of total length 0+1+2+…+(N-1) = O(N²) characters. Use <code>StringBuilder</code> for building strings in a loop — it maintains a resizable internal buffer and allocates only once at <code>ToString()</code>. For small, one-time concatenations, <code>+</code> or string interpolation is fine.',
    },
    {
      q: 'What is boxing and when is it a real performance concern?',
      a: 'Boxing allocates a heap object to wrap a value type so it can be treated as <code>object</code> or an interface. The cost is a heap allocation (GC pressure) plus an extra pointer dereference on access. It becomes a concern in tight loops — e.g. storing thousands of <code>int</code>s in a non-generic <code>ArrayList</code>. The fix is almost always to use generic collections (<code>List&lt;int&gt;</code>) or generic constraints (<code>where T : IComparable&lt;T&gt;</code>). One subtle trap: casting a <code>struct</code> to an interface it implements boxes it silently.',
    },
    {
      q: 'What is the difference between string.Empty, "", and null?',
      a: '<code>""</code> and <code>string.Empty</code> are identical — both are empty strings (zero-length, non-null). <code>string.Empty</code> is slightly preferred in enterprise code for readability. <code>null</code> means the variable has no string at all — calling any method on it throws <code>NullReferenceException</code>. Use <code>string.IsNullOrEmpty(s)</code> to check for both <code>null</code> and <code>""</code>, or <code>string.IsNullOrWhiteSpace(s)</code> to also catch whitespace-only strings.',
    },
  ];

  challenge: Challenge = {
    title: 'Word Frequency Counter',
    description: `Write a method that takes a string sentence and returns a Dictionary<string, int> mapping each unique word (case-insensitive) to how many times it appears.

Requirements:
1. Split the sentence on spaces using string.Split()
2. Normalise each word to lowercase and strip punctuation (trim .,!? characters)
3. Use foreach to iterate the words
4. Skip empty strings (from double spaces)
5. Build and return a Dictionary<string, int> with the counts`,
    language: 'csharp',
    hints: [
      'Use sentence.Split(\' \') to get an array of words',
      'Use word.ToLower().Trim(\'.\', \',\', \'!\', \'?\') to normalise',
      'Check dict.ContainsKey(word) before incrementing, or use dict.TryGetValue',
      'Skip empty strings that appear from double spaces: if (string.IsNullOrWhiteSpace(word)) continue;',
    ],
    starterCode: `public Dictionary<string, int> WordFrequency(string sentence)
{
    var counts = new Dictionary<string, int>();

    // TODO: split, normalise, count each word

    return counts;
}

// Expected usage:
// WordFrequency("the cat sat on the mat the cat")
// => { "the": 3, "cat": 2, "sat": 1, "on": 1, "mat": 1 }`,
    solution: `public Dictionary<string, int> WordFrequency(string sentence)
{
    var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    foreach (string raw in sentence.Split(' '))
    {
        string word = raw.Trim('.', ',', '!', '?', ';', ':').ToLower();

        if (string.IsNullOrWhiteSpace(word))
            continue;

        if (counts.TryGetValue(word, out int existing))
            counts[word] = existing + 1;
        else
            counts[word] = 1;
    }

    return counts;
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'C# is statically typed — every variable\'s type is fixed at compile time. Value types copy data on assignment; reference types share a pointer to heap-allocated data.',
    mustKnow: [
      'Use <code>decimal</code> (not <code>double</code>) for any monetary arithmetic — double is a binary float and cannot represent 0.1 exactly.',
      '<code>var</code> is statically typed, not dynamic — the compiler infers the type once and locks it permanently.',
      'Value types (<code>int</code>, <code>struct</code>) copy on assignment; reference types (<code>class</code>, <code>string</code>) share a pointer.',
      'Boxing converts a value type to <code>object</code>/interface by copying it to the heap — a hidden cost in non-generic APIs.',
      '<code>const</code> is inlined at the call site; <code>static readonly</code> is read at runtime — changing a <code>const</code> in a DLL requires recompiling all callers.',
      'Switch expressions (C# 8+) return a value and are exhaustiveness-checked by the compiler — safer than switch statements.',
      'Use <code>StringBuilder</code> for string building in loops — <code>+</code> is O(n²) because every concatenation allocates a new immutable string.',
    ],
    interviewFocus: [
      'Why use decimal over double for money? (binary IEEE 754 vs base-10 exact representation)',
      'What is boxing and when does it happen implicitly? (struct assigned to object/interface, ArrayList, format strings)',
      'What\'s the difference between const and readonly — and why does it matter for DLLs? (compile-time inlining vs runtime read)',
      'Why does string behave like a value type even though it\'s a reference type? (immutability makes sharing safe)',
      'What does var actually produce? (statically typed, not dynamic — the type is fixed at the declaration)',
    ],
  };
}
