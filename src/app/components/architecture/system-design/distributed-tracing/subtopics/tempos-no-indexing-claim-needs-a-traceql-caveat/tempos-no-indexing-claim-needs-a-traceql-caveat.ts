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
  templateUrl: './tempos-no-indexing-claim-needs-a-traceql-caveat.html',
  styleUrl: './tempos-no-indexing-claim-needs-a-traceql-caveat.scss'
})
export class TemposNoIndexingClaimNeedsATraceqlCaveatSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A true claim that could read as "you can only look up traces by ID"',
      points: [
        'The main page\'s QnA describes Grafana Tempo as "best for high-scale (no indexing — trace IDs stored in object store like S3)." This is accurate — Tempo genuinely does not maintain the kind of comprehensive attribute index that Jaeger and Zipkin build. What the page never mentions is HOW you actually find a trace in Tempo if you do not already have its trace ID, which "no indexing" alone leaves unclear.',
        'This gap-closing addition names Tempo\'s own answer to that question: TraceQL, a purpose-built query language that searches traces WITHOUT requiring the kind of full index the "no indexing" framing might suggest is simply unavailable.',
      ]
    },
    {
      heading: 'How TraceQL searches without a traditional index',
      points: [
        'Tempo\'s architecture uses selective structures — bloom filters and lightweight per-block indexes — stored alongside the compressed trace data in object storage, rather than a comprehensive, queryable index of every span attribute the way Jaeger\'s backend maintains.',
        'A TraceQL query is executed by Tempo\'s querier component, which uses those bloom filters to narrow down which object-storage blocks are even worth scanning, then reads and filters the actual trace data from within those narrowed-down blocks — a fundamentally different, more storage-cost-efficient approach than a fully indexed system, but still enabling real attribute-based search (not just exact trace-ID lookup).',
        'The tradeoff this reveals: Tempo\'s search is generally slower and more resource-intensive per query than an equivalent search against a fully-indexed backend like Jaeger, since it has to scan storage blocks rather than consult a pre-built index — the "no indexing" design is what keeps STORAGE costs low, at the cost of QUERY-time work that a real index would have avoided.',
      ]
    },
    {
      heading: 'Why this matters for the choice the main page\'s QnA is actually helping with',
      points: [
        'A team reading "no indexing" without the TraceQL context might assume Tempo requires an exemplar or a trace ID from a log line before you can find anything at all — ruling it out for exploratory, attribute-based debugging ("find all traces where http.status_code >= 500 and user.id = 42"). TraceQL makes that kind of query genuinely possible in Tempo, just implemented differently (and with different performance characteristics) than Jaeger\'s indexed search.',
        'The right way to frame the choice, with this addition: Tempo trades SEARCH SPEED for dramatically lower STORAGE cost at scale (no index to maintain across potentially billions of spans); Jaeger trades higher storage/indexing cost for faster attribute search. Both support attribute-based search — the main page\'s original framing could read as though only one of them does.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A TraceQL query example',
      language: 'bash',
      code: `# TraceQL: attribute-based search in Tempo, without a full index

# Find traces where a specific span had an HTTP error and slow duration
{ span.http.status_code >= 500 && duration > 1s }

# Find traces for a specific user hitting a specific service
{ span.service.name = "payment-service" && span.user.id = "42" }

# Under the hood: Tempo's querier uses bloom filters to narrow
# which object-storage blocks might contain matching traces, then
# scans and filters within just those blocks -- not a full index
# lookup, but not "trace-ID-only" either.

# Contrast: a Jaeger search for the same query hits a real,
# comprehensive index built ahead of time -- generally faster per
# query, at the cost of maintaining that index for every span.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team reads "Tempo has no indexing" and concludes they can only look up a trace in Tempo if they already know its exact trace ID from a log line or metric exemplar — ruling Tempo out for open-ended debugging like "show me all slow checkout requests from the last hour." Is that conclusion accurate?',
    hint: 'Does Tempo\'s "no indexing" design mean NO attribute-based search is possible, or does it mean attribute-based search works through a DIFFERENT mechanism than a traditional index?',
    solution: 'Not accurate. "No indexing" describes Tempo\'s STORAGE architecture (no comprehensive attribute index maintained ahead of time, keeping storage costs low) — it does not mean attribute-based search is impossible. Tempo\'s TraceQL query language supports exactly the kind of open-ended query described ({ span.service.name = "checkout" && duration > 1s }), executed by scanning object-storage blocks narrowed down via bloom filters rather than consulting a pre-built index. The real tradeoff is query SPEED and resource cost per search (generally slower than an indexed system like Jaeger for the same query), not whether attribute-based search is possible at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Tempo has no indexing" means you can only retrieve a trace from Tempo if you already know its exact trace ID.',
      reality: 'Per this subtopic\'s theory, Tempo\'s TraceQL query language supports real attribute-based search (by service name, status code, duration, custom attributes) — "no indexing" describes the storage architecture\'s cost tradeoff, not a hard limitation on what queries are possible.'
    },
    {
      thought: 'Since TraceQL enables attribute-based search, Tempo\'s search performance is now equivalent to a fully-indexed system like Jaeger.',
      reality: 'Per this subtopic\'s theory, TraceQL queries generally require scanning object-storage blocks (narrowed via bloom filters) rather than consulting a pre-built comprehensive index — this is genuinely slower and more resource-intensive per query than an indexed backend, even though both now support similar query types.'
    },
    {
      thought: 'Choosing between Tempo and Jaeger is purely about scale (Tempo for high-scale, Jaeger for smaller setups) with no other tradeoff worth considering.',
      reality: 'Per this subtopic\'s theory, the real tradeoff spans both storage cost AND query performance — Tempo\'s no-index design keeps storage cheap at high span volumes but costs more per search; Jaeger\'s indexed design costs more to maintain at scale but searches faster — worth weighing both dimensions, not just raw traffic volume.'
    }
  ];
}
