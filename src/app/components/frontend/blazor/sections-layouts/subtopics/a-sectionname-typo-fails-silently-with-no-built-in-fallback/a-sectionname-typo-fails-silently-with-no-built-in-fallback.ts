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
  templateUrl: './a-sectionname-typo-fails-silently-with-no-built-in-fallback.html',
  styleUrl: './a-sectionname-typo-fails-silently-with-no-built-in-fallback.scss'
})
export class ASectionnameTypoFailsSilentlyWithNoBuiltInFallbackSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A SectionName mismatch produces no error in either direction — SectionContent and SectionOutlet are independently, silently harmless when unmatched',
      points: [
        'If a page\'s SectionContent specifies a SectionName that has no corresponding SectionOutlet anywhere in the current render tree (a typo, a renamed outlet, a copy-pasted name that no longer exists), it still registers itself into the shared registry exactly as normal — no exception, no warning, nothing in the console. The content is simply held in the registry, never displayed anywhere, since no outlet is subscribed to that identifier to render it.',
        'Symmetrically, a SectionOutlet with no matching SectionContent anywhere in the tree renders an empty fragment — again, no exception, no warning. From the outside, a genuinely misconfigured Sections pairing and a deliberately-empty, not-yet-populated one look IDENTICAL: both just render nothing, with zero diagnostic signal pointing at the mismatch.',
      ]
    },
    {
      heading: 'SectionOutlet has no built-in fallback content parameter — "renders nothing" is the only behavior when unfilled',
      points: [
        'Unlike some component libraries\' slot mechanisms that support a default/fallback template for when nothing is projected, Blazor\'s SectionOutlet exposes only a SectionName (or SectionId) parameter — there is no ChildContent or fallback-content parameter to fall back on. If you need default content to appear when no page currently supplies a matching SectionContent, SectionOutlet alone cannot do it.',
        'The practical workaround is tracking supplied-or-not state yourself — e.g. a page that always supplies at minimum an empty SectionContent when it has nothing meaningful to show, or wrapping the outlet region in your own component that renders a default when appropriate, since Blazor\'s Sections API itself has no equivalent of an "IsSectionDefined" check or built-in default slot content as of the current version.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A typo\'d SectionName — no error, just nothing appears',
      language: 'csharp',
      code: `<!-- MainLayout.razor -->
@inherits LayoutComponentBase
<aside>
    <SectionOutlet SectionName="sidebar" />
</aside>
@Body

<!-- Products.razor -->
@page "/products"
@layout MainLayout

<!-- Typo: "sidbear" instead of "sidebar" -->
<SectionContent SectionName="sidbear">
    <ul>
        <li><a href="/products">All</a></li>
    </ul>
</SectionContent>

<h1>Products</h1>

<!-- RESULT: no exception anywhere, no console warning. The
     sidebar SectionOutlet simply renders empty — the page looks
     like it's missing sidebar content, with no diagnostic signal
     distinguishing "typo" from "this page intentionally has no
     sidebar." Debugging this means visually noticing the missing
     sidebar and manually comparing the two SectionName strings. -->`,
    },
    {
      label: 'A practical workaround for default/fallback content',
      language: 'csharp',
      code: `<!-- MainLayout.razor — no built-in SectionOutlet fallback exists,
     so track whether ANY page has supplied sidebar content via a
     simple cascaded flag the pages opt into -->
@inherits LayoutComponentBase

<aside>
    <SectionOutlet SectionName="sidebar" />
</aside>
@Body

<!-- ProductsWithoutSidebar.razor — a page that deliberately has no
     custom sidebar still explicitly supplies SOMETHING, even if
     empty, making "no sidebar" an intentional, visible choice
     rather than indistinguishable from a typo elsewhere -->
@page "/simple-page"
@layout MainLayout

<SectionContent SectionName="sidebar">
    <!-- Deliberately empty — signals "no sidebar for this page"
         explicitly, rather than omitting SectionContent entirely
         and hoping it's obviously intentional later. -->
</SectionContent>

<h1>Simple Page</h1>`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds a new page that uses MainLayout and includes SectionContent SectionName="sidebar" to supply sidebar links — but accidentally types "sidebar " with a trailing space (a typo from copy-pasting). After deploying, they notice the sidebar area is empty on that page but see no errors in the build output, the browser console, or server logs anywhere. Explain why this fails completely silently, and what Blazor\'s Sections API would need to have in order to catch this at development time.',
    hint: 'Does the Sections registry validate that a SectionName used by SectionContent actually has a matching SectionOutlet somewhere, either at compile time or at runtime? What happens to unmatched content and unmatched outlets?',
    solution: 'This fails silently because SectionName matching is a plain runtime string lookup with no validation step anywhere in the pipeline — not at compile time (SectionName is just a string parameter, not checked against any registry of known outlet names) and not at runtime either (an unmatched SectionContent just registers into the shared registry with no outlet subscribed to receive it, producing no exception or warning). The trailing space makes "sidebar " a completely different string from "sidebar", so the SectionOutlet never receives this content, but from the outside this looks identical to a page that simply has no sidebar content at all. Catching this at development time would require something Blazor\'s Sections API doesn\'t currently provide — either compile-time validation of SectionName strings against known outlets (which would need source-generator-level tooling, not just component parameters), or a runtime diagnostic mode that logs a warning when a SectionContent\'s identifier never finds a matching subscribed outlet. As it stands, the only real defenses are careful naming (shared constants instead of string literals for SectionName, to get at least a compiler error on a real typo) and visual QA catching the missing sidebar.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a SectionContent\'s SectionName doesn\'t match any SectionOutlet, Blazor will throw an exception or at least log a warning to help identify the mismatch.',
      reality: 'This subtopic\'s theory clarifies both an unmatched SectionContent and an unmatched SectionOutlet fail completely silently — no exception, no console warning, nothing distinguishing a genuine typo from an intentionally-empty section.'
    },
    {
      thought: 'SectionOutlet supports a fallback or default ChildContent parameter, similar to slot mechanisms in other component frameworks, for when no matching SectionContent is supplied.',
      reality: 'This subtopic\'s theory shows SectionOutlet only exposes SectionName/SectionId — there is no built-in fallback content parameter in the current API; achieving default content requires a workaround pattern, not a built-in feature.'
    },
    {
      thought: 'Using hardcoded string literals for SectionName everywhere is a reasonable, low-risk convention, since any typo would be immediately obvious from testing the page.',
      reality: 'This subtopic\'s exercise shows a typo (even a single trailing space) produces an empty section with zero diagnostic signal, easily mistaken for a page intentionally having no sidebar — using shared string constants instead of literals is a real, practical safeguard against this exact silent-failure class.'
    }
  ];
}
