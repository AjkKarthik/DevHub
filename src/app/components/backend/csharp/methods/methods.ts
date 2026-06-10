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
  selector: 'app-csharp-methods',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
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
    { name: 'out',              type: 'keyword', desc: 'Passes an argument that the method must assign before returning — used for multiple return values', since: 'C# 1' },
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
        'A method signature is the combination of its name and parameter types. The return type is <strong>not</strong> part of the signature — two methods that differ only by return type will not compile.',
        'Overloading lets you define multiple methods with the same name but different parameter lists. The compiler picks the best match at the call site.',
        'Overloads are resolved at compile time based on the number, types, and order of arguments — there is no runtime dispatch cost.',
        'Use overloading when the same logical operation makes sense for different input types (e.g. <code>Add(int, int)</code> and <code>Add(double, double)</code>), not to hide unrelated behaviour behind one name.',
      ],
    },
    {
      heading: 'ref / out / in parameter modifiers',
      points: [
        '<code>ref</code> passes a variable by reference. The method can both read and write the caller\'s variable. The variable must be initialised before the call.',
        '<code>out</code> is like <code>ref</code> but the caller does not need to initialise the variable. The method is required to assign it before returning. Ideal for "try-parse" patterns.',
        '<code>in</code> passes a value type by reference but the method cannot modify it. This avoids copying large structs (e.g. <code>Matrix4x4</code>) without risking mutation.',
        'All three require both the declaration and the call site to use the modifier keyword — this makes it explicit and searchable when reading code.',
      ],
    },
    {
      heading: 'Optional and named arguments',
      points: [
        'A parameter with a default value becomes optional: callers can omit it and the default is used. Optional parameters must appear after all required parameters.',
        'Named arguments let you specify which parameter you are providing by using <code>paramName: value</code> syntax. This improves readability and lets you skip optional parameters in the middle of a list.',
        'Named arguments can be passed in any order as long as all required parameters are satisfied, making call sites self-documenting.',
        'Avoid too many optional parameters on a single method — consider a parameter object or a builder pattern when the list grows beyond three or four.',
      ],
    },
    {
      heading: 'Local functions and closures',
      points: [
        'A local function is a method declared inside another method. It can only be called within the enclosing method and can capture the outer method\'s variables (a closure).',
        'Local functions are cleaner than private helper methods when the helper is only relevant to one method — keeping the logic in one place and out of the class API.',
        'Marking a local function <code>static</code> prevents it from capturing any outer variables, which can improve performance and makes the intent clear.',
        'Expression-bodied methods (<code>=></code>) eliminate the braces and return keyword for single-expression implementations, reducing ceremony without sacrificing readability.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basics & Overloading',
      language: 'csharp',
      code: `// ── Simple methods ───────────────────────────────────────────────
static void Greet(string name)
{
    Console.WriteLine(\`Hello, {name}!\`);   // void — no return value
}

static int Add(int a, int b) => a + b;     // expression-bodied shorthand

static string Repeat(string s, int times)
{
    var sb = new System.Text.StringBuilder();
    for (int i = 0; i < times; i++) sb.Append(s);
    return sb.ToString();
}

Greet("Alice");                            // Hello, Alice!
Console.WriteLine(Add(3, 4));             // 7
Console.WriteLine(Repeat("ha", 3));       // hahaha

// ── Method overloading ────────────────────────────────────────────
static int    Add(int a, int b)            => a + b;
static double Add(double a, double b)      => a + b;
static int    Add(int a, int b, int c)     => a + b + c;

// Compiler picks the right overload at compile time
Console.WriteLine(Add(1, 2));             // int overload  → 3
Console.WriteLine(Add(1.5, 2.5));         // double overload → 4.0
Console.WriteLine(Add(1, 2, 3));          // 3-param overload → 6

// ── params — variable argument lists ─────────────────────────────
static int Sum(params int[] values)
{
    int total = 0;
    foreach (int v in values) total += v;
    return total;
}

Console.WriteLine(Sum(1, 2, 3));          // 6
Console.WriteLine(Sum(10, 20, 30, 40));   // 100
int[] nums = { 5, 6, 7 };
Console.WriteLine(Sum(nums));             // 18 — array is also valid`,
    },
    {
      label: 'ref / out / in params',
      language: 'csharp',
      code: `// ── ref: read AND write the caller's variable ────────────────────
static void Increment(ref int value, int by = 1)
{
    value += by;   // modifies the caller's variable directly
}

int counter = 10;
Increment(ref counter);        // counter is now 11
Increment(ref counter, 5);     // counter is now 16
Console.WriteLine(counter);    // 16

// ── out: method MUST assign before returning ──────────────────────
static bool TryDivide(int a, int b, out double result)
{
    if (b == 0)
    {
        result = 0;            // must assign even in the failure path
        return false;
    }
    result = (double)a / b;
    return true;
}

if (TryDivide(10, 3, out double quotient))
    Console.WriteLine(\`10 / 3 = {quotient:F4}\`);  // 3.3333
else
    Console.WriteLine("Division by zero");

// C# 7+ inline out variable declaration:
if (TryDivide(7, 2, out double q2))
    Console.WriteLine(\`7 / 2 = {q2}\`);            // 3.5

// Discard with _ when you don't need the out value:
_ = TryDivide(5, 0, out _);

// ── in: read-only reference (no copy for large structs) ───────────
readonly struct BigPoint { public double X, Y, Z, W; }

static double MagnitudeSquared(in BigPoint p)   // p is NOT copied
    => p.X * p.X + p.Y * p.Y + p.Z * p.Z + p.W * p.W;

// p.X = 1; // compile error — in prevents mutation

var pt = new BigPoint { X = 1, Y = 2, Z = 3, W = 4 };
Console.WriteLine(MagnitudeSquared(in pt));   // 30`,
    },
    {
      label: 'Optional & Named Args',
      language: 'csharp',
      code: `// ── Optional parameters (must follow required ones) ─────────────
static string FormatLog(
    string message,
    string level   = "INFO",
    bool   timestamp = true,
    string separator = " | ")
{
    string prefix = timestamp
        ? DateTime.Now.ToString("HH:mm:ss") + separator
        : string.Empty;
    return \`[{level}] {prefix}{message}\`;
}

// All optional params use defaults:
Console.WriteLine(FormatLog("Server started"));
// [INFO] 14:23:01 | Server started

// Override one in the middle using a named argument:
Console.WriteLine(FormatLog("Disk full", level: "WARN"));
// [WARN] 14:23:01 | Disk full

// Skip to a later optional param:
Console.WriteLine(FormatLog("Debug info", timestamp: false));
// [INFO] Debug info

// ── Named arguments improve readability ───────────────────────────
static void CreateUser(string firstName, string lastName,
                       int age, bool isAdmin = false)
{
    Console.WriteLine(\`{firstName} {lastName}, age {age}, admin: {isAdmin}\`);
}

// Without names — unclear which arg is which:
CreateUser("Jane", "Doe", 28, true);

// With names — self-documenting:
CreateUser(firstName: "Jane", lastName: "Doe", age: 28, isAdmin: true);

// Named args can be in any order:
CreateUser(age: 28, lastName: "Doe", firstName: "Jane");

// ── Combining both ────────────────────────────────────────────────
static void SendEmail(
    string to,
    string subject,
    string body        = "",
    bool   html        = false,
    int    priority    = 0)
{
    Console.WriteLine(\`To: {to} | Subject: {subject} | HTML: {html}\`);
}

SendEmail("a@b.com", "Hello", html: true, priority: 1);
// body uses default ""; html and priority are set by name`,
    },
    {
      label: 'Expression-bodied & Local Functions',
      language: 'csharp',
      code: `// ── Expression-bodied methods (single expression) ────────────────
static int    Square(int x)          => x * x;
static string Shout(string s)        => s.ToUpper() + "!";
static bool   IsEven(int n)          => n % 2 == 0;
static double Avg(double a, double b) => (a + b) / 2.0;

Console.WriteLine(Square(7));          // 49
Console.WriteLine(Shout("hello"));     // HELLO!
Console.WriteLine(IsEven(4));          // True
Console.WriteLine(Avg(3.0, 7.0));      // 5

// ── Local functions ───────────────────────────────────────────────
static long Factorial(int n)
{
    if (n < 0) throw new ArgumentException("n must be non-negative");

    return Compute(n);   // calls the local function

    // Local function — only visible inside Factorial
    long Compute(int x) => x <= 1 ? 1 : x * Compute(x - 1);
}

Console.WriteLine(Factorial(5));   // 120
Console.WriteLine(Factorial(10));  // 3628800

// ── Closures — local functions capturing outer variables ──────────
static Func<int> MakeCounter(int start = 0)
{
    int count = start;      // captured by the local function below

    return Increment;       // return the local function as a delegate

    int Increment()         // captures 'count' from outer scope
    {
        return count++;
    }
}

var counter = MakeCounter(10);
Console.WriteLine(counter());   // 10
Console.WriteLine(counter());   // 11
Console.WriteLine(counter());   // 12

// ── Static local functions — cannot capture, slightly faster ──────
static double HypotenuseFast(double a, double b)
{
    return Calc(a, b);

    static double Calc(double x, double y)   // static — no closure
        => Math.Sqrt(x * x + y * y);
}

Console.WriteLine(HypotenuseFast(3, 4));   // 5`,
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
      explanation: 'A method signature in C# is its name combined with the number, types, and order of its parameters. The return type and access modifier are <em>not</em> part of the signature — two methods with the same name and parameters but different return types will cause a compile error.',
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
      explanation: 'Both pass by reference, but with different contracts. <code>ref</code> requires the variable to be initialised first because the method may read it. <code>out</code> does not require pre-initialisation but the method is obligated to assign the variable before it returns.',
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
      explanation: '<code>Log("hello", debug: true)</code> is valid — it satisfies the required <code>msg</code> parameter and overrides the optional <code>debug</code> by name. Option A omits the required parameter. Option C puts a positional argument after a named one (invalid in older C# without trailing named args). Option D passes too many arguments.',
    },
    {
      q: 'What advantage does marking a local function <code>static</code> provide?',
      options: [
        'It makes the function accessible from outside the enclosing method',
        'It prevents the local function from capturing variables from the enclosing scope, improving clarity and potentially performance',
        'It automatically memoises the result',
        'It allows the function to be recursive',
      ],
      answer: 1,
      explanation: 'A <code>static</code> local function cannot capture (close over) any variables from the enclosing method. This makes the intent explicit — the function is self-contained — and avoids the overhead of a closure object. Non-static local functions can be recursive too, so that is not the distinguishing factor.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use overloading vs optional parameters?',
      a: 'Use <strong>optional parameters</strong> when the defaults represent genuinely sensible values and the method logic is the same regardless (e.g. <code>Log(msg, level = "INFO")</code>). Use <strong>overloads</strong> when the implementations differ meaningfully between input types (e.g. <code>Add(int, int)</code> vs <code>Add(double, double)</code>), or when you need to vary the parameter types. Overloads are also friendlier to older C# consumers and to reflection-heavy frameworks.',
    },
    {
      q: 'Why do I have to write "ref" at the call site too?',
      a: 'C# requires <code>ref</code> at both the declaration and the call site so that whoever reads the call immediately knows the variable may be mutated. In languages that hide this, a reader of <code>Swap(a, b)</code> has no idea <code>a</code> and <code>b</code> will change. The explicit keyword makes intent visible and searchable.',
    },
    {
      q: 'Are local functions better than private helper methods?',
      a: 'It depends on scope. Local functions are ideal when a helper is only ever used by one method — they keep the logic co-located and hide the implementation detail from the rest of the class. Private methods are better when multiple methods in the class share the same helper, or when you want to unit-test the helper directly. A rule of thumb: start local, promote to private when the second caller appears.',
    },
    {
      q: 'What is the difference between a local function and a lambda?',
      a: 'Both are nested callable blocks, but local functions are actual named methods: they can be recursive, they support <code>ref</code>/<code>out</code>/<code>in</code> parameters, they can have the <code>static</code> modifier, and they have no allocation overhead. Lambdas (<code>x => x + 1</code>) are delegate instances that always allocate a closure object when they capture variables. Prefer local functions for recursive or performance-sensitive helpers; prefer lambdas for short, inline LINQ predicates.',
    },
  ];

  challenge: Challenge = {
    title: 'Calculator with Overloads, out, and a Local Helper',
    description: `Implement a Calculator class that demonstrates key method features covered in this topic.

Requirements:
1. Overloaded Add methods: Add(int a, int b), Add(double a, double b), and Add(params int[] values)
2. A TryDivide(int a, int b, out double result) method that returns false when b == 0 and sets result to 0
3. A Percent(double value, double total, int decimals = 2) method using optional parameters
4. An internal static local function inside a public RoundedSqrt(double n) method`,
    language: 'csharp',
    hints: [
      'Overloaded methods share the same name but have different parameter lists',
      'The out parameter must be assigned in every code path before the method returns',
      'Optional parameters need a default value: int decimals = 2',
      'Declare the local function after the return statement or before it — both are valid',
    ],
    starterCode: `public class Calculator
{
    // TODO: Add(int a, int b) overload
    // TODO: Add(double a, double b) overload
    // TODO: Add(params int[] values) overload

    // TODO: TryDivide — returns false and sets result=0 when b==0
    public bool TryDivide(int a, int b, out double result)
    {
        throw new NotImplementedException();
    }

    // TODO: Percent with optional decimals parameter
    public double Percent(double value, double total, int decimals = 2)
    {
        throw new NotImplementedException();
    }

    // TODO: RoundedSqrt using a static local function internally
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
        if (b == 0)
        {
            result = 0;
            return false;
        }
        result = (double)a / b;
        return true;
    }

    public double Percent(double value, double total, int decimals = 2)
    {
        if (total == 0) return 0;
        double pct = value / total * 100.0;
        return Math.Round(pct, decimals);
    }

    public double RoundedSqrt(double n)
    {
        if (n < 0) throw new ArgumentException("n must be non-negative");
        return Round(Math.Sqrt(n));

        static double Round(double x) => Math.Round(x, 4);
    }
}

// Usage:
var calc = new Calculator();
Console.WriteLine(calc.Add(3, 4));             // 7
Console.WriteLine(calc.Add(1.5, 2.5));         // 4.0
Console.WriteLine(calc.Add(1, 2, 3, 4));       // 10

if (calc.TryDivide(10, 3, out double q))
    Console.WriteLine(q);                      // 3.3333...

Console.WriteLine(calc.Percent(25, 200));      // 12.5
Console.WriteLine(calc.RoundedSqrt(2));        // 1.4142`,
  };
}
