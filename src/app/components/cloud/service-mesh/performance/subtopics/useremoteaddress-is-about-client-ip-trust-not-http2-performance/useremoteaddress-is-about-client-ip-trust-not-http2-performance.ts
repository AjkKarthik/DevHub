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
  templateUrl: './useremoteaddress-is-about-client-ip-trust-not-http2-performance.html',
  styleUrl: './useremoteaddress-is-about-client-ip-trust-not-http2-performance.scss'
})
export class UseRemoteAddressIsAboutClientIpTrustNotHttp2PerformanceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine field mixup caught during this batch',
      points: [
        'The main page originally listed `meshConfig.defaultConfig.useRemoteAddress: true` alongside H2C as an "HTTP/2 multiplexing" performance lever — implying it helps reduce connection overhead. Verified directly against Envoy\'s own HTTP connection manager documentation, this field has nothing to do with HTTP/2, multiplexing, or connection overhead at all. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: useRemoteAddress controls client-IP TRUST, not performance',
      points: [
        'Per Envoy\'s own docs: "if set to true, the connection manager will use the real remote address of the client connection... If set to false or absent, the connection manager will use the x-forwarded-for HTTP header" for determining internal-vs-external origin and for header manipulation. This is entirely about WHICH client identity Envoy trusts and forwards downstream — a correctness/security setting, not a throughput or latency lever.',
        'Envoy\'s own deployment guidance is explicit about WHERE this setting matters: "use_remote_address should be set to true when Envoy is deployed as an edge node (a front proxy)... it may need to be set to false when Envoy is used as an INTERNAL SERVICE NODE in a mesh deployment" — meaning the correct value is actually the OPPOSITE for most Istio sidecars (internal, mesh-internal proxies) versus an ingress/edge gateway.',
      ]
    },
    {
      heading: 'Why conflating a security setting with a performance setting is a real risk, not just an inaccuracy',
      points: [
        'A team tuning for "HTTP/2 performance" who flips `useRemoteAddress` to `true` on INTERNAL sidecars (following the main page\'s original, incorrect framing) would actually be making a security-relevant change with zero throughput benefit — internal sidecars trusting the raw connection address instead of a properly-chained X-Forwarded-For can produce incorrect client-IP attribution in logs and any IP-based access control, while doing nothing for HTTP/2 connection reuse.',
        'The actual HTTP/2 performance lever the main page\'s section is really about is H2C itself (enabled by default between Istio sidecars) — `useRemoteAddress` should be evaluated purely on its own merits (edge vs. internal deployment, XFF trust chain) as a completely separate decision.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What NOT to do: tuning useRemoteAddress for "performance"',
      language: 'bash',
      code: `# WRONG mental model: "this helps HTTP/2 multiplexing"
meshConfig:
  defaultConfig:
    useRemoteAddress: true   # <- does nothing for connection
                               #    reuse or multiplexing at all
# The REAL HTTP/2 performance lever is H2C, already enabled
# by default between Istio sidecars -- no action needed here
# for connection-overhead purposes.`,
    },
    {
      label: 'The correct question to ask about useRemoteAddress: edge vs. internal',
      language: 'bash',
      code: `# For an EDGE/ingress gateway receiving traffic directly
# from untrusted external clients:
meshConfig:
  defaultConfig:
    useRemoteAddress: true    # trust the actual TCP connection's
                                # source address (correct at the edge)

# For an INTERNAL sidecar receiving traffic that already passed
# through an upstream proxy (which correctly appended to XFF):
meshConfig:
  defaultConfig:
    useRemoteAddress: false   # (or omit -- this is the default)
                                # trust the XFF chain instead,
                                # preserving the ORIGINAL client IP
                                # rather than overwriting it with
                                # the immediate upstream sidecar's own`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants to reduce HTTP/2 connection overhead mesh-wide and, based on the main page\'s original (now-corrected) guidance, sets useRemoteAddress: true on every sidecar\'s meshConfig.defaultConfig. Their connection-pool metrics show no measurable change in connection reuse or latency. Meanwhile, their access logs now show every internal hop\'s client IP as the immediately-upstream sidecar\'s own address, rather than the original caller\'s IP. What actually happened, and what should they have tuned instead for HTTP/2 performance?',
    hint: 'Does useRemoteAddress affect connection pooling/multiplexing at all, or does it affect something else entirely — and what does setting it to true on an INTERNAL sidecar actually change?',
    solution: 'useRemoteAddress never affected HTTP/2 connection overhead at all — it controls whether Envoy trusts the raw downstream connection\'s address (true) or the X-Forwarded-For header chain (false, the default) for client-identity purposes. Setting it to true on internal sidecars caused each hop to overwrite the client-IP information with its own immediate upstream\'s address instead of preserving the original caller\'s IP through the XFF chain — exactly the access-log symptom observed, and a real correctness regression, not a performance win. For genuine HTTP/2 performance, the team should instead confirm H2C is active (already the Istio sidecar default) and focus on connection pool sizing (http2MaxRequests) rather than touching useRemoteAddress, which should be reverted to false (or omitted) for internal sidecars.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'meshConfig.defaultConfig.useRemoteAddress: true is a performance tuning setting that reduces HTTP/2 connection overhead, similar to enabling H2C.',
      reality: 'Per this subtopic\'s theory (a genuine field mixup caught and corrected on the main page during this batch), useRemoteAddress has nothing to do with HTTP/2 or connection overhead — it controls whether Envoy trusts the raw connection address or the X-Forwarded-For header for client-identity purposes.'
    },
    {
      thought: 'Since useRemoteAddress: true is a reasonable default to apply mesh-wide for consistency, the same value should be used on both edge gateways and internal sidecars.',
      reality: 'Per this subtopic\'s theory, Envoy\'s own deployment guidance recommends OPPOSITE values for these two cases — true for edge/front proxies handling untrusted external clients, false (the default) for internal mesh sidecars that should trust the existing XFF chain instead.'
    },
    {
      thought: 'Setting useRemoteAddress to true on an internal sidecar is a low-risk, purely-additive change with no real downside even if it doesn\'t help performance.',
      reality: 'Per this subtopic\'s theory, this has a genuine correctness cost — internal sidecars trusting the raw connection address instead of the XFF chain overwrite the original client IP with each hop\'s own immediate upstream address, corrupting client-IP attribution in logs and any IP-based access control.'
    }
  ];
}
