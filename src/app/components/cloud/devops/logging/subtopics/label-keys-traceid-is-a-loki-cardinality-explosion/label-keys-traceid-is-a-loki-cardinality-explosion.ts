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
  templateUrl: './label-keys-traceid-is-a-loki-cardinality-explosion.html',
  styleUrl: './label-keys-traceid-is-a-loki-cardinality-explosion.scss'
})
export class LabelKeysTraceidIsALokiCardinalityExplosionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Loki output plugin promotes traceId into a label, exactly the kind of value the hub\'s own Prometheus page already warned against',
      points: [
        'The main page\'s own Fluent Bit "OUTPUT" block for Loki sets `Label_Keys level,traceId` alongside `Labels Job=fluentbit,namespace=...,app=...`. The comment context frames this purely as routine configuration — extracting fields from the log record into Loki labels — with no flag that `traceId` specifically is a risky choice.',
        'This hub\'s own separately-published Monitoring & Alerting page already establishes the general principle for Prometheus: "High cardinality is dangerous... each unique label combination creates a separate time-series." Loki has a directly analogous concern for exactly the same underlying reason (it also INDEXES its labels, just not log content) — but the main page\'s own Logging tab never draws this connection, and `traceId` is precisely the kind of per-request-unique value the parallel Prometheus guidance already warns against.',
      ]
    },
    {
      heading: 'Loki\'s own documentation names trace IDs specifically as a value that should never be a label',
      points: [
        'Loki\'s own label best-practices documentation is explicit: "Do not use labels for high-cardinality values: pod, instance IDs, request IDs, user IDs, trace IDs, HTTP status codes, IP addresses. Each unique value creates a new stream, causing \'cardinality explosion\' that degrades ingestion and query performance." `traceId` — exactly the field the main page\'s own `Label_Keys` line promotes — is named directly in Loki\'s own list of values to avoid.',
        'Loki\'s own docs explain the mechanism: every unique label VALUE creates a genuinely separate log stream, each with its own index entry and small, separately-flushed chunks in object storage. A `traceId` label, being different on essentially every single request, would create one new Loki stream PER REQUEST — the same failure mode Prometheus suffers from a `user_id` label, just manifesting as index bloat and tiny fragmented chunks rather than exhausted metric time-series memory.',
        'Loki\'s own documentation names the correct tool for exactly this situation: "Structured metadata is a feature in Loki... that allows customers to store metadata that is too high cardinality for log lines, without needing to embed that information in log lines themselves... a great home for metadata which is not easily embeddable in a log line, but is too high cardinality to be used effectively as a label." A trace ID belongs in structured metadata (or simply left inside the parsed JSON log content, queryable via `| json`), never promoted to a Loki label.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the main page\'s own Label_Keys line actually does at scale',
      language: 'bash',
      code: `# The main page's own OUTPUT block:
# [OUTPUT]
#     Name            loki
#     Match           kube.*
#     Host            loki.logging.svc.cluster.local
#     Port            3100
#     Labels          job=fluentbit,namespace=\$kubernetes['namespace_name'],app=\$kubernetes['labels']['app']
#     Label_Keys      level,traceId          # <-- promotes these
#                                             #     FIELDS from the
#                                             #     log record into
#                                             #     Loki LABELS
#     Auto_Kubernetes_Labels on

# "level" is safe -- a small, finite set of values (info, warn,
# error, debug). A handful of streams, no problem.

# "traceId" is a UNIQUE VALUE PER REQUEST. At even a modest
# 100 requests/second across a service, this single Label_Keys
# entry creates roughly 100 NEW Loki streams every second --
# per Loki's own docs, "Each unique value creates a new stream,
# causing 'cardinality explosion' that degrades ingestion and
# query performance." This isn't a slow degradation over months --
# it's an immediate, ongoing structural problem from the moment
# this config is deployed.`,
    },
    {
      label: 'The fix -- leave traceId in the log content, query it with | json instead',
      language: 'bash',
      code: `# [OUTPUT]
#     Name            loki
#     Match           kube.*
#     Host            loki.logging.svc.cluster.local
#     Port            3100
#     Labels          job=fluentbit,namespace=\$kubernetes['namespace_name'],app=\$kubernetes['labels']['app']
#     Label_Keys      level                  # traceId removed --
#                                             # only the safe,
#                                             # low-cardinality field
#                                             # stays as a label
#     Auto_Kubernetes_Labels on

# traceId is still fully searchable -- it just lives in the log
# CONTENT (already there, since Merge_Log parses the app's own
# JSON output), queried via LogQL's | json parser rather than as
# an indexed label:

# {app="myapp", namespace="production"} | json | traceId="abc-123-def"

# This is exactly the pattern the main page's own separate LogQL
# example already demonstrates elsewhere in the same code tab
# ({app="myapp"} | json | durationMs > 1000 | line_format ...) --
# just never connected back to why traceId specifically should be
# queried this way rather than promoted to a label in the first
# place.

# For genuinely high-volume trace correlation needs beyond what
# | json filtering handles well, Loki's own docs point to
# structured metadata as the purpose-built alternative.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team deploys the main page\'s own Fluent Bit + Loki config exactly as shown, including `Label_Keys level,traceId`. Within days, Loki\'s ingestion latency degrades noticeably and object storage costs spike far beyond what the team\'s log VOLUME would suggest. Using this subtopic\'s theory, explain the likely root cause and the fix, without assuming the team\'s log volume itself increased.',
    hint: 'Per this subtopic\'s theory, does promoting a per-request-unique field like traceId into a Loki label change how much LOG DATA is being sent, or something else about how that same data gets stored and indexed?',
    solution: 'The root cause, per this subtopic\'s theory, is almost certainly the `traceId` entry in `Label_Keys` — Loki\'s own docs state directly that trace IDs are one of the specific values that should never be used as labels, because "each unique value creates a new stream, causing \'cardinality explosion\' that degrades ingestion and query performance." This explains the symptom precisely: the team\'s actual log VOLUME may be completely unchanged, but promoting traceId to a label means every single request\'s logs now form their OWN separate Loki stream, each with its own index entry and its own small, separately-flushed chunk in object storage — vastly more index overhead and far more tiny objects in storage than the same log volume would produce under a low-cardinality label scheme. The fix is removing `traceId` from `Label_Keys` (leaving only genuinely low-cardinality fields like `level`) and relying on `| json` filtering in LogQL queries to search by traceId within the log content instead, exactly as the main page\'s own separate LogQL examples already demonstrate for other fields like `durationMs`.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Loki\'s Label_Keys option is meant for extracting any useful field from a log record into a label — traceId is a natural, useful field, so it\'s a reasonable choice to include.',
      reality: 'Per this subtopic\'s theory, Loki\'s own docs specifically list trace IDs among the values that should NEVER be used as labels, precisely because "useful for searching" and "safe as a label" are different properties — a field can be extremely useful to query while being catastrophic for Loki\'s label-based indexing if its cardinality is high.'
    },
    {
      thought: 'Since Loki only indexes labels, not log content, promoting a field to a label is strictly an IMPROVEMENT for query performance on that field — more indexing should mean faster queries.',
      reality: 'This subtopic\'s theory shows the opposite is true for high-cardinality fields — per Loki\'s own docs, a high-cardinality label creates "a huge index" and "thousands of tiny chunks," which DEGRADES both ingestion and query performance rather than improving it. Fields like traceId remain fully queryable via `| json` filtering on log content, without paying this cost.'
    },
    {
      thought: 'A Loki cardinality problem would show up primarily as a log-VOLUME or storage-SIZE increase, proportional to how much log data is actually being sent.',
      reality: 'Per this subtopic\'s exercise, the actual symptom is disproportionate to log volume — the same amount of underlying log data produces vastly more index overhead and many more small, fragmented storage objects once cardinality explodes, meaning the team\'s costs and performance can degrade sharply even with no change in how much they\'re actually logging.'
    }
  ];
}
