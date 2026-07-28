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
  templateUrl: './mesh-wide-peerauthentication-must-be-named-default-in-the-root-ns.html',
  styleUrl: './mesh-wide-peerauthentication-must-be-named-default-in-the-root-ns.scss'
})
export class MeshWidePeerAuthenticationMustBeNamedDefaultInTheRootNsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page gives the general shape of a mesh-wide policy, but not its exact naming requirement',
      points: [
        'The main page states: "Mesh-wide default: create in `istio-system` namespace with no selector." This is directionally correct but leaves out a REQUIREMENT that isn\'t optional or a convention — it\'s a hard rule enforced by Istio\'s own policy-resolution logic.',
      ]
    },
    {
      heading: 'The reality: the mesh-wide policy must be named exactly "default"',
      points: [
        'Per Istio\'s own official documentation: a mesh-wide PeerAuthentication policy must have NO selector, must be created in the mesh\'s ROOT namespace (usually <code>istio-system</code>, but configurable), AND must be named exactly <strong>"default"</strong>. All three conditions together are what make Istio treat it as the mesh-wide baseline — not just "any policy with no selector in istio-system."',
        'This mirrors — and is easy to conflate with — the SEPARATE requirement that a NAMESPACE-level policy (applying to one specific namespace) must ALSO be named "default" within that namespace to be recognized as that namespace\'s baseline. Two different scopes, same naming convention, same reason: Istio\'s policy-resolution logic specifically looks up a resource literally named "default" at each scope level.',
      ]
    },
    {
      heading: 'What happens if the name is wrong',
      points: [
        'A PeerAuthentication in <code>istio-system</code> with no selector but named, say, <code>mesh-baseline</code> instead of <code>default</code> is NOT silently ignored with an error — it is simply never picked up as the mesh-wide default. Istio falls back to its OWN built-in default (PERMISSIVE) for any workload not covered by a more specific namespace- or workload-level policy.',
        'This produces a genuinely confusing failure mode: the YAML applies successfully (no validation error), `kubectl get peerauthentication -n istio-system` shows it present, but `istioctl analyze` or actual traffic behavior reveals the intended STRICT baseline was never actually enforced mesh-wide — because Istio was never looking for that name.',
        'PeerAuthentication policies WITH a workload selector deployed in the root namespace are explicitly ignored entirely, per Istio\'s own policy precedence rules — the root namespace is reserved for the ONE unselected, name-"default" mesh-wide policy; workload-specific overrides belong in the workload\'s own namespace.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'WRONG: correct location, no selector, wrong name — silently ignored',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: mesh-baseline-strict   # NOT "default" -- never
  namespace: istio-system       # recognized as the mesh-wide
spec:                            # policy, no error is raised
  mtls:
    mode: STRICT
EOF

# Applies successfully. istioctl analyze shows no error.
# But Istio silently falls back to its OWN built-in
# default (PERMISSIVE) for every workload not covered
# by a more specific policy -- the intended mesh-wide
# STRICT baseline was never actually active.`,
    },
    {
      label: 'RIGHT: the exact required name, namespace, and no selector',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default              # MUST be exactly "default"
  namespace: istio-system     # MUST be the root namespace
spec:                          # MUST have no selector
  mtls:
    mode: STRICT
EOF
# NOW Istio's own policy-resolution logic recognizes
# this as the mesh-wide baseline for every workload
# not covered by a more specific namespace- or
# workload-level policy.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team applies a PeerAuthentication named enforce-strict-mesh-wide in the istio-system namespace, with mtls.mode: STRICT and no selector. They expect this to enforce STRICT mTLS across the entire mesh by default. A security audit weeks later finds several namespaces are still accepting plaintext connections, even though no namespace- or workload-level PeerAuthentication overrides exist anywhere for those namespaces. What went wrong?',
    hint: 'Beyond "no selector" and "in the root namespace," is there a third requirement for a PeerAuthentication to be recognized as the mesh-wide default?',
    solution: 'The policy was named enforce-strict-mesh-wide instead of the exact required name default. Istio\'s policy-resolution logic specifically looks for a PeerAuthentication literally named "default" with no selector in the root namespace to treat as the mesh-wide baseline — a differently-named policy meeting the other two conditions is simply never picked up, with no validation error to flag the mistake. Since no mesh-wide default was actually recognized, Istio fell back to its own built-in default (PERMISSIVE) for any namespace without its own more specific policy, exactly matching the audit finding. The fix is renaming the resource to default (Kubernetes resource names cannot be changed in place — this requires deleting and recreating it, or using kubectl apply with a new manifest and deleting the old one).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Any PeerAuthentication with no selector, created in the istio-system namespace, is automatically treated as the mesh-wide default policy.',
      reality: 'Per this subtopic\'s theory, the resource name matters just as much as the namespace and selector — it must be named exactly "default." A correctly-scoped policy with any other name is never recognized as the mesh-wide baseline at all.'
    },
    {
      thought: 'If a mesh-wide PeerAuthentication is misnamed, Istio will reject it with a validation error, or istioctl analyze will flag the mistake.',
      reality: 'Per this subtopic\'s theory, a misnamed mesh-wide policy applies successfully with no error — it just silently fails to be picked up as the mesh default, falling back to Istio\'s own built-in PERMISSIVE default instead. This is a genuinely hard-to-catch failure mode.'
    },
    {
      thought: 'The "must be named default" naming rule only applies to the mesh-wide (root namespace) policy — a namespace-level baseline policy can use any descriptive name.',
      reality: 'Per this subtopic\'s theory, the SAME naming requirement applies at the namespace level too — a namespace-level PeerAuthentication intended as that namespace\'s own baseline must ALSO be named exactly "default" to be recognized as such, for the identical reason (Istio\'s policy-resolution logic looks up a resource by that literal name at each scope).'
    }
  ];
}
