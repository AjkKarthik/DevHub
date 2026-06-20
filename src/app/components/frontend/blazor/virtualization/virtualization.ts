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
  selector: 'app-blazor-virtualization',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './virtualization.html',
  styleUrl: './virtualization.scss'
})
export class BlazorVirtualization {
  quickRef: QuickRefItem[] = [
    { name: '<Virtualize>', type: 'keyword', desc: 'Built-in Blazor component for virtualised list rendering.' },
    { name: 'Items="collection"', type: 'syntax', desc: 'Bind a full in-memory collection to Virtualize.' },
    { name: 'ItemsProvider="Func"', type: 'syntax', desc: 'Supply a callback that fetches only the visible window.' },
    { name: 'ItemSize="px"', type: 'syntax', desc: 'Estimated item height in pixels for spacer calculation.' },
    { name: 'OverscanCount', type: 'keyword', desc: 'Extra items rendered above/below the viewport (default 3).' },
    { name: 'Context="item"', type: 'syntax', desc: 'Template variable name for each rendered item.' },
    { name: 'Placeholder', type: 'keyword', desc: 'Template shown for items not yet loaded by ItemsProvider.' },
    { name: 'ItemsProviderResult<T>', type: 'type', desc: 'Return type for ItemsProvider — items + total count.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Virtualize works',
      points: ['The `<Virtualize>` component tracks the scroll position and only renders DOM nodes for items currently visible in the viewport (plus OverscanCount items above and below as a buffer). Invisible items are replaced by top and bottom spacer divs whose height matches the estimated space those items would occupy, keeping the scrollbar accurate. This gives O(viewport) DOM size regardless of collection length.',
      'Only visible items exist in the DOM — the rest are spacers.', 'Spacer height = (total items - visible) × ItemSize.', 'OverscanCount reduces scroll jank at the cost of a few extra DOM nodes.', 'Works with both fixed and variable item heights (variable is more complex).']
    },
    {
      heading: 'Items vs ItemsProvider',
      points: ['`Items=` accepts a full in-memory collection and handles windowing client-side — great for data already loaded. `ItemsProvider=` accepts an async callback `(VirtualizeItemsProviderRequest<T>) => ValueTask<ItemsProviderResult<T>>` — Blazor calls it with the StartIndex and Count of items needed, so you can fetch only the visible page from a database. This enables virtualized infinite-scroll over millions of server-side rows.',
      'Items= is for in-memory collections already in the browser.', 'ItemsProvider= enables server-side paging — only fetch what is visible.', 'ItemsProviderRequest contains StartIndex, Count, and CancellationToken.', 'ItemsProviderResult<T> requires items + the total count for spacer sizing.']
    },
    {
      heading: 'Performance considerations',
      points: ['Set `ItemSize` as accurately as possible — an incorrect size causes the scrollbar to jump when real items render. Use `OverscanCount` (default 3) to buffer scroll momentum. For variable-height items, consider grouping items into fixed-size rows or using a third-party library. Avoid complex Blazor components as list items — they add per-item component instantiation overhead; prefer simple HTML fragments.',
      'Accurate ItemSize prevents scrollbar jumping.', 'OverscanCount=10 smooths fast scrolling at the cost of more DOM nodes.', 'Variable-height items require workarounds — Virtualize assumes fixed size.', 'Prefer simple HTML over component-per-item for maximum performance.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'In-memory Items',
      language: 'csharp',
      code: `@rendermode InteractiveServer

<div style="height:400px; overflow-y:scroll">
    <Virtualize Items="employees" ItemSize="50" Context="emp">
        <div class="employee-row">
            <strong>@emp.Name</strong>
            <span>@emp.Department</span>
        </div>
    </Virtualize>
</div>

@code {
    private List<Employee> employees = Enumerable
        .Range(1, 50_000)
        .Select(i => new Employee(i, $"Employee {i}", "Engineering"))
        .ToList();

    record Employee(int Id, string Name, string Department);
}`
    },
    {
      label: 'ItemsProvider (server-side)',
      language: 'csharp',
      code: `@rendermode InteractiveServer
@inject IEmployeeService EmployeeService

<div style="height:600px; overflow-y:scroll">
    <Virtualize ItemsProvider="LoadEmployees" ItemSize="60" Context="emp">
        <ItemContent>
            <div class="row">@emp.Name — @emp.Title</div>
        </ItemContent>
        <Placeholder>
            <div class="skeleton">Loading...</div>
        </Placeholder>
    </Virtualize>
</div>

@code {
    private async ValueTask<ItemsProviderResult<Employee>> LoadEmployees(
        VirtualizeItemsProviderRequest<Employee> request)
    {
        var result = await EmployeeService.GetPageAsync(
            request.StartIndex,
            request.Count,
            request.CancellationToken);

        return new ItemsProviderResult<Employee>(result.Items, result.TotalCount);
    }
}`
    },
    {
      label: 'Placeholder template',
      language: 'csharp',
      code: `<Virtualize ItemsProvider="LoadItems" ItemSize="72" Context="item">
    <ItemContent>
        <div class="card">
            <h3>@item.Title</h3>
            <p>@item.Description</p>
        </div>
    </ItemContent>
    <Placeholder>
        <!-- Shown while items are being fetched by the provider -->
        <div class="card skeleton">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
        </div>
    </Placeholder>
</Virtualize>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not wrapping Virtualize in a scrollable container',
      wrong: '<Virtualize Items="items" />  // no parent with fixed height + overflow',
      right: '<div style="height:500px; overflow-y:scroll">\n    <Virtualize Items="items" />\n</div>',
      explanation: 'Virtualize needs a scrollable ancestor to determine the viewport. Without one, the component cannot calculate which items are visible and renders everything.'
    },
    {
      title: 'Setting an incorrect ItemSize causing scrollbar drift',
      wrong: '<Virtualize Items="items" ItemSize="50" />  // items are actually 120px tall',
      right: '<Virtualize Items="items" ItemSize="120" />  // measure your actual item height',
      explanation: 'An inaccurate ItemSize causes the spacer height to be wrong. As items render, the scrollbar jumps — giving a jarring user experience. Measure the rendered height and match ItemSize.'
    },
    {
      title: 'Not returning the total count from ItemsProvider',
      wrong: 'return new ItemsProviderResult<T>(pageItems, pageItems.Count);',
      right: 'return new ItemsProviderResult<T>(pageItems, totalCount);',
      explanation: 'The second argument must be the TOTAL item count across all pages — not just the current page size. Virtualize uses this to size the bottom spacer correctly.'
    },
    {
      title: 'Using Virtualize with Static SSR',
      wrong: '// No @rendermode on a page using Virtualize with scroll events',
      right: '@rendermode InteractiveServer  // or InteractiveWebAssembly',
      explanation: 'Virtualize needs scroll event interop to track viewport position. It requires interactive render mode — it does not work in Static SSR.'
    },
    {
      title: 'Nesting Virtualize inside another Virtualize',
      wrong: '<Virtualize Items="groups">\n    <Virtualize Items="context.Items" />  // nested',
      right: '// Flatten the data or use a flat Virtualize with group headers as special items',
      explanation: 'Nested Virtualize components have conflicting scroll contexts. Flatten grouped data into a single list where group headers are just special item types.'
    },
  ];

  challenge: Challenge = {
    title: 'Virtualised Contact List with Search',
    language: 'csharp',
    description: 'Build a contact list page with 10 000 contacts. Use Virtualize to render only visible rows (each row is 64px). Add a search input that filters the contacts — use @bind:event="oninput" for live filtering. Show the visible count and total count.',
    hints: [
      'Generate 10 000 contacts with Enumerable.Range in OnInitialized.',
      'Maintain a separate `filtered` list that reacts to the search term.',
      'Pass `filtered` to Virtualize Items= and recalculate on each keystroke.',
    ],
    starterCode: `@rendermode InteractiveServer

<input @bind="search" @bind:event="oninput" placeholder="Search..." />
<p>Showing @filtered.Count of @contacts.Count</p>

<div style="height:600px; overflow-y:scroll">
    <Virtualize Items="filtered" ItemSize="64" Context="c">
        <!-- TODO: render each contact -->
    </Virtualize>
</div>

@code {
    record Contact(int Id, string Name, string Email);
    private List<Contact> contacts = [];
    private List<Contact> filtered = [];
    private string search = "";
    // TODO: init contacts, filter on search
}`,
    solution: `@rendermode InteractiveServer

<input @bind="search" @bind:event="oninput" @bind:after="Filter" placeholder="Search..." />
<p>Showing @filtered.Count of @contacts.Count contacts</p>

<div style="height:600px; overflow-y:scroll">
    <Virtualize Items="filtered" ItemSize="64" Context="c">
        <div style="height:64px; display:flex; align-items:center; border-bottom:1px solid #eee; padding:0 1rem">
            <strong>@c.Name</strong>&nbsp;— @c.Email
        </div>
    </Virtualize>
</div>

@code {
    record Contact(int Id, string Name, string Email);
    private List<Contact> contacts = [];
    private List<Contact> filtered = [];
    private string search = "";

    protected override void OnInitialized()
    {
        contacts = Enumerable.Range(1, 10_000)
            .Select(i => new Contact(i, $"Contact {i}", $"contact{i}@example.com"))
            .ToList();
        filtered = contacts;
    }

    private void Filter()
    {
        filtered = string.IsNullOrWhiteSpace(search)
            ? contacts
            : contacts.Where(c => c.Name.Contains(search, StringComparison.OrdinalIgnoreCase)
                               || c.Email.Contains(search, StringComparison.OrdinalIgnoreCase))
                      .ToList();
    }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does Virtualize render for off-screen items?', options: ['Nothing', 'Empty divs', 'Spacer divs with calculated height', 'Collapsed rows'], answer: 2, explanation: 'Virtualize replaces off-screen items with top and bottom spacer divs whose combined height equals (invisible items × ItemSize), keeping the scrollbar accurate.' },
    { q: 'When should you use ItemsProvider instead of Items=?', options: ['When the list has less than 100 items', 'When data is on a remote server and you only want to fetch the visible window', 'When using Blazor WASM', 'When items have variable heights'], answer: 1, explanation: 'ItemsProvider is for server-side paging — the callback is called with the visible range and fetches only those rows, enabling virtualization over millions of server-side records.' },
    { q: 'What is OverscanCount?', options: ['Number of items above the list', 'Extra items rendered outside the viewport as a scroll buffer', 'Max items in a page', 'Cache size in items'], answer: 1, explanation: 'OverscanCount (default 3) renders a few extra items above and below the viewport to smooth scroll momentum. Higher values reduce jank but add DOM nodes.' },
    { q: 'What is the second argument in ItemsProviderResult<T>?', options: ['Page size', 'Number of items fetched', 'Total item count across all pages', 'Scroll position'], answer: 2, explanation: 'The total count tells Virtualize how large the bottom spacer should be. Without the accurate total, the scrollbar won\'t reflect the real data size.' },
    { q: 'Which render mode does Virtualize require?', options: ['Static SSR', 'Any mode', 'Interactive Server or WASM', 'InteractiveAuto only'], answer: 2, explanation: 'Virtualize uses scroll event interop to track viewport position. It requires an interactive render mode (Server or WASM) — it does not function in Static SSR.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can Virtualize handle variable-height items?', a: 'Not natively. Virtualize assumes all items have the same height (ItemSize). For variable heights, you need to either normalise item heights, group items into fixed-size rows, or use a third-party library that supports variable heights.' },
    { q: 'How do I scroll to a specific item programmatically?', a: 'There is no built-in API for this. You need JS interop to scroll the container to the calculated offset (item index × ItemSize). Alternatively, use an element reference on the container and call scrollTop in JavaScript.' },
    { q: 'Is Virtualize suitable for horizontally scrolling lists?', a: 'Virtualize is designed for vertical lists. Horizontal virtualization is not supported natively. For grids or horizontal scroll, use a third-party data grid library that implements both axes.' },
    { q: 'How do I refresh Virtualize after data changes?', a: 'When using Items=, just update the collection — Blazor re-renders on state change and Virtualize adapts. When using ItemsProvider=, call RefreshDataAsync() on a Virtualize @ref to force the provider to re-fetch the current window.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor\'s Virtualize component renders only visible list items, replacing off-screen rows with spacers — enabling smooth scroll over 100 000-row datasets with minimal DOM size.',
    mustKnow: [
      'Virtualize renders only viewport-visible items — off-screen items become spacers.',
      'Requires a scrollable parent container with a fixed height.',
      'Items= for in-memory data; ItemsProvider= for server-side paging.',
      'ItemSize must be accurate — wrong value causes scrollbar drift.',
      'ItemsProviderResult must include the TOTAL count, not just the page size.',
      'Requires interactive render mode — does not work in Static SSR.',
    ],
    interviewFocus: [
      'How does Virtualize maintain scrollbar accuracy without rendering all rows?',
      'When would you use ItemsProvider instead of Items=?',
      'What happens if ItemSize is significantly wrong?',
    ]
  };
}
