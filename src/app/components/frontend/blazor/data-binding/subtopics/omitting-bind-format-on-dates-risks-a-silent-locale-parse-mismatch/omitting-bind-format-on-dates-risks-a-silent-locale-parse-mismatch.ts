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
  templateUrl: './omitting-bind-format-on-dates-risks-a-silent-locale-parse-mismatch.html',
  styleUrl: './omitting-bind-format-on-dates-risks-a-silent-locale-parse-mismatch.scss'
})
export class OmittingBindFormatOnDatesRisksASilentLocaleParseMismatchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two independent systems format dates — the browser\'s native date input, and .NET\'s own DateTime parsing — and they do not automatically agree',
      points: [
        'The main page\'s quiz answer states that omitting the format string "may" cause silent null/wrong-value bugs, worth making concrete: a browser\'s native &lt;input type="date"&gt; element always sends its value to the server/component in a fixed ISO 8601 format (yyyy-MM-dd) internally, REGARDLESS of how the date is visually displayed to the user in their own locale — this part is actually standardized and consistent across browsers.',
        'The risk is on the OTHER side of the round-trip: when Blazor takes the component\'s own bound DateTime value and needs to render it back into the input\'s value attribute (or parse a value coming from a differently-configured input), the format string used for that conversion determines whether the two sides agree — a mismatch here is where the "silent null/wrong value" failure actually originates, not from the browser\'s own date picker behaving inconsistently.',
      ]
    },
    {
      heading: 'Why the failure is genuinely silent rather than throwing an exception',
      points: [
        'When @bind:format is omitted, Blazor falls back to the CURRENT THREAD\'S CULTURE for formatting/parsing the DateTime — in a Blazor Server app, this can vary based on server configuration or request culture negotiation; in Blazor WASM, it depends on the browser\'s own configured culture/locale settings, which are not something the developer directly controls from server-side code.',
        'If the culture used for formatting produces a string the native &lt;input type="date"&gt; element does not recognize as a valid date in ITS expected ISO format, many browsers simply show an EMPTY date picker rather than an error — the DateTime value silently fails to display correctly, with no exception, no console warning, and no validation message, since from the framework\'s perspective the conversion "succeeded" (it produced SOME string), it just was not a string the browser\'s input recognized.',
        'Explicitly specifying @bind:format="yyyy-MM-dd" removes this culture-dependent ambiguity entirely — it hardcodes the exact format Blazor uses for both directions of the conversion, matching the ISO format the native date input actually expects, regardless of whatever culture the server or browser happens to be configured with.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without @bind:format — culture-dependent, can silently break',
      language: 'csharp',
      code: `<input type="date" @bind="dob" />
<p>DOB: @dob.ToShortDateString()</p>

@code {
    private DateTime dob = new(1990, 6, 15);

    // Without @bind:format, Blazor formats "dob" for the input's
    // value attribute using the CURRENT THREAD CULTURE. If that
    // culture is (for example) en-GB, the produced string might be
    // "15/06/1990" — a format the native <input type="date">
    // element does NOT recognize as valid (it strictly expects
    // "1990-06-15", ISO 8601). The date picker then silently shows
    // BLANK, even though "dob" itself still holds the correct
    // DateTime value in the component's own C# state.
}`,
    },
    {
      label: 'With @bind:format — hardcoded, culture-independent',
      language: 'csharp',
      code: `<input type="date" @bind="dob" @bind:format="yyyy-MM-dd" />
<p>DOB: @dob.ToShortDateString()</p>

@code {
    private DateTime dob = new(1990, 6, 15);

    // @bind:format="yyyy-MM-dd" hardcodes the EXACT format the
    // native <input type="date"> element expects (ISO 8601),
    // regardless of the server's or browser's configured culture.
    // The date picker now correctly shows 1990-06-15 every time,
    // independent of whatever locale settings happen to be active.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Blazor Server app works correctly showing dates on a developer\'s machine (configured for en-US culture) but a user in a different region reports the date picker on a form always appears empty, even though editing and re-saving the record seems to work. The team suspects a database or timezone bug. Based on this subtopic, what is a more likely explanation worth checking first?',
    hint: 'Think about what specifically determines the string format used to populate the &lt;input type="date"&gt; element\'s value, and whether that could differ between the developer\'s machine and the user\'s actual request.',
    solution: 'A more likely explanation, worth checking before assuming a database or timezone issue, is a missing @bind:format="yyyy-MM-dd" on the date input, combined with a culture mismatch between the developer\'s own environment and the affected user\'s request. Without an explicit format string, Blazor formats the DateTime using the current thread\'s culture — which can differ per-request in Blazor Server depending on how request culture is negotiated (e.g. based on the user\'s browser Accept-Language header or region settings). The developer\'s own machine, defaulting to en-US, may happen to produce a format the native date input accepts, masking the bug entirely during local testing — while the affected user\'s request resolves to a different culture, producing a date string format the input silently fails to recognize. "Editing and re-saving seems to work" is consistent with this too: the underlying DateTime value in the component\'s own C# state was likely never actually wrong, only its DISPLAYED representation in the date picker.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A native &lt;input type="date"&gt; element\'s value format automatically adapts to whatever culture the .NET application is configured with, the same way its VISUAL display adapts to the user\'s own locale.',
      reality: 'The native date input\'s underlying value attribute is standardized to ISO 8601 (yyyy-MM-dd) across all browsers regardless of visual locale display — this subtopic\'s theory clarifies the mismatch risk is entirely on Blazor\'s OWN culture-dependent formatting of the bound DateTime, not on any inconsistency in the browser\'s own date input behavior.'
    },
    {
      thought: 'If a date silently fails to display correctly after omitting @bind:format, it means the underlying bound DateTime value itself is wrong or was lost.',
      reality: 'This subtopic\'s exercise shows the underlying DateTime value in the component\'s C# state is typically unaffected — the failure is specifically in the STRING REPRESENTATION Blazor produces for the input\'s value attribute under a mismatched culture; the input simply does not recognize that string as valid and shows blank, while the component\'s own state remains correct.'
    },
    {
      thought: 'Omitting @bind:format on a date input causes an exception or a visible error message, making the mistake easy to catch during development.',
      reality: 'The failure is completely silent by design — confirmed in this subtopic\'s theory, the conversion still "succeeds" from the framework\'s perspective (it produces some formatted string), it simply is not a string the browser\'s date input recognizes, so no exception, console warning, or validation message is ever raised; the bug is invisible until someone in a different culture configuration happens to trigger it.'
    }
  ];
}
