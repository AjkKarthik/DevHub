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
  selector: 'app-csharp-regex',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './regex.html',
  styleUrl: './regex.scss',
})
export class CsharpRegex {

  quickRef: QuickRefItem[] = [
    { name: 'Regex.IsMatch(s, p)',       type: 'method',    desc: 'true/false test — the cheapest question you can ask a pattern', since: 'C# 1' },
    { name: 'Regex.Match(s, p)',         type: 'method',    desc: 'First match with .Success, .Value, .Groups — check Success before reading', since: 'C# 1' },
    { name: 'Regex.Matches(s, p)',       type: 'method',    desc: 'All non-overlapping matches as a MatchCollection', since: 'C# 1' },
    { name: 'Regex.Replace(s, p, r)',    type: 'method',    desc: 'Replace matches; $1 / ${name} in the replacement refer to groups', since: 'C# 1' },
    { name: '(?<name>…)',                type: 'syntax',    desc: 'Named capture group — read via match.Groups["name"].Value', since: 'C# 1' },
    { name: '(?:…)',                     type: 'syntax',    desc: 'Non-capturing group — grouping without creating a capture', since: 'C# 1' },
    { name: '(?=…) / (?!…)',             type: 'syntax',    desc: 'Positive / negative lookahead — zero-width assertion, does not consume input', since: 'C# 1' },
    { name: '(?<=…) / (?<!…)',           type: 'syntax',    desc: 'Positive / negative lookbehind — checks what came before, zero-width', since: 'C# 1' },
    { name: 'RegexOptions.IgnoreCase',   type: 'token',     desc: 'Case-insensitive matching; combine flags with | (Multiline, Compiled…)', since: 'C# 1' },
    { name: 'matchTimeout',              type: 'syntax',    desc: 'Constructor arg that aborts runaway patterns — your ReDoS defence', since: '.NET 4.5' },
    { name: '[GeneratedRegex("p")]',     type: 'decorator', desc: 'Source-generated regex on a partial method — compiled at build time, AOT-safe', since: '.NET 7' },
    { name: 'NonBacktracking',           type: 'token',     desc: 'Linear-time engine immune to ReDoS — no backreferences or lookarounds', since: '.NET 7' },
    { name: '@"verbatim"',               type: 'syntax',    desc: 'Always write patterns as verbatim strings so \\d does not need \\\\d', since: 'C# 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Regex API — four verbs cover 95% of use',
      points: [
        '<code>IsMatch</code> answers yes/no, <code>Match</code> returns the first hit, <code>Matches</code> returns them all, <code>Replace</code> rewrites. <code>Split</code> rounds it out for delimiter-based splitting. All five are the entry points you reach for first.',
        'A <code>Match</code> is safe to inspect even on failure — check <code>match.Success</code> before touching <code>match.Value</code>. A failed match returns <code>Match.Empty</code>, not null, so skipping the Success check quietly gives you empty strings instead of errors.',
        'Static helpers (<code>Regex.IsMatch(input, pattern)</code>) parse the pattern on each distinct call site but cache internally. For hot paths, construct one <code>static readonly Regex</code> — instances are immutable and thread-safe — or use <code>[GeneratedRegex]</code>.',
        'Always write patterns as verbatim strings: <code>@"\\d+"</code>. Without <code>@</code>, every backslash must be doubled and patterns become unreadable and error-prone. The verbatim prefix is a non-negotiable convention for regex code.',
        '<code>Regex.Replace</code> also accepts a <code>MatchEvaluator</code> delegate — a function that receives each match and returns its replacement string. This lets you compute replacements in code (format currency, lookup a table, etc.) without multiple passes.',
      ],
    },
    {
      heading: 'Groups and named captures — extracting, not just matching',
      points: [
        'Parentheses capture: in <code>(\\d{4})-(\\d{2})</code>, <code>match.Groups[1]</code> is the year, <code>Groups[2]</code> the month. Group 0 is always the whole match — groups are 1-indexed for captured groups.',
        'Named groups <code>(?&lt;year&gt;\\d{4})</code> survive pattern refactoring — read with <code>match.Groups["year"].Value</code>, and reference with <code>${year}</code> in Replace templates. Prefer named groups any time you have more than one capture.',
        'Non-capturing groups <code>(?:…)</code> provide grouping for alternation and quantifiers without creating a capture or shifting group numbering. Use them when you need grouping but not extraction.',
        'In Replace, <code>$1</code>/<code>${name}</code> splice captured text into the replacement. The MatchEvaluator override lets you write a C# lambda to compute the replacement: useful for unit conversion, formatting, or database lookups.',
        '<code>match.Groups</code> is a keyed collection — you can iterate it with <code>foreach</code> or look up by name or index. <code>group.Captures</code> exposes all repetitions when the same group is captured multiple times (e.g., <code>(?&lt;item&gt;\\w+)(,(?&lt;item&gt;\\w+))*</code>).',
      ],
    },
    {
      heading: 'Options, timeouts, and the ReDoS threat',
      points: [
        'Common options: <code>IgnoreCase</code>, <code>Multiline</code> (^ and $ match per line), <code>Singleline</code> (. also matches \\n), <code>IgnorePatternWhitespace</code> (lets you format and comment the pattern — # marks the rest of the line as a comment). Combine with <code>|</code>.',
        '<strong>ReDoS</strong>: patterns with nested quantifiers like <code>(a+)+$</code> backtrack exponentially on crafted input — a 30-character string can hang a thread for minutes. Any regex that processes user input must set <code>matchTimeout</code>; it throws <code>RegexMatchTimeoutException</code> instead of hanging indefinitely.',
        '<code>RegexOptions.NonBacktracking</code> (.NET 7+) guarantees O(n) linear time — immune to ReDoS by construction, because it uses a DFA-based engine. The trade-off: backreferences and lookarounds are not supported. Most pure validation patterns qualify.',
        '<code>RegexOptions.Compiled</code> emits IL at first use for faster matching on .NET Framework and older .NET, at the cost of a slow first call and more memory. On modern .NET, <code>[GeneratedRegex]</code> is strictly better — it does the same at compile time with no runtime overhead.',
        'You can set a process-wide default timeout with <code>AppDomain.CurrentDomain.SetData("REGEX_DEFAULT_MATCH_TIMEOUT", TimeSpan.FromSeconds(1))</code> — a safety net for any regex you forgot to protect.',
      ],
    },
    {
      heading: 'Lookaheads, lookbehinds, and zero-width assertions',
      points: [
        'Lookaheads and lookbehinds are <em>zero-width</em> — they assert what is around a match without consuming characters. This lets you match content based on context without including that context in the match itself.',
        '<code>(?=pattern)</code> is a positive lookahead: "this position is followed by pattern". For example, <code>\\d+(?= dollars)</code> matches a number only if the word "dollars" follows it — but "dollars" is not included in the match.',
        '<code>(?!pattern)</code> is a negative lookahead: "this position is NOT followed by pattern". Used to exclude certain suffixes: <code>foo(?!bar)</code> matches "foo" not followed by "bar".',
        '<code>(?&lt;=pattern)</code> / <code>(?&lt;!pattern)</code> are lookbehind equivalents — they check what comes before. <code>(?&lt;=\\$)\\d+</code> matches digits preceded by a dollar sign without capturing the sign.',
        'Lookarounds are the idiomatic way to build "conditional" patterns. The <code>NonBacktracking</code> engine does not support them — if you need lookarounds, use the standard engine with a timeout instead.',
      ],
    },
    {
      heading: '[GeneratedRegex] and compile-time analysis',
      points: [
        'Declare a <code>partial static</code> method returning <code>Regex</code>, decorate with <code>[GeneratedRegex("pattern")]</code>, and the source generator emits a specialised matcher at build time: no startup cost, no heap allocation for the Regex object, and AOT/trimming-friendly.',
        'The generator also analyses your pattern at compile time — malformed patterns are build errors, not runtime exceptions. This catches typos before they ever ship.',
        'You can add options as a second argument: <code>[GeneratedRegex(@"\\d+", RegexOptions.IgnoreCase)]</code>. A <code>matchTimeout</code> parameter is also supported for per-invocation safety.',
        'Skip regex when a string method is enough: <code>Contains</code>, <code>StartsWith</code>, <code>IndexOf</code>, and <code>Split</code> are faster and far clearer for fixed-text operations. Regex carries cognitive overhead; reserve it for genuine patterns.',
        'Never parse HTML/XML/JSON with regex — nesting exceeds regular-language capability. Use <code>HtmlAgilityPack</code>, <code>XDocument</code>, or <code>System.Text.Json</code>. And for emails, RFC 5322 is too complex to validate fully; check one @ and send a confirmation email instead.',
      ],
    },
    {
      heading: 'Performance patterns and Span-based APIs',
      points: [
        '<code>Regex</code> instances are thread-safe and immutable — declare them <code>static readonly</code> and share them freely. Creating a new <code>new Regex(pattern)</code> on every call parses the pattern every time and is the most common Regex performance mistake.',
        '.NET 7+ added <code>Regex.Match(ReadOnlySpan&lt;char&gt;)</code> and related overloads, accepting a <code>Span</code> or slice of a string without allocating a substring. This is critical for high-throughput parsers operating on slices of a large buffer.',
        '<code>Regex.Count(input, pattern)</code> (.NET 7+) counts matches without allocating a <code>MatchCollection</code> — use it when you only need the count, not the match details.',
        '<code>Regex.EnumerateMatches(input)</code> returns a <code>ref struct</code> enumerator over <code>ValueMatch</code> structs — zero-allocation iteration when you only need the index/length of each match and can look the text up yourself.',
        'For very hot paths that go beyond regex — tokenizers, binary protocol parsers — <code>System.Text.RegularExpressions</code> may still be slower than a hand-written state machine using <code>ReadOnlySpan&lt;char&gt;</code>. Profile before optimising; <code>[GeneratedRegex]</code> closes most of the gap for typical workloads.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Match & extract',
      language: 'csharp',
      code: `using System.Text.RegularExpressions;

string log = "2026-06-11 14:32:09 [ERROR] Payment failed for order #4821";

// Yes/no
bool isError = Regex.IsMatch(log, @"\\[ERROR\\]");          // true

// First match + named groups
var m = Regex.Match(log,
    @"(?<date>\\d{4}-\\d{2}-\\d{2}) (?<time>\\d{2}:\\d{2}:\\d{2}) " +
    @"\\[(?<level>\\w+)\\] (?<msg>.+)");

if (m.Success)                                  // ALWAYS check first
{
    Console.WriteLine(m.Groups["level"].Value);   // ERROR
    Console.WriteLine(m.Groups["msg"].Value);     // Payment failed for order #4821
}

// All matches
string text = "Contact: ada@example.com, grace@navy.mil";
foreach (Match hit in Regex.Matches(text, @"[\\w.+-]+@[\\w-]+\\.[\\w.]+"))
    Console.WriteLine(hit.Value);
// ada@example.com
// grace@navy.mil

// Iterate groups collection
var dateMatch = Regex.Match("2026-06-11", @"(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})");
foreach (Group g in dateMatch.Groups)
    Console.WriteLine($"{g.Name}: {g.Value}");
// 0: 2026-06-11   1: 2026   2: 06   3: 11
// y: 2026   m: 06   d: 11`,
    },
    {
      label: 'Replace & split',
      language: 'csharp',
      code: `// Group references in the replacement: swap date format
string us = "Due 06/11/2026 and 12/25/2026";
string iso = Regex.Replace(us,
    @"(?<m>\\d{2})/(?<d>\\d{2})/(?<y>\\d{4})",
    "\${y}-\${m}-\${d}");
// "Due 2026-06-11 and 2026-12-25"

// MatchEvaluator: compute the replacement in code
string prices = "Widget $9.99, Gadget $24.50";
string discounted = Regex.Replace(prices, @"\\$(\\d+\\.\\d{2})",
    m => "$" + (decimal.Parse(m.Groups[1].Value) * 0.9m).ToString("F2"));
// "Widget $8.99, Gadget $22.05"

// Split on flexible whitespace/punctuation
string csvish = "alpha,  beta;gamma | delta";
string[] parts = Regex.Split(csvish, @"\\s*[,;|]\\s*");
// ["alpha", "beta", "gamma", "delta"]

// Collapse runs of whitespace
string messy = "too    many\\t\\tspaces";
string clean = Regex.Replace(messy, @"\\s+", " ");  // "too many spaces"

// Regex.Count — count without allocating MatchCollection (.NET 7+)
int vowelCount = Regex.Count("hello world", @"[aeiou]"); // 3`,
    },
    {
      label: 'Timeouts (ReDoS)',
      language: 'csharp',
      code: `// ❌ Evil pattern + crafted input = exponential backtracking
// Regex.IsMatch("aaaaaaaaaaaaaaaaaaaaaaaaaaaaa!", @"^(a+)+$")
//   → can hang the thread for minutes. Never run user input unguarded.

// ✅ Instance with a timeout — fails fast instead of hanging
var safe = new Regex(@"^(a+)+$",
    RegexOptions.None,
    matchTimeout: TimeSpan.FromMilliseconds(250));

try
{
    safe.IsMatch(userInput);
}
catch (RegexMatchTimeoutException)
{
    // log + reject the input; the thread is free again
}

// ✅✅ .NET 7+: NonBacktracking — linear time, ReDoS-immune
var linear = new Regex(@"^(a+)+$", RegexOptions.NonBacktracking);
linear.IsMatch(new string('a', 100_000) + "!");   // returns quickly

// (NonBacktracking trade-off: no backreferences or lookarounds)

// Process-wide default timeout for any regex you forgot:
AppDomain.CurrentDomain.SetData(
    "REGEX_DEFAULT_MATCH_TIMEOUT", TimeSpan.FromSeconds(1));`,
    },
    {
      label: '[GeneratedRegex]',
      language: 'csharp',
      code: `using System.Text.RegularExpressions;

public static partial class Validators
{
    // Source generator writes the matcher at BUILD time:
    // zero startup cost, AOT-friendly, pattern errors = compile errors.
    [GeneratedRegex(@"^[\\w.+-]+@[\\w-]+\\.[\\w.]{2,}$",
        RegexOptions.IgnoreCase)]
    public static partial Regex Email();

    [GeneratedRegex(@"^(?<area>\\d{3})-(?<num>\\d{3}-\\d{4})$")]
    public static partial Regex UsPhone();

    // With matchTimeout for user-facing patterns:
    [GeneratedRegex(@"^[\\s\\S]{1,2000}$",
        RegexOptions.None, matchTimeoutMilliseconds: 200)]
    public static partial Regex SafeLength();
}

// Usage — call the partial method to get the cached instance
bool ok = Validators.Email().IsMatch("ada@example.com");   // true

var phone = Validators.UsPhone().Match("555-867-5309");
if (phone.Success)
    Console.WriteLine(phone.Groups["area"].Value);          // 555

// Compare with the runtime alternatives:
// new Regex(p)                         — parsed at runtime, every startup
// new Regex(p, RegexOptions.Compiled)  — IL-compiled at first use (slow start)
// [GeneratedRegex]                     — everything done at build time`,
    },
    {
      label: 'Lookaheads & Span API',
      language: 'csharp',
      code: `// ── Lookahead ────────────────────────────────────────────────────────
// Positive lookahead: match digits followed by " dollars" (without including "dollars")
var priceMatch = Regex.Match("100 dollars or 50 euros", @"\\d+(?= dollars)");
Console.WriteLine(priceMatch.Value);   // 100   (not "100 dollars")

// Negative lookahead: match "foo" NOT followed by "bar"
foreach (Match m in Regex.Matches("foobar foobaz foo", @"foo(?!bar)"))
    Console.WriteLine($"[{m.Value}] at {m.Index}");  // foobaz, foo

// Lookbehind: match digits preceded by "$" (without capturing $)
foreach (Match m in Regex.Matches("$12.99 and €9.00", @"(?<=\\$)\\d+"))
    Console.WriteLine(m.Value);   // 12  (only the dollar amount)

// Negative lookbehind: match "log" not preceded by "cat"
bool ok = Regex.IsMatch("dialog", @"(?<!cat)log");   // true  (dia-log)
bool no = Regex.IsMatch("catalog", @"(?<!cat)log");  // false (cat-a-log)

// ── Zero-allocation Span APIs (.NET 7+) ───────────────────────────────
ReadOnlySpan<char> data = "event_id=42&user_id=7&session=abc".AsSpan();

// Match on a span — no substring allocation
[GeneratedRegex(@"\\d+")]
static partial Regex Numbers();

// EnumerateMatches: ValueMatch ref structs — zero allocation
foreach (ValueMatch vm in Numbers().EnumerateMatches(data))
{
    // vm.Index, vm.Length — look up the text yourself:
    var slice = data.Slice(vm.Index, vm.Length);
    Console.WriteLine(slice.ToString());   // 42, 7
}

// Count without MatchCollection:
int digits = Numbers().Count(data);   // 3`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Reading group values without checking match.Success',
      wrong: `var m = Regex.Match(input, @"(\\d{4})-(\\d{2})");
string year = m.Groups[1].Value;   // "" if no match — silent bug`,
      right: `var m = Regex.Match(input, @"(\\d{4})-(\\d{2})");
if (!m.Success) return null;
string year = m.Groups[1].Value;   // safe`,
      explanation: 'Regex.Match never returns null — on failure it returns Match.Empty. Reading group values without checking Success silently gives you empty strings. Always check m.Success before accessing groups or m.Value.',
    },
    {
      title: 'Creating new Regex instances in a hot path',
      wrong: `// Called thousands of times per second:
public bool IsValidEmail(string s)
    => new Regex(@"^[\\w.+-]+@[\\w-]+\\.[\\w.]{2,}$").IsMatch(s);
// Parses the pattern on every call`,
      right: `// Parsed/generated once, reused freely (Regex is thread-safe):
[GeneratedRegex(@"^[\\w.+-]+@[\\w-]+\\.[\\w.]{2,}$")]
private static partial Regex EmailRegex();

public bool IsValidEmail(string s) => EmailRegex().IsMatch(s);`,
      explanation: 'Constructing new Regex objects parses the pattern on every call, which is expensive. Declare patterns as static readonly fields or use [GeneratedRegex] so the work happens once at startup (or build time). Regex instances are immutable and thread-safe — sharing them is always safe.',
    },
    {
      title: 'No matchTimeout on patterns that touch user input',
      wrong: `// User-controlled input, no timeout:
bool valid = Regex.IsMatch(userQuery, @"^(\\w+\\s*)+$");
// A crafted string can hang the thread for minutes (ReDoS)`,
      right: `// Safe: timeout throws RegexMatchTimeoutException instead of hanging
private static readonly Regex SafeQuery = new(
    @"^(\\w+\\s*)+$",
    RegexOptions.None,
    TimeSpan.FromMilliseconds(250));

try { bool valid = SafeQuery.IsMatch(userQuery); }
catch (RegexMatchTimeoutException) { /* reject */ }`,
      explanation: 'Patterns with nested quantifiers (like (\\w+\\s*)+) backtrack exponentially on crafted input — a ReDoS attack can block a thread or crash a server. Always set matchTimeout on any Regex that processes user-supplied input. On .NET 7+, RegexOptions.NonBacktracking eliminates the risk for patterns that can avoid backreferences.',
    },
    {
      title: 'Using numbered group references ($1) in Replace when patterns may change',
      wrong: `// $1 = year, $2 = month — fragile: add one group, all numbers shift
string result = Regex.Replace(date,
    @"(\\d{4})-(\\d{2})-(\\d{2})",
    "$3/$2/$1");  // breaks if you add a group earlier`,
      right: `// Named references survive refactoring:
string result = Regex.Replace(date,
    @"(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})",
    "\${d}/\${m}/\${y}");`,
      explanation: 'Numbered back-references silently break if you add or reorder capture groups — a hard-to-spot regression. Named groups ($name / ${name}) are self-documenting and refactoring-safe. Prefer them any time you have more than one capture in a Replace pattern.',
    },
    {
      title: 'Using regex to parse structured formats (HTML, JSON, XML, CSV)',
      wrong: `// Parsing HTML tags with regex — broken on any real HTML
var title = Regex.Match(html, @"<title>(.+?)</title>").Groups[1].Value;
// Fails on multiline titles, attributes, encoded chars, nesting, etc.`,
      right: `// Use a real parser for structured formats:
var doc = new HtmlDocument();
doc.LoadHtml(html);
var title = doc.DocumentNode.SelectSingleNode("//title")?.InnerText;

// For JSON: System.Text.Json
// For XML: XDocument.Parse(xml).Root?.Element("title")?.Value`,
      explanation: 'HTML, XML, JSON, and CSV can have nesting, escaping, multiline content, and encoding that regex cannot handle correctly. Use purpose-built parsers: HtmlAgilityPack for HTML, XDocument for XML, System.Text.Json for JSON. Regex on structured data always breaks on edge cases and is a recurring interview red flag.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What should you always check before reading match.Value or match.Groups?',
      options: [
        'match != null — failed matches return null',
        'match.Success — failed matches return Match.Empty, not null',
        'match.Length > 0 — empty matches throw',
        'Nothing — Match always succeeds or throws',
      ],
      answer: 1,
      explanation: 'Regex.Match never returns null; on failure it returns Match.Empty whose Success is false and Value is "". Reading group values from a failed match silently gives empty strings — a classic silent bug. Always guard with <code>if (m.Success)</code>.',
    },
    {
      q: 'Why is the pattern ^(a+)+$ dangerous on user input?',
      options: [
        'It matches too many strings',
        'Nested quantifiers cause catastrophic backtracking — crafted input takes exponential time (ReDoS)',
        'It allocates one string per character',
        'The ^ anchor is invalid inside groups',
      ],
      answer: 1,
      explanation: 'On input like "aaaa…a!" the engine tries exponentially many ways to split the run between inner and outer quantifiers. Defend with <code>matchTimeout</code> (throws instead of hanging) or <code>RegexOptions.NonBacktracking</code> (.NET 7+, O(n) guaranteed).',
    },
    {
      q: 'What does [GeneratedRegex] give you over new Regex(pattern)?',
      options: [
        'Patterns can use features unavailable at runtime',
        'Compile-time generation: no startup parse cost, AOT-friendly, and invalid patterns fail the build',
        'Automatic caching of match results',
        'It is required for named groups',
      ],
      answer: 1,
      explanation: 'The source generator analyses the pattern during compilation and emits a specialised matcher into your assembly — startup pays nothing, trimming/AOT work, and a typo in the pattern is a compiler error instead of a runtime exception.',
    },
    {
      q: 'When is regex the WRONG tool?',
      options: [
        'Extracting dates from log lines',
        'Validating a postcode format',
        'Parsing nested HTML to find specific elements',
        'Collapsing repeated whitespace',
      ],
      answer: 2,
      explanation: 'Nested structures (HTML/XML/JSON) are not regular languages — regex cannot handle balanced tags, encoding, or multiline content reliably. Use a real parser. The other tasks are flat pattern matching, which is what regex does best.',
    },
    {
      q: 'What does adding ? after a quantifier (e.g., +?) do?',
      options: [
        'Makes the quantifier optional — matches 0 or 1 times',
        'Switches the quantifier from greedy to lazy — it matches as few characters as possible',
        'Creates a named group',
        'Makes the quantifier possessive — no backtracking allowed',
      ],
      answer: 1,
      explanation: 'Quantifiers are greedy by default: <code>.+</code> grabs as much as possible. Adding <code>?</code> makes it lazy: <code>.+?</code> stops at the earliest possible match. This is the fix for "my regex matches too much": <code>&lt;.+&gt;</code> captures everything between first < and last >, while <code>&lt;.+?&gt;</code> captures each tag individually.',
    },
    {
      q: 'What is the difference between (?:…) and (…)?',
      options: [
        '(?:…) is a named group; (…) is a numbered group',
        '(?:…) is a non-capturing group — it groups for quantifiers/alternation but does not create a capture; (…) creates a numbered capture',
        '(?:…) is required for alternation; (…) is required for repetition',
        'There is no difference — both capture',
      ],
      answer: 1,
      explanation: '<code>(?:…)</code> is a non-capturing group. It gives you grouping power (alternation, quantifiers) without allocating a capture slot, which keeps group numbering stable and avoids the overhead of storing the captured text. Use <code>(?:…)</code> by default unless you actually need to extract the group.',
    },
    {
      q: 'What does the positive lookahead (?=pattern) do?',
      options: [
        'Matches the literal string "pattern"',
        'It is a zero-width assertion — confirms the position is followed by pattern without consuming those characters',
        'Captures the text matching pattern into the next group',
        'It is equivalent to (?:pattern) but case-insensitive',
      ],
      answer: 1,
      explanation: 'Lookaheads are zero-width: the engine checks that pattern follows the current position, but if it matches the assertion, the engine does not advance the position. So <code>\\d+(?= dollars)</code> matches the number without including "dollars" in the result. Negative lookahead <code>(?!pattern)</code> asserts the opposite.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use static Regex methods or create an instance?',
      a: 'Static methods (<code>Regex.IsMatch(input, pattern)</code>) are fine for occasional use — .NET caches the last few parsed patterns. For hot paths, store a <code>static readonly Regex</code> (instances are immutable and thread-safe), and on .NET 7+ prefer <code>[GeneratedRegex]</code> which moves all the work to compile time.',
    },
    {
      q: 'What is the difference between Multiline and Singleline options?',
      a: 'Confusingly, they are independent. <code>Multiline</code> changes the anchors: <code>^</code>/<code>$</code> match at every line boundary instead of only string start/end. <code>Singleline</code> changes the dot: <code>.</code> also matches newline characters. A pattern can use both at once.',
    },
    {
      q: 'How do named groups improve Replace?',
      a: 'The replacement template can reference them by name: <code>Regex.Replace(s, @"(?&lt;y&gt;\\d{4})-(?&lt;m&gt;\\d{2})", "${m}/${y}")</code> reorders date parts in one call. Numbered references (<code>$1</code>) work too but silently break when you add a group earlier in the pattern. Prefer named groups whenever you have more than one capture.',
    },
    {
      q: 'What is greedy vs lazy matching?',
      a: 'Quantifiers are greedy by default — <code>.+</code> grabs as much as possible, so on <code>"a","b"</code> it matches from the first quote all the way to the last. Adding <code>?</code> makes it lazy: <code>.+?</code> stops at the first closing quote. Greediness mismatches — "my regex matches too much" — are the most common Regex debugging complaint.',
    },
    {
      q: 'Is validating emails with regex a good idea?',
      a: 'Only loosely. The full RFC 5322 grammar is famously un-matchable in a maintainable pattern, and a syntactically valid address may still not exist. Pragmatic approach: a simple shape check (<code>something@something.tld</code>) to catch typos, then verify by actually sending a confirmation email.',
    },
    {
      q: 'What does RegexOptions.NonBacktracking trade away?',
      a: 'It runs in guaranteed O(n) linear time (DFA-based, immune to ReDoS) but cannot support constructs that need backtracking memory: backreferences (<code>\\1</code>), lookahead/lookbehind assertions, and atomic groups. If your pattern avoids those — most validation patterns do — it is the safest engine choice on .NET 7+.',
    },
    {
      q: 'What are the zero-allocation Regex APIs in .NET 7+?',
      a: '<ul><li><code>Regex.Count(span, pattern)</code> — counts matches without allocating a MatchCollection</li><li><code>Regex.EnumerateMatches(span)</code> — returns a ref-struct enumerator of <code>ValueMatch</code> structs (index + length only, zero allocations)</li><li><code>Regex.Match(ReadOnlySpan&lt;char&gt;, ...)</code> — runs on a span slice, avoiding substring allocation</li></ul>These matter in high-throughput log parsers and binary protocol handlers where every allocation counts.',
    },
  ];

  challenge: Challenge = {
    title: 'Log Line Parser',
    language: 'csharp',
    description: 'Write a method ParseLogLine(string line) that uses one regex with named groups to parse lines like "2026-06-11 14:32:09 [WARN] Disk usage at 91%" into a record LogEntry(DateTime Timestamp, string Level, string Message). Return null for lines that do not match. Protect the regex with a 200ms match timeout, and reject (return null) lines longer than 2000 chars before running the regex.',
    hints: [
      'Pattern: ^(?<ts>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[(?<level>[A-Z]+)\\] (?<msg>.+)$',
      'Create the Regex once as a static readonly field with matchTimeout',
      'DateTime.ParseExact with format "yyyy-MM-dd HH:mm:ss" and CultureInfo.InvariantCulture',
      'Catch RegexMatchTimeoutException and return null',
    ],
    starterCode: `public record LogEntry(DateTime Timestamp, string Level, string Message);

public static class LogParser
{
    // TODO: static Regex with named groups + 200ms timeout

    public static LogEntry? ParseLogLine(string line)
    {
        // TODO: length guard, match, parse groups
        throw new NotImplementedException();
    }
}`,
    solution: `using System.Globalization;
using System.Text.RegularExpressions;

public record LogEntry(DateTime Timestamp, string Level, string Message);

public static class LogParser
{
    private static readonly Regex LinePattern = new(
        @"^(?<ts>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) " +
        @"\\[(?<level>[A-Z]+)\\] (?<msg>.+)$",
        RegexOptions.None,
        TimeSpan.FromMilliseconds(200));          // ReDoS guard

    public static LogEntry? ParseLogLine(string line)
    {
        if (string.IsNullOrEmpty(line) || line.Length > 2000)
            return null;                          // cheap guard before regex

        Match m;
        try { m = LinePattern.Match(line); }
        catch (RegexMatchTimeoutException) { return null; }

        if (!m.Success) return null;

        var ts = DateTime.ParseExact(
            m.Groups["ts"].Value,
            "yyyy-MM-dd HH:mm:ss",
            CultureInfo.InvariantCulture);

        return new LogEntry(ts, m.Groups["level"].Value, m.Groups["msg"].Value);
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'The Regex API provides IsMatch/Match/Matches/Replace/Split; named groups (?<name>...) enable readable extraction and safe Replace templates; [GeneratedRegex] moves pattern compilation to build time; all user-facing patterns must have matchTimeout or use NonBacktracking to prevent ReDoS.',
    mustKnow: [
      'Always check <code>match.Success</code> before reading <code>match.Value</code> or groups — failed matches return <code>Match.Empty</code>, not null',
      'Declare patterns <code>static readonly</code> or use <code>[GeneratedRegex]</code> — never construct <code>new Regex(...)</code> in a hot path',
      'Set <code>matchTimeout</code> on any regex that processes user input — nested quantifiers enable ReDoS attacks that hang threads indefinitely',
      '<code>RegexOptions.NonBacktracking</code> (.NET 7+) guarantees O(n) time at the cost of no backreferences or lookarounds',
      'Lookaheads <code>(?=…)</code> and lookbehinds <code>(?&lt;=…)</code> are zero-width — they assert context without consuming characters or adding to the match',
      'Adding <code>?</code> after a quantifier makes it lazy (<code>.+?</code>) — matches as few chars as possible; greedy is the default',
      'Regex cannot parse HTML/XML/JSON/CSV reliably — use dedicated parsers for structured formats',
    ],
    interviewFocus: [
      'What is ReDoS and how do you prevent it in .NET?',
      'What does [GeneratedRegex] do differently from new Regex() or RegexOptions.Compiled?',
      'When should you prefer a string method (Contains, Split) over regex?',
      'What is the difference between a capturing group (…) and a non-capturing group (?:…)?',
      'What is a lookahead? Give an example of when you would use one.',
    ],
  };
}
