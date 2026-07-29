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
  templateUrl: './resolution-count-mismatch.html',
  styleUrl: './resolution-count-mismatch.scss'
})
export class ComputeFormulaUsed4ResolutionsLadderLists6Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A compute estimate whose multiplier doesn\'t match the resolution ladder stated one line above it',
      points: [
        'The Challenge solution\'s "transcodingStrategy" states: "Resolution ladder: 240p → 360p → 480p → 720p → 1080p → 4K" — six distinct resolution levels. The very next paragraph\'s compute calculation used: "500hrs/min × 4 resolutions × 30 min/hr = 60,000 vCPU-minutes/min" — four, not six. The page has been corrected to use 6, recomputing to 90,000 vCPU-minutes/min.',
        'This is catchable purely by counting the arrow-separated items in the page\'s own ladder ("240p → 360p → 480p → 720p → 1080p → 4K" = 6 items) and comparing that count against the "4 resolutions" figure used one paragraph later — no video-encoding expertise required.',
      ]
    },
    {
      heading: 'How the corrected multiplier propagates through the rest of the estimate',
      points: [
        'Compute demand scales with the multiplier: 500 hrs/min × 6 resolutions × 30 min/hr = 90,000 vCPU-minutes/min, a 50% increase over the original (incorrect) 60,000 figure.',
        'The downstream figures that were sized to the original 60,000 number needed the same proportional correction: the spot fleet size (~5,000 → ~7,500 c5.2xlarge instances) and the hourly cost estimates (peak $500/hr → $750/hr; average $200/hr → $300/hr) all scale by the same ~1.5× factor as the corrected compute demand.',
        'This is a good illustration of why catching an error in an EARLY number in a chain of derived estimates matters — the resolution-count mistake alone would have understated total compute, fleet size, and cost by a third across every downstream figure that built on it.',
      ]
    },
    {
      heading: 'A defensible simplification that was kept, worth being aware of',
      points: [
        'The corrected estimate still applies 4K\'s own transcoding time (30 min per hour of source video) uniformly across ALL six resolution levels, even though lower resolutions (240p, 360p) genuinely encode faster than 4K in practice — transcoding cost roughly scales with pixel count, so a 240p encode is meaningfully cheaper in compute than a 4K encode of the same source duration.',
        'This means the corrected 90,000 vCPU-minutes/min figure is intentionally a conservative UPPER BOUND (using the most expensive resolution\'s rate for every level), not a precisely-modeled per-resolution estimate — a reasonable simplification for a system design answer to make explicitly, which the corrected version now calls out directly rather than leaving implicit.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Recomputing with the correct resolution count',
      language: 'typescript',
      code: `interface ComputeEstimate {
  resolutionCount: number;
  hoursIngestedPerMinute: number;
  minutesToEncodePerHourOf4K: number;
  vcpuMinutesPerMinute: number;
}

function estimate(resolutionCount: number): ComputeEstimate {
  const hoursIngestedPerMinute = 500;
  const minutesToEncodePerHourOf4K = 30; // 4K's own rate, used as a
                                          // conservative upper bound
                                          // for every resolution level
  return {
    resolutionCount,
    hoursIngestedPerMinute,
    minutesToEncodePerHourOf4K,
    vcpuMinutesPerMinute: hoursIngestedPerMinute * resolutionCount * minutesToEncodePerHourOf4K,
  };
}

// The resolution ladder actually stated: 240p, 360p, 480p, 720p, 1080p, 4K
const ladder = ['240p', '360p', '480p', '720p', '1080p', '4K'];
console.log(ladder.length); // 6, not the 4 originally used

const original = estimate(4);   // the page's original (wrong) multiplier
const corrected = estimate(6);  // matches the actual 6-level ladder

console.log(original.vcpuMinutesPerMinute);  // 60,000
console.log(corrected.vcpuMinutesPerMinute); // 90,000 -- a 50% increase

// Downstream figures (fleet size, hourly cost) scale by the same
// ratio: 90,000 / 60,000 = 1.5x
const scaleFactor = corrected.vcpuMinutesPerMinute / original.vcpuMinutesPerMinute;
console.log(scaleFactor); // 1.5`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A transcoding strategy states "Resolution ladder: 240p → 360p → 480p → 720p → 1080p → 4K" and then computes required compute as "500hrs/min × 4 resolutions × 30 min/hr." Is the "4 resolutions" figure correct, and if not, how does fixing it change the compute estimate?',
    hint: 'Count the individual resolution levels named in the ladder itself -- how many arrow-separated items are there?',
    solution: 'The "4 resolutions" figure is incorrect -- the stated ladder lists SIX resolution levels (240p, 360p, 480p, 720p, 1080p, 4K), not four. Recomputing with the correct count: 500 hrs/min × 6 resolutions × 30 min/hr = 90,000 vCPU-minutes/min, a 50% increase over the original 60,000 figure. Every downstream number derived from the original compute estimate -- the spot fleet size and the hourly cost figures -- needs the same proportional (1.5×) correction to stay internally consistent with the corrected compute demand.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A specific resolution ladder listed in one paragraph and a numeric multiplier used in a calculation one paragraph later on the same page are unlikely to disagree, since they\'re describing the same system so close together.',
      reality: 'Per this subtopic\'s theory, this exact disagreement occurred here — the ladder listed 6 resolution levels while the very next paragraph\'s compute formula used 4, showing that proximity within a page doesn\'t guarantee the two numbers were kept in sync.'
    },
    {
      thought: 'A 50% error in an early compute-demand figure (like vCPU-minutes needed) is a self-contained mistake that doesn\'t meaningfully affect other parts of a cost estimate.',
      reality: 'Per this subtopic\'s theory, the resolution-count error propagated proportionally into every downstream figure derived from it — fleet size and hourly cost figures both needed the same 1.5× correction, since they were originally sized to match the incorrect (lower) compute demand.'
    },
    {
      thought: 'Applying 4K\'s own transcoding time uniformly to every resolution level (240p through 4K) in a compute estimate is a modeling error that should be fixed to use per-resolution encoding rates.',
      reality: 'Per this subtopic\'s theory, this is a reasonable, defensible SIMPLIFICATION for a system design answer — using the most expensive resolution\'s rate as a conservative upper bound across all levels is a legitimate estimation technique, worth stating explicitly (as the corrected version now does) rather than either hiding it or over-engineering a precise per-resolution model.'
    }
  ];
}
