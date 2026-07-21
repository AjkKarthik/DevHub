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
  templateUrl: './init-containers-share-the-pods-network-namespace-not-just-its-volumes.html',
  styleUrl: './init-containers-share-the-pods-network-namespace-not-just-its-volumes.scss'
})
export class InitContainersShareThePodsNetworkNamespaceNotJustItsVolumesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA answer originally claimed the opposite of what actually happens',
      points: [
        'The main page\'s own QnA answer on init containers previously stated: "They share the Pod\'s volumes but not the network namespace." As part of verifying this content batch, that claim was checked against Kubernetes\' own documented Pod networking model and found to be backwards — the QnA text has been corrected as part of this batch.',
        'The main page\'s own code tab uses `nc -z postgres-headless.data 5432` inside an init container to wait for a dependency — this command only makes sense to run FROM the init container\'s own network stack, and its success confirms the exact same network reachability the app container will experience moments later, which is only true because they share one network namespace, not despite it.',
      ]
    },
    {
      heading: 'What actually happens: network namespace sharing is a Pod-level guarantee, with no init/app distinction',
      points: [
        'Per Kubernetes\' own Pod networking model, EVERY container in a Pod — init containers and app containers alike, with no exception — shares the exact same network namespace: the same Pod IP address, the same localhost, and the same port space. This is one of the foundational guarantees that defines what a "Pod" even is, distinct from and prior to any container-runtime-level configuration.',
        'This is precisely why the main page\'s own `wait-for-db` init container pattern works at all: `nc -z postgres-headless.data 5432` succeeding from inside the init container is a reliable signal that the SAME network path will be reachable from the app container that starts moments later, since both are, quite literally, using the identical network interface and IP.',
        'What init containers do NOT automatically share with each other or the app container is a PID/process namespace (each container still has its own, unless the Pod explicitly sets `shareProcessNamespace: true`) and, since they run strictly sequentially and are torn down before the next one starts, they never share concurrent RUNTIME state with app containers — but "not the same network namespace" was never one of the actual differences.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own wait-for-db pattern only works BECAUSE the network is shared',
      language: 'bash',
      code: `# The main page's own init container, verbatim:
# initContainers:
#   - name: wait-for-db
#     image: busybox:1.35
#     command: ['sh', '-c',
#       'until nc -z postgres-headless.data 5432; do echo waiting; sleep 2; done']
#   - name: run-migrations
#     image: ghcr.io/org/api-migrate:v1.2.0
#     command: ['./migrate', 'up']
# containers:
#   - name: api
#     image: ghcr.io/org/api:v1.2.0

# Confirm all three -- two init containers plus the app container --
# genuinely see the SAME Pod IP, proving shared network namespace:
kubectl exec api-7d9f8-x2k4p -c wait-for-db -- hostname -i 2>/dev/null \\
  || kubectl debug api-7d9f8-x2k4p -it --image=busybox --target=wait-for-db -- hostname -i
# 10.244.2.17

kubectl exec api-7d9f8-x2k4p -c api -- hostname -i
# 10.244.2.17
# -- IDENTICAL. If init containers had their own separate network
#    namespace, wait-for-db's own nc -z check succeeding would tell
#    you NOTHING about whether the app container could reach the
#    same service moments later -- the whole pattern would be
#    unreliable by design. It works precisely because they don't.`,
    },
    {
      label: 'What init containers genuinely do NOT share',
      language: 'bash',
      code: `# What actually differs between init and app containers -- NOT
# network, but process/lifecycle isolation:

# 1. Separate PID namespaces by default (unless shareProcessNamespace: true):
kubectl exec api-7d9f8-x2k4p -c api -- ps aux
# PID   COMMAND
# 1     node server.js
# -- wait-for-db's own busybox "sh" process from earlier is NOT
#    visible here -- each container's own PID 1 is independent,
#    unlike the shared network stack.

# 2. No concurrent runtime overlap -- strictly sequential:
kubectl get events --field-selector involvedObject.name=api-7d9f8-x2k4p \\
  -n production --sort-by='.lastTimestamp' | grep -i pull
# Pulled  wait-for-db image
# Pulled  run-migrations image     <- only after wait-for-db exits 0
# Pulled  api image                <- only after run-migrations exits 0
# -- each init container fully completes (or the Pod restarts) before
#    the next one, and the app container, ever starts -- this is the
#    real, documented difference worth knowing, not network isolation.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own pattern, a developer writes an init container that runs <code>nc -z postgres-headless.data 5432</code> to wait for the database before the app container starts. A teammate objects: "that check is pointless — the init container has its own separate network namespace, so it succeeding tells you nothing about whether the APP container will actually be able to reach the database." Using this subtopic\'s theory, is the teammate\'s objection correct?',
    hint: 'Do init containers and app containers within the same Pod have separate network namespaces, or the same one?',
    solution: 'No — per this subtopic\'s theory, the teammate\'s objection is based on a false premise. Every container within a Pod, init or app, shares the exact same network namespace: the same Pod IP, the same localhost, the same port space, with no exception for init containers. This is a foundational, Pod-level guarantee, not something configured per-container. Because of this shared network namespace, the init container\'s nc -z postgres-headless.data 5432 check succeeding is a completely reliable signal that the identical network path will be reachable from the app container moments later — they are using the literal same network interface, not a separate, isolated one. If init containers genuinely had their own separate network namespace (as the teammate claims), the main page\'s own wait-for-dependency pattern would indeed be unreliable — but that claim is incorrect, which is exactly why this pattern works as a legitimate, commonly-used technique rather than a coincidence.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Init containers run in a separate network namespace from the Pod\'s app containers, since they are conceptually a distinct, earlier phase of the Pod\'s lifecycle.',
      reality: 'Per this subtopic\'s theory (and the main page\'s own corrected QnA), init containers share the exact same network namespace as every other container in the Pod — same IP, same localhost, same port space — this is a Pod-level guarantee with no init/app distinction at all.'
    },
    {
      thought: 'Since init containers and app containers are isolated from each other in some way, a network reachability check performed in an init container (like the main page\'s own wait-for-db pattern) doesn\'t reliably predict what the app container will experience.',
      reality: 'Per this subtopic\'s exercise, this pattern is reliable specifically BECAUSE network namespace is shared — the isolation that does exist between init and app containers (separate PID namespaces, strictly sequential execution) doesn\'t affect network reachability at all.'
    },
    {
      thought: 'Init containers share literally everything with app containers within the same Pod, since they\'re part of the same Pod object.',
      reality: 'Per this subtopic\'s theory, sharing is selective, not total — network namespace and mounted volumes are shared, but PID namespace is NOT shared by default (each container gets its own, unless shareProcessNamespace: true is explicitly set), and init containers never run concurrently with app containers at all.'
    }
  ];
}
