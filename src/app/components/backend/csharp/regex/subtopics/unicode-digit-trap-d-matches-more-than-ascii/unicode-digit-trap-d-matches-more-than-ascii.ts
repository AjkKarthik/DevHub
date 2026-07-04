import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-unicode-digit-trap-d-matches-more-than-ascii-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './unicode-digit-trap-d-matches-more-than-ascii.html',
  styleUrl: './unicode-digit-trap-d-matches-more-than-ascii.scss',
})
export class UnicodeDigitTrapDMatchesMoreThanAsciiSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own patterns rely on \\d meaning "a digit" — .NET\'s default definition of "digit" is much broader than ASCII 0-9',
      points: [
        'The main Regular Expressions page uses <code>\\d</code> throughout its own examples (log timestamps, phone numbers, email validation helpers) assuming it matches the ASCII characters "0" through "9". By DEFAULT, .NET\'s <code>\\d</code> actually matches any character in the Unicode <code>Nd</code> (Decimal Digit Number) category — this includes Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩), Devanagari digits (०१२३४५६७८९), fullwidth digits (０１２３４５６７８９), and many other scripts\' native digit characters, NOT just ASCII.',
      ],
    },
    {
      heading: 'This has a genuine, security-relevant consequence for validation code that assumes \\d means ASCII-only',
      points: [
        'A validation pattern like <code>^\\d{4}$</code>, intended to accept a 4-digit ASCII PIN or postal code, will ALSO accept 4 Arabic-Indic or Devanagari digit characters by default — code downstream that then tries to parse the "validated" string with <code>int.Parse</code> may throw (since <code>int.Parse</code> with default settings does NOT accept all the same characters <code>\\d</code> matches), producing a confusing mismatch between "the regex said this was valid" and "parsing it as an int just failed."',
        'This is exactly the kind of "homoglyph"-adjacent surprise that shows up in security-conscious validation review — a pattern that LOOKS like it restricts input to ASCII digits does not actually do so unless you explicitly opt into ASCII-only matching.',
      ],
    },
    {
      heading: 'The fix: RegexOptions.ECMAScript restricts \\d to ASCII, or use an explicit character class',
      points: [
        '<code>RegexOptions.ECMAScript</code> changes several character classes (including <code>\\d</code>, <code>\\w</code>, and <code>\\s</code>) to their JavaScript-compatible, ASCII-only definitions — <code>\\d</code> under this option matches ONLY <code>[0-9]</code>, exactly matching the intuitive assumption most developers bring to the pattern.',
        'The more explicit, arguably clearer alternative that works without needing <code>ECMAScript</code> mode at all: write <code>[0-9]</code> directly instead of <code>\\d</code> whenever ASCII-only digit matching is actually required — this is unambiguous to any future reader and does not depend on remembering which mode flag changes <code>\\d</code>\'s meaning.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving \\d matches non-ASCII Unicode digit characters by default',
      language: 'csharp',
      code: `using System.Text.RegularExpressions;

// The main page's own kind of pattern — assumed to mean "4 ASCII digits":
bool looksLikeAsciiPin = Regex.IsMatch("1234", @"^\\d{4}$");
Console.WriteLine(looksLikeAsciiPin); // True — as expected

// But \\d ALSO matches non-ASCII Unicode decimal digits by default —
// these are genuine Arabic-Indic digit characters (U+0661 etc.),
// NOT the ASCII characters '1', '2', '3', '4':
string arabicIndicDigits = "١٢٣٤"; // looks like "1234" visually in
                                    // some contexts, but is entirely
                                    // different Unicode code points
bool matchesToo = Regex.IsMatch(arabicIndicDigits, @"^\\d{4}$");
Console.WriteLine(matchesToo); // True — surprising if you assumed
                                // \\d meant "ASCII 0-9" only!

// Fullwidth digits (common in East Asian text) ALSO match:
string fullwidthDigits = "１２３４"; // U+FF11 etc., not ASCII
Console.WriteLine(Regex.IsMatch(fullwidthDigits, @"^\\d{4}$")); // True`,
    },
    {
      label: 'The downstream consequence — "validated" input that int.Parse rejects',
      language: 'csharp',
      code: `string arabicIndicDigits = "١٢٣٤";

// The regex says this is "valid" — 4 digits, matches ^\\d{4}$:
bool isValid = Regex.IsMatch(arabicIndicDigits, @"^\\d{4}$"); // True

if (isValid)
{
    // But this throws! int.Parse's DEFAULT NumberStyles do not
    // accept these specific Unicode digit characters the same way
    // \\d does — the "validated" string is not actually parseable
    // as an ordinary ASCII-based integer:
    int pin = int.Parse(arabicIndicDigits);
    // FormatException: The input string '١٢٣٤' was not in a correct format.
}

// The confusing mismatch: the regex-based validation step and the
// actual parsing step disagree about what counts as "a valid digit
// string" — exactly the kind of surprising, security-review-relevant
// gap this subtopic exists to flag.`,
    },
    {
      label: 'The fix — RegexOptions.ECMAScript or an explicit [0-9] character class',
      language: 'csharp',
      code: `// Fix 1 — RegexOptions.ECMAScript restricts \\d/\\w/\\s to their
// ASCII-only, JavaScript-compatible definitions:
bool ecmaAscii = Regex.IsMatch("1234", @"^\\d{4}$", RegexOptions.ECMAScript);
Console.WriteLine(ecmaAscii); // True — ASCII digits still match

bool ecmaArabicIndic = Regex.IsMatch("١٢٣٤", @"^\\d{4}$", RegexOptions.ECMAScript);
Console.WriteLine(ecmaArabicIndic); // False — correctly rejected now

// Fix 2 — write [0-9] explicitly instead of relying on \\d's default
// Unicode-aware meaning; unambiguous to any future reader, no mode
// flag to remember:
bool explicitAsciiOnly = Regex.IsMatch("1234", @"^[0-9]{4}$");
Console.WriteLine(explicitAsciiOnly); // True

bool explicitRejectsArabicIndic = Regex.IsMatch("١٢٣٤", @"^[0-9]{4}$");
Console.WriteLine(explicitRejectsArabicIndic); // False — correctly
                                                 // rejected, with no
                                                 // special mode flag
                                                 // needed at all

// [GeneratedRegex] patterns intended for strict ASCII validation
// should use [0-9] (or pass RegexOptions.ECMAScript as the second
// argument) for exactly the same reason.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main topic page\'s own <code>Email()</code> pattern uses <code>[\\w.+-]+@[\\w-]+\\.[\\w.]{2,}</code>. Explain whether <code>\\w</code> has the same "broader than ASCII" behavior as <code>\\d</code>, and what the practical consequence is for email validation specifically.',
    hint: '\\w is defined similarly to \\d — as a Unicode category shorthand (word characters, including Unicode letters and digits) rather than strictly [a-zA-Z0-9_]. Consider whether accepting non-ASCII letters/digits in an email\'s local part or domain is actually a problem in practice, versus the \\d + int.Parse mismatch which was a hard functional bug.',
    solution: `// \\w, like \\d, matches a broader Unicode-aware definition by
// default — not strictly [a-zA-Z0-9_], but Unicode letter and digit
// categories plus underscore. This means the main page's own Email()
// pattern:
//
//   [GeneratedRegex(@"^[\\w.+-]+@[\\w-]+\\.[\\w.]{2,}$", RegexOptions.IgnoreCase)]
//
// will ALSO accept non-ASCII letters in the local part or domain —
// e.g. an email like "ñoño@exämple.com" would pass this pattern's
// \\w-based character classes, since ñ and ä are genuine Unicode
// "letter" characters.

// Whether this is a BUG depends on context:
// - For INTERNATIONALIZED email addresses (which are a real, valid
//   thing under modern email standards — IDN domains, UTF-8 local
//   parts), this broader \\w behavior is actually CORRECT and
//   desirable — restricting to ASCII-only would incorrectly reject
//   genuinely valid international email addresses.
// - For a system that specifically only supports ASCII-only email
//   addresses (e.g. integrating with a legacy system that cannot
//   handle non-ASCII), the broader \\w match is a genuine gap that
//   needs RegexOptions.ECMAScript or an explicit [a-zA-Z0-9._+-]
//   character class instead.
//
// Unlike the \\d + int.Parse mismatch (a hard, unavoidable functional
// bug the moment a "validated" non-ASCII digit string reaches
// int.Parse), the \\w-in-emails case requires knowing your system's
// actual internationalization requirements before deciding whether
// the default Unicode-aware behavior is a feature or a bug for your
// specific validation pattern.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '\\d in a .NET regex pattern only ever matches the ASCII characters "0" through "9".',
      reality: 'by default, \\d matches any character in the Unicode Nd (Decimal Digit Number) category — including Arabic-Indic, Devanagari, and fullwidth digit characters from many other scripts, not just ASCII.',
    },
    {
      thought: 'if a regex pattern using \\d validates a string as "matching", that string is guaranteed to be parseable by int.Parse or similar ASCII-based numeric parsing.',
      reality: 'a string can satisfy \\d{4} while containing non-ASCII Unicode digit characters that int.Parse\'s default NumberStyles do not accept the same way, producing a FormatException on a string the regex just called "valid".',
    },
    {
      thought: 'RegexOptions.ECMAScript is a rarely-needed, purely legacy compatibility flag with no practical relevance to modern validation code.',
      reality: 'it is the direct, documented mechanism for restricting \\d/\\w/\\s to their ASCII-only definitions — genuinely useful any time strict ASCII-only validation is the actual requirement, as an alternative to writing out explicit character classes like [0-9].',
    },
  ];
}
