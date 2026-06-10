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
  selector: 'app-csharp-strings-datetime',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
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
    { name: 'TimeSpan',            type: 'type',     desc: 'Represents a duration — result of subtracting two DateTimes', since: 'C# 1' },
    { name: 'Math',                type: 'class',    desc: 'Static class with Abs, Round, Floor, Ceiling, Pow, Sqrt, Min, Max etc.', since: 'C# 1' },
    { name: 'MathF',               type: 'class',    desc: 'Same as Math but operates on float (single precision) for perf', since: '.NET Core 2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'String immutability and interpolation',
      points: [
        'Strings in C# are immutable — every method like <code>ToUpper()</code>, <code>Replace()</code>, or <code>Trim()</code> returns a <em>new</em> string; the original is unchanged.',
        'String interpolation (<code>$"Hello {name}!"</code>) is the modern, readable alternative to <code>string.Format</code>. Expressions can be complex: <code>$"Total: {items.Sum(x => x.Price):C2}"</code>.',
        'Verbatim strings (<code>@"C:\\Users\\file.txt"</code>) treat backslashes as literals — useful for file paths and regex patterns.',
        'Raw string literals (C# 11) start and end with three or more quotes: <code>"""..."""</code>. No escaping is needed at all, and leading whitespace is stripped to the position of the closing <code>"""</code>.',
      ],
    },
    {
      heading: 'StringBuilder for efficient concatenation',
      points: [
        'Concatenating strings in a loop with <code>+=</code> is O(n²) because each concatenation creates a new string and copies all previous characters.',
        '<code>StringBuilder</code> maintains an internal buffer and only allocates memory when the buffer is full. Appending in a loop is O(n) overall.',
        'Typical use: building CSV rows, SQL queries, HTML fragments, or any string assembled from many parts.',
        'After building, call <code>.ToString()</code> to get the final string. You can also call <code>.Clear()</code> to reuse the builder.',
      ],
    },
    {
      heading: 'DateTime, DateOnly, TimeOnly and TimeSpan',
      points: [
        '<code>DateTime</code> holds both date and time plus a <code>Kind</code> flag (Utc, Local, or Unspecified). Use <code>DateTime.UtcNow</code> for timestamps; never mix Utc and Local in arithmetic.',
        '<code>DateOnly</code> (.NET 6+) stores just the date with no time component — ideal for birthdays, event dates, and any scenario where "3 PM" is irrelevant.',
        '<code>TimeOnly</code> (.NET 6+) stores time of day (midnight to just before midnight) — ideal for opening hours, alarm times, and schedule rules.',
        '<code>TimeSpan</code> is a duration. Subtract two <code>DateTime</code> values to get a <code>TimeSpan</code>. It exposes <code>.TotalHours</code>, <code>.TotalMinutes</code>, <code>.Days</code>, etc.',
      ],
    },
    {
      heading: 'Math and MathF',
      points: [
        'The static <code>Math</code> class operates on <code>double</code>. Key methods: <code>Abs</code>, <code>Round</code>, <code>Floor</code>, <code>Ceiling</code>, <code>Pow</code>, <code>Sqrt</code>, <code>Log</code>, <code>Min</code>, <code>Max</code>, <code>Clamp</code>.',
        '<code>Math.Round</code> uses <em>banker\'s rounding</em> by default (rounds 0.5 to the nearest even number). Pass <code>MidpointRounding.AwayFromZero</code> for the familiar "school" rounding.',
        '<code>MathF</code> is the <code>float</code> counterpart — use it in graphics or game code where <code>float</code> performance matters.',
        'For high-precision financial arithmetic avoid <code>Math</code> with <code>double</code> — use <code>decimal</code> and <code>Math.Round(value, 2, MidpointRounding.AwayFromZero)</code>.',
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
Console.WriteLine(word[^3..]);                    // per   (last 3 chars)`,
    },
    {
      label: 'Interpolation & Literals',
      language: 'csharp',
      code: `string name = "Alice";
int age  = 30;
decimal price = 1234.5m;

// ── Interpolation ──────────────────────────────────────────────────────
Console.WriteLine(\`Hello, \${name}! You are \${age} years old.\`);
Console.WriteLine(\`Price: \${price:C2}\`);          // Price: £1,234.50 (locale-dependent)
Console.WriteLine(\`\${name.ToUpper(),10}\`);         // right-align in 10 chars

// ── string.Format (older but still common in logs) ─────────────────────
string msg = string.Format("{0} is {1} years old.", name, age);

// ── Verbatim string — backslash is literal ─────────────────────────────
string path   = @"C:\\Users\\Alice\\Documents\\file.txt";
string regex  = @"\\d{3}-\\d{4}";   // no double-escaping needed
Console.WriteLine(path);

// ── Raw string literal (C# 11) — zero escaping ─────────────────────────
string json = """
    {
        "name": "Alice",
        "age": 30
    }
    """;
Console.WriteLine(json);

// ── String comparison ──────────────────────────────────────────────────
string a = "hello", b = "HELLO";
Console.WriteLine(a == b);                                               // False
Console.WriteLine(string.Equals(a, b, StringComparison.OrdinalIgnoreCase)); // True`,
    },
    {
      label: 'StringBuilder',
      language: 'csharp',
      code: `using System.Text;

// ── Why StringBuilder matters ──────────────────────────────────────────
// BAD: O(n²) — creates a new string on each iteration
string bad = "";
for (int i = 0; i < 10_000; i++)
    bad += i.ToString();   // 10,000 allocations!

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
    html.AppendLine(\`  <li>\${item}</li>\`);
html.AppendLine("</ul>");

Console.WriteLine(html.ToString());
// <ul>
//   <li>Apple</li>
//   <li>Banana</li>
//   <li>Cherry</li>
// </ul>

// ── Other useful methods ───────────────────────────────────────────────
var sb2 = new StringBuilder("Hello World");
sb2.Insert(5, ",");          // "Hello, World"
sb2.Replace("World", "C#"); // "Hello, C#"
sb2.Remove(0, 7);            // "C#"
Console.WriteLine(sb2);      // C#
Console.WriteLine(sb2.Length); // 2`,
    },
    {
      label: 'DateTime & Math',
      language: 'csharp',
      code: `// ── DateTime ──────────────────────────────────────────────────────────
DateTime now  = DateTime.UtcNow;
DateTime xmas = new DateTime(2025, 12, 25);

TimeSpan until = xmas - now;
Console.WriteLine(\`\${(int)until.TotalDays} days until Christmas\`);

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
Console.WriteLine(\`Age: \${age}\`);

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

  challenge: Challenge = {
    title: 'Invoice Formatter',
    description: `Build a simple invoice formatter.
1. Create a method <code>FormatInvoice(string customer, DateOnly issueDate, decimal[] lineItems)</code> that returns a formatted invoice string built with <code>StringBuilder</code>.
2. The invoice should include: a header with the customer name and issue date (formatted as <code>dd MMM yyyy</code>), each line item numbered and formatted as currency (<code>C2</code>), a subtotal, VAT at 20% (rounded to 2 decimal places, away from zero), and a total.
3. The due date should be 30 days after the issue date. Display it in the header.`,
    language: 'csharp',
    hints: [
      'Use StringBuilder.AppendLine for each row',
      'issueDate.ToDateTime(TimeOnly.MinValue).AddDays(30) gives you the due DateTime, or use DateOnly.AddDays(30)',
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
    DateOnly dueDate = issueDate.AddDays(30);
    decimal subtotal = 0;
    foreach (var item in lineItems) subtotal += item;
    decimal vat   = Math.Round(subtotal * 0.2m, 2, MidpointRounding.AwayFromZero);
    decimal total = subtotal + vat;

    var sb = new StringBuilder();
    sb.AppendLine("===================================");
    sb.AppendLine(\`INVOICE FOR: \${customer}\`);
    sb.AppendLine(\`Issue Date:  \${issueDate.ToString("dd MMM yyyy")}\`);
    sb.AppendLine(\`Due Date:    \${dueDate.ToString("dd MMM yyyy")}\`);
    sb.AppendLine("-----------------------------------");
    for (int i = 0; i < lineItems.Length; i++)
        sb.AppendLine(\`  \${i + 1}. \${lineItems[i]:C2}\`);
    sb.AppendLine("-----------------------------------");
    sb.AppendLine(\`Subtotal:    \${subtotal:C2}\`);
    sb.AppendLine(\`VAT (20%):   \${vat:C2}\`);
    sb.AppendLine(\`TOTAL:       \${total:C2}\`);
    sb.AppendLine("===================================");
    return sb.ToString();
}

decimal[] items = { 120.00m, 45.50m, 89.99m };
string invoice = FormatInvoice("Acme Corp", new DateOnly(2025, 6, 10), items);
Console.WriteLine(invoice);`,
  };

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
      explanation: 'Each <code>string +=</code> creates an entirely new string object — all previous content is copied each time. For n iterations, this is O(n²) in time and O(n²) in allocations. <code>StringBuilder</code> appends to an internal buffer and only copies when the buffer needs to grow, making the total work O(n).',
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
      explanation: 'C# uses <em>banker\'s rounding</em> (also called round-half-to-even) by default. <code>Math.Round(2.5)</code> returns <code>2</code> because 2 is the nearest even integer. Pass <code>MidpointRounding.AwayFromZero</code> as the second argument to get the traditional "round 0.5 up" behaviour.',
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
      explanation: '<code>DateTime</code> always carries a time component and a <code>Kind</code> flag (Utc/Local/Unspecified), which leads to subtle bugs when mixing time zones or comparing dates across midnight. <code>DateOnly</code> stores only year, month, and day — there is no time component to accidentally compare or shift, making it ideal for birthdays, deadlines, and any purely calendar concept.',
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
      explanation: 'Raw string literals (<code>"""..."""</code>, C# 11) do not require any escaping — backslashes, double quotes, and newlines are all literal. The compiler determines the content by stripping the common leading whitespace up to the position of the closing <code>"""</code>. Verbatim strings (<code>@"..."</code>) still require <code>""</code> to represent a literal double-quote character.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between DateTime.Now and DateTime.UtcNow?',
      a: '<code>DateTime.Now</code> returns the current local time with <code>Kind = Local</code> — it respects the machine\'s time-zone offset and DST rules. <code>DateTime.UtcNow</code> returns Coordinated Universal Time with <code>Kind = Utc</code>, which never shifts for DST. For storing timestamps in databases, logging, or any cross-timezone scenario, always prefer <code>DateTime.UtcNow</code> or <code>DateTimeOffset.UtcNow</code>. Convert to local time only at the display layer.',
    },
    {
      q: 'How do I check if a string contains only digits?',
      a: 'Several approaches exist. The most concise is LINQ: <code>str.All(char.IsDigit)</code> — returns <code>true</code> if every character is a digit (0–9). You can also use a regex: <code>Regex.IsMatch(str, @"^\\d+$")</code>. For simple numeric parsing, prefer <code>int.TryParse(str, out _)</code> if you actually want to convert the value — it is fast, allocation-free, and handles edge cases like leading zeros or sign characters correctly.',
    },
    {
      q: 'How do I calculate the number of days between two dates?',
      a: 'Subtract two <code>DateTime</code> or <code>DateOnly</code> values to get a <code>TimeSpan</code> (for DateTime) or an integer (for DateOnly). For DateTime: <code>int days = (int)(endDate - startDate).TotalDays;</code>. For DateOnly (.NET 6+): <code>int days = endDate.DayNumber - startDate.DayNumber;</code>. Always use UTC datetimes in subtraction to avoid DST anomalies where a "day" can appear to have 23 or 25 hours.',
    },
    {
      q: 'When should I use decimal instead of double for numbers?',
      a: '<code>double</code> is a binary floating-point type — fractions like 0.1 cannot be represented exactly, leading to tiny rounding errors (<code>0.1 + 0.2 == 0.30000000000000004</code>). <code>decimal</code> is a base-10 floating-point type that represents common decimal fractions exactly. Use <code>decimal</code> for financial calculations, currency, tax, and anywhere rounding must match human expectations. Use <code>double</code> for scientific calculations, physics, graphics, and anywhere approximate real-number arithmetic is acceptable and performance matters.',
    },
  ];
}
