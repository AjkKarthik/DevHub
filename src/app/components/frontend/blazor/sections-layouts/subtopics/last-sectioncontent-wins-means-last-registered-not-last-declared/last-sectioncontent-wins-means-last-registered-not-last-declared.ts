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
  templateUrl: './last-sectioncontent-wins-means-last-registered-not-last-declared.html',
  styleUrl: './last-sectioncontent-wins-means-last-registered-not-last-declared.scss'
})
export class LastSectioncontentWinsMeansLastRegisteredNotLastDeclaredSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s QnA states "the last one rendered wins" — the precise mechanism is registration order, not markup order',
      points: [
        'Internally, Blazor keeps a list of every SectionContent instance targeting a given SectionName. Each time a SectionContent component\'s parameters are set (including on its very first render), it appends itself to the END of that list. The matching SectionOutlet always displays whichever provider is LAST in the list — there is no markup-position or file-declaration-order check anywhere in this mechanism.',
        'This means "last one wins" really means "whichever SectionContent instance most recently finished setting its parameters in REAL TIME" — for two SectionContent components that both render synchronously during the same initial render pass, this usually does line up with their position in the render tree. But it is fundamentally a timing-based registration order, not a structural one.',
      ]
    },
    {
      heading: 'Why this becomes a real, non-obvious gotcha with async components',
      points: [
        'A SectionContent living inside a component that awaits data before rendering (e.g. inside an OnInitializedAsync that fetches something) does not register itself until AFTER that await completes — meaning its registration can happen well after a sibling SectionContent\'s synchronous, instant registration, even if the async component appears EARLIER in the page\'s markup.',
        'The practical consequence: a page with two components both supplying SectionContent for the same name, where the LATER-declared one loads instantly and the EARLIER-declared one has a slow data dependency, will show the fast one\'s content first, then have it silently REPLACED by the slow one\'s content once its async work finally completes and it registers — a timing-dependent, hard-to-reproduce-in-a-quick-test bug.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two SectionContent providers, one synchronous, one async',
      language: 'csharp',
      code: `<!-- Page.razor -->
@page "/dashboard"
@layout MainLayout

<!-- Declared FIRST in markup, but has a slow data dependency -->
<SlowWidget />

<!-- Declared SECOND in markup, renders instantly -->
<FastWidget />

<!-- SlowWidget.razor -->
<SectionContent SectionName="toolbar">
    <span>Slow widget's toolbar button</span>
</SectionContent>

@code {
    protected override async Task OnInitializedAsync()
    {
        // SectionContent here doesn't REGISTER until this
        // completes — its parameters aren't set until after
        // this await, even though it's declared first in markup.
        await Task.Delay(2000);
    }
}

<!-- FastWidget.razor -->
<SectionContent SectionName="toolbar">
    <span>Fast widget's toolbar button</span>
</SectionContent>
<!-- No async work — registers essentially immediately.

     RESULT: FastWidget's content shows first (registers first,
     since it has no delay). ~2 seconds later, SlowWidget finally
     finishes its OnInitializedAsync, its SectionContent registers,
     and SILENTLY REPLACES FastWidget's content in the SAME
     toolbar SectionOutlet — even though FastWidget is declared
     SECOND in the markup. -->`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two sibling components both supply SectionContent for the same SectionName="toolbar". Component A is declared first in the page\'s markup and has a 3-second async data dependency in OnInitializedAsync before it renders anything. Component B is declared second and renders instantly with no async work. When the page loads, which component\'s content appears in the toolbar first, and does it change afterward? Explain using the actual registration mechanism, not markup order.',
    hint: 'SectionOutlet always displays whichever SectionContent instance most recently finished setting its parameters — does that depend on markup declaration order, or on which component\'s render actually completes first in real wall-clock time?',
    solution: 'Component B\'s content appears first, since it has no async delay and registers itself with the SectionOutlet almost immediately — well before Component A, which is still awaiting its 3-second data fetch and hasn\'t even set its SectionContent parameters yet. About 3 seconds later, once Component A\'s OnInitializedAsync finally completes, its SectionContent registers for the first time, becomes the new LAST entry in the toolbar\'s provider list, and the SectionOutlet switches to displaying Component A\'s content instead — silently replacing Component B\'s, even though Component A was declared FIRST in the markup. The registration mechanism tracks real-time completion order, with zero awareness of markup declaration order, which is exactly why the visually "first" component in the file can still end up winning the SectionOutlet last, simply by finishing its async work later.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Last one wins" for duplicate SectionContent providers refers to whichever one is declared LAST in the page\'s markup or file structure.',
      reality: 'This subtopic\'s theory clarifies the mechanism tracks REGISTRATION order in real time (when a SectionContent\'s parameters are actually set), completely independent of markup position — an async component declared first can still register, and therefore win, last.'
    },
    {
      thought: 'Since Blazor rendering is largely synchronous and predictable, "last one wins" behavior for SectionContent should be consistent and easy to reason about from reading the markup alone.',
      reality: 'This subtopic\'s exercise shows an async data dependency on ANY of the competing SectionContent providers introduces real timing-dependence — the winner can depend on which component\'s async work finishes first, not on anything visible from just reading the .razor markup.'
    },
    {
      thought: 'If a toolbar or sidebar section unexpectedly shows the "wrong" component\'s content, the SectionOutlet or SectionContent components themselves must be misconfigured.',
      reality: 'This subtopic\'s theory shows this can be entirely expected, correct behavior when multiple components genuinely target the same SectionName — the fix isn\'t reconfiguring Sections, it\'s either giving each provider a distinct SectionName or ensuring only one component in the current render tree ever targets that name at a time.'
    }
  ];
}
