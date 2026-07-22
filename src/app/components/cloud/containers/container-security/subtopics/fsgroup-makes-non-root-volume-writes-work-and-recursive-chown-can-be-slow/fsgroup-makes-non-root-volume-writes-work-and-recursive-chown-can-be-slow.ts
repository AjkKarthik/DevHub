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
  templateUrl: './fsgroup-makes-non-root-volume-writes-work-and-recursive-chown-can-be-slow.html',
  styleUrl: './fsgroup-makes-non-root-volume-writes-work-and-recursive-chown-can-be-slow.scss'
})
export class FsgroupMakesNonRootVolumeWritesWorkAndRecursiveChownCanBeSlowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own hardened Pod spec sets fsGroup, but never explains it anywhere',
      points: [
        'The main page\'s own "Hardened Pod spec" code tab sets `fsGroup: 2000` right alongside `runAsNonRoot: true` and `runAsUser: 1000` in the Pod-level securityContext — but neither the "Security Contexts" theory section, the quickRef, nor the QnA ever explains what fsGroup actually does or why it appears in that exact combination.',
        'The main page\'s own QnA answer on readOnlyRootFilesystem explains mounting emptyDir volumes at writable paths like /tmp — but never mentions that a non-root container process (runAsUser: 1000) can still get a permission-denied error writing to a freshly-mounted emptyDir volume, EVEN THOUGH the Pod-level security context otherwise looks fully correct, unless something separately grants that UID write access to the volume.',
      ]
    },
    {
      heading: 'What fsGroup actually does: it owns the volume\'s GID, closing the exact gap runAsNonRoot opens',
      points: [
        'Per Kubernetes\' own documented behavior, `fsGroup` sets a supplementary group ID that the kubelet applies to the OWNERSHIP of supported mounted volumes (emptyDir, PersistentVolumeClaim) — Kubernetes changes the volume\'s group ownership to this GID (and typically sets the setgid bit) when the volume is mounted, so any process running with that group — regardless of its own UID — can read and write within it.',
        'This is precisely what makes the main page\'s own `runAsUser: 1000` + emptyDir-for-/tmp pattern actually work in practice: without fsGroup, a freshly-created emptyDir volume is typically owned by root with restrictive permissions, and UID 1000 has no inherent right to write to it — the container would hit a "permission denied" error trying to use its own designated writable scratch space, completely independent of whether readOnlyRootFilesystem or runAsNonRoot were configured correctly.',
        'This ownership change is not free — per Kubernetes\' own 1.20 fsGroupChangePolicy release notes, kubelet must RECURSIVELY chown() and chmod() every file and directory in the volume on every mount, which can be a slow, expensive operation for a large PVC with many small files, adding real Pod-startup latency; `fsGroupChangePolicy: OnRootMismatch` skips this recursive walk when the volume root already has the correct ownership, but this optimization has NO effect on ephemeral volume types like emptyDir, Secret, or ConfigMap mounts, which are unaffected by the policy either way.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without fsGroup: a "correctly" hardened Pod still fails to write',
      language: 'bash',
      code: `# The main page's own Pod securityContext, minus fsGroup -- looks
# fully hardened by every OTHER field the theory section covers:
# securityContext:
#   runAsNonRoot: true
#   runAsUser: 1000
#   # fsGroup: 2000        <- removed
# containers:
#   - securityContext:
#       readOnlyRootFilesystem: true
#   volumeMounts:
#     - name: tmp
#       mountPath: /tmp
# volumes:
#   - name: tmp
#     emptyDir: {}

kubectl logs api-7d9f8-x2k4p
# Error: EACCES: permission denied, open '/tmp/upload-abc123.tmp'
# -- the app tries to write to its OWN designated writable scratch
#    path (exactly matching the main page's own QnA advice), and
#    still fails, because UID 1000 has no write access to the
#    emptyDir volume's own root-owned default permissions.

kubectl exec api-7d9f8-x2k4p -- ls -ld /tmp
# drwxr-xr-x 2 root root 4096 ... /tmp
# -- owned by root, mode 755: UID 1000 can read/list, but not write`,
    },
    {
      label: 'With fsGroup: the volume\'s own GID is set to match',
      language: 'bash',
      code: `# The main page's own actual code tab -- fsGroup: 2000 restored:
# securityContext:
#   runAsNonRoot: true
#   runAsUser: 1000
#   fsGroup: 2000

kubectl exec api-7d9f8-x2k4p -- ls -ld /tmp
# drwxrwsr-x 2 root 2000 4096 ... /tmp
# -- group ownership changed to GID 2000 (fsGroup's value), and the
#    setgid bit (the "s" in "rws") is set -- UID 1000's process,
#    running with supplementary group 2000, can now write here.

kubectl logs api-7d9f8-x2k4p
# upload-abc123.tmp written successfully
# -- the exact same app code, same UID, only difference is fsGroup
#    being present in the Pod-level securityContext.

# On a large PVC (not emptyDir), watch the startup cost of the
# recursive chown -- fsGroupChangePolicy defaults to "Always":
kubectl describe pod slow-startup-pod | grep -A2 Events
# Normal  Pulled   kubelet  Container image pulled
# Normal  Created  kubelet  Created container
# (long gap here -- kubelet recursively chown/chmod-ing every file
#  in a multi-GB PVC before the container actually starts running)
# Normal  Started  kubelet  Started container`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own hardened Pod spec exactly, but a reviewer removes <code>fsGroup: 2000</code> during a cleanup pass, reasoning that <code>runAsUser: 1000</code> already fully controls what the container can do, and <code>fsGroup</code> looked redundant. After deploying, the application — which writes temporary upload files to the mounted <code>/tmp</code> emptyDir volume, exactly as the main page\'s own QnA recommends — starts crashing with permission-denied errors. Using this subtopic\'s theory, why does removing fsGroup break something that runAsUser alone was supposed to already handle?',
    hint: 'runAsUser controls what UID the container PROCESS runs as. What controls the OWNERSHIP of the volume that process is trying to write into?',
    solution: 'Per this subtopic\'s theory, runAsUser and fsGroup control two entirely different things: runAsUser sets the UID the container process itself runs as, while fsGroup sets the GROUP OWNERSHIP that Kubernetes applies to the mounted volume\'s files at mount time. These are not redundant — a process running as UID 1000 has no inherent permission to write into a volume that is still owned by root with restrictive permissions, regardless of how correctly runAsUser is configured. Without fsGroup, the emptyDir volume mounted at /tmp remains owned by root (the default), and UID 1000\'s write attempts fail with a permission-denied error — exactly the symptom described. Restoring fsGroup: 2000 causes Kubernetes to change the volume\'s group ownership to GID 2000 and set the setgid bit, so the container\'s process (running with that supplementary group) can write to the volume normally. The reviewer\'s "looked redundant" judgment missed that runAsUser and fsGroup solve two separate halves of the same "non-root container needs to write somewhere" problem — the main page\'s own hardened Pod spec sets both together for exactly this reason, even though neither the theory section nor QnA ever explains fsGroup\'s role.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'runAsUser: 1000 alone is sufficient to let a non-root container write to any volume mounted into it — fsGroup is a redundant, optional extra field for the same purpose.',
      reality: 'Per this subtopic\'s theory, runAsUser and fsGroup control different things entirely — runAsUser sets the process\'s own UID, while fsGroup controls the mounted volume\'s GROUP ownership. Without fsGroup, a non-root UID commonly has no write access at all to a volume that defaults to root ownership, regardless of runAsUser.'
    },
    {
      thought: 'fsGroup only matters for PersistentVolumeClaims backed by real network/cloud storage — an ephemeral emptyDir volume doesn\'t need it since it\'s created fresh for the Pod anyway.',
      reality: 'Per this subtopic\'s exercise, fsGroup applies to emptyDir volumes too — a freshly-created emptyDir is still typically root-owned by default, and a non-root container writing to it needs fsGroup\'s group-ownership change exactly the same way a PVC-backed volume does.'
    },
    {
      thought: 'Setting fsGroup on a Pod has no meaningful performance cost — it is a purely declarative permission setting with no runtime overhead.',
      reality: 'Per this subtopic\'s theory, kubelet must recursively chown() and chmod() every file and directory in a mounted volume on each mount by default, which can add real, measurable Pod-startup latency for a large PVC with many files — fsGroupChangePolicy: OnRootMismatch can skip this for volumes whose root already matches, but has no effect on ephemeral volume types like emptyDir at all.'
    }
  ];
}
