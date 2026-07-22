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
  templateUrl: './agile-manifesto-values-the-right-side-too-just-less.html',
  styleUrl: './agile-manifesto-values-the-right-side-too-just-less.scss'
})
export class AgileManifestoValuesTheRightSideTooJustLessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists the four values as a bare comparison — the Manifesto\'s own next sentence changes what the comparison means',
      points: [
        'The main page\'s own theory presents the four Agile Manifesto values as a flat list: "Individuals over processes; Working software over docs; Customer collaboration over contracts; Responding to change over following a plan." Read on its own, "X over Y" easily reads as "X instead of Y" — pick individuals, discard process; pick working software, discard documentation.',
        'The Manifesto\'s own official text (agilemanifesto.org) includes one more sentence immediately after the four value statements, which the main page never quotes: "That is, while there is value in the items on the right, we value the items on the left more." This is not a minor footnote — it is the Manifesto\'s own explicit clarification of what "over" is supposed to mean.',
        'The precise claim is a WEIGHTING, not an exclusion: processes and tools, comprehensive documentation, contract negotiation, and following a plan all retain real, acknowledged value in the Manifesto\'s own words — they are simply weighted lower than their left-column counterparts when the two are in tension.',
      ]
    },
    {
      heading: 'Why this distinction changes how teams actually apply the values',
      points: [
        'A team that reads "working software over comprehensive documentation" as "documentation has no value" will under-document architecture decisions, onboarding paths, and API contracts — producing exactly the kind of undocumented, hard-to-maintain codebase the Manifesto\'s own authors were not endorsing, since they explicitly preserved value on the documentation side of the comparison.',
        'The correct application, per the Manifesto\'s own clarifying sentence, is a tie-breaker rule for genuine TRADE-OFFS, not a blanket license to discard the right-hand items entirely: when a team must choose between spending the next hour writing more documentation or shipping a working increment for feedback, the Manifesto says lean left — it does not say documentation is worthless in general.',
        'This same misreading pattern shows up with all four values, and the main page\'s own SDLC theory implicitly assumes the correct, weighted reading already (its own "Definition of Done" checklist includes documentation-adjacent items like acceptance criteria verification) — this subtopic simply makes explicit the Manifesto\'s own qualifying sentence that justifies that implicit balance, rather than leaving readers to infer it from an apparently absolute list.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own list -- read as an absolute choice',
      language: 'bash',
      code: `# Matches the main page's own Waterfall vs Agile theory bullet
# verbatim, with no qualifying context attached:

Agile Manifesto values:
  Individuals and interactions   over   processes and tools
  Working software               over   comprehensive documentation
  Customer collaboration         over   contract negotiation
  Responding to change           over   following a plan

# Read in isolation, a team might conclude:
#   - Skip writing a design doc -- "docs don't matter, Agile said so"
#   - Skip a service contract / API spec -- "we don't need contracts"
#   - Skip any roadmap or plan -- "we just respond to change"
#
# None of these conclusions are what the Manifesto's own authors
# actually wrote.`,
    },
    {
      label: 'The Manifesto\'s own qualifying sentence',
      language: 'bash',
      code: `# The Manifesto's own official text, agilemanifesto.org, adds this
# sentence immediately after the four value statements -- never
# quoted on the main page:

"That is, while there is value in the items on the right,
 we value the items on the left more."

# Applied correctly, the four values become a WEIGHTED tie-breaker,
# not an exclusion list:

  Individuals and interactions   >   processes and tools
    (both matter; when they conflict, prioritise people)

  Working software               >   comprehensive documentation
    (both matter; when time is scarce, ship working software first)

  Customer collaboration         >   contract negotiation
    (both matter; when rigid, prioritise the live conversation)

  Responding to change           >   following a plan
    (both matter; when reality shifts, adapt the plan rather than
     rigidly defending it)

# A team with zero documentation, zero contracts, and zero plans
# is not "doing Agile well" -- it has misread which side of the
# comparison the Manifesto's own qualifying sentence still values.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A new engineering manager reads the main page\'s own four-value list and mandates: "We\'re Agile now — no more API contracts between our microservices, no more design docs, just build and ship." Six months later, integration bugs between services have tripled, and new hires take twice as long to become productive due to no onboarding documentation. Using this subtopic\'s theory, explain specifically what the manager misread in the Manifesto\'s own values, and what the correct application would have looked like instead.',
    hint: 'Per this subtopic\'s theory, does the Manifesto\'s own qualifying sentence say the right-hand items (processes, documentation, contracts, plans) have NO value, or that they have LESS value than their left-hand counterparts when the two conflict? Does "no more API contracts" and "no more design docs" sound like a weighting decision, or a wholesale removal?',
    solution: 'The manager misread "over" as "instead of" rather than as the weighted comparison the Manifesto\'s own qualifying sentence actually describes: "while there is value in the items on the right, we value the items on the left more." Eliminating API contracts and design docs ENTIRELY is not a weighting decision — it is a wholesale removal of items the Manifesto\'s own text explicitly says still have value. The predictable consequences (tripled integration bugs from no service contracts, slower onboarding from no documentation) are exactly what happens when the right-hand items are discarded rather than deprioritized in genuine trade-off moments. The correct application, per this subtopic\'s theory, would keep lightweight API contracts (even a simple, living OpenAPI spec) and essential documentation (onboarding paths, key architecture decisions) while prioritizing working software and customer collaboration WHEN THE TWO GENUINELY CONFLICT — for example, shipping a working increment for user feedback before writing an exhaustive requirements document, not skipping the requirements conversation and the eventual documentation altogether.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The Agile Manifesto\'s "X over Y" values mean the Y items (processes, documentation, contracts, plans) have no real value and should be minimized or eliminated wherever possible.',
      reality: 'This subtopic\'s theory quotes the Manifesto\'s own text directly: "while there is value in the items on the right, we value the items on the left more." The comparison is an explicit weighting for trade-off moments, not a statement that the right-hand items are worthless.'
    },
    {
      thought: 'A team with zero documentation, zero formal contracts between services, and zero long-term planning is applying the Agile Manifesto\'s values correctly, since those are exactly the items the Manifesto says to deprioritize.',
      reality: 'This subtopic\'s exercise shows this is precisely the misreading the Manifesto\'s own qualifying sentence guards against — eliminating the right-hand items entirely (rather than weighing them lower in genuine conflicts) produces real, predictable costs (integration bugs, slow onboarding) the Manifesto never endorsed.'
    },
    {
      thought: 'The main page\'s own four-bullet list of Agile values is the Manifesto\'s complete, self-contained statement — there is no additional qualifying text that changes how the comparison should be read.',
      reality: 'This subtopic\'s theory shows the Manifesto\'s own official page includes one more sentence immediately after the four value statements, explicitly clarifying that the comparison is a weighting, not an exclusion — a sentence the main page\'s own theory bullet omits entirely.'
    }
  ];
}
