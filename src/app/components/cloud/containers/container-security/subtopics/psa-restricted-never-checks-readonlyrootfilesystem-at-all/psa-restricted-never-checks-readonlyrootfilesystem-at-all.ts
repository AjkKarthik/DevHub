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
  templateUrl: './psa-restricted-never-checks-readonlyrootfilesystem-at-all.html',
  styleUrl: './psa-restricted-never-checks-readonlyrootfilesystem-at-all.scss'
})
export class PsaRestrictedNeverChecksReadonlyrootfilesystemAtAllSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory calls restricted "best-practice hardening" without listing what it actually checks',
      points: [
        'The main page\'s own "Pod Security Admission (PSA)" theory bullet describes the three levels only in the vaguest terms: "privileged (no restrictions), baseline (prevents known escalations), restricted (best-practice hardening)." The quiz repeats the same three-word gloss. Nothing on the page enumerates the SPECIFIC fields restricted actually validates.',
        'The main page\'s own "Security Contexts" theory section — covering runAsNonRoot, readOnlyRootFilesystem, allowPrivilegeEscalation, and capabilities.drop together, as one cohesive hardening checklist — never distinguishes which of these four fields are enforced BY Pod Security Admission itself versus which are merely good practice the page independently recommends.',
      ]
    },
    {
      heading: 'What restricted actually checks: three of those four fields — but never readOnlyRootFilesystem',
      points: [
        'Per Kubernetes\' own official Pod Security Standards, the "restricted" policy requires: runAsNonRoot: true, allowPrivilegeEscalation: false, a seccompProfile of RuntimeDefault or Localhost, and capabilities.drop including ALL. These four checks map directly to fields the main page\'s own theory already covers.',
        'readOnlyRootFilesystem is conspicuously absent from that official list — it is documented as a best practice, not a requirement enforced by ANY Pod Security Standard level, including restricted. A Pod can satisfy every single check the "restricted" PSA level performs — non-root, no privilege escalation, seccomp set, all capabilities dropped — while its `readOnlyRootFilesystem` field is left completely unset (defaulting to a writable root filesystem), and PSA admission will accept it without objection.',
        'This means a namespace labeled `pod-security.kubernetes.io/enforce: restricted`, which reads as "the strongest built-in PSA level, blocking anything not best-practice," does NOT actually guarantee every Pod running in it has a read-only root filesystem — the main page\'s own theory treats readOnlyRootFilesystem as part of the same hardening checklist as the four PSA-enforced fields, but only PSA can be relied on as an admission-time GUARANTEE; readOnlyRootFilesystem remains something a chart/manifest author must remember to set themselves, or enforce separately via a policy engine like Kyverno or OPA Gatekeeper.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A Pod that passes restricted admission with a fully writable root filesystem',
      language: 'bash',
      code: `# Namespace enforcing the strongest built-in PSA level, exactly as
# the main page's own "Pod Security Admission" code tab shows:
kubectl label namespace production \\
  pod-security.kubernetes.io/enforce=restricted \\
  pod-security.kubernetes.io/enforce-version=latest

# A Pod satisfying every field PSA restricted actually checks --
# but deliberately OMITTING readOnlyRootFilesystem entirely:
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: technically-restricted-compliant
  namespace: production
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile: { type: RuntimeDefault }
  containers:
    - name: app
      image: ghcr.io/org/app:v1
      securityContext:
        allowPrivilegeEscalation: false
        capabilities: { drop: [ALL] }
        # readOnlyRootFilesystem: true   <- intentionally NOT set
EOF
# pod/technically-restricted-compliant created
# -- NO admission error. PSA "restricted" accepted this Pod, even
#    though its root filesystem is fully writable by default.

kubectl exec technically-restricted-compliant -n production -- \\
  sh -c 'touch /malicious-file && echo WROTE-TO-ROOT-FS'
# WROTE-TO-ROOT-FS
# -- succeeded. A compromised process in this Pod can write anywhere
#    on the container's own filesystem, despite running in a
#    namespace enforcing PSA's strongest built-in level.`,
    },
    {
      label: 'Closing the gap: readOnlyRootFilesystem needs a SEPARATE policy engine',
      language: 'bash',
      code: `# PSA restricted alone cannot be configured to also require
# readOnlyRootFilesystem -- it is not a field the Pod Security
# Standards specification defines for any level. Closing this gap
# requires a genuinely separate admission control layer, exactly the
# same "defense in depth" pattern the main page's own QnA already
# recommends for a DIFFERENT gap (privileged containers):

# Kyverno ClusterPolicy -- explicitly requiring what PSA does not:
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-readonly-rootfs
spec:
  validationFailureAction: Enforce
  rules:
    - name: check-readonly-rootfs
      match:
        resources: { kinds: [Pod] }
      validate:
        message: "readOnlyRootFilesystem must be set to true"
        pattern:
          spec:
            containers:
              - securityContext:
                  readOnlyRootFilesystem: true

# With this policy active, the SAME Pod manifest from before is now
# correctly rejected at admission time:
kubectl apply -f technically-restricted-compliant.yaml
# Error: admission webhook denied the request:
#   readOnlyRootFilesystem must be set to true
# -- PSA restricted + a purpose-built Kyverno/Gatekeeper policy,
#    layered together, is what actually closes the gap the main
#    page's own theory implies "restricted" alone already covers.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team labels every namespace <code>pod-security.kubernetes.io/enforce=restricted</code> and considers this sufficient to guarantee that no Pod in the cluster runs with a writable root filesystem, since the main page\'s own theory groups <code>readOnlyRootFilesystem</code> together with <code>runAsNonRoot</code>, <code>allowPrivilegeEscalation</code>, and <code>capabilities.drop</code> as one hardening checklist. A security audit later finds several Pods with fully writable root filesystems running in these "restricted" namespaces. Using this subtopic\'s theory, how did those Pods pass admission?',
    hint: 'Of the four hardening fields the main page\'s own theory groups together, which ones does the official Kubernetes "restricted" Pod Security Standard actually require, per its own documented policy? Is readOnlyRootFilesystem one of them?',
    solution: 'Per this subtopic\'s theory, those Pods passed admission because readOnlyRootFilesystem is not one of the fields the official "restricted" Pod Security Standard checks at all — it requires runAsNonRoot: true, allowPrivilegeEscalation: false, a seccompProfile (RuntimeDefault or Localhost), and capabilities.drop including ALL, but readOnlyRootFilesystem is documented purely as a best practice, never enforced by any PSA level. A Pod satisfying all four ACTUALLY-checked requirements is accepted by PSA restricted regardless of whether its readOnlyRootFilesystem field is set at all — defaulting to a fully writable root filesystem with zero admission-time objection. The team\'s assumption conflated the main page\'s own THEORY grouping (which lists all four fields together as one cohesive hardening checklist) with what PSA restricted itself actually enforces — only three of those four are guarantees PSA can provide. Closing this specific gap requires a separate policy engine (Kyverno or OPA Gatekeeper) with an explicit rule requiring readOnlyRootFilesystem: true, layered alongside PSA rather than assumed to be covered by it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own theory presents runAsNonRoot, readOnlyRootFilesystem, allowPrivilegeEscalation, and capabilities.drop together as one hardening checklist, PSA\'s "restricted" level — described as "best-practice hardening" — must enforce all four of them.',
      reality: 'Per this subtopic\'s theory, the official Kubernetes restricted Pod Security Standard checks only three of those four fields — runAsNonRoot, allowPrivilegeEscalation, and capabilities.drop, plus a required seccompProfile. readOnlyRootFilesystem is documented as best practice but is never enforced by any PSA level.'
    },
    {
      thought: 'A namespace labeled pod-security.kubernetes.io/enforce=restricted provides a complete, admission-time GUARANTEE that every Pod in it follows every hardening practice the main page\'s own theory recommends.',
      reality: 'Per this subtopic\'s exercise, PSA restricted only guarantees the specific fields the official Pod Security Standards specification defines — for hardening practices outside that fixed set (like readOnlyRootFilesystem), a separate policy engine such as Kyverno or OPA Gatekeeper must be layered on top to get an equivalent admission-time guarantee.'
    },
    {
      thought: 'The gap between what PSA restricted enforces and what the main page\'s own theory recommends as best practice is a rare, minor edge case unlikely to matter in a real cluster.',
      reality: 'Per this subtopic\'s theory, this gap applies to readOnlyRootFilesystem specifically — one of the FOUR core fields the main page\'s own "Security Contexts" theory section treats as equally important hardening measures, making it a mainstream, easily-overlooked gap for any team relying on PSA restricted alone rather than a layered policy approach.'
    }
  ];
}
