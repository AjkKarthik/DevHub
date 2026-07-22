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
  templateUrl: './daily-cap-stops-all-ingestion-not-just-the-excess.html',
  styleUrl: './daily-cap-stops-all-ingestion-not-just-the-excess.scss'
})
export class DailyCapStopsAllIngestionNotJustTheExcessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "avoid alert fatigue" QnA never mentions a cost control that can silently blind your monitoring entirely',
      points: [
        'The main page\'s own QnA on avoiding alert fatigue lists dynamic thresholds, alert suppression, severity routing, multi-condition alerts, and deduplication — all techniques for making sure alerts are meaningful when they fire. None of it addresses a scenario where the underlying telemetry itself silently stops arriving.',
        'A daily ingestion cap is a real, commonly-configured cost control in both Application Insights and Log Analytics that can produce exactly this scenario — and its behavior when triggered is sharper than "reduce data a bit."',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own sampling and cost documentation: a triggered daily cap doesn\'t throttle, it stops ingestion entirely',
      points: [
        'Per Microsoft\'s own documentation: "Set a daily cap to prevent unexpected costs. This limit stops telemetry ingestion when it reaches the threshold." This is a hard stop, not a rate limit or a switch to sampling more aggressively — once the configured GB threshold for the day is reached, no further telemetry of that type is accepted at all.',
        'Microsoft\'s own guidance explicitly warns about the failure mode this creates: "Use this cap as a last-resort control, not a replacement for sampling. A sudden increase in data volume can trigger the cap, creating a gap in telemetry until it resets the next day." The exact scenario most likely to spike data volume — an incident generating a flood of error logs and exception telemetry — is also the scenario most likely to trip the cap and go dark.',
        'The cap resets on a daily UTC boundary, not a rolling 24-hour window from when it was hit — meaning a cap triggered a few hours into the day can leave a monitoring gap lasting up to nearly 24 hours, not just a brief pause.',
      ]
    },
    {
      heading: 'Why this deserves its own place alongside the main page\'s alert-fatigue advice, not folded into "just tune sampling"',
      points: [
        'Sampling (which the main page doesn\'t cover, and which a related subtopic on this same topic addresses) and the daily cap are two separate cost controls with very different failure modes: sampling reduces volume smoothly and proportionally across all telemetry, while the daily cap is a binary on/off switch that activates only once a threshold is crossed.',
        'A team that has correctly tuned sampling to keep normal-day costs predictable can still get caught by the daily cap specifically DURING an incident — the moment error volume spikes precisely when sampling alone (correctly configured for normal traffic) isn\'t enough to keep the day\'s total under the cap.',
        'The practical mitigation is treating the daily cap\'s configured threshold as a genuine incident-response constraint, not just a budget line item — sizing it with enough headroom above normal daily volume to survive a real incident\'s telemetry spike, and treating "the cap fired" itself as an event worth alerting on (via the Activity Log or a dedicated usage-based alert), since by definition normal telemetry-based alerting can\'t detect its own absence.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking and configuring a daily cap',
      language: 'bash',
      code: `# Check the current daily cap on a Log Analytics workspace
az monitor log-analytics workspace show \\
  --workspace-name my-laws --resource-group my-rg \\
  --query "workspaceCapping"

# Set (or raise) a daily cap -- in GB
az monitor log-analytics workspace update \\
  --workspace-name my-laws --resource-group my-rg \\
  --quota 50

# Per Microsoft's own docs, this is described as a "last-resort
# control, not a replacement for sampling" -- size it with real
# headroom above normal daily ingestion, since it stops ALL
# ingestion outright once crossed, not just the overage.`,
    },
    {
      label: 'Detecting that the cap fired, since normal telemetry can\'t tell you',
      language: 'bash',
      code: `# Because a triggered daily cap stops the telemetry that would
# normally power an alert, the alert has to come from a signal
# OUTSIDE the capped data path -- the workspace's own Activity Log
# records the cap-triggered event itself:
az monitor activity-log alert create \\
  --name daily-cap-triggered-alert \\
  --resource-group my-rg \\
  --condition category=ServiceHealth \\
  --scopes /subscriptions/<subId>/resourceGroups/my-rg/providers/Microsoft.OperationalInsights/workspaces/my-laws \\
  --action-group /subscriptions/<subId>/resourceGroups/my-rg/providers/microsoft.insights/actionGroups/on-call

# Alternative: a scheduled query against the Usage table itself
# (a lightweight, low-volume table less likely to be affected by
# the same cap) tracking ingestion trend toward the configured quota:
az monitor log-analytics query --workspace $LAWS_ID --analytics-query '
Usage
| where TimeGenerated > ago(1d)
| summarize TotalGB = sum(Quantity) / 1000.
'
# Compare TotalGB against the configured --quota value proactively,
# rather than discovering the cap fired only once dashboards go dark.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Midway through a production incident, your team notices the Application Insights dashboards have gone completely quiet — no new requests, exceptions, or dependency data for the last several hours, right when error volume should be spiking. Alerts based on this telemetry haven\'t fired either. What\'s a likely, specific cause worth checking immediately, and why wouldn\'t the normal alerting have caught it?',
    hint: 'Consider what happens to Application Insights telemetry once a specific cost-control threshold is crossed, and whether that same telemetry could ever be the thing that detects its own absence.',
    solution: 'A likely cause is that the incident\'s own telemetry spike tripped the daily ingestion cap — per Microsoft\'s own documentation, this "stops telemetry ingestion when it reaches the threshold" entirely, not just throttling it, and "a sudden increase in data volume can trigger the cap, creating a gap in telemetry until it resets the next day." Normal alerting couldn\'t have caught this because it depends on the very telemetry that stopped arriving — a log-based or even metric-based alert relying on requests/exceptions data has nothing to evaluate once ingestion for that data stops. Detecting this specific failure mode requires a signal outside the capped data path: the workspace\'s own Activity Log (which records the cap-triggered event itself) or a separate usage-tracking query against the lightweight Usage table.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A daily ingestion cap in Azure Monitor works like a soft throttle — once triggered, it reduces or samples incoming telemetry more aggressively rather than stopping it.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly that a triggered cap "stops telemetry ingestion when it reaches the threshold" — it is a hard, binary stop, not a gradual reduction.'
    },
    {
      thought: 'A daily cap resets on a rolling 24-hour timer starting from whenever it was triggered, so the gap in telemetry is capped at roughly one day at most from that moment.',
      reality: 'Per this subtopic\'s theory, the reset happens on the daily UTC boundary, not a rolling window from the trigger moment — a cap tripped early in the UTC day can leave a monitoring gap lasting nearly the full remainder of that day.'
    },
    {
      thought: 'If a daily cap silently stops telemetry during an incident, the normal alert rules configured on that telemetry will still detect the problem, just with a delay.',
      reality: 'Per this subtopic\'s theory, an alert rule that depends on the very telemetry that stopped arriving has nothing left to evaluate — detecting a triggered cap requires a separate signal, such as the Activity Log or a usage-tracking query, that doesn\'t depend on the capped data path.'
    }
  ];
}
