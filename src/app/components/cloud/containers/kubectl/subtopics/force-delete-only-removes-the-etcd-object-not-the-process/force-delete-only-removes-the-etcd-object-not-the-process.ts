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
  templateUrl: './force-delete-only-removes-the-etcd-object-not-the-process.html',
  styleUrl: './force-delete-only-removes-the-etcd-object-not-the-process.scss'
})
export class ForceDeleteOnlyRemovesTheEtcdObjectNotTheProcessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry states the risk but not the mechanism producing it',
      points: [
        'The main page\'s own "Force-deleting a Pod" mistake entry warns: "Pod removed from API but may still be running on node... Force-deleting bypasses the graceful shutdown sequence and can leave zombie processes on the node or cause two instances of the Pod running simultaneously." This correctly states WHAT can go wrong, but never explains WHY the object can vanish from `kubectl get pods` while a real process keeps running.',
        'The intuitive assumption is that `kubectl delete --grace-period=0 --force` is a stronger, more forceful version of a normal delete — surely it reaches further into the cluster to guarantee the container actually stops? The opposite is closer to the truth: it reaches LESS far than a normal delete, not more.',
        'A normal `kubectl delete pod` is a coordinated handshake between the API server and the kubelet on the pod\'s node. `--grace-period=0 --force` specifically skips waiting for that handshake to complete — it does not add extra force to make the container stop faster.',
      ]
    },
    {
      heading: 'What actually happens, step by step, and why an unreachable node is the dangerous case',
      points: [
        'A normal delete: the API server marks the Pod for deletion (setting a deletion timestamp), the kubelet on that pod\'s node notices via its own watch, sends SIGTERM to the container(s), waits up to `terminationGracePeriodSeconds`, sends SIGKILL if needed, and only THEN reports back to the API server that the Pod has actually terminated — at which point the API server finally removes the object.',
        '`--grace-period=0 --force` skips the LAST step of that handshake: the API server removes the Pod object from etcd immediately, without waiting for the kubelet to confirm anything happened. Kubernetes does still attempt to notify the kubelet on a best-effort basis — but "best-effort" is the operative phrase, not a guarantee.',
        'On a healthy, reachable node, the kubelet usually does still receive word and cleans up the actual container relatively promptly, even though the API object is already gone by the time that happens. But on an unreachable or NotReady node — precisely the scenario where someone is most tempted to force-delete a stuck Pod — the kubelet never receives that notification at all, since it has no working connection to the API server to receive it over. The container keeps running, completely unaware that Kubernetes considers it deleted, for as long as the node stays unreachable.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing what a normal delete waits for, that --force skips',
      language: 'bash',
      code: `# ── A normal, graceful delete ──────────────────────────────────────────
kubectl delete pod api-7d9b8c-abc12
#
# 1. API server sets deletionTimestamp on the Pod object (object
#    still exists, now marked for deletion).
# 2. kubelet (on the pod's OWN node) notices via its watch.
# 3. kubelet sends SIGTERM to the container(s).
# 4. kubelet waits up to terminationGracePeriodSeconds (default 30s).
# 5. kubelet sends SIGKILL if the container hasn't exited yet.
# 6. kubelet reports back to the API server: "this Pod has actually
#    terminated."
# 7. ONLY NOW does the API server remove the Pod object from etcd.
#
# "kubectl get pods" no longer showing the Pod means the ENTIRE
# above sequence, including the kubelet's own confirmation, has
# genuinely completed.

# ── --grace-period=0 --force ───────────────────────────────────────────
kubectl delete pod api-7d9b8c-abc12 --grace-period=0 --force
#
# 1. API server removes the Pod object from etcd IMMEDIATELY.
# 2. Kubernetes attempts (best-effort, not guaranteed) to also
#    notify the kubelet.
# 3. Steps 3-6 from the normal sequence above may or may not ever
#    happen, and the API server does not wait to find out either way.
#
# "kubectl get pods" no longer showing the Pod means ONLY that the
# etcd object is gone -- it says nothing about whether the actual
# container process has stopped.`,
    },
    {
      label: 'Why an unreachable node is specifically the dangerous case',
      language: 'bash',
      code: `# The scenario the main page's own mistake entry is really warning
# about, made explicit:

kubectl get nodes
# NAME       STATUS
# worker-3   NotReady   <- kubelet on this node has no working
#                           connection to the API server right now

# A Pod stuck Terminating on worker-3 gets force-deleted:
kubectl delete pod api-7d9b8c-abc12 --grace-period=0 --force -n production
# pod "api-7d9b8c-abc12" force deleted

kubectl get pods -n production
# (api-7d9b8c-abc12 is gone from this list)

# But on worker-3 itself, completely unaware anything happened
# (SSH'd into the node, or once it later reconnects):
crictl ps | grep api-7d9b8c
# CONTAINER   IMAGE          STATE     NAME
# a1b2c3d4    myapp:2.1.0    Running   api
# -- still running. The kubelet on this node never received the
#    "please terminate this" notification at all, because it has
#    no working connection to receive anything over.

# If a Deployment's own ReplicaSet controller ALSO creates a
# replacement Pod for the "missing" one (since the object is gone
# from its perspective), you can genuinely end up with two live
# instances of the same logical Pod serving traffic simultaneously
# once worker-3 reconnects -- exactly the risk the main page's own
# mistake entry names, now traced to its actual mechanism.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Pod is stuck in Terminating state on a node that shows NotReady. An engineer, following the main page\'s own mistake-entry advice to "investigate the root cause first," confirms the node is genuinely unreachable (not just slow) and decides force-deleting is the least-bad option available, accepting the documented risk. Using this subtopic\'s theory, what specific step could the engineer take to reduce (not eliminate) the chance of the container actually still running and causing a duplicate-instance problem later?',
    hint: 'Per this subtopic\'s theory, does the danger scenario depend on the node EVENTUALLY reconnecting while the container is still running — and is there a way to make that specific outcome less likely, given the node is currently unreachable?',
    solution: 'Per this subtopic\'s theory, the real risk requires the node to eventually reconnect while the force-deleted container is STILL running on it — if the node never comes back (hardware failure, permanent decommission), the "zombie process" and "duplicate instance" concerns become moot, since nothing is left to reconnect and confuse the cluster. One concrete mitigation: before or immediately after force-deleting the Pod, cordon and drain the node (`kubectl cordon worker-3`, then `kubectl drain worker-3 --ignore-daemonsets --force` once it\'s reachable again, or ensuring the node is fenced/powered off at the infrastructure level if it\'s truly unrecoverable) — this doesn\'t retroactively stop the orphaned container, but it prevents the node from silently rejoining the cluster and having its already-running (but Kubernetes-forgotten) container coexist with a fresh replacement Pod the ReplicaSet controller creates elsewhere. The underlying force-delete risk this subtopic\'s theory describes isn\'t something a kubectl flag can fully eliminate — the mitigation is at the node/infrastructure level, not the Pod-deletion command itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'kubectl delete --grace-period=0 --force is a MORE forceful version of a normal delete, reaching further into the cluster to guarantee the container actually stops.',
      reality: 'Per this subtopic\'s theory, it is the opposite — --force reaches LESS far than a normal delete. A normal delete waits for the kubelet to confirm the container has actually terminated before removing the API object; --force skips that wait entirely, removing the object immediately regardless of whether the container has stopped.'
    },
    {
      thought: 'Once kubectl get pods no longer shows a force-deleted Pod, the underlying container process is guaranteed to have stopped.',
      reality: 'Per this subtopic\'s exercise, the Pod disappearing from kubectl get pods only means the etcd object is gone — it says nothing about the actual container, which may still be running, especially on an unreachable or NotReady node where the kubelet never even received notification of the deletion.'
    },
    {
      thought: 'The zombie-process risk from force-deleting a Pod is roughly the same regardless of whether the pod\'s node is healthy or unreachable at the time.',
      reality: 'Per this subtopic\'s theory, the risk is specifically concentrated on unreachable/NotReady nodes — on a healthy, reachable node, the kubelet usually still receives the best-effort notification and cleans up promptly even though the API object is already gone; on an unreachable node, it never receives it at all for as long as the node stays disconnected.'
    }
  ];
}
