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
  templateUrl: './three-different-latency-figures-reconciled.html',
  styleUrl: './three-different-latency-figures-reconciled.scss'
})
export class ThreeDifferentLatencyFiguresReconciledSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The same page stated three different overhead figures',
      points: [
        'The theory section\'s "What the Mesh Gives You" bullet originally said: "~10ms latency overhead per hop." The "Enabling the mesh without understanding latency impact" mistake block said: "Sidecar proxies add ~10–30ms per hop." The quiz\'s own explanation for a dedicated overhead question said: "typical overhead of 1-5ms latency... per sidecar." Three sections, three different numbers, for the exact same underlying fact.',
        'This is a purely self-contained catch requiring no external verification to SPOT — three numbers on one page describing one thing don\'t need to be individually fact-checked to notice they disagree with each other. Verification was only needed to figure out which one (if any) was actually closest to reality.',
      ]
    },
    {
      heading: 'Which figure was closest, and why the others were likely stale',
      points: [
        'Verified via WebSearch against Istio\'s own published benchmark results across versions: Istio 1.1 added ~8ms at p90, but by Istio 1.6 that dropped to ~3.12ms, and by Istio 1.16 to ~2.65ms — the project has actively optimized sidecar overhead release over release. Modern benchmarks land in the LOW SINGLE-DIGIT millisecond range at p50/p90, closest to the quiz\'s "1-5ms" figure — not the theory\'s "~10ms" or the mistakes block\'s "~10-30ms."',
        'The "~10-30ms" figure most likely reflects EARLIER Istio versions, or a worst-case/tail-latency framing being presented as if it were the typical case — Istio\'s own docs note that p99+ tail latency runs meaningfully higher than the median due to occasional proxy GC pauses and TLS session renegotiation, which is a real, separate phenomenon from "typical per-hop overhead."',
        'The page has been corrected to state the overhead consistently across all three sections: commonly a few milliseconds at p50/p90 on modern Istio, with tail latencies running higher — accurate, and honest about WHY the number varies rather than pretending there\'s one fixed constant.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What "typical overhead" actually depends on',
      language: 'bash',
      code: `# Istio's own published benchmark trend (p90 added latency, per hop):
#   Istio 1.1   ~8.00ms
#   Istio 1.6   ~3.12ms
#   Istio 1.16  ~2.65ms
#
# The trend: sidecar overhead has been actively optimized DOWN across
# releases -- a figure quoted without a version/percentile attached is
# almost certainly stale, optimistic, or pessimistic by default.

# What actually moves the number for a given deployment:
#   - Istio/Envoy version (newer = generally lower overhead)
#   - Percentile measured (p50 vs p90 vs p99 -- tail latency is always
#     higher due to occasional GC pauses / TLS renegotiation)
#   - Whether mTLS is enabled (encryption adds CPU cost)
#   - Node/pod resource contention (CPU throttling inflates proxy latency)
#
# A defensible modern claim: "commonly a few ms at p50/p90 on recent
# Istio versions, with p99+ tail latency running higher" -- not a single
# fixed number presented without a version or percentile attached.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate cites "Istio adds 10-30ms of latency per hop" while evaluating whether to adopt a service mesh for a latency-sensitive API with a 15ms p99 budget per downstream call. Should this figure, as stated, be trusted for the decision?',
    hint: 'What\'s missing from the claim that would be needed to actually compare it against a specific SLO budget?',
    solution: 'Not as stated -- the figure is missing the two things that determine whether it applies: which Istio version, and which percentile. Modern Istio versions (1.16+) measure closer to 1-5ms at p50/p90 in published benchmarks, meaningfully under the stated "10-30ms." If the team is evaluating a CURRENT Istio version, citing an unqualified "10-30ms" figure risks rejecting mesh adoption over a number that may not reflect the actual, current overhead -- the right move is benchmarking the SPECIFIC version and percentile that matters for their SLO, not trusting an unattributed range.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Service mesh sidecar latency overhead is a single, fixed number that applies the same way across any Istio version or deployment.',
      reality: 'Per this subtopic\'s theory, Istio\'s own published benchmarks show the figure has dropped substantially release over release (from ~8ms to ~2.65ms at p90 across three major versions) — a number without a version attached is not a stable fact.'
    },
    {
      thought: 'If three different sections of the same reference page each state a number for the same fact, the safest bet is to trust the middle value as a reasonable compromise.',
      reality: 'Per this subtopic\'s theory, the right response to three disagreeing numbers is to verify which is actually correct, not to average them — the corrected figure (a few ms at p50/p90) was closest to the LOWEST of the three original numbers, not a middle ground.'
    },
    {
      thought: 'Tail latency (p99+) and typical/median latency are basically interchangeable ways of describing "the overhead."',
      reality: 'Per this subtopic\'s theory, they are genuinely different measurements — p99+ latency runs meaningfully higher than p50/p90 due to occasional proxy GC pauses and TLS renegotiation, so a tail-latency figure presented as "typical" overstates the common case.'
    }
  ];
}
