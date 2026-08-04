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
  templateUrl: './backticks-are-not-c-sharp.html',
  styleUrl: './backticks-are-not-c-sharp.scss'
})
export class BackticksAreNotCSharpSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A syntax that does not exist in C#, sitting in a C#-labeled codeTab',
      points: [
        'The "DI Approach" codeTab\'s default switch arm originally read: <code>throw new ArgumentException(`Unknown channel: &#123;channel&#125;`)</code> — backtick characters wrapping the message, with <code>&#123;channel&#125;</code> inside.',
        'That is JavaScript/TypeScript TEMPLATE LITERAL syntax. C# has no backtick-delimited string syntax at all — the C# compiler simply does not recognize a backtick as the start of a string literal. This line would not compile as C#, full stop.',
        'C#\'s actual string interpolation syntax looks similar in SPIRIT (a `&#123;expression&#125;` placeholder embedded in a string) but uses a completely different delimiter: a <code>$</code> immediately before a DOUBLE-quoted string — <code>$"Unknown channel: &#123;channel&#125;"</code>.',
      ]
    },
    {
      heading: 'Why this specific mistake is easy to make when authoring multi-language content',
      points: [
        'This exact page\'s OWN Challenge block, directly below the codeTabs, is written in TypeScript — where backtick template literals ARE the correct, idiomatic way to embed a variable in a string (<code>`$&#123;i&#125;,"$&#123;e&#125;"`</code> appears correctly in that Challenge\'s own CSV formatter).',
        'Switching between writing correct TypeScript template literals and correct C# string interpolation in the same authoring session, for the same general "insert a variable into a string" need, is exactly the kind of context-switch where one language\'s syntax habit leaks into the other.',
        'The fix is a small, mechanical substitution — swap the backtick pair for a leading <code>$</code> and double quotes — but it depends on recognizing that the SAME general idea (string interpolation) is spelled completely differently in the two languages, not on any deep C# knowledge.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same interpolation idea, spelled correctly in each language',
      language: 'csharp',
      code: `// WRONG -- backtick template-literal syntax, valid TypeScript, NOT valid C#
throw new ArgumentException(\`Unknown channel: {channel}\`);
// The C# compiler sees a backtick where it expects the start of an
// expression or statement -- this does not compile.

// RIGHT -- C# string interpolation: a leading $ before a DOUBLE-quoted
// string, with {expression} placeholders inside
throw new ArgumentException($"Unknown channel: {channel}");

// For comparison, the SAME general idea in TypeScript (correct in that
// language, and used correctly elsewhere on this very page's own
// Challenge block):
// const message = \`Unknown channel: \${channel}\`;
//                  ^ backticks + \${...} -- TypeScript's own syntax,
//                    completely different delimiters from C#'s $"..."

// A quick reference for telling them apart at a glance:
// TypeScript:  \`text \${expression} more text\`   (backticks, \${ })
// C#:          $"text {expression} more text"    ($ + double quotes, { })`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate fixes the syntax by changing the backticks to double quotes but forgets to add the leading $: <code>throw new ArgumentException("Unknown channel: &#123;channel&#125;");</code>. Does this compile, and if so, what does it actually produce?',
    hint: 'Without the leading $, does C# treat <code>&#123;channel&#125;</code> as a placeholder to substitute, or as four literal characters?',
    solution: 'It compiles -- but not correctly. Without the leading $, "Unknown channel: {channel}" is an ORDINARY string literal, not an interpolated one -- C# has no reason to treat {channel} as anything other than four literal characters (an opening brace, the letters "channel", a closing brace). The exception message would literally read "Unknown channel: {channel}" for every single invalid channel value, never actually substituting in the real channel that was passed -- a silent, misleading-message bug rather than a compile error. This is exactly why the $ prefix matters: it is what tells the C# compiler to treat the string as interpolated at all, not just what makes the syntax "look nicer."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Backtick-delimited strings with <code>&#123;expression&#125;</code> placeholders are a general programming convention that most C-family languages support, including C#.',
      reality: 'Per this subtopic\'s theory, C# has no backtick string syntax at all — its interpolation mechanism uses a completely different delimiter ($ plus double quotes), and a backtick in C# source code is simply not recognized as the start of any valid token.'
    },
    {
      thought: 'Fixing this bug just means changing the backtick characters to double quotes.',
      reality: 'Per this subtopic\'s theory, swapping only the delimiter without adding the leading $ produces code that compiles but silently fails to interpolate anything — the $ is what actually activates string interpolation in C#, not the double quotes on their own.'
    },
    {
      thought: 'A syntax error like using the wrong language\'s string-interpolation syntax would always be caught immediately by a compiler, so it is not worth double-checking code samples for this specific mistake.',
      reality: 'Per this subtopic\'s theory, the ORIGINAL backtick version genuinely would be caught by a real compiler — but the "quotes without $" variant explored in the exercise compiles successfully while silently producing the wrong output, which is a more dangerous version of the same underlying confusion.'
    }
  ];
}
