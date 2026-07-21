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
  templateUrl: './aggregated-clusterroles-retroactively-grant-new-permissions-to-old-bindings.html',
  styleUrl: './aggregated-clusterroles-retroactively-grant-new-permissions-to-old-bindings.scss'
})
export class AggregatedClusterrolesRetroactivelyGrantNewPermissionsToOldBindingsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA introduces aggregation as a one-time convenience, not an ongoing risk',
      points: [
        'The main page\'s own QnA answer on aggregated ClusterRoles frames the feature entirely as a benefit: "Useful when you install a CRD and want to automatically extend existing roles to cover the new resource without modifying the base role." The framing is purely about the CONVENIENCE of not having to edit the base ClusterRole by hand.',
        'Nothing on the main page discusses the FLIP SIDE of that same automatic-extension mechanism: what happens to every EXISTING RoleBinding/ClusterRoleBinding that already references an aggregated ClusterRole (like the built-in `view`, `edit`, or `admin` roles) at the moment someone adds a new ClusterRole with a matching aggregation label.',
      ]
    },
    {
      heading: 'What actually happens: every existing binding retroactively gains the new permissions, with no re-approval step',
      points: [
        'Per Kubernetes\' own documented aggregation mechanism, a controller in the control plane continuously watches for any ClusterRole carrying a label matching an aggregated ClusterRole\'s own `aggregationRule` selector (e.g. `rbac.authorization.k8s.io/aggregate-to-view: "true"`) and merges its rules into that aggregated role\'s own `.rules` field automatically.',
        'Because a RoleBinding or ClusterRoleBinding references the aggregated ClusterRole by NAME, not by a frozen snapshot of its rules, every subject already bound to that role — potentially hundreds of ServiceAccounts and users across the whole cluster, bound months or years earlier — automatically and immediately gains whatever new permissions get aggregated in, the instant the new labeled ClusterRole is created. There is no re-approval, no notification, and no distinction in `kubectl auth can-i` output between "originally granted" and "gained via later aggregation."',
        'This means installing a third-party CRD/operator that ships its own ClusterRole labeled `rbac.authorization.k8s.io/aggregate-to-edit: "true"` (a common, encouraged pattern per the main page\'s own QnA) silently expands what every existing holder of the built-in `edit` ClusterRole can do, cluster-wide — a real, well-documented supply-chain-adjacent risk: installing operator YAML from an untrusted source could aggregate unexpectedly broad permissions into a role hundreds of existing users and ServiceAccounts already hold, without any of them being aware their own effective permissions just changed.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Installing a labeled ClusterRole retroactively expands "edit" for everyone',
      language: 'bash',
      code: `# BEFORE: a developer bound to the built-in "edit" ClusterRole,
# exactly the reusable-role pattern the main page's own QnA
# recommends, has NO access to a brand-new CRD "backupjobs":
kubectl auth can-i create backupjobs --as=dev@example.com -n production
# no

# A team installs a third-party backup operator. Its own manifest
# includes a ClusterRole labeled to aggregate into "edit" -- exactly
# the pattern the main page's own QnA describes as the INTENDED use:
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: backup-operator-edit-permissions
  labels:
    rbac.authorization.k8s.io/aggregate-to-edit: "true"
rules:
  - apiGroups: [backup.example.com]
    resources: [backupjobs]
    verbs: [get, list, watch, create, update, patch, delete]
EOF
# clusterrole.rbac.authorization.k8s.io/backup-operator-edit-permissions created

# AFTER: without touching the built-in "edit" ClusterRole, or the
# developer's own binding, or asking anyone for approval:
kubectl auth can-i create backupjobs --as=dev@example.com -n production
# yes
# -- EVERY user/ServiceAccount already bound to "edit", cluster-wide,
#    silently gained this new permission the instant the labeled
#    ClusterRole was created -- not just this one developer.`,
    },
    {
      label: 'Auditing for this: check aggregated rules, not just the binding list',
      language: 'bash',
      code: `# The built-in "edit" ClusterRole's OWN .rules field is auto-
# generated FROM every currently-matching aggregated ClusterRole --
# reading it directly shows the CURRENT, merged effective state:
kubectl get clusterrole edit -o jsonpath='{.rules}' | jq length
# a growing number as more operators/CRDs install matching labels
# over the cluster's lifetime -- not a fixed, reviewed-once count

# Find every ClusterRole currently contributing to "edit" --
# this is the full, real audit surface a static "edit" review misses:
kubectl get clusterrole -l rbac.authorization.k8s.io/aggregate-to-edit=true
# NAME                                   CREATED AT
# backup-operator-edit-permissions       2026-07-21T...
# some-other-operators-own-clusterrole   2026-06-02T...
# ... every one of these silently expanded "edit" for every current
#     AND future holder of that binding, the moment it was applied.

# The practical fix: treat any manifest that carries an
# aggregate-to-* label with the SAME scrutiny as directly editing
# the built-in "edit"/"admin"/"view" ClusterRole by hand -- because
# functionally, that is exactly what applying it does.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own QnA advice, a platform team installs a third-party Helm chart for a new monitoring operator. The chart bundles a ClusterRole labeled <code>rbac.authorization.k8s.io/aggregate-to-view: "true"</code> that grants read access to some sensitive internal metrics resources. No RoleBinding or ClusterRoleBinding in the manifest references this new ClusterRole directly. Using this subtopic\'s theory, does installing this chart change what any EXISTING user can already do?',
    hint: 'Aggregation merges a labeled ClusterRole\'s rules into the aggregated ClusterRole\'s (e.g. "view") own rule set. Does a subject need a NEW binding to benefit from rules added to a role they are ALREADY bound to?',
    solution: 'Yes — per this subtopic\'s theory, installing this chart immediately and retroactively expands what every user or ServiceAccount ALREADY bound to the built-in "view" ClusterRole can do, even though the chart itself creates no new RoleBinding or ClusterRoleBinding at all. The aggregation controller merges the new ClusterRole\'s rules into "view" the moment it is created, purely based on the matching label — and because every existing binding references "view" by NAME rather than a frozen copy of its rules, every subject already holding that binding automatically gains read access to the newly-aggregated sensitive metrics resources, with no re-approval step, no notification, and no visible change in the binding list itself. A review that only checks "does this chart create any new RoleBindings" would completely miss this — the actual permission expansion happens entirely through the aggregation label on the ClusterRole, which is exactly the mechanism the main page\'s own QnA describes as a convenience without covering this side of it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Aggregated ClusterRoles, as the main page\'s own QnA describes them, are purely a maintenance convenience — a way to avoid manually editing a base ClusterRole\'s YAML — with no security implication beyond what direct editing would also have.',
      reality: 'Per this subtopic\'s theory, aggregation has a distinct, additional risk beyond manual editing: it happens automatically, based purely on a label match, with no review step comparable to a pull request against the base role\'s own manifest — any manifest an installer applies can silently expand a widely-held role.'
    },
    {
      thought: 'Installing a chart or operator that includes an aggregate-to-* labeled ClusterRole only affects subjects that the chart itself also creates new bindings for.',
      reality: 'Per this subtopic\'s exercise, aggregation retroactively affects EVERY existing subject already bound to the target aggregated role (view/edit/admin, or a custom one), cluster-wide — no new binding is needed at all, since existing bindings reference the aggregated role by name, not a frozen snapshot of its rules.'
    },
    {
      thought: 'Reading the built-in "edit" (or "view"/"admin") ClusterRole\'s own .rules field once, during an initial cluster security review, gives a stable, accurate picture of what that role grants going forward.',
      reality: 'Per this subtopic\'s theory, the aggregated role\'s .rules field is regenerated automatically every time a matching labeled ClusterRole is created or changed — a one-time review captures only a snapshot; the actual audit surface is every ClusterRole currently carrying the matching aggregate-to-* label, which can grow at any time.'
    }
  ];
}
