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
  selector: 'app-csharp-basics',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './basics.html',
  styleUrl: './basics.scss',
})
export class CsharpBasics {

  quickRef: QuickRefItem[] = [
    { name: 'int',               type: 'type',    desc: '32-bit signed integer. Range: –2,147,483,648 to 2,147,483,647', since: 'C# 1' },
    { name: 'string',            type: 'type',    desc: 'Immutable sequence of UTF-16 characters. Reference type on the heap', since: 'C# 1' },
    { name: 'bool',              type: 'type',    desc: 'Boolean value: true or false only', since: 'C# 1' },
    { name: 'decimal',           type: 'type',    desc: '128-bit precise decimal for financial calculations. Use the m suffix: 9.99m', since: 'C# 1' },
    { name: 'var',               type: 'keyword', desc: 'Implicitly typed local variable — compiler infers the type from the right-hand side', since: 'C# 3' },
    { name: 'const',             type: 'keyword', desc: 'Compile-time constant — value is inlined by the compiler, cannot be changed', since: 'C# 1' },
    { name: 'for',               type: 'syntax',  desc: 'Classic index-based loop: for (int i = 0; i < n; i++)', since: 'C# 1' },
    { name: 'foreach',           type: 'syntax',  desc: 'Iterate over any IEnumerable<T> without managing indices', since: 'C# 1' },
    { name: 'while',             type: 'syntax',  desc: 'Loop while a condition is true. Condition evaluated before each iteration', since: 'C# 1' },
    { name: 'if / else',         type: 'syntax',  desc: 'Conditional branching. Supports else if chains for multiple conditions', since: 'C# 1' },
    { name: 'switch expression', type: 'syntax',  desc: 'C# 8+ expression that returns a value; supports relational and property patterns', since: 'C# 8' },
    { name: '$"..."',            type: 'operator', desc: 'String interpolation — embed expressions directly in string literals', since: 'C# 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'C# is statically typed',
      points: [
        'Every variable has a type that is known at compile time — the compiler rejects type mismatches before your program runs.',
        'This means bugs like passing a <code>string</code> where an <code>int</code> is expected are caught instantly, not at midnight in production.',
        'Even <code>var</code> is statically typed — the type is inferred once and fixed. There is no runtime type-switching like in JavaScript.',
        'Nullable reference types (<code>string?</code>) extend this: the compiler can warn you about potential null dereferences.',
      ],
    },
    {
      heading: 'Value types vs reference types',
      points: [
        '<strong>Value types</strong> (<code>int</code>, <code>bool</code>, <code>double</code>, <code>struct</code>, <code>enum</code>) store their data directly on the stack. Assigning copies the value.',
        '<strong>Reference types</strong> (<code>string</code>, <code>class</code>, arrays) store a pointer on the stack; the actual data lives on the heap.',
        'Because <code>string</code> is a reference type, <code>string a = b</code> makes both variables point to the same object — but strings are immutable so mutation is never a surprise.',
        'Copying a value type is cheap and predictable; passing a large <code>struct</code> by value makes a full copy, so prefer <code>ref</code> or a <code>class</code> for large data.',
      ],
    },
    {
      heading: 'Type inference with var',
      points: [
        '<code>var</code> lets the compiler determine the type from the right-hand side of an assignment. The variable is still strongly typed — it is not dynamic.',
        'Use <code>var</code> when the type is obvious from the right-hand side: <code>var list = new List&lt;string&gt;()</code> — no need to repeat the type.',
        'Prefer explicit types when the right-hand side is a method call or cast and the type is not immediately clear: <code>User user = GetUser(id);</code>.',
        '<code>var</code> cannot be used for fields, method parameters, or return types — only for local variables.',
      ],
    },
    {
      heading: 'Modern switch expressions (C# 8+)',
      points: [
        'A <code>switch</code> expression evaluates a value against a list of patterns and returns a result — no <code>break</code>, no fall-through, no ceremony.',
        'The compiler enforces exhaustiveness: if not all possible inputs are handled (and no <code>_</code> discard exists), you get a warning.',
        'Patterns include relational (<code>&lt; 0</code>), property (<code>{ Age: &gt; 18 }</code>), type (<code>is Circle c</code>), and combined with <code>and</code> / <code>or</code>.',
        'Switch expressions replace long <code>if/else if</code> chains with something far more readable and less prone to missing cases.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Built-in Types',
      language: 'csharp',
      code: `// ── Integer types ────────────────────────────────────────────────
byte   b  = 255;          // 0–255      (8-bit unsigned)
short  s  = 32_767;       // ±32 k      (16-bit signed) — underscores for readability
int    i  = 2_147_483_647;// ±2.1 B     (32-bit signed) — most common integer type
long   l  = 9_223_372_036_854_775_807L; // ±9.2 E (64-bit signed)

// ── Floating-point types ──────────────────────────────────────────
float  f  = 3.14f;        // ~7 decimal digits of precision  (32-bit)
double d  = 3.14159265358979; // ~15-16 digits of precision  (64-bit)
decimal m = 9.99m;        // 28-29 digits — use for money!   (128-bit)

// float/double are IEEE 754 binary fractions — avoid for currency:
Console.WriteLine(0.1 + 0.2);   // 0.30000000000000004  ← binary rounding
Console.WriteLine(0.1m + 0.2m); // 0.3                  ← decimal is exact

// ── Boolean ───────────────────────────────────────────────────────
bool isActive  = true;
bool isDeleted = false;
bool isVisible = isActive && !isDeleted; // true

// ── Character ─────────────────────────────────────────────────────
char letter = 'A';          // single Unicode character (UTF-16)
char emoji  = '\\u2764';    // ❤  — any Unicode code point

// ── String ────────────────────────────────────────────────────────
string name   = "Alice";    // reference type, immutable
string empty  = string.Empty;
string? alias = null;       // nullable reference type (requires <Nullable>enable</Nullable>)

// ── Type inference with var ───────────────────────────────────────
var count  = 42;            // int  — inferred from literal
var price  = 19.99m;        // decimal
var words  = new[] { "hello", "world" }; // string[]

// ── Constants ─────────────────────────────────────────────────────
const double Pi        = 3.14159265358979;
const int    MaxRetries = 3;
// Pi = 3;  // compile error — constants are immutable`,
    },
    {
      label: 'Control Flow',
      language: 'csharp',
      code: `// ── if / else if / else ──────────────────────────────────────────
int score = 72;

if (score >= 90)
    Console.WriteLine("A");
else if (score >= 75)
    Console.WriteLine("B");
else if (score >= 60)
    Console.WriteLine("C");
else
    Console.WriteLine("F");

// ── for loop ─────────────────────────────────────────────────────
for (int i = 0; i < 5; i++)
    Console.Write(i + " ");   // 0 1 2 3 4

// Reverse loop
for (int i = 4; i >= 0; i--)
    Console.Write(i + " ");   // 4 3 2 1 0

// ── foreach loop (preferred for collections) ──────────────────────
string[] fruits = ["apple", "banana", "cherry"];
foreach (string fruit in fruits)
    Console.WriteLine(fruit.ToUpper()); // APPLE BANANA CHERRY

// ── while loop ────────────────────────────────────────────────────
int n = 1;
while (n <= 8)
{
    Console.Write(n + " ");  // 1 2 4 8
    n *= 2;
}

// ── do-while (body runs at least once) ───────────────────────────
int rolls = 0;
do
{
    rolls++;
} while (rolls < 3);
Console.WriteLine(rolls);  // 3

// ── switch expression (C# 8+) ─────────────────────────────────────
static string Grade(int s) => s switch
{
    >= 90            => "A",
    >= 75            => "B",
    >= 60            => "C",
    >= 0 and < 60    => "F",
    _                => throw new ArgumentOutOfRangeException(nameof(s)),
};

Console.WriteLine(Grade(82));  // B
Console.WriteLine(Grade(55));  // F

// Pattern matching with type and property patterns
static string Describe(object obj) => obj switch
{
    int n when n < 0    => "negative integer",
    int n               => $"positive integer: {n}",
    string { Length: 0 } => "empty string",
    string s            => $"string: {s}",
    null                => "null",
    _                   => "something else",
};`,
    },
    {
      label: 'String Features',
      language: 'csharp',
      code: `// ── String interpolation ($"...") ────────────────────────────────
string first = "Alice";
int age = 30;
string greeting = $"Hello, {first}! You are {age} years old.";
// Hello, Alice! You are 30 years old.

// Expressions inside interpolation
string result = $"2 + 2 = {2 + 2}";                 // "2 + 2 = 4"
string upper  = $"Name: {first.ToUpper()}";          // "Name: ALICE"
string fmt    = $"Price: {9.99m:C}";                 // "Price: £9.99" (locale-dependent)
string pad    = $"{"left",-10}|{"right",10}";        // "left      |     right"

// ── Verbatim strings (@"...") ─────────────────────────────────────
// Backslashes are literal — great for file paths and regex
string path  = @"C:\\Users\\Alice\\Documents\\file.txt";
string regex = @"^\\d{3}-\\d{4}$";

// Multi-line verbatim string
string address = @"123 Main St
Springfield
IL 62701";

// ── Raw string literals (C# 11+) ──────────────────────────────────
// Delimited by three or more quotes — no escaping needed at all
string json = """
    {
        "name": "Alice",
        "age": 30
    }
    """;

// ── String methods ────────────────────────────────────────────────
string sentence = "  Hello, World!  ";

Console.WriteLine(sentence.Trim());               // "Hello, World!"
Console.WriteLine(sentence.TrimStart());          // "Hello, World!  "
Console.WriteLine(sentence.ToLower());            // "  hello, world!  "
Console.WriteLine(sentence.Contains("World"));   // True
Console.WriteLine(sentence.Replace("World", "C#")); // "  Hello, C#!  "
Console.WriteLine(sentence.Trim().StartsWith("Hello")); // True

// Split and join
string csv = "apple,banana,cherry,date";
string[] items = csv.Split(',');
// items = ["apple", "banana", "cherry", "date"]

string rejoined = string.Join(" | ", items);
// "apple | banana | cherry | date"

// IndexOf / Substring
string url = "https://example.com/path";
int start  = url.IndexOf("//") + 2;    // 8
string host = url[start..url.IndexOf('/', start)]; // "example.com"

// String.IsNullOrWhiteSpace — common guard
string? input = "   ";
if (string.IsNullOrWhiteSpace(input))
    Console.WriteLine("Input is blank"); // ← runs`,
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
      explanation: '<code>double</code> is an IEEE 754 binary float — it cannot represent 0.1 exactly, leading to rounding surprises. <code>decimal</code> is a base-10 128-bit type designed for financial calculations where exactness matters. Always use <code>decimal</code> for money.',
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
      explanation: '<code>var</code> is syntactic sugar for the inferred type. The compiler sees <code>42</code> (an <code>int</code> literal) and locks <code>count</code> to <code>int</code>. You cannot later assign a <code>string</code> to it — it is fully statically typed.',
    },
    {
      q: 'Which statement about switch expressions (C# 8+) is true?',
      options: [
        'They require a break statement at the end of each arm',
        'They can only match on integer values',
        'They return a value and the compiler warns if not all inputs are covered',
        'They are slower than if/else chains',
      ],
      answer: 2,
      explanation: 'Switch expressions return a value directly (no <code>break</code> needed). The compiler performs exhaustiveness checking — if you forget a case and have no <code>_</code> discard, you get a compile-time warning. This makes them safer and more concise than traditional switch statements.',
    },
    {
      q: 'Why is <code>string</code> a reference type but behaves like a value type?',
      options: [
        'It is actually a value type — the documentation is wrong',
        'Strings are immutable, so sharing a reference is safe; operations always produce new strings',
        'The CLR secretly copies strings on every assignment',
        'Strings live on the stack in modern .NET',
      ],
      answer: 1,
      explanation: '<code>string</code> is a heap-allocated reference type, but because strings are immutable (you can never change the characters in place), sharing references between variables is safe. Methods like <code>ToUpper()</code> return a new string — the original is unchanged. This gives value-type semantics without value-type cost.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use int vs long vs decimal?',
      a: 'Use <code>int</code> for general whole-number counting and indexing (it\'s the default and fastest on most CPUs). Use <code>long</code> when values can exceed ±2.1 billion (IDs from large databases, file sizes, timestamps). Use <code>decimal</code> for any monetary or financial value — it\'s base-10 exact and avoids the binary rounding surprises of <code>double</code>.',
    },
    {
      q: 'What is the difference between const and readonly?',
      a: '<code>const</code> is a compile-time constant — the value is baked directly into the IL bytecode. It must be a primitive or string and cannot change. <code>readonly</code> is a runtime constant — assigned once (in a constructor or at declaration) but computed at runtime. Use <code>const</code> for fixed values like <code>MaxRetries = 3</code>; use <code>readonly</code> for values computed at startup or injected via DI.',
    },
    {
      q: 'Is var bad practice? When should I avoid it?',
      a: '<code>var</code> is perfectly fine — the C# team and most style guides endorse it when the type is obvious from the right-hand side: <code>var list = new List&lt;int&gt;()</code>. Avoid it when the type is not clear: <code>var result = Process(data);</code> — here an explicit return type (<code>ProcessedData result = Process(data);</code>) is more readable. Never use it for numeric literals where the type matters: write <code>decimal price = 9.99m;</code> not <code>var price = 9.99m;</code>.',
    },
    {
      q: 'Why does string concatenation with + in a loop perform poorly?',
      a: 'Because <code>string</code> is immutable, every <code>+</code> creates a new string object and copies both sides into it. In a loop of N iterations you create O(N²) characters of garbage. Use <code>StringBuilder</code> for building strings in a loop: it maintains an internal buffer and only allocates at the end. For small, fixed concatenations at one site, <code>+</code> or string interpolation is fine.',
    },
  ];

  challenge: Challenge = {
    title: 'Word Frequency Counter',
    description: `Write a method that takes a string sentence and returns a Dictionary<string, int> mapping each unique word (case-insensitive) to how many times it appears.

Requirements:
1. Split the sentence on spaces using string.Split()
2. Normalise each word to lowercase using .ToLower()
3. Strip punctuation from each word (trim .,!? characters)
4. Use foreach to iterate the words
5. Build and return a Dictionary<string, int> with the counts`,
    language: 'csharp',
    hints: [
      'Use sentence.Split(\' \') to get an array of words',
      'Use word.ToLower().Trim(\'.\', \',\', \'!\', \'?\') to normalise',
      'Check dict.ContainsKey(word) before incrementing, or use dict.TryGetValue',
      'Skip empty strings that can appear from double spaces',
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
}
