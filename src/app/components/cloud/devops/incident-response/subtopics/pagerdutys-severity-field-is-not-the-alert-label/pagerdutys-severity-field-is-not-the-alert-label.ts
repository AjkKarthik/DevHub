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
  templateUrl: './pagerdutys-severity-field-is-not-the-alert-label.html',
  styleUrl: './pagerdutys-severity-field-is-not-the-alert-label.scss'
})
export class PagerdutysSeverityFieldIsNotTheAlertLabelSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own config uses the word "severity" for two genuinely different things in the same code tab',
      points: [
        'The main page\'s own routing config matches alerts using `match: { severity: page }` — an AlertManager LABEL the team defines however they want (their own theory section elsewhere uses `severity: page` and `severity: warning` as the routing values). The SAME code tab\'s `pagerduty_configs` block separately sets `severity: critical` — a field with an identical name, sitting right next to the routing config, easy to read as "the same severity, just referenced twice."',
        'These are not the same thing. AlertManager\'s own `severity` label is whatever string value the team chooses for ROUTING decisions — `page`, `warning`, or anything else. PagerDuty\'s own `severity` field inside `pagerduty_configs` is a SEPARATE, PagerDuty-specific setting that must be "one of the following: \'critical\', \'warning\', \'error\' or \'info\'" — PagerDuty\'s own fixed incident-urgency taxonomy, completely independent of whatever label values the team\'s AlertManager routing happens to use.',
      ]
    },
    {
      heading: 'Why the main page\'s own config hardcodes PagerDuty\'s field instead of passing the alert\'s own severity label through',
      points: [
        'The main page\'s own `pagerduty_configs` sets `severity: critical` as a fixed, hardcoded string — not templated from the alert\'s own `severity: page` label at all. This is a deliberate, correct choice: the alert-level label value (`page`) isn\'t even a valid PagerDuty severity value in the first place (PagerDuty only accepts critical/error/warning/info), so passing it through directly would be a type mismatch, not just a stylistic inconsistency.',
        'PagerDuty\'s own severity field CAN be templated dynamically from an alert label — using something like `severity: \'{{ .CommonLabels.severity }}\'` — but only if the AlertManager-side label values are already chosen to match PagerDuty\'s own exact accepted set (critical/error/warning/info). Since the main page\'s own routing scheme uses `page`/`warning` as its own AlertManager-level vocabulary (not PagerDuty\'s), hardcoding `severity: critical` in the receiver config is the correct approach for this specific setup — a team wanting to derive PagerDuty severity dynamically would first need to align their AlertManager label values with PagerDuty\'s own accepted vocabulary.',
        'The practical consequence: a P1 (`severity: page`) and, hypothetically, a differently-routed alert also reaching the SAME `pagerduty-critical` receiver would both show up in PagerDuty with the identical hardcoded `critical` urgency — PagerDuty has no visibility into the original AlertManager-level severity label at all unless that information is explicitly templated into the `description` or `details` fields (which the main page\'s own config does do for the summary and runbook link, just not for severity itself).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two "severity" fields, two different vocabularies, in the same config',
      language: 'bash',
      code: `# The main page's own routing config:
# route:
#   routes:
#     - match: { severity: page }      # <-- AlertManager's OWN
#       receiver: pagerduty-critical   #     label, team's own
#                                      #     vocabulary (page/warning)

# The main page's own receiver config, same file:
# receivers:
#   - name: pagerduty-critical
#     pagerduty_configs:
#       - routing_key: <PAGERDUTY_INTEGRATION_KEY>
#         severity: critical           # <-- PagerDuty's OWN field,
#                                      #     fixed vocabulary:
#                                      #     critical/error/warning/info

# These are NOT the same "severity" -- the routing match's value
# ("page") never appears anywhere in PagerDuty's own incident data
# at all, unless it's explicitly templated into description/details.
# PagerDuty only ever sees "critical", the hardcoded value, for
# every single alert that reaches this specific receiver.`,
    },
    {
      label: 'What would break if the alert\'s own label were passed through unmodified',
      language: 'bash',
      code: `# A plausible-looking "simplification" -- template PagerDuty's
# severity directly from the alert's own label:

# receivers:
#   - name: pagerduty-critical
#     pagerduty_configs:
#       - routing_key: <PAGERDUTY_INTEGRATION_KEY>
#         severity: '{{ .CommonLabels.severity }}'
#         # Templated from AlertManager's OWN label value: "page"

# PagerDuty's own API rejects (or silently mishandles, depending
# on the client) a severity value outside its own fixed set --
# "page" is not one of "critical", "error", "warning", "info".
# This isn't a hypothetical: real-world reports of exactly this
# kind of mismatch (severity not appearing correctly on the
# PagerDuty side) trace back to templating an AlertManager label
# value that was never actually one of PagerDuty's own accepted
# strings.

# The main page's own hardcoded severity: critical sidesteps this
# entirely -- it never risks passing an invalid value, precisely
# because it doesn't depend on whatever vocabulary the team's own
# AlertManager routing happens to use.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants PagerDuty incidents to visually reflect whether an alert was P1 or P2, so they change the main page\'s own hardcoded `severity: critical` to `severity: \'{{ .CommonLabels.severity }}\'`, expecting PagerDuty to now show "page" or "warning" depending on which alert fired. After deploying, PagerDuty incidents show no severity at all, or an error. Using this subtopic\'s theory, explain what went wrong and the correct fix.',
    hint: 'Per this subtopic\'s theory, is "page" (the team\'s own AlertManager label value) also a value PagerDuty\'s own severity field is documented to accept?',
    solution: 'The templating itself works correctly — AlertManager successfully substitutes the alert\'s own `severity` label value ("page") into the PagerDuty config. The problem, per this subtopic\'s theory, is that "page" was never a valid value for PagerDuty\'s OWN severity field in the first place — PagerDuty\'s own field "must be one of the following: \'critical\', \'warning\', \'error\' or \'info\'," a fixed vocabulary that has nothing to do with whatever label values the team chose for their own AlertManager routing scheme. The fix isn\'t to abandon dynamic severity — it\'s to first align the two vocabularies: either rename the AlertManager-level routing labels to directly use PagerDuty\'s own accepted values (`severity: critical` / `severity: warning` instead of `page`/`warning`), or keep the AlertManager routing labels as they are and add an explicit mapping step (a Go template conditional, or a small relabeling rule) that translates "page" to "critical" and "warning" to "warning" before it reaches the pagerduty_configs severity field.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The `severity` field inside pagerduty_configs and the `severity` label used for AlertManager routing (match: { severity: page }) are the same value, just referenced in two places in the same config.',
      reality: 'Per this subtopic\'s theory, they are two independent concepts that happen to share a field name — AlertManager\'s severity label is an arbitrary string the team defines for routing purposes; PagerDuty\'s own severity field is a fixed vocabulary ("critical", "warning", "error", "info") that PagerDuty itself validates and displays.'
    },
    {
      thought: 'Since the main page\'s own config hardcodes severity: critical instead of templating it from the alert label, this must be an oversight or a missed opportunity for more dynamic configuration.',
      reality: 'This subtopic\'s theory shows the hardcoding is actually the CORRECT choice given the rest of the main page\'s own setup — the team\'s own AlertManager severity label values ("page", "warning") are not valid PagerDuty severity values at all, so templating them through directly would produce an invalid or rejected value.'
    },
    {
      thought: 'Any label value used for AlertManager routing decisions can be safely templated directly into any downstream receiver\'s own similarly-named field.',
      reality: 'Per this subtopic\'s exercise, a receiver-specific field like PagerDuty\'s severity often has its OWN validation rules and accepted vocabulary, independent of whatever the upstream AlertManager label\'s vocabulary happens to be — templating one directly into the other without checking they align can silently produce an invalid downstream value.'
    }
  ];
}
