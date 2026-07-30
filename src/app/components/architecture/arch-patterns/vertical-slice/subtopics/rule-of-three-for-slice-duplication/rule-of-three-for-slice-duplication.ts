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
  templateUrl: './rule-of-three-for-slice-duplication.html',
  styleUrl: './rule-of-three-for-slice-duplication.scss'
})
export class RuleOfThreeForSliceDuplicationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"Some duplication is accepted" — but the page never says how much is too much',
      points: [
        'The main page\'s own theory states: "Some duplication across slices... is an accepted tradeoff of this approach — the pattern favors feature independence and clarity over eliminating every instance of code similarity through shared abstraction." This correctly rejects the OTHER extreme (aggressively deduplicating everything into shared services) — but never gives a concrete signal for when duplication has gone from "acceptable tradeoff" to "actually a problem worth fixing."',
        'A well-established, widely-used heuristic for exactly this judgment call is the "Rule of Three" (attributed to the authors of Design Patterns, and popularized further by extreme programming practice): the FIRST time you write something, just write it. The SECOND time you need something similar, duplicate it — noticing the similarity is useful, but it\'s often still too early to know the right abstraction. Only on the THIRD occurrence, once a real pattern is visible across three concrete cases, do you extract a shared abstraction.',
      ]
    },
    {
      heading: 'Why "three" specifically, applied to Vertical Slice duplication',
      points: [
        'Extracting a shared abstraction after only ONE or TWO occurrences risks guessing at the wrong abstraction — the shared code ends up shaped by whatever those first one or two slices happened to need, and a THIRD slice with genuinely different requirements is then forced to awkwardly fit that premature abstraction (or worse, the shared code grows conditional branches to handle each caller\'s special case, becoming its own tangled coupling point).',
        'Waiting for a third real occurrence gives enough concrete evidence to see what\'s ACTUALLY common across the cases versus what merely looked similar in two examples by coincidence — directly matching the page\'s own "Slices should NOT call each other directly" and "Sharing service classes across slices" mistakes-block warnings against premature coupling.',
      ]
    },
    {
      heading: 'Applying this concretely to the page\'s own slice examples',
      points: [
        'If PlaceOrder and CancelOrder both need to send a similar confirmation email, and a third slice — say, RefundOrder — later needs a comparable notification, THAT third occurrence is the natural trigger to consider extracting a shared Shared/Infrastructure/EmailClient-based helper (which the page\'s own Feature Folder Structure already reserves a place for), rather than either duplicating a third time or having extracted prematurely after just the first two.',
        'This gives the page\'s existing "prefer duplication over coupling" principle a concrete, actionable trigger rather than leaving the judgment call entirely to intuition — the rule doesn\'t override the page\'s own guidance, it operationalizes it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The Rule of Three applied to slice duplication',
      language: 'typescript',
      code: `interface DuplicationDecision {
  occurrenceCount: number;
  recommendedAction: 'write it inline' | 'duplicate again' | 'extract a shared abstraction';
  reasoning: string;
}

function ruleOfThreeDecision(occurrenceCount: number): DuplicationDecision {
  if (occurrenceCount === 1) {
    return {
      occurrenceCount,
      recommendedAction: 'write it inline',
      reasoning: 'First occurrence -- no pattern to generalize from yet.',
    };
  }
  if (occurrenceCount === 2) {
    return {
      occurrenceCount,
      recommendedAction: 'duplicate again',
      reasoning: 'Similar, but too early to know the RIGHT shared shape -- ' +
        'extracting now risks guessing wrong and forcing a bad fit later.',
    };
  }
  return {
    occurrenceCount,
    recommendedAction: 'extract a shared abstraction',
    reasoning: 'Third real occurrence -- enough concrete evidence exists to ' +
      'see what is genuinely common versus coincidental similarity.',
  };
}

// Example: PlaceOrder and CancelOrder both send a confirmation email
console.log(ruleOfThreeDecision(2).recommendedAction); // 'duplicate again'

// RefundOrder later needs the same kind of notification --
// NOW extract Shared/Infrastructure/NotificationHelper.ts
console.log(ruleOfThreeDecision(3).recommendedAction); // 'extract a shared abstraction'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The PlaceOrder and CancelOrder slices both independently implement similar-looking confirmation-email logic. A developer proposes immediately extracting a shared EmailConfirmationService that both slices would call. Using the page\'s own "prefer duplication over coupling" principle and the Rule of Three, is this the right time to extract?',
    hint: 'How many concrete occurrences of the similar logic actually exist right now -- one, two, or three?',
    solution: 'Not yet, by the Rule of Three -- there are only TWO occurrences (PlaceOrder and CancelOrder) so far. Extracting a shared abstraction now risks shaping it around only these two cases\' specific needs, which may not generalize correctly once a genuinely different THIRD use case appears later. The Rule of Three\'s guidance: duplicate the logic a second time (as already happened), and wait for a real third occurrence before extracting -- at that point there\'s enough concrete evidence to see what\'s actually common across the cases rather than guessing based on just two examples that might only coincidentally look similar. This matches the page\'s own "prefer duplication over coupling" principle -- the rule gives it a concrete trigger rather than leaving the judgment call to intuition alone.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'As soon as two slices show similar-looking code, extracting a shared abstraction immediately is the more disciplined, DRY (Don\'t Repeat Yourself) engineering choice.',
      reality: 'Per this subtopic\'s theory, extracting after only two occurrences risks guessing at the wrong shared shape — the Rule of Three specifically recommends waiting for a genuine third occurrence, since two examples alone often aren\'t enough evidence to know what\'s truly common versus coincidentally similar.'
    },
    {
      thought: 'The page\'s "prefer duplication over coupling" principle means duplication should always be preferred indefinitely, no matter how many times the same logic repeats across slices.',
      reality: 'Per this subtopic\'s theory, the principle is about avoiding PREMATURE extraction, not permanently avoiding shared abstractions — the Rule of Three gives a concrete point (the third genuine occurrence) where extracting into the page\'s own Shared/Infrastructure folder becomes the right call, not an indefinite rule against ever sharing code.'
    },
    {
      thought: 'The "Rule of Three" is a vague rule of thumb with no real reasoning behind the specific number three, interchangeable with picking any other small number.',
      reality: 'Per this subtopic\'s theory, three specifically matters because it\'s the minimum count that provides genuine EVIDENCE of a pattern rather than a coincidence — two similar-looking examples can share surface similarity by chance, while a third occurrence meaningfully increases confidence that a real, generalizable pattern actually exists.'
    }
  ];
}
