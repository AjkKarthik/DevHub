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
  templateUrl: './virtualize-recreates-item-dom-on-every-filter-without-key.html',
  styleUrl: './virtualize-recreates-item-dom-on-every-filter-without-key.scss'
})
export class VirtualizeRecreatesItemDomOnEveryFilterWithoutKeySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The quiz already names the fix (@key="item.Id") — the main page\'s own Contact List challenge is the EXACT scenario where skipping it costs the most',
      points: [
        'Without a @key, Blazor\'s diffing algorithm matches old and new render output PURELY BY POSITION in the list — item at index 0 compares against whatever is now at index 0, regardless of whether it\'s conceptually "the same" item. When a Virtualize list is re-rendered after a filter changes which items are included, most positions now hold a DIFFERENT underlying item than before, causing Blazor to treat the DOM at that position as needing a full rebuild rather than recognizing "this item is still here, just reordered."',
        'This isn\'t a Virtualize-specific bug — it\'s the same general @key diffing behavior that applies to any Blazor list — but Virtualize\'s use case (the main page\'s own search-as-you-type Contact List challenge, filtering on every keystroke) is exactly the high-churn, frequent-re-render scenario where this cost compounds the most, since it happens on EVERY keystroke rather than once.',
      ]
    },
    {
      heading: 'The concrete, measurable cost: DOM node churn on every keystroke, not just "less efficient"',
      points: [
        'Consider filtering a 10,000-contact list down from 50 visible matches to 30 as the user types one more character — without @key, positional diffing can cause Blazor to discard and recreate DOM elements for contacts that are STILL in the filtered results, simply because their position shifted. Any transient DOM-level state on those elements (a CSS transition in progress, focus, a hovered tooltip) is lost and rebuilt from scratch, even though the underlying data item never actually changed.',
        'Adding @key="c.Id" (using the Contact\'s own stable identifier) fixes this precisely: Blazor\'s diffing then matches elements by that key instead of position, correctly recognizing "this DOM node already represents contact #4821" even after its position in the filtered list shifts — reusing that existing element instead of tearing it down and rebuilding it.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without @key — every filter keystroke risks unnecessary DOM churn',
      language: 'csharp',
      code: `<input @bind="search" @bind:event="oninput" @bind:after="Filter" placeholder="Search..." />

<div style="height:600px; overflow-y:scroll">
    <Virtualize Items="filtered" ItemSize="64" Context="c">
        <!-- No @key here — Blazor diffs this against the PREVIOUS
             render's item at the SAME POSITION, not the same
             underlying Contact. As "filtered" changes shape on
             every keystroke, most positions now hold a different
             contact than before, causing unnecessary DOM
             teardown/rebuild even for contacts still present in
             the new filtered results. -->
        <div style="height:64px; display:flex; align-items:center">
            <strong>@c.Name</strong>&nbsp;— @c.Email
        </div>
    </Virtualize>
</div>

@code {
    private List<Contact> filtered = [];
    private string search = "";
    private void Filter() { /* ...updates filtered... */ }
}`,
    },
    {
      label: 'With @key — Blazor tracks each contact by its stable identity',
      language: 'csharp',
      code: `<input @bind="search" @bind:event="oninput" @bind:after="Filter" placeholder="Search..." />

<div style="height:600px; overflow-y:scroll">
    <Virtualize Items="filtered" ItemSize="64" Context="c">
        <!-- @key="c.Id" tells Blazor's diffing to match elements
             by the Contact's OWN stable identifier, not render
             position. A contact that survives the filter (just at
             a new index) now correctly reuses its existing DOM
             element instead of being torn down and rebuilt. -->
        <div @key="c.Id" style="height:64px; display:flex; align-items:center">
            <strong>@c.Name</strong>&nbsp;— @c.Email
        </div>
    </Virtualize>
</div>

@code {
    private List<Contact> filtered = [];
    private string search = "";
    private void Filter() { /* ...updates filtered... */ }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer builds the Contact List search feature exactly as the main page\'s own challenge describes, without adding @key to the item template. They notice that typing quickly into the search box causes a brief visual flicker on rows that remain visible before and after each keystroke, even though those specific contacts never left the filtered results. Explain what\'s actually happening, using what you know about how Blazor\'s diffing algorithm matches elements without a key.',
    hint: 'Without @key, does Blazor\'s diffing algorithm match "the same contact" across renders, or does it match "whatever is at the same position"? What happens when a filter operation changes which contact occupies a given position?',
    solution: 'The flicker is real DOM teardown-and-rebuild, not a rendering illusion. Without @key, Blazor\'s diffing matches old and new render output purely by POSITION — the element that was at index 5 before the keystroke is compared against whatever is now at index 5 after filtering, with no awareness of whether it\'s the "same" contact. Since filtering on every keystroke changes which contacts occupy which positions (even contacts that remain in the results end up at different indices as others are added or removed above them), Blazor frequently concludes the element at a given position now represents a DIFFERENT contact and discards/rebuilds the DOM node, even for contacts that were visible both before and after the keystroke. Adding @key="c.Id" fixes this by giving Blazor a stable identity to match against instead of position — a contact that survives the filter, even at a new index, is now correctly recognized as "the same element," which is reused rather than torn down and rebuilt, eliminating the flicker.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Blazor\'s diffing algorithm tracks list items by their underlying data identity automatically, so @key is only needed for unusual edge cases, not ordinary filtering scenarios.',
      reality: 'This subtopic\'s theory clarifies the DEFAULT behavior without @key is purely positional matching — any operation that reorders or reshuffles which items occupy which positions (filtering being the most common example) risks unnecessary DOM churn without an explicit @key.'
    },
    {
      thought: 'The main page\'s Contact List challenge (filtering 10,000 contacts on every keystroke) works fine without @key since Virtualize only renders a small visible window at any time anyway.',
      reality: 'This subtopic\'s exercise shows the SMALL visible window is exactly where this problem is most noticeable — the visible rows are precisely what gets unnecessarily rebuilt on every keystroke without @key, producing a visible flicker despite Virtualize\'s otherwise efficient rendering.'
    },
    {
      thought: 'Adding @key to a Virtualize item template is primarily a performance micro-optimization with minimal practical impact.',
      reality: 'This subtopic\'s theory shows the impact compounds specifically in high-churn scenarios like live search-as-you-type filtering, where unnecessary DOM rebuild happens on every single keystroke rather than once — a measurable, user-visible difference, not just a theoretical optimization.'
    }
  ];
}
