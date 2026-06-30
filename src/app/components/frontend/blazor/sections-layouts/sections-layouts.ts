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
  selector: 'app-blazor-sections-layouts',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sections-layouts.html',
  styleUrl: './sections-layouts.scss'
})
export class BlazorSectionsLayouts {
  quickRef: QuickRefItem[] = [
    { name: '@layout LayoutName', type: 'syntax', desc: 'Applies a layout to a page component.' },
    { name: 'LayoutComponentBase', type: 'class', desc: 'Base class for layout components; exposes @Body.' },
    { name: '@Body', type: 'syntax', desc: 'Renders the page content inside a layout.' },
    { name: 'SectionContent', type: 'keyword', desc: 'Supplies content to a named section from any component.' },
    { name: 'SectionOutlet', type: 'keyword', desc: 'Marks where a named section\'s content is rendered.' },
    { name: 'DefaultLayout', type: 'keyword', desc: 'Set in RouteView — layout used when no @layout is specified.' },
    { name: '@inherits LayoutComponentBase', type: 'syntax', desc: 'Required in a layout .razor file.' },
    { name: 'HeadContent', type: 'keyword', desc: 'Section for injecting content into <head> from a page.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Layouts with @layout and LayoutComponentBase',
      points: ['A layout is a Razor component that inherits `LayoutComponentBase` and uses `@Body` to render the page content. Pages opt in with `@layout MyLayout`. You can set a default layout for all pages via `<RouteView DefaultLayout="typeof(MainLayout)">` in App.razor. Layouts can be nested: a dashboard layout can itself use a root layout, giving you a two-level shell without prop-drilling.',
      '@layout MyLayout applies a layout to the current page.', '@Body in the layout is replaced with the page\'s content.', 'DefaultLayout in RouteView applies to all pages without an explicit @layout.', 'Layouts can nest — a layout can have its own @layout.']
    },
    {
      heading: 'Sections — SectionContent and SectionOutlet',
      points: ['The Sections API (.NET 8) lets any component inject content into a named slot in a layout or ancestor component. In the layout, place `<SectionOutlet SectionName="sidebar" />`. In any page or component, use `<SectionContent SectionName="sidebar">` to supply the content. This is the recommended way to populate sidebars, breadcrumbs, action toolbars, and page titles from pages into the layout.',
      'SectionOutlet declares where section content appears.', 'SectionContent supplies the actual content from a page.', 'Multiple SectionContent for the same name: last one wins.', 'Perfect for sidebar, page-title, and toolbar slots in layouts.']
    },
    {
      heading: 'HeadContent for per-page head elements',
      points: ['Use `<HeadContent>` to inject per-page CSS links, script tags, or preload hints into the document `<head>`. Combine it with `<PageTitle>` for the browser tab title. Both components render into the HeadOutlet defined in App.razor. This avoids per-page JavaScript and keeps head management declarative in Razor.',
      '<PageTitle> sets the browser tab title from any component.', '<HeadContent> injects into the document <head>.', 'HeadOutlet in App.razor is where they render.', 'Works in both Static SSR and interactive modes.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Layout component',
      language: 'csharp',
      code: `<!-- MainLayout.razor -->
@inherits LayoutComponentBase

<div class="shell">
    <header>
        <nav><!-- nav links --></nav>
    </header>

    <aside>
        <!-- Sidebar slot — populated by pages via SectionContent -->
        <SectionOutlet SectionName="sidebar" />
    </aside>

    <main>
        @Body
    </main>
</div>

<!-- DashboardLayout.razor — nested layout -->
@inherits LayoutComponentBase
@layout MainLayout

<div class="dashboard-chrome">
    <SectionOutlet SectionName="page-title" />
    @Body
</div>`
    },
    {
      label: 'Page using layout and sections',
      language: 'csharp',
      code: `@page "/products"
@layout DashboardLayout

<!-- Supply the page title slot -->
<SectionContent SectionName="page-title">
    <h1>Products</h1>
</SectionContent>

<!-- Supply the sidebar slot -->
<SectionContent SectionName="sidebar">
    <ul>
        <li><a href="/products">All</a></li>
        <li><a href="/products/sale">On Sale</a></li>
    </ul>
</SectionContent>

<!-- This is @Body content in DashboardLayout -->
<ProductGrid />`
    },
    {
      label: 'HeadContent & PageTitle',
      language: 'csharp',
      code: `@page "/checkout"

<PageTitle>Checkout — MyStore</PageTitle>

<HeadContent>
    <link rel="stylesheet" href="checkout.css" />
    <meta name="description" content="Secure checkout at MyStore" />
</HeadContent>

<h1>Checkout</h1>
<!-- rest of page -->`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting @inherits LayoutComponentBase in a layout',
      wrong: '@page "/"\n<!-- Layout component without inheriting base class -->',
      right: '@inherits LayoutComponentBase\n<!-- No @page directive on layouts -->',
      explanation: 'Without inheriting LayoutComponentBase, @Body is undefined and the layout cannot render page content. Also, layouts should not have @page directives — they are not routed.'
    },
    {
      title: 'Using @page in a layout component',
      wrong: '@page "/"\n@inherits LayoutComponentBase',
      right: '@inherits LayoutComponentBase\n// No @page — layouts are not directly navigatable',
      explanation: 'Layouts are applied to pages, not navigated to directly. Adding @page makes them appear as routes in the router, which is almost never desired.'
    },
    {
      title: 'Putting SectionContent after @Body in the layout renders it too late',
      wrong: '<!-- SectionContent in the layout itself — wrong direction -->',
      right: '// SectionContent goes in the PAGE; SectionOutlet goes in the LAYOUT',
      explanation: 'The direction is: page (provider) → layout (consumer). SectionContent supplies content from pages; SectionOutlet consumes it in the layout or ancestor component.'
    },
    {
      title: 'Missing HeadOutlet in App.razor',
      wrong: '<!-- PageTitle and HeadContent have no outlet -->',
      right: '<head>\n    <HeadOutlet />\n    <!-- other static head content -->\n</head>',
      explanation: 'PageTitle and HeadContent render into a HeadOutlet. Without it in App.razor, page titles and dynamic head elements are silently dropped.'
    },
    {
      title: 'Applying @layout to a layout component',
      wrong: '<!-- DashboardLayout.razor -->\n@layout DashboardLayout  // circular reference',
      right: '@layout MainLayout  // nest into a different parent layout',
      explanation: 'A layout cannot apply itself as its own layout — this creates a circular reference. Nest into a different ancestor layout, or omit @layout for the root layout.'
    },
  ];

  challenge: Challenge = {
    title: 'Dashboard with Dynamic Sidebar',
    language: 'csharp',
    description: 'Build a MainLayout with a header, a `<SectionOutlet SectionName="sidebar">`, and a main area for @Body. Create a Products page and an Orders page. Each page uses SectionContent to supply its own sidebar links. The Products sidebar links to Product categories; the Orders sidebar links to date filters.',
    hints: [
      'MainLayout uses @inherits LayoutComponentBase and places SectionOutlet in the aside.',
      'Each page file uses @layout MainLayout and provides <SectionContent SectionName="sidebar">.',
      'The sidebar changes automatically when you navigate between pages.',
    ],
    starterCode: `<!-- MainLayout.razor -->
@inherits LayoutComponentBase
<!-- TODO: layout with sidebar outlet -->

<!-- Products.razor -->
@page "/products"
@layout MainLayout
<!-- TODO: section content + page body -->`,
    solution: `<!-- MainLayout.razor -->
@inherits LayoutComponentBase
<div style="display:flex">
    <aside style="width:200px">
        <SectionOutlet SectionName="sidebar" />
    </aside>
    <main style="flex:1">@Body</main>
</div>

<!-- Products.razor -->
@page "/products"
@layout MainLayout
<SectionContent SectionName="sidebar">
    <ul>
        <li><a href="/products?cat=electronics">Electronics</a></li>
        <li><a href="/products?cat=clothing">Clothing</a></li>
    </ul>
</SectionContent>
<h1>Products</h1>
<p>Browse our full catalogue.</p>

<!-- Orders.razor -->
@page "/orders"
@layout MainLayout
<SectionContent SectionName="sidebar">
    <ul>
        <li><a href="/orders?d=today">Today</a></li>
        <li><a href="/orders?d=week">This Week</a></li>
        <li><a href="/orders?d=month">This Month</a></li>
    </ul>
</SectionContent>
<h1>Orders</h1>
<p>Your recent orders.</p>`
  };

  quiz: QuizQuestion[] = [
    { q: 'What base class must a layout inherit?', options: ['ComponentBase', 'LayoutBase', 'LayoutComponentBase', 'RazorLayout'], answer: 2, explanation: 'LayoutComponentBase provides the Body property that renders the page content. Without inheriting it, @Body is undefined.' },
    { q: 'Which component marks where section content appears in a layout?', options: ['SectionContent', 'SectionSlot', 'SectionOutlet', 'SlotContent'], answer: 2, explanation: 'SectionOutlet is placed in the layout (or ancestor) to mark where named section content will be rendered.' },
    { q: 'Where does SectionContent go?', options: ['In the layout component', 'In the page or any descendant component', 'In App.razor', 'In Program.cs'], answer: 1, explanation: 'SectionContent goes in the page or any component in the page\'s subtree — it "pushes" content up to the nearest matching SectionOutlet in an ancestor.' },
    { q: 'What renders HeadContent and PageTitle into the DOM?', options: ['<head> directly', 'HeadOutlet in App.razor', 'A special middleware', 'The browser automatically'], answer: 1, explanation: 'HeadOutlet is placed in the <head> of App.razor. It renders all PageTitle and HeadContent pushed from components in the current page.' },
    { q: 'Can layouts be nested?', options: ['No — one layout per app', 'Yes — a layout can have its own @layout', 'Only in WASM mode', 'Only using inheritance'], answer: 1, explanation: 'Blazor supports nested layouts. A DashboardLayout can apply @layout MainLayout, giving you a two-level shell for admin vs public sections.' },
    { q: 'How do you apply a default layout to all pages in a folder without adding @layout to each file?', options: ['Set it in Program.cs', 'Add a @layout directive in _Imports.razor for that folder', 'Use app.UseLayout() middleware', 'Create a DefaultLayout.razor file'], answer: 1, explanation: '_Imports.razor in any folder applies its directives to all .razor files in that folder and subdirectories. Adding @layout AdminLayout in _Imports.razor automatically applies AdminLayout to every page in the admin section — without modifying each page file.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do I apply a different layout to a section of the app?', a: 'Create a separate layout component and apply it with @layout on each page in that section, or set it as the default in a _Imports.razor file placed in that section\'s folder. An _Imports.razor @layout directive applies to all pages in the same directory and subdirectories.' },
    { q: 'Can I have multiple SectionContent for the same SectionName?', a: 'Yes, but only the last one rendered wins. If multiple components provide content for the same name, the most recently rendered one takes effect. This can be used intentionally (a child overrides a parent\'s default section content).' },
    { q: 'Is there a difference between @layout and DefaultLayout?', a: '@layout in a .razor file applies that specific layout to just that page. DefaultLayout in RouteView applies to all pages that don\'t have an explicit @layout. An explicit @layout always overrides the DefaultLayout.' },
    { q: 'Can I use sections with Static SSR?', a: 'Yes. SectionContent and SectionOutlet work in Static SSR, Interactive Server, WASM, and Hybrid modes. They are pure Blazor rendering features with no mode-specific restrictions.' },
    { q: 'What is the difference between a Blazor Layout component and a SectionContent/SectionOutlet pair?',
      a: 'A Layout component (inheriting LayoutComponentBase) wraps a page\'s content via @Body, providing the consistent outer shell (nav, header, footer) for every page using that layout — but it can only render content the page passes as its single Body. SectionContent and SectionOutlet (introduced in .NET 8) let a page inject content into a NAMED location defined anywhere in the layout (not just the single @Body slot) — useful for a page needing to populate a layout\'s sidebar or page-title area independently from its main body content.' },
    { q: 'Why might a deeply nested layout hierarchy (layout within a layout) cause confusion, and how do you manage it cleanly?',
      a: 'Each layout can itself specify its own @layout directive pointing to a parent layout, creating a chain — while powerful for sharing structure (a base "AppLayout" wrapping an "AdminLayout" wrapping a specific admin page), excessive nesting makes it hard to trace where a given piece of chrome (a header, a particular CSS class) actually originates from. Keep layout hierarchies shallow (2-3 levels at most) and use clear, descriptive layout names, documenting which layout each route group uses, to avoid the "which layout is actually rendering this" confusion in larger apps.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor layouts use @layout + LayoutComponentBase + @Body for page shells, and the Sections API (SectionContent / SectionOutlet) lets pages inject dynamic content into layout slots without prop-drilling.',
    mustKnow: [
      '@inherits LayoutComponentBase and @Body are required in every layout.',
      '@layout MyLayout applies a layout to a page; DefaultLayout is the app-wide default.',
      'SectionOutlet marks a slot in the layout; SectionContent fills it from a page.',
      'Layouts can nest — use @layout on a layout component to chain shells.',
      'HeadOutlet in App.razor renders PageTitle and HeadContent from pages.',
      'Layouts should NOT have @page directives.',
    ],
    interviewFocus: [
      'How does the Sections API differ from using [Parameter] for layout slots?',
      'What is the purpose of LayoutComponentBase?',
      'How do you apply different layouts to different sections of a Blazor app?',
    ]
  };
}
