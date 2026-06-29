import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-blazor-seo-metadata',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './seo-metadata.html',
  styleUrl: './seo-metadata.scss'
})
export class BlazorSeoMetadata {
  quickRef: QuickRefItem[] = [
    { name: '<PageTitle>', type: 'keyword', desc: 'Sets the browser tab/document title from any component.' },
    { name: '<HeadContent>', type: 'keyword', desc: 'Injects elements into <head> (meta, link, script).' },
    { name: '<HeadOutlet />', type: 'keyword', desc: 'Placed in <head> in App.razor — renders HeadContent.' },
    { name: 'IHeadOutletHelper', type: 'interface', desc: '.NET 8 programmatic head management from C# code.' },
    { name: 'Static SSR + [StreamRendering]', type: 'keyword', desc: 'Best combo for crawler-visible SEO metadata.' },
    { name: 'Open Graph meta', type: 'keyword', desc: 'og:title, og:description, og:image for social sharing.' },
    { name: 'canonical link', type: 'keyword', desc: 'Prevents duplicate content penalties in search engines.' },
    { name: 'robots meta', type: 'keyword', desc: 'Controls crawler indexing/following for a specific page.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'PageTitle and HeadContent',
      points: ['Blazor provides `<PageTitle>` for the document title and `<HeadContent>` for arbitrary head elements. Both render into a `<HeadOutlet />` placed in the `<head>` of App.razor. They work declaratively — place them anywhere in the component tree and Blazor merges them into the head. The last PageTitle rendered wins for the title; HeadContent elements accumulate.',
      'PageTitle sets the <title> tag — place it on every page component.', 'HeadContent accepts any valid head element: meta, link, script.', 'HeadOutlet in App.razor is required — without it nothing renders.', 'Both work in Static SSR, Interactive modes, and Hybrid.']
    },
    {
      heading: 'SEO and server-side rendering',
      points: ['Search crawlers index page content from the initial HTML response. Blazor WebAssembly sends an empty shell HTML — the content is client-rendered and often not indexed well. Blazor Static SSR (or Server with pre-rendering) sends full HTML including all metadata, making it crawler-friendly. For maximum SEO, use Static SSR with [StreamRendering] so the title and description meta are in the first HTML chunk.',
      'Static SSR sends full HTML in the initial response — crawler-friendly.', 'WASM apps are hard to index because content is client-rendered.', '[StreamRendering] ensures static metadata (title, description) is in the first flush.', 'Dynamic metadata (product name, OG image) is included as soon as data resolves.']
    },
    {
      heading: 'Open Graph and structured data',
      points: ['Open Graph meta tags (`og:title`, `og:description`, `og:image`) control how your pages appear when shared on social media. Add them in `<HeadContent>`. For structured data (JSON-LD), add a `<script type="application/ld+json">` tag inside HeadContent. Canonical links prevent duplicate-content penalties when the same content is accessible at multiple URLs.',
      'og:title and og:image control social media card previews.', 'JSON-LD structured data improves rich snippet eligibility in search.', 'Canonical link tag points to the preferred URL for duplicate content.', 'robots meta controls per-page indexing independently of robots.txt.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PageTitle & meta',
      language: 'csharp',
      code: `@page "/products/{Id:int}"
@inject IProductService Products

<PageTitle>@(product?.Name ?? "Loading...") — MyStore</PageTitle>

<HeadContent>
    <meta name="description" content="@product?.Description" />
    <link rel="canonical" href="@canonicalUrl" />
</HeadContent>

<h1>@product?.Name</h1>

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;
    private string canonicalUrl = "";

    protected override async Task OnParametersSetAsync()
    {
        product = await Products.GetAsync(Id);
        canonicalUrl = $"https://mystore.com/products/{Id}";
    }
}`
    },
    {
      label: 'Open Graph tags',
      language: 'csharp',
      code: `@page "/blog/{Slug}"

<PageTitle>@post?.Title — MyBlog</PageTitle>

<HeadContent>
    <meta name="description" content="@post?.Excerpt" />

    <!-- Open Graph -->
    <meta property="og:title" content="@post?.Title" />
    <meta property="og:description" content="@post?.Excerpt" />
    <meta property="og:image" content="@post?.CoverImageUrl" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="@canonicalUrl" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="@post?.Title" />
    <meta name="twitter:image" content="@post?.CoverImageUrl" />

    <!-- Robots -->
    @if (post?.IsPublished == false)
    {
        <meta name="robots" content="noindex,nofollow" />
    }
</HeadContent>

@code {
    [Parameter] public string Slug { get; set; } = "";
    private BlogPost? post;
    private string canonicalUrl => $"https://myblog.com/blog/{Slug}";
    protected override async Task OnParametersSetAsync()
        => post = await BlogService.GetBySlugAsync(Slug);
}`
    },
    {
      label: 'JSON-LD structured data',
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
            "description": "@product.Description",
            "offers": {
                "@@type": "Offer",
                "price": "@product.Price",
                "priceCurrency": "USD",
                "availability": "@(product.InStock ? "InStock" : "OutOfStock")"
            }
        }
        </script>
    }
</HeadContent>

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;
    protected override async Task OnInitializedAsync()
        => product = await ProductService.GetAsync(Id);
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting HeadOutlet in App.razor',
      wrong: '<head><meta charset="utf-8" /></head>',
      right: '<head><meta charset="utf-8" /><HeadOutlet /></head>',
      explanation: 'Without HeadOutlet, all PageTitle and HeadContent from pages are silently ignored. The document title never updates and meta tags never appear.'
    },
    {
      title: 'Relying on WASM for SEO-critical pages',
      wrong: '@rendermode InteractiveWebAssembly  // on a product detail page',
      right: '// Use Static SSR for SEO-critical pages — crawlers get full HTML',
      explanation: 'Search crawlers may not execute JavaScript. WASM pages render client-side — the initial HTML is a blank shell. Use Static SSR for pages that need to rank in search.'
    },
    {
      title: 'Not escaping quotes in meta content attributes',
      wrong: '<meta property="og:title" content="@product.Name" />  // name contains quotes',
      right: '<meta property="og:title" content="@Html.Encode(product.Name)" />',
      explanation: 'If product.Name contains double quotes, the rendered HTML will break the attribute. Always encode user-supplied values in HTML attributes.'
    },
    {
      title: 'Setting the same canonical URL for all pages',
      wrong: '<link rel="canonical" href="https://mysite.com/" />  // same on every page',
      right: '<link rel="canonical" href="@currentPageUrl" />',
      explanation: 'A canonical pointing to the homepage on every page tells Google that all your pages are duplicates of the homepage, collapsing your entire site to one URL in the index.'
    },
    {
      title: 'Placing PageTitle in the layout instead of pages',
      wrong: '<!-- MainLayout.razor -->\n<PageTitle>MySite</PageTitle>',
      right: '<!-- Each page sets its own title -->\n<PageTitle>Products — MySite</PageTitle>',
      explanation: 'A layout-level PageTitle is overridden by any page-level PageTitle (last writer wins), but if the page forgets one, the layout title shows. Set meaningful titles on every page.'
    },
  ];

  challenge: Challenge = {
    title: 'SEO-Ready Blog Post Page',
    language: 'csharp',
    description: 'Create a blog post page at `/blog/{slug}` that sets a proper document title, description meta tag, canonical URL, Open Graph tags (og:title, og:description, og:image), and adds a robots noindex tag for draft posts. Use a stub `IBlogService` that returns a simple `BlogPost` record.',
    hints: [
      'Use @attribute [StreamRendering] and Static SSR for SEO.',
      'Guard all meta tags with @if (post is not null) to avoid null renders.',
      'The canonical URL should be absolute: https://myblog.com/blog/{slug}.',
    ],
    starterCode: `public record BlogPost(string Slug, string Title, string Excerpt, string CoverUrl, bool IsPublished);

@page "/blog/{Slug}"
@attribute [StreamRendering]

<!-- TODO: PageTitle, HeadContent with meta/OG tags, page body -->

@code {
    [Parameter] public string Slug { get; set; } = "";
    private BlogPost? post;
    protected override async Task OnParametersSetAsync()
        => post = await BlogService.GetBySlugAsync(Slug);
}`,
    solution: `@page "/blog/{Slug}"
@attribute [StreamRendering]
@inject IBlogService BlogService

<PageTitle>@(post?.Title ?? "Loading...") — MyBlog</PageTitle>

<HeadContent>
    @if (post is not null)
    {
        <meta name="description" content="@post.Excerpt" />
        <link rel="canonical" href="https://myblog.com/blog/@Slug" />
        <meta property="og:title" content="@post.Title" />
        <meta property="og:description" content="@post.Excerpt" />
        <meta property="og:image" content="@post.CoverUrl" />
        @if (!post.IsPublished)
        {
            <meta name="robots" content="noindex,nofollow" />
        }
    }
</HeadContent>

@if (post is null) { <p>Loading...</p> }
else
{
    <article>
        <h1>@post.Title</h1>
        <p>@post.Excerpt</p>
    </article>
}

@code {
    [Parameter] public string Slug { get; set; } = "";
    private BlogPost? post;
    protected override async Task OnParametersSetAsync()
        => post = await BlogService.GetBySlugAsync(Slug);
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What must be in App.razor for PageTitle and HeadContent to work?', options: ['A <title> tag', '<HeadOutlet />', '<MetaProvider />', 'A script tag'], answer: 1, explanation: 'HeadOutlet in App.razor is the render target. Without it, PageTitle and HeadContent produce no output.' },
    { q: 'Which render mode is best for SEO-critical pages?', options: ['InteractiveWebAssembly', 'InteractiveAuto', 'Static SSR', 'InteractiveServer'], answer: 2, explanation: 'Static SSR sends full HTML in the initial response, which crawlers can index. WASM renders client-side and may not be indexed.' },
    { q: 'What prevents duplicate content penalties for the same content at multiple URLs?', options: ['robots meta tag', 'canonical link tag', 'sitemap.xml', 'noindex tag'], answer: 1, explanation: 'The canonical link tag tells search engines which URL is the authoritative source when the same content is accessible at multiple URLs.' },
    { q: 'When should you add a robots noindex meta tag?', options: ['All pages', 'Pages that are draft, staging, or admin-only', 'WASM pages only', 'Pages with query strings'], answer: 1, explanation: 'noindex prevents a page from appearing in search results. Use it on draft content, admin pages, thank-you pages, and any content not meant for public search indexing.' },
    { q: 'What Open Graph tag controls the image shown in social media cards?', options: ['og:card', 'og:picture', 'og:image', 'og:thumbnail'], answer: 2, explanation: 'og:image specifies the URL of the image that social platforms (Twitter, Facebook, LinkedIn) display when the page is shared.' },
    { q: 'What is the difference between <PageTitle> and <HeadContent> in Blazor?', options: ['They are identical', 'PageTitle sets the browser tab title only; HeadContent injects arbitrary tags into <head> like meta, link, and script', 'HeadContent replaces the page title', 'PageTitle only works in Server mode'], answer: 1, explanation: '<PageTitle>My Page</PageTitle> sets document.title (browser tab and accessibility tree). <HeadContent> injects any other tags into <head> — use it for meta description, canonical links, og: tags, and structured data. Both require <HeadOutlet /> in App.razor to function.' },
  ];

  qna: QnaItem[] = [
    { q: 'Does Blazor WASM support SEO?', a: 'Poorly by default. WASM apps render client-side, so the initial HTML is a blank shell. Options: use Blazor Web App (Static SSR for public pages), add pre-rendering, or use a service like Prerender.io that renders WASM pages to HTML for crawlers. For SEO-critical sites, Static SSR is the right choice.' },
    { q: 'How do I add a favicon?', a: 'Place favicon.ico in wwwroot and add `<link rel="icon" type="image/x-icon" href="/favicon.ico" />` in the static <head> section of App.razor (not inside HeadContent — it should be present on every page unconditionally).' },
    { q: 'Can I generate a sitemap.xml in Blazor?', a: 'Yes. Create a minimal API endpoint in Program.cs that queries your routes or database and returns XML with a content type of "application/xml". Map it to "/sitemap.xml". No Razor component needed — this is a pure server endpoint.' },
    { q: 'How do I set different titles for nested layouts?', a: 'The last PageTitle rendered in the component tree wins. A page\'s PageTitle overrides any title set in a layout. This is the correct behavior — pages should always set their own specific title, with the layout providing a default fallback title only if the page omits one (which it should never do for SEO).' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor SEO: use PageTitle for document titles and HeadContent for meta/OG tags — both require HeadOutlet in App.razor — and prefer Static SSR for crawler-visible pages.',
    mustKnow: [
      'PageTitle and HeadContent require HeadOutlet in App.razor.',
      'Static SSR sends full HTML — crawlers can index it.',
      'WASM renders client-side — poor SEO without pre-rendering.',
      'Canonical link prevents duplicate content penalties.',
      'robots noindex hides admin/draft pages from search engines.',
      'Open Graph tags control social media preview cards.',
    ],
    interviewFocus: [
      'Why is WASM a poor choice for SEO-critical pages?',
      'How do PageTitle and HeadContent work together with HeadOutlet?',
      'What is the purpose of a canonical link tag?',
    ]
  };
}
