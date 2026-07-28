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
  templateUrl: './both-injection-labels-present-istio-injection-silently-wins.html',
  styleUrl: './both-injection-labels-present-istio-injection-silently-wins.scss'
})
export class BothInjectionLabelsPresentIstioInjectionSilentlyWinsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own canary-upgrade example removes the old label in the same command as adding the new one, without ever saying why that order matters',
      points: [
        'The main page\'s "Canary Upgrade" code sample runs: <code>kubectl label namespace staging istio-injection- istio.io/rev=1-22-0</code> — removing <code>istio-injection</code> and adding the revision label in one command. The main page never explains what would go wrong if you added the revision label WITHOUT first removing the old one.',
      ]
    },
    {
      heading: 'What actually happens if both labels are present: istio-injection silently wins',
      points: [
        'If a namespace carries BOTH <code>istio-injection=enabled</code> AND <code>istio.io/rev=&lt;some-revision&gt;</code> at the same time, Istio\'s injection webhook gives precedence to <code>istio-injection</code> — this is maintained specifically for backward compatibility with pre-revision-based Istio configurations. The <code>istio.io/rev</code> label is silently ignored while both are present.',
        'This means a team attempting a revision-based canary migration who adds the new revision label WITHOUT removing the old <code>istio-injection=enabled</code> label ends up with pods still injected from the OLD, default-revision control plane — the exact opposite of what a canary migration to a NEW revision is supposed to test — with no error or warning surfaced anywhere in the process.',
      ]
    },
    {
      heading: 'The correct sequencing, and why it matches what the main page already showed (without explaining it)',
      points: [
        'The safe migration order is exactly what the main page\'s own example does: remove <code>istio-injection</code> and add <code>istio.io/rev</code> together, so the namespace never carries both simultaneously in a way that would trigger the precedence rule silently favoring the wrong one.',
        'Istio does emit a warning about multiple injection labels being present when it detects this state — worth actively watching for in <code>kubectl describe namespace</code> or admission-controller logs during any migration, since the FUNCTIONAL result (wrong-revision injection) is silent even though a diagnostic signal does technically exist somewhere in the system.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The footgun: adding the new label without removing the old one',
      language: 'bash',
      code: `# Namespace currently: istio-injection=enabled (default revision)
kubectl get namespace staging --show-labels
# istio-injection=enabled

# Attempting a canary migration -- adding the revision label
# WITHOUT removing the old one first:
kubectl label namespace staging istio.io/rev=1-22-0

kubectl get namespace staging --show-labels
# istio-injection=enabled,istio.io/rev=1-22-0
# BOTH labels now present

kubectl rollout restart deployment -n staging

# Expectation: new pods inject from the 1-22-0 revision
# Reality: istio-injection=enabled STILL WINS -- pods are
# injected from the OLD/default revision, silently.
kubectl get pods -n staging -o jsonpath='{.items[*].spec.containers[*].image}' \\
  | grep -o 'proxyv2:[0-9.]*'
# Shows the OLD version, not 1.22.0 -- the migration didn't
# actually happen, despite adding the revision label.`,
    },
    {
      label: 'The safe sequence: remove and add together',
      language: 'bash',
      code: `# Correct: remove istio-injection AND add istio.io/rev
# in the SAME command -- the namespace is never in the
# ambiguous "both present" state at all
kubectl label namespace staging \\
  istio-injection- \\
  istio.io/rev=1-22-0

kubectl get namespace staging --show-labels
# istio.io/rev=1-22-0   (istio-injection is gone entirely)

kubectl rollout restart deployment -n staging

kubectl get pods -n staging -o jsonpath='{.items[*].spec.containers[*].image}' \\
  | grep -o 'proxyv2:[0-9.]*'
# NOW correctly shows 1.22.0 -- migration actually took effect

# If you ever suspect the "both labels" state occurred, check for
# Istio's own warning about it:
kubectl describe namespace staging
# (or check the istiod / injection webhook logs for a
# multiple-injection-labels warning around the relevant timestamp)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs a canary migration by adding istio.io/rev=1-22-0 to a namespace that already has istio-injection=enabled, intending both labels to coexist temporarily "just to be safe" before removing the old one in a follow-up step. After restarting pods, they check proxy versions and find every pod is still running the OLD Istio revision, not 1.22.0. What happened, and what should they have done instead?',
    hint: 'When both istio-injection and istio.io/rev are present on the same namespace, does Istio\'s injection webhook treat them as equally valid, or does one take precedence?',
    solution: 'The old istio-injection=enabled label silently took precedence over the newly-added istio.io/rev=1-22-0 label — this precedence is maintained specifically for backward compatibility, and it applies for as long as BOTH labels are present, regardless of intent. Because istio-injection won, every restarted pod was injected from the OLD, default-revision control plane, not the new 1.22.0 revision the team meant to test — with no error surfaced anywhere. The correct approach is to remove istio-injection and add istio.io/rev in the SAME command (kubectl label namespace staging istio-injection- istio.io/rev=1-22-0), so the namespace is never in the ambiguous dual-label state at all — exactly the pattern the main page\'s own canary-upgrade example already uses, without explaining why the combined command matters.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A namespace can safely carry both istio-injection=enabled and istio.io/rev=<revision> labels simultaneously as an intermediate step during a canary migration, before removing the old label in a follow-up change.',
      reality: 'Per this subtopic\'s theory, having both labels present at once causes istio-injection to silently win (for backward compatibility) — the istio.io/rev label is entirely ignored while both exist, which is the opposite of a safe intermediate state.'
    },
    {
      thought: 'If adding istio.io/rev to a namespace that already has istio-injection=enabled had no effect, Istio would surface a clear, unmissable error explaining the label conflict.',
      reality: 'Per this subtopic\'s theory, the functional result (wrong-revision injection) is silent — Istio does emit a warning about multiple injection labels somewhere in its logs, but nothing blocks the operation or makes the mistake obvious from the command\'s own output.'
    },
    {
      thought: 'The order of operations in a namespace relabeling command (remove old label, add new label) is a stylistic choice with no functional difference from doing them as two separate, sequential kubectl commands.',
      reality: 'Per this subtopic\'s theory, doing the removal and addition in a single command avoids ever putting the namespace into the dual-label state — running them as two separate commands creates a real (if brief) window where both labels coexist and the precedence rule could apply if anything reads the namespace state during that window (e.g., a pod created in that gap).'
    }
  ];
}
