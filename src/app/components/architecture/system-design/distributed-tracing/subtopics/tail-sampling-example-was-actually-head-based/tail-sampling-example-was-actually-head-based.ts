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
  templateUrl: './tail-sampling-example-was-actually-head-based.html',
  styleUrl: './tail-sampling-example-was-actually-head-based.scss'
})
export class TailSamplingExampleWasActuallyHeadBasedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A code sample whose own inline comment already contradicted its header comment',
      points: [
        'The main page\'s "100% sampling in high-traffic production" mistake block originally headed its fixed code with the comment "// Tail-based sampling: keep 1% of normal + 100% of errors/slow" — but the very next line of the SAME code sample comments itself "// 1% head sample." The header comment and the inline comment directly beneath it disagreed about what kind of sampling the shown code actually does. The page has been corrected.',
        'This is catchable with zero external research — just reading the two comments in the same code block against each other. Confirming which label was actually CORRECT required checking OpenTelemetry\'s own terminology.',
      ]
    },
    {
      heading: 'What the shown code actually is — and what it is not',
      points: [
        'ParentBasedSampler wrapping a TraceIdRatioBased sampler is, per OpenTelemetry\'s own documentation, a canonical HEAD-based sampler — the decision to keep or drop a trace is made at the moment the trace starts, using a deterministic hash of the trace ID against a probability threshold (0.01 = 1%), before any downstream spans exist or any outcome (error, slow response) is known.',
        'TAIL-based sampling is a genuinely different mechanism: it means buffering ALL spans of a trace until the entire trace completes, THEN deciding whether to keep it — specifically so that decision can depend on the outcome (was there an error? was it slow?), which a head-based sampler cannot see yet at decision time.',
        'The main page\'s code sample only shows the HEAD-based half of its own stated strategy (the SDK-level 1% baseline sampler) — the tail-based half (keeping 100% of errors/slow traces) is only ever mentioned in a single trailing comment about the OTel Collector\'s tail_sampling processor, with no actual configuration shown for it.',
      ]
    },
    {
      heading: 'Why this distinction is genuinely useful, not just terminology pedantry',
      points: [
        'The two techniques run in DIFFERENT places and are configured DIFFERENTLY: the head-based sampler (TraceIdRatioBased) is set in the APPLICATION\'S OWN SDK initialization code (as the main page\'s sample correctly shows) and takes effect before any span is even created. The tail-based piece (tail_sampling processor) is configured entirely in the OTel COLLECTOR\'s own pipeline config — a separate YAML file, a separate process, with no code in the instrumented application at all.',
        'A team implementing "the main page\'s example" literally, without understanding this split, might reasonably expect the single sampler object shown in the code to somehow ALSO capture 100% of errors — it cannot; that guarantee only comes from a Collector-side tail_sampling processor that the code sample never actually configures.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Head sampling (SDK) vs. tail sampling (Collector)',
      language: 'typescript',
      code: `// HEAD-based: decided in the application's own SDK init code,
// before any span exists, using only the trace ID
const sampler = new ParentBasedSampler({
  root: new TraceIdRatioBased(0.01),  // keep 1% of traces, decided at trace start
});
// This alone does NOT guarantee errors/slow traces are kept --
// a trace that turns out to be an error still has only a 1%
// chance of being sampled by this sampler on its own.`,
    },
    {
      label: 'The actual tail-sampling half (Collector config)',
      language: 'bash',
      code: `# otel-collector-config.yaml -- a SEPARATE config, a separate
# process from the application's own SDK sampler above

processors:
  tail_sampling:
    decision_wait: 10s   # buffer spans this long before deciding
    policies:
      - name: keep-errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: keep-slow
        type: latency
        latency: { threshold_ms: 1000 }
      - name: baseline-sample
        type: probabilistic
        probabilistic: { sampling_percentage: 1 }

service:
  pipelines:
    traces:
      processors: [tail_sampling]

# This is what actually guarantees "100% of errors/slow" are kept --
# it requires the FULL trace to arrive at the Collector before
# deciding, which is what makes it "tail" (end-of-trace) sampling.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer copies the main page\'s ParentBasedSampler/TraceIdRatioBased code into their application, deploys it, and later notices that a request which returned a 500 error was NOT captured in their tracing backend. They assumed the sampler\'s comment ("keep 1% of normal + 100% of errors/slow") meant this error would automatically be kept. What did they misunderstand?',
    hint: 'At the moment TraceIdRatioBased makes its sampling decision (trace start), does it yet know whether the request will end in an error?',
    solution: 'The ParentBasedSampler/TraceIdRatioBased sampler is a HEAD-based sampler — it makes its keep-or-drop decision at the very start of the trace, using only the trace ID, before the request has even been processed and long before anyone knows it will end in a 500 error. It has no mechanism to "look ahead" and guarantee errors are kept; it just applies its 1% probability uniformly to every trace, error or not. The "100% of errors/slow" guarantee requires a SEPARATE mechanism — a tail_sampling processor configured in the OTel Collector, which buffers the complete trace and only THEN decides based on the actual outcome. The developer needed to deploy and configure that Collector-side processor as well; the SDK-level sampler code alone was never going to provide the errors guarantee on its own.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A single sampler object like ParentBasedSampler/TraceIdRatioBased can implement both head-based baseline sampling AND guarantee all errors/slow traces are kept.',
      reality: 'Per this subtopic\'s theory, TraceIdRatioBased is exclusively a head-based sampler — it decides before the trace\'s outcome is known. Guaranteeing errors/slow traces are kept requires a genuinely separate tail-based mechanism (the Collector\'s tail_sampling processor).'
    },
    {
      thought: '"Tail-based sampling" and "head-based sampling with a low probability" are just two names for the same underlying technique.',
      reality: 'Per this subtopic\'s theory, they are mechanically different: head-based sampling decides at trace START using only the trace ID (no outcome visibility); tail-based sampling buffers the COMPLETE trace and decides at trace END, specifically so the decision can depend on the outcome.'
    },
    {
      thought: 'The head-based sampler (SDK) and the tail-based processor (Collector) are configured in the same place, just different settings on the same object.',
      reality: 'Per this subtopic\'s theory, they live in genuinely different components — the head sampler is application-side SDK initialization code; the tail_sampling processor is a separate OTel Collector pipeline configuration (its own process, its own YAML) — deploying one does not automatically configure the other.'
    }
  ];
}
