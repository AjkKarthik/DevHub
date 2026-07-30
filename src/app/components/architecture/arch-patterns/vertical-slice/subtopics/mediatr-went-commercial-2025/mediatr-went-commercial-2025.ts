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
  templateUrl: './mediatr-went-commercial-2025.html',
  styleUrl: './mediatr-went-commercial-2025.scss'
})
export class MediatRWentCommercial2025Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "de facto standard" claim that stopped being the complete picture',
      points: [
        'The page\'s own QnA originally stated: "MediatR (Jimmy Bogard) is the de facto standard" with no further qualification. Verified via WebSearch: MediatR launched a commercial edition on July 2, 2025, transitioning to Jimmy Bogard\'s new company, Lucky Penny Software — a real, dateable event, not a rumor or in-progress proposal. The page has been corrected to state this.',
        'The change is a dual-license model, not a simple "now fully paid" switch: MediatR remains genuinely free for individuals and companies under $5M USD annual revenue, with commercial licensing required only for larger enterprises — an important nuance the corrected QnA now includes rather than oversimplifying in either direction.',
      ]
    },
    {
      heading: 'Why this specific kind of change matters for a reference page, not just as trivia',
      points: [
        'A "which library is the standard choice" recommendation is exactly the kind of claim that can go stale silently — the underlying technology didn\'t change (MediatR still works exactly as before, technically), but the CIRCUMSTANCES around choosing it changed in a way that directly affects a real decision a reader might make based on this page.',
        'This mirrors a broader pattern worth watching for on any technology-recommendation page: "X is the standard tool" claims should be treated as time-stamped facts, not permanent truths — a library\'s licensing, maintenance status, or ecosystem position can shift meaningfully even while its technical API stays the same.',
      ]
    },
    {
      heading: 'What this means in practice for a Vertical Slice codebase choosing a mediator',
      points: [
        'For most individual developers, small teams, and companies under the $5M revenue threshold, nothing practically changes — MediatR remains free to use exactly as the page\'s own code samples already demonstrate.',
        'For larger organizations, the licensing change is a genuine new factor in the "which mediator library" decision that didn\'t exist when this pattern first became popular — worth knowing about even if it doesn\'t change the underlying architectural pattern (in-process command/query dispatch) the page teaches, which remains valid regardless of which specific library implements it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MediatR licensing — what changed and what didn\'t',
      language: 'typescript',
      code: `interface MediatRTimeline {
  date: string;
  event: string;
}

const timeline: MediatRTimeline[] = [
  {
    date: 'Pre-July 2025',
    event: 'MediatR fully free and open source, maintained by Jimmy Bogard as a solo project.',
  },
  {
    date: '2025-07-02',
    event: "Commercial edition launches under Lucky Penny Software (Bogard's new company). " +
      'Dual-license model introduced.',
  },
];

interface LicenseTier {
  audience: string;
  cost: 'free' | 'paid';
}

const licenseTiers: LicenseTier[] = [
  { audience: 'Individuals', cost: 'free' },
  { audience: 'Companies under $5M USD annual revenue', cost: 'free' },
  { audience: 'Larger enterprises', cost: 'paid' },
];

// What did NOT change: the technical pattern itself. The API surface
// (IRequestHandler<TRequest, TResponse>, mediator.send(), pipeline
// behaviors) works exactly as this page's own code samples show --
// the licensing change affects WHO pays, not HOW the library works.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page states "MediatR is the de facto standard" for .NET mediator libraries with no further qualification. A company with $50M in annual revenue is choosing a mediator library for a new Vertical Slice application in 2026. Does the original statement give them everything they need to know?',
    hint: 'MediatR\'s licensing changed in July 2025. Does a $50M-revenue company fall under the free tier or the paid tier?',
    solution: 'No -- the original statement omits a real, dateable change: MediatR went dual-licensed in July 2025, with free usage limited to individuals and companies under $5M USD annual revenue. A $50M-revenue company falls into the PAID tier and would need to budget for a commercial license (or evaluate a free alternative) before committing to MediatR for a new project -- information the original "de facto standard" framing, stated without qualification, doesn\'t surface at all. The underlying architectural pattern MediatR implements (in-process command/query dispatch) remains valid regardless of which specific library a team ultimately picks.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once a library is described as "the de facto standard" for a given use case, that characterization is a stable fact unlikely to need revisiting.',
      reality: 'Per this subtopic\'s theory, MediatR\'s own licensing model changed meaningfully in July 2025 while remaining the same library technically — "standard tool" recommendations are time-stamped facts about a library\'s current circumstances, not permanent architectural truths.'
    },
    {
      thought: 'MediatR going commercial means it is now a fully paid product that free/small-scale users can no longer use.',
      reality: 'Per this subtopic\'s theory, the actual change is a dual-license model — MediatR remains genuinely free for individuals and companies under $5M USD annual revenue, with commercial licensing required only above that threshold, not a blanket "now everyone pays" change.'
    },
    {
      thought: 'A licensing change to a library doesn\'t affect the underlying architectural pattern (Vertical Slice organization, in-process mediator dispatch) a page teaches, so it\'s not worth mentioning on an architecture-focused reference page.',
      reality: 'Per this subtopic\'s theory, the PATTERN remains valid regardless of licensing, but a page that specifically recommends a NAMED library as "the standard" is making a concrete, actionable claim a reader might act on directly — omitting a real licensing change relevant to that specific recommendation leaves out information the reader would reasonably want before choosing it.'
    }
  ];
}
