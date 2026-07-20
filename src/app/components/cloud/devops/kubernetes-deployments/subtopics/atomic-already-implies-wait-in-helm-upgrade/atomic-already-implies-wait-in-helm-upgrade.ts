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
  templateUrl: './atomic-already-implies-wait-in-helm-upgrade.html',
  styleUrl: './atomic-already-implies-wait-in-helm-upgrade.scss'
})
export class AtomicAlreadyImpliesWaitInHelmUpgradeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Helm upgrade command passes both --atomic and --wait, reading as if both are independently necessary',
      points: [
        'The main page\'s own "Deploy with Helm" step runs `helm upgrade --install myapp ./charts/myapp --namespace production --set image.tag=... --set replicaCount=3 --atomic --timeout 120s --wait`. Both `--atomic` and `--wait` are listed as separate flags on separate lines, with no comment distinguishing what each one contributes on its own.',
        'Helm\'s own documentation for `--atomic` states the relationship directly: "if set, upgrade process rolls back changes made in case of failed upgrade. The --wait flag will be set automatically if --atomic is used." `--wait` isn\'t a second, independent requirement alongside `--atomic` — it\'s already included as part of what `--atomic` does.',
      ]
    },
    {
      heading: 'Why --atomic needs --wait\'s behavior to function at all, and what this means for the main page\'s own command',
      points: [
        'Rolling back automatically on failure requires FIRST knowing whether the upgrade failed — and the only way Helm can know that is by waiting to observe whether the deployed resources (Pods, PVCs, Services) actually reach a ready state. This is exactly why `--wait` being "set automatically" isn\'t a coincidental bundling — `--atomic`\'s entire rollback mechanism depends on the same readiness-waiting behavior `--wait` provides on its own.',
        'This means the main page\'s own explicit `--wait` flag is redundant, not wrong — the command works exactly the same with or without it, since `--atomic` was already going to wait regardless. It\'s the kind of harmless-but-unexplained redundancy that\'s easy to copy into a new pipeline while genuinely believing both flags are doing separate, necessary jobs.',
        'The flag that IS doing independent work in the same command is `--timeout 120s` — this bounds how long the wait-then-rollback-if-needed process is allowed to take before Helm gives up and reports failure, regardless of whether `--wait` was passed explicitly or arrived implicitly via `--atomic`.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own command, and the equivalent shorter version',
      language: 'bash',
      code: `# The main page's own exact command:
helm upgrade --install myapp ./charts/myapp \\
  --namespace production \\
  --set image.tag=abc1234 \\
  --set replicaCount=3 \\
  --atomic \\
  --timeout 120s \\
  --wait

# Per Helm's own docs on --atomic: "The --wait flag will be set
# automatically if --atomic is used." This means the explicit
# --wait above changes nothing -- the command below behaves
# IDENTICALLY:

helm upgrade --install myapp ./charts/myapp \\
  --namespace production \\
  --set image.tag=abc1234 \\
  --set replicaCount=3 \\
  --atomic \\
  --timeout 120s
  # --wait removed -- --atomic already implies it

# Both versions: Helm waits up to 120s for all resources to become
# ready; if they don't, Helm automatically rolls back to the
# previous release. Nothing about this behavior changes based on
# whether --wait was typed explicitly.`,
    },
    {
      label: 'What actually changes if you drop --atomic instead (not --wait)',
      language: 'bash',
      code: `# Dropping --wait (as shown in the first example) changes nothing.
# Dropping --atomic instead is a completely different story:

helm upgrade --install myapp ./charts/myapp \\
  --namespace production \\
  --set image.tag=abc1234 \\
  --timeout 120s \\
  --wait
  # --atomic removed, --wait kept

# This STILL waits up to 120s for resources to become ready --
# --wait's own behavior is unchanged and independent of --atomic.
# But if the upgrade fails or times out, Helm does NOT roll back
# automatically -- the release is left in a partially-deployed,
# failed state, and someone has to notice and run
# "helm rollback myapp" manually.

# This is the actual asymmetry worth understanding: --wait can
# exist meaningfully without --atomic (you get the waiting, not
# the auto-rollback). --atomic cannot meaningfully exist without
# the waiting behavior --wait provides -- which is exactly why
# Helm bundles it in automatically rather than requiring both
# flags to be passed together.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate, reviewing the main page\'s own Helm upgrade command, proposes removing `--wait` "to simplify the command since --atomic is already there," but is unsure whether this changes the pipeline\'s rollback behavior. Using this subtopic\'s theory, tell them definitively whether this simplification is safe, and why.',
    hint: 'Per this subtopic\'s theory, does Helm\'s own documentation describe --atomic as requiring --wait to be passed separately, or as already including that behavior?',
    solution: 'The simplification is safe — per this subtopic\'s theory, Helm\'s own docs state plainly that "--atomic" causes "--wait" to "be set automatically," meaning the explicit `--wait` in the main page\'s own command was never doing independent work in the first place. Removing it changes nothing about the command\'s behavior: Helm will still wait for all resources to reach readiness within the `--timeout 120s` window, and will still automatically roll back to the previous release if that doesn\'t happen — exactly as it did before, since `--atomic` was always going to trigger that waiting behavior on its own. The one thing worth flagging back to the teammate: this redundancy-removal logic only applies to `--wait` specifically — removing `--atomic` itself (leaving `--wait` alone) would be a genuinely different, less safe change, since `--wait`\'s own behavior doesn\'t include the automatic-rollback-on-failure part that makes `--atomic` valuable in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'In the main page\'s own Helm command, --atomic and --wait are two separate, independently necessary flags — --atomic handles rollback, --wait handles readiness waiting, and both are required together for the command to work correctly.',
      reality: 'Per this subtopic\'s theory, Helm\'s own docs state --wait "will be set automatically if --atomic is used" — the waiting behavior is already included in --atomic, not a separate requirement. The main page\'s own explicit --wait is redundant, not independently load-bearing.'
    },
    {
      thought: 'Since --wait turns out to be redundant when --atomic is already present, --atomic must also be redundant or dispensable in some similar way.',
      reality: 'This subtopic\'s second code example shows the relationship is asymmetric, not mutual — dropping --wait while keeping --atomic changes nothing, but dropping --atomic while keeping --wait removes the automatic-rollback-on-failure behavior entirely, even though the waiting itself still happens. The two flags are not interchangeable or equally optional.'
    },
    {
      thought: 'Passing both --atomic and --wait, even though one is redundant, is at best harmless extra typing and at worst mildly confusing — there\'s no reason it would ever cause a real problem.',
      reality: 'Per this subtopic\'s theory, the practical risk isn\'t the redundant --wait itself, but the misunderstanding it can create — a team that believes --wait is doing independent, necessary work might mistakenly conclude removing --atomic while keeping --wait preserves the same safety guarantees, when it actually silently drops the auto-rollback behavior the whole command was written to provide.'
    }
  ];
}
