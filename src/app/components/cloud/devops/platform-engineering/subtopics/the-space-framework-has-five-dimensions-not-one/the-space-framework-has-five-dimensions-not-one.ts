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
  templateUrl: './the-space-framework-has-five-dimensions-not-one.html',
  styleUrl: './the-space-framework-has-five-dimensions-not-one.scss'
})
export class TheSpaceFrameworkHasFiveDimensionsNotOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page name-drops SPACE once, attached only to "satisfaction" — it is a five-dimension framework',
      points: [
        'The main page\'s own Platform as a Product theory lists a single metrics bullet: "developer satisfaction (SPACE framework)." This is the entire treatment SPACE gets anywhere on the page — no explanation of what the acronym stands for, or that satisfaction is only one of the dimensions it covers.',
        'SPACE comes from a specific 2021 research paper ("The SPACE of Developer Productivity," Forsgren, Storey, Maddila, Zimmermann, Houck, and Butler — researchers from Microsoft Research, GitHub, and the University of Victoria) and defines five dimensions, not one: Satisfaction and well-being, Performance, Activity, Communication and collaboration, and Efficiency and flow.',
        'Only the first word of the acronym — the "S" — is what the main page\'s own bullet actually names. The other four letters (P, A, C, E) each represent a genuinely distinct measurement dimension the framework treats as necessary alongside satisfaction, not optional extras.',
      ]
    },
    {
      heading: 'Why measuring only satisfaction misses the framework\'s own central point',
      points: [
        'The five dimensions, per the framework\'s own definitions: Satisfaction and well-being (how fulfilled and healthy developers feel); Performance (the quality and speed of outcomes, not just output); Activity (the count of actions like commits, code reviews, or deployments); Communication and collaboration (how well information and work flow between people); Efficiency and flow (how much friction and interruption developers experience while working).',
        'The framework\'s own central methodological principle is explicit: organizations "should measure across at least three dimensions to get a meaningful picture of productivity," specifically to prevent "over-optimization on a single metric." A platform team that only tracks a developer satisfaction survey score — exactly what the main page\'s own bullet describes — is measuring one-fifth of what the framework itself considers a minimum viable picture.',
        'This connects directly to the main page\'s own broader "platform as a product" metrics list, which separately names "time to first deploy" (a Performance-dimension metric), "platform adoption rate" (an Activity-dimension metric), and "reduction in support tickets" (arguably an Efficiency-dimension metric) — the main page is ALREADY tracking multiple SPACE dimensions in substance, it just never names the framework as covering anything beyond the one satisfaction bullet where it happens to be mentioned.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own metrics list -- SPACE-labeled at only one point',
      language: 'bash',
      code: `# Matches the main page's own "Platform as a Product" theory
# bullet and QnA metrics list:

Metrics:
  - Platform adoption rate
  - Time to first deploy for a new team
  - Number of support tickets (toil indicator)
  - Developer satisfaction (SPACE framework)   <- SPACE named HERE only
  - DORA metrics improvement across teams

# Read at face value, "SPACE framework" appears to be a label
# specifically for the satisfaction metric -- as if SPACE and
# "developer satisfaction survey" were the same thing.`,
    },
    {
      label: 'Mapping the main page\'s OWN metrics onto all five SPACE dimensions',
      language: 'bash',
      code: `# The five dimensions SPACE actually defines, per "The SPACE of
# Developer Productivity" (Forsgren, Storey, Maddila, Zimmermann,
# Houck, Butler):

# S -- Satisfaction and well-being
#      how fulfilled and healthy developers feel
#      -> main page's own "Developer satisfaction (SPACE framework)"

# P -- Performance
#      quality and speed of outcomes, not just output
#      -> main page's own "Time to first deploy for a new team"
#      -> main page's own "DORA metrics improvement"

# A -- Activity
#      count of actions: commits, code reviews, deployments
#      -> main page's own "Platform adoption rate" (% of teams
#         actively using the golden path)

# C -- Communication and collaboration
#      how well information and work flow between people
#      -> NOT explicitly covered anywhere on the main page

# E -- Efficiency and flow
#      friction and interruptions experienced while working
#      -> main page's own "Number of support tickets" (a proxy for
#         how much friction developers hit before needing help)

# The main page's OWN metrics already touch four of the five
# dimensions in substance -- it just never connects them back to
# the framework by name, and never explicitly tracks anything in
# the Communication/collaboration dimension at all.

# The framework's own core principle:
# "organizations should measure across at least three dimensions
#  to get a meaningful picture of productivity" -- specifically to
# avoid over-optimizing on any single metric.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team, following the main page\'s own metrics bullet literally, tracks ONLY a quarterly developer satisfaction survey score and reports "we use the SPACE framework" in their platform roadmap review. Satisfaction scores are consistently high, but adoption of the new golden path template has been flat for two quarters, and nobody on the platform team has noticed. Using this subtopic\'s theory, explain what SPACE dimension this team\'s measurement approach is missing that would have surfaced the adoption problem, and why "developer satisfaction (SPACE framework)" alone does not constitute using the framework as intended.',
    hint: 'Per this subtopic\'s theory, which SPACE dimension specifically measures the count of actions like using a golden path template — Satisfaction, or one of the other four? Does the framework\'s own "at least three dimensions" principle allow tracking just one dimension and calling it complete?',
    solution: 'The team is missing the Activity dimension specifically — per this subtopic\'s theory, Activity measures "the count of actions like commits, code reviews, or deployments," which directly includes golden-path-template adoption counts. Tracking only Satisfaction cannot surface an adoption problem, because satisfaction and adoption are measuring genuinely different things: developers can feel satisfied with the platform team\'s communication and support (high Satisfaction score) while still not actually using the golden path they were surveyed about (flat Activity). This is precisely the failure mode this subtopic\'s theory describes the framework\'s own "at least three dimensions" principle as guarding against — over-optimizing on, or exclusively watching, a single metric hides problems visible only in the OTHER dimensions. "Developer satisfaction (SPACE framework)" as a standalone metric, per this subtopic\'s theory, captures only the "S" of a five-letter framework — using SPACE as intended, per the framework\'s own stated minimum, means tracking Satisfaction alongside at least two more of Performance, Activity, Communication and collaboration, and Efficiency and flow, not substituting one dimension\'s name for the whole framework.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The SPACE framework is essentially a formal name for measuring developer satisfaction — the main page\'s own "developer satisfaction (SPACE framework)" bullet is a complete, accurate summary of what the framework covers.',
      reality: 'This subtopic\'s theory shows SPACE defines five distinct dimensions — Satisfaction and well-being, Performance, Activity, Communication and collaboration, and Efficiency and flow — of which satisfaction is only the first. The framework\'s own name literally spells out five separate letters, each representing a genuinely different measurement category.'
    },
    {
      thought: 'A platform team that tracks a single, well-designed satisfaction survey has adequately applied the SPACE framework to measuring platform success.',
      reality: 'This subtopic\'s exercise shows a team can have excellent satisfaction scores while missing a real, measurable problem (flat golden-path adoption) visible only in a different dimension. The framework\'s own stated principle — measure across "at least three dimensions" — exists specifically because single-dimension measurement, even done well, produces an incomplete and potentially misleading picture.'
    },
    {
      thought: 'The main page\'s own broader metrics list (adoption rate, time to first deploy, support tickets, DORA improvement) is unrelated to SPACE — SPACE is specifically the satisfaction-survey piece, a separate concern from those other metrics.',
      reality: 'This subtopic\'s second code example shows the main page\'s own OTHER metrics already map onto SPACE\'s Performance, Activity, and Efficiency dimensions in substance — "time to first deploy" and "DORA improvement" are Performance-dimension metrics, "platform adoption rate" is an Activity-dimension metric, and "support ticket count" is an Efficiency-dimension proxy. The main page was already applying most of SPACE without naming it, and never named the one dimension (Communication and collaboration) it does not track at all.'
    }
  ];
}
