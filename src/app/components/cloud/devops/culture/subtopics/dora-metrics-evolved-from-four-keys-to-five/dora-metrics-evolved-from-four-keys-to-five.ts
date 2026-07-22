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
  templateUrl: './dora-metrics-evolved-from-four-keys-to-five.html',
  styleUrl: './dora-metrics-evolved-from-four-keys-to-five.scss'
})
export class DoraMetricsEvolvedFromFourKeysToFiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents "the Four Key Metrics" as DORA\'s current, complete framework — DORA\'s own site has since moved to five',
      points: [
        'The main page\'s own theory heading is literally "DORA Metrics — The Four Key Metrics," listing Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to Restore (MTTR) as a fixed, four-item set, each with a specific "Elite / High / Medium / Low" percentage or time-window cutoff attributed to "seven years of Accelerate research data."',
        'DORA\'s own current guide (dora.dev) describes a different, larger set: "shifting from the original four keys to the current five-metric model." The four the main page names are still there in substance, but the set itself is not frozen at four — DORA\'s own framework has grown since the numbers the main page cites were current.',
        'Two concrete changes DORA\'s own site documents: MTTR has been renamed and redefined as "Failed deployment recovery time" — "the time it takes to recover from a deployment that fails and requires immediate intervention" — and a genuinely new fifth metric, Deployment rework rate, has been added: "The ratio of deployments that are unplanned but happen as a result of an incident in production."',
      ]
    },
    {
      heading: 'Why the fifth metric matters, and what it measures that the original four do not',
      points: [
        'Deployment rework rate answers a question none of the original four metrics can: not just "how often do deployments cause an incident" (Change Failure Rate) or "how fast do we recover" (Failed deployment recovery time), but specifically what SHARE of a team\'s total deployment volume is itself just cleanup work forced by a PRIOR incident, rather than planned, forward-progress work.',
        'A team could have a low Change Failure Rate and a fast recovery time while still spending a large fraction of its total deployment capacity on unplanned rework — Deployment Frequency alone (the main page\'s own first metric) would not reveal this, since it counts every deployment equally, whether planned feature work or incident-driven rework.',
        'This is exactly the kind of gap DORA\'s own metric evolution exists to close — per the same source, changes like the MTTR rename are documented and explained in DORA\'s own published methodology notes ("A history of DORA\'s software delivery metrics"), meaning the four-vs-five distinction is not a minor rebranding but a deliberate, documented refinement of what the research measures.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own four-metric dashboard script -- one field short',
      language: 'bash',
      code: `# Matches the main page's own DORA Metrics Dashboard example --
# tracking exactly the four metrics its theory names.

deploy_production:
  stage: deploy
  script:
    - echo "Deployment started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    - ./scripts/deploy.sh
  after_script:
    # (1) Deployment Frequency
    - curl -X POST "$METRICS_URL/deployments" \\
        -d '{"service":"api","env":"production","timestamp":"'$(date -u +%s)'"}'

# (2) Change Failure Rate -- tracked via incident tagging
#   incident_linked_deploy: abc123

# (3) Lead Time -- Lead Time = deploy_timestamp - commit_timestamp

# (4) MTTR -- MTTR = sum(incident_resolved_at - incident_triggered_at) / incident_count

# Per DORA's own current guide, this captures 4 of the 5 metrics in
# the CURRENT model -- Deployment rework rate, "the ratio of
# deployments that are unplanned but happen as a result of an
# incident in production," is not tracked here at all.`,
    },
    {
      label: 'Adding the fifth metric -- Deployment rework rate',
      language: 'bash',
      code: `# To track Deployment rework rate, per DORA's own definition, each
# deployment record needs one more field: was THIS deployment itself
# triggered by a prior production incident, as opposed to planned work?

deploy_production:
  stage: deploy
  script:
    - echo "Deployment started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    - ./scripts/deploy.sh
  after_script:
    - curl -X POST "$METRICS_URL/deployments" \\
        -d '{
          "service": "api",
          "env": "production",
          "timestamp": "'$(date -u +%s)'",
          "triggered_by_incident": '"$IS_INCIDENT_ROLLBACK"'
        }'

# Deployment Rework Rate = deployments WHERE triggered_by_incident=true
#                           / total deployments
#
# A team could show:
#   Deployment Frequency: 12/week          (looks healthy)
#   Change Failure Rate:  4%                (elite-range)
#   Failed Deploy Recovery: 25 minutes      (elite-range)
#   Deployment Rework Rate: 35%             <- 1 in 3 deploys is
#                                               cleanup, not progress
#
# None of the first three numbers alone would surface this --
# exactly the gap DORA's own fifth metric was added to close.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team dashboards exactly the four metrics from the main page\'s own theory (Deployment Frequency, Lead Time, Change Failure Rate, MTTR) and all four land comfortably in DORA\'s "Elite" range. Leadership is confused why the team still feels constantly behind on planned feature work despite these excellent-looking numbers. Using this subtopic\'s theory, explain what a fifth metric — Deployment rework rate — might reveal that the original four cannot, and why a team could score "Elite" on all four while still having this specific problem.',
    hint: 'Per this subtopic\'s theory, what does Deployment rework rate specifically measure that Deployment Frequency does not — does Deployment Frequency distinguish between a deployment that ships a new feature and a deployment that is only fixing a previous incident?',
    solution: 'Per this subtopic\'s theory, Deployment rework rate measures "the ratio of deployments that are unplanned but happen as a result of an incident in production" — a dimension none of the original four metrics capture. Deployment Frequency counts every deployment equally, whether it ships new functionality or is purely incident-driven cleanup, so a team could deploy very frequently (high Deployment Frequency), rarely cause NEW incidents from those deployments (low Change Failure Rate), and recover quickly on the rare occasions they do (fast Failed deployment recovery time) — all "Elite" by the original four metrics — while still spending a large fraction of that deployment volume repeatedly patching the SAME underlying instability, leaving little real capacity for planned feature work. This is exactly the scenario this subtopic\'s theory identifies as the reason DORA added a fifth metric: the original four can all look excellent while masking a team that is, in substance, treading water — a distinction only visible once deployments are tagged by whether they were incident-triggered rework or planned, forward progress.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'DORA\'s "Four Key Metrics" is a fixed, permanent framework — Deployment Frequency, Lead Time, Change Failure Rate, and MTTR are the complete, current set of metrics the DORA research program tracks.',
      reality: 'This subtopic\'s theory quotes DORA\'s own current guide directly: the framework has been "shifting from the original four keys to the current five-metric model." The four the main page names are still substantively present, but DORA\'s own site now documents a fifth metric, Deployment rework rate, alongside a renamed and redefined MTTR.'
    },
    {
      thought: 'MTTR (Mean Time to Restore) is still DORA\'s own current name and definition for the recovery-time metric — it is simply one of the four metrics, unchanged since the original Accelerate research.',
      reality: 'This subtopic\'s theory quotes DORA\'s own current definition: the metric is now named "Failed deployment recovery time," defined as "the time it takes to recover from a deployment that fails and requires immediate intervention" — a renamed, more precisely scoped successor to MTTR, not the identical original metric under its original name.'
    },
    {
      thought: 'A team scoring "Elite" on Deployment Frequency, Lead Time, Change Failure Rate, and MTTR has no meaningful gaps left in its delivery pipeline health that DORA\'s own framework would flag.',
      reality: 'This subtopic\'s exercise shows a team can score Elite on all four original metrics while still having a real, DORA-measurable problem — a high Deployment rework rate — that only the fifth metric surfaces, since none of the original four distinguish incident-driven rework deployments from planned, forward-progress ones.'
    }
  ];
}
