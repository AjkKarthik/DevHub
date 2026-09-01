import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The Main Page Only Ever Shows RuntimeDefault — Never a Custom Profile',
    points: [
      'The main page’s theory names <code>seccompProfile: RuntimeDefault</code> and states the QnA’s own distinction precisely — seccomp restricts SYSCALLS, AppArmor/SELinux restrict FILE/network/capability access — but no codeTab anywhere on the page shows what a CUSTOM seccomp profile actually looks like, or how a pod references one.',
      'A custom profile is a plain JSON file: a top-level <code>defaultAction</code> (what happens to any syscall NOT explicitly matched) plus a <code>syscalls</code> array, each entry listing <code>names</code> and an <code>action</code> — verified against Kubernetes’ own official seccomp tutorial before writing.',
      'A pod references a custom profile via <code>securityContext.seccompProfile.type: Localhost</code> plus <code>localhostProfile: &lt;filename&gt;</code> — a DIFFERENT <code>type</code> value from the main page’s own <code>RuntimeDefault</code>. The profile file itself must exist on the NODE at <code>/var/lib/kubelet/seccomp/profiles/</code>, not bundled into the container image.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'RuntimeDefault vs. a Custom, Narrower Allowlist',
    language: 'bash',
    code: `# ── RuntimeDefault (the main page's own choice) ─────────────────────────────
# Uses the container runtime's (containerd/CRI-O) own built-in
# default profile -- a broad allowlist covering ~300+ syscalls that
# is reasonable for MOST workloads, blocking the genuinely dangerous
# ones (ptrace, mount, kexec_load, ...). Good default; not tailored.

securityContext:
  seccompProfile:
    type: RuntimeDefault

# ── Localhost (a CUSTOM, workload-specific profile) ─────────────────────────
# A minimal API service that only ever reads/writes sockets and files
# needs far fewer syscalls than RuntimeDefault allows. A custom
# profile can allowlist EXACTLY what strace/perf tracing shows the
# workload actually calls -- everything else is denied outright,
# rather than merely blocked from a curated "dangerous" list.

securityContext:
  seccompProfile:
    type: Localhost
    localhostProfile: api-minimal.json
    # ^ file must exist on the NODE at
    #   /var/lib/kubelet/seccomp/profiles/api-minimal.json
    #   -- it is NOT baked into the container image itself.`,
  },
  {
    label: 'api-minimal.json — the Custom Profile Itself',
    language: 'bash',
    code: `{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": [
        "accept4", "epoll_wait", "pselect6", "futex",
        "read", "write", "close", "recvfrom", "sendto",
        "socket", "bind", "listen", "exit_group", "mmap", "munmap"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
// defaultAction: SCMP_ACT_ERRNO -- any syscall NOT in the allowlist
// below returns an error to the calling process instead of running.
// This is the exact opposite shape from RuntimeDefault, which
// ALLOWS everything except a specific denylist of dangerous calls --
// a custom profile like this one DENIES everything except a specific
// ALLOWLIST of calls the workload is actually observed to need.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes switching every workload in the cluster straight to a hand-written <code>Localhost</code> allowlist like <code>api-minimal.json</code>, arguing it is strictly more secure than <code>RuntimeDefault</code>. What real operational risk does this skip over?',
  hint: 'How was the exact syscall list in <code>api-minimal.json</code> actually determined — and what happens to a request path that was never exercised while building that list?',
  solution: `// The risk is that a hand-written allowlist is only as complete as
// the testing used to build it. RuntimeDefault is a broad, generic
// profile maintained by the container runtime project and tested
// across a huge range of real-world workloads -- it "just works" for
// almost anything.

// A custom Localhost profile like api-minimal.json, by contrast, has
// to be derived by actually OBSERVING the workload's real syscall
// usage (e.g. via strace or a tool like the Kubernetes seccomp
// profile recorder) across EVERY code path -- not just the ones
// exercised during whatever testing produced the list.

// If a rarely-hit error-handling branch, an admin-only endpoint, or
// a dependency upgrade that changes underlying syscall usage
// triggers a syscall NOT in the allowlist, defaultAction:
// SCMP_ACT_ERRNO means that syscall now fails with an error at
// RUNTIME, in PRODUCTION -- not at build or test time. That can
// manifest as a confusing, hard-to-diagnose failure (an EPERM-style
// error deep inside a library) rather than an obvious rejection.

// The safer rollout path: generate the profile from OBSERVED
// behavior across realistic traffic (including error paths), test
// it thoroughly in a non-production environment first, and treat
// RuntimeDefault as the safe default for anything that hasn't been
// through that process -- not switch everything to a hand-guessed
// allowlist at once.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'seccomp and AppArmor/SELinux do the same job — using one makes the other redundant.',
    reality: 'They restrict different things: seccomp filters which raw Linux SYSCALLS a process may make; AppArmor/SELinux control which FILES, network operations, and capabilities it may use, at a higher level of expressiveness ("this process may read /app but not /etc/passwd"). The main page’s own QnA already states this — many hardened setups deliberately combine seccomp + AppArmor/SELinux + dropped capabilities, since each closes a different gap.',
  },
  {
    thought: 'A custom seccomp profile file gets bundled into the container image, the same way application code is.',
    reality: 'It does not — a <code>Localhost</code> profile file must already exist on the NODE itself, at <code>/var/lib/kubelet/seccomp/profiles/&lt;filename&gt;</code>, before any pod referencing it can schedule there. This is a genuinely different distribution mechanism from the image itself, and it means the profile has to be provisioned onto every node a pod might land on (a DaemonSet, a node image bake step, or similar).',
  },
  {
    thought: '<code>defaultAction</code> only matters for RuntimeDefault-style profiles — a custom profile’s <code>syscalls</code> array is the whole story.',
    reality: '<code>defaultAction</code> is what makes a custom profile fundamentally STRICTER than RuntimeDefault, not just different: RuntimeDefault effectively defaults to ALLOW (denying only a specific dangerous list), while <code>api-minimal.json</code>’s <code>SCMP_ACT_ERRNO</code> default means anything NOT explicitly listed is denied — the exact inversion of RuntimeDefault’s own default posture, which is also exactly what the earlier Try It’s risk is about.',
  },
];

@Component({
  selector: 'app-sec-container-seccomp',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './custom-seccomp-profile-beyond-runtimedefault.html',
  styleUrl: './custom-seccomp-profile-beyond-runtimedefault.scss',
})
export class CustomSeccompProfileBeyondRuntimedefaultSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
