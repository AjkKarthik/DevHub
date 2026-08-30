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
  templateUrl: './sni-filter-chain-matching-is-what-actually-selects-the-right-cert.html',
  styleUrl: './sni-filter-chain-matching-is-what-actually-selects-the-right-cert.scss'
})
export class SniFilterChainMatchingIsWhatActuallySelectsTheRightCertSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the WHAT clearly, but never explains the HOW',
      points: [
        'The main page correctly states: "if api.example.com and admin.example.com share the same IP/port, the gateway presents the correct cert for each" via SNI. What it doesn\'t explain is the actual Envoy mechanism that makes this work — understanding it clarifies exactly why each Gateway `server` entry needs its own distinct `hosts` value, and what happens when that requirement isn\'t met.',
      ]
    },
    {
      heading: 'The reality: Envoy uses FILTER CHAIN MATCHING on the raw TLS ClientHello, before any HTTP processing happens',
      points: [
        'When multiple Gateway `server` blocks share the same port and protocol (HTTPS), Istio compiles each one into a SEPARATE Envoy <strong>filter chain</strong> on the SAME listener, each with its own <code>filter_chain_match.server_names</code> value set to that server\'s configured `hosts`.',
        'The TLS ClientHello (which carries the SNI extension) arrives BEFORE any decryption happens — Envoy inspects the plaintext SNI field, matches it against each filter chain\'s configured server_names, and only THEN routes the connection into the matching filter chain — which is what determines which TLS certificate gets presented for THAT specific connection.',
        'This is why an exact, correct `hosts` value on each Gateway server entry is load-bearing, not cosmetic: it directly becomes the SNI match criteria Envoy uses to pick a filter chain (and therefore a certificate) BEFORE the connection is even decrypted — a typo or overly broad `hosts` value can silently route a connection into the wrong filter chain, presenting the wrong certificate.',
      ]
    },
    {
      heading: 'Why this matters for debugging cert-mismatch issues specifically',
      points: [
        'A browser TLS warning ("certificate does not match hostname," or the WRONG cert being presented for a given hostname) on a multi-host gateway is almost always a filter-chain-matching problem at the SNI level — NOT a problem with the certificate\'s own content or a VirtualService routing issue, since VirtualService routing happens entirely AFTER TLS termination, one full network layer downstream of where SNI matching occurs.',
        'The debugging implication: when multiple hostnames share one gateway port and the wrong cert appears, check each Gateway server entry\'s `hosts` field for typos or unintended overlap FIRST — this is a TLS-listener-level problem, and no amount of VirtualService debugging will find it, since VirtualService never even runs for a connection that resolved into the wrong filter chain.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two hostnames, same port -- Istio compiles TWO filter chains',
      language: 'bash',
      code: `apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: multihost-gw
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
  - port: { number: 443, name: https-api, protocol: HTTPS }
    hosts: ["api.example.com"]        # -> filter chain A
    tls: { mode: SIMPLE, credentialName: api-tls }
  - port: { number: 443, name: https-admin, protocol: HTTPS }
    hosts: ["admin.example.com"]      # -> filter chain B
    tls: { mode: SIMPLE, credentialName: admin-tls }

# Istio compiles this into ONE Envoy listener on 0.0.0.0:443
# with TWO filter chains:
#   filter_chain_match: { server_names: ["api.example.com"] }
#     -> presents api-tls cert
#   filter_chain_match: { server_names: ["admin.example.com"] }
#     -> presents admin-tls cert
# The TLS ClientHello's SNI value picks which filter chain (and
# therefore which cert) a given connection is routed into --
# entirely before any HTTP request line is even parsed.`,
    },
    {
      label: 'Inspecting the real filter chains for a live gateway',
      language: 'bash',
      code: `# See the actual compiled filter chains on the gateway's
# listener -- this is the ground truth for SNI matching:
istioctl proxy-config listener deploy/istio-ingressgateway \\
  -n istio-system --port 443 -o json | \\
  python3 -c "
import sys, json
data = json.load(sys.stdin)
for fc in data[0]['filterChains']:
    names = fc.get('filterChainMatch', {}).get('serverNames', [])
    print('server_names:', names)
"
# If a hostname is missing from this output entirely, or a
# DIFFERENT hostname's filter chain unexpectedly matches it
# (e.g. via an overly broad "hosts" value), that's the exact
# root cause of a wrong-cert-served symptom.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A gateway serves both api.example.com and admin.example.com on port 443, each with its own server entry and TLS cert as shown above. A team accidentally sets hosts: ["*.example.com"] on the api.example.com server entry (intending it to just cover api specifically, but using a wildcard by mistake). Requests to admin.example.com now sometimes receive the api certificate instead of the admin one, causing browser TLS warnings. Why does this happen, and at what layer is the actual bug?',
    hint: 'Filter chains are matched by SNI in the order they\'re evaluated — what happens when one filter chain\'s server_names value is broad enough to also match a hostname meant for a DIFFERENT filter chain?',
    solution: 'The overly broad *.example.com value on the api server entry causes its compiled filter chain to ALSO match the SNI for admin.example.com (since it satisfies the wildcard), creating an ambiguous match at the TLS ClientHello stage. Depending on filter chain evaluation order, connections intended for admin.example.com can be routed into the api filter chain instead, presenting the api certificate — which doesn\'t match the requested hostname, producing the browser warning. This is purely a TLS-listener/SNI-matching bug, entirely separate from VirtualService or routing configuration — the fix is narrowing the api server entry\'s hosts value back to the exact api.example.com hostname so its filter chain no longer overlaps with admin.example.com\'s.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When a Gateway presents the wrong TLS certificate for a hostname on a multi-host setup, the bug is most likely in the VirtualService routing configuration.',
      reality: 'Per this subtopic\'s theory, certificate selection happens via SNI-based filter chain matching entirely BEFORE any HTTP-level processing (and therefore before VirtualService ever runs) — a wrong-cert symptom is a TLS-listener-level bug, not a VirtualService routing bug.'
    },
    {
      thought: 'The "hosts" field on a Gateway server entry is primarily a routing/documentation convenience — its exact value doesn\'t have much functional impact as long as SOME value is present.',
      reality: 'Per this subtopic\'s theory, the hosts value becomes the literal SNI match criteria (filter_chain_match.server_names) Envoy uses to select which certificate to present — an overly broad or mistyped value can cause real, silent certificate-mismatch bugs.'
    },
    {
      thought: 'Istio serves multiple TLS certificates on the same port by inspecting the decrypted HTTP Host header and picking a certificate to match, similar to how VirtualService host matching works.',
      reality: 'Per this subtopic\'s theory, certificate selection happens via the SNI extension in the TLS ClientHello — which arrives in PLAINTEXT before any decryption — not via the encrypted HTTP Host header, which Envoy can\'t even read until after a certificate has already been selected and the connection decrypted.'
    }
  ];
}
