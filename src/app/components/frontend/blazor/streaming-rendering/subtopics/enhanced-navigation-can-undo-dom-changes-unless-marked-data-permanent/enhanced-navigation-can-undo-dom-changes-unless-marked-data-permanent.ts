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
  templateUrl: './enhanced-navigation-can-undo-dom-changes-unless-marked-data-permanent.html',
  styleUrl: './enhanced-navigation-can-undo-dom-changes-unless-marked-data-permanent.scss'
})
export class EnhancedNavigationCanUndoDomChangesUnlessMarkedDataPermanentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Enhanced navigation doesn\'t preserve a "safe zone" outside the page content — nothing is exempt by location alone',
      points: [
        'The main page\'s theory describes enhanced navigation as fetching and patching in the new page content — the actual mechanism is a diffing algorithm that compares the current document against the newly-fetched one and applies Keep/Update/Insert/Delete operations across the WHOLE rendered document, not a narrowly scoped "content region only" swap. Microsoft\'s own documentation states this plainly: enhanced navigation "may undo dynamic changes to the DOM if the updated content isn\'t part of the server rendering."',
        'This means any DOM mutation made by client-side JavaScript AFTER the initial render — a third-party widget injecting elements into a persistent header, a manually-toggled CSS class, content inserted by a non-Blazor script — is a candidate for being silently reverted the next time enhanced navigation runs, regardless of whether that element visually sits inside or outside the "main content" area a developer might assume is the only thing that changes.',
      ]
    },
    {
      heading: 'The data-permanent opt-out, and its companion event for cases the diff genuinely can\'t handle',
      points: [
        'Blazor provides an explicit escape hatch: marking an element with the data-permanent attribute tells the diffing algorithm to skip that element entirely during enhanced navigation, preserving whatever DOM state or content it currently holds across the patch. This is the correct fix for any element whose DOM state is maintained by non-Blazor JavaScript and must survive navigation intact.',
        'For cases where the DOM change genuinely needs to be RE-APPLIED after each navigation rather than just preserved (e.g. a JS widget that needs to re-run its own initialization logic against fresh content), Blazor exposes an enhancedload JavaScript event that fires after each enhanced navigation completes — giving third-party or custom script a hook to reinitialize itself against the patched DOM.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — a third-party widget\'s state silently resets',
      language: 'html',
      code: `<!-- Layout.razor — a "sticky" notification banner injected by a
     third-party JS SDK, living in the layout OUTSIDE the routed
     page content that actually changes between pages -->
<div id="support-widget-container"></div>

<script>
    // Some third-party SDK mutates the DOM here on page load,
    // e.g. injecting a chat bubble and its own state.
    SupportWidget.mount('#support-widget-container');
</script>

<div class="page-content">
    @Body
</div>

<!-- BUG: the developer assumes #support-widget-container, being
     OUTSIDE @Body, is untouched by enhanced navigation between
     pages. It isn't — the diffing algorithm considers the WHOLE
     document, and any DOM the widget injected that doesn't match
     what a fresh server render of the layout produces gets reverted
     on the next enhanced navigation, silently resetting the widget. -->`,
    },
    {
      label: 'The fix — data-permanent and enhancedload',
      language: 'html',
      code: `<div id="support-widget-container" data-permanent></div>

<script>
    SupportWidget.mount('#support-widget-container');

    // If the widget instead needs to actively RE-RUN setup logic
    // after every navigation (rather than just having its existing
    // DOM preserved), hook the enhancedload event instead of (or in
    // addition to) data-permanent:
    document.addEventListener('enhancedload', () => {
        SupportWidget.reinitializeIfNeeded();
    });
</script>

<div class="page-content">
    @Body
</div>`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer builds a persistent site header containing a JS-driven "recently viewed items" dropdown that updates its own contents via client-side JavaScript, positioned entirely outside the routed @Body content in Layout.razor. After the user browses a few product pages using Blazor\'s enhanced navigation (no full page reloads observed in the network tab), the dropdown\'s JS-added items have vanished, reset back to whatever the layout\'s server-rendered markup originally contained. The developer is confused: "enhanced navigation only swaps the page content, this dropdown isn\'t even part of that — why did it reset?" What is the actual explanation?',
    hint: 'Does enhanced navigation\'s diffing algorithm scope itself to only the routed page-content region, or does it compare against the whole rendered document? What happens to a DOM element whose current content doesn\'t match what a fresh server render of that same element would produce?',
    solution: 'The developer\'s assumption is the actual bug — enhanced navigation\'s diffing algorithm does not scope itself to only the @Body content; it compares the WHOLE current document against the newly-fetched one, including the layout. The dropdown\'s JS-added items exist only in the live DOM, not in what a fresh server render of that same layout element would produce — so when the diff runs, that element gets patched back to match the server-rendered version, discarding the JS-added content. This isn\'t a bug in the dropdown\'s code; it\'s expected behavior for any DOM mutation not reflected in server-rendered output. The fix is either marking the dropdown\'s container with data-permanent (if its DOM state should simply be preserved untouched across navigations) or listening for the enhancedload event to explicitly re-apply the JS-driven update after each navigation completes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Enhanced navigation only swaps the content inside the routed @Body — anything in the surrounding layout (header, footer, persistent widgets) is automatically left untouched.',
      reality: 'This subtopic\'s theory clarifies enhanced navigation\'s diffing algorithm compares the WHOLE rendered document, not a scoped content region — an element\'s location inside vs. outside @Body has no bearing on whether it can be reverted; only an explicit data-permanent marker exempts it.'
    },
    {
      thought: 'If a DOM element visually appears unaffected by page navigation (like a persistent header widget), its JavaScript-driven state must be safe from enhanced navigation\'s effects.',
      reality: 'This subtopic\'s exercise shows exactly the opposite can happen — a persistent-looking widget\'s JS-added DOM content can be silently reverted the moment its current state stops matching what a fresh server render of that same markup would produce.'
    },
    {
      thought: 'The fix for any DOM content lost during enhanced navigation is to disable enhanced navigation entirely for the affected pages.',
      reality: 'This subtopic\'s theory shows Blazor provides two more targeted mechanisms specifically for this — data-permanent to preserve an element\'s current state untouched, and the enhancedload event to re-run setup logic after each navigation — both far more surgical than disabling enhanced navigation\'s performance benefits site-wide.'
    }
  ];
}
