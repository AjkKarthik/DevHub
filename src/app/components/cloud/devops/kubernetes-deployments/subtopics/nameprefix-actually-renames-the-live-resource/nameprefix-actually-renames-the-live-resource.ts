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
  templateUrl: './nameprefix-actually-renames-the-live-resource.html',
  styleUrl: './nameprefix-actually-renames-the-live-resource.scss'
})
export class NameprefixActuallyRenamesTheLiveResourceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code tab uses namePrefix in one place and a prefixed resource name in another, without connecting the two',
      points: [
        'The main page\'s own "Kustomize Overlays" code tab sets `namePrefix: prod-` in `overlays/production/kustomization.yaml`. Several sections later, in the "GitHub Actions Kustomize step," the exact same code tab runs `kubectl rollout status deployment/prod-myapp -n production --timeout=120s` — using the prefixed name `prod-myapp`, not the base name `myapp` the Deployment manifest itself actually declares.',
        'Nothing in the code tab\'s own comments explicitly states that these two facts are connected — that `namePrefix: prod-` is THE REASON the rollout-status command has to reference `prod-myapp` rather than `myapp`. A reader skimming past the kustomization.yaml section could easily miss why the later kubectl command uses a name that doesn\'t appear anywhere in the base `deployment.yaml`.',
      ]
    },
    {
      heading: 'namePrefix is not cosmetic labeling — it renames the actual live Kubernetes object',
      points: [
        'Kustomize\'s `namePrefix` transformer rewrites the `metadata.name` field of every applicable resource in the overlay to have that prefix — the base `deployment.yaml` declares `metadata.name: myapp`, but after `kustomize build` (or `kubectl apply -k`) processes the production overlay, the actual object created in the cluster is named `prod-myapp`, not `myapp`. This is a genuine rename of the live resource, not a tag, label, or annotation layered on top of the original name.',
        'This is precisely why any command that references the Deployment by name AFTER applying through this overlay — `kubectl rollout status`, `kubectl describe`, `kubectl logs -l ...` targeting it directly by resource name, `kubectl delete deployment/...` — has to use the PREFIXED name. Using the base name (`myapp`) against the production overlay\'s output would fail with a "not found" error, since no object by that exact name exists in the `production` namespace once Kustomize has processed it.',
        'The staging overlay in the same code tab uses a DIFFERENT prefix (`namePrefix: stg-`), meaning the exact same base Deployment produces a resource named `stg-myapp` in the `staging` namespace and `prod-myapp` in `production` — the same base manifest, same `deployment.yaml` file, genuinely different live resource names depending purely on which overlay was applied.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing namePrefix from the overlay config to the actual live object name',
      language: 'bash',
      code: `# base/deployment.yaml -- the ORIGINAL name declared here:
# apiVersion: apps/v1
# kind: Deployment
# metadata:
#   name: myapp        # <-- this is what the base manifest says

# overlays/production/kustomization.yaml -- the main page's own file:
# namePrefix: prod-     # <-- rewrites metadata.name for every
#                       #     applicable resource in this overlay
# namespace: production
# resources:
#   - ../../base

# Rendering the overlay shows the actual result:
kustomize build k8s/overlays/production | grep -A2 "kind: Deployment"
# kind: Deployment
# metadata:
#   name: prod-myapp    # <-- NOT "myapp" -- namePrefix genuinely
#                       #     renamed the live object

# This is exactly why the main page's own LATER step in the same
# code tab has to say "prod-myapp", not "myapp":
kubectl rollout status deployment/prod-myapp -n production --timeout=120s
#                                  ^^^^^^^^^^
#                       matches the RENAMED object, not the base
#                       manifest's own declared name`,
    },
    {
      label: 'The same base manifest, two different overlays, two different live names',
      language: 'bash',
      code: `# overlays/staging/kustomization.yaml -- the main page's own file:
# namePrefix: stg-
# namespace: staging
# resources:
#   - ../../base

# Same base/deployment.yaml (metadata.name: myapp) as production
# uses -- but a DIFFERENT prefix produces a DIFFERENT live name:

kustomize build k8s/overlays/staging | grep -A2 "kind: Deployment"
# kind: Deployment
# metadata:
#   name: stg-myapp     # <-- different from prod-myapp

# A command referencing "myapp" (the base name, matching neither
# overlay's actual output) against EITHER namespace fails:
kubectl rollout status deployment/myapp -n staging
# Error from server (NotFound): deployments.apps "myapp" not found
#   -- because the live object in "staging" is actually named
#      "stg-myapp", not "myapp"

kubectl rollout status deployment/myapp -n production
# Error from server (NotFound): deployments.apps "myapp" not found
#   -- same problem, different namespace, live object is
#      "prod-myapp"

# The base manifest's own name ("myapp") never actually exists as
# a live object in EITHER environment once namePrefix is applied --
# only the prefixed forms do.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, following the main page\'s own Kustomize overlay pattern, adds a new CI step that runs `kubectl logs -l app=myapp -n production --tail=50` to check recent logs right after a deploy, and it returns zero log lines even though the Pods are clearly running (visible in the dashboard). Using this subtopic\'s theory, explain the most likely cause, keeping in mind namePrefix affects `metadata.name`, and consider whether the same reasoning could extend to label selectors.',
    hint: 'Per this subtopic\'s theory, namePrefix rewrites metadata.name. Does the base deployment.yaml\'s pod template label (app: myapp) also get affected by any Kustomize overlay behavior, or does that depend on what else the overlay does?',
    solution: 'This one is subtler than a pure namePrefix issue, per this subtopic\'s theory: namePrefix specifically rewrites `metadata.name`, but the `-l app=myapp` selector is matching against POD LABELS, not the Deployment\'s own name — whether this command finds anything depends on whether the base deployment.yaml\'s pod template label (`app: myapp`, visible in the main page\'s own Deployment manifest) was ALSO transformed by something in the overlay. If the production overlay only sets `namePrefix` and `namespace` (as the main page\'s own kustomization.yaml does) with no `commonLabels` or similar label-rewriting field, the Pods\' own `app: myapp` label survives unchanged even though the Deployment OBJECT itself is renamed to `prod-myapp` — meaning `-l app=myapp` should actually still work correctly in this specific case. The more likely cause of zero results here is worth checking directly: confirming the label selector\'s value and key exactly match what\'s on the live Pods (`kubectl get pods -n production --show-labels`), since unlike the Deployment\'s own name (which this subtopic\'s theory confirms IS rewritten), Kustomize doesn\'t automatically touch every label just because namePrefix is set — those are two independently-controlled transformations.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Kustomize\'s namePrefix is a cosmetic or organizational label — the underlying Kubernetes object keeps its original name from the base manifest, with the prefix just shown in tooling or dashboards.',
      reality: 'Per this subtopic\'s theory, namePrefix genuinely rewrites `metadata.name` — the live object created in the cluster IS named with the prefix (e.g. `prod-myapp`), and the base manifest\'s own declared name (`myapp`) never exists as an actual object once the overlay is applied.'
    },
    {
      thought: 'Since the main page\'s own base deployment.yaml declares `metadata.name: myapp`, any kubectl command should be able to reference the Deployment as "myapp" regardless of which overlay was used to apply it.',
      reality: 'This subtopic\'s second code example shows this fails with a NotFound error against both overlays — the base name never becomes a live object once namePrefix is set; commands must use the actual post-transformation name (`prod-myapp` or `stg-myapp`) that matches whichever overlay was actually applied.'
    },
    {
      thought: 'Since namePrefix renames the Deployment object, it must also rename or affect the Pod labels and selectors defined in the same manifest.',
      reality: 'Per this subtopic\'s exercise, namePrefix specifically targets `metadata.name` — Pod template labels are a separate concern, controlled by different Kustomize fields (like `commonLabels`) if label changes are actually needed. A base manifest\'s labels can remain completely unchanged by an overlay that only sets namePrefix.'
    }
  ];
}
