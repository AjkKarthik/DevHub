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
  templateUrl: './og-image-and-other-og-urls-must-be-absolute-not-relative.html',
  styleUrl: './og-image-and-other-og-urls-must-be-absolute-not-relative.scss'
})
export class OgImageAndOtherOgUrlsMustBeAbsoluteNotRelativeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A relative image path that renders perfectly on-page fails completely when read by a social media crawler',
      points: [
        'An ordinary &lt;img src="/images/product.jpg"&gt; on a page works fine with a relative (root-relative) path, because the BROWSER resolves it against the current page\'s own URL — the browser already knows what page it\'s on. og:image, og:url, and every other Open Graph URL property have no such context: they are read by an external crawler (Facebook\'s, Twitter\'s, LinkedIn\'s, or a generic link-preview bot) that fetches ONLY the meta tag\'s literal value as a standalone URL, with no page context to resolve a relative path against.',
        'The Open Graph protocol itself requires absolute URLs for these properties — a relative path like "/images/product.jpg" is not a valid og:image value at all; at best a crawler ignores it and shows no preview image, at worst it attempts to resolve it against its OWN unrelated base URL (its own crawler service domain), producing a broken or nonsensical fetch target.',
      ]
    },
    {
      heading: 'Why this specific bug is easy to miss during normal development and testing',
      points: [
        'Since a relative og:image URL still renders as VALID HTML — the &lt;meta&gt; tag itself has no syntax error, and the page looks completely normal in a browser — there is no visible symptom anywhere in the page itself. The only way to notice the problem is testing the ACTUAL social sharing behavior, typically via each platform\'s own URL-debugging tool (Facebook\'s Sharing Debugger, Twitter\'s Card Validator), which most developers don\'t routinely check during regular page development.',
        'The fix is building every Open Graph URL from an absolute base — typically the app\'s own known public domain combined with NavigationManager\'s current URI, or a configured base URL setting, rather than the same relative path convention used for on-page &lt;img&gt; tags and internal links, which is a completely different, browser-context-dependent resolution rule.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — a relative og:image works on-page, fails for crawlers',
      language: 'csharp',
      code: `@page "/product/{Id:int}"
@inject NavigationManager Nav

<!-- On-page image: relative path works fine, browser resolves it
     against the current page's own URL automatically -->
<img src="@product?.ImagePath" alt="@product?.Name" />

<HeadContent>
    @if (product is not null)
    {
        <!-- BUG: og:image using the SAME relative path convention
             as the <img> tag above. A browser viewing THIS page
             never notices anything wrong — but Facebook's or
             Twitter's crawler, fetching this meta tag's value as
             a completely standalone URL with no page context,
             cannot resolve "/images/product-42.jpg" into anything
             meaningful. The share preview silently shows no image
             at all. -->
        <meta property="og:image" content="@product.ImagePath" />
    }
</HeadContent>

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;
    protected override async Task OnInitializedAsync()
        => product = await Products.GetAsync(Id);
    // product.ImagePath is stored as "/images/product-42.jpg"
}`,
    },
    {
      label: 'The fix — build an absolute URL explicitly for OG tags',
      language: 'csharp',
      code: `@page "/product/{Id:int}"
@inject NavigationManager Nav

<img src="@product?.ImagePath" alt="@product?.Name" />

<HeadContent>
    @if (product is not null)
    {
        <meta property="og:image" content="@absoluteImageUrl" />
        <meta property="og:url" content="@Nav.Uri" />
        <!-- Nav.Uri is ALREADY absolute — NavigationManager always
             exposes the full current URL, unlike a stored relative
             image path pulled straight from the database. -->
    }
</HeadContent>

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;
    private string absoluteImageUrl = "";

    protected override async Task OnInitializedAsync()
    {
        product = await Products.GetAsync(Id);
        if (product is not null)
        {
            // Combine the known app base URI with the stored
            // relative path to build a genuinely absolute URL —
            // the same relative path used correctly for the
            // on-page <img> tag, but resolved explicitly here
            // since no browser is available to do it implicitly.
            absoluteImageUrl = new Uri(new Uri(Nav.BaseUri), product.ImagePath).ToString();
        }
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team ships a product page with an og:image meta tag using the exact same relative image path already used successfully in the page\'s own &lt;img&gt; tag. The page looks completely correct when viewed in a browser — the product image displays normally. When a customer shares the product link on social media, the preview card shows the correct title and description, but no image at all. Explain why the SAME path value works in one place and silently fails in the other.',
    hint: 'What actually resolves a relative URL like "/images/product.jpg" into a real, fetchable address — is it something the BROWSER does automatically based on the current page, or something that happens independently of any browser context?',
    solution: 'The difference is WHO resolves the relative path, and whether that resolver has any page context to work with. The on-page &lt;img&gt; tag works because the BROWSER automatically resolves a relative src against the current page\'s own URL — the browser already knows exactly what page it\'s viewing. og:image has no such context: a social media crawler fetches the meta tag\'s content value as a completely standalone URL string, with no relationship to "the current page" at all, since the crawler isn\'t rendering the page in a browser in the first place. A relative path like "/images/product.jpg" isn\'t a valid, resolvable URL on its own — the crawler either ignores it (showing no preview image, exactly as observed) or fails to resolve it against anything meaningful. The fix is building og:image (and every other Open Graph URL property) as a genuinely absolute URL explicitly in code — combining the app\'s known base URL with the relative path server-side — rather than relying on the same relative-path convention that only works correctly because of implicit browser resolution.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a relative image path already works correctly for an on-page &lt;img&gt; tag, using that same path value for og:image is safe, since it\'s the identical URL either way.',
      reality: 'This subtopic\'s theory clarifies these are resolved by fundamentally different mechanisms — a browser implicitly resolves a relative &lt;img&gt; src against the current page, while an external crawler reading og:image has no page context at all and needs a genuinely absolute URL.'
    },
    {
      thought: 'A broken og:image would be immediately obvious during normal page development and testing, the same way a broken on-page image would show a visible missing-image icon.',
      reality: 'This subtopic\'s exercise shows the page itself looks completely normal in a browser — the only way to notice a broken og:image is testing actual social sharing behavior via a platform\'s own debugging tool, not regular page browsing.'
    },
    {
      thought: 'NavigationManager\'s current URI and a stored relative image path from a database can be treated interchangeably when building Open Graph meta tag values.',
      reality: 'This subtopic\'s code examples show NavigationManager.Uri is ALREADY absolute and safe to use directly for og:url, while a database-stored relative image path genuinely needs explicit resolution against a known base URL before it\'s valid for og:image — the two are not interchangeable without that extra step.'
    }
  ];
}
