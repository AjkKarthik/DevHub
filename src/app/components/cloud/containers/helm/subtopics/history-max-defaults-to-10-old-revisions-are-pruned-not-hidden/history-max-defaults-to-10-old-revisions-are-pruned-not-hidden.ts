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
  templateUrl: './history-max-defaults-to-10-old-revisions-are-pruned-not-hidden.html',
  styleUrl: './history-max-defaults-to-10-old-revisions-are-pruned-not-hidden.scss'
})
export class HistoryMaxDefaultsTo10OldRevisionsArePrunedNotHiddenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mustKnow bullet says "helm history shows all revisions" — without a limit',
      points: [
        'The main page\'s own "Releases and Lifecycle" theory bullet states: "Release history is stored as Secrets in the release namespace — helm history shows all revisions." The word "all" reads as unbounded — every revision that has ever existed for a release.',
        'The main page\'s own QnA confirms the storage mechanism ("Helm v3 stores release state as Kubernetes Secrets... Each revision is a separate Secret") but never mentions any limit on how many of those Secrets actually persist over a release\'s lifetime.',
      ]
    },
    {
      heading: 'What "all" actually means: bounded by --history-max, defaulting to 10, with silent pruning beyond that',
      points: [
        'Per Helm\'s own documented behavior, every `helm upgrade` (and `helm install`/`helm rollback`, which are also upgrade-family operations under the hood) checks the release\'s revision count against `--history-max`, which defaults to 10 — once a release has more than 10 revision Secrets, Helm automatically deletes the OLDEST ones to stay within that limit, on every successful operation.',
        'This means "helm history shows all revisions" is only true up to the retention window — a release that has been upgraded 30 times has revisions 1 through 20 permanently deleted, with only the 10 most recent ones (21–30) actually queryable via helm history, or targetable via helm rollback.',
        'Critically, this pruning is silent and automatic — there is no warning, confirmation prompt, or explicit action required. A team that has upgraded a release many times over months, assuming they could roll back to "whatever revision looked stable" from early in the release\'s history, will find that revision\'s Secret simply no longer exists, with `helm rollback <release> <old-revision>` failing outright.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Watching the default 10-revision limit prune older history',
      language: 'bash',
      code: `# The main page's own idempotent CI/CD pattern, run repeatedly:
for i in $(seq 1 15); do
  helm upgrade --install myapp ./myapp --set image.tag=v1.$i -n production
done

# After 15 upgrades, check history:
helm history myapp -n production
# REVISION  UPDATED                   STATUS      CHART        APP VERSION
# 6         2026-07-15 10:02:11       superseded  myapp-1.6.0  v1.6
# 7         2026-07-15 10:04:33       superseded  myapp-1.7.0  v1.7
# 8         2026-07-15 10:06:02       superseded  myapp-1.8.0  v1.8
# ...
# 15        2026-07-15 10:22:47       deployed    myapp-1.15.0 v1.15
# -- only revisions 6 through 15 are shown: 10 total, the default
#    --history-max. Revisions 1-5 are GONE -- not hidden, deleted.

# Confirm the underlying Secrets directly:
kubectl get secrets -n production -l owner=helm,name=myapp
# NAME                        TYPE                  DATA   AGE
# sh.helm.release.v1.myapp.v6   helm.sh/release.v1   1      ...
# ...
# sh.helm.release.v1.myapp.v15  helm.sh/release.v1   1      ...
# -- no v1 through v5 Secrets exist at all -- Helm deleted them
#    automatically during later upgrades, once the count exceeded 10.`,
    },
    {
      label: 'The failure mode: rolling back to a pruned revision',
      language: 'bash',
      code: `# A team wants to roll back to revision 3 -- a known-stable version
# from early in this release's history, per their own change log:
helm rollback myapp 3 -n production
# Error: release: not found
# -- NOT because the release itself doesn't exist (myapp is very
#    much running), but because revision 3's own Secret was pruned
#    long ago during a later upgrade -- there is nothing left for
#    rollback to target.

# The fix, BEFORE this becomes a problem -- raise --history-max on
# the release (or globally, if using a GitOps controller like Flux's
# HelmRelease CRD, which has its own maxHistory field defaulting to
# the same underlying Helm behavior):
helm upgrade --install myapp ./myapp --history-max 30 -n production
# -- retains the last 30 revisions instead of 10, at the cost of
#    30 Secrets' worth of etcd storage per release instead of 10.
# This must be set BEFORE the revisions you want to keep are
# already pruned -- raising it later does not restore anything
# already deleted.

# For audit-grade permanent history beyond even a raised
# --history-max, ship "helm history" output to an external log
# aggregator after every release -- Helm itself has no built-in
# concept of permanent, unbounded revision retention.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has been running <code>helm upgrade --install</code> in their CI/CD pipeline, exactly as the main page\'s own theory recommends, for several months across dozens of deploys. They try to roll back to a specific early revision they remember being particularly stable, using <code>helm rollback myapp 4</code>, and get <code>Error: release: not found</code> even though the myapp release is clearly running fine right now. Using this subtopic\'s theory, what happened to revision 4?',
    hint: 'The main page\'s own theory says "helm history shows all revisions." Is that literally true no matter how many times a release has been upgraded, or is there an unstated limit?',
    solution: 'Per this subtopic\'s theory, revision 4\'s own Secret was automatically deleted by Helm during a LATER upgrade, once the release\'s total revision count exceeded --history-max, which defaults to 10. Every successful helm upgrade prunes the oldest revision Secrets beyond that limit, silently and automatically, with no warning. Across "dozens of deploys," this release long ago passed the 10-revision retention window, meaning only the 10 most recent revisions are still queryable via helm history or targetable via helm rollback — revision 4, from early in the release\'s history, no longer has a corresponding Secret in the cluster at all, which is exactly why helm rollback reports release: not found for that specific revision, despite the release itself running normally. The main page\'s own "helm history shows all revisions" is only true within this retention window — there is no way to recover a pruned revision after the fact; the only prevention is raising --history-max BEFORE the revisions in question are pruned, or shipping helm history output to an external system for permanent audit-grade retention.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own "helm history shows all revisions" statement means Helm retains a complete, permanent record of every revision a release has ever had, for as long as the release exists.',
      reality: 'Per this subtopic\'s theory, Helm retains only the most recent revisions up to --history-max, which defaults to 10 — every successful upgrade automatically prunes older revision Secrets beyond that count, with no warning or confirmation.'
    },
    {
      thought: 'If helm rollback <release> <revision> fails with "release: not found" for a specific old revision number, it must mean the release itself was deleted or renamed at some point.',
      reality: 'Per this subtopic\'s exercise, this error commonly means the release is running perfectly fine, but that SPECIFIC revision\'s own Secret was pruned by the default --history-max: 10 retention limit during a later upgrade — the error is about the missing revision record, not the release itself.'
    },
    {
      thought: 'Raising --history-max after noticing old revisions are missing will restore access to those already-pruned revisions.',
      reality: 'Per this subtopic\'s theory, --history-max only controls retention GOING FORWARD from the moment it is set — it cannot restore a revision Secret that has already been deleted. It must be raised proactively, before the revisions worth keeping fall outside the (previous, smaller) retention window.'
    }
  ];
}
