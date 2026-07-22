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
  templateUrl: './bind-verb-gates-escalation-create-on-rolebindings-alone-is-not-enough.html',
  styleUrl: './bind-verb-gates-escalation-create-on-rolebindings-alone-is-not-enough.scss'
})
export class BindVerbGatesEscalationCreateOnRolebindingsAloneIsNotEnoughSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA originally overstated how easily a ServiceAccount could self-escalate',
      points: [
        'The main page\'s own closing QnA answer discusses a real risk: a ServiceAccount with permission to create RoleBindings referencing an existing powerful ClusterRole. Read on its own, "rolebindings/create permission... it can bind itself... to an existing powerful ClusterRole" could be read as create being sufficient by itself — which understates what Kubernetes\' own RBAC authorizer actually requires.',
        'This subtopic exists because that exact gap was verified and the main page\'s own QnA text was corrected as part of this content batch — the corrected version now states the real, two-part requirement, and this subtopic explains the mechanism behind why BOTH parts are genuinely necessary.',
      ]
    },
    {
      heading: 'What Kubernetes actually requires: the bind (or escalate) verb, not just create',
      points: [
        'Per Kubernetes\' own documented "Privilege escalation prevention and bootstrapping" behavior, a subject can only create or update a RoleBinding/ClusterRoleBinding that references a Role/ClusterRole if it ALREADY possesses every permission contained in that role at the same scope — UNLESS it separately holds the special `bind` verb on that specific roles/clusterroles resource, which is an explicit exception carved out for cases like automated tooling that needs to grant roles it doesn\'t itself hold.',
        'This means `rolebindings/create` permission ALONE, with no `bind` verb and no pre-existing overlap with the target ClusterRole\'s own permissions, is NOT sufficient to bind to a more powerful role — Kubernetes\' RBAC authorizer rejects the RoleBinding creation attempt outright with a Forbidden error, specifically to close this exact escalation path.',
        'The equivalent protection for directly EDITING a Role/ClusterRole\'s own rules (rather than binding to an existing one) is the separate `escalate` verb — a subject can only add new rules to a Role/ClusterRole that grants MORE than it already has if it holds `escalate` on roles/clusterroles specifically. Both `bind` and `escalate` are powerful, narrowly-scoped verbs that should be treated with the same caution as wildcard permissions, since either one reopens exactly the escalation path the main page\'s own default RBAC behavior otherwise closes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'create alone on rolebindings is rejected, not silently permitted',
      language: 'bash',
      code: `# A ServiceAccount granted ONLY rolebindings/create -- no "bind"
# verb on roles/clusterroles, and no pre-existing overlap with the
# target ClusterRole's own permissions:
# apiVersion: rbac.authorization.k8s.io/v1
# kind: Role
# metadata:
#   name: limited-binder
#   namespace: production
# rules:
#   - apiGroups: [rbac.authorization.k8s.io]
#     resources: [rolebindings]
#     verbs: [create]        # create ONLY -- no "bind"

# This ServiceAccount attempts to bind itself to the built-in
# "cluster-admin" ClusterRole, which it does NOT itself hold:
kubectl auth can-i create rolebindings \\
  --as=system:serviceaccount:production:limited-binder -n production
# yes

kubectl apply -f - --as=system:serviceaccount:production:limited-binder <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: self-escalate-attempt
  namespace: production
subjects:
  - kind: ServiceAccount
    name: limited-binder
    namespace: production
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
EOF
# Error from server (Forbidden): error when creating "STDIN":
# rolebindings.rbac.authorization.k8s.io is forbidden: user cannot
# grant more permissions than already granted
# -- rejected. create alone, without "bind", is not sufficient.`,
    },
    {
      label: 'Adding the bind verb is what actually opens the escalation path',
      language: 'bash',
      code: `# The SAME ServiceAccount, now ALSO granted "bind" on the specific
# cluster-admin ClusterRole -- this is the combination the main
# page's own corrected QnA answer describes as the real risk:
# apiVersion: rbac.authorization.k8s.io/v1
# kind: ClusterRole
# metadata:
#   name: cluster-admin-binder
# rules:
#   - apiGroups: [rbac.authorization.k8s.io]
#     resources: [clusterroles]
#     resourceNames: [cluster-admin]
#     verbs: [bind]           # <- the missing piece from before

# With rolebindings/create (namespaced Role) AND bind on cluster-admin
# (via a separate ClusterRoleBinding granting cluster-admin-binder):
kubectl apply -f - --as=system:serviceaccount:production:limited-binder <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: self-escalate-attempt-2
  namespace: production
subjects:
  - kind: ServiceAccount
    name: limited-binder
    namespace: production
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
EOF
# rolebinding.rbac.authorization.k8s.io/self-escalate-attempt-2 created
# -- succeeds this time. The ServiceAccount now effectively has
#    cluster-admin permissions WITHIN this namespace, despite never
#    being granted cluster-admin directly -- exactly the escalation
#    path the main page's own corrected QnA answer now describes.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security review flags a ServiceAccount that has <code>rolebindings/create</code> permission as an "immediate critical risk," reasoning that per common online RBAC advice, this alone lets the ServiceAccount bind itself to any ClusterRole it can reference, including cluster-admin. Using this subtopic\'s theory, is <code>rolebindings/create</code> alone actually sufficient for that escalation to succeed?',
    hint: 'What specific verb does Kubernetes\' own RBAC authorizer additionally require before it will let a subject bind to a Role/ClusterRole containing MORE permissions than the subject already has?',
    solution: 'No — per this subtopic\'s theory, rolebindings/create permission alone is not sufficient for that escalation to succeed. Kubernetes\' own RBAC authorizer specifically checks, at RoleBinding/ClusterRoleBinding creation time, whether the requesting subject already possesses every permission contained in the referenced Role/ClusterRole — if not, the request is rejected UNLESS the subject also separately holds the bind verb on that specific roles/clusterroles resource (or the escalate verb, for directly editing a Role\'s own rules). A ServiceAccount with only rolebindings/create and no bind verb, attempting to bind to a more powerful ClusterRole like cluster-admin, receives a Forbidden error — the built-in privilege escalation prevention blocks it. The security review\'s "immediate critical risk" framing would only be accurate if the ServiceAccount ALSO held bind (or escalate) on the specific target role — that combination is the genuine risk worth flagging, not rolebindings/create in isolation, which by itself cannot escalate privileges at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A ServiceAccount granted only rolebindings/create (or clusterrolebindings/create) permission can bind itself to any existing ClusterRole it is able to reference, including highly privileged ones like cluster-admin.',
      reality: 'Per this subtopic\'s theory, Kubernetes\' own RBAC authorizer specifically blocks this — creating a RoleBinding/ClusterRoleBinding to a Role/ClusterRole with more permissions than the requester already has is rejected outright, unless the requester also holds the separate bind verb on that specific role (or already has those permissions itself).'
    },
    {
      thought: 'The bind and escalate verbs are obscure, rarely-used RBAC features that most clusters never grant to anyone, making this an edge case not worth actively auditing for.',
      reality: 'Per this subtopic\'s theory, bind and escalate are real, documented verbs specifically designed as an intentional exception to the escalation-prevention rule — legitimate automation (like a CI system that provisions RBAC for other teams) commonly needs them, making them a genuine, non-rare thing to specifically audit for, not a theoretical corner case.'
    },
    {
      thought: 'Since Kubernetes blocks privilege escalation via RoleBindings by default, a ServiceAccount with broad rolebindings/clusterrolebindings create permissions poses no meaningful risk on its own.',
      reality: 'Per this subtopic\'s exercise, create-only permission genuinely cannot escalate privileges by itself — but this default protection is exactly why bind/escalate verbs deserve extra scrutiny during an audit: the moment either is added alongside create permissions, the escalation path this subtopic demonstrates opens immediately.'
    }
  ];
}
