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
  selector: 'app-csharp-methods',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './methods.html',
  styleUrl: './methods.scss',
})
export class CsharpMethods {

  quickRef: QuickRefItem[] = [
    { name: 'void',             type: 'keyword', desc: 'Return type meaning the method does not return a value', since: 'C# 1' },
    { name: 'return',           type: 'keyword', desc: 'Exits the method and optionally passes a value back to the caller', since: 'C# 1' },
    { name: 'params',           type: 'keyword', desc: 'Allows passing a variable number of arguments as an array: params int[] values', since: 'C# 1' },
    { name: 'ref',              type: 'keyword', desc: 'Passes an argument by reference — caller variable is read and written by the method', since: 'C# 1' },
    { name: 'out',              type: 'keyword', desc: 'Passes an argument the method must assign before returning — used for multiple return values', since: 'C# 1' },
    { name: 'in',               type: 'keyword', desc: 'Passes a value type by reference but read-only — avoids copying large structs', since: 'C# 7.2' },
    { name: 'optional params',  type: 'syntax',  desc: 'Give a parameter a default value: void Log(string msg, bool debug = false)', since: 'C# 4' },
    { name: 'named args',       type: 'syntax',  desc: 'Specify arguments by name: Log(msg: "hi", debug: true)', since: 'C# 4' },
    { name: '=>',               type: 'syntax',  desc: 'Expression-bodied member — single-expression shorthand: int Double(int x) => x * 2;', since: 'C# 6' },
    { name: 'local function',   type: 'syntax',  desc: 'A function declared inside another method — has access to outer variables (closure)', since: 'C# 7' },
    { name: 'static local',     type: 'syntax',  desc: 'Local function with static keyword — cannot capture outer variables, slightly faster', since: 'C# 8' },
    { name: 'overloading',      type: 'syntax',  desc: 'Multiple methods with the same name but different parameter lists — resolved at compile time', since: 'C# 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Method signatures and overloading',
      points: [
        'A method signature is the combination of its name and parameter types (including their order). The return type is <strong>not</strong> part of the signature — two methods that differ only by return type will not compile.',
        'Overloading lets you define multiple methods with the same name but different parameter lists. The compiler picks the best match at the call site based on the argument types.',
        'Overloads are resolved entirely at compile time — there is no runtime dispatch cost for overloaded calls (unlike virtual methods).',
        'Use overloading when the same logical operation applies to different input types (e.g. <code>Add(int, int)</code> and <code>Add(double, double)</code>). Avoid using it to hide unrelated behaviour behind one name — that is surprising and hard to maintain.',
        'Optional parameters can reduce the need for overloads but are less friendly to older consumers, reflection-based frameworks (like some serialisers), and method groups used as delegates.',
      ],
    },
    {
      heading: 'ref / out / in parameter modifiers',
      points: [
        '<code>ref</code> passes a variable by reference — the method can both read and write the caller\'s variable. The variable must be initialised before the call, and both declaration and call site must use the <code>ref</code> keyword.',
        '<code>out</code> is like <code>ref</code> but the caller does not need to initialise the variable. The method is required by the compiler to assign it in every code path before returning. Ideal for "try-parse" patterns.',
        '<code>in</code> passes a value type by reference but prevents mutation inside the method. This avoids copying large structs (e.g. <code>Matrix4x4</code>) without the risk of accidental modification.',
        'All three modifiers must appear at both the declaration and the call site — this makes it immediately visible at the call site that the variable may change (<code>ref</code>/<code>out</code>) or is passed by reference (<code>in</code>).',
        'Modern alternative: use tuples for "multiple return values" instead of <code>out</code>: <code>(bool ok, double result) TryDivide(int a, int b)</code> — more readable and works with async methods (which do not support <code>out</code>).',
      ],
    },
    {
      heading: 'Optional and named arguments',
      points: [
        'A parameter with a default value becomes optional: callers can omit it and the compiler inserts the default. Optional parameters must appear after all required parameters in the signature.',
        'Named arguments let you specify which parameter you are providing by name (<code>paramName: value</code>). This lets you skip optional parameters in the middle of a list and makes call sites self-documenting.',
        'Named arguments can be passed in any order as long as all required positional parameters are satisfied first. Mixing named and positional is allowed: provide positionals first, then named ones.',
        'Avoid too many optional parameters on a single method — more than three or four signals the need for a config/options object or a builder pattern. Long optional-parameter lists are hard to read and error-prone.',
        'Important: default values for optional parameters are baked into the caller\'s IL at compile time (like <code>const</code>). If the library changes a default value, callers must recompile to see the new default.',
      ],
    },
    {
      heading: 'Local functions and closures',
      points: [
        'A local function is a method declared inside another method. It can only be called within the enclosing method. It can capture the outer method\'s variables, forming a closure.',
        'Local functions are better than private helper methods when the helper is only relevant to one method — keeping the logic co-located and hiding the implementation from the rest of the class API.',
        'Marking a local function <code>static</code> prevents it from capturing any outer variables. This makes the intent explicit (the function is self-contained) and avoids a hidden closure object allocation.',
        'Local functions support <code>ref</code>/<code>out</code>/<code>in</code> parameters and can be recursive — advantages that lambdas do not have without workarounds.',
        'Expression-bodied methods (<code>=></code>) eliminate braces and the <code>return</code> keyword for single-expression implementations. They work for methods, properties, constructors, and destructors — any member that fits in one expression.',
      ],
    },
    {
      heading: 'Overload resolution rules',
      points: [
        'The compiler ranks overload candidates by "better function member" rules: an exact type match beats implicit conversions; fewer required conversions beats more; more specific types beat more general ones.',
        'Example: given <code>Print(int)</code> and <code>Print(double)</code>, calling <code>Print(1)</code> picks <code>int</code> (exact match); calling <code>Print(1.0)</code> picks <code>double</code> (exact match); calling <code>Print(1L)</code> (long) picks <code>double</code> (long→double is a widening conversion, no overload for long).',
        '<code>params</code> overloads lose to non-<code>params</code> overloads: <code>Sum(int, int)</code> beats <code>Sum(params int[])</code> when called with two arguments.',
        'Ambiguity errors occur when two overloads are equally applicable. Example: <code>void F(int, double)</code> and <code>void F(double, int)</code> — calling <code>F(1, 1)</code> is ambiguous because neither is strictly better.',
        'Named and optional arguments affect overload resolution: a candidate that does not require an argument to be omitted is preferred over one that does, all else being equal.',
      ],
    },
    {
      heading: 'ref on reference types — a common misconception',
      points: [
        'Reference types (classes, arrays) already pass a copy of the reference (pointer) to methods. The method can mutate the object\'s contents through that reference without any keyword — but it cannot make the caller\'s variable point to a different object.',
        'To reassign the caller\'s variable itself (make it point to a different object), you need <code>ref</code>. Without <code>ref</code>: <code>void Replace(List&lt;int&gt; list) { list = new List&lt;int&gt;(); }</code> — the caller\'s <code>list</code> is unchanged after the call.',
        'With <code>ref</code>: <code>void Replace(ref List&lt;int&gt; list) { list = new List&lt;int&gt;(); }</code> — the caller\'s variable now points to the new list.',
        'This distinction trips up developers coming from languages where all reference-type arguments are always passed by reference. In C#, without <code>ref</code>, only the object\'s contents can change, not which object the variable refers to.',
        'Modern alternative: return the new value from the method rather than using <code>ref</code> — cleaner, works with async, and is immediately obvious at the call site.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basics & Overloading',
      language: 'csharp',
      code: `// ── Simple methods ───────────────────────────────────────────────
static void Greet(string name) => Console.WriteLine(\$"Hello, {name}!");
static int  Add(int a, int b)  => a + b;

Greet("Alice");            // Hello, Alice!
Console.WriteLine(Add(3, 4)); // 7

// ── Method overloading ────────────────────────────────────────────
static int    Add(int a, int b)        => a + b;
static double Add(double a, double b)  => a + b;
static int    Add(params int[] values) { int t = 0; foreach (int v in values) t += v; return t; }

Console.WriteLine(Add(1, 2));      // int overload  → 3
Console.WriteLine(Add(1.5, 2.5)); // double overload → 4.0
Console.WriteLine(Add(1, 2, 3));  // params overload → 6

// ── Overload resolution examples ─────────────────────────────────
// Print(int) wins over Print(double) for Print(1) — exact match
// Print(double) wins for Print(1.0) — exact match
// Print(1L) picks Print(double) — long→double widening, no long overload

// Ambiguity: F(int,double) vs F(double,int) with F(1,1) → compiler error
// static void F(int x, double y) { }
// static void F(double x, int y) { }
// F(1, 1);  // CS0121: ambiguous`,
    },
    {
      label: 'ref / out / in params',
      language: 'csharp',
      code: `// ── ref: read AND write the caller's variable ────────────────────
static void Increment(ref int value, int by = 1) => value += by;

int counter = 10;
Increment(ref counter);      // counter = 11
Increment(ref counter, 5);   // counter = 16
Console.WriteLine(counter);  // 16

// ref on reference type — reassigning the variable itself
static void ReplaceList(ref List<int> list) => list = new List<int> { 99 };

var items = new List<int> { 1, 2, 3 };
ReplaceList(ref items);
Console.WriteLine(items[0]);  // 99 — caller's variable now points to the new list

// ── out: method MUST assign before returning ──────────────────────
static bool TryDivide(int a, int b, out double result)
{
    if (b == 0) { result = 0; return false; }  // must assign result even here
    result = (double)a / b;
    return true;
}

if (TryDivide(10, 3, out double q))
    Console.WriteLine(\$"10 / 3 = {q:F4}");    // 3.3333

// Modern alternative: use a tuple
static (bool ok, double result) TryDiv(int a, int b)
    => b == 0 ? (false, 0) : (true, (double)a / b);

var (ok, val) = TryDiv(7, 2);
Console.WriteLine(\$"ok={ok}, val={val}");    // ok=True, val=3.5

// ── in: read-only reference for large structs ────────────────────
readonly struct BigPoint { public double X, Y, Z, W; }

static double Magnitude(in BigPoint p)   // no copy of the 32-byte struct
    => Math.Sqrt(p.X*p.X + p.Y*p.Y + p.Z*p.Z + p.W*p.W);

// p.X = 1; // compile error — in prevents mutation`,
    },
    {
      label: 'Optional & Named Args',
      language: 'csharp',
      code: `// ── Optional parameters ──────────────────────────────────────────
static string FormatLog(
    string message,
    string level      = "INFO",
    bool   timestamp  = true,
    string separator  = " | ")
{
    string prefix = timestamp ? DateTime.Now.ToString("HH:mm:ss") + separator : "";
    return \$"[{level}] {prefix}{message}";
}

// All defaults used:
Console.WriteLine(FormatLog("Server started"));
// Override one in the middle with a named argument:
Console.WriteLine(FormatLog("Disk full", level: "WARN"));
// Skip to a later optional param:
Console.WriteLine(FormatLog("Debug info", timestamp: false));

// ── Named arguments ──────────────────────────────────────────────
static void CreateUser(string firstName, string lastName, int age, bool isAdmin = false)
    => Console.WriteLine(\$"{firstName} {lastName}, age {age}, admin: {isAdmin}");

// Self-documenting call:
CreateUser(firstName: "Jane", lastName: "Doe", age: 28, isAdmin: true);

// ── Default value baking warning ─────────────────────────────────
// public class Config { public static void Run(int timeout = 30) { } }
// If the library changes timeout to 60, callers compiled against the old
// library still pass 30 — they baked the old default into their IL.
// Use const fields or options objects for values that may evolve.`,
    },
    {
      label: 'Expression-bodied & Local Functions',
      language: 'csharp',
      code: `// ── Expression-bodied members ────────────────────────────────────
static int    Square(int x)           => x * x;
static string Shout(string s)         => s.ToUpper() + "!";
static bool   IsEven(int n)           => n % 2 == 0;
static double Avg(double a, double b) => (a + b) / 2.0;

Console.WriteLine(Square(7));   // 49
Console.WriteLine(Shout("hi")); // HI!

// ── Local functions ───────────────────────────────────────────────
static long Factorial(int n)
{
    if (n < 0) throw new ArgumentException("n must be non-negative");
    return Compute(n);

    long Compute(int x) => x <= 1 ? 1 : x * Compute(x - 1);  // recursive local
}

Console.WriteLine(Factorial(10));  // 3628800

// ── Closure — local function capturing outer variable ─────────────
static Func<int> MakeCounter(int start = 0)
{
    int count = start;         // captured by the local function

    return Increment;

    int Increment() => count++;  // mutates count in the closure
}

var counter = MakeCounter(10);
Console.WriteLine(counter()); // 10
Console.WriteLine(counter()); // 11

// ── Static local — no capture, no closure allocation ─────────────
static double HypotenuseFast(double a, double b)
{
    return Calc(a, b);

    static double Calc(double x, double y)  // cannot capture a, b
        => Math.Sqrt(x * x + y * y);
}

Console.WriteLine(HypotenuseFast(3, 4));  // 5`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using ref on a reference type expecting object-level protection',
      wrong: `// Wrong mental model: thinking ref prevents the object from changing
static void Clear(ref List<int> list) { list.Clear(); }
// The caller's list contents ARE changed — ref is not needed here`,
      right: `// Without ref, methods can still mutate the object's contents
static void Clear(List<int> list) { list.Clear(); }
// Use ref only when you need to reassign the caller's variable to a new object`,
      explanation: 'Reference type arguments already pass the reference (pointer) by value. The method can freely mutate the object through that pointer without ref. ref is only needed when the method needs to make the caller\'s variable point to a completely different object.',
    },
    {
      title: 'Forgetting to assign the out parameter in an error branch',
      wrong: `static bool TryParse(string s, out int result)
{
    if (s == null) return false;  // compile error: result not assigned
    result = int.Parse(s);
    return true;
}`,
      right: `static bool TryParse(string s, out int result)
{
    if (s == null) { result = 0; return false; }  // must assign result here too
    result = int.Parse(s);
    return true;
}`,
      explanation: 'The compiler enforces that out parameters are assigned in every code path before the method returns. Forgetting to assign in an early-return branch is a compile error. Convention: set out to its default value (0, null, etc.) in the failure path.',
    },
    {
      title: 'Using params object[] causing boxing for value types',
      wrong: `static void Log(string msg, params object[] args)
{
    Console.WriteLine(msg, args);  // every int/bool passed as object is boxed
}
Log("Value: {0}", 42);   // 42 is boxed to object`,
      right: `// Use string interpolation or typed overloads to avoid boxing
static void Log(string msg) => Console.WriteLine(msg);
Log(\$"Value: {42}");   // no boxing — interpolation uses ToString()`,
      explanation: 'params object[] is a common pattern inherited from Console.WriteLine, but every value-type argument (int, bool, struct) is silently boxed to object. In hot paths this causes GC pressure. Prefer string interpolation, generic overloads, or ReadOnlySpan<object> (C# 10+).',
    },
    {
      title: 'Too many optional parameters instead of an options object',
      wrong: `static void SendEmail(string to, string subject, string body = "",
    bool html = false, int priority = 0, bool trackOpens = false,
    string replyTo = "", int retries = 3) { }`,
      right: `public record EmailOptions(
    string Body = "", bool Html = false, int Priority = 0,
    bool TrackOpens = false, string ReplyTo = "", int Retries = 3);

static void SendEmail(string to, string subject, EmailOptions? opts = null) { }
// Call: SendEmail("a@b.com", "Hi", new EmailOptions(Html: true, Priority: 1));`,
      explanation: 'More than 3-4 optional parameters signals that the method is doing too much or the options deserve their own type. An options record/class is discoverable via IntelliSense, adds no required arguments, and is forwards-compatible — you can add new options without breaking existing callers.',
    },
    {
      title: 'Relying on overload with params for single-element calls',
      wrong: `static void Print(params string[] items) { foreach (var s in items) Console.WriteLine(s); }
// Fine for Print("a","b","c") but creates a string[] allocation for every single call
Print("hello");   // allocates string[]{ "hello" } on the heap`,
      right: `static void Print(string item) => Console.WriteLine(item);        // no allocation
static void Print(params string[] items) { foreach (var s in items) Console.WriteLine(s); }
// Compiler picks the exact-match overload for single-argument calls`,
      explanation: 'A params overload always allocates an array, even for single arguments. Adding a non-params overload for the common case gives the compiler a better match and eliminates the array allocation. The compiler prefers the non-params overload when argument count matches exactly.',
    },
    {
      title: 'Using out where a tuple return is cleaner',
      wrong: `static bool TryGetUser(int id, out string name, out string email)
{
    name  = "Alice"; email = "alice@example.com"; return true;
}
// Awkward call: TryGetUser(1, out string n, out string e)`,
      right: `static (bool found, string name, string email) GetUser(int id)
    => (true, "Alice", "alice@example.com");

var (found, name, email) = GetUser(1);  // clean destructuring`,
      explanation: 'out parameters do not work with async methods and make call sites verbose. C# 7+ value tuples are a cleaner alternative for returning multiple values: they deconstruct naturally, work in async methods, and compose well with LINQ and pattern matching.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which of the following is part of a method\'s <strong>signature</strong> in C#?',
      options: [
        'The return type',
        'The method name and parameter types',
        'The access modifier (public / private)',
        'XML documentation comments',
      ],
      answer: 1,
      explanation: 'A method signature in C# is its name combined with the number, types, and order of its parameters. The return type and access modifier are <em>not</em> part of the signature — two methods with the same name and parameters but different return types cause a compile error.',
    },
    {
      q: 'What is the key difference between <code>ref</code> and <code>out</code>?',
      options: [
        'ref is for value types; out is for reference types',
        'ref requires the variable to be initialised before the call; out does not, but the method must assign it',
        'out is faster than ref at runtime',
        'They are identical — just different keywords',
      ],
      answer: 1,
      explanation: 'Both pass by reference, but with different contracts. <code>ref</code> requires the variable to be initialised before the call because the method may read it. <code>out</code> does not require pre-initialisation but the compiler enforces that the method assigns the variable in every code path before returning.',
    },
    {
      q: 'Given <code>static void Log(string msg, bool debug = false)</code>, which call is valid?',
      options: [
        'Log(debug: true)',
        'Log("hello", debug: true)',
        'Log(debug: true, "hello")',
        'Log("hello", true, false)',
      ],
      answer: 1,
      explanation: '<code>Log("hello", debug: true)</code> satisfies the required <code>msg</code> parameter positionally and overrides the optional <code>debug</code> by name. Option A omits the required parameter. Option C places a positional argument after a named one (requires C# 7.2+, and even then requires named first). Option D passes too many arguments.',
    },
    {
      q: 'What advantage does marking a local function <code>static</code> provide?',
      options: [
        'It makes the function accessible from outside the enclosing method',
        'It prevents the local function from capturing variables from the enclosing scope, improving clarity and avoiding closure allocation',
        'It automatically memoises the result',
        'It allows the function to be recursive',
      ],
      answer: 1,
      explanation: 'A <code>static</code> local function cannot close over any variables from the enclosing method. This makes the function self-contained, avoids a hidden closure object allocation, and signals intent to the reader. Non-static local functions can also be recursive, so that is not the key distinction.',
    },
    {
      q: 'Given overloads <code>Print(int)</code> and <code>Print(double)</code>, what does <code>Print(1L)</code> call?',
      options: [
        'Print(int) — long is closer to int',
        'Print(double) — long converts to double via widening conversion',
        'Compile error — no exact overload for long',
        'Runtime dispatch picks the best overload',
      ],
      answer: 1,
      explanation: 'The compiler uses widening conversion rules. <code>long</code> cannot be implicitly narrowed to <code>int</code> (data loss), but it can widen to <code>double</code>. So <code>Print(double)</code> is selected. If you want <code>int</code> behaviour, you must cast explicitly: <code>Print((int)1L)</code>.',
    },
    {
      q: 'Why should you prefer returning a tuple over using multiple <code>out</code> parameters?',
      options: [
        'Tuples are faster than out parameters at runtime',
        'out parameters do not work in async methods; tuples also deconstruct cleanly and compose with LINQ',
        'The compiler rejects out parameters in C# 10+',
        'Tuples are automatically serialized; out parameters are not',
      ],
      answer: 1,
      explanation: '<code>out</code> is not allowed in <code>async</code> methods (a common gotcha). Tuples return naturally from async, deconstruct with <code>var (a, b) = Method()</code>, and compose with LINQ. They are also cleaner at the call site. Use <code>out</code> when matching existing patterns like <code>TryParse</code> for consistency.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use overloading vs optional parameters?',
      a: 'Use <strong>optional parameters</strong> when the logic is the same regardless of which params are provided and the defaults represent genuinely sensible values: <code>Log(msg, level = "INFO")</code>. Use <strong>overloads</strong> when the implementations differ for different input types (<code>Add(int,int)</code> vs <code>Add(double,double)</code>), or when you want to keep method-group-to-delegate compatibility. Note: default values are baked into callers\' IL — if the library changes a default, callers need recompilation.',
    },
    {
      q: 'Why do I have to write "ref" at the call site too?',
      a: 'C# requires <code>ref</code> at both the declaration and the call site so that anyone reading the call immediately knows the variable may be mutated. In languages that hide this, a reader of <code>Swap(a, b)</code> has no idea whether <code>a</code> and <code>b</code> will change. The explicit keyword makes the side effect visible and searchable in code review.',
    },
    {
      q: 'Are local functions better than private helper methods?',
      a: 'It depends on scope. Local functions are ideal when a helper is only ever used by one method — they keep logic co-located and hide the detail from the class API surface. Private methods are better when multiple class members share the same helper, or when you want to unit-test the helper independently. Rule of thumb: start local, promote to <code>private</code> when a second caller appears.',
    },
    {
      q: 'What is the difference between a local function and a lambda?',
      a: 'Local functions are named methods: they support <code>ref</code>/<code>out</code>/<code>in</code> parameters, can be recursive without workarounds, can be <code>static</code>, and have no allocation overhead unless they capture variables. Lambdas (<code>x => x + 1</code>) are delegate instances and always allocate a closure object when capturing variables. Prefer local functions for recursive or performance-sensitive helpers; prefer lambdas for short inline predicates in LINQ.',
    },
    {
      q: 'Does passing a reference type to a method without ref pass "by reference"?',
      a: 'Partially. Without <code>ref</code>, a copy of the reference (pointer) is passed. The method can mutate the <em>object</em> through that pointer (add to a list, change a property) — and the caller sees those changes. But if the method reassigns the variable to a new object (<code>list = new List&lt;int&gt;()</code>), the caller\'s variable is unchanged. You need <code>ref</code> only when you need to replace what the caller\'s variable points to.',
    },
    {
      q: 'How does the compiler resolve overloads when multiple candidates apply?',
      a: 'The compiler applies "better function member" rules: exact type matches beat widening conversions; non-params overloads beat params overloads; more derived types beat less derived. When two candidates are equally applicable (e.g. <code>F(int,double)</code> vs <code>F(double,int)</code> called with <code>F(1,1)</code>), the compiler produces CS0121 (ambiguity error). To resolve ambiguity, cast arguments explicitly: <code>F(1, (double)1)</code>.',
    },
  ];

  challenge: Challenge = {
    title: 'Calculator with Overloads, out, and a Local Helper',
    description: `Implement a Calculator class demonstrating key method features.

Requirements:
1. Overloaded Add: Add(int a, int b), Add(double a, double b), and Add(params int[] values)
2. TryDivide(int a, int b, out double result) — returns false when b == 0
3. Percent(double value, double total, int decimals = 2) — optional parameter
4. RoundedSqrt(double n) — uses a static local function internally`,
    language: 'csharp',
    hints: [
      'Overloaded methods share the same name but have different parameter lists',
      'The out parameter must be assigned in every code path before returning',
      'Optional parameters need a default value: int decimals = 2',
      'Declare the static local function after the return statement inside RoundedSqrt',
    ],
    starterCode: `public class Calculator
{
    // TODO: Add(int a, int b) overload
    // TODO: Add(double a, double b) overload
    // TODO: Add(params int[] values) overload

    public bool TryDivide(int a, int b, out double result)
    {
        throw new NotImplementedException();
    }

    public double Percent(double value, double total, int decimals = 2)
    {
        throw new NotImplementedException();
    }

    public double RoundedSqrt(double n)
    {
        throw new NotImplementedException();
    }
}`,
    solution: `public class Calculator
{
    public int    Add(int a, int b)       => a + b;
    public double Add(double a, double b) => a + b;
    public int    Add(params int[] values)
    {
        int total = 0;
        foreach (int v in values) total += v;
        return total;
    }

    public bool TryDivide(int a, int b, out double result)
    {
        if (b == 0) { result = 0; return false; }
        result = (double)a / b;
        return true;
    }

    public double Percent(double value, double total, int decimals = 2)
    {
        if (total == 0) return 0;
        return Math.Round(value / total * 100.0, decimals);
    }

    public double RoundedSqrt(double n)
    {
        if (n < 0) throw new ArgumentException("n must be non-negative");
        return Round(Math.Sqrt(n));

        static double Round(double x) => Math.Round(x, 4);
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Methods in C# have signatures (name + parameter types, not return type). Parameter modifiers (ref/out/in) control how arguments cross the method boundary.',
    mustKnow: [
      '<code>ref</code> passes by reference — caller variable can be read and written. <code>out</code> must be assigned before return. <code>in</code> is read-only by-ref for large structs.',
      'Overload resolution picks the most specific match at compile time — exact beats widening conversion, non-params beats params.',
      'Optional parameter defaults are baked into callers\' IL — changing a default in a library requires recompilation of all callers.',
      'Local functions can be recursive and use ref/out; static local functions avoid closure allocation.',
      'Expression-bodied members (<code>=></code>) work on methods, properties, constructors — anywhere a single expression suffices.',
      'Passing a reference type <em>without</em> ref passes a copy of the pointer — the method can mutate the object but cannot rebind the caller\'s variable.',
      'Prefer tuple returns over multiple out parameters — tuples work in async methods and deconstruct cleanly.',
    ],
    interviewFocus: [
      'What\'s the difference between ref and out? (initialisation requirement + assignment obligation)',
      'Does passing a class to a method pass "by reference"? (no — copy of pointer; ref rebinds the variable)',
      'How does overload resolution work when two candidates match? (better function member rules; ambiguity = compile error)',
      'When would you use a local function vs a private method vs a lambda? (scope, recursion, capture, allocation)',
      'Why can\'t you use out parameters in async methods? (compiler cannot guarantee assignment across await points)',
    ],
  };
}
