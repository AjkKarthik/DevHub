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
  templateUrl: './rollback-never-undoes-a-pre-upgrade-hook-only-pre-rollback-hooks-run.html',
  styleUrl: './rollback-never-undoes-a-pre-upgrade-hook-only-pre-rollback-hooks-run.scss'
})
export class RollbackNeverUndoesAPreUpgradeHookOnlyPreRollbackHooksRunSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory states the rollback limitation, but never explains the mechanism',
      points: [
        'The main page\'s own "Helm Templating and Values Layering" theory bullet says: "Helm tracks release history and supports helm rollback to a previous revision, but this only reverts the Kubernetes objects Helm manages — it does not undo external side effects (data migrations, external API calls) that may have happened as part of that release." This correctly flags the LIMITATION, but never explains WHY, mechanically, a rollback can\'t undo a migration.',
        'The main page\'s own separate "Hooks and Tests" theory bullet lists all the lifecycle points hooks can run at — "pre-install, post-install, pre-upgrade, post-upgrade, pre-delete, pre-rollback" — and its own example use case is "a pre-upgrade hook Job to run DB migrations before the Deployment is upgraded." Neither theory section ever connects these two facts to explain the actual mechanism.',
      ]
    },
    {
      heading: 'The mechanism: rollback only triggers pre-rollback/post-rollback hooks — the pre-upgrade hook that ran the migration is never invoked at all',
      points: [
        'Per Helm\'s own documented hook-to-command mapping, each Helm command triggers a SPECIFIC, fixed set of hook types: `helm upgrade` triggers pre-upgrade and post-upgrade hooks; `helm rollback` triggers ONLY pre-rollback and post-rollback hooks. These are entirely separate hook types, matched to entirely separate commands — a `pre-upgrade`-annotated Job is never invoked by `helm rollback`, under any circumstances.',
        'This means the main page\'s own example — a pre-upgrade hook Job running a database migration — is simply never re-triggered, and never automatically reversed, by a subsequent helm rollback. The migration Job ran once, as part of the ORIGINAL upgrade\'s pre-upgrade phase; rolling back reverts the Deployment/Service/ConfigMap manifests Helm manages to their prior revision\'s definitions, but the database schema change from that migration Job persists untouched, since no hook tied to the rollback command ever runs to undo it.',
        'The only way to make a schema change reversible via helm rollback is to explicitly author a MATCHING pre-rollback hook (a "down" migration Job) alongside the pre-upgrade one — Helm provides the lifecycle point, but writing the actual undo logic is entirely the chart author\'s own responsibility; nothing about defining a pre-upgrade hook automatically generates or infers its rollback counterpart.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Which hooks fire for which command — the mapping the main page never shows',
      language: 'bash',
      code: `# The main page's own theory lists every hook TYPE in one sentence,
# but never maps each one to the SPECIFIC command that triggers it:

# Command            Hooks triggered
# -----------------  --------------------------------
# helm install        pre-install, post-install
# helm upgrade         pre-upgrade, post-upgrade
# helm rollback         pre-rollback, post-rollback
# helm uninstall         pre-delete, post-delete
# helm test                test

# A pre-upgrade-annotated migration Job (the main page's own example
# use case), and a pre-rollback-annotated Job, are ENTIRELY SEPARATE
# resources that happen to share a naming convention:

# templates/migration-job.yaml
# apiVersion: batch/v1
# kind: Job
# metadata:
#   name: db-migrate
#   annotations:
#     "helm.sh/hook": pre-upgrade   # <- ONLY fires on \`helm upgrade\`
# spec: { ... runs "npm run migrate" ... }

# helm upgrade myapp ./chart --set image.tag=v2
# -> db-migrate Job runs BEFORE the Deployment is upgraded, applying
#    a real schema change to the production database

helm rollback myapp 1
# -> reverts Deployment/Service/ConfigMap manifests to revision 1's
#    definitions -- but db-migrate's own "pre-upgrade" annotation
#    means it is NEVER invoked by this command at all. The schema
#    change from the earlier "npm run migrate" run is still there,
#    completely untouched by the rollback.`,
    },
    {
      label: 'The fix: an explicit pre-rollback hook, authored separately',
      language: 'bash',
      code: `# Making the migration genuinely reversible via helm rollback
# requires a SEPARATE Job, explicitly authored for the rollback path
# -- Helm does not generate or infer this automatically from the
# pre-upgrade hook alone:

# templates/migration-down-job.yaml
# apiVersion: batch/v1
# kind: Job
# metadata:
#   name: db-migrate-down
#   annotations:
#     "helm.sh/hook": pre-rollback   # <- fires ONLY on \`helm rollback\`
#     "helm.sh/hook-weight": "0"
# spec:
#   template:
#     spec:
#       containers:
#         - name: migrate
#           image: myapp-migrator:latest
#           command: ["npm", "run", "migrate:down"]
#       restartPolicy: Never

# Now helm rollback myapp 1 triggers db-migrate-down FIRST (running
# the down migration), THEN reverts the Kubernetes manifests -- but
# this required the chart author to explicitly write and test a
# "down" migration script, exactly mirroring the "up" one. Many
# real-world migrations (especially destructive ones -- dropped
# columns, data transformations) have NO safe automated "down" path
# at all, which is the deeper reason this main page's own theory
# treats rollback as reverting manifests only, not a full undo.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s Helm chart, following the main page\'s own example, uses a <code>pre-upgrade</code> hook Job to run a database migration during every <code>helm upgrade</code>. After a bad release, they run <code>helm rollback myapp 1</code>, expecting the earlier migration to somehow also reverse, since "the whole release is being rolled back." The application manifests revert correctly, but the database schema still has the newer migration applied, causing errors. Using this subtopic\'s theory, why didn\'t the rollback touch the migration at all?',
    hint: 'Which specific hook TYPES does <code>helm rollback</code> actually trigger? Is <code>pre-upgrade</code> one of them?',
    solution: 'Per this subtopic\'s theory, this happens because helm rollback only triggers pre-rollback and post-rollback hooks — it never triggers pre-upgrade or post-upgrade hooks under any circumstances, since each Helm command is mapped to its own fixed, separate set of hook types. The migration Job in this scenario is annotated helm.sh/hook: pre-upgrade, meaning it only ever runs as part of a helm upgrade command — helm rollback has no mechanism that invokes it, or any awareness that it exists. The rollback correctly reverts the Deployment/Service/ConfigMap manifests Helm manages back to revision 1\'s definitions (exactly what the main page\'s own theory says rollback does), but the database schema change from the earlier migration Job run persists completely untouched, since nothing tied to the rollback command ever runs to reverse it. The only fix is for the chart to define a SEPARATE, explicitly-authored pre-rollback hook containing the actual "down" migration logic — Helm provides the lifecycle hook point, but never generates or infers the reversal logic automatically just because a matching pre-upgrade hook exists.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since a pre-upgrade hook and a pre-rollback hook both relate to the same kind of "before the main resources change" lifecycle moment, defining one causes Helm to automatically infer or generate the other.',
      reality: 'Per this subtopic\'s theory, these are two entirely separate hook types tied to two entirely separate commands (helm upgrade vs. helm rollback) — defining a pre-upgrade hook has zero effect on what happens during a rollback; a pre-rollback hook must be authored completely separately, with its own explicit logic.'
    },
    {
      thought: 'Running helm rollback re-triggers the pre-upgrade hook of the REVISION being rolled back to, effectively "re-applying" that earlier version\'s own upgrade steps.',
      reality: 'Per Helm\'s own documented hook-to-command mapping, helm rollback triggers ONLY pre-rollback and post-rollback hooks, regardless of which revision is targeted — pre-upgrade hooks are never invoked by a rollback command under any circumstances, even ones associated with the target revision.'
    },
    {
      thought: 'The main page\'s own statement that rollback "does not undo external side effects" is describing a rare edge case for unusual custom scripts — an ordinary Helm-managed database migration Job is not affected by this limitation.',
      reality: 'Per this subtopic\'s theory, this limitation applies to the exact, common pattern the main page\'s own theory itself recommends — a pre-upgrade hook Job running database migrations — making it a mainstream concern for any chart using hooks for schema changes, not a rare edge case.'
    }
  ];
}
