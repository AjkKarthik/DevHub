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
  selector: 'app-csharp-strings-datetime',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './strings-datetime.html',
  styleUrl: './strings-datetime.scss',
})
export class CsharpStringsDatetime {

  quickRef: QuickRefItem[] = [
    { name: '$"..."',              type: 'syntax',   desc: 'String interpolation — embed expressions directly: $"Hello {name}"', since: 'C# 6' },
    { name: '@"..."',              type: 'syntax',   desc: 'Verbatim string literal — backslashes are literal, newlines allowed', since: 'C# 1' },
    { name: '"""..."""',           type: 'syntax',   desc: 'Raw string literal — no escaping needed, indent-aware (C# 11)', since: 'C# 11' },
    { name: 'StringBuilder',       type: 'class',    desc: 'Mutable string buffer — use in loops to avoid O(n²) string allocations', since: 'C# 1' },
    { name: 'string.Format',       type: 'method',   desc: 'Composite formatting: string.Format("{0} is {1}", name, age)', since: 'C# 1' },
    { name: 'DateOnly',            type: 'type',     desc: 'Date without time component — lighter than DateTime for date-only data', since: '.NET 6' },
    { name: 'TimeOnly',            type: 'type',     desc: 'Time of day without date — perfect for opening hours, schedules', since: '.NET 6' },
    { name: 'DateTimeOffset',      type: 'type',     desc: 'DateTime plus explicit UTC offset — the safest type for storing timestamps across time zones', since: 'C# 2' },
    { name: 'TimeSpan',            type: 'type',     desc: 'Represents a duration — result of subtracting two DateTimes', since: 'C# 1' },
    { name: 'StringComparison',    type: 'type',     desc: 'Enum for string comparison rules: Ordinal, OrdinalIgnoreCase, CurrentCulture, InvariantCulture', since: 'C# 2' },
    { name: 'Math',                type: 'class',    desc: 'Static class with Abs, Round, Floor, Ceiling, Pow, Sqrt, Min, Max, Clamp etc.', since: 'C# 1' },
    { name: 'MathF',               type: 'class',    desc: 'Same as Math but operates on float (single precision) for perf', since: '.NET Core 2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'String immutability and interpolation',
      points: [
        'Strings in C# are immutable — every method like <code>ToUpper()</code>, <code>Replace()</code>, or <code>Trim()</code> returns a <em>new</em> string; the original is unchanged. This makes strings safe to share between threads.',
        'String interpolation (<code>$"Hello {name}!"</code>) is the modern, readable alternative to <code>string.Format</code>. Expressions can be complex: <code>$"Total: {items.Sum(x => x.Price):C2}"</code>.',
        'Verbatim strings (<code>@"C:\\Users\\file.txt"</code>) treat backslashes as literals — useful for file paths and regex patterns. Escape a literal double-quote with <code>""</code> inside a verbatim string.',
        'Raw string literals (C# 11) start and end with three or more quotes: <code>"""..."""</code>. No escaping is needed at all, and leading whitespace is stripped to the position of the closing <code>"""</code>.',
        'String interning: the runtime may store multiple identical string literals in the same memory location (<code>string.Intern</code>). Consequence: <code>==</code> comparing literals may use reference equality — always compare with <code>==</code> (which calls <code>Equals</code>) or <code>string.Equals</code>, never <code>ReferenceEquals</code>, for string value comparison.',
      ],
    },
    {
      heading: 'StringBuilder for efficient concatenation',
      points: [
        'Concatenating strings in a loop with <code>+=</code> is O(n²) because each concatenation creates a new string object and copies all previous characters — 10,000 iterations means ~50 million character copies.',
        '<code>StringBuilder</code> maintains an internal <code>char[]</code> buffer and only allocates when the buffer is full. Appending in a loop is O(n) overall — a massive difference at scale.',
        'Pre-size the builder when you know the approximate output size: <code>new StringBuilder(capacity: 64_000)</code>. Avoids repeated buffer doublings.',
        'After building, call <code>.ToString()</code> to get the final string. Call <code>.Clear()</code> and reuse the builder across method calls in a hot loop to eliminate even the builder allocation.',
        'For simple cases with a known number of parts, string interpolation or <code>string.Concat</code> (used by the compiler for <code>+</code> with literal operands) is fine. Use <code>StringBuilder</code> in loops, building CSV/HTML/SQL, or anywhere the number of parts is variable.',
      ],
    },
    {
      heading: 'String comparison and culture',
      points: [
        '<code>==</code> on strings calls <code>string.Equals</code>, which uses ordinal byte comparison by default — fast and culture-independent. It is the right choice for most comparisons: IDs, keys, enum names, and file extensions.',
        'For case-insensitive comparisons, pass <code>StringComparison.OrdinalIgnoreCase</code>: <code>string.Equals(a, b, StringComparison.OrdinalIgnoreCase)</code>. This is correct for identifiers and English text.',
        'Culture-sensitive comparison (<code>StringComparison.CurrentCulture</code>) applies locale-specific rules — "ä" may sort differently in German vs. Swedish. Use it for displayed text that users sort or search.',
        'Never use <code>==</code> or <code>.ToLower()</code> for multi-lingual comparisons: <code>"I".ToLower()</code> returns <code>"ı"</code> in Turkish locale. Always pass an explicit <code>StringComparison</code> or <code>CultureInfo</code>.',
        'Sorting: <code>Array.Sort(strings)</code> uses <code>CurrentCulture</code> by default. For deterministic, locale-independent sorting (serialization, keys, config), use <code>StringComparer.Ordinal</code> explicitly.',
      ],
    },
    {
      heading: 'DateTime, DateOnly, TimeOnly and TimeSpan',
      points: [
        '<code>DateTime</code> holds both date and time plus a <code>Kind</code> flag (Utc, Local, or Unspecified). Use <code>DateTime.UtcNow</code> for timestamps; never mix Utc and Local in arithmetic — the runtime will not automatically convert.',
        '<code>DateOnly</code> (.NET 6+) stores just the date with no time component — ideal for birthdays, event dates, and any scenario where "3 PM" is irrelevant. Eliminates midnight DST bugs.',
        '<code>TimeOnly</code> (.NET 6+) stores time of day (midnight to just before midnight) — ideal for opening hours, alarm times, and schedule rules. No date, no time-zone.',
        '<code>TimeSpan</code> is a duration. Subtract two <code>DateTime</code> values to get a <code>TimeSpan</code>. It exposes <code>.TotalHours</code>, <code>.TotalMinutes</code>, <code>.Days</code> etc. Create one with <code>TimeSpan.FromMinutes(90)</code>.',
        'Always use <code>DateTime.UtcNow</code> (or <code>DateTimeOffset.UtcNow</code>) for logging, event sourcing, and stored timestamps. Convert to local time only at the presentation layer — never store local time in a database.',
      ],
    },
    {
      heading: 'DateTimeOffset and time zones',
      points: [
        '<code>DateTimeOffset</code> stores a <code>DateTime</code> plus an explicit UTC offset. It is the safest type for user-facing timestamps that must survive time-zone changes — it captures exactly what "3 PM in Berlin" means in UTC terms.',
        '<code>DateTimeOffset.UtcNow</code> returns the current moment as a <code>DateTimeOffset</code> with offset <code>+00:00</code>. It is equivalent to <code>DateTime.UtcNow</code> but preserves the <code>DateTimeOffset</code> API.',
        'Convert between time zones with <code>TimeZoneInfo.ConvertTimeFromUtc(utcTime, tz)</code> and <code>TimeZoneInfo.ConvertTimeToUtc(localTime, tz)</code> — always pass explicit <code>TimeZoneInfo</code> objects, never rely on the machine\'s local time zone in server code.',
        'For calendaring, scheduling, and recurring events, consider the NodaTime NuGet library — it models local dates, instants, durations, and time-zone conversions with a much richer and safer type system than the BCL offers.',
        'Database storage: SQL Server\'s <code>datetimeoffset</code> maps to <code>DateTimeOffset</code>. PostgreSQL\'s <code>timestamptz</code> stores in UTC and converts on read. For .NET + PostgreSQL, configure EF Core to use UTC and <code>DateTimeOffset</code> columns throughout.',
      ],
    },
    {
      heading: 'Math and MathF',
      points: [
        'The static <code>Math</code> class operates on <code>double</code>. Key methods: <code>Abs</code>, <code>Round</code>, <code>Floor</code>, <code>Ceiling</code>, <code>Pow</code>, <code>Sqrt</code>, <code>Log</code>, <code>Min</code>, <code>Max</code>, <code>Clamp</code>.',
        '<code>Math.Round</code> uses <em>banker\'s rounding</em> by default (rounds 0.5 to the nearest even number — e.g. 2.5 → 2, 3.5 → 4). Pass <code>MidpointRounding.AwayFromZero</code> for the familiar "school" rounding.',
        '<code>MathF</code> is the <code>float</code> counterpart — use it in graphics or game code where single-precision performance matters and double precision is unnecessary.',
        'For high-precision financial arithmetic, avoid <code>Math</code> with <code>double</code> — use <code>decimal</code> and <code>Math.Round(value, 2, MidpointRounding.AwayFromZero)</code>.',
        '<code>double</code> arithmetic can accumulate floating-point error: <code>0.1 + 0.2 != 0.3</code>. For comparisons, use an epsilon: <code>Math.Abs(a - b) < 1e-9</code>. For currency and tax, always use <code>decimal</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'String Methods',
      language: 'csharp',
      code: `string s = "  Hello, World!  ";

// ── Whitespace ─────────────────────────────────────────────────────────
Console.WriteLine(s.Trim());          // "Hello, World!"
Console.WriteLine(s.TrimStart());     // "Hello, World!  "
Console.WriteLine(s.TrimEnd());       // "  Hello, World!"

// ── Case ───────────────────────────────────────────────────────────────
Console.WriteLine(s.Trim().ToUpper()); // HELLO, WORLD!
Console.WriteLine(s.Trim().ToLower()); // hello, world!

// ── Search ─────────────────────────────────────────────────────────────
string text = "The quick brown fox";
Console.WriteLine(text.Contains("quick"));        // True
Console.WriteLine(text.StartsWith("The"));        // True
Console.WriteLine(text.EndsWith("fox"));          // True
Console.WriteLine(text.IndexOf("brown"));         // 10

// ── Replace ────────────────────────────────────────────────────────────
Console.WriteLine(text.Replace("fox", "cat"));    // The quick brown cat

// ── Split and Join ─────────────────────────────────────────────────────
string csv = "alice,bob,charlie,dave";
string[] names = csv.Split(',');
Console.WriteLine(names[1]);                      // bob
Console.WriteLine(string.Join(" | ", names));     // alice | bob | charlie | dave

// ── Substring vs Range ─────────────────────────────────────────────────
string word = "developer";
Console.WriteLine(word.Substring(3, 4));          // elop
Console.WriteLine(word[3..7]);                    // elop  (C# 8 range)
Console.WriteLine(word[^3..]);                    // per   (last 3 chars)

// ── String comparison ──────────────────────────────────────────────────
string a = "hello", b = "HELLO";
Console.WriteLine(a == b);                                               // False
Console.WriteLine(string.Equals(a, b, StringComparison.OrdinalIgnoreCase)); // True`,
    },
    {
      label: 'Interpolation & Literals',
      language: 'csharp',
      code: `string name = "Alice";
int age  = 30;
decimal price = 1234.5m;

// ── Interpolation ──────────────────────────────────────────────────────
Console.WriteLine($"Hello, {name}! You are {age} years old.");
Console.WriteLine($"Price: {price:C2}");          // Price: £1,234.50 (locale-dependent)
Console.WriteLine($"{name.ToUpper(),10}");         // right-align in 10 chars:   ALICE

// ── Format specifiers ─────────────────────────────────────────────────
double pi = 3.14159265;
Console.WriteLine($"{pi:F2}");    // 3.14
Console.WriteLine($"{pi:E2}");    // 3.14E+000
Console.WriteLine($"{1_000_000:N0}");  // 1,000,000

// ── string.Format (older but still common in logs) ─────────────────────
string msg = string.Format("{0} is {1} years old.", name, age);

// ── Verbatim string — backslash is literal ─────────────────────────────
string path  = @"C:\Users\Alice\Documents\file.txt";   // no double-escaping
string regex = @"\d{3}-\d{4}";
Console.WriteLine(path);

// ── Raw string literal (C# 11) — zero escaping ─────────────────────────
string json = """
    {
        "name": "Alice",
        "age": 30
    }
    """;
Console.WriteLine(json);`,
    },
    {
      label: 'StringBuilder',
      language: 'csharp',
      code: `using System.Text;

// ── Why StringBuilder matters ──────────────────────────────────────────
// BAD: O(n²) — creates a new string on each iteration
string bad = "";
for (int i = 0; i < 10_000; i++)
    bad += i.ToString();   // 10,000 allocations, copying all previous chars!

// GOOD: O(n) — single buffer, reallocated only when full
var sb = new StringBuilder(capacity: 64_000);  // pre-size if known
for (int i = 0; i < 10_000; i++)
    sb.Append(i);
string good = sb.ToString();

// ── Common StringBuilder methods ──────────────────────────────────────
var html = new StringBuilder();
html.AppendLine("<ul>");
string[] items = { "Apple", "Banana", "Cherry" };
foreach (string item in items)
    html.AppendLine($"  <li>{item}</li>");
html.AppendLine("</ul>");

Console.WriteLine(html.ToString());
// <ul>
//   <li>Apple</li>
//   <li>Banana</li>
//   <li>Cherry</li>
// </ul>

// ── Other useful methods ───────────────────────────────────────────────
var sb2 = new StringBuilder("Hello World");
sb2.Insert(5, ",");           // "Hello, World"
sb2.Replace("World", "C#");  // "Hello, C#"
sb2.Remove(0, 7);             // "C#"
Console.WriteLine(sb2);       // C#
Console.WriteLine(sb2.Length); // 2`,
    },
    {
      label: 'DateTime & Math',
      language: 'csharp',
      code: `// ── DateTime ──────────────────────────────────────────────────────────
DateTime now  = DateTime.UtcNow;
DateTime xmas = new DateTime(2025, 12, 25);

TimeSpan until = xmas - now;
Console.WriteLine($"{(int)until.TotalDays} days until Christmas");

// Formatting
Console.WriteLine(now.ToString("yyyy-MM-dd HH:mm:ss"));  // 2025-06-10 14:30:00
Console.WriteLine(now.ToString("dddd, d MMMM yyyy"));    // Tuesday, 10 June 2025

// Parsing
DateTime parsed = DateTime.Parse("2025-01-15");
bool ok = DateTime.TryParseExact("15/01/2025", "dd/MM/yyyy",
    null, System.Globalization.DateTimeStyles.None, out DateTime d);
Console.WriteLine(ok ? d.ToShortDateString() : "failed");

// ── DateOnly / TimeOnly (.NET 6+) ──────────────────────────────────────
DateOnly birthday = new DateOnly(1995, 7, 4);
DateOnly today    = DateOnly.FromDateTime(DateTime.Today);
int age = today.Year - birthday.Year;
if (birthday.DayOfYear > today.DayOfYear) age--;
Console.WriteLine($"Age: {age}");

TimeOnly open  = new TimeOnly(9, 0);
TimeOnly close = new TimeOnly(17, 30);
TimeOnly now2  = TimeOnly.FromDateTime(DateTime.Now);
Console.WriteLine(now2 >= open && now2 <= close ? "Open" : "Closed");

// ── Math ───────────────────────────────────────────────────────────────
Console.WriteLine(Math.Abs(-42));        // 42
Console.WriteLine(Math.Pow(2, 10));      // 1024
Console.WriteLine(Math.Sqrt(144));       // 12
Console.WriteLine(Math.Round(2.5));      // 2  (banker's rounding!)
Console.WriteLine(Math.Round(2.5, MidpointRounding.AwayFromZero)); // 3
Console.WriteLine(Math.Clamp(150, 0, 100)); // 100
Console.WriteLine(Math.Min(3, 7));       // 3
Console.WriteLine(Math.Floor(3.9));      // 3
Console.WriteLine(Math.Ceiling(3.1));    // 4`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'String concatenation in a loop — O(n²) performance',
      wrong: `// Each += creates a BRAND NEW string — O(n²) allocations
string result = "";
foreach (var item in 10_000_items)
    result += item.Name + ", ";   // copies ALL previous content each time

// For 10,000 items: ~50 million character copies, ~10,000 GC allocations`,
      right: `// StringBuilder: one buffer, O(n) copies total
var sb = new StringBuilder();
foreach (var item in items)
    sb.Append(item.Name).Append(", ");

string result = sb.ToString();

// Or use string.Join for simple cases:
string result2 = string.Join(", ", items.Select(x => x.Name));`,
      explanation: 'Each string += in a loop allocates a new string object and copies all characters from the previous strings into it. For n items, this is approximately n*(n+1)/2 character copies — O(n²). StringBuilder allocates once and amortizes the cost over all appends. For 10,000 items: string += takes ~100ms; StringBuilder takes ~1ms.',
    },
    {
      title: 'Mixing DateTime.Kind — Local and Utc in arithmetic',
      wrong: `// DateTime.Now returns Local; DateTime.UtcNow returns Utc
// Subtracting them does NOT automatically convert — result is wrong!
DateTime start = DateTime.UtcNow;   // e.g. 14:00 UTC
DateTime end   = DateTime.Now;      // e.g. 15:00 Local (= 14:00 UTC in UTC+1)

TimeSpan elapsed = end - start;     // 1 hour! But actual elapsed = 0 seconds
// The Kind mismatch causes a silent wrong calculation

// Storing local time in a database and then comparing:
DateTime stored = DateTime.Now;     // Local: 15:00
// Stored in DB, retrieved on a server in UTC timezone
// Appears as: 15:00 UTC — now off by 1 hour`,
      right: `// Always use UTC for storage, logging, and arithmetic
DateTime start = DateTime.UtcNow;
await DoWorkAsync();
DateTime end   = DateTime.UtcNow;
TimeSpan elapsed = end - start;     // Correct — both Utc

// For user-facing time with zone awareness, use DateTimeOffset:
DateTimeOffset userTime = DateTimeOffset.Now;  // UTC + explicit offset
// Safe to subtract — offsets are accounted for automatically`,
      explanation: 'DateTime.Now returns a Local-kind DateTime; DateTime.UtcNow returns Utc-kind. When you subtract or compare them, the runtime uses the numeric value without converting — producing wrong results silently. Always use DateTime.UtcNow (or DateTimeOffset.UtcNow) for all timestamps. Convert to local time only at the display layer.',
    },
    {
      title: 'Using == for culture-sensitive string comparison',
      wrong: `// == uses ordinal comparison — fine for identifiers, NOT for user-visible text
string city1 = "düsseldorf";
string city2 = "Düsseldorf";

// This is correct for ordinal:
bool match = city1 == city2;   // false — different case

// But ToLower() for comparison is WRONG in Turkish locale:
bool bad = city1.ToLower() == city2.ToLower();   // Correct in English
// BUT: "I".ToLower() returns "ı" (dotless i) in Turkish — culture-sensitive bug

// OrdinalIgnoreCase on culture-specific content:
string turkish1 = "ISTANBUL";
string turkish2 = "istanbul";
bool ok = string.Equals(turkish1, turkish2, StringComparison.OrdinalIgnoreCase);
// May behave unexpectedly for Turkish 'İ' vs 'I'`,
      right: `// For case-insensitive ordinal comparison (identifiers, keys, English):
bool match = string.Equals(city1, city2, StringComparison.OrdinalIgnoreCase);

// For display text that users search or sort (culture-aware):
bool displayMatch = string.Equals(city1, city2, StringComparison.CurrentCultureIgnoreCase);

// For sorting a list to show users — use CurrentCulture comparer:
var sorted = cities.OrderBy(c => c, StringComparer.CurrentCultureIgnoreCase).ToList();

// For serialization, database keys, URLs — use Ordinal:
dict.TryGetValue(key, StringComparer.Ordinal);`,
      explanation: 'C# string comparison is culture-sensitive by default for methods like ToLower(), but == uses ordinal comparison. For multi-lingual text that users interact with, always pass an explicit StringComparison or StringComparer. Never use .ToLower() for comparison — it applies the current culture\'s case rules, which differ between locales (the Turkish "İ"/"ı" / "I"/"ı" distinction is the classic example).',
    },
    {
      title: 'Math.Round surprise — banker\'s rounding',
      wrong: `// Expecting "school" rounding (0.5 always rounds up)
decimal price = 2.5m;
Console.WriteLine(Math.Round(price));     // Prints 2, not 3!

// In financial calculations this adds up:
decimal[] prices = { 0.5m, 1.5m, 2.5m, 3.5m };
decimal sum = prices.Sum(p => Math.Round(p));
Console.WriteLine(sum);   // 8 (rounds to even: 0→0, 2→2, 2→2, 4→4)
// Expected: 10 (traditional: 0.5→1, 1.5→2, 2.5→3, 3.5→4)`,
      right: `// Use MidpointRounding.AwayFromZero for traditional rounding:
decimal price = 2.5m;
Console.WriteLine(Math.Round(price, MidpointRounding.AwayFromZero));  // 3

// Always specify rounding in financial code:
decimal vat = Math.Round(subtotal * 0.2m, 2, MidpointRounding.AwayFromZero);

// Check: Math.Round(2.5) = 2 (banker's rounding: nearest even)
//        Math.Round(3.5) = 4 (nearest even)
//        Math.Round(2.5, MidpointRounding.AwayFromZero) = 3`,
      explanation: 'C# uses IEEE 754 banker\'s rounding (round-half-to-even) by default. 2.5 rounds to 2 (even), 3.5 rounds to 4 (even). Over large datasets this produces less biased totals than always rounding 0.5 up. But in financial applications where rounding must match user expectations or regulatory requirements, always pass MidpointRounding.AwayFromZero explicitly.',
    },
    {
      title: 'Using double for financial arithmetic — floating-point precision errors',
      wrong: `// double is base-2 floating point — 0.1 cannot be represented exactly
double price1  = 0.1;
double price2  = 0.2;
double total   = price1 + price2;
Console.WriteLine(total == 0.3);   // FALSE! total = 0.30000000000000004
Console.WriteLine(total);          // 0.30000000000000004

// In a loop:
double sum = 0;
for (int i = 0; i < 1000; i++) sum += 0.1;
Console.WriteLine(sum == 100.0);   // FALSE — accumulated floating-point error`,
      right: `// decimal is base-10 — represents 0.1, 0.2, 0.3 exactly
decimal price1 = 0.1m;
decimal price2 = 0.2m;
decimal total  = price1 + price2;
Console.WriteLine(total == 0.3m);  // TRUE
Console.WriteLine(total);          // 0.3

// Always use decimal for money, tax, and currency:
decimal itemPrice = 9.99m;
decimal taxRate   = 0.20m;
decimal tax       = Math.Round(itemPrice * taxRate, 2, MidpointRounding.AwayFromZero);
decimal grandTotal = itemPrice + tax;`,
      explanation: 'double uses binary (base-2) floating-point arithmetic — fractions like 0.1 (1/10) cannot be represented exactly in binary. Small errors accumulate across arithmetic operations. For financial calculations, use decimal (base-10) which represents common decimal fractions exactly. The performance penalty (decimal is ~3-4x slower than double) is irrelevant for financial code — correctness is paramount.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you use StringBuilder instead of string += in a loop?',
      options: [
        'StringBuilder is syntactically cleaner',
        'string += allocates a new string and copies all characters on every iteration, making it O(n²); StringBuilder uses a mutable buffer and is O(n)',
        'StringBuilder supports Unicode; string += does not',
        'string += throws an exception for more than 100 concatenations',
      ],
      answer: 1,
      explanation: 'Each <code>string +=</code> creates an entirely new string object — all previous content is copied each time. For n iterations this is O(n²) in time and O(n²) in allocations. <code>StringBuilder</code> appends to an internal buffer and only copies when the buffer needs to grow, making the total work O(n).',
    },
    {
      q: 'What does Math.Round(2.5) return by default in C#?',
      options: [
        '3 — rounds up as expected',
        '2 — uses banker\'s rounding (round to nearest even)',
        '2.5 — returns the value unchanged',
        'Throws an exception',
      ],
      answer: 1,
      explanation: 'C# uses <em>banker\'s rounding</em> (round-half-to-even) by default. <code>Math.Round(2.5)</code> returns <code>2</code> because 2 is the nearest even integer. Pass <code>MidpointRounding.AwayFromZero</code> to get the traditional "round 0.5 up" behaviour.',
    },
    {
      q: 'What is the key advantage of DateOnly over DateTime for storing a calendar date?',
      options: [
        'DateOnly has nanosecond precision; DateTime does not',
        'DateOnly avoids time-zone confusion and accidental time arithmetic — it holds only a year, month, and day',
        'DateOnly is stored as a string internally; DateTime is stored as ticks',
        'DateOnly supports leap seconds; DateTime does not',
      ],
      answer: 1,
      explanation: '<code>DateTime</code> always carries a time component and a <code>Kind</code> flag (Utc/Local/Unspecified), leading to subtle bugs when mixing time zones or comparing dates across midnight. <code>DateOnly</code> stores only year, month, and day — no time component to accidentally shift, making it ideal for birthdays, deadlines, and purely calendar concepts.',
    },
    {
      q: 'Which string literal type requires no escape sequences at all?',
      options: [
        'Verbatim strings starting with @',
        'Regular strings using double quotes',
        'Raw string literals using triple-quotes (C# 11)',
        'Interpolated strings starting with $',
      ],
      answer: 2,
      explanation: 'Raw string literals (<code>"""..."""</code>, C# 11) do not require any escaping — backslashes, double quotes, and newlines are all literal. Verbatim strings (<code>@"..."</code>) still require <code>""</code> to represent a literal double-quote. Raw string literals also strip leading whitespace to the column of the closing <code>"""</code>.',
    },
    {
      q: 'Why should you use decimal instead of double for financial calculations?',
      options: [
        'decimal has higher precision — it can store more significant digits than double',
        'double uses binary floating-point — 0.1 cannot be represented exactly, causing accumulating errors. decimal is base-10 and represents common decimal fractions exactly',
        'double throws exceptions on division by zero; decimal does not',
        'decimal supports negative values; double does not',
      ],
      answer: 1,
      explanation: '<code>double</code> uses binary (base-2) floating-point, so fractions like 0.1 (1/10) cannot be represented exactly — small errors accumulate. <code>0.1 + 0.2 == 0.30000000000000004</code> in double arithmetic. <code>decimal</code> uses base-10 representation and represents common decimal fractions exactly. For money, tax, and currency, correctness requires <code>decimal</code>.',
    },
    {
      q: 'What StringComparison should you use when comparing file extension strings like ".txt" vs ".TXT"?',
      options: [
        'StringComparison.CurrentCultureIgnoreCase — applies locale-specific rules',
        'StringComparison.OrdinalIgnoreCase — fast, culture-independent case-insensitive byte comparison',
        'StringComparison.InvariantCulture — equivalent to the invariant locale',
        'No explicit comparison — == handles this automatically',
      ],
      answer: 1,
      explanation: 'File extensions, URLs, keys, and identifiers are technical strings with no cultural meaning. <code>OrdinalIgnoreCase</code> does a fast, byte-level case-insensitive comparison with no locale-specific rules — it is consistent regardless of the machine\'s culture settings. <code>CurrentCultureIgnoreCase</code> would apply the machine\'s locale-specific case rules (e.g. the Turkish İ/ı distinction), which is wrong for technical identifiers.',
    },
    {
      q: 'What is the difference between DateTime and DateTimeOffset?',
      options: [
        'DateTime has millisecond precision; DateTimeOffset has nanosecond precision',
        'DateTime stores a Kind flag (Utc/Local/Unspecified) which can be wrong; DateTimeOffset stores an explicit UTC offset that is always unambiguous',
        'DateTimeOffset is only available in .NET 6+; DateTime works on all versions',
        'They are identical — DateTimeOffset is just an alias for DateTime',
      ],
      answer: 1,
      explanation: '<code>DateTime</code> stores a time value plus a <code>Kind</code> enum (Utc/Local/Unspecified). The Kind can be set incorrectly, and operations mixing different Kinds silently produce wrong results. <code>DateTimeOffset</code> stores the time value plus an explicit UTC offset as part of the struct — it is always unambiguous. Use <code>DateTimeOffset</code> when you need to preserve the user\'s local time AND its relationship to UTC.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between DateTime.Now and DateTime.UtcNow?',
      a: '<code>DateTime.Now</code> returns the current local time with <code>Kind = Local</code> — it respects the machine\'s time-zone offset and DST rules. <code>DateTime.UtcNow</code> returns Coordinated Universal Time with <code>Kind = Utc</code>, which never shifts for DST. For storing timestamps in databases, logging, or any cross-timezone scenario, always prefer <code>DateTime.UtcNow</code> or <code>DateTimeOffset.UtcNow</code>. Convert to local time only at the display layer.',
    },
    {
      q: 'How do I check if a string contains only digits?',
      a: 'Several approaches exist. The most concise is LINQ: <code>str.All(char.IsDigit)</code> — returns true if every character is a digit (0–9). You can also use a regex: <code>Regex.IsMatch(str, @"^\\d+$")</code>. For numeric parsing, prefer <code>int.TryParse(str, out _)</code> if you actually want to convert the value — it is fast, allocation-free, and handles edge cases like leading zeros or sign characters correctly.',
    },
    {
      q: 'How do I calculate the number of days between two dates?',
      a: 'Subtract two <code>DateTime</code> or <code>DateOnly</code> values. For DateTime: <code>int days = (int)(endDate - startDate).TotalDays;</code>. For DateOnly (.NET 6+): <code>int days = endDate.DayNumber - startDate.DayNumber;</code>. Always use UTC DateTimes in subtraction to avoid DST anomalies where a "day" can appear to have 23 or 25 hours. DateOnly avoids this entirely since it has no time component.',
    },
    {
      q: 'When should I use decimal instead of double for numbers?',
      a: '<code>double</code> is a binary floating-point type — fractions like 0.1 cannot be represented exactly, leading to tiny rounding errors (<code>0.1 + 0.2 == 0.30000000000000004</code>). <code>decimal</code> is a base-10 floating-point type that represents common decimal fractions exactly. Use <code>decimal</code> for financial calculations, currency, tax, and anywhere rounding must match human expectations. Use <code>double</code> for scientific calculations, physics, graphics, and anywhere approximate real-number arithmetic is acceptable and performance matters.',
    },
    {
      q: 'What does string interning mean and when does it matter?',
      a: 'String interning is the process of storing only one copy of each distinct string value in a shared pool. At compile time, all identical string literals in an assembly are automatically interned — they point to the same memory address. You can intern dynamic strings with <code>string.Intern(s)</code>. Consequence: <code>ReferenceEquals(a, b)</code> may return true for equal string literals but false for equal strings created at runtime. Never use <code>ReferenceEquals</code> to compare string values — always use <code>==</code> or <code>string.Equals</code>. Interning is primarily a compiler/runtime optimisation, not something you typically need to manage manually.',
    },
    {
      q: 'How do I efficiently build a large string from many parts?',
      a: 'Use <code>StringBuilder</code> for variable-length building in loops: create with <code>new StringBuilder(estimatedCapacity)</code>, call <code>Append</code> / <code>AppendLine</code>, and call <code>ToString()</code> at the end. For joining a known collection, <code>string.Join(separator, collection)</code> is the most readable and uses a single allocation internally. For a fixed number of parts, string interpolation or <code>string.Concat</code> (which the compiler may optimize) is fine. Avoid <code>+=</code> inside any loop — that is the O(n²) anti-pattern.',
    },
    {
      q: 'How should I store and compare dates in a database to avoid time-zone bugs?',
      a: 'Always store timestamps in UTC. In SQL Server, use <code>datetime2</code> or <code>datetimeoffset</code> columns; in PostgreSQL use <code>timestamptz</code> (which stores in UTC and converts on read). In C#, store <code>DateTime.UtcNow</code> or <code>DateTimeOffset.UtcNow</code> — never store <code>DateTime.Now</code> (local time without zone info). When displaying to users, convert from UTC to the user\'s time zone at the API/presentation layer using <code>TimeZoneInfo.ConvertTimeFromUtc</code> or a library like NodaTime. For date-only data (birthdays, event dates), use <code>DateOnly</code> in .NET 6+ to avoid any time component entirely.',
    },
  ];

  challenge: Challenge = {
    title: 'Invoice Formatter',
    description: `Build a simple invoice formatter.
1. Create a method <code>FormatInvoice(string customer, DateOnly issueDate, decimal[] lineItems)</code> that returns a formatted invoice string built with <code>StringBuilder</code>.
2. Include: a header with customer name and issue date (formatted as <code>dd MMM yyyy</code>), each line item numbered and formatted as currency (<code>C2</code>), a subtotal, VAT at 20% (rounded to 2 decimal places, away from zero), and a total.
3. The due date should be 30 days after the issue date. Display it in the header.`,
    language: 'csharp',
    hints: [
      'Use StringBuilder.AppendLine for each row',
      'issueDate.AddDays(30) gives the due DateOnly on .NET 6+',
      'issueDate.ToString("dd MMM yyyy") formats the date',
      'Math.Round(subtotal * 0.2m, 2, MidpointRounding.AwayFromZero) for VAT',
    ],
    starterCode: `using System.Text;

static string FormatInvoice(string customer, DateOnly issueDate, decimal[] lineItems)
{
    // TODO: build and return the invoice string using StringBuilder
    throw new NotImplementedException();
}

// Test
decimal[] items = { 120.00m, 45.50m, 89.99m };
string invoice = FormatInvoice("Acme Corp", new DateOnly(2025, 6, 10), items);
Console.WriteLine(invoice);`,
    solution: `using System.Text;

static string FormatInvoice(string customer, DateOnly issueDate, decimal[] lineItems)
{
    DateOnly dueDate  = issueDate.AddDays(30);
    decimal subtotal  = lineItems.Sum();
    decimal vat       = Math.Round(subtotal * 0.2m, 2, MidpointRounding.AwayFromZero);
    decimal total     = subtotal + vat;

    var sb = new StringBuilder();
    sb.AppendLine("===================================");
    sb.AppendLine($"INVOICE FOR: {customer}");
    sb.AppendLine($"Issue Date:  {issueDate:dd MMM yyyy}");
    sb.AppendLine($"Due Date:    {dueDate:dd MMM yyyy}");
    sb.AppendLine("-----------------------------------");
    for (int i = 0; i < lineItems.Length; i++)
        sb.AppendLine($"  {i + 1}. {lineItems[i]:C2}");
    sb.AppendLine("-----------------------------------");
    sb.AppendLine($"Subtotal:    {subtotal:C2}");
    sb.AppendLine($"VAT (20%):   {vat:C2}");
    sb.AppendLine($"TOTAL:       {total:C2}");
    sb.AppendLine("===================================");
    return sb.ToString();
}

decimal[] items = { 120.00m, 45.50m, 89.99m };
string invoice = FormatInvoice("Acme Corp", new DateOnly(2025, 6, 10), items);
Console.WriteLine(invoice);`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Strings are immutable — += in loops is O(n²); use StringBuilder. Math.Round uses banker\'s rounding by default. Use decimal for money, not double. Always use DateTime.UtcNow for timestamps; DateOnly for calendar dates. Pass explicit StringComparison for culture-safe comparisons.',
    mustKnow: [
      'String immutability: every += creates a new string. Use StringBuilder in loops (O(n) vs O(n²)).',
      'Math.Round(2.5) = 2 by default (banker\'s rounding). Pass MidpointRounding.AwayFromZero for traditional rounding.',
      'Use decimal (not double) for money — double is binary floating-point and cannot represent 0.1 exactly.',
      'DateTime.UtcNow for timestamps; DateOnly for calendar dates; TimeOnly for time-of-day; DateTimeOffset when preserving the UTC offset matters.',
      'Never mix DateTime.Kind (Local vs Utc) in arithmetic — the result is silently wrong.',
      'String == is ordinal by default. Pass StringComparison.OrdinalIgnoreCase for case-insensitive identifier comparison. Never use .ToLower() for comparison across cultures.',
      'Raw string literals (C# 11) """...""" require zero escaping — ideal for JSON, SQL, and regex embedded in C# code.',
    ],
    interviewFocus: [
      'Why is string += in a loop O(n²)? How does StringBuilder fix it?',
      'What does Math.Round(2.5) return and why? How do you get "school" rounding?',
      'When should you use decimal vs double? (decimal for money — exact base-10; double for science — faster but imprecise)',
      'What is the difference between DateTime and DateTimeOffset? (DateTimeOffset stores explicit UTC offset — unambiguous)',
      'What StringComparison should you use for comparing file paths and why? (OrdinalIgnoreCase — culture-independent, consistent)',
    ],
  };
}
