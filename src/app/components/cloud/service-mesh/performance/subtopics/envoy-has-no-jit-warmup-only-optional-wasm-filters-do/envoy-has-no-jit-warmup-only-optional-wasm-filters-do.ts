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
  templateUrl: './envoy-has-no-jit-warmup-only-optional-wasm-filters-do.html',
  styleUrl: './envoy-has-no-jit-warmup-only-optional-wasm-filters-do.scss'
})
export class EnvoyHasNoJitWarmupOnlyOptionalWasmFiltersDoSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A fabricated technical detail caught during this batch',
      points: [
        'The main page originally claimed: "at high concurrency, fresh Envoy instances spend 30-60s warming up JIT-compiled filters." Verified against how Envoy is actually built and runs, this specific mechanism does not exist for Envoy\'s standard filter chain at all — there is no JIT compilation step for a fresh Envoy instance to "warm up" from. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: Envoy\'s standard filters are natively-compiled C++, with no runtime JIT step',
      points: [
        'Envoy is a C++ binary. Its standard filters (HTTP router, TLS transport socket, health checking, etc. — everything a typical Istio sidecar uses out of the box) are compiled AHEAD OF TIME into the Envoy binary itself. There is no just-in-time compilation happening when a fresh Envoy process starts — the machine code for these filters already exists the moment the binary is built, long before any specific pod runs it.',
        'The ONE place anything JIT-like genuinely exists in Envoy\'s architecture is the OPTIONAL WebAssembly (WASM) extensibility mechanism — WASM filters run inside a runtime (V8, Wasmtime, or WAMR) that CAN JIT-compile WASM bytecode. This is a niche, opt-in feature for custom extensions, not something every "fresh Envoy instance" universally does — the vast majority of Istio sidecars never load a single WASM filter.',
      ]
    },
    {
      heading: 'What actually causes the real, genuine warmup effect the main page correctly points at',
      points: [
        'The real reasons a freshly-started Envoy instance performs worse initially than a warm one: empty upstream connection pools (the first requests to each backend pay a fresh TCP+TLS handshake cost instead of reusing an existing connection), cold DNS resolution caches, and the proxy simply not yet having received its full xDS configuration from Istiod (a brand-new pod\'s Envoy may still be receiving CDS/EDS/LDS/RDS pushes for the first few seconds).',
        'This is exactly why `warmupDurationSecs` (slow-start, ramping traffic to a new pod gradually) is a genuinely useful, real mitigation — but the MECHANISM it\'s mitigating is connection-pool/cache coldness and configuration propagation delay, not any JIT compilation process. Attributing the warmup need to "JIT-compiled filters" would lead someone investigating a slow pod-start incident to look in entirely the wrong place (searching for JIT/WASM compilation logs that don\'t exist) instead of the real, verifiable causes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What is NOT happening: no JIT compilation log/metric exists for this',
      language: 'bash',
      code: `# Searching for "JIT" in Envoy's own stats or logs for a
# freshly-started, STANDARD (non-WASM) sidecar returns nothing --
# because there is no such mechanism to find:
kubectl exec deploy/api -c istio-proxy -- \\
  curl -s localhost:15000/stats | grep -i jit
# (empty output for a standard filter chain)

# Envoy's filters are already machine code inside the binary --
# there's no "compile this filter now" step to warm up from.`,
    },
    {
      label: 'What IS actually happening: connection pool + config propagation, observable directly',
      language: 'bash',
      code: `# The REAL warmup signal: connection pool state building up
# over the pod's first several seconds of real traffic
kubectl exec deploy/api -c istio-proxy -- \\
  curl -s localhost:15000/clusters | grep cx_active
# cx_active starts near 0 on a fresh pod and climbs as real
# connections get established and reused

# Confirm xDS config propagation is complete (a genuinely
# real source of "not fully warmed up yet" behavior):
istioctl proxy-config listener deploy/api | wc -l
istioctl proxy-config cluster deploy/api | wc -l
# Compare against a known-warm sibling pod's counts --
# a mismatch here (not a JIT log) is the real diagnostic signal.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s original (now-corrected) claim, an engineer investigating why a freshly-scaled pod shows elevated p99 latency for its first 30 seconds searches Envoy\'s stats and logs for anything related to "JIT compilation" or filter warmup, expecting to find a metric confirming this is the cause. They find nothing matching. What should they actually be checking instead, and why does the JIT search come up empty?',
    hint: 'Does Envoy\'s STANDARD (non-WASM) filter chain involve any runtime JIT compilation step at all — and if the elevated latency is real, what\'s the actual, verifiable mechanism behind it?',
    solution: 'The JIT search comes up empty because Envoy\'s standard filter chain (the HTTP router, TLS, health checking, etc. that a typical Istio sidecar uses) is natively-compiled C++ code with no runtime JIT compilation step at all — this mechanism simply does not exist to search for, unless the sidecar specifically loads a custom WASM filter (a niche, opt-in case). The engineer should instead check connection pool state (cx_active climbing from near-zero as real backend connections get established) and confirm the pod\'s xDS configuration (listeners, clusters, routes via istioctl proxy-config) has fully propagated from Istiod — both are genuine, observable causes of elevated latency on a fresh pod, and both are exactly what warmupDurationSecs\'s slow-start mechanism is designed to mitigate.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Fresh Envoy instances need 30-60 seconds to "warm up" because their filters are JIT-compiled at startup, similar to how some managed-runtime languages (Java, JavaScript engines) JIT-compile hot code paths.',
      reality: 'Per this subtopic\'s theory (a fabricated technical detail caught and corrected on the main page during this batch), Envoy\'s standard filter chain is natively-compiled C++ with no runtime JIT step at all — this specific mechanism does not exist for a typical Istio sidecar.'
    },
    {
      thought: 'Since WASM is one of Envoy\'s extensibility mechanisms and involves JIT compilation, this JIT behavior applies broadly to "fresh Envoy instances" in general, including standard (non-WASM) sidecars.',
      reality: 'Per this subtopic\'s theory, WASM-related JIT compilation only applies to sidecars that specifically load a custom WASM filter — a niche, opt-in case, not a universal property of every fresh Envoy instance.'
    },
    {
      thought: 'The genuine, real "warmup" performance effect on fresh Envoy pods (which warmupDurationSecs helps mitigate) doesn\'t have a specific, verifiable cause worth investigating — it\'s just an unavoidable startup cost.',
      reality: 'Per this subtopic\'s theory, the real warmup effect has concrete, observable causes — empty connection pools, cold DNS caches, and incomplete xDS configuration propagation — all independently verifiable via Envoy\'s own stats and istioctl, not a vague, unexplainable startup tax.'
    }
  ];
}
