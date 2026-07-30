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
  templateUrl: './hexagon-shape-explanation-incomplete.html',
  styleUrl: './hexagon-shape-explanation-incomplete.scss'
})
export class HexagonShapeExplanationIncompleteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A true claim that left out half of Cockburn\'s own reasoning',
      points: [
        'The main page originally stated: "The hex shape has nothing to do with six. It is drawn as a hexagon to emphasise equal treatment of all sides — no \'top\' or \'bottom\'." This is accurate as far as it goes — but verified via Cockburn\'s own account, it captures only ONE of two reasons he actually gave. The page has been corrected to include the second, equally-cited reason.',
        'Cockburn\'s own explanation (per his direct interviews and writing on the topic) is two-part: (1) breaking the habitual reflex of drawing architecture diagrams as rectangles with an implied hierarchy — user on top, database on bottom, or user on left, database on right; AND (2) practical drawing mechanics — a hexagon is the simplest NON-rectangular polygon to draw by hand that still leaves enough room on each side to sketch multiple ports and adapters, without the visual crowding a smaller polygon (like a triangle or square) would create.',
      ]
    },
    {
      heading: 'Why the second half of the reasoning is worth keeping, not just trivia',
      points: [
        'The "breaking the rectangle habit" reason explains WHY not a rectangle. The "room for multiple ports without crowding" reason explains WHY specifically a hexagon and not, say, a pentagon or octagon — it\'s the practical constraint that actually settled on six sides specifically, even though (as Cockburn himself states) any polygon with enough sides would work equally well architecturally.',
        'Together, the two reasons answer two different, equally natural questions a reader might ask: "why isn\'t this a rectangle?" and "why a hexagon specifically, and not some other shape?" — the page\'s original wording only answered the first.',
      ]
    },
    {
      heading: 'A precision distinction worth keeping straight: the shape has a practical rationale, not an architectural one',
      points: [
        'Both halves of Cockburn\'s reasoning are about DIAGRAMMING convenience and breaking a visual habit — neither is a claim that six specifically holds any architectural significance. The main page\'s own opening line ("nothing to do with six") already correctly heads off the most common misreading, and the fuller explanation reinforces rather than contradicts that framing.',
        'This distinguishes hexagon-shape trivia from something that actually affects how the pattern is implemented: unlike, say, the number of Clean Architecture\'s rings (which DOES map to specific, named responsibilities), the number six in "hexagonal architecture" carries no equivalent implementation meaning at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two reasons, two different questions answered',
      language: 'typescript',
      code: `interface ShapeRationale {
  reason: string;
  answersTheQuestion: string;
}

const cockburnsReasoning: ShapeRationale[] = [
  {
    reason: 'Break the rectangle habit -- avoid an implied top/bottom ' +
      'or left/right hierarchy between the core and any one adapter.',
    answersTheQuestion: "Why isn't this drawn as a rectangle?",
  },
  {
    reason: 'A hexagon is the simplest non-rectangular polygon to ' +
      'draw by hand with enough room per side to sketch multiple ' +
      'ports and adapters without visual crowding.',
    answersTheQuestion: 'Why a HEXAGON specifically, not a pentagon or octagon?',
  },
];

// What BOTH reasons agree on: the number six itself carries zero
// architectural meaning -- any polygon with enough sides would work
// equally well. The page's own "nothing to do with six" framing was
// correct from the start; only the SECOND reason (drawing mechanics)
// was missing from the original explanation.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page explains hexagonal architecture\'s shape as "drawn as a hexagon to emphasise equal treatment of all sides -- no top or bottom." Is this the complete picture of why Cockburn specifically chose a HEXAGON (not some other non-rectangular shape)?',
    hint: 'The "no top or bottom" reasoning explains why the shape ISN\'T a rectangle. Does it separately explain why it settled on exactly six sides rather than, say, five or eight?',
    solution: 'No, it\'s only half the picture. The "no top or bottom" reasoning explains why the shape avoids being a rectangle, but Cockburn\'s own account gives a SEPARATE, additional reason for landing on a hexagon specifically: it\'s the simplest non-rectangular polygon to draw by hand that still leaves enough room per side to sketch multiple ports and adapters without visual crowding. Both reasons agree the number six itself has zero architectural significance -- any polygon with enough sides would work -- but the second reason is what actually explains the specific choice of hexagon over other non-rectangular shapes, which the original explanation omitted.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The "no top or bottom, equal treatment of all sides" explanation for hexagonal architecture\'s shape is the complete, canonical answer to why it\'s drawn as a hexagon.',
      reality: 'Per this subtopic\'s theory, verified against Cockburn\'s own account, this is only one of two reasons he gives — the other being purely practical drawing mechanics (a hexagon is the simplest non-rectangular shape with enough room for multiple ports per side).'
    },
    {
      thought: 'Since the page correctly states "the hex shape has nothing to do with six," there\'s nothing more specific to say about why SIX sides was chosen over some other polygon.',
      reality: 'Per this subtopic\'s theory, "nothing to do with six" (correctly) rules out any architectural significance to the number, but doesn\'t answer the separate, practical question of why a hexagon specifically was easy and convenient to draw compared to other non-rectangular options — a different, complementary point.'
    },
    {
      thought: 'Adding Cockburn\'s second reason (drawing mechanics) to the page\'s explanation is purely trivia with no real value beyond historical curiosity.',
      reality: 'Per this subtopic\'s theory, it answers a genuinely different reader question ("why a hexagon specifically, not some other non-rectangular shape?") than the first reason alone ("why not a rectangle?") — both are worth including for a complete explanation, not just the more commonly-repeated first half.'
    }
  ];
}
