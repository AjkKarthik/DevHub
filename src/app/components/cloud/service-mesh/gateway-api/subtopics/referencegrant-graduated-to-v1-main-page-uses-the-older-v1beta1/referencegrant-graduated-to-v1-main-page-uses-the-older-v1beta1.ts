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
  templateUrl: './referencegrant-graduated-to-v1-main-page-uses-the-older-v1beta1.html',
  styleUrl: './referencegrant-graduated-to-v1-main-page-uses-the-older-v1beta1.scss'
})
export class ReferenceGrantGraduatedToV1MainPageUsesTheOlderV1beta1Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A version gap worth knowing, not a hard error — the main page\'s YAML still works',
      points: [
        'Every ReferenceGrant example on the main page (and in this hub) uses <code>apiVersion: gateway.networking.k8s.io/v1beta1</code>, while every other Gateway API resource shown (GatewayClass, Gateway, HTTPRoute) uses the newer <code>v1</code>. This inconsistency has a real reason worth understanding: ReferenceGrant simply hadn\'t graduated to v1 as recently as the other resources had.',
      ]
    },
    {
      heading: 'The reality: ReferenceGrant recently graduated from v1beta1 to a stable v1',
      points: [
        'GatewayClass, Gateway, and HTTPRoute reached the stable <code>v1</code> API version years ago. ReferenceGrant (which replaced an earlier, identically-shaped resource called ReferencePolicy) remained at <code>v1beta1</code> for considerably longer — Gateway API\'s own release notes confirm it only recently graduated to <code>v1</code>, officially joining the Standard channel with a GA API contract (no breaking changes going forward).',
        'Per Gateway API\'s own documentation: the resource\'s SHAPE did not change during this graduation — a ReferenceGrant written at <code>v1beta1</code> is functionally identical to one written at <code>v1</code>. This means main-page examples using <code>v1beta1</code> are not WRONG, just written against an interim version that has since been superseded by a stable release of the same resource.',
      ]
    },
    {
      heading: 'Practical implications of the version gap',
      points: [
        'Kubernetes API versioning guarantees mean a cluster that supports <code>v1</code> ReferenceGrant will almost certainly still accept <code>v1beta1</code> manifests too (API version aliasing/conversion is standard practice for graduated resources) — so existing <code>v1beta1</code> YAML in a GitOps repo is not urgent to rewrite purely for correctness.',
        'That said, for NEW ReferenceGrant resources being written today, using <code>v1</code> is the more forward-looking choice — it matches the version used for every other Gateway API resource in the same manifest, avoiding the slightly confusing appearance of "why is this one resource on a different API version than everything else in the file?"',
        'This is a useful, general habit for any fast-evolving Kubernetes-native API family (Gateway API being a prominent example): individual resource KINDS within the same API GROUP can graduate to stable versions at DIFFERENT times — checking each resource\'s own current version status, rather than assuming the whole API group moves in lockstep, avoids writing manifests that mix a stale version for one resource with current versions for its siblings.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the main page shows (v1beta1 — still works, but dated)',
      language: 'bash',
      code: `apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-from-apps
  namespace: backends
spec:
  from:
  - group: gateway.networking.k8s.io
    kind: HTTPRoute
    namespace: apps
  to:
  - group: ""
    kind: Service
    name: payment-service`,
    },
    {
      label: 'The current, consistent version (v1 — matches Gateway/HTTPRoute/GatewayClass)',
      language: 'bash',
      code: `apiVersion: gateway.networking.k8s.io/v1
kind: ReferenceGrant
metadata:
  name: allow-from-apps
  namespace: backends
spec:
  from:
  - group: gateway.networking.k8s.io
    kind: HTTPRoute
    namespace: apps
  to:
  - group: ""
    kind: Service
    name: payment-service
# Identical shape to the v1beta1 version above -- the
# resource's schema did not change during graduation,
# only its API version string did.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team maintaining a large GitOps repository notices their existing ReferenceGrant manifests all use apiVersion: gateway.networking.k8s.io/v1beta1, while every newer GatewayClass, Gateway, and HTTPRoute manifest they\'ve written uses v1. They wonder whether this is a bug that needs an urgent fix before their next cluster upgrade. What should they actually do?',
    hint: 'Did ReferenceGrant\'s SCHEMA change when it graduated from v1beta1 to v1, or just its version string? Is there any urgency to rewriting already-working manifests?',
    solution: 'There is no urgency — the v1beta1 manifests are not broken and will very likely continue to be accepted by the cluster even after upgrading, since ReferenceGrant\'s schema did not change during its graduation to v1 (only the version string did, and Kubernetes API version handling typically preserves backward compatibility for graduated resources). The team can safely leave existing v1beta1 manifests as-is with no immediate risk. Going forward, it is a good, low-priority cleanup habit to write NEW ReferenceGrant resources at v1 to match the version used across the rest of their Gateway API manifests, but this is a consistency improvement, not a bug fix.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since GatewayClass, Gateway, and HTTPRoute all use apiVersion v1, a ReferenceGrant manifest written at v1beta1 must be a mistake or a sign of an outdated, broken example.',
      reality: 'Per this subtopic\'s theory, this reflects a real, documented fact about Gateway API\'s release history — ReferenceGrant graduated to v1 more recently than the other core resources, so v1beta1 examples are dated but not incorrect or broken.'
    },
    {
      thought: 'A cluster or GitOps repo that has existing ReferenceGrant resources at v1beta1 needs to urgently migrate them to v1 before any cluster or Gateway API upgrade, or they will stop working.',
      reality: 'Per this subtopic\'s theory, the resource\'s schema is identical between v1beta1 and v1 — there is no urgency to migrate existing, working manifests, though writing NEW ones at v1 for consistency is a reasonable low-priority habit.'
    },
    {
      thought: 'All resources within the same Kubernetes API group (like gateway.networking.k8s.io) graduate through alpha/beta/stable versions together, on the same timeline.',
      reality: 'Per this subtopic\'s theory, different resource KINDS within the same API group can graduate at different times — ReferenceGrant lagged behind GatewayClass/Gateway/HTTPRoute\'s graduation to v1 by a significant period, which is why the main page\'s examples showed a version mismatch.'
    }
  ];
}
