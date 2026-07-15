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
  templateUrl: './virtualize-discards-stale-itemsprovider-results-itself.html',
  styleUrl: './virtualize-discards-stale-itemsprovider-results-itself.scss'
})
export class VirtualizeDiscardsStaleItemsProviderResultsItselfSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s QnA is good advice, but worth a precise correction: forwarding CancellationToken is for EFFICIENCY, not for preventing a stale result from overwriting the view',
      points: [
        'The QnA describes a real risk — a slow, superseded request resolving after a newer one and "overwriting the correctly-fetched current view with outdated data" — and recommends passing the CancellationToken through to fix it. What it doesn\'t make explicit: Virtualize protects itself against this specific outcome regardless of whether the provider cooperates with cancellation at all.',
        'Internally, Virtualize cancels the PREVIOUS request\'s token the moment a newer request starts, then checks that SAME captured token immediately before applying any result to the rendered list. Even if a provider completely ignores the token, keeps running, and eventually returns a result for a now-superseded request, Virtualize detects that the token was already cancelled and discards the result rather than rendering it — the stale data can never actually reach the screen.',
      ]
    },
    {
      heading: 'So what does forwarding the token actually buy you, if not correctness?',
      points: [
        'Efficiency, specifically early termination of wasted work. A provider that ignores the token keeps its slow HTTP call or database query running to completion even after Virtualize has already decided to discard whatever comes back — burning bandwidth, server load, and database connections on a result nobody will ever see. A provider that DOES forward the token can abort that work immediately once superseded, rather than letting it run to a pointless completion.',
        'This distinction matters for how you should reason about the CancellationToken: it is not a correctness requirement (Virtualize\'s own result-discarding logic guarantees the final rendered state is always consistent with the most recent request either way) — it is a resource-efficiency optimization, worth doing for any provider backed by a genuinely expensive remote call, but not something whose absence introduces a visible bug in what actually appears on screen.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A provider that ignores CancellationToken — wasteful, but still correct',
      language: 'csharp',
      code: `private async ValueTask<ItemsProviderResult<Employee>> LoadEmployees(
    VirtualizeItemsProviderRequest<Employee> request)
{
    // BUG (efficiency, not correctness): the CancellationToken is
    // never passed to GetPageAsync. If the user scrolls rapidly,
    // this call keeps running to completion even after Virtualize
    // has already moved on to a newer request — wasting a full
    // database round-trip on a result that Virtualize is about to
    // discard anyway.
    var result = await EmployeeService.GetPageAsync(
        request.StartIndex,
        request.Count);
        // Missing: request.CancellationToken

    // Even though this line still executes and returns a value,
    // Virtualize checks its OWN internal token before applying this
    // result — if a newer request has since started, this result is
    // silently discarded here, never reaching the rendered list.
    return new ItemsProviderResult<Employee>(result.Items, result.TotalCount);
}`,
    },
    {
      label: 'A provider that forwards the token — same correctness, less wasted work',
      language: 'csharp',
      code: `private async ValueTask<ItemsProviderResult<Employee>> LoadEmployees(
    VirtualizeItemsProviderRequest<Employee> request)
{
    // Forwarding the token lets the underlying call abort EARLY
    // once superseded, instead of running to a pointless
    // completion. This doesn't change WHAT ends up on screen —
    // Virtualize already guarantees that either way — it just
    // avoids burning bandwidth/database load on discarded work.
    var result = await EmployeeService.GetPageAsync(
        request.StartIndex,
        request.Count,
        request.CancellationToken);

    return new ItemsProviderResult<Employee>(result.Items, result.TotalCount);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer\'s ItemsProvider callback never forwards the CancellationToken to its underlying database query. A colleague reviewing the code flags this as "a bug — fast scrolling could show the wrong page of data on screen once a stale request finally resolves." Is the colleague\'s concern about incorrect on-screen data accurate? Explain precisely what forwarding the token does and does not protect against.',
    hint: 'Does Virtualize apply whatever result a provider returns unconditionally, or does it check something about the request before rendering the result? If it does check, what does an uncooperative provider actually cost — correctness, or something else?',
    solution: 'The colleague\'s specific concern (wrong data appearing on screen) is not accurate, though the code still has a real, different problem. Virtualize checks its own captured cancellation token immediately before applying any ItemsProvider result to the rendered list — it cancels the PREVIOUS request\'s token the moment a newer request starts, so even a provider that completely ignores the token and lets a stale request run to completion will have its late result silently discarded by Virtualize itself, never reaching the screen. The final rendered state is always consistent with the most recent request, regardless of provider cooperation. What forwarding the token actually protects against is EFFICIENCY, not correctness — without it, an ignored token lets wasted work (a full database round-trip or HTTP call) run to completion for a result nobody will ever see, burning bandwidth and server load. The fix is still worth making, but the accurate framing is "wasteful, not incorrect" — the colleague should flag it as a performance/resource-efficiency issue, not a data-correctness bug.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If an ItemsProvider callback doesn\'t forward the CancellationToken, a slow, superseded request can resolve after a newer one and overwrite the current correct view with stale data.',
      reality: 'This subtopic\'s theory clarifies Virtualize protects against exactly this outcome on its own, by checking its internal cancellation token before applying any result — an uncooperative provider\'s stale result is discarded regardless, so this specific failure mode cannot actually happen.'
    },
    {
      thought: 'Forwarding the CancellationToken to an ItemsProvider\'s underlying call is purely optional, cosmetic best-practice advice with no real consequence either way.',
      reality: 'This subtopic\'s exercise shows there IS a genuine cost to skipping it — just not the one usually assumed; an ignored token lets wasted, expensive work (a database query, an HTTP call) run to completion for a result that gets silently discarded, burning real bandwidth and server load even though the final displayed data stays correct.'
    },
    {
      thought: 'Since Virtualize discards stale results regardless of provider cooperation, there\'s no meaningful reason to bother forwarding the CancellationToken at all.',
      reality: 'This subtopic\'s theory shows the reason is resource efficiency, not correctness — for any provider backed by a genuinely expensive remote call, forwarding the token avoids running that expensive work to a pointless completion, which matters even though the on-screen result would be correct either way.'
    }
  ];
}
