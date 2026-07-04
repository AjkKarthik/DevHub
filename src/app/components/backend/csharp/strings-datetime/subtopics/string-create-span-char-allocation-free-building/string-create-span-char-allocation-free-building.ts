import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-string-create-span-char-allocation-free-building-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './string-create-span-char-allocation-free-building.html',
  styleUrl: './string-create-span-char-allocation-free-building.scss',
})
export class StringCreateSpanCharAllocationFreeBuildingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends StringBuilder for O(n) building — string.Create is a further step for a KNOWN final length',
      points: [
        'The main Strings, DateTime & Math page correctly recommends <code>StringBuilder</code> over <code>+=</code> in a loop, since <code>StringBuilder</code> maintains an internal <code>char[]</code> buffer and is O(n) overall. But <code>StringBuilder</code> ITSELF still involves at least one internal buffer allocation plus a FINAL COPY into the returned <code>string</code> via <code>ToString()</code> — when the exact final length is known upfront, <code>string.Create</code> can build the string with EXACTLY ONE allocation, writing characters directly into the destination string\'s own backing memory.',
      ],
    },
    {
      heading: 'string.Create takes the target length and a callback that writes directly into a Span<char> over the new string\'s memory',
      points: [
        '<code>string.Create&lt;TState&gt;(int length, TState state, SpanAction&lt;char, TState&gt; action)</code> allocates a string of EXACTLY <code>length</code> characters up front, then invokes your callback with a <code>Span&lt;char&gt;</code> that is a direct, writable view into that string\'s own memory — there is no separate intermediate buffer, and no final copy step the way <code>StringBuilder.ToString()</code> requires.',
        'The <code>state</code> parameter exists specifically to avoid a CLOSURE allocation for the callback — passing your input data through <code>state</code> instead of capturing it in a lambda keeps the whole operation allocation-free apart from the one, unavoidable, final string allocation itself.',
      ],
    },
    {
      heading: 'This is a genuinely niche, hot-path-only tool — StringBuilder remains correct for the general case',
      points: [
        'This only pays off when you know the EXACT final character count before writing begins — string.Create cannot resize; writing past the declared length throws, and under-filling leaves garbage/default characters in the unfilled span. For variable-length building (the main page\'s own StringBuilder use cases — CSV rows, HTML fragments), StringBuilder remains the correct, simpler tool.',
        'string.Create is the right reach specifically for fixed-format, high-frequency string production — formatting a known-width numeric code, building a fixed-length hash string, or any format where the length is a compile-time or trivially-computed constant, called often enough that the extra StringBuilder buffer + copy is measurably worth eliminating.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'StringBuilder vs string.Create for a fixed-length format',
      language: 'csharp',
      code: `// StringBuilder approach — correct, but involves an internal buffer
// PLUS a final copy into the string returned by ToString():
static string FormatCodeBuilder(int id)
{
    var sb = new StringBuilder(8);
    sb.Append("ID-");
    sb.Append(id.ToString("D5"));
    return sb.ToString();   // <-- copies buffer contents into a NEW string
}

// string.Create — the final string IS the buffer; no separate copy step:
static string FormatCodeFast(int id) =>
    string.Create(8, id, (span, state) =>
    {
        "ID-".AsSpan().CopyTo(span);
        state.ToString("D5").AsSpan().CopyTo(span[3..]);
    });

Console.WriteLine(FormatCodeBuilder(42));  // ID-00042
Console.WriteLine(FormatCodeFast(42));     // ID-00042 — same output,
                                            // one fewer allocation+copy`,
    },
    {
      label: 'The state parameter avoids a closure allocation',
      language: 'csharp',
      code: `int userId = 42;
string prefix = "USR";

// WITHOUT passing state — this lambda CAPTURES userId and prefix,
// which itself allocates a closure object on the heap:
string bad = string.Create(3 + 5, 0, (span, _) =>
{
    prefix.AsSpan().CopyTo(span);              // captured "prefix" — closure!
    userId.ToString("D5").AsSpan().CopyTo(span[3..]); // captured "userId" too
});

// WITH state — no closure needed; both values travel through the
// tuple passed as "state", so the callback itself captures nothing:
string good = string.Create(3 + 5, (prefix, userId), (span, state) =>
{
    state.prefix.AsSpan().CopyTo(span);
    state.userId.ToString("D5").AsSpan().CopyTo(span[3..]);
});

Console.WriteLine(good); // USR00042`,
    },
    {
      label: 'When string.Create is the WRONG tool',
      language: 'csharp',
      code: `// Variable-length output — string.Create is awkward and error-prone
// here, because you must know the EXACT length before writing starts:
static string BuildCsvRow(string[] fields)
{
    // Length depends on runtime data (field lengths + separators) —
    // computing it upfront is possible but adds complexity for no
    // real benefit over just using StringBuilder, which the main
    // topic page already recommends for exactly this kind of variable,
    // loop-driven construction:
    var sb = new StringBuilder();
    for (int i = 0; i < fields.Length; i++)
    {
        if (i > 0) sb.Append(',');
        sb.Append(fields[i]);
    }
    return sb.ToString();
}

// Reserve string.Create for FIXED-FORMAT, high-frequency output where
// the length is trivially known — not general-purpose string assembly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a <code>string.Create</code>-based method <code>FormatHex(byte value)</code> that returns a fixed 2-character uppercase hex string (e.g. <code>15</code> → <code>"0F"</code>), avoiding StringBuilder entirely.',
    hint: 'The output length is always exactly 2 characters. Use value.ToString("X2") to get the hex digits, then copy them into the span provided by string.Create.',
    solution: `static string FormatHex(byte value) =>
    string.Create(2, value, (span, state) =>
    {
        state.ToString("X2").AsSpan().CopyTo(span);
    });

Console.WriteLine(FormatHex(15));  // 0F
Console.WriteLine(FormatHex(255)); // FF
Console.WriteLine(FormatHex(0));   // 00

// The output length (2) is a compile-time constant here, making this
// an ideal string.Create candidate — no StringBuilder buffer, no
// separate ToString() copy step, just one allocation for the final
// 2-character string with the hex digits written directly into it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'string.Create is always strictly faster than StringBuilder for any string-building task.',
      reality: 'string.Create requires knowing the EXACT final length before writing begins and cannot resize — it is a niche, hot-path tool for fixed-format output; StringBuilder remains correct and simpler for variable-length building.',
    },
    {
      thought: 'passing data into the string.Create callback via a captured local variable is equivalent to passing it through the state parameter.',
      reality: 'capturing locals in the callback lambda allocates a closure object on the heap — passing the same data through the state parameter avoids that allocation, which is the whole point of using string.Create in a hot path.',
    },
    {
      thought: 'StringBuilder.ToString() returns the SAME buffer StringBuilder was writing into, so there\'s no extra copy.',
      reality: 'StringBuilder.ToString() copies its internal buffer\'s contents into a brand-new string object — this final copy is exactly the step string.Create eliminates by writing directly into the destination string\'s own memory.',
    },
  ];
}
