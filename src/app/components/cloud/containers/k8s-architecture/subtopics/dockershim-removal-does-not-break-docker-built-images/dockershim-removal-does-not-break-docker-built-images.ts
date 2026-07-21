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
  templateUrl: './dockershim-removal-does-not-break-docker-built-images.html',
  styleUrl: './dockershim-removal-does-not-break-docker-built-images.scss'
})
export class DockershimRemovalDoesNotBreakDockerBuiltImagesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states dockershim was removed, in one sentence, with no scope attached',
      points: [
        'The main page\'s own QnA answer for the Container Runtime Interface says: "Docker was originally used but required a shim (dockershim) that was removed in Kubernetes 1.24." That is the entire treatment — one clause, no elaboration on what removing it actually changed for anyone using Docker.',
        'Read on its own, especially by someone who builds images with `docker build` day to day, this single sentence is easy to over-read as "Kubernetes 1.24 dropped support for Docker" — a headline that circulated widely (and inaccurately) when the removal actually happened, precisely because of how briefly it is usually summarized.',
        'The main page never distinguishes between two very different things both casually called "Docker": the Docker Engine daemon running as a Kubernetes NODE\'s container runtime (this is what dockershim bridged to, and this is what changed), versus Docker as a BUILD TOOL producing container images on a developer\'s machine or in CI (this is completely unaffected).',
      ]
    },
    {
      heading: 'What dockershim actually was, and why removing it changes nothing about the images this hub\'s own Dockerfile and Multi-Stage Builds topics teach you to build',
      points: [
        'dockershim was a translation layer inside kubelet, letting kubelet speak to the Docker Engine daemon (which predates the CRI standard and never natively implemented it) as if it were a CRI-compliant runtime. Removing it means kubelet no longer has that translation path built in — nodes must run a genuinely CRI-native runtime instead, like containerd or CRI-O.',
        'Per Docker\'s own explanation of the change: "Container images created by Docker are compliant with the Open Container Initiative (OCI)... Your images that ran on Kubernetes yesterday with dockershim will run unchanged on Kubernetes 1.24 without dockershim." The OCI image format `docker build` produces was never the thing dockershim existed for — it was always runtime-agnostic, and every CRI implementation (containerd included) runs OCI images identically.',
        'The practical consequence lands entirely on cluster OPERATORS, not on anyone\'s local development workflow: a self-managed cluster\'s nodes need containerd or CRI-O actually installed and configured as the kubelet\'s runtime (most managed services — EKS, GKE, AKS — had already migrated their own node images to containerd well before 1.24 shipped) — but `docker build`, Dockerfiles, and every image this hub\'s own Dockerfile/Multi-Stage Builds topics produce continue working completely unchanged, on any CRI-compliant node, before or after the removal.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually changed vs. what stayed the same',
      language: 'bash',
      code: `# ── What stayed EXACTLY the same across the dockershim removal ───────────

docker build -t myapp:2.1.0 .          # unchanged
docker push ghcr.io/org/myapp:2.1.0    # unchanged

# The image produced is a standard OCI image -- a manifest + content-
# addressed layers, per the OCI Image Spec this hub's own Container
# Fundamentals topic already covers. Nothing about dockershim's
# removal touches this format, or how docker build produces it.

kubectl apply -f deployment.yaml
# image: ghcr.io/org/myapp:2.1.0
# Runs identically on a containerd node, a CRI-O node, or (before
# 1.24) a dockershim-bridged Docker Engine node -- the image itself
# has no idea, and no way to know, which CRI runtime is pulling and
# running it.

# ── What ACTUALLY changed -- purely a node-level runtime concern ──────────

# Before 1.24 (or on a cluster that never removed dockershim):
# kubelet -> dockershim (translation layer) -> Docker Engine daemon

# 1.24+ (dockershim removed):
# kubelet -> containerd (native CRI) directly
# -- OR --
# kubelet -> CRI-O (native CRI) directly

# Check which runtime a node is actually using:
kubectl get nodes -o jsonpath='{.items[*].status.nodeInfo.containerRuntimeVersion}'
# containerd://1.7.x        <- most common post-1.24 default
# (NOT docker://... anymore on a node with dockershim removed)`,
    },
    {
      label: 'Who this actually affects: cluster operators, not image builders',
      language: 'bash',
      code: `# The dockershim removal is an OPERATIONS concern for whoever
# manages the CLUSTER's own nodes -- not a developer-facing change
# to how images get built or what they contain.

# Self-managed cluster (kubeadm, on-prem, etc.):
# -- Node OS/runtime installation must include containerd or CRI-O
#    directly, configured as the kubelet's CRI socket.
# -- kubeadm's own 1.24 upgrade guide explicitly flags this as a
#    pre-upgrade check: verify nodes have a non-dockershim runtime
#    BEFORE upgrading kubelet to 1.24+.

# Managed cluster (EKS, GKE, AKS):
# -- Most had already migrated their DEFAULT node images to
#    containerd well before their own 1.24 support landed --
#    for many teams, this was a non-event they never had to act on.
# -- AWS's own EKS 1.24 announcement specifically called out the
#    containerd migration as already-completed prior groundwork,
#    not a new burden introduced by 1.24 itself.

# What NEITHER of the above changes:
docker build .          # still works, unchanged
# Dockerfile syntax, multi-stage builds, layer caching, BuildKit --
# none of it has any dependency on dockershim's presence or absence
# on the CLUSTER that eventually runs the resulting image.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer reads a headline claiming "Kubernetes 1.24 removed Docker support" and asks whether their team needs to rewrite their Dockerfiles or switch to a different image-building tool before their cluster upgrades to 1.24. Using this subtopic\'s theory, what is the accurate answer, and what — if anything — actually needs attention before the upgrade?',
    hint: 'Per this subtopic\'s theory, did dockershim removal change anything about the OCI image format docker build produces, or did it change something entirely on the cluster\'s own node-level runtime configuration?',
    solution: 'Per this subtopic\'s theory, the developer\'s Dockerfiles and their `docker build` workflow need zero changes — dockershim removal never touched the OCI image format, and every image already being built and pushed continues to run unchanged on any CRI-compliant node, before or after the removal. What actually needs attention before the upgrade is entirely a CLUSTER-OPERATIONS concern, not a development-workflow one: whoever manages the cluster\'s own nodes needs to confirm those nodes are running a genuinely CRI-native runtime (containerd or CRI-O) rather than relying on the now-removed dockershim translation layer to bridge to Docker Engine. For a team on a managed service (EKS, GKE, AKS), this is very likely already the case, since most providers migrated their default node images to containerd well before their own 1.24 rollout. For a self-managed cluster, it is worth explicitly verifying node runtime configuration as a pre-upgrade check — but this is entirely separate from, and has no bearing on, how the team builds images or writes Dockerfiles.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Kubernetes 1.24 removing dockershim means Docker-built images, or Dockerfiles themselves, are no longer supported or need to be rebuilt with a different tool.',
      reality: 'Per this subtopic\'s theory, dockershim removal never touched the OCI image format docker build produces — per Docker\'s own explanation, images that ran on Kubernetes with dockershim continue running completely unchanged on 1.24+ without it, on any CRI-compliant node.'
    },
    {
      thought: 'dockershim and Docker (the image-building tool used via docker build) are the same thing, so removing one implies removing support for the other.',
      reality: 'Per this subtopic\'s theory, dockershim was a narrow, kubelet-internal translation layer bridging to the Docker Engine DAEMON as a node-level container runtime — a completely separate concern from Docker as a build tool producing standard OCI images, which has no dependency on dockershim at all.'
    },
    {
      thought: 'Every Kubernetes cluster needed active operator intervention to handle the dockershim removal when upgrading to 1.24.',
      reality: 'Per this subtopic\'s exercise, this depends entirely on how the cluster is managed — most managed services (EKS, GKE, AKS) had already migrated their own default node images to containerd well before their 1.24 rollout, making it a non-event for many teams; only self-managed clusters generally needed an explicit pre-upgrade runtime check.'
    }
  ];
}
