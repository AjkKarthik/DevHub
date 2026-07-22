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
  templateUrl: './deleting-an-immutable-configmap-breaks-new-pods-not-running-ones.html',
  styleUrl: './deleting-an-immutable-configmap-breaks-new-pods-not-running-ones.scss'
})
export class DeletingAnImmutableConfigmapBreaksNewPodsNotRunningOnesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory describes the content-hash rotation pattern, but never what happens to the OLD object',
      points: [
        'The main page\'s own theory explains: "Tools like Reloader or Kustomize\'s configMapGenerator with content-hash suffixes solve the \'pods don\'t restart on config change\' problem by generating a new ConfigMap name per content change, forcing a rolling deployment when the referencing Deployment updates." This describes creating the NEW object and rolling the Deployment to it — but never says what should happen to the OLD, now-unreferenced ConfigMap, or what happens if it gets deleted too early.',
        'The main page\'s own QnA on `immutable: true` says changing an immutable object requires you to "delete and recreate it (or create a new one and update the Deployment to reference it)" — again focused on the CREATE side of the rotation, silent on deletion timing or sequencing risk for the OLD object.',
      ]
    },
    {
      heading: 'What actually happens if the old ConfigMap is deleted mid-rollout: already-running Pods keep working, new ones don\'t',
      points: [
        'Per Kubernetes\' own documented behavior, kubelet stores a mounted ConfigMap\'s contents on the node\'s local filesystem once a Pod starts using it — an ALREADY-RUNNING Pod with that volume already mounted keeps functioning normally even after the source ConfigMap object is deleted from the API server; the mount point and its last-synced content remain in place.',
        'The danger is specifically for NEW Pod creation (or an existing Pod restarting/being rescheduled) that still references the now-deleted ConfigMap name: kubelet cannot mount a volume for an object that no longer exists, and the Pod fails to start — commonly surfacing as `CreateContainerConfigError` — until either the ConfigMap is restored or the Pod\'s own spec is updated to reference a name that still exists.',
        'This creates a real sequencing hazard specifically for the content-hash rotation pattern the main page\'s own theory recommends: if a cleanup job (or a person) deletes the OLD, superseded ConfigMap before the Deployment\'s own rolling update to the NEW hash-suffixed name has fully completed across every replica, any of the OLD Deployment\'s Pods that haven\'t yet been replaced — and any that get rescheduled to a different node in the meantime — will fail to (re)start, even though the rotation was otherwise done "correctly."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Already-running Pods survive deletion of their own ConfigMap',
      language: 'bash',
      code: `# The main page's own immutable: true ConfigMap, already mounted
# by a running Pod:
kubectl get pod api-7f9c8-x2k4p -o jsonpath='{.spec.volumes[0].configMap.name}'
# app-config-a1b2c3   <- content-hash-suffixed name

# Delete the ConfigMap object directly from the API server:
kubectl delete configmap app-config-a1b2c3

# The ALREADY-RUNNING Pod keeps working -- kubelet already synced
# this ConfigMap's content to the node's local filesystem when the
# Pod started, and does not tear down an existing mount just because
# the source object disappeared:
kubectl exec api-7f9c8-x2k4p -- cat /etc/app/app.properties
# feature.dark-mode=true
# feature.beta-ui=false
# -- still readable, completely unaffected by the deletion`,
    },
    {
      label: 'But a NEW Pod referencing the same deleted name fails outright',
      language: 'bash',
      code: `# Same Deployment, same still-referenced (now deleted) ConfigMap
# name -- but the node reschedules this replica, or it crashes and
# needs a fresh Pod:
kubectl delete pod api-7f9c8-x2k4p
# pod "api-7f9c8-x2k4p" deleted

# The ReplicaSet creates a REPLACEMENT Pod, referencing the SAME
# (now-deleted) app-config-a1b2c3 ConfigMap name from its own Pod
# template -- kubelet cannot mount a volume for an object that no
# longer exists:
kubectl get pods
# NAME               READY   STATUS                       AGE
# api-7f9c8-newpod   0/1     CreateContainerConfigError    45s

kubectl describe pod api-7f9c8-newpod | grep -A2 Events
# Warning  Failed  kubelet  Error: configmap "app-config-a1b2c3" not found

# The fix is sequencing, not a Kubernetes bug: never delete an OLD,
# superseded ConfigMap/Secret until EVERY Pod that could still
# reference it (across the full rollout, including any future
# reschedule) has been confirmed on the NEW name -- kubectl rollout
# status deployment/api reaching "successfully rolled out" is the
# actual signal to wait for before cleanup, not just "the new
# ConfigMap was created."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own content-hash-suffixed ConfigMap rotation pattern, a team\'s cleanup script deletes the OLD ConfigMap immediately after creating the NEW one and starting <code>kubectl rollout restart deployment/api</code>, without waiting for the rollout to actually finish. The rollout appears to succeed at first, but a few hours later, one Pod crashes and its replacement gets stuck in <code>CreateContainerConfigError</code>. Using this subtopic\'s theory, why did this only surface hours later instead of immediately during the rollout?',
    hint: 'What happens to a Pod that is ALREADY running with the old ConfigMap mounted, at the moment the old ConfigMap is deleted, versus what happens the next time THAT specific Pod needs to be recreated?',
    solution: 'Per this subtopic\'s theory, this surfaced hours later because the crashed Pod had been running successfully the entire time on its ALREADY-MOUNTED copy of the old ConfigMap\'s content, which kubelet had synced to the node\'s local filesystem before the ConfigMap was deleted — an already-running Pod is unaffected by its source ConfigMap being deleted out from under it. The problem only became visible once that specific Pod actually needed to be recreated (in this case, after a crash) — at that point, kubelet attempted to mount a volume referencing the old, now-deleted ConfigMap name from the Pod template, found no such object, and failed with CreateContainerConfigError. If the rollout to the new content-hash-suffixed ConfigMap name had genuinely completed across every replica before the old ConfigMap was deleted, no Pod would ever have been left referencing the deleted name, and this failure could never have occurred no matter when or why a Pod later needed to be recreated. The fix is sequencing the cleanup after confirming kubectl rollout status shows the rollout fully complete, not immediately after starting it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Deleting a ConfigMap or Secret that a running Pod still references immediately breaks that Pod, the same way deleting a file out from under an open file handle would corrupt an active read.',
      reality: 'Per this subtopic\'s theory, an already-running Pod is unaffected — kubelet already synced the ConfigMap\'s content to the node\'s local filesystem when the Pod started, and that mount keeps serving the last-synced content regardless of what happens to the source object afterward.'
    },
    {
      thought: 'If a rollout to a new content-hash-suffixed ConfigMap "looks successful" (all Pods show Running), it is now safe to delete the old ConfigMap immediately.',
      reality: 'Per this subtopic\'s exercise, "looks successful" at a glance isn\'t the same as kubectl rollout status confirming full completion — and even after a genuinely complete rollout, any FUTURE Pod recreation (a crash, a node drain, a reschedule) that somehow still references the old name would fail if that old object were deleted too early relative to every possible future recreation, not just the current moment.'
    },
    {
      thought: 'The main page\'s own recommendation to use content-hash-suffixed ConfigMap names (via Reloader or Kustomize\'s configMapGenerator) fully solves the "pods don\'t restart on config change" problem with no remaining sequencing considerations.',
      reality: 'Per this subtopic\'s theory, the rotation pattern itself is sound, but it introduces a NEW responsibility the main page never mentions: safely timing the deletion of the superseded ConfigMap relative to the rollout\'s actual completion, to avoid a CreateContainerConfigError on any Pod recreated after premature cleanup.'
    }
  ];
}
