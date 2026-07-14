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
  templateUrl: './json-ld-inside-script-silently-corrupts-not-throws.html',
  styleUrl: './json-ld-inside-script-silently-corrupts-not-throws.scss'
})
export class JsonLdInsideScriptSilentlyCorruptsNotThrowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s escaping mistake covers HTML attributes — JSON-LD inside a script tag has a genuinely different, more dangerous failure mode',
      points: [
        'Razor\'s default @expression rendering always HTML-encodes its output, with no awareness of the surrounding context — inside an ordinary HTML attribute, this correctly turns a literal double quote into &quot; so it can\'t break out of the attribute. Inside a JSON-LD &lt;script&gt; block, that SAME encoding still happens, but the RESULT is different, because a &lt;script&gt; tag is what the HTML spec calls a "raw text element."',
        'A raw text element\'s content is never HTML-entity-decoded by the browser at all — unlike ordinary text content, where &quot; is decoded back into a literal " before JavaScript or a JSON parser ever sees it. This means inside &lt;script type="application/ld+json"&gt;, an HTML-encoded &quot; stays as the literal SIX CHARACTERS &quot; forever — it is never converted back to a real quote character.',
      ]
    },
    {
      heading: 'Why this is worse than the HTML-attribute case: it doesn\'t throw, it silently corrupts',
      points: [
        'Since the encoded &quot; text doesn\'t contain an actual unescaped double quote, the surrounding JSON syntax usually stays structurally valid — JSON.parse() typically does NOT throw an error. Instead, a crawler or JSON-LD consumer successfully parses the structured data, but gets a VALUE containing the literal, garbled text &quot;Special&quot; instead of the real string Special (with actual quote characters). The data isn\'t rejected — it\'s silently wrong, which is far harder to notice than an outright parse failure.',
        'The correct fix is bypassing Razor\'s default HTML-encoding entirely for this specific content: serialize the data server-side with System.Text.Json.JsonSerializer.Serialize(), producing a proper, already-JSON-escaped string, then render that string as raw markup (via MarkupString or @Html.Raw-equivalent) instead of letting a bare @expression HTML-encode it a second, wrong way.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — HTML-encoded output silently corrupts JSON-LD',
      language: 'csharp',
      code: `@page "/product/{Id:int}"

<HeadContent>
    @if (product is not null)
    {
        <script type="application/ld+json">
        {
            "@@context": "https://schema.org",
            "@@type": "Product",
            "name": "@product.Name",
            "description": "@product.Description"
        }
        </script>
    }
</HeadContent>

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;
    protected override async Task OnInitializedAsync()
        => product = await ProductService.GetAsync(Id);
}

<!-- If product.Name is: Bob's "Special" Widget
     Razor's default @@expression encoding renders it as:
     Bob&#39;s &quot;Special&quot; Widget

     The <script> tag is a "raw text element" — the browser
     NEVER decodes &quot; back into a real quote inside it. A
     JSON-LD consumer parsing this successfully gets
     "name": "Bob&#39;s &quot;Special&quot; Widget" as the
     literal value — no parse error, just silently wrong,
     garbled structured data. -->`,
    },
    {
      label: 'The fix — serialize with JsonSerializer, render as raw markup',
      language: 'csharp',
      code: `@page "/product/{Id:int}"
@using System.Text.Json

<HeadContent>
    @if (product is not null)
    {
        <script type="application/ld+json">
            @((MarkupString)jsonLd!)
        </script>
    }
</HeadContent>

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;
    private string? jsonLd;

    protected override async Task OnInitializedAsync()
    {
        product = await ProductService.GetAsync(Id);
        if (product is not null)
        {
            var structuredData = new
            {
                context = "https://schema.org",
                type = "Product",
                name = product.Name,
                description = product.Description,
            };
            // JsonSerializer produces PROPERLY JSON-escaped output
            // (a real quote becomes \\", not &quot;) — rendering it
            // via MarkupString skips Razor's HTML-encoding entirely,
            // so the JSON stays valid AND correctly represents the
            // original string once parsed.
            jsonLd = JsonSerializer.Serialize(structuredData);
        }
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team ships a product page with JSON-LD structured data embedded via @product.Name inside a &lt;script type="application/ld+json"&gt; block, the same pattern as the main page\'s own code sample. QA tests it with product names containing apostrophes and quotes, and the page never crashes or shows a visible error — everything looks fine in the browser. Weeks later, they discover Google Search Console is reporting that the structured data for these products is being ignored due to malformed values. Explain what\'s actually happening, given that nothing ever threw an error.',
    hint: 'Does &lt;script&gt; content get HTML-entity-decoded by the browser the same way ordinary text content does? If Razor HTML-encodes a quote character inside a script block, does JSON.parse() see a real quote — or something else?',
    solution: 'Nothing crashed because the corruption is silent, not a parse failure — this is exactly why it went unnoticed through QA. Razor\'s default @expression rendering HTML-encodes any embedded string, turning a literal double quote into &quot; — correct behavior for an ordinary HTML attribute, but &lt;script&gt; is a "raw text element" per the HTML spec, meaning its content is NEVER HTML-entity-decoded by the browser. The &quot; stays as those six literal characters forever, rather than becoming a real quote character. Since this doesn\'t introduce an actual unescaped quote, the surrounding JSON syntax usually stays structurally valid and parses successfully — but any value containing a quote or apostrophe now contains garbled, literal entity text instead of the real character, which is exactly the kind of malformed value a strict structured-data validator (like the one behind Search Console) flags and ignores. The fix is serializing the data with System.Text.Json.JsonSerializer.Serialize() (which produces genuinely correct JSON escaping) and rendering the result via MarkupString to bypass Razor\'s HTML-encoding entirely, rather than letting a bare @expression encode it the wrong way for this context.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since Razor automatically HTML-encodes @expression output everywhere, embedding data inside a &lt;script&gt; tag via @expression is just as safe as embedding it in an ordinary HTML attribute.',
      reality: 'This subtopic\'s theory clarifies &lt;script&gt; is a "raw text element" whose content the browser never HTML-entity-decodes — the SAME encoding that correctly protects an HTML attribute produces silently corrupted, garbled values inside a script tag instead.'
    },
    {
      thought: 'If embedding user or database data inside a JSON-LD script tag were unsafe, testing with strings containing quotes or apostrophes would immediately reveal a visible error or crash.',
      reality: 'This subtopic\'s exercise shows exactly the opposite — the corruption is silent, since the HTML-encoded text usually keeps the JSON structurally valid; the damage only surfaces later, as an external validator (like Google Search Console) rejecting the malformed values.'
    },
    {
      thought: 'The main page\'s existing "escape quotes in meta content attributes" mistake entry already covers this JSON-LD script-tag scenario, since both involve escaping product.Name.',
      reality: 'This subtopic\'s theory shows these are genuinely different problems needing different fixes — HTML-attribute escaping (already covered) protects against breaking OUT of an attribute\'s quotes, while the script-tag case needs bypassing HTML-encoding entirely via JsonSerializer + MarkupString, since HTML-encoding is actively WRONG in that context, not just insufficient.'
    }
  ];
}
