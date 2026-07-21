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
  templateUrl: './generation-vs-observedgeneration-tracks-controller-catch-up.html',
  styleUrl: './generation-vs-observedgeneration-tracks-controller-catch-up.scss'
})
export class GenerationVsObservedgenerationTracksControllerCatchUpSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Challenge introduces generation and observedGeneration with zero prior explanation',
      points: [
        'The main page\'s own "Deployment Health Checker" Challenge hint says to "compare generation to observedGeneration — if they differ, a rollout is in progress" — but neither field appears ANYWHERE else on the page: not in the quickRef, not in the theory sections, not in the mistakes, not in the quiz, not in the QnA. A reader reaches the Challenge having never seen either term defined.',
        'This is different from the page\'s own readyReplicas/unavailableReplicas fields, which the QnA section directly explains in the "rolling update mechanics" answer — generation and observedGeneration are the one piece of Challenge vocabulary the main page assumes without ever supplying.',
      ]
    },
    {
      heading: 'What they actually are: two different counters tracking two different things',
      points: [
        'Per Kubernetes\' own API conventions, `metadata.generation` is a monotonically increasing integer that the API server increments every time the resource\'s `spec` changes — NOT on every change; a status-only update (like a Pod becoming Ready) does not bump it, only an actual spec edit does (e.g. `kubectl set image`, editing replica count, or any `kubectl apply` that changes the Deployment\'s spec).',
        '`status.observedGeneration` is a completely separate field, written by the DEPLOYMENT CONTROLLER itself (not the API server) — it records which generation of the spec the controller has actually finished processing and reacted to.',
        'When `metadata.generation` is greater than `status.observedGeneration`, it means the controller has not yet caught up to the latest spec change at all — this is a DIFFERENT, EARLIER signal than `kubectl rollout status`\'s own updatedReplicas/readyReplicas tracking, which only makes sense once the controller has already started acting on the new spec. A GitOps pipeline that checks readyReplicas without first confirming generation === observedGeneration risks reading STALE status left over from the previous rollout, before the controller has even noticed the new one.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Watching generation bump on a spec change the main page\'s own commands trigger',
      language: 'bash',
      code: `# The main page's own "Rollout commands" code tab already uses this
# exact command -- but never shows what it does to generation:
kubectl set image deployment/web app=myapp:2.0

# metadata.generation increments immediately -- the API server bumps
# it the instant the spec write is accepted, before any Pod has even
# started rolling:
kubectl get deployment web -o jsonpath='{.metadata.generation}'
# 4   <- was 3 a moment ago; this is a SPEC-level counter, not a
#        Pod/replica-status counter at all

# status.observedGeneration is still 3 for a brief moment, until the
# Deployment controller's own reconcile loop picks up the change:
kubectl get deployment web -o jsonpath='{.status.observedGeneration}'
# 3   <- the controller has not yet "seen" generation 4

# Once the controller's reconcile loop runs and starts acting on the
# new spec (creating the new ReplicaSet, beginning the rollout):
kubectl get deployment web -o jsonpath='{.status.observedGeneration}'
# 4   <- now matches metadata.generation -- the controller has
#        caught up and is actively working the new spec`,
    },
    {
      label: 'Why this differs from readyReplicas, and why order matters',
      language: 'bash',
      code: `# The main page's own Challenge hint sequence, mapped to what each
# check actually verifies:

# CHECK 1 -- has the controller even NOTICED the new spec yet?
kubectl get deployment web -o jsonpath='{.metadata.generation} {.status.observedGeneration}'
# "4 3"  -> controller hasn't caught up; readyReplicas below is
#           still describing the OLD (generation 3) rollout state,
#           not anything about the new image the team just pushed

# CHECK 2 -- only meaningful once generation === observedGeneration:
kubectl get deployment web -o jsonpath='{.status.readyReplicas} {.status.unavailableReplicas}'
# reading THIS first, without checking generation vs
# observedGeneration, risks reporting "rollout looks healthy" based
# on the PREVIOUS rollout's already-settled status, moments before
# the controller even starts reacting to the brand-new spec change

# This is exactly why GitOps tools like Argo CD explicitly wait for
# observedGeneration to catch up to generation BEFORE trusting any
# replica-count-based health signal -- it's the "has my change even
# been picked up" gate that has to pass first.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s own Challenge hint says to compare <code>generation</code> to <code>observedGeneration</code> and treat a mismatch as "a rollout is in progress." A team\'s health-check script instead only polls <code>status.readyReplicas</code> against the desired replica count, reasoning that a healthy replica count is proof enough that any rollout has finished. Immediately after running <code>kubectl set image</code>, their script reports "healthy" for a brief moment before correctly flipping to "rolling out." Using this subtopic\'s theory, why does this false-positive window exist?',
    hint: 'What does <code>metadata.generation</code> bump on, versus what does <code>status.readyReplicas</code> describe? Which one updates first after a spec change, and which one can still be describing the PREVIOUS rollout\'s already-settled state?',
    solution: 'Per this subtopic\'s theory, the false-positive window exists because readyReplicas is a status field the Deployment CONTROLLER writes only after it has processed a spec change — but metadata.generation bumps immediately, the instant the API server accepts the new spec, well before the controller\'s own reconcile loop has even run. In the gap between those two moments, status.observedGeneration (and every other status field the controller owns, including readyReplicas) is still describing the PREVIOUS generation\'s already-settled, healthy state — there is nothing wrong with those old replicas, so readyReplicas correctly shows a full healthy count, but that count has nothing to do with the brand-new image the team just pushed. The script\'s "healthy" report during that window isn\'t reading stale or broken data — it\'s reading perfectly accurate data about the WRONG generation. The fix, exactly as the main page\'s own Challenge hint implies, is to check generation against observedGeneration FIRST — a mismatch means the controller hasn\'t caught up yet, so any replica-status field read at that moment cannot yet be trusted as a signal about the new rollout at all, regardless of how healthy it looks.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own Challenge hint field, <code>generation</code>, increments on any change to the Deployment object at all — including status updates like a Pod becoming Ready — the same way <code>resourceVersion</code> does.',
      reality: 'Per this subtopic\'s theory, <code>metadata.generation</code> only increments on a SPEC change (an actual edit to what the user wants) — status-only updates, which happen constantly as Pods report readiness, do not bump it. This is what makes it a specifically useful "did the desired state change" signal, distinct from resourceVersion\'s much noisier every-write increment.'
    },
    {
      thought: 'Checking <code>status.readyReplicas</code> against the desired replica count is always a sufficient way to confirm a rollout triggered by <code>kubectl set image</code> has actually started and completed.',
      reality: 'Per this subtopic\'s exercise, readyReplicas can accurately report a fully healthy count while still describing the PREVIOUS generation\'s already-finished rollout, in the brief window before the controller has even observed the newest spec change — comparing generation to observedGeneration first is what confirms the controller has caught up to the change being checked for.'
    },
    {
      thought: 'observedGeneration is written by the Kubernetes API server, the same component that increments metadata.generation, so the two fields should always update together.',
      reality: 'Per this subtopic\'s theory, the two fields are written by entirely different components — the API server bumps metadata.generation immediately on any accepted spec write, while status.observedGeneration is written later, by the Deployment CONTROLLER, only once its own reconcile loop has actually processed that generation — the gap between them is a real, observable window, not a synchronized pair.'
    }
  ];
}
