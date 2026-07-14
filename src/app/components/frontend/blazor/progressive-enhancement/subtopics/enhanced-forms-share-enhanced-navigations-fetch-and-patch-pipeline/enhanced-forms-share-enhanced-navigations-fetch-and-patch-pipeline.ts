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
  templateUrl: './enhanced-forms-share-enhanced-navigations-fetch-and-patch-pipeline.html',
  styleUrl: './enhanced-forms-share-enhanced-navigations-fetch-and-patch-pipeline.scss'
})
export class EnhancedFormsShareEnhancedNavigationsFetchAndPatchPipelineSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Enhanced forms and enhanced navigation are not two separate features that happen to behave similarly — they are literally the same underlying mechanism',
      points: [
        'Microsoft\'s own documentation describes them together, not separately: Blazor "enhances page navigation and form handling by intercepting the request in order to apply the response to the existing DOM, preserving as much of the rendered form as possible." A data-enhance form submission and an intercepted link click both go through the same fetch-and-patch pipeline, applying the same whole-document diffing algorithm.',
        'This means every fact already established about enhanced navigation\'s DOM-patching scope applies unchanged to enhanced forms: the diff compares the WHOLE current document against the newly-fetched response, not a scoped "form region" — and it can silently undo DOM changes made by non-Blazor JavaScript anywhere on the page, exactly the same risk covered for link-based enhanced navigation.',
      ]
    },
    {
      heading: 'The same data-permanent escape hatch applies to enhanced forms, with no separate form-specific mechanism',
      points: [
        'Since enhanced forms share enhanced navigation\'s exact patching code path, the data-permanent attribute (marking an element to be skipped by the diff, preserving its current DOM state) works identically regardless of whether the triggering interaction was a link click or a data-enhance form submission — there is no separate "form-permanent" attribute or form-specific escape hatch to learn.',
        'Practically, this means a page containing BOTH a data-enhance form AND unrelated client-side JavaScript DOM mutations (a third-party widget, a manually-toggled class) needs the SAME data-permanent protection regardless of whether the page is ever navigated to via a link or reached by submitting the form — either interaction risks reverting those changes the same way, since both funnel through one shared mechanism.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A data-enhance form submission can undo unrelated DOM changes, same as link navigation',
      language: 'html',
      code: `<!-- Layout.razor -->
@inherits LayoutComponentBase

<!-- A third-party widget mutates its own DOM after page load -->
<div id="cart-badge-container"></div>
<script>
    CartWidget.mount('#cart-badge-container'); // adds a live item count badge
</script>

<div class="page-content">
    @Body
</div>

<!-- Products.razor -->
@page "/products"
@layout MainLayout

<EditForm Model="search" method="post" FormName="search"
          OnValidSubmit="Search" data-enhance>
    <InputText @bind-Value="search.Query" />
    <button type="submit">Search</button>
</EditForm>

<!-- BUG: submitting this search form re-runs the SAME fetch-and-patch
     pipeline as an enhanced link navigation. If the cart badge's
     JS-added content doesn't match what a fresh server render of
     the layout would produce, it gets silently reverted after the
     search form submits — even though the form itself has nothing
     to do with the cart badge. -->`,
    },
    {
      label: 'The fix — data-permanent works identically for forms and navigation',
      language: 'html',
      code: `<!-- Layout.razor -->
<div id="cart-badge-container" data-permanent></div>
<script>
    CartWidget.mount('#cart-badge-container');
</script>

<div class="page-content">
    @Body
</div>

<!-- No changes needed to the form itself — data-permanent on the
     cart badge protects it from BOTH enhanced navigation AND
     enhanced form submission, since both go through the exact
     same shared patching pipeline. -->`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer already knows (from a related topic) that a persistent header widget\'s JS-added content can be silently reverted by enhanced navigation unless marked data-permanent. They add a data-enhance search form to a different page and are surprised to discover the SAME widget resets when that form is submitted, even though the form has nothing to do with the widget. They ask: "why would submitting an unrelated form affect this widget the same way clicking a link does?" Explain the connection.',
    hint: 'Are enhanced navigation and enhanced form handling implemented as two separate mechanisms, or does Microsoft\'s own documentation describe them as one shared pipeline?',
    solution: 'The connection is that enhanced navigation and enhanced form handling are not two separate mechanisms that happen to behave similarly — they are the exact same underlying fetch-and-patch pipeline, applying the identical whole-document diffing algorithm regardless of whether the interaction that triggered it was a link click or a data-enhance form submission. Since the cart widget\'s DOM mutations were never protected with data-permanent, ANY interaction that runs this shared pipeline — link navigation OR form submission — can revert them, because the diff doesn\'t distinguish "this update came from a form" from "this update came from a link." The fix is the same regardless of trigger: marking the widget\'s container with data-permanent protects it from the shared pipeline entirely, whether it\'s ultimately invoked via enhanced navigation or enhanced form handling.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Enhanced navigation (for links) and enhanced form handling (for data-enhance forms) are two separate Blazor features, each with its own DOM-patching implementation.',
      reality: 'This subtopic\'s theory clarifies Microsoft\'s own documentation describes them as one shared mechanism — form submissions and link navigations both go through the identical fetch-and-patch pipeline, not two independently-implemented features.'
    },
    {
      thought: 'Since data-permanent was introduced specifically to solve a problem with enhanced navigation (link clicks), it might not apply, or might need a different equivalent attribute, for protecting content from enhanced FORM submissions.',
      reality: 'This subtopic\'s theory shows data-permanent applies identically to both, with no separate form-specific escape hatch — because both interactions funnel through the exact same underlying patching code path.'
    },
    {
      thought: 'A page\'s unrelated third-party JS widgets only need data-permanent protection if that specific page is reachable via enhanced link navigation, not if the only interactive element on it is a data-enhance form.',
      reality: 'This subtopic\'s exercise shows this distinction doesn\'t actually matter — a data-enhance form submission risks reverting unprotected DOM changes exactly the same way a link navigation would, since both trigger the identical shared pipeline.'
    }
  ];
}
