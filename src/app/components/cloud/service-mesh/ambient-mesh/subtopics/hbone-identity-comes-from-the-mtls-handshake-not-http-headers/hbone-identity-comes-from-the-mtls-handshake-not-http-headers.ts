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
  templateUrl: './hbone-identity-comes-from-the-mtls-handshake-not-http-headers.html',
  styleUrl: './hbone-identity-comes-from-the-mtls-handshake-not-http-headers.scss'
})
export class HboneIdentityComesFromTheMtlsHandshakeNotHttpHeadersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A mechanism claim worth double-checking before explaining HBONE to someone else',
      points: [
        'The main page originally described HBONE as tunneling traffic "inside HTTP/2 CONNECT requests" while separately claiming "HBONE adds metadata (source workload identity) in HTTP headers that ztunnel verifies. This is how mTLS identity is conveyed without touching the pod." That framing puts identity conveyance INSIDE an HTTP header, ahead of — or separate from — the mTLS handshake itself. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: the mTLS handshake IS the identity mechanism — HTTP/2 CONNECT comes after',
      points: [
        'HBONE (HTTP-Based Overlay Network Encapsulation) is, per Istio\'s own architecture documentation, a standard HTTP/2 CONNECT tunnel running <strong>over</strong> an already-established mutual TLS connection. The sequence matters: ztunnel first performs a genuine mTLS handshake, presenting and verifying SPIFFE-identity-bearing X.509 certificates on both sides — THIS handshake is what authenticates the source workload and conveys its identity.',
        'Only AFTER that mTLS channel is up does the HTTP/2 CONNECT request happen — and its sole purpose is to establish the INNER tunnel that carries the original (plaintext, from the pod\'s perspective) TCP stream. The CONNECT request itself is not where identity verification happens; it rides on top of a channel whose identity was already established by the TLS handshake underneath it.',
      ]
    },
    {
      heading: 'Why "headers carry identity" vs. "the TLS handshake carries identity" is not a minor distinction',
      points: [
        'These are two structurally different trust models. If identity were conveyed via an HTTP header (as the main page originally implied), that header would need to be independently protected from spoofing or replay by something else — a header is just application-layer data, trivially forgeable by anything that can construct requests. The mTLS-handshake model instead ties identity to cryptographic proof-of-possession of a private key matching a SPIFFE-signed certificate, verified by the TLS layer itself before any HTTP-layer content is even processed.',
        'This is the SAME class of correction as this batch\'s own default-redirection subtopic and the mTLS hub\'s own earlier probe-exemption correction: describing WHERE in the request/connection lifecycle a security property actually lives, rather than assuming a plausible-sounding "there\'s probably a header for that" explanation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The real HBONE sequence: mTLS handshake first, HTTP/2 CONNECT second',
      language: 'bash',
      code: `# 1. Source ztunnel initiates a TCP connection to the destination
#    ztunnel, then performs a genuine mTLS handshake:
#    - Presents its own SPIFFE-identity X.509 certificate
#    - Verifies the destination ztunnel's certificate
#    - This handshake IS the identity-conveyance mechanism --
#      not an HTTP header.

# 2. ONLY once that mTLS channel is established does the source
#    ztunnel send an HTTP/2 CONNECT request THROUGH it:
#    CONNECT <dest-pod-ip>:<port> HTTP/2.0

# 3. The CONNECT request's job is narrow: establish the inner
#    tunnel for the original (plaintext, pod-to-pod) TCP stream.
#    It does not carry identity -- the mTLS layer already did.

# Inspect ztunnel's own certs to see the actual SPIFFE identity
# used in the handshake:
istioctl proxy-config secret <ztunnel-pod> -n istio-system`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security reviewer, reading the main page\'s original (now-corrected) description, raises a concern: "If HBONE conveys identity via HTTP headers, what stops a compromised workload from forging that header and impersonating another service?" How does the corrected mechanism (mTLS handshake, not headers) answer this concern differently than the original framing would have?',
    hint: 'What actually authenticates a ztunnel-to-ztunnel connection before any HTTP/2 CONNECT request is even sent?',
    solution: 'The corrected mechanism answers this concern much more solidly than the original framing implied. Since identity is conveyed via the mTLS handshake itself — cryptographic proof-of-possession of a private key matching a SPIFFE-signed X.509 certificate, verified by the TLS layer before any HTTP content is processed — a compromised workload cannot simply "forge a header" to impersonate another service; it would need the actual private key corresponding to that service\'s certificate, which ztunnel and the mesh\'s certificate authority control, not something reachable from inside a compromised pod. If identity genuinely were conveyed via an HTTP header (the main page\'s original, incorrect claim), the reviewer\'s concern would have been legitimate — headers are trivially forgeable application-layer data with no cryptographic binding to the sender\'s real identity.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'HBONE conveys workload identity through metadata placed in HTTP headers, which ztunnel then verifies.',
      reality: 'Per this subtopic\'s theory (a mechanism claim corrected on the main page during this batch), identity is conveyed by the mTLS handshake itself — via verified SPIFFE-identity certificates — not by any HTTP header. The HTTP/2 CONNECT request only tunnels the original TCP stream, after the mTLS channel already exists.'
    },
    {
      thought: 'The HTTP/2 CONNECT request is the mechanism that establishes trust and identity between two ztunnels.',
      reality: 'Per this subtopic\'s theory, the CONNECT request happens AFTER trust is already established via mTLS — its role is narrowly to open the inner tunnel for the original TCP stream, not to authenticate anything.'
    },
    {
      thought: 'Since HBONE is described as an HTTP-based encapsulation, its security properties are primarily an HTTP-layer concern.',
      reality: 'Per this subtopic\'s theory, HBONE\'s actual security guarantee (mutual authentication and encryption) comes entirely from the TLS layer underneath the HTTP/2 CONNECT tunnel — the "HTTP-based" part of the name describes the tunneling mechanism, not where the identity/security guarantee lives.'
    }
  ];
}
