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
  templateUrl: './networkpolicies-union-additively-a-second-policy-can-only-allow-more.html',
  styleUrl: './networkpolicies-union-additively-a-second-policy-can-only-allow-more.scss'
})
export class NetworkpoliciesUnionAdditivelyASecondPolicyCanOnlyAllowMoreSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own 3-step worked example never states HOW its two policies combine',
      points: [
        'The main page\'s own "Default deny + allow" code tab applies THREE separate NetworkPolicy objects to the same namespace — a default-deny-ingress, an allow-frontend-to-api, and an allow-api-to-db — all targeting overlapping sets of pods (podSelector: {} matches everything, including the api and postgres pods the other two policies also select). The page never explains the actual MECHANISM by which three separate policy objects, all applying to the same pod, combine into one effective rule set.',
        'The main page\'s own theory bullet says "A pod with ANY NetworkPolicy applied to it is isolated for that traffic direction" — correct, but read alone, a reader could reasonably guess that when SEVERAL policies apply to the same pod, the most SPECIFIC one (like the narrower allow-frontend-to-api) somehow takes precedence over the broader one (the default-deny), the way more specific CSS selectors or firewall rule ORDER often works in other systems.',
      ]
    },
    {
      heading: 'What actually happens: every applicable policy\'s rules simply UNION together — there is no override, no precedence, no ordering',
      points: [
        'Per Kubernetes\' own documented NetworkPolicy semantics, when multiple policies select the same pod for the same direction, the allowed traffic is the UNION of what every applicable policy permits — not an intersection, not an override by specificity, and not affected by which policy was created first or listed "closer" to the pod in any sense. Kubernetes does not have a concept of policy ordering or priority at all.',
        'This is exactly why the main page\'s own default-deny-ingress policy (contributing ZERO allowed rules) combined with allow-frontend-to-api (contributing exactly one allowed rule) produces "only the one allowed rule" as the effective result — not because the allow policy "overrides" the deny policy, but because the deny policy was never actually denying anything in a way that needed overriding; it simply contributed nothing to the union, while the allow policy contributed its own rule.',
        'The direct, easily-missed consequence: a SECOND NetworkPolicy applied to an already-permissive pod can only ever ADD more allowed traffic — it is structurally impossible to use an additional NetworkPolicy to further RESTRICT traffic that an existing, broader policy on that same pod already allows. If a team wants to narrow access previously granted by a wide-open policy, the ONLY way is to edit or delete that original policy — not add a "more restrictive" one alongside it, since the union of "wide open" and "narrow" is still "wide open."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two "allow" policies on the same pod ADD UP, they don\'t narrow',
      language: 'bash',
      code: `# A team believes they can progressively "tighten" access to the
# postgres pod by adding a SECOND, more restrictive policy alongside
# the main page's own allow-api-to-db policy:

# Policy 1 (the main page's own): allow api -> postgres:5432
# apiVersion: networking.k8s.io/v1
# kind: NetworkPolicy
# metadata: { name: allow-api-to-db }
# spec:
#   podSelector: { matchLabels: { app: postgres } }
#   policyTypes: [Ingress]
#   ingress:
#     - from: [{ podSelector: { matchLabels: { app: api } } }]
#       ports: [{ protocol: TCP, port: 5432 }]

# Policy 2 (NEW, intended as a "narrower, business-hours-only" cap --
# this intent is NOT expressible in NetworkPolicy at all, but let's
# see what actually happens even with a plain narrower selector):
# apiVersion: networking.k8s.io/v1
# kind: NetworkPolicy
# metadata: { name: allow-only-readonly-api }
# spec:
#   podSelector: { matchLabels: { app: postgres } }
#   policyTypes: [Ingress]
#   ingress:
#     - from: [{ podSelector: { matchLabels: { app: api, role: readonly } } }]
#       ports: [{ protocol: TCP, port: 5432 }]

# The team EXPECTS: only api pods labeled role: readonly can connect.
# What ACTUALLY happens: BOTH the original "any app: api pod" rule
# AND the new "role: readonly" rule are unioned -- ALL api pods
# (readonly or not) can still connect, exactly as Policy 1 alone
# already allowed. Policy 2 added nothing; it restricted nothing.`,
    },
    {
      label: 'The only real fix: edit or remove the original, broader policy',
      language: 'bash',
      code: `# Since a second policy can never narrow what a first, broader
# policy already allows, the only way to genuinely restrict postgres
# access to just role: readonly api pods is to EDIT the ORIGINAL
# policy's own selector directly:

kubectl patch networkpolicy allow-api-to-db -n production --type=json \\
  -p '[{"op":"replace","path":"/spec/ingress/0/from/0/podSelector/matchLabels",
        "value":{"app":"api","role":"readonly"}}]'

# Now there is only ONE policy contributing rules for this traffic,
# and its own selector is the actual restriction -- no second
# "narrower" policy needed or possible:
kubectl get networkpolicy allow-api-to-db -n production -o yaml | grep -A2 podSelector

# The general principle worth remembering for any NetworkPolicy
# design: think of every applicable policy as a SEPARATE hole
# punched in an otherwise-solid wall -- adding more policies only
# ever punches MORE holes (or the same hole again), never patches
# one that already exists. Narrowing access always means editing
# the specific policy responsible for the hole you want to shrink.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own default-deny-then-allow pattern, a team has an <code>allow-api-to-db</code> policy permitting all pods labeled <code>app: api</code> to reach postgres. Wanting to restrict this further to only a specific subset of api pods (labeled <code>tier: critical</code>), they add a SECOND NetworkPolicy targeting postgres with a narrower selector, expecting the two policies together to enforce the tighter rule. Using this subtopic\'s theory, will the second policy actually restrict access?',
    hint: 'When two NetworkPolicies select the same pod for the same direction, does Kubernetes apply the INTERSECTION of what they allow, or the UNION?',
    solution: 'No — per this subtopic\'s theory, the second policy will not restrict anything. Kubernetes combines multiple policies selecting the same pod as a UNION of everything each one individually allows, never an intersection and never by specificity or precedence. The original allow-api-to-db policy already permits ALL app: api pods to reach postgres; adding a second policy with a narrower tier: critical selector only adds an additional (redundant, since it\'s already covered) allowed rule — it does nothing to remove or restrict the broader access the first policy already grants. Every app: api pod, critical tier or not, can still reach postgres exactly as before. The only way to genuinely narrow this access is to edit the ORIGINAL allow-api-to-db policy\'s own selector directly (or delete it and replace it with a correctly-scoped one) — there is no way to layer a second, more restrictive NetworkPolicy on top of an existing, broader one and have the narrower one "win."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When multiple NetworkPolicies select the same pod, Kubernetes applies the MOST SPECIFIC one, similar to how more specific CSS selectors or firewall rule ordering typically takes precedence in other systems.',
      reality: 'Per this subtopic\'s theory, Kubernetes has no concept of NetworkPolicy specificity, precedence, or ordering at all — every applicable policy\'s rules are simply UNIONED together, with no policy ever able to override or take priority over another.'
    },
    {
      thought: 'Adding a second, narrower NetworkPolicy alongside an existing, broader one is a valid, additive way to progressively tighten access to a pod over time.',
      reality: 'Per this subtopic\'s exercise, this is structurally impossible — since policies union rather than intersect, a second policy can only ever ADD more allowed traffic on top of what an existing policy already permits, never restrict or narrow it.'
    },
    {
      thought: 'The main page\'s own default-deny-ingress policy works by "overriding" or "taking precedence over" any subsequent allow policies, the same way a deny rule commonly wins ties in traditional firewall rule-ordering systems.',
      reality: 'Per this subtopic\'s theory, there is no override or precedence mechanism involved at all — the default-deny policy simply contributes ZERO rules to the union, so whatever a separate allow policy contributes becomes the entire effective allowed set, with no competition or conflict resolution between the two.'
    }
  ];
}
