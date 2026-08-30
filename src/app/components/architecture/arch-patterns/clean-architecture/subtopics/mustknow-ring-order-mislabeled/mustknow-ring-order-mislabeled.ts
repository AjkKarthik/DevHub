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
  templateUrl: './mustknow-ring-order-mislabeled.html',
  styleUrl: './mustknow-ring-order-mislabeled.scss'
})
export class MustknowRingOrderMislabeledSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A sequence whose own parenthetical label contradicted the sequence itself',
      points: [
        'The page\'s Quick Revision "mustKnow" list originally stated: "Entities → Use Cases → Interface Adapters → Frameworks (outer to inner)." But Entities is the page\'s own documented INNERMOST ring ("Entities: pure business objects... with enterprise-wide business rules" as ring one) and Frameworks is the documented OUTERMOST ring ("Frameworks & Drivers: ...all plug in at the outermost ring"). Listing Entities first and Frameworks last is therefore INNER TO OUTER — the exact opposite of what the parenthetical "(outer to inner)" claimed. The page has been corrected to "(inner to outer)."',
        'This is catchable purely by checking the sequence against the page\'s own separately-stated ring definitions — no architecture expertise needed, just confirming which ring the page itself calls innermost and which it calls outermost, then checking which one is listed first.',
      ]
    },
    {
      heading: 'A second section of the same page had the direction right, in the opposite order',
      points: [
        'Quiz question 1\'s own explanation states: "Dependencies point inward: Frameworks → Adapters → Use Cases → Entities" — the SAME four rings, but listed in the OPPOSITE order (Frameworks first, Entities last), correctly matching an "outer to inner" reading.',
        'Both statements are individually a valid way to LIST the four rings — one inner-to-outer, one outer-to-inner — but only one of them can correctly carry the SPECIFIC directional label it was given. Comparing the mustKnow bullet\'s sequence against the quiz explanation\'s sequence (rather than trying to reason about ring order from scratch) is what makes the mislabeling obvious: the two sequences are exact mirror images of each other, so at most one of their directional labels can be self-consistent — and the quiz explanation\'s implicit direction (reading it as "outer depends on/points to inner") matches its own listed order, while the original mustKnow label did not.',
      ]
    },
    {
      heading: 'Why a mislabeled memorization aid is worse than no label at all',
      points: [
        'The "Quick Revision" section exists specifically for fast recall before an interview or review — a reader skimming "Entities → Use Cases → Interface Adapters → Frameworks (outer to inner)" would reasonably conclude Entities is the OUTER ring, exactly backwards from the page\'s own detailed ring descriptions elsewhere.',
        'A memorization aid that\'s internally wrong is arguably more harmful than having no shorthand at all, since a reader trusting the quick-reference summary has no obvious signal that it disagrees with the fuller explanation earlier on the same page — the contradiction only surfaces if the two are compared directly, which a reader skimming just the revision card wouldn\'t naturally do.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Comparing the two sequences directly',
      language: 'typescript',
      code: `interface RingOrderClaim {
  source: 'mustKnow-original' | 'quiz-explanation';
  sequence: string[];
  claimedDirection: 'outer-to-inner' | 'inner-to-outer';
}

const claims: RingOrderClaim[] = [
  {
    source: 'mustKnow-original',
    sequence: ['Entities', 'Use Cases', 'Interface Adapters', 'Frameworks'],
    claimedDirection: 'outer-to-inner', // the ORIGINAL (wrong) label
  },
  {
    source: 'quiz-explanation',
    sequence: ['Frameworks', 'Adapters', 'Use Cases', 'Entities'],
    claimedDirection: 'outer-to-inner', // implicit, and consistent with its own order
  },
];

// The page's own ring definitions (established separately in theory):
const ringOrderInnerToOuter = ['Entities', 'Use Cases', 'Interface Adapters', 'Frameworks & Drivers'];

function actualDirection(sequence: string[]): 'outer-to-inner' | 'inner-to-outer' {
  const firstRingIndex = ringOrderInnerToOuter.findIndex(r => r.startsWith(sequence[0]));
  const lastRingIndex = ringOrderInnerToOuter.findIndex(r => r.startsWith(sequence[sequence.length - 1]));
  return firstRingIndex < lastRingIndex ? 'inner-to-outer' : 'outer-to-inner';
}

console.log(actualDirection(claims[0].sequence)); // 'inner-to-outer' -- contradicts its OWN claimed label
console.log(actualDirection(claims[1].sequence)); // 'outer-to-inner' -- matches its claimed label`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page\'s Quick Revision states: "Entities → Use Cases → Interface Adapters → Frameworks (outer to inner)." The same page separately states Entities is the innermost ring and Frameworks is the outermost ring. Is the parenthetical label correct?',
    hint: 'If Entities is listed FIRST and it\'s the innermost ring, while Frameworks is listed LAST and it\'s the outermost ring, does the sequence go from outer to inner, or from inner to outer?',
    solution: 'The label is incorrect. Since Entities (listed first) is the page\'s own documented innermost ring, and Frameworks (listed last) is the outermost ring, the sequence "Entities → Use Cases → Interface Adapters → Frameworks" actually goes from INNER to OUTER -- the opposite of what "(outer to inner)" claims. The fix is correcting the label to "(inner to outer)," which matches the sequence exactly as written. A second section of the same page (quiz Q1\'s explanation) lists the identical four rings in the reverse order ("Frameworks → Adapters → Use Cases → Entities"), which correctly reads as outer-to-inner -- comparing the two sequences directly confirms which one\'s label needed fixing.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A "Quick Revision" or memorization-aid section of a reference page is lower-risk to get wrong than the detailed theory sections, since it\'s meant to be a simplified summary rather than the primary explanation.',
      reality: 'Per this subtopic\'s theory, a quick-revision summary is often what a reader trusts MOST for fast recall (e.g. right before an interview) — a wrong directional label there can actively teach the opposite of what the page\'s own detailed sections establish, making it arguably MORE consequential to get right, not less.'
    },
    {
      thought: 'Verifying whether a labeled sequence like "(outer to inner)" is correct requires independently reasoning through the architecture\'s ring order from first principles.',
      reality: 'Per this subtopic\'s theory, this was caught by comparing the sequence against the page\'s OWN already-stated ring definitions (which ring is called "innermost," which is called "outermost") — no independent architectural reasoning needed, just cross-checking one part of the page against another.'
    },
    {
      thought: 'When two sections of the same page list the same four items in exactly reversed order, at least one of them must be using a nonstandard or alternative convention, rather than one simply being mislabeled.',
      reality: 'Per this subtopic\'s theory, listing the same items in reverse order is completely normal and expected when describing a directional sequence from two different starting points (inner-to-outer vs. outer-to-inner) — the actual bug was specifically in the PARENTHETICAL LABEL not matching its own sequence\'s direction, not in the sequences themselves being reversed.'
    }
  ];
}
