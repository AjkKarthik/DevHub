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
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './responsive-variants-are-mobile-first-not-breakpoint-specific.html',
  styleUrl: './responsive-variants-are-mobile-first-not-breakpoint-specific.scss',
})
export class ResponsiveVariantsAreMobileFirstNotBreakpointSpecificSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'md:flex means "flex at md AND EVERY WIDER BREAKPOINT", not "flex only while the viewport is in the md range"',
      points: [
        'Every responsive variant compiles to a <code>min-width</code> media query — <code>md:flex</code> becomes <code>@media (min-width: 768px) { display: flex; }</code>. It has no upper bound, so it stays active all the way up through <code>lg</code>, <code>xl</code>, and beyond.',
        'This trips up developers coming from max-width-first responsive systems (common in older frameworks or hand-written CSS), where a "medium" breakpoint rule is often written to apply ONLY within that specific range, with separate rules for each larger breakpoint.',
      ]
    },
    {
      heading: 'The practical consequence: a lone md: class, with no larger variant added afterward, applies at every width from that breakpoint up to infinity',
      points: [
        'Writing only <code>md:grid-cols-2</code> (with no <code>lg:</code> or <code>xl:</code> override) means the 2-column layout is what renders at md, lg, xl, and 2xl alike — it does NOT silently revert to some different "default" layout once the viewport gets even wider.',
        'If a genuinely DIFFERENT layout is wanted at a larger size, that requires its OWN, later, higher-specificity-breakpoint variant (e.g. adding <code>lg:grid-cols-3</code> alongside <code>md:grid-cols-2</code>) — because the later class, matching a narrower min-width range starting further up, naturally overrides the earlier one once the viewport reaches it.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The Mobile-First Compiled Output',
      language: 'css',
      code: `/* Source: class="grid grid-cols-1 md:grid-cols-2" */

/* Compiles to roughly this CSS: */
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {   /* md and up -- NO upper bound */
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* At a 500px viewport:  only grid-cols-1 matches -- 1 column. */
/* At a 900px viewport:  the md query matches -- 2 columns.   */
/* At a 1920px viewport: the SAME md query still matches --
   still 2 columns, because "min-width: 768px" has no ceiling. */

/* A developer expecting "md means ONLY the medium range" would
   be surprised the layout stays 2-column all the way up to a
   4K monitor -- that's not a bug, it's the intended mobile-first
   behavior: each variant sets the floor, not a fixed range.  */`,
    },
    {
      label: 'Adding a Larger Breakpoint to Actually Change Behavior at lg',
      language: 'html',
      code: `<!-- If a genuinely different layout is wanted once the viewport
     reaches "lg" (1024px), add an explicit lg: variant --
     it doesn't happen automatically. -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 1 column below 768px -->
  <!-- 2 columns from 768px up to (but not including) 1024px -->
  <!-- 3 columns from 1024px and up (this ALSO has no upper bound) -->
</div>

<!-- Each added breakpoint variant narrows the range the PREVIOUS
     one is visually responsible for, but every variant still
     technically "applies" from its own min-width upward -- the
     later, higher-specificity-in-source-order rule for the wider
     breakpoint is what visually takes over once the viewport
     reaches it, not because the earlier rule stopped matching. -->`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A card grid uses <code>class="grid grid-cols-1 md:grid-cols-2"</code> with no <code>lg:</code> or <code>xl:</code> classes added. On a very wide 2560px monitor, how many columns render?',
    hint: 'Ask whether md:grid-cols-2 has any upper bound on how wide the viewport can get before it stops applying.',
    solution: '2 columns — md:grid-cols-2 compiles to a min-width: 768px media query with no upper bound, so it stays active at every width from 768px up to and including a 2560px monitor. Getting 3 or more columns at very wide viewports would require explicitly adding a further breakpoint variant like lg:grid-cols-3 or xl:grid-cols-4.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'md:flex means "apply flex specifically while the viewport is in the medium size range" — similar to how a max-width media query targets a specific band of screen sizes.',
      reality: 'It means "apply flex from the md breakpoint upward, with no ceiling" — a min-width media query, not a range. It stays active through every larger breakpoint unless a later, more specific variant overrides it.'
    },
    {
      thought: 'Without adding lg: or xl: variants, a layout using only md: classes will look "wrong" or unintentional on very large screens, since nobody explicitly designed for that width.',
      reality: 'It will look exactly as specified — the md: styling is fully intentional at every width from 768px up, by design. Whether that\'s the DESIRED design for very wide screens is a separate question from whether the CSS is behaving correctly; it is.'
    },
    {
      thought: 'Since Tailwind is mobile-first, larger breakpoint prefixes like lg: and xl: are optional "nice to haves" that most components don\'t really need.',
      reality: 'Whether they\'re needed depends entirely on whether the design genuinely changes at those wider sizes. A card grid meant to keep growing columns as space allows (2 → 3 → 4) absolutely needs each successive breakpoint variant explicitly added — none of it happens automatically just because the viewport got wider.'
    }
  ];
}
