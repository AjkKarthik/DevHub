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
  templateUrl: './bsl-has-a-four-year-change-date-that-converts-to-mpl-automatically.html',
  styleUrl: './bsl-has-a-four-year-change-date-that-converts-to-mpl-automatically.scss'
})
export class BslHasAFourYearChangeDateThatConvertsToMplAutomaticallySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents BSL 1.1 as a fixed, permanent restriction',
      points: [
        'The main page\'s quick reference describes BSL as: "HashiCorp re-licensed Terraform from MPL-2.0 to BSL 1.1 in Aug 2023," framed alongside "BSL 1.1 restricts use in competing products." Read on its own, this suggests a permanent, static licensing state — restricted now, restricted indefinitely.',
      ]
    },
    {
      heading: 'What BSL 1.1 actually includes: a Change Date that automatically converts each release to MPL 2.0',
      points: [
        'Business Source License 1.1 is not a permanently proprietary license — it has a built-in "Change Date" clause. Four years after each specific Terraform RELEASE\'s date under BSL, that specific release\'s source code automatically converts to the MPL 2.0 open-source license, with no action required by HashiCorp.',
        'This applies PER RELEASE, not to "Terraform" as a single fixed point — a version released in August 2023 converts to MPL around August 2027; a version released a year later converts around 2028, and so on. Every future BSL-licensed release carries its own independent four-year clock.',
      ]
    },
    {
      heading: 'Why this matters for the OpenTofu-vs-Terraform decision the main page frames as purely a licensing/governance call',
      points: [
        'The main page\'s own QnA frames the choice as "evaluate their specific licensing requirements and risk tolerance for potential future divergence" — the Change Date is directly relevant to that risk assessment: today\'s BSL restriction on a given Terraform release is a TEMPORARY state with a known, fixed expiration for that specific release, not an open-ended one.',
        'This does not eliminate the reasons a team might prefer OpenTofu (ongoing governance philosophy, avoiding vendor lock-in, wanting the LATEST release to be open rather than waiting four years for each one) — but it is a materially different picture from "Terraform is now closed-source" and worth knowing explicitly when weighing the decision, rather than assuming BSL restrictions never expire.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'How the Change Date applies, per release',
      language: 'bash',
      code: `# Illustrative timeline (not exact HashiCorp dates):

# Terraform 1.6.0 released under BSL 1.1 -- August 2023
#   -> Change Date: ~August 2027
#   -> After that date, 1.6.0's source automatically becomes
#      available under MPL 2.0 (the original open-source license)

# Terraform 1.9.0 released under BSL 1.1 -- some later date
#   -> Its OWN Change Date is four years from ITS release date,
#      independently of when 1.6.0 converts

# Every BSL-licensed Terraform release has its own four-year
# clock -- there is no single "Terraform becomes open source"
# date; each version's restriction expires on its own schedule.

# The BSL 1.1 LICENSE TEXT itself (not the specific restriction
# rules) explicitly names MPL 2.0 as the "Change License" that
# applies automatically once a given release's Change Date passes.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team evaluating whether to adopt OpenTofu argues: "Terraform is permanently closed-source now, so we should switch to OpenTofu to guarantee we always have open-source access." Is the "permanently closed-source" premise accurate, and how does BSL 1.1\'s Change Date affect this argument?',
    hint: 'Does BSL 1.1 restrict a given Terraform release forever, or does the restriction have a fixed expiration built into the license itself?',
    solution: 'The "permanently closed-source" premise is not accurate. BSL 1.1 includes a Change Date clause: four years after each specific release\'s date, that release automatically converts to the MPL 2.0 open-source license with no action required from HashiCorp — the restriction is temporary and release-specific, not permanent. This weakens (though doesn\'t eliminate) the "guarantee open-source access forever" argument for switching to OpenTofu specifically as a hedge against permanent closure — that particular risk doesn\'t exist in the form the argument assumes. Other reasons to prefer OpenTofu (wanting the LATEST release open immediately rather than waiting four years, community governance philosophy, avoiding any single vendor\'s control) remain valid independently of this correction, but they are different arguments than "Terraform will never be open source again."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once HashiCorp re-licensed Terraform to BSL 1.1 in August 2023, every version of Terraform is permanently restricted under that license with no path back to open source.',
      reality: 'Per this subtopic\'s theory, BSL 1.1 includes a four-year Change Date clause — each release automatically converts to the MPL 2.0 open-source license four years after ITS OWN release date, with no permanent restriction built in.'
    },
    {
      thought: 'The BSL Change Date applies to "Terraform" as a whole on a single fixed date, meaning the entire project becomes open source again all at once.',
      reality: 'Per this subtopic\'s theory, the Change Date applies PER RELEASE — each version released under BSL has its own independent four-year clock, so different releases convert to MPL 2.0 on different dates, not all simultaneously.'
    },
    {
      thought: 'Knowing that BSL-licensed Terraform releases eventually convert to MPL 2.0 removes any legitimate reason a team might still prefer OpenTofu.',
      reality: 'Per this subtopic\'s theory, the Change Date corrects the "permanently closed-source" misconception specifically — it doesn\'t address separate reasons for preferring OpenTofu, like wanting the LATEST release open immediately rather than waiting four years, or preferring community governance over single-vendor control.'
    }
  ];
}
