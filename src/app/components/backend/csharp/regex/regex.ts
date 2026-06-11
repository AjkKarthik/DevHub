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
  selector: 'app-csharp-regex',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './regex.html',
  styleUrl: './regex.scss',
})
export class CsharpRegex {

  quickRef: QuickRefItem[] = [
    { name: 'Regex.IsMatch(s, p)',     type: 'method',    desc: 'true/false test — the cheapest question you can ask a pattern', since: 'C# 1' },
    { name: 'Regex.Match(s, p)',       type: 'method',    desc: 'First match with .Success, .Value, .Groups — check Success before reading', since: 'C# 1' },
    { name: 'Regex.Matches(s, p)',     type: 'method',    desc: 'All non-overlapping matches as a MatchCollection', since: 'C# 1' },
    { name: 'Regex.Replace(s, p, r)',  type: 'method',    desc: 'Replace matches; $1 / ${name} in the replacement refer to groups', since: 'C# 1' },
    { name: '(?<name>…)',              type: 'syntax',    desc: 'Named capture group — read via match.Groups["name"].Value', since: 'C# 1' },
    { name: 'RegexOptions.IgnoreCase', type: 'token',     desc: 'Case-insensitive matching; combine flags with | (Multiline, Compiled…)', since: 'C# 1' },
    { name: 'matchTimeout',            type: 'syntax',    desc: 'Constructor arg that aborts runaway patterns — your ReDoS defence', since: '.NET 4.5' },
    { name: '[GeneratedRegex("p")]',   type: 'decorator', desc: 'Source-generated regex on a partial method — compiled at build time', since: '.NET 7' },
    { name: '@"verbatim"',             type: 'syntax',    desc: 'Always write patterns as verbatim strings so \\d does not need \\\\d', since: 'C# 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Regex API — four verbs cover 95% of use',
      points: [
        '<code>IsMatch</code> answers yes/no, <code>Match</code> returns the first hit, <code>Matches</code> returns them all, <code>Replace</code> rewrites. <code>Split</code> rounds it out for delimiter-based tearing.',
        'A <code>Match</code> is safe to inspect even on failure: check <code>match.Success</code> before touching <code>match.Value</code> — a failed match returns <code>Match.Empty</code>, not null.',
        'Static helpers (<code>Regex.IsMatch(input, pattern)</code>) parse the pattern per call family but cache internally; for hot paths construct one <code>Regex</code> instance (they are thread-safe and immutable) or use <code>[GeneratedRegex]</code>.',
        'Always write patterns as verbatim strings: <code>@"\\d+"</code>. Without <code>@</code>, every backslash must be doubled and patterns become unreadable.',
      ],
    },
    {
      heading: 'Groups and named captures — extracting, not just matching',
      points: [
        'Parentheses capture: in <code>(\\d{4})-(\\d{2})</code>, <code>match.Groups[1]</code> is the year, <code>Groups[2]</code> the month. Group 0 is always the whole match.',
        'Named groups <code>(?&lt;year&gt;\\d{4})</code> survive pattern refactoring — read with <code>match.Groups["year"].Value</code>, and use <code>${year}</code> in Replace templates.',
        'Non-capturing groups <code>(?:…)</code> give you grouping for alternation/quantifiers without paying for (or renumbering) captures.',
        'In Replace, <code>$1</code>/<code>${name}</code> splice captured text into the replacement — the classic "swap date parts" one-liner.',
      ],
    },
    {
      heading: 'Options, timeouts, and the ReDoS threat',
      points: [
        'Common options: <code>IgnoreCase</code>, <code>Multiline</code> (^ and $ match per line), <code>Singleline</code> (. also matches \\n), <code>IgnorePatternWhitespace</code> (lets you format and comment the pattern). Combine with <code>|</code>.',
        '<strong>ReDoS</strong>: patterns with nested quantifiers like <code>(a+)+$</code> backtrack exponentially on crafted input — a 30-character string can hang a thread for minutes. Any regex that sees user input must set <code>matchTimeout</code>; it throws <code>RegexMatchTimeoutException</code> instead of hanging.',
        '<code>RegexOptions.NonBacktracking</code> (.NET 7+) guarantees linear time — immune to ReDoS by construction, at the cost of no backreferences/lookarounds.',
        '<code>RegexOptions.Compiled</code> emits IL for faster matching at the cost of first-use compilation — superseded for most cases by source generation.',
      ],
    },
    {
      heading: '[GeneratedRegex] — and when not to use regex at all',
      points: [
        'Declare a <code>partial</code> method returning <code>Regex</code>, decorate with <code>[GeneratedRegex("pattern")]</code>, and the source generator emits a specialised matcher at build time: no startup cost, AOT-friendly, and the generated code is debuggable.',
        'It also analyses your pattern at compile time — malformed patterns become build errors instead of runtime exceptions.',
        'Skip regex when a string method is enough: <code>Contains</code>, <code>StartsWith</code>, <code>Split</code>, <code>string.IsNullOrWhiteSpace</code> are faster and clearer for fixed text.',
        'Never parse HTML/XML/JSON with regex — nesting is beyond regular languages. Use HtmlAgilityPack, XDocument, or System.Text.Json. And for emails, full RFC validation by regex is folklore: check for one @ and send a confirmation mail instead.',
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
    @"\\[(?<level>\\w+)\\] (?<message>.+)");

if (m.Success)                                  // ALWAYS check first
{
    Console.WriteLine(m.Groups["level"].Value);   // ERROR
    Console.WriteLine(m.Groups["message"].Value); // Payment failed for order #4821
}

// All matches
string text = "Contact: ada@example.com, grace@navy.mil";
foreach (Match hit in Regex.Matches(text, @"[\\w.+-]+@[\\w-]+\\.[\\w.]+"))
    Console.WriteLine(hit.Value);
// ada@example.com
// grace@navy.mil`,
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
string clean = Regex.Replace(messy, @"\\s+", " ");  // "too many spaces"`,
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
}

// Usage — call the partial method to get the cached instance
bool ok = Validators.Email().IsMatch("ada@example.com");   // true

var phone = Validators.UsPhone().Match("555-867-5309");
if (phone.Success)
    Console.WriteLine(phone.Groups["area"].Value);          // 555

// Compare with the runtime alternatives:
// new Regex(p)                    — parsed at runtime, every startup
// new Regex(p, RegexOptions.Compiled) — IL-compiled at first use (slow start)
// [GeneratedRegex]                — everything done before you even run`,
    },
  ];

  challenge: Challenge = {
    title: 'Log Line Parser',
    language: 'csharp',
    description: 'Write a method ParseLogLine(string line) that uses one regex with named groups to parse lines like "2026-06-11 14:32:09 [WARN] Disk usage at 91%" into a record LogEntry(DateTime Timestamp, string Level, string Message). Return null for lines that do not match. Protect the regex with a 200ms match timeout, and reject (return null) lines longer than 2000 chars before running the regex.',
    hints: [
      'Pattern: ^(?<ts>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[(?<level>[A-Z]+)\\] (?<msg>.+)$',
      'Create the Regex once as a static readonly field with matchTimeout',
      'DateTime.ParseExact with format "yyyy-MM-dd HH:mm:ss"',
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
        try
        {
            m = LinePattern.Match(line);
        }
        catch (RegexMatchTimeoutException)
        {
            return null;                          // hostile input — reject
        }

        if (!m.Success) return null;

        var ts = DateTime.ParseExact(
            m.Groups["ts"].Value,
            "yyyy-MM-dd HH:mm:ss",
            CultureInfo.InvariantCulture);

        return new LogEntry(ts, m.Groups["level"].Value, m.Groups["msg"].Value);
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What should you always check before reading match.Value?',
      options: [
        'match != null — failed matches return null',
        'match.Success — failed matches return Match.Empty, not null',
        'match.Length > 0 — empty matches throw',
        'Nothing — Match always succeeds or throws',
      ],
      answer: 1,
      explanation: 'Regex.Match never returns null; on failure it returns Match.Empty whose Success is false and Value is "". Reading group values from a failed match silently gives empty strings — a classic source of bugs.',
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
      explanation: 'On input like "aaaa…a!" the engine tries exponentially many ways to split the a-run between the inner and outer +, hanging the thread. Defend with matchTimeout or RegexOptions.NonBacktracking (.NET 7+).',
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
      explanation: 'Nested structures (HTML/XML/JSON) are not regular languages — regex cannot track balanced tags. Use a real parser (HtmlAgilityPack, XDocument, System.Text.Json). The other tasks are flat pattern matching, regex territory.',
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
      a: 'The replacement template can reference them by name: <code>Regex.Replace(s, @"(?&lt;m&gt;\\d2)/(?&lt;d&gt;\\d2)/(?&lt;y&gt;\\d4)", "${y}-${m}-${d}")</code> reorders date parts in one call. Numbered references (<code>$1</code>) work too but silently break when you add a group earlier in the pattern.',
    },
    {
      q: 'What is greedy vs lazy matching?',
      a: 'Quantifiers are greedy by default — <code>".+"</code> grabs as much as possible, so on <code>"a","b"</code> it matches from the first quote to the last. Adding <code>?</code> makes it lazy: <code>".+?"</code> stops at the first closing quote. Greediness mismatches are the most common "my regex matches too much" bug.',
    },
    {
      q: 'Is validating emails with regex a good idea?',
      a: 'Only loosely. The full RFC 5322 grammar is famously unmatchable in a maintainable pattern, and a syntactically valid address can still not exist. Pragmatic approach: a simple shape check (<code>something@something.tld</code>) to catch typos, then verify by actually sending a confirmation email.',
    },
    {
      q: 'What does RegexOptions.NonBacktracking trade away?',
      a: 'It runs in guaranteed linear time (DFA-based, immune to ReDoS) but cannot support constructs that need backtracking memory: backreferences (<code>\\1</code>), lookbehind/lookahead, and atomic groups. If your pattern avoids those — most validation patterns do — it is the safest engine choice on .NET 7+.',
    },
  ];
}
