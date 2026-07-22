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
  templateUrl: './user-namespace-remapping-not-default.html',
  styleUrl: './user-namespace-remapping-not-default.scss'
})
export class UserNamespaceRemappingNotDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own bullet describes user namespaces as if the protection is automatic',
      points: [
        'The main page\'s theory says: "user namespace: maps container UIDs to different host UIDs — enables rootless containers where container \'root\' (UID 0) maps to an unprivileged host UID." Listed alongside pid, net, mnt, uts, and ipc — five namespaces that ARE always active for every container Docker creates — it reads as one more namespace quietly doing its job in the background.',
        'It is not. Of the six namespaces the main page lists, five are unconditionally created for every container. The user namespace is the one exception: standard Docker, out of the box, does NOT remap container UIDs to different host UIDs at all — container UID 0 maps directly onto host UID 0, the real host root.',
        'This directly affects how seriously to take the main page\'s own separate "Running as root inside the container" mistake entry: on a default Docker install, a process that escapes the container\'s other namespace boundaries (via a kernel exploit, for instance) while running as container UID 0 is not landing on some harmless placeholder UID — it is landing on literal host root, exactly because the one namespace that would have prevented that was never enabled.',
      ]
    },
    {
      heading: 'What actually has to be configured before "container root maps to an unprivileged host UID" becomes true',
      points: [
        'Docker\'s own documentation is explicit that this is opt-in, daemon-wide configuration: enabling `userns-remap` in `/etc/docker/daemon.json` (or via the `dockerd --userns-remap` flag) is what activates the mapping — before that, there is no remapping in effect at all, for any container.',
        'Once configured, the remapping is a genuine UID SHIFT, not a 1:1 substitution: Docker\'s own example shows container UID 0 landing on some arbitrary high host UID (e.g. 231072), UID 1 landing on 231073, and so on — a whole contiguous BLOCK of otherwise-unprivileged host UIDs gets carved out and mapped in sequence to the container\'s own UID range.',
        'There is a completely separate, more common alternative that achieves a related goal through a different mechanism entirely: "rootless Docker," where the Docker DAEMON ITSELF runs as an unprivileged host user (not root), using user namespaces automatically as part of how the daemon is installed and started — this is a different opt-in setup than `userns-remap`, and conflating the two is easy, since both involve "user namespaces" and "rootless," but only `userns-remap` changes what UID a ROOT-CONTAINER-PROCESS is is mapped to on an otherwise-standard, root-running daemon.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the main page\'s own USER instruction actually protects against, unqualified',
      language: 'bash',
      code: `# The main page's own "right" fix for running as root:
# FROM node:20-alpine
# COPY --chown=node:node . .
# USER node
# CMD ["node", "server.js"]

# On a DEFAULT Docker install (no userns-remap configured):
docker exec myapp id
# uid=1000(node) gid=1000(node)   <- non-root INSIDE the container

# This USER instruction is real, load-bearing protection -- but it
# works by making the container's own process simply not BE UID 0
# in the first place. It has nothing to do with user namespaces
# being active; user namespaces are not in play here at all.

# ── If a container is instead left running as root (no USER line) ──
docker run --rm alpine id
# uid=0(root) gid=0(root)   <- container root

# On a default Docker install, that "root" IS host UID 0:
docker run --rm -v /:/hostfs alpine chroot /hostfs whoami
# root   <- a root container process can freely chroot into the
#           host filesystem and act as genuine host root, because
#           no user namespace remapping is standing between them`,
    },
    {
      label: 'Turning on userns-remap -- what actually changes',
      language: 'bash',
      code: `# /etc/docker/daemon.json
# {
#   "userns-remap": "default"
# }
# (requires: sudo systemctl restart docker)

# Docker auto-creates a dockremap user + a UID/GID subordinate range
# in /etc/subuid and /etc/subgid, e.g.:
#   dockremap:231072:65536
# meaning host UIDs 231072-296607 are reserved for this remapping.

# NOW, with userns-remap active, the SAME root container:
docker run --rm alpine id
# uid=0(root) gid=0(root)        <- still looks like root INSIDE

# ...but on the HOST side, that process is actually running as:
ps -o pid,user -C alpine
# PID   USER
# 4821  231072                   <- an ordinary, unprivileged host UID

# The chroot-into-host-filesystem trick from the "before" example
# now fails with a permission error, because host UID 231072 has no
# special privilege on the host at all -- THIS is what "container
# root maps to an unprivileged host UID" actually requires to be true.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team reads the main page\'s own user namespace bullet, concludes "our containers already get rootless protection since Docker sets this up automatically," and does not add a USER instruction to a Dockerfile that currently runs as root, reasoning the user namespace will contain the blast radius anyway. Using this subtopic\'s theory, is that reasoning correct on a standard, unconfigured Docker installation?',
    hint: 'Per this subtopic\'s theory, of the six namespaces the main page lists, how many are active by default with zero configuration, and is the user namespace one of them?',
    solution: 'The reasoning is incorrect, and the gap is exactly the one this subtopic\'s theory identifies. Per this subtopic\'s theory, five of the six namespaces the main page lists (pid, net, mnt, uts, ipc) are created automatically for every container with no configuration required — but the user namespace is the exception, requiring `userns-remap` to be explicitly enabled in the Docker daemon\'s own configuration before any UID remapping happens at all. On a standard, unconfigured installation, a container left running as root (UID 0) is running as literal host root the moment it starts — there is no automatic containment reducing that to an unprivileged host UID. The team\'s container is exactly as exposed as if the user namespace bullet did not exist on the page at all; skipping the USER instruction on the reasoning that "namespaces will handle it" removes the one piece of protection (a non-root container UID) that was actually active, in exchange for a protection (user namespace remapping) that was never turned on in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since Docker automatically creates pid, net, mnt, uts, and ipc namespaces for every container, the user namespace listed right alongside them in the main page\'s own theory must also be active by default.',
      reality: 'Per this subtopic\'s theory, the user namespace is the one exception among the six — Docker does not remap container UIDs to different host UIDs unless userns-remap is explicitly configured in the daemon; without it, container UID 0 is literal host UID 0.'
    },
    {
      thought: 'Rootless Docker and userns-remap are the same feature described two different ways — enabling either one gets you the "container root maps to an unprivileged host UID" behavior the main page describes.',
      reality: 'Per this subtopic\'s theory, these are two genuinely separate mechanisms — rootless Docker runs the DAEMON ITSELF as an unprivileged user, while userns-remap keeps a normally-privileged daemon but remaps individual CONTAINERS\' UID ranges. Conflating them risks assuming a protection is active that a specific setup never actually configured.'
    },
    {
      thought: 'Adding a USER instruction to run as non-root inside a container is a smaller, less complete version of the protection user namespace remapping provides — the two overlap in what they defend against.',
      reality: 'Per this subtopic\'s exercise, they are independent protections with no automatic relationship — a non-root USER instruction works entirely by controlling what UID the container process runs as INSIDE the container, and remains equally necessary whether or not userns-remap is ever configured on the host.'
    }
  ];
}
