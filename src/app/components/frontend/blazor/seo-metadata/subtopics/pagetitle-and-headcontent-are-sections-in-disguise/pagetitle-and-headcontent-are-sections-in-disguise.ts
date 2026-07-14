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
  templateUrl: './pagetitle-and-headcontent-are-sections-in-disguise.html',
  styleUrl: './pagetitle-and-headcontent-are-sections-in-disguise.scss'
})
export class PagetitleAndHeadcontentAreSectionsInDisguiseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'PageTitle, HeadContent, and HeadOutlet are not a separate head-management mechanism — they are the Sections API wearing a different name',
      points: [
        'Internally, PageTitle\'s render output is literally a SectionContent component targeting a well-known internal identifier reserved for the document title; HeadContent does the same for a separate well-known identifier reserved for general head elements. HeadOutlet itself renders two SectionOutlet instances — one subscribed to each of those identifiers.',
        'This means every fact already true about the general Sections API (SectionContent/SectionOutlet, covered in the Sections & Layouts topic) applies to PageTitle/HeadContent without modification: registration is tracked by real-time SetParametersAsync order, matching has no ancestor-relationship awareness, and only one active outlet subscriber is allowed per identifier — HeadOutlet just happens to internally supply that one subscriber for you in App.razor.',
      ]
    },
    {
      heading: 'What this actually explains about "the last PageTitle rendered wins"',
      points: [
        'The main page\'s QnA states the last PageTitle rendered wins, and that a page-level PageTitle always overrides a layout-level one — this subtopic pins down WHY: it is the exact same real-time registration-order mechanism already established for general Sections, not a special title-specific rule. A page\'s PageTitle typically registers AFTER the layout\'s (since the layout renders first, wrapping the page), which is why the page\'s title naturally wins in the common case — not because Blazor has special-cased "pages beat layouts" logic anywhere.',
        'HeadOutlet also supplies a built-in DEFAULT title (registered as fallback content) for when no page-level PageTitle is present at all — this default-content behavior is a genuine Sections API feature (a provider explicitly marked as "default," used only when no other provider has registered), not something invented specifically for HeadOutlet.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two PageTitle components — which "wins" depends on registration timing, not layout vs page',
      language: 'csharp',
      code: `<!-- MainLayout.razor -->
@inherits LayoutComponentBase
<PageTitle>MyStore</PageTitle>
@Body

<!-- Products.razor -->
@page "/products"
@layout MainLayout
<PageTitle>Products — MyStore</PageTitle>
<h1>Products</h1>

<!-- Because MainLayout renders FIRST (it wraps @Body, which is where
     Products.razor's own render happens), MainLayout's PageTitle
     registers first, then Products.razor's PageTitle registers
     SECOND and becomes the new last-in-list provider — so the
     browser tab shows "Products — MyStore", not "MyStore".

     This is the SAME registration-order mechanism from the Sections
     & Layouts topic, not a special "pages always beat layouts" rule
     — it just happens that a layout's own render always completes
     before its @Body content's render does, making this the
     practically-reliable outcome in the common case. -->`,
    },
    {
      label: 'A slow async page can lose the title race to its own layout',
      language: 'csharp',
      code: `<!-- SlowProduct.razor -->
@page "/slow-product/{Id:int}"
@layout MainLayout

<!-- If this page's PageTitle is conditionally rendered only AFTER
     an awaited data fetch resolves (instead of unconditionally at
     the top of the file), there is a brief window where only
     MainLayout's PageTitle has registered — same underlying
     mechanism as any other Sections timing race. -->
@if (product is not null)
{
    <PageTitle>@product.Name — MyStore</PageTitle>
}

<h1>@product?.Name</h1>

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;

    protected override async Task OnInitializedAsync()
        => product = await Products.GetAsync(Id); // PageTitle registers only after this
}

<!-- Fix: render PageTitle unconditionally at the top of the file
     with a loading-state fallback string, so it registers
     immediately rather than being gated behind an await:
     <PageTitle>@(product?.Name ?? "Loading...") — MyStore</PageTitle> -->`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer is confused: "the docs say the last PageTitle rendered wins, but I thought Blazor had some special rule where page-level PageTitle always beats layout-level PageTitle — which is it?" Using what you now know about the actual mechanism, explain what determines the winner, and why "page beats layout" is usually — but not always — the observed outcome.',
    hint: 'Is there a hardcoded rule anywhere that checks "is this PageTitle in a page or a layout"? Or does PageTitle use the same general registration mechanism as any other Sections content, where render order determines the outcome?',
    solution: 'There is no special "page beats layout" rule anywhere in Blazor\'s source — PageTitle is a thin wrapper around SectionContent, using the exact same real-time-registration-order mechanism as the general Sections API. The reason page-level PageTitle usually wins is structural, not a special case: a layout always renders BEFORE its own @Body content (since the layout wraps the page, not the other way around), so the layout\'s PageTitle typically registers first, and the page\'s PageTitle registers second — becoming the new last-in-list provider that HeadOutlet\'s SectionOutlet displays. But this is a consequence of normal render ORDER, not a hardcoded precedence rule — which is exactly why a page whose PageTitle is gated behind an awaited operation (only rendered conditionally after data resolves) can genuinely lose this race, briefly or even entirely, to its own layout\'s already-registered title, the same as any other Sections timing issue.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'PageTitle, HeadContent, and HeadOutlet are a dedicated, separate head-management feature, unrelated to the SectionContent/SectionOutlet Sections API.',
      reality: 'This subtopic\'s theory clarifies PageTitle and HeadContent are literally thin wrappers rendering SectionContent internally, and HeadOutlet renders SectionOutlet instances for two well-known identifiers — it is the Sections API under a different name, not a separate mechanism.'
    },
    {
      thought: 'Blazor has a hardcoded rule that a page-level PageTitle always overrides a layout-level PageTitle, regardless of render timing.',
      reality: 'This subtopic\'s exercise shows there is no such hardcoded rule — "page beats layout" is the USUAL observed outcome purely because layouts render before their own @Body content, not because of any special-cased precedence logic; an async-gated page-level PageTitle can lose this race.'
    },
    {
      thought: 'If a page conditionally renders its PageTitle only after an await completes, the title will still show correctly once the data loads, with no real downside to gating it behind the async check.',
      reality: 'This subtopic\'s code examples show gating PageTitle behind an await introduces the same registration-timing risk covered for general SectionContent — rendering it unconditionally with a loading-state fallback string avoids the race entirely, which is the safer, recommended pattern.'
    }
  ];
}
