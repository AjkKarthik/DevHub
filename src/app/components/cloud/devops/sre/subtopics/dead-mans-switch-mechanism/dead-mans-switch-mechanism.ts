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
  templateUrl: './dead-mans-switch-mechanism.html',
  styleUrl: './dead-mans-switch-mechanism.scss'
})
export class DeadMansSwitchMechanismSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names the dead man\'s switch but describes it the wrong way round',
      points: [
        'The main page\'s theory says: "Dead man\'s switch / watchdog: an alert that fires if the alerting pipeline itself has been silent for too long." Read literally, this describes an alert whose CONDITION is "the pipeline has been silent" — as if Prometheus itself detects its own silence and fires something.',
        'That is backwards from how the pattern is actually built. Per the established Prometheus community pattern (documented across Prometheus\'s own training materials and multiple independent operational write-ups), a watchdog alert is defined to be ALWAYS firing — its PromQL expression is simply `vector(1)`, a constant that is always true. It is not a detector of silence; it is a permanent, unconditional heartbeat.',
        'The actual silence-detection logic lives entirely OUTSIDE Prometheus and Alertmanager, in a separate, independent external service that receives this constant stream of "I\'m still alive" notifications and pages you specifically when the stream STOPS — the opposite direction of causality from what the main page\'s wording suggests.',
      ]
    },
    {
      heading: 'How the always-firing alert becomes a silence detector, mechanically',
      points: [
        'The watchdog\'s Alertmanager route is configured with a short `repeat_interval` (e.g. every 5 minutes) pointed at a receiver like PagerDuty\'s "Dead Man\'s Snitch" integration, healthchecks.io, or any similar heartbeat-monitoring service — every repeat_interval, Alertmanager re-sends the notification because the alert, being always-firing, never resolves and never stops re-notifying.',
        'The external service is configured with its own expected check-in window (e.g. "expect a ping every 5 minutes, plus some slack"). As long as pings keep arriving on schedule, it stays silent. The moment pings STOP arriving — because Prometheus crashed, Alertmanager crashed, a network partition cut them off, or a misconfiguration broke the routing — the external service notices the ABSENCE of the expected heartbeat and is the one that actually pages someone.',
        'This is why the pattern only works meaningfully with a genuinely separate, independently-hosted external service: if the "watchdog" notification target were itself inside the same monitoring stack being watched, the same failure that silences the alert (Prometheus down, Alertmanager down) would also silence whatever was supposed to detect the silence — the entire point of the pattern is to have a system OUTSIDE the monitored pipeline doing the actual detecting.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The always-firing watchdog rule',
      language: 'bash',
      code: `# prometheus/rules/watchdog.yml
# groups:
#   - name: watchdog
#     rules:
#       - alert: Watchdog
#         expr: vector(1)
#         labels:
#           severity: none
#         annotations:
#           summary: "This is a constant alert used to ensure the entire alerting pipeline is functional"

# vector(1) always evaluates to true -- this alert is ALWAYS firing,
# every single evaluation cycle, forever. It never resolves on its
# own. This is intentional -- it is not meant to detect a problem
# in what it measures (it measures nothing), only to keep producing
# a continuous heartbeat as long as Prometheus + Alertmanager are
# both alive and correctly wired end-to-end.`,
    },
    {
      label: 'Routing the heartbeat to an external silence-detector',
      language: 'bash',
      code: `# alertmanager.yml
# route:
#   routes:
#     - match:
#         alertname: Watchdog
#       receiver: deadmanssnitch
#       repeat_interval: 5m     # re-notify every 5 minutes, forever
#
# receivers:
#   - name: deadmanssnitch
#     webhook_configs:
#       - url: 'https://nosnch.in/xxxxxxxxxx'

# What actually happens:
#
# Every 5 minutes, Alertmanager POSTs to the Dead Man's Snitch URL,
# because the Watchdog alert never stops firing and repeat_interval
# forces a re-send on schedule.
#
# Dead Man's Snitch (an external, independently-hosted service) is
# separately configured: "expect a check-in at least every 5 minutes
# (plus a grace period)." As long as check-ins keep arriving on time,
# it does nothing.
#
# The moment check-ins STOP -- Prometheus down, Alertmanager down,
# a network partition, a misrouted config change -- Dead Man's Snitch
# notices the gap and pages the on-call engineer DIRECTLY, entirely
# independent of the broken pipeline it's reporting on.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets up the Watchdog alert exactly as shown in this subtopic, pointed at an external heartbeat service, and never tests it again after initial setup. Eight months later, a bad Alertmanager config change silently breaks ALL alert routing — every real alert (including SLO burn-rate pages) silently stops reaching anyone. Using this subtopic\'s theory, will the dead man\'s switch catch this specific failure? What is the one thing about this scenario that would determine whether it does?',
    hint: 'Per this subtopic\'s theory, what specifically has to keep working, end-to-end, for the external service to keep receiving its expected heartbeat?',
    solution: 'Per this subtopic\'s theory, whether the dead man\'s switch catches this depends entirely on whether the broken Alertmanager config change also broke the Watchdog alert\'s OWN route to the external service, alongside breaking the routes for real alerts. If the bad config change affected routing broadly enough to also stop the Watchdog\'s heartbeat from reaching Dead Man\'s Snitch, then yes — the external service would notice the missing check-in within its configured grace window and page independently, exactly as designed, catching the outage even though it never inspected any real alert\'s content. But if the bad change ONLY affected the routes for specific real alerts (e.g. it broke routing rules matching `severity: page` but left the separate Watchdog route, matching `alertname: Watchdog`, untouched), the heartbeat would keep arriving on schedule, Dead Man\'s Snitch would stay silent, and the team would have zero warning that real alerts were being silently dropped — a genuine blind spot the pattern does not automatically cover just by existing. This is exactly why the search results\' own advice to test it quarterly (by deliberately stopping Alertmanager or Prometheus) matters: a watchdog that has never been deliberately triggered gives false confidence about exactly which failure modes it actually catches.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A dead man\'s switch works by Prometheus itself detecting that its own alerting pipeline has gone silent, and then firing a special alert about it.',
      reality: 'Per this subtopic\'s theory, the Watchdog alert does the opposite — it is configured to ALWAYS fire (`vector(1)`), producing a constant heartbeat. The actual silence-detection happens entirely in a separate, external service that notices when that constant heartbeat stops arriving — Prometheus never detects its own silence.'
    },
    {
      thought: 'Routing the Watchdog alert to any receiver already inside the same Alertmanager/Prometheus stack (like the same Slack channel real alerts use) provides equivalent protection to routing it to a genuinely external heartbeat service.',
      reality: 'Per this subtopic\'s theory, the entire value of the pattern depends on the detector being OUTSIDE the monitored pipeline — if Prometheus or Alertmanager itself goes down, any receiver living inside that same stack goes silent right along with it, so a watchdog pointed only at an internal channel would fail to notice its own pipeline\'s death.'
    },
    {
      thought: 'Once a dead man\'s switch is configured and confirmed working at setup time, it will reliably catch every future failure of the alerting pipeline going forward with no further attention needed.',
      reality: 'Per this subtopic\'s exercise, a config change can silently break routing for SPECIFIC real alerts while leaving the Watchdog\'s own separate route untouched — the switch only catches failures that also break its own heartbeat path, which is why testing it deliberately and periodically (not just once at setup) is the recommended practice.'
    }
  ];
}
