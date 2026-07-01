import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Role', type: 'keyword', desc: 'Namespaced permission set (verbs on resources within one namespace)' },
  { name: 'ClusterRole', type: 'keyword', desc: 'Cluster-wide permission set — spans all namespaces or cluster-scoped resources' },
  { name: 'RoleBinding', type: 'keyword', desc: 'Binds a Role or ClusterRole to subjects within a namespace' },
  { name: 'ClusterRoleBinding', type: 'keyword', desc: 'Binds a ClusterRole to subjects across the entire cluster' },
  { name: 'ServiceAccount', type: 'keyword', desc: 'Machine identity for Pod processes — mounted as a token at /var/run/secrets' },
  { name: 'IRSA', type: 'keyword', desc: 'IAM Roles for Service Accounts — maps K8s SA to AWS IAM role via OIDC' },
  { name: 'Workload Identity', type: 'keyword', desc: 'GCP/Azure equivalent of IRSA — federated identity for pod-to-cloud auth' },
  { name: 'kubectl auth can-i', type: 'keyword', desc: 'Check if a subject can perform an action: kubectl auth can-i get pods --as=user' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'RBAC Primitives',
    points: [
      'RBAC (Role-Based Access Control) controls who (subjects) can do what (verbs) on which resources.',
      'Subjects: User (human via kubeconfig cert/OIDC), Group, or ServiceAccount (for Pods).',
      'Verbs: get, list, watch, create, update, patch, delete, deletecollection.',
      'Resources: pods, deployments, services, secrets, configmaps, nodes, etc. Use * to mean all.',
      'Role/ClusterRole define WHAT is allowed; RoleBinding/ClusterRoleBinding say WHO gets it.',
    ],
  },
  {
    heading: 'Role vs ClusterRole',
    points: [
      'Role: scoped to one namespace — can only grant access to resources in that namespace.',
      'ClusterRole: cluster-wide — can grant access to resources in all namespaces OR cluster-scoped resources (nodes, PVs, CRDs).',
      'A ClusterRole can be bound to a single namespace via a RoleBinding (not a ClusterRoleBinding) — useful to reuse a permission set without making it cluster-wide.',
      'Use Role + RoleBinding for app-level access (e.g. a deployment reading its own ConfigMaps).',
      'Use ClusterRole + ClusterRoleBinding sparingly — only for cross-namespace or cluster-scoped resources.',
    ],
  },
  {
    heading: 'ServiceAccounts and Pod Identity',
    points: [
      'Every Pod runs under a ServiceAccount — the default SA in the namespace unless specified.',
      'The SA token is automatically mounted at /var/run/secrets/kubernetes.io/serviceaccount/token.',
      'Best practice: create a dedicated SA per workload and bind only the permissions it needs.',
      'automountServiceAccountToken: false disables the automatic mount when the pod doesn\'t need K8s API access.',
      'IRSA (AWS) and Workload Identity (GCP/Azure) federate the K8s SA to a cloud IAM role via OIDC — removes the need for hardcoded cloud credentials.',
    ],
  },
  {
    heading: 'Principle of Least Privilege in Kubernetes',
    points: [
      'Start with no permissions — only add verbs/resources that the workload actually needs.',
      'Never grant wildcard permissions (verbs: ["*"]) to application workloads.',
      'Audit with kubectl auth can-i --list --as=system:serviceaccount:ns:sa to see effective permissions.',
      'Use separate namespaces for prod/staging/dev — RoleBindings don\'t cross namespace boundaries.',
      'Disable the default SA token mount and create named SAs with tight permissions for every workload.',
    ],
  },
  {
    heading: 'Role vs. ClusterRole and the Scope They Grant',
    points: [
      'A Role grants permissions scoped to a single namespace — a RoleBinding referencing that Role only grants access within that one namespace, regardless of what resources might exist elsewhere in the cluster.',
      'A ClusterRole can either be bound cluster-wide (via a ClusterRoleBinding, granting access across ALL namespaces) or bound to a single namespace (via a RoleBinding referencing a ClusterRole) — this dual-use flexibility is why many teams define reusable ClusterRoles even for namespace-scoped access.',
      'Following least-privilege means granting the narrowest role that satisfies an actual need — a service account with cluster-admin when it only ever needs read access to one namespace\'s pods represents unnecessary risk if that service account\'s credentials are ever compromised.',
      'RBAC is purely additive — there is no explicit "deny" rule type in Kubernetes RBAC, meaning permissions are the union of everything granted by all applicable RoleBindings/ClusterRoleBindings, which makes auditing effective permissions for an identity require checking every binding that could apply to it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Role & RoleBinding',
    language: 'bash',
    code: '# Role: read-only access to pods and logs in "production" namespace\napiVersion: rbac.authorization.k8s.io/v1\nkind: Role\nmetadata:\n  name: pod-reader\n  namespace: production\nrules:\n  - apiGroups: [\'\']          # core API group\n    resources: [pods, pods/log]\n    verbs: [get, list, watch]\n\n---\n# RoleBinding: bind pod-reader to a ServiceAccount\napiVersion: rbac.authorization.k8s.io/v1\nkind: RoleBinding\nmetadata:\n  name: pod-reader-binding\n  namespace: production\nsubjects:\n  - kind: ServiceAccount\n    name: monitoring-agent\n    namespace: production\n  - kind: User\n    name: jane@example.com    # OIDC user\n    apiGroup: rbac.authorization.k8s.io\nroleRef:\n  kind: Role\n  name: pod-reader\n  apiGroup: rbac.authorization.k8s.io',
  },
  {
    label: 'ClusterRole reuse',
    language: 'bash',
    code: '# ClusterRole: deploy manager for all namespaces\napiVersion: rbac.authorization.k8s.io/v1\nkind: ClusterRole\nmetadata:\n  name: deployment-manager\nrules:\n  - apiGroups: [apps]\n    resources: [deployments, replicasets]\n    verbs: [get, list, watch, create, update, patch]\n  - apiGroups: [\'\']\n    resources: [pods]\n    verbs: [get, list, watch]\n\n---\n# Bind ClusterRole to ONE namespace via RoleBinding (not ClusterRoleBinding)\napiVersion: rbac.authorization.k8s.io/v1\nkind: RoleBinding\nmetadata:\n  name: deploy-manager-ns\n  namespace: staging        # scoped to staging only\nsubjects:\n  - kind: ServiceAccount\n    name: ci-agent\n    namespace: staging\nroleRef:\n  kind: ClusterRole           # referencing ClusterRole here\n  name: deployment-manager\n  apiGroup: rbac.authorization.k8s.io',
  },
  {
    label: 'ServiceAccount + IRSA',
    language: 'bash',
    code: '# 1. Create a dedicated ServiceAccount per workload\napiVersion: v1\nkind: ServiceAccount\nmetadata:\n  name: s3-reader\n  namespace: production\n  annotations:\n    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/S3ReaderRole  # IRSA\nautomountServiceAccountToken: false  # opt in explicitly in Pod spec instead\n\n---\n# 2. Bind minimal K8s permissions to that SA\napiVersion: rbac.authorization.k8s.io/v1\nkind: Role\nmetadata:\n  name: s3-reader-role\n  namespace: production\nrules:\n  - apiGroups: [\'\']\n    resources: [configmaps]\n    resourceNames: [app-config]   # only THIS configmap\n    verbs: [get]\n\n---\n# 3. Reference SA in pod spec\nspec:\n  serviceAccountName: s3-reader\n  automountServiceAccountToken: true  # explicit opt-in\n  containers:\n    - name: app\n      image: ghcr.io/org/app@sha256:abc123',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using wildcard verbs on application ServiceAccounts',
    wrong: 'rules:\n  - apiGroups: ["*"]\n    resources: ["*"]\n    verbs: ["*"]   # full cluster admin for an app pod',
    right: 'rules:\n  - apiGroups: [""]\n    resources: [configmaps]\n    resourceNames: [app-config]\n    verbs: [get]   # only exactly what is needed',
    explanation: 'Wildcard RBAC permissions give a pod the ability to read Secrets, create Pods, modify RBAC policies — essentially cluster-admin. A compromised pod with these permissions can escalate to full cluster control. Apply only the exact verbs and resources the workload needs.',
  },
  {
    title: 'Relying on the default ServiceAccount',
    wrong: '# No serviceAccountName specified — uses "default" SA\nspec:\n  containers:\n    - name: app\n      image: myapp:v1',
    right: 'spec:\n  serviceAccountName: myapp-sa   # dedicated SA per workload\n  automountServiceAccountToken: false  # disable if not needed\n  containers:\n    - name: app\n      image: myapp:v1',
    explanation: 'The default ServiceAccount in a namespace may accumulate permissions over time as teams add RoleBindings. Always create a named ServiceAccount per workload and bind only what it needs. Set automountServiceAccountToken: false when the pod doesn\'t need K8s API access.',
  },
  {
    title: 'Using ClusterRoleBinding when RoleBinding suffices',
    wrong: '# ClusterRoleBinding: gives access to ALL namespaces\nkind: ClusterRoleBinding\n# Now the SA can read secrets in EVERY namespace',
    right: '# RoleBinding: scoped to one namespace only\nkind: RoleBinding\nmetadata:\n  namespace: production   # only production',
    explanation: 'ClusterRoleBinding grants permissions across every namespace in the cluster, including future namespaces. If you only need access in one namespace, use RoleBinding (even if referencing a ClusterRole). This is a common least-privilege violation.',
  },
  {
    title: 'Not using resourceNames to scope permissions',
    wrong: 'rules:\n  - apiGroups: [""]\n    resources: [secrets]\n    verbs: [get]   # can read ALL secrets in the namespace',
    right: 'rules:\n  - apiGroups: [""]\n    resources: [secrets]\n    resourceNames: [db-password, api-key]  # only these\n    verbs: [get]',
    explanation: 'A rule granting get on secrets without resourceNames allows reading ALL secrets in the namespace — including those belonging to other applications. Use resourceNames to scope access to specific resources by name when the set is known.',
  },
  {
    title: 'Not auditing effective permissions before deploying',
    wrong: '# Assuming RoleBinding is correct without checking\n# Deploy, then wonder why the pod can access unintended resources',
    right: '# Check effective permissions before deploying:\nkubectl auth can-i list secrets \\\n  --as=system:serviceaccount:production:myapp-sa \\\n  -n production\n# Should return "no"',
    explanation: 'RBAC configuration errors are easy to make and hard to detect at runtime. Use kubectl auth can-i --as=system:serviceaccount:<ns>:<sa> to verify that a ServiceAccount has (and doesn\'t have) the expected permissions before deploying to production.',
  },
];

const challenge: Challenge = {
  title: 'RBAC Permission Checker',
  language: 'typescript',
  description: 'Write a function that validates a Kubernetes RBAC rule object. A valid rule must have: apiGroups (array, non-empty), resources (array, non-empty), verbs (array, at least one valid verb). Valid verbs are: get, list, watch, create, update, patch, delete, deletecollection, *. Return an object with isValid: boolean and errors: string[].',
  hints: [
    'Check that apiGroups is an array with at least one element',
    'Check that resources is an array with at least one element',
    'Check that verbs is an array with at least one element',
    'Validate each verb against the allowed set',
    'Return all errors collected, not just the first one',
  ],
  starterCode: 'const VALID_VERBS = new Set([\n  \'get\', \'list\', \'watch\', \'create\', \'update\', \'patch\', \'delete\', \'deletecollection\', \'*\'\n]);\n\ninterface RbacRule {\n  apiGroups?: unknown;\n  resources?: unknown;\n  verbs?: unknown;\n}\n\ninterface ValidationResult {\n  isValid: boolean;\n  errors: string[];\n}\n\nfunction validateRbacRule(rule: RbacRule): ValidationResult {\n  // TODO: validate the rule\n  return { isValid: true, errors: [] };\n}',
  solution: 'const VALID_VERBS = new Set([\n  \'get\', \'list\', \'watch\', \'create\', \'update\', \'patch\', \'delete\', \'deletecollection\', \'*\'\n]);\n\ninterface RbacRule {\n  apiGroups?: unknown;\n  resources?: unknown;\n  verbs?: unknown;\n}\n\ninterface ValidationResult {\n  isValid: boolean;\n  errors: string[];\n}\n\nfunction validateRbacRule(rule: RbacRule): ValidationResult {\n  const errors: string[] = [];\n\n  if (!Array.isArray(rule.apiGroups) || rule.apiGroups.length === 0) {\n    errors.push(\'apiGroups must be a non-empty array (use [""] for core API group)\');\n  }\n\n  if (!Array.isArray(rule.resources) || rule.resources.length === 0) {\n    errors.push(\'resources must be a non-empty array\');\n  }\n\n  if (!Array.isArray(rule.verbs) || rule.verbs.length === 0) {\n    errors.push(\'verbs must be a non-empty array\');\n  } else {\n    const invalid = (rule.verbs as string[]).filter(v => !VALID_VERBS.has(v));\n    if (invalid.length > 0) {\n      errors.push(`Invalid verbs: ${invalid.join(\', \')}. Valid: ${[...VALID_VERBS].join(\', \')}`);\n    }\n  }\n\n  return { isValid: errors.length === 0, errors };\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the difference between a Role and a ClusterRole in Kubernetes RBAC?',
    options: [
      'Role grants more permissions than ClusterRole by default',
      'Role is scoped to one namespace; ClusterRole applies across all namespaces and cluster-scoped resources',
      'ClusterRole can only be used for nodes and PersistentVolumes',
      'Role and ClusterRole are identical — the naming is historical',
    ],
    answer: 1,
    explanation: 'A Role is namespace-scoped — it can only grant access to resources within the single namespace where it is created. A ClusterRole is cluster-wide — it can grant access to resources in any namespace, or to cluster-scoped resources (like nodes, PersistentVolumes, and CRDs) that have no namespace.',
  },
  {
    q: 'What does kubectl auth can-i get pods --as=system:serviceaccount:production:myapp do?',
    options: [
      'Switches the current kubectl context to the myapp service account',
      'Checks whether the ServiceAccount myapp in namespace production is allowed to get pods',
      'Lists all pods that the myapp ServiceAccount has created',
      'Grants get pod permissions to the myapp ServiceAccount temporarily',
    ],
    answer: 1,
    explanation: 'kubectl auth can-i performs an authorization check: "can this subject do this action?" The --as flag impersonates a subject without requiring you to be logged in as that subject. This is the canonical way to verify RBAC configuration before deploying. Returns "yes" or "no".',
  },
  {
    q: 'What is IRSA (IAM Roles for Service Accounts) used for?',
    options: [
      'Encrypting Kubernetes Secrets with AWS KMS',
      'Mapping a Kubernetes ServiceAccount to an AWS IAM role via OIDC, so pods can call AWS APIs without static credentials',
      'Scanning container images for CVEs before deployment to EKS',
      'Defining IAM policies that control kubectl access to the EKS cluster',
    ],
    answer: 1,
    explanation: 'IRSA federates the Kubernetes OIDC identity of a ServiceAccount to an AWS IAM role. A pod using that ServiceAccount can assume the IAM role and call AWS APIs (S3, DynamoDB, etc.) without any AWS credentials stored in the cluster. GCP and Azure have equivalent mechanisms (Workload Identity).',
  },
  {
    q: 'Why is automountServiceAccountToken: false a security best practice?',
    options: [
      'It prevents the ServiceAccount from being deleted when the Pod is removed',
      'It disables the automatic injection of the SA token, reducing the attack surface for pods that don\'t need K8s API access',
      'It stops the token from expiring, which avoids pod authentication failures',
      'It prevents other namespaces from accessing the ServiceAccount',
    ],
    answer: 1,
    explanation: 'Kubernetes automatically mounts the ServiceAccount token into every pod. If a pod is compromised and doesn\'t need to call the Kubernetes API, that token is an unnecessary attack surface — an attacker could use it to perform RBAC-permitted actions in the cluster. Setting automountServiceAccountToken: false removes the token from the pod filesystem.',
  },
  {
    q: 'You have a ClusterRole "log-reader" and want to bind it to a ServiceAccount but only for the "staging" namespace. Which binding type should you use?',
    options: [
      'ClusterRoleBinding — because the role is a ClusterRole',
      'RoleBinding in the staging namespace — a RoleBinding can reference a ClusterRole and scopes it to the namespace',
      'You must create a new Role in staging instead — ClusterRoles can only be bound with ClusterRoleBinding',
      'Neither — ClusterRoles cannot be scoped to a single namespace',
    ],
    answer: 1,
    explanation: 'A RoleBinding can reference either a Role OR a ClusterRole in its roleRef. When a RoleBinding references a ClusterRole, the permissions are scoped to the namespace of the RoleBinding. This is a common pattern for reusing a ClusterRole definition without granting cluster-wide access.',
  },
  { q: 'A cluster admin binds an existing ClusterRole to a specific namespace using a RoleBinding instead of a ClusterRoleBinding. What is the resulting scope?', options: ['The permissions still apply cluster-wide, since ClusterRoles are inherently cluster-scoped', 'The permissions are limited to the one namespace the RoleBinding was created in, even though the ClusterRole itself is reusable across namespaces', 'This combination is invalid and Kubernetes rejects it', 'The permissions apply to exactly two namespaces: the one specified and the default namespace'], answer: 1, explanation: 'This is a deliberately supported and common pattern — pairing a ClusterRole with a RoleBinding (rather than a ClusterRoleBinding) scopes the effective permissions to just the namespace where the RoleBinding lives, letting teams define one reusable ClusterRole (like "read-only-viewer") and bind it namespace-by-namespace instead of duplicating the same Role definition across every namespace individually.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the default ServiceAccount and why should I avoid relying on it?',
    a: 'Every namespace has a "default" ServiceAccount created automatically. Pods that don\'t specify serviceAccountName use it. The problem: it\'s shared by all pods in the namespace, so any ClusterRoleBinding or RoleBinding added for any reason accumulates on it. Over time, it may have unintended permissions. Create a named SA per workload and bind minimal permissions — then the default SA remains empty by design.',
  },
  {
    q: 'How do I audit what a ServiceAccount can do?',
    a: 'kubectl auth can-i --list --as=system:serviceaccount:<namespace>:<sa-name> -n <namespace> prints all allowed verbs and resources for that SA in the namespace. For cluster-wide resources: add -A or check without -n. You can also use tools like rakkess, kubectl-who-can, or the open-source RBAC Lookup to visualise effective permissions across the cluster.',
  },
  {
    q: 'What is the difference between RoleBinding and ClusterRoleBinding when the roleRef is a ClusterRole?',
    a: 'RoleBinding with a ClusterRole roleRef: grants the ClusterRole\'s permissions only within the namespace of the RoleBinding. ClusterRoleBinding with a ClusterRole roleRef: grants permissions across every namespace in the cluster (and for cluster-scoped resources). The key insight: the binding type determines scope, not the role type.',
  },
  {
    q: 'How do I grant a CI pipeline\'s ServiceAccount permission to deploy to one namespace only?',
    a: 'Create a dedicated ServiceAccount in the target namespace. Create a Role in that namespace with the verbs you need (get/list/watch/create/update on deployments, pods, services). Create a RoleBinding in that namespace binding the Role to the SA. Never use a ClusterRoleBinding for CI access — it would allow the pipeline to deploy to every namespace (or worse, modify RBAC itself if given those verbs).',
  },
  {
    q: 'What are aggregated ClusterRoles and when are they useful?',
    a: 'Aggregated ClusterRoles let you compose permissions by label selector. The built-in admin, edit, and view ClusterRoles support aggregation — you can add custom rules to them by creating a ClusterRole with the matching aggregation label (rbac.authorization.k8s.io/aggregate-to-view: "true"). Useful when you install a CRD and want to automatically extend existing roles to cover the new resource without modifying the base role.',
  },
  { q: 'How do you audit what permissions a service account has in Kubernetes?', a: 'Use kubectl auth can-i --list --as=system:serviceaccount:namespace:sa-name to list all permissions for a service account. To check a specific action: kubectl auth can-i create pods --as=system:serviceaccount:default:mysa. To find all bindings for a SA: kubectl get rolebindings,clusterrolebindings -A -o yaml and grep for the SA name. Tools like rbac-lookup show all bindings for a subject, rakkess shows permissions in a matrix view, and kube-bench runs CIS benchmark checks including RBAC. Apply the principle of least privilege by scoping to specific resources, verbs, and namespaces.' },
];

const revision: RevisionSummary = {
  oneLiner: 'RBAC: Role (namespace) + RoleBinding; ClusterRole (cluster-wide) + ClusterRoleBinding. One SA per workload, minimal verbs, audit with kubectl auth can-i.',
  mustKnow: [
    'Role is namespace-scoped; ClusterRole is cluster-wide (or cluster-scoped resources)',
    'RoleBinding can reference a ClusterRole — scopes it to the RoleBinding\'s namespace',
    'Subjects: User, Group, ServiceAccount (machine identity for Pods)',
    'One dedicated ServiceAccount per workload; automountServiceAccountToken: false when not needed',
    'IRSA/Workload Identity: federate K8s SA to cloud IAM role via OIDC — no static credentials',
    'Audit: kubectl auth can-i --list --as=system:serviceaccount:ns:sa',
  ],
  interviewFocus: [
    'What is the difference between Role and ClusterRole, and between RoleBinding and ClusterRoleBinding?',
    'Can a RoleBinding reference a ClusterRole? What effect does that have?',
    'What is IRSA and why is it better than using environment variable AWS credentials in a pod?',
    'How would you audit what permissions a ServiceAccount has in a cluster?',
  ],
};

@Component({
  selector: 'app-k8s-rbac',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './rbac.html',
  styleUrl: './rbac.scss',
})
export class K8sRbac {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
