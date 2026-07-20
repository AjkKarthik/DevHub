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
  templateUrl: './sync-waves-wait-for-healthy-not-just-applied.html',
  styleUrl: './sync-waves-wait-for-healthy-not-just-applied.scss'
})
export class SyncWavesWaitForHealthyNotJustAppliedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry shows sync-wave numbers but never says what "wave complete" actually requires',
      points: [
        'The main page\'s own "No sync wave annotations" mistake entry lists a wave ordering — CRDs/namespaces at "-2", ConfigMaps/Secrets at "-1", Deployments/Services at "0" (default), smoke tests at "+1" — and explains the PROBLEM waves solve (a Deployment starting before its ConfigMap exists). It never says what condition actually has to be met before ArgoCD considers an earlier wave "done" and starts the next one.',
        'ArgoCD\'s own documentation is specific about this: "First Argo CD determines the number of the first wave to apply. This is the first number where any resource is out-of-sync or unhealthy," and separately, the whole sync process "repeats this process until all phases and waves are in-sync and healthy." The gating condition is HEALTH, not merely having been applied (created) in the cluster.',
      ]
    },
    {
      heading: 'Why "applied" and "healthy" are genuinely different for some resource types',
      points: [
        'For a ConfigMap or a plain Secret, "applied" and "healthy" happen at effectively the same moment — the object either exists in etcd or it doesn\'t, with no meaningful in-between state. This is exactly the kind of resource the main page\'s own wave -1 example uses, which is probably why the main page\'s own framing never surfaces the distinction at all.',
        'For other resource types the gap is real and consequential: a Deployment is "applied" the instant its object is created, but only becomes "healthy" once its pods are actually running and passing readiness checks — which can take anywhere from seconds to minutes. A Job is "applied" on creation but ArgoCD\'s own health assessment for a Job only reports healthy once it actually COMPLETES successfully, not merely once it starts running.',
        'The practical consequence: if a team put a database-migration Job at wave -1 (a reasonable choice — migrations should run before the application that depends on them), ArgoCD would correctly wait for that migration Job to fully COMPLETE, not just start, before wave 0\'s Deployments begin syncing — exactly the guarantee a migration-then-app ordering needs, and a guarantee that would silently NOT hold if sync waves only waited for "applied."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ConfigMaps hide the health-vs-applied distinction; a migration Job reveals it',
      language: 'bash',
      code: `# The main page's own wave assignment:
# CRDs/namespaces:      sync-wave: "-2"
# ConfigMaps/Secrets:   sync-wave: "-1"
# Deployments/Services: sync-wave: "0" (default)

# For a ConfigMap specifically, "applied" and "healthy" are the
# same instant -- there's no meaningful readiness state for a
# ConfigMap to reach beyond simply existing. This makes the
# main page's own example easy to read as "waves wait for things
# to be CREATED" -- a plausible but incomplete generalization.

# A more revealing wave -1 resource: a Job that runs DB migrations
# before the app deploys.
#
# apiVersion: batch/v1
# kind: Job
# metadata:
#   name: db-migrate
#   annotations:
#     argocd.argoproj.io/sync-wave: "-1"
# spec:
#   template:
#     spec:
#       containers:
#       - name: migrate
#         image: myapp:latest
#         command: ["./migrate.sh"]
#       restartPolicy: Never

# Per ArgoCD's own docs ("repeats this process until all phases
# and waves are in-sync and healthy"), wave 0's Deployment does
# NOT start the moment this Job object is created -- ArgoCD's own
# health check for a Job only reports Healthy once it actually
# COMPLETES successfully. The app genuinely waits for migrations
# to finish, not just start.`,
    },
    {
      label: 'Ordering within a single wave -- kind and name, not declaration order',
      language: 'bash',
      code: `# Per ArgoCD's own docs, resources within the SAME wave are
# ordered by: "1. The phase  2. The wave  3. By kind (e.g.
# namespaces first and then other Kubernetes resources, followed
# by custom resources)  4. By name"

# Two resources both at sync-wave: "-1", declared in this order
# in the manifest source:
#
# ---
# kind: Secret
# metadata: { name: zzz-db-creds, annotations: { sync-wave: "-1" } }
# ---
# kind: ConfigMap
# metadata: { name: aaa-app-config, annotations: { sync-wave: "-1" } }

# Despite Secret being declared FIRST in the file, ArgoCD's own
# kind-then-name ordering does not care about manifest order at
# all -- within the same wave, ordering is deterministic based on
# kind and name, not the sequence resources happen to appear in
# the source YAML. (No explicit wait occurs BETWEEN resources in
# the same wave before the wave's own overall health check --
# same-wave resources are effectively applied together.)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team puts a database-migration Job at sync-wave "-1" (same wave the main page\'s own example uses for ConfigMaps/Secrets), expecting ArgoCD to wait for the migration to finish before the wave "0" Deployment starts. During a deploy, they observe the Deployment\'s pods starting to run queries against tables the migration hadn\'t created yet — the ordering didn\'t seem to hold. Using this subtopic\'s theory, name the most likely cause (not the wave number itself).',
    hint: 'Per this subtopic\'s theory, what does ArgoCD actually need to observe about a Job specifically — not a ConfigMap — before treating it as "healthy" enough to unblock the next wave?',
    solution: 'The wave assignment itself (Job at -1, Deployment at 0) is correct and should work per this subtopic\'s theory — ArgoCD\'s own docs describe waiting for "all phases and waves are in-sync and healthy" before advancing, and a Job\'s health specifically requires it to actually COMPLETE, not merely start. The most likely cause of the observed failure is that the Job\'s Pod spec is missing (or misconfigured on) a `restartPolicy: Never` / appropriate `backoffLimit`, OR — more commonly — ArgoCD\'s health check genuinely IS waiting correctly, but the team never noticed the sync appeared to "hang" waiting for the Job, and manually intervened or had `selfHeal`/automated sync retry in a way that let the Deployment\'s resources get created out of band before the migration Job\'s wait was actually satisfied. Either way, the fix is confirming the migration Job\'s manifest is configured so ArgoCD can correctly observe a genuine "Completed" status (checking `kubectl get job db-migrate` and its actual completion state), rather than assuming the wave-based ordering alone is what failed — per this subtopic\'s theory, ArgoCD is documented to already wait for real health, not just for a resource to exist.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ArgoCD moves on to the next sync wave as soon as every resource in the current wave has been successfully applied (created) in the cluster.',
      reality: 'Per this subtopic\'s theory, ArgoCD\'s own docs describe the actual gate as HEALTH, not application — "repeats this process until all phases and waves are in-sync and healthy." For resource types with a meaningful in-between state (Deployments, Jobs), "applied" and "healthy" can be minutes apart, and ArgoCD waits for the latter.'
    },
    {
      thought: 'Since the main page\'s own sync-wave example uses ConfigMaps and Secrets, "sync waves wait for resources to exist" is a safe general description of how they work for any resource type.',
      reality: 'This subtopic\'s theory shows ConfigMaps/Secrets are actually a special case where "applied" and "healthy" happen to coincide — they mask the real, more general rule. A Job or Deployment at an earlier wave reveals the actual gating condition is health-based, which can mean a real, sometimes lengthy wait before the next wave starts.'
    },
    {
      thought: 'Resources placed in the same sync-wave are applied strictly in the order they\'re declared in the source manifests.',
      reality: 'Per this subtopic\'s theory, ArgoCD\'s own docs describe same-wave ordering as being by "kind... followed by... name" — not by declaration order in the YAML source at all. Two same-wave resources apply in a deterministic kind/name order regardless of which one appears first in the file.'
    }
  ];
}
