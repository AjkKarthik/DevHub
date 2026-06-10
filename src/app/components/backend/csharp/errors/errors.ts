import { Component, signal, computed } from '@angular/core';

interface CsharpError {
  code: string;
  title: string;
  cause: string;
  fix: string;
  example: string;
  solution: string;
  tag: 'compiler' | 'runtime' | 'nullref' | 'async' | 'linq' | 'cast';
}

@Component({
  selector: 'app-csharp-errors',
  standalone: true,
  imports: [],
  templateUrl: './errors.html',
  styleUrl: './errors.scss',
})
export class CsharpErrorsComponent {
  activeTag = signal<string>('all');
  tags = ['all', 'compiler', 'runtime', 'nullref', 'async', 'linq', 'cast'];

  errors: CsharpError[] = [
    {
      code: 'CS0029',
      title: 'Cannot implicitly convert type',
      cause: 'Assigning a value of one type to a variable of an incompatible type without an explicit cast.',
      fix: 'Add an explicit cast, use a conversion method, or change the variable type to match.',
      example: `int x = 3.14;           // double → int, no implicit conversion
string s = 42;          // int → string, not allowed`,
      solution: `int x = (int)3.14;      // explicit cast, truncates to 3
string s = 42.ToString(); // explicit conversion`,
      tag: 'compiler',
    },
    {
      code: 'CS0266',
      title: 'Cannot implicitly convert type (narrowing)',
      cause: 'Converting from a wider numeric type (e.g. double) to a narrower one (e.g. float) without a cast.',
      fix: 'Use an explicit cast. Be aware data may be lost.',
      example: `double d = 3.14;
float f = d;     // CS0266 — double is wider than float`,
      solution: `double d = 3.14;
float f = (float)d;  // explicit narrowing cast`,
      tag: 'compiler',
    },
    {
      code: 'CS8600',
      title: 'Converting null literal to non-nullable reference type',
      cause: 'Assigning null or a possibly-null value to a non-nullable reference type when #nullable is enabled.',
      fix: 'Use a nullable annotation (string?) for values that can be null, or guard with a null check.',
      example: `#nullable enable
string name = null;     // CS8600 — name is non-nullable`,
      solution: `#nullable enable
string? name = null;    // nullable reference type
string safe = name ?? "default";`,
      tag: 'compiler',
    },
    {
      code: 'CS8602',
      title: 'Dereference of a possibly null reference',
      cause: 'Accessing a member on a variable that the compiler considers possibly null under nullable analysis.',
      fix: 'Add a null check, use the null-conditional operator ?., or assert non-null with the ! operator only when certain.',
      example: `#nullable enable
string? name = GetName();
int len = name.Length;  // CS8602 — name may be null`,
      solution: `#nullable enable
string? name = GetName();
int len = name?.Length ?? 0;   // safe access with fallback`,
      tag: 'nullref',
    },
    {
      code: 'NullReferenceException',
      title: 'Object reference not set to an instance',
      cause: 'Accessing a property, method, or field on a null object reference at runtime.',
      fix: 'Guard with a null check or use the null-conditional operator. Enable nullable reference types to catch these at compile time.',
      example: `List<string>? list = null;
int count = list.Count;  // NullReferenceException at runtime`,
      solution: `List<string>? list = GetList();
int count = list?.Count ?? 0;  // safe
// or guard explicitly
if (list is not null) { count = list.Count; }`,
      tag: 'nullref',
    },
    {
      code: 'InvalidCastException',
      title: 'Specified cast is not valid',
      cause: 'Using a direct C-style cast (T) on an object that is not actually of type T at runtime.',
      fix: 'Use the as operator and check for null, or use is before casting. Avoid blind downcasts.',
      example: `object obj = "hello";
int n = (int)obj;  // InvalidCastException — obj is a string, not int`,
      solution: `object obj = "hello";
if (obj is int n) { Console.WriteLine(n); }  // safe with pattern matching
// or
int? n2 = obj as int?;  // returns null if incompatible`,
      tag: 'cast',
    },
    {
      code: 'InvalidOperationException',
      title: 'Sequence contains no matching element (LINQ)',
      cause: 'Calling First() or Single() on an empty sequence or one where no element matches the predicate.',
      fix: 'Use FirstOrDefault() / SingleOrDefault() and check the result for null, or verify the sequence is non-empty beforehand.',
      example: `var orders = new List<Order>();
var first = orders.First();  // InvalidOperationException — sequence is empty`,
      solution: `var orders = new List<Order>();
var first = orders.FirstOrDefault();
if (first is not null) { Process(first); }`,
      tag: 'linq',
    },
    {
      code: 'CS1998',
      title: 'Async method lacks await operators',
      cause: "An async method doesn't use await, so it runs synchronously and wraps the result in an already-completed Task.",
      fix: 'Either add an await inside the method, or remove the async keyword and return a completed Task explicitly.',
      example: `async Task<int> GetValueAsync()
{
    return 42;  // CS1998 warning — no await, runs synchronously
}`,
      solution: `// Option 1: genuinely async
async Task<int> GetValueAsync() => await Task.FromResult(42);

// Option 2: remove async, return completed Task
Task<int> GetValueAsync() => Task.FromResult(42);`,
      tag: 'async',
    },
    {
      code: 'Deadlock (async/sync)',
      title: 'Deadlock calling async code from synchronous context',
      cause: '.Wait() or .Result on a Task inside a synchronization-context thread (e.g. ASP.NET or UI thread) blocks the thread that async needs to resume on.',
      fix: 'Async all the way — never block on a Task. If you must bridge, use ConfigureAwait(false) in the async method.',
      example: `// In a controller (ASP.NET Framework)
public ActionResult Index()
{
    var data = FetchDataAsync().Result;  // DEADLOCK
    return View(data);
}`,
      solution: `// Make the action async
public async Task<ActionResult> Index()
{
    var data = await FetchDataAsync().ConfigureAwait(false);
    return View(data);
}`,
      tag: 'async',
    },
    {
      code: 'StackOverflowException',
      title: 'Stack overflow due to infinite recursion',
      cause: 'A method calls itself (directly or indirectly) without a base case, exhausting the call stack.',
      fix: 'Add a correct base case that terminates recursion, or convert to an iterative loop for deep recursions.',
      example: `int Factorial(int n)
{
    return n * Factorial(n - 1);  // missing base case → StackOverflowException
}`,
      solution: `int Factorial(int n)
{
    if (n <= 1) return 1;          // base case
    return n * Factorial(n - 1);
}`,
      tag: 'runtime',
    },
    {
      code: 'ObjectDisposedException',
      title: 'Cannot access a disposed object',
      cause: 'A method is called on an object after Dispose() has been called on it.',
      fix: 'Implement a _disposed guard in your Dispose method and throw ObjectDisposedException on subsequent calls.',
      example: `var stream = new MemoryStream();
stream.Dispose();
stream.Write(new byte[1], 0, 1);  // ObjectDisposedException`,
      solution: `using var stream = new MemoryStream();
stream.Write(new byte[1], 0, 1);  // disposed automatically at end of scope`,
      tag: 'runtime',
    },
    {
      code: 'CS0019',
      title: 'Operator cannot be applied to operands of given type',
      cause: 'Using an operator (e.g. +, >, ==) between types that do not define that operator.',
      fix: 'Implement the operator overload on your type, convert to a compatible type first, or use a method instead.',
      example: `record Point(int X, int Y);
var a = new Point(1, 2);
var b = new Point(3, 4);
var c = a + b;  // CS0019 — no + operator on Point`,
      solution: `record Point(int X, int Y)
{
    public static Point operator +(Point a, Point b)
        => new Point(a.X + b.X, a.Y + b.Y);
}
var c = a + b;  // works`,
      tag: 'compiler',
    },
    {
      code: 'KeyNotFoundException',
      title: 'The given key was not present in the dictionary',
      cause: 'Accessing a Dictionary with a key that does not exist using the indexer [].',
      fix: 'Use TryGetValue(), ContainsKey(), or the GetValueOrDefault() extension method before accessing.',
      example: `var map = new Dictionary<string, int> { ["a"] = 1 };
int val = map["b"];  // KeyNotFoundException`,
      solution: `var map = new Dictionary<string, int> { ["a"] = 1 };
if (map.TryGetValue("b", out int val))
{
    Console.WriteLine(val);
}
// or
int val2 = map.GetValueOrDefault("b", 0);`,
      tag: 'runtime',
    },
    {
      code: 'FormatException',
      title: 'Input string was not in the correct format',
      cause: 'Calling int.Parse(), DateTime.Parse() etc. on a string that cannot be converted to the target type.',
      fix: 'Use TryParse() which returns a bool rather than throwing, and handle the failure case explicitly.',
      example: `string input = "not-a-number";
int n = int.Parse(input);  // FormatException`,
      solution: `string input = "not-a-number";
if (int.TryParse(input, out int n))
{
    Console.WriteLine(n);
}
else
{
    Console.WriteLine("Invalid number");
}`,
      tag: 'runtime',
    },
    {
      code: 'OverflowException',
      title: 'Arithmetic operation resulted in an overflow',
      cause: 'An integer arithmetic operation exceeded the range of the type inside a checked context.',
      fix: 'Use a larger type (long, BigInteger), validate input ranges, or use unchecked if overflow is intentional.',
      example: `checked
{
    int max = int.MaxValue;
    int result = max + 1;  // OverflowException in checked context
}`,
      solution: `long max = int.MaxValue;
long result = max + 1;  // use long to avoid overflow

// or validate before arithmetic
if (value > int.MaxValue - increment) throw new ArgumentOutOfRangeException();`,
      tag: 'runtime',
    },
  ];

  filtered = computed(() => {
    const t = this.activeTag();
    return t === 'all' ? this.errors : this.errors.filter(e => e.tag === t);
  });
}
