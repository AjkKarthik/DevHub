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
  templateUrl: './jaeger-no-longer-needs-the-otel-collector.html',
  styleUrl: './jaeger-no-longer-needs-the-otel-collector.scss'
})
export class JaegerNoLongerNeedsTheOtelCollectorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s only Jaeger setup shown always routes through a Collector — worth knowing that\'s no longer required',
      points: [
        'The main page\'s "Jaeger Docker Setup" code sample shows two options: a standalone Jaeger all-in-one container, and (commented out) a full docker-compose stack with an OTel Collector sitting in front of Jaeger. The page never mentions that, for straightforward setups, the Collector-in-front architecture is now OPTIONAL — Jaeger has been able to receive OTLP data DIRECTLY since version 1.35.',
        'This is a gap-closing addition, not a correction of anything wrong — the docker-compose example the page shows is a completely valid, still-common architecture. The gap is that it presents the Collector-fronted setup as if it were the only (or default) way to get traces into Jaeger.',
      ]
    },
    {
      heading: 'What changed in Jaeger 1.35 (May 2022)',
      points: [
        'Jaeger 1.35 added a native OTLP receiver directly to the Jaeger backend itself, accepting trace data via both gRPC (port 4317) and HTTP (port 4318) — the same standard OTLP ports the main page\'s own OTel Node.js SDK example already exports to.',
        'Before this, the standard path was: application (OTel SDK) → OTel Collector → Jaeger, with the Collector translating and forwarding the data. Since 1.35, the same OTel SDK can point its OTLP exporter\'s URL DIRECTLY at Jaeger\'s own OTLP endpoint, skipping the Collector entirely for the simplest case.',
        'Concretely, this means the main page\'s own OTel Node.js Setup code sample — which exports to \'http://otel-collector:4318/v1/traces\' — would work identically if pointed at \'http://jaeger:4318/v1/traces\' instead, with no Collector process running at all, for a single-backend setup.',
      ]
    },
    {
      heading: 'When the Collector is still genuinely worth deploying',
      points: [
        'The Collector earns its keep specifically when you need something IT does that Jaeger\'s direct OTLP receiver does not: fanning telemetry out to MULTIPLE backends at once (e.g. Jaeger for traces + a separate metrics backend), applying processors like the tail_sampling processor (the actual tail-sampling mechanism this hub\'s own sibling subtopic covers), batching/retry/buffering logic decoupled from the application process, or centralizing collector-side configuration across many services rather than pointing every service\'s SDK at a backend URL directly.',
        'For a small system with one backend (just Jaeger) and no need for Collector-side processing like tail sampling, direct OTLP-to-Jaeger is a genuinely simpler, one-fewer-moving-part architecture — worth defaulting to unless one of the Collector\'s specific capabilities is actually needed.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Direct-to-Jaeger vs. Collector-fronted setup',
      language: 'bash',
      code: `# OPTION A: Direct OTLP to Jaeger (no Collector) -- valid since Jaeger 1.35
docker run -d --name jaeger \\
  -e COLLECTOR_OTLP_ENABLED=true \\
  -p 16686:16686 \\
  -p 4317:4317 \\
  -p 4318:4318 \\
  jaegertracing/all-in-one:latest

# Application SDK points DIRECTLY at Jaeger's own OTLP endpoint:
# traceExporter: new OTLPTraceExporter({ url: 'http://jaeger:4318/v1/traces' })
# No Collector process needed for this simplest case.

# OPTION B: Collector-fronted (main page's own example) -- still valid,
# and worth it once you need fan-out to multiple backends, or
# Collector-side processing like the tail_sampling processor.
# Application -> OTel Collector -> Jaeger
# traceExporter: new OTLPTraceExporter({ url: 'http://otel-collector:4318/v1/traces' })

# Choose A for a single backend with no Collector-side processing needs.
# Choose B once you need multi-backend fan-out or Collector processors.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A small team is setting up tracing for the first time, sending traces from a single Node.js service to a single Jaeger instance — no other backends, no tail sampling needed yet. Following the main page\'s docker-compose example literally, they deploy an OTel Collector container in front of Jaeger. Is the Collector necessary for this specific setup?',
    hint: 'What does the Collector actually DO in this pipeline that Jaeger\'s own OTLP receiver (available since v1.35) could not do on its own for a single backend?',
    solution: 'No, the Collector is not necessary for this specific setup. Since Jaeger 1.35 (2022), Jaeger has its own native OTLP receiver that accepts trace data directly via gRPC (4317) or HTTP (4318) — the exact same protocol and ports the OTel SDK already exports to. For a single-backend setup with no need for Collector-side processing (fan-out to multiple backends, tail sampling, batching policies), the team could point their OTel SDK\'s traceExporter URL directly at Jaeger\'s own OTLP endpoint and skip running a separate Collector process entirely — one fewer component to deploy, configure, and operate for the same result in this simple case.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An OTel Collector is a required component that must always sit between an instrumented application and Jaeger.',
      reality: 'Per this subtopic\'s theory, Jaeger has accepted OTLP data directly since version 1.35 (2022) — for a single-backend setup with no need for Collector-side processing, an application\'s OTel SDK can export straight to Jaeger with no Collector process at all.'
    },
    {
      thought: 'Since the Collector is now optional for simple Jaeger setups, it has no real purpose and is safe to skip in every deployment.',
      reality: 'Per this subtopic\'s theory, the Collector still earns its place when you need multi-backend fan-out, Collector-side processors like tail_sampling, or centralized batching/retry logic decoupled from each service — genuinely useful capabilities Jaeger\'s own direct OTLP receiver does not provide.'
    },
    {
      thought: 'Jaeger\'s native OTLP support is a recent, unstable, or experimental addition not yet suitable for production use.',
      reality: 'Per this subtopic\'s theory, this capability shipped in Jaeger 1.35 back in May 2022 — it has been a stable, documented part of Jaeger for years, not a new or experimental feature.'
    }
  ];
}
