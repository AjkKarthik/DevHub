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
  templateUrl: './sectionoutlet-matching-is-a-global-lookup-not-ancestor-scoped.html',
  styleUrl: './sectionoutlet-matching-is-a-global-lookup-not-ancestor-scoped.scss'
})
export class SectionoutletMatchingIsAGlobalLookupNotAncestorScopedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'It would be reasonable to assume Sections are scoped like CSS custom properties or cascading values — nearest-ancestor wins. They are not.',
      points: [
        'SectionContent and SectionOutlet are matched through a single, shared, string-keyed registry held on the component renderer\'s dispatcher — one registry per circuit (Blazor Server) or per app instance (WebAssembly). There is no concept of "nearest enclosing SectionOutlet" or any parent/child relationship check anywhere in the matching logic — it is a flat lookup by SectionName (or a SectionId object) across the ENTIRE current render tree.',
        'This means a SectionContent component supplying content for SectionName="sidebar" will target the SAME SectionOutlet as ANY other SectionContent anywhere in the app using that same name — even in a completely unrelated component subtree with no ancestor/descendant relationship to that outlet at all. Two independent features that each happen to pick the name "sidebar" for their own unrelated purpose will collide.',
      ]
    },
    {
      heading: 'A second surprising consequence: a duplicate SectionOutlet for the same name doesn\'t just silently misbehave — it throws',
      points: [
        'The registry enforces at most ONE subscribed SectionOutlet per identifier at a time — attempting to render a second SectionOutlet with the same SectionName while another is already active throws an exception, rather than silently ignoring the duplicate or picking one arbitrarily. This is a genuinely different failure mode from the SectionContent side, where duplicates simply compete for "last one wins" instead of throwing.',
        'Combined, this means SectionName strings function as a genuinely GLOBAL namespace within a user\'s session — not a locally-scoped slot name that only matters within one layout\'s own subtree — making deliberately distinctive, unlikely-to-collide names (a specific app-and-feature prefix rather than a generic word like "sidebar" or "toolbar") a real, practical safety measure once an app has more than a couple of layouts or reusable widget types using Sections.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two unrelated features accidentally collide on the same name',
      language: 'csharp',
      code: `<!-- AdminLayout.razor — an entirely separate part of the app -->
@inherits LayoutComponentBase
<SectionOutlet SectionName="toolbar" />
@Body

<!-- ReportsWidget.razor — used deep inside a totally different
     page tree, with no ancestor relationship to AdminLayout at all -->
<SectionContent SectionName="toolbar">
    <button>Export Report</button>
</SectionContent>

<!-- The developer building ReportsWidget picked "toolbar" thinking
     of it as a locally-scoped name for wherever ReportsWidget
     happens to be used. It isn't — if ReportsWidget is ever
     rendered on a page that ALSO uses AdminLayout's toolbar
     SectionOutlet, ReportsWidget's content competes for and can
     silently override the toolbar's intended content, despite
     having no structural relationship to AdminLayout whatsoever. -->`,
    },
    {
      label: 'A duplicate SectionOutlet throws, rather than silently misbehaving',
      language: 'csharp',
      code: `<!-- MainLayout.razor -->
@inherits LayoutComponentBase
<SectionOutlet SectionName="notifications" />
@Body

<!-- Somewhere else on the SAME page's render tree — perhaps a
     nested component the developer forgot already declares its
     own outlet for the same name -->
<SectionOutlet SectionName="notifications" />

<!-- This throws at render time — Blazor's Sections registry only
     allows ONE active SectionOutlet subscriber per identifier.
     Unlike the SectionContent side (which just competes for "last
     one wins"), a genuine SectionOutlet naming collision is a hard
     failure, not a silent one. -->`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A large app has an AdminLayout with a SectionOutlet SectionName="toolbar", used by admin pages to let each page supply its own toolbar buttons. Separately, a completely unrelated ReportsWidget component (used on customer-facing pages that have nothing to do with AdminLayout) also declares SectionContent SectionName="toolbar" for its own export button, assuming the name only matters within wherever ReportsWidget itself is used. One day, a developer adds ReportsWidget to an admin page that also uses AdminLayout. What happens to the toolbar, and why does ReportsWidget\'s assumption turn out to be wrong?',
    hint: 'Is SectionOutlet/SectionContent matching based on any parent-child or ancestor relationship in the component tree, or is it a flat, string-keyed lookup shared across the WHOLE current render tree?',
    solution: 'ReportsWidget\'s assumption is exactly the bug — Sections matching has no concept of ancestor relationships at all; it\'s a single, flat, string-keyed registry shared across the entire current render tree (one per circuit or app instance). Once ReportsWidget (with its own SectionContent SectionName="toolbar") is rendered anywhere on the same page as AdminLayout\'s toolbar SectionOutlet, it becomes just another competing provider for that SAME identifier — with no structural relationship to AdminLayout required or checked. Depending on registration timing, ReportsWidget\'s "Export Report" button can silently replace whatever the admin page\'s own SectionContent was supplying to that toolbar, purely because both happened to choose the generic name "toolbar" for what each developer assumed was a locally-scoped slot. The fix is treating SectionName strings as a genuinely global namespace within the app — using distinctive, feature-specific names (e.g. "admin-toolbar" vs. "reports-widget-toolbar") rather than generic ones, especially once an app has more than a couple of independently-developed features using Sections.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SectionOutlet only receives content from SectionContent components that are actual descendants of that outlet somewhere in the component tree — similar to how a cascading value only flows to descendants.',
      reality: 'This subtopic\'s theory clarifies Sections matching is a flat, string-keyed registry with ZERO ancestor-relationship awareness — any SectionContent anywhere in the current render tree using a matching SectionName competes for that SAME outlet, regardless of structural relationship.'
    },
    {
      thought: 'Picking a short, generic SectionName like "sidebar" or "toolbar" is safe as long as it makes sense within the specific layout or component where it\'s used.',
      reality: 'This subtopic\'s exercise shows generic names are exactly what causes accidental collisions between unrelated features — since matching is app-wide, not locally scoped, a distinctive, feature-specific name is the actual safety measure.'
    },
    {
      thought: 'If two components both declare a SectionOutlet with the same SectionName, Blazor picks one to actually use and silently ignores the other, similar to how duplicate SectionContent providers just compete for "last one wins."',
      reality: 'This subtopic\'s theory shows this is a genuinely different failure mode — a duplicate active SectionOutlet for the same identifier THROWS an exception rather than silently picking one, unlike the SectionContent side which does compete quietly instead of erroring.'
    }
  ];
}
