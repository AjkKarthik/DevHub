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
  templateUrl: './authorizationpolicy-has-no-naming-requirement-unlike-peerauthentication.html',
  styleUrl: './authorizationpolicy-has-no-naming-requirement-unlike-peerauthentication.scss'
})
export class AuthorizationPolicyHasNoNamingRequirementUnlikePeerAuthenticationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A trap for anyone who already learned the mTLS/PeerAuthentication naming rule',
      points: [
        'The mTLS &amp; Certificate Management topic in this same hub established that a mesh-wide PeerAuthentication policy must be named EXACTLY "default" in the root namespace, or it is silently never recognized as the mesh baseline. It would be a completely reasonable assumption that AuthorizationPolicy — another security-scoped resource, also deployable in the root namespace with no selector for mesh-wide effect — follows the identical naming rule. It does not.',
      ]
    },
    {
      heading: 'The reality: AuthorizationPolicy has NO resource-name requirement at all',
      points: [
        'Verified directly against Istio\'s own AuthorizationPolicy reference: there is no requirement that a mesh-wide (root-namespace, no-selector) AuthorizationPolicy be named "default" or anything else in particular. ANY name works.',
        'More significantly: MULTIPLE mesh-wide AuthorizationPolicy resources, with different names, can coexist in the root namespace and ALL apply cumulatively — this is fundamentally different from PeerAuthentication, where only the ONE resource literally named "default" is ever picked up; every other differently-named policy in that namespace is effectively invisible to the mesh-wide resolution logic.',
        'This difference makes sense given how each resource type combines multiple matches: PeerAuthentication resolves to a SINGLE effective mode per scope (there can only be one mTLS mode active for a given connection), so Istio needs an unambiguous way to pick exactly one policy — hence the name-based lookup. AuthorizationPolicy, by contrast, is explicitly designed to OR multiple ALLOW policies and evaluate multiple DENY policies together — accumulating rules across resources is the intended model, so no single "the one true policy" selection mechanism is needed.',
      ]
    },
    {
      heading: 'Practical implication for how teams should structure security policies',
      points: [
        'Because AuthorizationPolicy resources compose freely by name, it\'s both safe AND idiomatic to split mesh-wide rules across multiple, clearly-named resources — e.g. <code>mesh-deny-all</code>, <code>mesh-allow-monitoring</code>, <code>mesh-allow-healthchecks</code> — rather than cramming everything into one giant policy. This is a genuinely different best practice from PeerAuthentication, where splitting the mesh-wide mTLS mode across multiple resources is not just unidiomatic, it literally doesn\'t work (only the one named "default" counts).',
        'The risk runs the OTHER direction from the PeerAuthentication naming trap: instead of "my policy is silently ignored because of its name," the AuthorizationPolicy risk is "I forgot I have several old, differently-named mesh-wide policies from past experiments, and they are ALL still actively contributing to the effective authorization decision" — auditing `kubectl get authorizationpolicy -n istio-system` for EVERY resource present (not just one expected name) is the correct habit here.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Multiple differently-named mesh-wide policies — ALL apply',
      language: 'bash',
      code: `# Three SEPARATE AuthorizationPolicy resources, all in the
# root namespace, all with NO selector -- all three apply
# simultaneously to every workload in the mesh:

cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: mesh-deny-all       # any name works -- not "default"
  namespace: istio-system
spec:
  action: ALLOW
  rules: []                   # deny-by-default baseline
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: mesh-allow-monitoring   # a SECOND mesh-wide policy,
  namespace: istio-system         # different name, ALSO applies
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        namespaces: ["monitoring"]
    to:
    - operation:
        paths: ["/metrics"]
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: mesh-allow-healthchecks  # a THIRD, also applies
  namespace: istio-system
spec:
  action: ALLOW
  rules:
  - to:
    - operation:
        paths: ["/health", "/readyz"]
EOF
# Contrast: an equivalent attempt with THREE PeerAuthentication
# resources in istio-system would have only the one named
# "default" recognized -- the other two would be silently inert.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team, having just learned that a mesh-wide PeerAuthentication must be named "default" or it\'s silently ignored, applies the same caution to AuthorizationPolicy — they carefully consolidate everything into ONE giant mesh-wide AuthorizationPolicy resource named "default" in istio-system, worried that any other name might not be picked up. Is this caution necessary, and is there a downside to this approach?',
    hint: 'Does AuthorizationPolicy have the same "must be named default" requirement as PeerAuthentication for its mesh-wide scope?',
    solution: 'The caution is unnecessary — AuthorizationPolicy has no resource-name requirement at all, unlike PeerAuthentication. Any name works, and multiple mesh-wide AuthorizationPolicy resources with different names all apply cumulatively (ALLOW rules OR\'d together, DENY policies all evaluated). There is a real downside to consolidating everything into one giant resource: it becomes harder to reason about, review, and independently version different concerns (deny-all baseline vs. monitoring scrape access vs. health check access) when they\'re all crammed into a single AuthorizationPolicy YAML, compared to several clearly-named, independently-manageable resources. The team can safely split their mesh-wide rules across multiple named resources — this is the idiomatic approach for AuthorizationPolicy, in contrast to PeerAuthentication where only "default" is ever recognized.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a mesh-wide PeerAuthentication must be named exactly "default," a mesh-wide AuthorizationPolicy must follow the same naming rule to actually take effect.',
      reality: 'Per this subtopic\'s theory, AuthorizationPolicy has NO naming requirement at all — this is a genuinely different rule from PeerAuthentication, not a consistent mesh-wide-resource convention across Istio\'s security APIs.'
    },
    {
      thought: 'Only one mesh-wide AuthorizationPolicy resource can be "the" active one per root namespace, just like only one PeerAuthentication named "default" is recognized.',
      reality: 'Per this subtopic\'s theory, MULTIPLE mesh-wide AuthorizationPolicy resources — with any names — all apply cumulatively and simultaneously. This is the intended, idiomatic way to compose mesh-wide authorization rules across several clearly-scoped resources.'
    },
    {
      thought: 'Consolidating all mesh-wide authorization rules into a single, carefully-named AuthorizationPolicy resource is the safest approach, mirroring the caution needed for PeerAuthentication.',
      reality: 'Per this subtopic\'s theory, splitting rules across multiple clearly-named resources is both safe and idiomatic for AuthorizationPolicy — the real risk with this resource type is the OPPOSITE of PeerAuthentication\'s: forgetting about old, still-active, differently-named policies that keep contributing to the effective decision, not a policy being silently ignored due to its name.'
    }
  ];
}
