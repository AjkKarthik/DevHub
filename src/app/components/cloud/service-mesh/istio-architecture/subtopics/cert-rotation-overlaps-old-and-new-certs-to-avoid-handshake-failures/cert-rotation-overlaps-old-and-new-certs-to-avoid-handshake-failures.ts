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
  templateUrl: './cert-rotation-overlaps-old-and-new-certs-to-avoid-handshake-failures.html',
  styleUrl: './cert-rotation-overlaps-old-and-new-certs-to-avoid-handshake-failures.scss'
})
export class CertRotationOverlapsOldAndNewCertsToAvoidHandshakeFailuresSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states rotation happens automatically, without saying how a swap avoids breaking in-flight handshakes',
      points: [
        'The main page\'s QnA says: "Istiod proactively rotates certs before they expire... rotation happens at 80% of TTL. The sidecar fetches the new cert via the SDS... xDS type without restarting." This describes WHEN rotation happens, but not what protects a connection mid-handshake from a peer that\'s still using the OLD cert while THIS sidecar has already switched to the new one.',
      ]
    },
    {
      heading: 'The mechanism: old and new certs are BOTH valid simultaneously during rotation, not swapped atomically',
      points: [
        'When a sidecar\'s certificate nears its rotation point (80% of TTL — around 19 hours into a 24-hour default lifetime), the SDS server issues a NEW certificate and pushes it to Envoy — but the OLD certificate is not immediately invalidated or discarded. Both remain valid for an overlap window.',
        'This overlap is precisely what allows two peers mid-rotation, one holding a new cert and one still holding the old one, to complete a TLS handshake successfully — each side\'s root-of-trust still recognizes the OTHER side\'s currently-presented certificate as valid, regardless of which one has already rotated.',
      ]
    },
    {
      heading: 'Why this matters: it is the same "make before break" pattern applied to certificates instead of xDS config',
      points: [
        'This mirrors the general principle behind avoiding a black-hole during any rolling config change (add the new thing before removing the old one) — here applied to identity material specifically: a new cert is issued and trusted BEFORE the old one is dropped, rather than an atomic cutover that would create a brief window where two peers mid-rotation reject each other\'s certificates.',
        'The same overlap principle extends to ROOT CA rotation (not just workload cert rotation) — Istio supports a trust-bundle overlap period where both an old and new root CA are simultaneously trusted, enabling zero-downtime CA migration for the entire mesh, not just routine per-workload cert renewal.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What rotation actually looks like on the wire',
      language: 'bash',
      code: `# Workload cert TTL: 24h (default)
# Rotation triggered at ~80% of TTL: ~19h into the cert's life

# T+0h:   Sidecar A gets cert-v1, valid until T+24h
# T+19h:  Sidecar A's SDS server requests a new cert -- gets cert-v2
#         cert-v1 is NOT immediately discarded
# T+19h to T+24h: OVERLAP WINDOW -- both cert-v1 and cert-v2 are
#         valid and trusted by peers

# During this window, Sidecar B (which hasn't rotated yet, still
# has ITS OWN cert-v1-equivalent) completes a handshake with
# Sidecar A's NEW cert-v2 without issue -- because Sidecar B's
# trust store recognizes the shared root CA that signed BOTH
# cert-v1 and cert-v2, not a specific leaf cert.

# Verify a live cert's validity window:
istioctl proxy-config secret <pod-name>.<namespace> -o json | \\
  jq '.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' | \\
  base64 -d | openssl x509 -noout -dates`,
    },
    {
      label: 'Root CA rotation: the same overlap pattern, at a larger scale',
      language: 'bash',
      code: `# Migrating the entire mesh's root CA (e.g. rotating a
# compromised or expiring root) uses the same principle:

# Phase 1: Add the NEW root CA to the trust bundle, alongside
# the existing OLD root CA -- both are now trusted mesh-wide
kubectl apply -f new-root-ca-trust-bundle.yaml

# Phase 2: Workload certs gradually rotate (via the normal 80%-
# of-TTL mechanism) and start being signed by the NEW root --
# but peers still trust certs signed by either root during this
# transition, since BOTH are in the trust bundle

# Phase 3: Once every workload has rotated onto the new root
# (confirmed via cert inspection across the mesh), remove the
# OLD root CA from the trust bundle
kubectl apply -f remove-old-root-ca.yaml

# Skipping the overlap (removing the old root before every
# workload has actually rotated) recreates the exact handshake-
# failure risk the per-workload cert overlap exists to prevent --
# just at root-CA scale instead of leaf-cert scale.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An engineer worries that Istio\'s automatic certificate rotation (every ~19 hours by default) must cause a brief connectivity blip between any two services where one has just rotated and the other hasn\'t yet — reasoning that a "new" cert on one side and an "old" cert on the other side would fail a TLS handshake. Is this concern justified, and why or why not?',
    hint: 'Is the old certificate discarded the instant a new one is issued, or does it remain valid for some period afterward?',
    solution: 'The concern is not justified, because certificate rotation is not an atomic swap — the old certificate remains valid for an overlap window after the new one is issued (roughly the remaining time until the old cert\'s original expiration). During this overlap, both the old and new certificates are trusted by peers, since trust is rooted in the shared CA that signed both, not in a specific leaf certificate matching exactly. This means two peers mid-rotation relative to each other — one already on a new cert, one still on its old (still-valid) cert — complete TLS handshakes normally throughout the entire transition, with no connectivity gap. This is the same "make before break" principle used elsewhere in Istio\'s config propagation, applied here to certificate material specifically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Certificate rotation in Istio is an atomic swap — the moment a sidecar receives its new certificate, the old one becomes invalid, so any peer still presenting the old cert would fail to connect.',
      reality: 'Per this subtopic\'s theory, the old certificate remains valid for an overlap window after rotation — both old and new certs are simultaneously trusted, specifically to prevent the handshake failures an atomic swap would cause between peers rotating at different times.'
    },
    {
      thought: 'A TLS handshake between two Istio sidecars succeeds only if both sides are presenting certificates issued at the exact same rotation cycle.',
      reality: 'Per this subtopic\'s theory, trust is rooted in the shared CA that signed both certificates, not in matching a specific leaf certificate — two sidecars at completely different points in their own independent rotation cycles handshake successfully as long as both certs are still within their valid, trusted windows.'
    },
    {
      thought: 'The overlap-based rotation approach only applies to individual workload certificates, not to a mesh-wide root CA migration, which would require a coordinated all-at-once cutover instead.',
      reality: 'Per this subtopic\'s theory, root CA rotation uses the exact same overlap principle at a larger scale — both the old and new root CA are trusted simultaneously in the trust bundle while workloads gradually rotate onto the new root, enabling zero-downtime CA migration without an all-at-once cutover.'
    }
  ];
}
