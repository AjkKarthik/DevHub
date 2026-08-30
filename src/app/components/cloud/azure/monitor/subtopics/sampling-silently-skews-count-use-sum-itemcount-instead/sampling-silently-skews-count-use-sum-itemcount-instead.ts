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
  templateUrl: './sampling-silently-skews-count-use-sum-itemcount-instead.html',
  styleUrl: './sampling-silently-skews-count-use-sum-itemcount-instead.scss'
})
export class SamplingSilentlySkewsCountUseSumItemcountInsteadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page builds three KQL examples around count(), and never mentions the one thing that can make that number wrong',
      points: [
        'The main page\'s own "KQL Queries" codeTab uses summarize count() by resultCode, top 10 by duration desc, and summarize count(), sample = any(outerMessage) by problemId — every one of these treats a plain row count as the true number of underlying events. Application Insights sampling is never mentioned anywhere on the main page.',
        'This matters because Application Insights applies sampling by default for any application generating meaningful telemetry volume — and sampling doesn\'t just reduce cost, it reduces the actual number of rows stored, which silently changes what count() means.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own sampling documentation: sampling is on by default, and each retained row can represent more than one real event',
      points: [
        'Per Microsoft\'s own docs: "Sampling is essential for applications generating large amounts of telemetry. Without sampling, excessive data ingestion can increase storage and processing costs, and cause Application Insights to throttle telemetry... The Application Insights OpenTelemetry distros include a default sampler." Sampling isn\'t an opt-in feature you might have missed enabling — it\'s active by default for any reasonably active application.',
        'When sampling is active, each stored telemetry row carries an itemCount field representing how many original events it stands in for — a row with itemCount = 10 means 10 real requests/exceptions/dependencies happened, but only 1 row was actually stored and is available to count(). Microsoft\'s own guidance for checking this directly confirms the mechanism: "union requests,dependencies,pageViews,browserTimings,exceptions,traces | where timestamp > ago(1d) | summarize RetainedPercentage = 100/avg(itemCount) by bin(timestamp, 1h), itemType — If you see that RetainedPercentage for any type is less than 100, then that type of telemetry is being sampled."',
        'Metrics are the one signal type Microsoft explicitly guarantees is unaffected: "Metrics aren\'t sampled. Use them to reliably alert on key signals for your services and dependencies." This directly reinforces — from inside Application Insights specifically, not just the general Metrics-vs-Logs framing the main page already covers — why the main page\'s own advice to prefer metrics for alerting matters even more once sampling is factored in.',
      ]
    },
    {
      heading: 'What this means for every count()-based query on the main page, and the fix',
      points: [
        'The main page\'s own "high 5xx alert" pattern and its "exceptions grouped by problemId" query both use bare count() — if sampling is retaining, say, 20% of telemetry, the reported error count is roughly 5x too LOW, not just imprecise. A dashboard reporting "12 failed requests in the last hour" during an incident where sampling is active could represent 60 real failures.',
        'The fix is straightforward once you know to apply it: replace count() with sum(itemCount) anywhere an accurate total matters. requests | where resultCode >= 500 | summarize sum(itemCount) by resultCode gives the true (extrapolated) count, while requests | where resultCode >= 500 | summarize count() by resultCode gives the number of STORED ROWS, which is only accurate if sampling happens to be retaining 100% at that moment.',
        'This doesn\'t mean disabling sampling — Microsoft\'s own docs list ingestion sampling (dropping data at the point of ingestion) as "not recommended" precisely because it breaks distributed traces, but source-level fixed-rate or rate-limited sampling (the default, trace-aware kind) is designed to be safely correctable with itemCount. The fix belongs in how queries are written, not in turning sampling off.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking whether sampling is active right now',
      language: 'bash',
      code: `# Per Microsoft's own docs -- run this to see if any telemetry
# type is currently being sampled below 100%:
az monitor log-analytics query \\
  --workspace $LAWS_ID \\
  --analytics-query '
union requests,dependencies,pageViews,browserTimings,exceptions,traces
| where timestamp > ago(1d)
| summarize RetainedPercentage = 100/avg(itemCount) by bin(timestamp, 1h), itemType
'
# RetainedPercentage < 100 for any itemType means that signal is
# being sampled -- every count() query against that table for that
# time range is undercounting.`,
    },
    {
      label: 'Fixing the main page\'s own KQL examples',
      language: 'bash',
      code: `# The main page's own query, as written -- silently wrong under
# sampling:
az monitor log-analytics query --workspace $LAWS_ID --analytics-query '
requests
| where TimeGenerated > ago(1h)
| where resultCode >= 500
| summarize count() by resultCode, bin(TimeGenerated, 5m)
| order by TimeGenerated desc
'

# The corrected version -- accurate regardless of sampling rate:
az monitor log-analytics query --workspace $LAWS_ID --analytics-query '
requests
| where TimeGenerated > ago(1h)
| where resultCode >= 500
| summarize sum(itemCount) by resultCode, bin(TimeGenerated, 5m)
| order by TimeGenerated desc
'

# Same fix applies to the main page's exceptions-by-problemId query:
az monitor log-analytics query --workspace $LAWS_ID --analytics-query '
exceptions
| where TimeGenerated > ago(24h)
| summarize sum(itemCount), sample = any(outerMessage) by problemId
| order by sum_itemCount desc
| take 20
'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'During an incident, a dashboard built on the main page\'s own KQL pattern (summarize count() by resultCode) shows 12 HTTP 500 errors in the last 5 minutes. The on-call engineer treats this as a minor blip. What question should they ask before making that call, and how would they find the answer?',
    hint: 'Check whether Application Insights sampling could be active for this application, and what field would tell you the real number of failed requests versus the number of stored rows.',
    solution: 'Before treating 12 as the real number, the engineer should ask whether sampling is active for this application — and check with the RetainedPercentage query (union requests,... | summarize RetainedPercentage = 100/avg(itemCount) by bin(timestamp, 1h), itemType). If RetainedPercentage for requests is well below 100, the true failure count is much higher than 12 — re-running the dashboard query with sum(itemCount) instead of count() would reveal the actual, extrapolated total. A "minor blip" of 12 stored rows could represent a real incident of 60+ failures if sampling is retaining only 20% of telemetry.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A KQL query like requests | summarize count() by resultCode always returns the true number of requests that occurred, regardless of any Application Insights configuration.',
      reality: 'Per this subtopic\'s theory, when sampling is active (the default for any application generating meaningful telemetry volume), count() only returns the number of STORED rows — the true total requires summarize sum(itemCount), which accounts for how many real events each stored row represents.'
    },
    {
      thought: 'Application Insights sampling only affects cost — it has no effect on the accuracy of KQL query results you\'re not paying attention to cost for.',
      reality: 'Per this subtopic\'s theory, sampling directly changes what a plain count() means, since fewer rows are physically stored — this affects every count-based query and dashboard, independent of whether anyone is tracking ingestion cost.'
    },
    {
      thought: 'Metrics and Logs in Application Insights are both subject to the same sampling behavior, so the same itemCount correction applies to metric queries too.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly: "Metrics aren\'t sampled." The itemCount correction is specifically needed for log-based telemetry (requests, dependencies, exceptions, traces, custom events) — metric values are already accurate as stored.'
    }
  ];
}
