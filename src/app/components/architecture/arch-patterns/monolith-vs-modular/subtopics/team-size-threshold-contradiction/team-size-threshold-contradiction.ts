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
  templateUrl: './team-size-threshold-contradiction.html',
  styleUrl: './team-size-threshold-contradiction.scss'
})
export class TeamSizeThresholdContradictionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two team-size thresholds for the same decision, stated on the same page',
      points: [
        'The main page\'s Theory section states: "Rule of thumb: you need at least a team of 10–15 engineers and a stable domain before microservices pay off" — implying microservices become worthwhile once a team crosses roughly 10-15 people. The page\'s own quiz explanation originally stated: "Choose a modular monolith when: the team is small (fewer than 20 engineers)..." — implying the modular monolith remains the right choice up to 20 people. The page has been corrected so the quiz explanation matches the theory section\'s own 10-15 threshold.',
        'This is catchable purely by comparing two numeric thresholds stated on the SAME page for the SAME decision (team size vs. architecture choice) — no organizational-design research needed, just noticing that a team of, say, 17 engineers falls on OPPOSITE sides of the two stated thresholds.',
      ]
    },
    {
      heading: 'Why the overlapping range (15-20 engineers) was a real problem, not just imprecise wording',
      points: [
        'For a team of 17 engineers specifically: the theory section\'s own rule of thumb ("at least 10-15 engineers... before microservices pay off") would suggest microservices are now worth considering, while the quiz explanation\'s original "fewer than 20 engineers" framing would suggest staying with a modular monolith — two directly opposite recommendations for the exact same team size, both stated on the same page.',
        '"Rules of thumb" are inherently approximate, and some fuzziness between two independently-stated heuristics is expected — but when both are expressed as specific NUMBERS (10-15 vs. 20) rather than vague qualitative guidance, a reader has no way to tell which number the page actually endorses for a team that falls between them.',
      ]
    },
    {
      heading: 'The fix: derive one number from the other, rather than maintaining two independently',
      points: [
        'The corrected quiz explanation now states the threshold as "smaller than roughly 10-15 engineers," explicitly matching the theory section\'s own figure — rather than introducing a second, independently-chosen number (20) for what is meant to be the same underlying guidance.',
        'This is a useful general practice for any reference page stating a numeric rule of thumb in more than one place: pick ONE canonical number and reference it everywhere, rather than letting each section restate an approximately-similar-but-not-identical figure.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Where two independently-stated thresholds disagree',
      language: 'typescript',
      code: `interface TeamSizeGuidance {
  source: 'theory' | 'quiz-explanation';
  claim: string;
  impliedThresholdForMicroservices: number;
}

const guidance: TeamSizeGuidance[] = [
  {
    source: 'theory',
    claim: 'at least a team of 10-15 engineers... before microservices pay off',
    impliedThresholdForMicroservices: 10, // microservices start to pay off AT this size
  },
  {
    source: 'quiz-explanation',
    claim: 'choose modular monolith when team is smaller than 20 engineers', // ORIGINAL text
    impliedThresholdForMicroservices: 20, // microservices only worth it ABOVE this size
  },
];

function recommendationsAgree(teamSize: number): boolean {
  const theoryRecommendsMicroservices = teamSize >= guidance[0].impliedThresholdForMicroservices;
  const quizRecommendsMicroservices = teamSize >= guidance[1].impliedThresholdForMicroservices;
  return theoryRecommendsMicroservices === quizRecommendsMicroservices;
}

console.log(recommendationsAgree(8));   // true -- both say modular monolith
console.log(recommendationsAgree(17));  // false -- theory says microservices, quiz says still monolith
console.log(recommendationsAgree(25));  // true -- both say microservices

// The disagreement zone (10-15 through 20) is exactly where a reader
// would most need clear, consistent guidance -- a team right at the
// "should we split?" decision point.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A reference page states in one section: "you need at least a team of 10-15 engineers... before microservices pay off," and in another section: "choose a modular monolith when the team is fewer than 20 engineers." For a team of 17 engineers, what does each statement recommend, and do they agree?',
    hint: 'Is a team of 17 above or below the theory section\'s 10-15 threshold? Is it above or below the quiz explanation\'s 20 threshold?',
    solution: 'They do not agree. A team of 17 is ABOVE the theory section\'s "10-15 engineers" threshold, which would suggest microservices are starting to pay off. But 17 is BELOW the quiz explanation\'s "fewer than 20 engineers" threshold, which would suggest staying with a modular monolith. The same page gives opposite recommendations for the same team size depending on which section is read. The fix is deriving both statements from a single canonical number -- the corrected version has the quiz explanation reference the theory section\'s own 10-15 figure directly, rather than maintaining a second, independently-stated number that can drift out of sync.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Two "rule of thumb" style numeric thresholds stated in different sections of the same page, both roughly in the same range (10-15 vs. 20), are close enough that any disagreement between them doesn\'t matter in practice.',
      reality: 'Per this subtopic\'s theory, the two thresholds create a real, checkable disagreement zone (roughly 15-20 team members) where the page\'s own two sections give OPPOSITE architectural recommendations for the same team size — not just imprecise wording, but a genuine contradiction a reader could act on incorrectly.'
    },
    {
      thought: 'A "rule of thumb" is inherently approximate, so it\'s acceptable — even expected — for different sections of a reference page to state somewhat different specific numbers for the same guidance.',
      reality: 'Per this subtopic\'s theory, approximate guidance is fine when expressed qualitatively, but once TWO SPECIFIC NUMBERS are stated for what\'s meant to be the same underlying rule, a reader has no way to know which one the page actually endorses — the fix is picking one canonical figure and referencing it everywhere, not tolerating drift between two independently-chosen numbers.'
    },
    {
      thought: 'Catching a numeric inconsistency like this requires deep organizational-design expertise to know what the "correct" team-size threshold for microservices actually is.',
      reality: 'Per this subtopic\'s theory, this was caught purely by comparing two numbers stated on the SAME page for the SAME decision — no external expertise or research needed, just noticing that a specific team size (17) falls on opposite sides of the two stated thresholds.'
    }
  ];
}
