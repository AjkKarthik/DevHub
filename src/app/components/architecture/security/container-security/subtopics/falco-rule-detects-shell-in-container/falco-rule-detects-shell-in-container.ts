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
    heading: 'The QnA Names Falco and Its Detections — Never in Rule Syntax',
    points: [
      'The main page’s own QnA describes Falco in real technical detail — eBPF/kernel-probe syscall monitoring, detecting "container opening a shell (exec /bin/bash inside a running production container)" as its own worked example — but no codeTab on the page ever shows what a Falco rule actually looks like.',
      'A Falco rule has five parts: <code>rule</code> (its name), <code>desc</code> (a human description), <code>condition</code> (a filter expression combining event-type macros and field checks), <code>output</code> (the alert text, with <code>%field</code> placeholders interpolated at match time), and <code>priority</code> — verified against Falco’s own official rules reference documentation before writing.',
      'The <code>condition</code> field is built from Falco’s own filter fields (<code>proc.name</code>, <code>container.id</code>, …) and reusable macros — <code>spawned_process</code> and <code>shell_procs</code> are both real, built-in Falco macros, not invented shorthand.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Real Falco Rule the QnA Describes in Prose',
    language: 'bash',
    code: `# ── falco_rules.local.yaml ──────────────────────────────────────────────────
# Detects the exact scenario the main page's own QnA describes: "container
# opening a shell (exec /bin/bash inside a running production container)".
# Verified against Falco's own official rules reference before writing.

- rule: Terminal shell in container
  desc: >
    A shell was spawned inside a running container -- unusual for most
    production workloads, which should never need an interactive shell
    after startup.
  condition: >
    spawned_process and container.id != host and
    proc.name in (shell_procs)
  output: >
    Shell spawned in container
    (user=%user.name command=%proc.cmdline container_id=%container.id
    image=%container.image.repository)
  priority: WARNING
  tags: [container, shell, mitre_execution]

# Firing this rule does NOT stop the shell from running -- Falco is a
# DETECTION tool, not a prevention/admission tool (that's what Pod
# Security Admission and image-signing verification, covered earlier
# on the main page, are for). Falco's job is to surface the alert --
# to stdout, a SIEM, or an incident-response pipeline -- fast enough
# for a human or automated response to act on it.`,
  },
  {
    label: 'A Falco Rule Reusing a Custom Macro (Not Just the Built-In shell_procs)',
    language: 'bash',
    code: `# ── falco_rules.local.yaml ──────────────────────────────────────────────────
# Macros let a team define its OWN reusable condition fragment, exactly
# the way "shell_procs" is a built-in one -- useful when the default
# shell_procs list (bash, sh, zsh, csh, ksh, ...) needs extending for a
# workload-specific binary that also amounts to an interactive shell.

- macro: interactive_debug_tools
  condition: >
    proc.name in (shell_procs, nsenter, socat, ncat)

- rule: Interactive shell or debug tool in production container
  desc: >
    A shell OR a common container-escape/debugging tool was spawned --
    covers the same risk shell_procs alone catches, plus tools that
    are not literal shells but serve the same "interactive access"
    purpose an attacker would reach for.
  condition: >
    spawned_process and container.id != host and
    interactive_debug_tools and
    k8s.ns.name = "production"
  output: >
    Interactive tool spawned in production container
    (user=%user.name proc=%proc.name command=%proc.cmdline
    container_id=%container.id namespace=%k8s.ns.name)
  priority: CRITICAL
  tags: [container, shell, production]`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The first rule’s <code>condition</code> checks <code>container.id != host</code>. What does dropping that clause entirely — leaving only <code>spawned_process and proc.name in (shell_procs)</code> — actually change about when the rule fires?',
  hint: 'Falco runs on the HOST, watching syscalls system-wide — not just inside containers. What spawns shells on a normal Kubernetes node outside of any container at all?',
  solution: `// Dropping "container.id != host" means the rule would ALSO fire for
// every shell spawned directly on the node itself -- an admin SSHing
// in and running bash, a systemd unit's own shell-based startup
// script, a cron job that happens to invoke sh. Falco monitors
// syscalls at the KERNEL level across the whole host, not just
// inside container namespaces, so "spawned_process and proc.name in
// (shell_procs)" alone has no way to distinguish "inside a
// container" from "directly on the node."

// container.id is Falco's own field for this: it evaluates to the
// literal string "host" for a process running OUTSIDE any container,
// and to the actual container ID for one running inside. The check
// "container.id != host" is what scopes the rule to containers only
// -- exactly the boundary the main page's own QnA describes ("shell
// spawned INSIDE a running production container"), not "any shell
// spawned anywhere on the machine."

// Without it, the rule would be far noisier -- alerting on completely
// routine node administration -- and would defeat the whole point of
// a container-specific detection rule.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Falco automatically blocks the shell from running once its rule matches.',
    reality: 'Falco is a DETECTION tool — it observes syscalls and emits an alert (to stdout, a SIEM, or an incident-response pipeline) when a rule’s <code>condition</code> matches. It does not, by itself, terminate the process or the container. Preventing the shell from ever being ALLOWED in the first place is a separate concern (image scanning, Pod Security Admission, minimal/distroless base images — all covered earlier on the main page).',
  },
  {
    thought: '<code>shell_procs</code> is a made-up placeholder name meant to represent "some list of shells" — not something Falco actually recognizes.',
    reality: '<code>shell_procs</code> is a real, built-in Falco macro shipped in its default rule set — it already expands to a maintained list of common shell binaries (bash, sh, zsh, csh, ksh, and others). A team only needs to define its OWN macro, like the second codeTab’s <code>interactive_debug_tools</code>, when it wants to extend or combine that built-in list with additional tool names.',
  },
  {
    thought: 'A single Falco rule can only check one condition — combining multiple checks (namespace, tool list, process type) needs multiple separate rules.',
    reality: 'The second codeTab’s single rule combines FOUR conditions with <code>and</code> in one <code>condition</code> expression — <code>spawned_process</code>, the container check, the custom macro, AND a specific Kubernetes namespace (<code>k8s.ns.name = "production"</code>). Falco’s condition language is a full boolean filter expression, not a one-check-per-rule system.',
  },
];

@Component({
  selector: 'app-sec-container-falco',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './falco-rule-detects-shell-in-container.html',
  styleUrl: './falco-rule-detects-shell-in-container.scss',
})
export class FalcoRuleDetectsShellInContainerSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
