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
  { name: 'CustomResourceDefinition (CRD)', type: 'class', desc: 'Extends the K8s API with your own resource types (spec/status)' },
  { name: 'Custom Resource (CR)', type: 'class', desc: 'An instance of a CRD — like a Pod is an instance of the Pod kind' },
  { name: 'Operator', type: 'keyword', desc: 'Controller that manages CRs — encodes operational knowledge as code' },
  { name: 'Reconcile loop', type: 'keyword', desc: 'Observe desired → compare actual → act → requeue on error' },
  { name: 'kubebuilder', type: 'keyword', desc: 'SDK for building K8s controllers in Go with controller-gen markers' },
  { name: 'Operator SDK', type: 'keyword', desc: 'Red Hat SDK supporting Go, Ansible, and Helm-based Operators' },
  { name: 'Finalizer', type: 'keyword', desc: 'Blocks CR deletion until cleanup logic completes' },
  { name: 'OperatorHub.io', type: 'keyword', desc: 'Registry of community and certified Operators (Prometheus, cert-manager, etc.)' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'CustomResourceDefinitions (CRDs)',
    points: [
      'A CRD extends the Kubernetes API with a new resource type — your own kind with spec and status.',
      'After installing a CRD, you can create, get, list, watch, and delete custom resources like any built-in resource.',
      'CRD schema uses OpenAPI v3 validation — define required fields, types, and constraints.',
      'kubectl get <plural-name> works just like kubectl get pods once the CRD is installed.',
      'Popular CRDs: ServiceMonitor (Prometheus), Certificate (cert-manager), ExternalSecret, HTTPRoute (Gateway API).',
    ],
  },
  {
    heading: 'The Operator Pattern',
    points: [
      'An Operator is a controller that watches one or more CRDs and reconciles the cluster to match the desired state.',
      'It encodes domain knowledge: a database Operator knows how to provision, scale, back up, and failover.',
      'Operator Maturity Model: Level 1 (basic install) → Level 5 (autopilot with self-healing).',
      'The reconciliation loop: Get CR → compare current state → act (create/update/delete sub-resources) → update status → requeue.',
      'Well-known Operators: Prometheus Operator, cert-manager, PostgreSQL Operator (Zalando), Strimzi (Kafka), ArgoCD.',
    ],
  },
  {
    heading: 'Building with kubebuilder',
    points: [
      'kubebuilder scaffold: kubebuilder init --domain example.com; kubebuilder create api --group batch --version v1 --kind CronJob.',
      'controller-gen generates RBAC markers, CRD YAML, and DeepCopy methods from Go structs and marker comments.',
      'The Reconcile(ctx, req) function is called whenever a watched resource changes — return Result{} to stop, RequeueAfter to retry.',
      'Use controller-runtime\'s client to Get, Create, Update, Delete sub-resources in the reconcile loop.',
      'Finalizers: add to CR ObjectMeta before creating external resources; remove after cleanup completes.',
    ],
  },
  {
    heading: 'Finalizers and Status Subresource',
    points: [
      'Finalizers prevent CR deletion until your controller removes them — ensuring cleanup of external resources.',
      'Add a finalizer: patch CR.Finalizers = append(CR.Finalizers, "myop.example.com/cleanup").',
      'On deletion: if DeletionTimestamp is set, run cleanup, then remove the finalizer — K8s then deletes the CR.',
      'Status subresource separates spec updates from status updates — controllers update status; users update spec.',
      'Use conditions (Ready, Degraded, Progressing) in status following the K8s API conventions.',
    ],
  },
  {
    heading: 'Why the Operator Pattern Extends Beyond Simple CRDs',
    points: [
      'A CRD alone just defines a new object schema Kubernetes can store — without a controller actively watching and reconciling that object, creating a custom resource does nothing beyond storing data, since nothing acts on it.',
      'An Operator pairs a CRD with a controller that encodes OPERATIONAL knowledge (how to back up a database, how to handle a failed replica, how to perform a version upgrade) — this is what distinguishes an Operator from a plain CRD, which only defines structure without behavior.',
      'The reconciliation loop pattern (observe actual state, compare to desired state, take action to close the gap, repeat) is the same core mechanism underlying both built-in Kubernetes controllers and custom Operators, making Operators feel like natural extensions of Kubernetes rather than bolted-on tooling.',
      'Operators are most valuable for STATEFUL, operationally-complex applications (databases, message brokers) where manual operational runbooks would otherwise be needed — for simple stateless applications, a plain Deployment is usually sufficient without needing custom Operator logic.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'CRD definition',
    language: 'bash',
    code: 'apiVersion: apiextensions.k8s.io/v1\nkind: CustomResourceDefinition\nmetadata:\n  name: databases.myapp.example.com\nspec:\n  group: myapp.example.com\n  versions:\n    - name: v1\n      served: true\n      storage: true\n      schema:\n        openAPIV3Schema:\n          type: object\n          properties:\n            spec:\n              type: object\n              required: [engine, storage]\n              properties:\n                engine:\n                  type: string\n                  enum: [postgres, mysql]\n                storage:\n                  type: string\n                  pattern: \'^[0-9]+Gi$\'\n                replicas:\n                  type: integer\n                  minimum: 1\n                  maximum: 5\n                  default: 1\n            status:\n              type: object\n              properties:\n                phase:\n                  type: string\n                conditions:\n                  type: array\n  scope: Namespaced\n  names:\n    plural: databases\n    singular: database\n    kind: Database\n    shortNames: [db]\n\n---\n# Create a custom resource\napiVersion: myapp.example.com/v1\nkind: Database\nmetadata:\n  name: prod-db\n  namespace: production\nspec:\n  engine: postgres\n  storage: 50Gi\n  replicas: 3',
  },
  {
    label: 'Reconcile loop (Go)',
    language: 'bash',
    code: '// kubebuilder Reconcile function pattern (pseudocode)\nfunc (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {\n    log := log.FromContext(ctx)\n\n    // 1. Fetch the CR\n    db := &myappv1.Database{}\n    if err := r.Get(ctx, req.NamespacedName, db); err != nil {\n        return ctrl.Result{}, client.IgnoreNotFound(err)\n    }\n\n    // 2. Handle deletion with finalizer\n    if !db.DeletionTimestamp.IsZero() {\n        if controllerutil.ContainsFinalizer(db, finalizerName) {\n            if err := r.cleanupExternalResources(ctx, db); err != nil {\n                return ctrl.Result{}, err\n            }\n            controllerutil.RemoveFinalizer(db, finalizerName)\n            r.Update(ctx, db)\n        }\n        return ctrl.Result{}, nil\n    }\n\n    // 3. Add finalizer if not present\n    if !controllerutil.ContainsFinalizer(db, finalizerName) {\n        controllerutil.AddFinalizer(db, finalizerName)\n        r.Update(ctx, db)\n    }\n\n    // 4. Reconcile desired state\n    if err := r.reconcileStatefulSet(ctx, db); err != nil {\n        db.Status.Phase = "Failed"\n        r.Status().Update(ctx, db)\n        return ctrl.Result{RequeueAfter: 30 * time.Second}, err\n    }\n\n    // 5. Update status\n    db.Status.Phase = "Running"\n    r.Status().Update(ctx, db)\n    return ctrl.Result{}, nil  // success — stop requeueing\n}',
  },
  {
    label: 'Using existing Operators',
    language: 'bash',
    code: '# Prometheus Operator — ServiceMonitor CRD\napiVersion: monitoring.coreos.com/v1\nkind: ServiceMonitor\nmetadata:\n  name: api-monitor\n  namespace: production\nspec:\n  selector:\n    matchLabels: { app: api }\n  endpoints:\n    - port: metrics\n      interval: 15s\n      path: /metrics\n\n---\n# cert-manager — Certificate CRD\napiVersion: cert-manager.io/v1\nkind: Certificate\nmetadata:\n  name: api-tls\n  namespace: production\nspec:\n  secretName: api-tls-secret\n  issuerRef:\n    name: letsencrypt-prod\n    kind: ClusterIssuer\n  dnsNames:\n    - api.example.com\n\n---\n# Check Operator status\nkubectl get crd\nkubectl get servicemonitors -n production\nkubectl get certificates -n production\n# kubectl describe certificate api-tls -n production  # check conditions',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not adding a finalizer before creating external resources',
    wrong: '// Create cloud DB without finalizer first\nr.createCloudDatabase(ctx, db)\n// If CR is deleted before reconciler runs cleanup → cloud DB orphaned',
    right: '// Add finalizer BEFORE creating external resources:\ncontrollerutil.AddFinalizer(db, finalizerName)\nr.Update(ctx, db)\n// Then create the cloud resource',
    explanation: 'If you create an external resource (cloud DB, DNS record) before adding the finalizer, a race condition exists: the CR can be deleted before the controller adds the finalizer, leaving the external resource orphaned. Always add the finalizer first.',
  },
  {
    title: 'Returning an error on NotFound for owned resources',
    wrong: 'sts := &appsv1.StatefulSet{}\nif err := r.Get(ctx, key, sts); err != nil {\n    return ctrl.Result{}, err  // panics on NotFound — creates requeue storm\n}',
    right: 'if err := r.Get(ctx, key, sts); err != nil {\n    if !errors.IsNotFound(err) {\n        return ctrl.Result{}, err  // real error\n    }\n    // NotFound: create the StatefulSet\n    return r.createStatefulSet(ctx, db)\n}',
    explanation: 'NotFound is expected during the first reconcile — the sub-resource hasn\'t been created yet. Returning it as an error causes an immediate requeue loop that hammers the API server. Use errors.IsNotFound(err) to handle the create-if-missing case.',
  },
  {
    title: 'Updating spec and status in the same Update call',
    wrong: 'db.Spec.Replicas = 3\ndb.Status.Phase = "Running"\nr.Update(ctx, db)  // status changes may be rejected',
    right: 'db.Spec.Replicas = 3\nr.Update(ctx, db)     // update spec\ndb.Status.Phase = "Running"\nr.Status().Update(ctx, db)  // update status separately',
    explanation: 'Kubernetes has a status subresource — spec and status are updated separately. r.Update() updates spec; r.Status().Update() updates status. Mixing them in one call can result in either the spec or status update being silently dropped depending on the resource configuration.',
  },
  {
    title: 'Building a custom Operator when a community one already exists',
    wrong: '// Writing a custom Postgres Operator from scratch\n// Months of work to handle failover, backups, upgrades...',
    right: '// Use an existing production-grade Operator:\n// Zalando Postgres Operator\n// CloudNativePG\n// CrunchyData PGO\n// Check OperatorHub.io first',
    explanation: 'Building a production-grade Operator for a complex stateful system (database, message broker) is months of work. Check OperatorHub.io, Artifact Hub, and the CNCF landscape first. Only build a custom Operator for your own application\'s operational logic.',
  },
  {
    title: 'Installing CRDs without RBAC for the controller',
    wrong: '# Installed the CRD — controller crashes:\n# "cannot list resource databases in group myapp.example.com"',
    right: '# Controller needs RBAC to watch/get/update its CRDs:\n# +kubebuilder:rbac:groups=myapp.example.com,resources=databases,verbs=get;list;watch;create;update;patch;delete\n# +kubebuilder:rbac:groups=myapp.example.com,resources=databases/status,verbs=get;update;patch',
    explanation: 'Controllers run as ServiceAccounts and need explicit RBAC permissions to watch and update their CRDs. kubebuilder generates RBAC from marker comments above the Reconcile function — always include markers for the CRD and its status subresource.',
  },
];

const challenge: Challenge = {
  title: 'Operator Status Checker',
  language: 'typescript',
  description: 'Write a function that takes an array of custom resource status conditions (as used in K8s Operator conventions) and returns a summary: overall health (true if all required conditions are True), a list of failing conditions, and a list of degraded conditions.',
  hints: [
    'K8s condition conventions: type, status ("True"/"False"/"Unknown"), reason, message',
    'Required condition types to check: Ready, Progressing',
    'A resource is healthy if Ready.status === "True" and Progressing.status === "False"',
    'Failing: status === "False" for required conditions',
    'Degraded: status === "Unknown"',
  ],
  starterCode: 'interface Condition {\n  type: string;\n  status: \'True\' | \'False\' | \'Unknown\';\n  reason?: string;\n  message?: string;\n}\n\ninterface OperatorHealth {\n  healthy: boolean;\n  failing: Condition[];\n  degraded: Condition[];\n}\n\nfunction checkOperatorHealth(conditions: Condition[]): OperatorHealth {\n  // TODO: evaluate conditions per K8s conventions\n  return { healthy: false, failing: [], degraded: [] };\n}',
  solution: 'interface Condition {\n  type: string;\n  status: \'True\' | \'False\' | \'Unknown\';\n  reason?: string;\n  message?: string;\n}\n\ninterface OperatorHealth {\n  healthy: boolean;\n  failing: Condition[];\n  degraded: Condition[];\n}\n\nfunction checkOperatorHealth(conditions: Condition[]): OperatorHealth {\n  const failing: Condition[] = [];\n  const degraded: Condition[] = [];\n\n  const ready = conditions.find(c => c.type === \'Ready\');\n  const progressing = conditions.find(c => c.type === \'Progressing\');\n\n  for (const c of conditions) {\n    if (c.status === \'False\') failing.push(c);\n    else if (c.status === \'Unknown\') degraded.push(c);\n  }\n\n  const healthy =\n    ready?.status === \'True\' &&\n    (progressing === undefined || progressing.status === \'False\') &&\n    failing.length === 0 &&\n    degraded.length === 0;\n\n  return { healthy, failing, degraded };\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does a CustomResourceDefinition (CRD) do?',
    options: [
      'Creates a new Pod template for custom workloads',
      'Extends the Kubernetes API with a new resource type that has its own spec and status',
      'Customises the behaviour of existing K8s resources like Deployments',
      'Defines custom network policies for a namespace',
    ],
    answer: 1,
    explanation: 'A CRD registers a new resource type (e.g. Database) with the Kubernetes API server. Once installed, you can kubectl apply, get, list, watch, and delete instances of that type. The CRD defines the schema (OpenAPI v3) that Kubernetes uses to validate resources of that kind.',
  },
  {
    q: 'What is the Operator pattern?',
    options: [
      'A Kubernetes RBAC role for cluster administrators',
      'A controller that watches CRDs and encodes operational knowledge (backup, failover, upgrade) as code',
      'A Helm chart that installs multiple services at once',
      'A way to run shell scripts inside Kubernetes Pods',
    ],
    answer: 1,
    explanation: 'An Operator is a controller that watches custom resources and acts on them to manage a complex stateful application. It encodes human operational knowledge — provisioning, scaling, backups, upgrades — into software. Examples: Prometheus Operator, CloudNativePG, Strimzi (Kafka).',
  },
  {
    q: 'What is the purpose of a finalizer in a Kubernetes Operator?',
    options: [
      'It runs a final validation before the CR is created',
      'It blocks CR deletion until the controller completes cleanup (e.g. deleting external cloud resources)',
      'It triggers a final backup before a database is shut down',
      'It marks the CR as complete when the Operator finishes its work',
    ],
    answer: 1,
    explanation: 'A finalizer is a string added to CR.metadata.finalizers. When a CR with a finalizer is deleted, Kubernetes sets DeletionTimestamp but does not remove the CR. The controller must clean up external resources and then remove the finalizer — only then does Kubernetes complete the deletion.',
  },
  {
    q: 'Why should spec and status be updated separately in a controller?',
    options: [
      'Kubernetes requires two API calls for performance reasons',
      'Spec and status use different authentication credentials',
      'The status subresource is updated via r.Status().Update() — mixing with r.Update() can silently drop one of the changes',
      'Status updates are synchronous; spec updates are asynchronous',
    ],
    answer: 2,
    explanation: 'Kubernetes splits spec (desired state, set by users) and status (actual state, set by controllers) into separate subresources. r.Update() updates spec; r.Status().Update() updates status. Trying to update both in one call may result in the status update being rejected or ignored depending on the resource configuration.',
  },
  {
    q: 'What should you do BEFORE writing a custom Operator?',
    options: [
      'File a CNCF proposal to register your CRD schema',
      'Check OperatorHub.io and Artifact Hub — a production-grade Operator may already exist',
      'Register the CRD with Kubernetes maintainers for approval',
      'Write the reconcile loop first, then the CRD schema',
    ],
    answer: 1,
    explanation: 'Building a production-grade Operator is significant engineering work. OperatorHub.io lists hundreds of community and certified Operators. For databases (PostgreSQL, MySQL, Kafka), mature Operators already exist (CloudNativePG, Strimzi). Only build custom Operators for your own application\'s specific operational logic.',
  },
  { q: 'What is a Kubernetes Operator?', options: ['A human administrator who manages the cluster on a daily basis', 'A custom controller that encodes operational knowledge for a specific application using CRDs', 'A wrapper around Helm charts that adds health monitoring and alerting', 'A built-in Kubernetes component for managing StatefulSets automatically'], answer: 1, explanation: 'An Operator is a custom controller that manages complex stateful applications like Postgres, Kafka, or Elasticsearch by encoding human operational knowledge. It uses CRDs to define new resource types such as PostgresCluster. The controller watches these custom resources and reconciles actual state to desired state, handling tasks like backups, failover, schema migrations, and scaling that generic Kubernetes primitives cannot do automatically.' },
];

const qna: QnaItem[] = [
  {
    q: 'How is a CRD different from a ConfigMap used to store custom data?',
    a: 'CRDs give you first-class Kubernetes resources: RBAC, watches, validation schema, kubectl support, and status subresource. ConfigMaps are untyped blobs with no schema validation or status tracking. CRDs also integrate with the Kubernetes API machinery — you get admission webhooks, informers, and proper reconciliation for free.',
  },
  {
    q: 'What is kubebuilder and how does it relate to controller-runtime?',
    a: 'kubebuilder is a CLI and framework for scaffolding Kubernetes controllers and CRDs in Go. It generates boilerplate (main.go, reconciler stubs, Makefile) and uses controller-gen to generate CRD manifests and RBAC from Go struct markers. controller-runtime is the underlying library that provides the Manager, Client, and reconciliation loop primitives — kubebuilder builds on top of it.',
  },
  {
    q: 'What is the Operator Maturity Model?',
    a: 'A 5-level scale for Operator sophistication: Level 1 (Basic Install — Helm/manifest install), Level 2 (Seamless Upgrades — handles upgrades without data loss), Level 3 (Full Lifecycle — backup, restore, scaling), Level 4 (Deep Insights — metrics, alerts, dashboards), Level 5 (Auto Pilot — self-tuning, auto-scaling, anomaly detection). Most production Operators target Level 3-4.',
  },
  {
    q: 'How does an Operator watch for changes to its CRDs?',
    a: 'The controller-runtime Manager sets up informers that watch the Kubernetes API server for changes to specified resource types using the watch verb (a long-lived HTTP connection that streams events). When a resource is created, updated, or deleted, the informer queues a reconcile request for that resource. The reconcile loop is then called with the resource\'s namespace/name.',
  },
  {
    q: 'What is the difference between the Operator SDK and kubebuilder?',
    a: 'kubebuilder is the official Kubernetes SIG project for building Go-based controllers. Operator SDK (by Red Hat) extends kubebuilder\'s scaffolding with additional support for Ansible-based and Helm-based Operators (for teams not writing Go). Both use controller-runtime under the hood. For Go controllers, they are nearly equivalent — kubebuilder is the leaner upstream choice.',
  },
  { q: 'How do you build a simple Kubernetes Operator?', a: 'Three main options: Operator SDK from Red Hat generates controller-runtime scaffolding with operator-sdk init; you define the CRD schema in api/v1/ and implement the reconcile loop in controllers/. Kubebuilder provides similar scaffolding and actually underpins the Operator SDK. Using controller-runtime directly in Go gives full control. The reconcile loop pattern is: watch for CRD events, fetch current cluster state, compute the difference, apply changes to reach desired state, and requeue on error. For non-Go use cases, Metacontroller lets you write reconcile logic as a webhook in any language.' },
];

const revision: RevisionSummary = {
  oneLiner: 'CRDs extend the K8s API with custom kinds; Operators are controllers that reconcile those custom resources — encoding operational knowledge as code.',
  mustKnow: [
    'CRD: defines a new resource type with spec/status; instances are Custom Resources',
    'Operator = controller watching CRDs; reconcile loop: Get → diff → act → update status → requeue',
    'Add finalizer BEFORE creating external resources to prevent orphans on deletion',
    'Update spec with r.Update(); update status with r.Status().Update() — never mix',
    'Check OperatorHub.io before writing a custom Operator — mature ones exist for most stateful systems',
    'kubebuilder: scaffold + controller-gen markers; Operator SDK: adds Ansible/Helm support',
  ],
  interviewFocus: [
    'What problem does the Operator pattern solve that Deployments cannot?',
    'What is a finalizer and why must you add it before creating external resources?',
    'Why are spec and status updated separately in a controller?',
    'Describe the reconciliation loop of a simple database Operator.',
  ],
};

@Component({
  selector: 'app-k8s-operators-crds',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './operators-crds.html',
  styleUrl: './operators-crds.scss',
})
export class K8sOperatorsCrds {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
