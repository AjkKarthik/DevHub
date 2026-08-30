import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './the-director-used-backticks-instead-of-c-sharp-interpolation.html',
  styleUrl: './the-director-used-backticks-instead-of-c-sharp-interpolation.scss'
})
export class TheDirectorUsedBackticksInsteadOfCSharpInterpolationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The same mistake, recurring on a second topic in this hub',
      points: [
        'The "Director Pattern" codeTab\'s <code>BuildPasswordResetEmail</code> method originally called <code>.HtmlBody(`&lt;a href="https://devhub.io/reset?t={token}"&gt;Reset password&lt;/a&gt;`)</code> — backtick characters wrapping an HTML fragment, with a bare <code>{token}</code> inside.',
        'This is the exact same category of bug already covered on this hub\'s own Factory Method topic: backtick-delimited strings are JavaScript/TypeScript template-literal syntax. C# has no backtick string syntax at all — this line would not compile.',
        'What makes this instance slightly trickier than the earlier one: the HTML fragment ITSELF contains double quotes (<code>href="..."</code>), so the fix cannot be a simple backtick-to-double-quote swap the way the earlier bug\'s fix was — the embedded double quotes need their own handling once the string is no longer backtick-delimited.',
      ]
    },
    {
      heading: 'Two valid C# ways to fix a string containing both interpolation and embedded quotes',
      points: [
        'Option 1 — escape the embedded quotes: <code>$"&lt;a href=\\"https://devhub.io/reset?t={token}\\"&gt;Reset password&lt;/a&gt;"</code>. A backslash before each embedded <code>"</code> tells C# it is a literal character, not the end of the string.',
        'Option 2 — use a verbatim interpolated string: <code>$@"&lt;a href=""https://devhub.io/reset?t={token}""&gt;Reset password&lt;/a&gt;"</code>. The <code>@</code> prefix makes it a verbatim string, where embedded quotes are escaped by DOUBLING them (<code>""</code>) instead of backslash-escaping — and backslashes themselves stop needing escaping too, which matters for strings containing file paths or regex patterns.',
        'Both are equally valid C#; the fix applied to the main page uses the escaped-double-quote form (option 1), since it more closely mirrors the syntax most readers are already familiar with from other languages\' string escaping.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fixing embedded quotes two different ways',
      language: 'csharp',
      code: `// WRONG -- backtick template-literal syntax, not valid C# at all
public Email BuildPasswordResetEmail(IEmailBuilder builder, string recipient, string token) =>
    builder
        .To(recipient)
        .Subject("Reset your password")
        .HtmlBody(\`<a href="https://devhub.io/reset?t={token}">Reset password</a>\`)
        .Build();

// FIX 1 -- escaped double quotes inside a regular interpolated string
public Email BuildPasswordResetEmail_Fix1(IEmailBuilder builder, string recipient, string token) =>
    builder
        .To(recipient)
        .Subject("Reset your password")
        .HtmlBody($"<a href=\\"https://devhub.io/reset?t={token}\\">Reset password</a>")
        .Build();

// FIX 2 -- verbatim interpolated string, quotes escaped by doubling
public Email BuildPasswordResetEmail_Fix2(IEmailBuilder builder, string recipient, string token) =>
    builder
        .To(recipient)
        .Subject("Reset your password")
        .HtmlBody($@"<a href=""https://devhub.io/reset?t={token}"">Reset password</a>")
        .Build();

// Both fixes produce IDENTICAL output for the SAME token value --
// they are purely two different SOURCE-CODE spellings of the same string.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes a third fix: replace the double quotes around the href attribute with single quotes, so the string becomes <code>$"&lt;a href=\'https://devhub.io/reset?t={token}\'&gt;Reset password&lt;/a&gt;"</code> — avoiding the escaping question entirely. Does this work, and is it a good idea?',
    hint: 'Does C#\'s double-quoted string delimiter care about single quote characters appearing inside it at all?',
    solution: 'It compiles, and it would work -- C#\'s double-quoted string delimiter has no special meaning for a literal single-quote character appearing inside it, so no escaping is needed at all for that version. Whether it is a GOOD idea is a separate, HTML-specific question: single-quoted HTML attribute values are valid HTML and every browser accepts them, but double-quoted attributes are the far more common, more idiomatic convention in real-world HTML -- switching quote style purely to dodge a C# escaping question, rather than for any HTML-specific reason, trades one minor inconvenience (escaping) for a stylistic inconsistency with typical HTML. Either of the two fixes shown in the theory section keeps the HTML looking conventional while still producing valid, compiling C#.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the earlier Factory Method topic\'s backtick bug was fixed by simply switching to double quotes, the same simple swap should fix this one too.',
      reality: 'Per this subtopic\'s theory, this instance is genuinely different — the string being interpolated already contains double quotes of its own (the HTML href attribute), so a plain double-quote swap would prematurely end the string; escaping (or a verbatim string) is required here.'
    },
    {
      thought: 'A verbatim string ($@"...") and a regular interpolated string with escaped quotes ($"...\\"...") produce different results at runtime.',
      reality: 'Per this subtopic\'s theory, both produce byte-for-byte identical output — they are two different SOURCE-CODE spellings of the exact same string value, differing only in how embedded quote characters are written, not in what the resulting string actually contains.'
    },
    {
      thought: 'This kind of backtick-vs-C#-interpolation mistake was a one-off, unlikely to recur elsewhere in the same hub.',
      reality: 'Per this subtopic\'s theory, the identical category of mistake was found on TWO separate topics in this hub (Factory Method and now Builder) — confirming it is worth specifically checking for on any C#-labeled codeTab, not assuming a single fix elsewhere means the pattern is fully caught.'
    }
  ];
}
