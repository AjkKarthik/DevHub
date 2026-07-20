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
  templateUrl: './flux-interval-is-a-drift-fallback-not-a-git-trigger.html',
  styleUrl: './flux-interval-is-a-drift-fallback-not-a-git-trigger.scss'
})
export class FluxIntervalIsADriftFallbackNotAGitTriggerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code tab sets TWO different intervals and implies they simply add up to total sync delay',
      points: [
        'The main page\'s own "Flux GitRepository + Kustomization" code tab sets `GitRepository.spec.interval: 1m` and, separately, `Kustomization.spec.interval: 10m`. The main page\'s own theory bullet says only: "Flux interval: by default Flux reconciles every 10 minutes... interval: 1m on a Kustomization for faster sync" — collapsing two genuinely separate controllers\' settings into one vague "Flux interval" concept, and never explaining what happens when they differ, exactly as the main page\'s own code tab has them.',
        'Flux\'s own documentation defines each independently: for GitRepository, "spec.interval is a required field that specifies the interval at which the Git repository must be fetched." For Kustomization, "spec.interval is a required field that specifies the interval at which the Kustomization is reconciled, i.e. the controller fetches the source... builds the Kustomization and applies it." Two separate controllers, two separate clocks — Source Controller polls Git on its own schedule, Kustomize Controller polls the FETCHED result on a different schedule.',
      ]
    },
    {
      heading: 'The genuinely surprising part: a real Git push is NOT actually gated by either interval',
      points: [
        'Flux\'s own Kustomization documentation states directly: "If the .metadata.generation of a resource changes... or the Source revision changes (which generates a Kubernetes event), this is handled instantly outside the interval window." A new commit landing in Git is exactly this case — the GitRepository detects the new revision and emits an event; the Kustomization controller reacts to that event immediately, rather than waiting for its own 10-minute clock to tick.',
        'This means the main page\'s own two-interval setup (`1m` / `10m`) is far less consequential for a NORMAL Git push than the theory bullet\'s framing suggests — a push is typically fetched and applied within roughly a minute (bounded mostly by the GitRepository\'s own 1m fetch interval), not up to 10 minutes later. The Kustomization\'s own 10-minute interval is doing a DIFFERENT job: it is the periodic fallback re-check that catches drift Flux wasn\'t already notified about — for example, someone manually editing a resource in the cluster with no corresponding Git change at all, which produces no "Source revision changed" event for anything to react to instantly.',
        'The practical takeaway inverts the main page\'s own "interval: 1m for faster sync" framing: shortening the Kustomization\'s interval mostly speeds up how quickly UNPROMPTED drift gets caught and corrected, not how quickly a genuine Git push gets applied — that part is already event-driven and fast, gated primarily by the GitRepository\'s own fetch interval instead.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two clocks, two different jobs -- the main page\'s own exact values',
      language: 'bash',
      code: `# GitRepository -- Source Controller's own clock
# apiVersion: source.toolkit.fluxcd.io/v1
# kind: GitRepository
# spec:
#   interval: 1m     # how often the REPO ITSELF is polled for a
#                    # new commit

# Kustomization -- Kustomize Controller's own, SEPARATE clock
# apiVersion: kustomize.toolkit.fluxcd.io/v1
# kind: Kustomization
# spec:
#   interval: 10m    # how often a FULL re-apply happens even if
#                    # nothing new was detected

# Naive reading: "a push could take up to 11 minutes to apply
# (1m to notice + up to 10m to actually reconcile)."
#
# What Flux's own docs actually say happens: a Source revision
# change "generates a Kubernetes event" that is "handled instantly
# outside the interval window" -- the Kustomization controller
# reacts to that event right away, it does NOT wait for its own
# 10-minute clock. A real push is applied roughly within the
# GitRepository's own 1-minute fetch cycle, not 10.`,
    },
    {
      label: 'What the 10-minute Kustomization interval is actually FOR',
      language: 'bash',
      code: `# Scenario: nobody pushes anything to Git. An engineer manually
# runs "kubectl edit deployment myapp" and changes the replica
# count directly in the cluster.

# This produces NO Source revision change at all -- GitRepository's
# own 1-minute polling finds nothing new, because nothing in Git
# changed. There is no "instant event" for the Kustomization
# controller to react to here.

# This drift is only caught the NEXT time the Kustomization's own
# periodic interval fires -- per Flux's own docs, this is exactly
# the fallback case the interval exists for, separate from the
# event-driven fast path Git pushes take.
#
# With interval: 10m -> up to 10 minutes of undetected drift
# With interval: 1m  -> up to 1 minute of undetected drift

# This is the SAME distinction ArgoCD's own selfHeal makes between
# a fast, event-driven reaction and a slower periodic background
# reconciliation -- Flux's Kustomization interval is playing the
# same fallback role, just under a different name.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team, following the main page\'s own "interval: 1m on a Kustomization for faster sync" guidance, shortens their production Kustomization\'s interval from 10m to 1m specifically to make Git pushes deploy faster. After the change, they notice pushes still seem to apply in roughly a minute, same as before — no real improvement. Using this subtopic\'s theory, explain why shortening the Kustomization interval didn\'t meaningfully speed up Git-triggered deploys, and what it actually improved instead.',
    hint: 'Per this subtopic\'s theory, is a genuine Git push actually gated by the Kustomization\'s own periodic interval at all, or is it handled a different way?',
    solution: 'Shortening the Kustomization interval didn\'t meaningfully speed up Git-triggered deploys because, per this subtopic\'s theory, a real push was never actually gated by that interval in the first place — Flux\'s own docs state that a Source revision change "generates a Kubernetes event" that is "handled instantly outside the interval window," so the Kustomization controller was already reacting to pushes immediately, bounded mainly by the GitRepository\'s own fetch interval (unchanged in this scenario). What the shortened Kustomization interval DID genuinely improve is the OTHER case this subtopic\'s theory describes: how quickly Flux catches and corrects drift that has no corresponding Git change at all — like a manual kubectl edit — which only gets caught on the Kustomization\'s own periodic re-check, not via any instant event. The team optimized the wrong lever for their stated goal; the GitRepository\'s own interval is what actually bounds Git-push latency.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Git push takes up to the FULL Kustomization interval (e.g. 10 minutes) to actually reach the cluster, since that\'s the interval that governs when Flux "applies" changes.',
      reality: 'Per this subtopic\'s theory, Flux\'s own docs describe Source revision changes as "handled instantly outside the interval window" — a genuine push triggers an immediate reaction via a Kubernetes event, bounded mainly by the GitRepository\'s own (usually much shorter) fetch interval, not the Kustomization\'s longer periodic interval.'
    },
    {
      thought: 'GitRepository.interval and Kustomization.interval are really just two names for the same underlying "how often does Flux sync" setting, and the main page\'s own code tab setting them differently (1m vs 10m) is likely inconsistent or a minor oversight.',
      reality: 'This subtopic\'s theory shows they govern two genuinely separate controllers with separate jobs — GitRepository.interval controls how often the repo is FETCHED; Kustomization.interval controls how often a full re-apply happens as a FALLBACK drift check. Setting them to different values, exactly as the main page\'s own code tab does, is intentional and meaningful, not an inconsistency.'
    },
    {
      thought: 'Shortening a Kustomization\'s interval is the correct way to make Git-triggered deployments reach the cluster faster.',
      reality: 'This subtopic\'s exercise shows that lever mostly controls drift-detection speed for changes Flux WASN\'T already notified about — a genuine Git push is event-driven and already fast. The GitRepository\'s own fetch interval is the more relevant setting for reducing Git-push-to-cluster latency specifically.'
    }
  ];
}
