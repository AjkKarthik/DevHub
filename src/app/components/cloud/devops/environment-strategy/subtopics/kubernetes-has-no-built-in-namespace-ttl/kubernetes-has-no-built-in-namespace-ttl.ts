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
  templateUrl: './kubernetes-has-no-built-in-namespace-ttl.html',
  styleUrl: './kubernetes-has-no-built-in-namespace-ttl.scss'
})
export class KubernetesHasNoBuiltInNamespaceTtlSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "add a TTL" instruction skips over the fact that Kubernetes has nothing built in to do this for a namespace',
      points: [
        'The main page\'s own Ephemeral Environments theory lists cost control as: "auto-destroy on PR merge/close; add a TTL (destroy after 24h of inactivity); use smaller/cheaper SKUs than prod." The auto-destroy-on-merge part is fully implemented in the main page\'s own GitHub Actions code tab (the cleanup-preview job runs kubectl delete namespace on PR close). The TTL part is mentioned as if it were an equally simple, equally available option — but no corresponding implementation exists anywhere on the page.',
        'Kubernetes does ship a real, built-in TTL mechanism — the TTL-after-finished controller — but its scope is narrow: it operates on Jobs (and the Pods they create) after they REACH a finished state (Complete or Failed), automatically cleaning up that specific finished object once its own configured TTL elapses. It has no concept of "namespace," "inactivity," or "24 hours since last use" — it only knows "this Job finished N seconds ago."',
        'For an ephemeral PR namespace, there is no equivalent "finished" state to trigger from, and no built-in Kubernetes API object that tracks "when was this namespace last actively used" at all — a namespace with a running (not finished) deployment sitting idle for 24 hours looks structurally identical to the API server as one that was touched a minute ago.',
      ]
    },
    {
      heading: 'What actually implementing "24h of inactivity" requires',
      points: [
        'Since there is no built-in mechanism, teams reach for one of two approaches: a scheduled job (a CI cron trigger, or a Kubernetes CronJob running inside the cluster) that lists all ephemeral namespaces, checks some externally-tracked "last activity" signal (often a custom annotation updated by the deploy pipeline itself, or a timestamp stored in an external system), and runs kubectl delete namespace on anything past its TTL — or a purpose-built third-party controller (kube-janitor is the most widely used example) that watches for TTL annotations on arbitrary resources, including namespaces, and deletes them once expired.',
        'Either way, "add a TTL" is not a Kubernetes configuration flag or a namespace spec field — it requires deploying and operating an ADDITIONAL piece of automation (a scheduled job or a third-party controller) alongside the ephemeral-environment pipeline the main page\'s own code tab already shows. A team reading the main page\'s own bullet point as a simple checkbox to enable would be missing a real implementation step.',
        'This connects directly to the main page\'s own "inactivity" framing specifically: even the DIY scheduled-job approach needs the deploy pipeline (or the app itself) to actively write an updated "last used" annotation somewhere, since Kubernetes itself has no notion of when a namespace\'s resources were last exercised by real traffic — "inactivity" has to be defined and tracked by the team\'s own tooling, not read off any existing Kubernetes object.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What Kubernetes\' own built-in TTL controller actually covers',
      language: 'bash',
      code: `# Kubernetes DOES ship a real TTL controller -- but it is scoped
# to Jobs specifically, not namespaces:

apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  ttlSecondsAfterFinished: 100   # delete THIS Job (and its Pods)
                                   # 100s after it COMPLETES or FAILS
  template:
    spec:
      containers:
        - name: migrate
          image: myapp/migrate:latest
      restartPolicy: Never

# This is real, built-in, zero-extra-tooling Kubernetes behavior --
# but it only applies to a Job reaching a FINISHED state. It has
# no equivalent for:
#   - a Namespace                (no "finished" state exists)
#   - a Deployment sitting idle  (a running Deployment is never
#                                  "finished" -- it runs forever
#                                  by design)
#
# There is no "ttlSecondsAfterFinished" or equivalent field anywhere
# in the Namespace API object's own spec.`,
    },
    {
      label: 'What actually implementing the main page\'s own "24h inactivity" TTL requires',
      language: 'bash',
      code: `# Option A: a scheduled CI job (e.g. a nightly GitHub Actions cron)
# checking a custom "last-deployed" annotation the pipeline itself
# writes on every deploy to that namespace:

# .github/workflows/cleanup-stale-envs.yml
name: Cleanup Stale Preview Envs
on:
  schedule:
    - cron: '0 3 * * *'   # runs once a day -- nothing built into
                            # Kubernetes triggers this on its own
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Delete namespaces idle > 24h
        run: |
          for ns in $(kubectl get ns -l type=preview -o name); do
            LAST=$(kubectl get "$ns" -o jsonpath='{.metadata.annotations.last-deployed}')
            AGE_HOURS=$(( ($(date +%s) - $(date -d "$LAST" +%s)) / 3600 ))
            if [ "$AGE_HOURS" -gt 24 ]; then
              kubectl delete "$ns"
            fi
          done

# The deploy pipeline itself must ALSO be updated to write that
# "last-deployed" annotation on every deploy -- Kubernetes will
# never populate it on its own:
kubectl annotate namespace "$NAMESPACE" \\
  last-deployed="$(date -u +%Y-%m-%dT%H:%M:%SZ)" --overwrite

# Option B: a purpose-built third-party controller (e.g.
# kube-janitor) watching for a TTL annotation and deleting expired
# resources automatically -- still an EXTRA piece of software to
# deploy and operate, not a Kubernetes built-in:
kubectl annotate namespace pr-482 janitor/ttl=24h`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team reads the main page\'s own Ephemeral Environments bullet ("add a TTL — destroy after 24h of inactivity") and adds ttlSecondsAfterFinished: 86400 to their preview-environment namespace manifests, expecting Kubernetes to automatically clean up namespaces that have been idle for a day. Three weeks later, dozens of week-old preview namespaces are still running, consuming cluster resources. Using this subtopic\'s theory, explain precisely why this configuration had no effect, and describe the two categories of fix that would actually work.',
    hint: 'Per this subtopic\'s theory, which Kubernetes API object type does ttlSecondsAfterFinished actually apply to? Does a Namespace object even have this field in its spec at all — and even if it did, what does "AfterFinished" require that a namespace never reaches?',
    solution: 'This configuration had no effect because, per this subtopic\'s theory, ttlSecondsAfterFinished is a Job spec field, not a Namespace spec field — Namespace objects have no such field at all, so setting it in a namespace manifest is either silently ignored (as an unrecognized field) or simply invalid, doing nothing either way. Even setting aside the field-name mismatch, the underlying mechanism requires a resource to reach a FINISHED state (Complete or Failed) to start its TTL countdown, per this subtopic\'s theory — a namespace, which typically contains a long-running Deployment, never reaches a "finished" state the way a Job does, so there is no trigger event this mechanism could ever fire on for a namespace regardless of field placement. The two categories of fix that would actually work, per this subtopic\'s theory: (1) a scheduled job (CI cron or in-cluster CronJob) that periodically checks a custom "last activity" annotation the deploy pipeline itself must be updated to write, deleting namespaces past their TTL, or (2) a purpose-built third-party controller like kube-janitor that watches for TTL annotations on namespaces specifically and deletes them once expired — both requiring genuinely new automation to be built and deployed, not a configuration flag on the existing ephemeral-environment pipeline.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Kubernetes\' TTL-after-finished controller (ttlSecondsAfterFinished) can be applied to any resource type, including Namespaces, to automatically clean up idle environments.',
      reality: 'This subtopic\'s theory and first code example show ttlSecondsAfterFinished is specifically a Job spec field, triggered by a Job reaching a Complete or Failed state — Namespace objects have no equivalent field, and no equivalent "finished" state a long-running namespace could ever reach to trigger it.'
    },
    {
      thought: 'Adding "a TTL" for ephemeral environment cleanup, per the main page\'s own bullet point, is a simple configuration option available directly from Kubernetes — comparable in effort to the auto-destroy-on-merge step the main page\'s own code tab already implements.',
      reality: 'This subtopic\'s theory shows the two are very different in effort: auto-destroy-on-merge uses a real, existing CI trigger (the PR-closed event) the main page\'s own code tab wires up directly. A time-based inactivity TTL requires building genuinely new infrastructure — a scheduled job or a third-party controller, plus a way to actually track "last activity" that Kubernetes does not provide on its own.'
    },
    {
      thought: 'Once an ephemeral namespace has been idle for a while with no new deployments, Kubernetes itself has some awareness of this and could theoretically expose that information if asked.',
      reality: 'This subtopic\'s theory states plainly that Kubernetes has no built-in concept of "namespace inactivity" at all — a namespace with a running deployment untouched for a week looks structurally identical to the API server as one deployed a minute ago. Any notion of "last activity" has to be defined and actively tracked by a team\'s own tooling (e.g. a custom annotation updated by the deploy pipeline), not read off any existing Kubernetes state.'
    }
  ];
}
