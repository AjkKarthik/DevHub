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
  templateUrl: './overscancount-splits-evenly-with-no-scroll-direction-awareness.html',
  styleUrl: './overscancount-splits-evenly-with-no-scroll-direction-awareness.scss'
})
export class OverscancountSplitsEvenlyWithNoScrollDirectionAwarenessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes OverscanCount as "extra items rendered above/below the viewport" — worth being precise that this split is fixed, not adaptive',
      points: [
        'Internally, Virtualize applies the exact same OverscanCount value symmetrically, independent of scroll direction or velocity — the calculation that determines how many extra items to render above the visible range uses the identical constant as the calculation for extra items below. There is no signal anywhere in the component that tracks "the user is currently scrolling downward" and biases the buffer toward that direction.',
        'This means with OverscanCount="5", you always get 5 extra items rendered above AND 5 extra items rendered below the visible range — never, for example, 8 below and 2 above during fast downward scrolling, even though the items below are the ones about to become visible and the items above are the ones about to scroll further out of view.',
      ]
    },
    {
      heading: 'The practical consequence for fast, one-directional scrolling',
      points: [
        'During fast, sustained scrolling in ONE direction (a user dragging a scrollbar rapidly downward through a long list), the overscan buffer in the direction of travel can still be exhausted before new items finish rendering — producing a brief blank-spacer flash — while the EQUAL-SIZED buffer behind the scroll direction sits mostly unused, since those items were already visible moments ago and aren\'t the ones under scroll pressure.',
        'Since there is no way to bias OverscanCount toward one direction, the only real lever for reducing this specific symptom is increasing the overall OverscanCount value — which helps both directions equally (including the direction that didn\'t need it), at the cost of more total DOM nodes rendered at any given time. There is no "OverscanCount for scrolling down" vs "OverscanCount for scrolling up" setting to tune independently.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same OverscanCount value applies to both directions unconditionally',
      language: 'csharp',
      code: `<div style="height:600px; overflow-y:scroll">
    <Virtualize Items="employees" ItemSize="50" OverscanCount="5" Context="emp">
        <div class="employee-row">@emp.Name</div>
    </Virtualize>
</div>

<!-- With OverscanCount="5": ALWAYS renders 5 extra items above
     the visible range AND 5 extra items below it — this 5/5 split
     never changes based on whether the user is scrolling down,
     scrolling up, or not scrolling at all. There is no API to set
     a different value per direction. -->`,
    },
    {
      label: 'The only real lever: raising the total, not rebalancing the split',
      language: 'csharp',
      code: `<!-- If fast downward scrolling shows brief blank-spacer flashes,
     the fix is raising OverscanCount overall — which increases
     the buffer in BOTH directions, not just the one under
     pressure. There is no built-in way to give the "downward"
     buffer more items than the "upward" buffer. -->
<Virtualize Items="employees" ItemSize="50" OverscanCount="15" Context="emp">
    <div class="employee-row">@emp.Name</div>
</Virtualize>

<!-- This trades more total live DOM nodes (up to 30 extra items
     now, 15 above + 15 below, versus 10 before) for a bigger
     buffer in the direction that actually needed it — the
     unused-direction buffer grows proportionally too, since the
     value can't be split asymmetrically. -->`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices that dragging the scrollbar rapidly downward through a 100,000-row virtualized list occasionally shows a brief flash of blank spacer space before new rows render, while scrolling upward at the same speed never shows this issue. Someone suggests: "let\'s set OverscanCount higher specifically for the downward direction, since that\'s where the problem actually happens." Is this a viable fix as described? Explain what OverscanCount can and cannot be tuned to do.',
    hint: 'Does OverscanCount apply differently based on scroll direction, or does it always apply the exact same value both above and below the visible range?',
    solution: 'The suggestion isn\'t viable as described — OverscanCount has no direction-specific setting; the exact same value is always applied symmetrically both above and below the visible range, with no scroll-direction or velocity awareness anywhere in the component. There is no way to configure "more buffer below, less above." The only real lever available is raising the OverscanCount value overall, which does help the downward-scrolling symptom (more buffer below means more time before the buffer is exhausted during fast downward scrolling) — but it necessarily raises the upward buffer by the exact same amount too, even though upward scrolling was never actually a problem in this scenario. The tradeoff is more total live DOM nodes rendered at any given time (both buffers grow together) in exchange for reducing the blank-spacer flash — an acceptable and common fix, but the framing of "tune it for one direction only" isn\'t something OverscanCount\'s design supports.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'OverscanCount intelligently biases its buffer toward the direction the user is currently scrolling, rendering more extra items in the direction of travel and fewer behind it.',
      reality: 'This subtopic\'s theory clarifies OverscanCount applies the exact same value symmetrically above and below the visible range at all times — there is no scroll-direction or velocity signal feeding into this calculation anywhere in the component.'
    },
    {
      thought: 'If fast scrolling in one direction shows a blank-spacer flash, the fix is a direction-specific OverscanCount setting for that direction only.',
      reality: 'This subtopic\'s exercise shows no such per-direction setting exists — the only available lever is raising the single OverscanCount value overall, which increases the buffer in BOTH directions equally, including the direction that wasn\'t experiencing the problem.'
    },
    {
      thought: 'Since raising OverscanCount helps a scrolling-direction-specific symptom, it must be doing something direction-aware internally, even if that isn\'t explicitly documented.',
      reality: 'This subtopic\'s theory shows raising OverscanCount helps purely because it increases the SIZE of an already-symmetric buffer in both directions — the fix works despite having no direction awareness at all, not because of any hidden direction-specific logic.'
    }
  ];
}
