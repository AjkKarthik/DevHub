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
  templateUrl: './apply-uses-three-way-merge-via-last-applied-annotation.html',
  styleUrl: './apply-uses-three-way-merge-via-last-applied-annotation.scss'
})
export class ApplyUsesThreeWayMergeViaLastAppliedAnnotationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says apply "computes and applies only the diff" — diff between what and what?',
      points: [
        'The main page\'s own theory says: "kubectl apply reconciles a YAML manifest against the cluster\'s current state declaratively, computing and applying only the diff." Read on its own, this sounds like a straightforward two-way comparison: new manifest vs. live object, patch whatever differs.',
        'A two-way diff like that has a real limitation the main page never surfaces: if you simply DELETE a field from your manifest (say, removing an `env:` entry you no longer want), a plain two-way diff against the live object can\'t tell the difference between "this field was never something apply should manage" and "this field WAS managed by apply and should now be removed." Both look identical from a pure manifest-vs-live-state comparison.',
        'kubectl apply solves this with a genuinely three-way comparison, using a piece of state the main page never mentions: the `kubectl.kubernetes.io/last-applied-configuration` annotation, which apply writes onto every object it touches, storing a snapshot of the manifest from the PREVIOUS apply.',
      ]
    },
    {
      heading: 'What the three-way merge actually compares, and why it changes how field removal works',
      points: [
        'Every `kubectl apply` compares THREE things, not two: (1) the last-applied-configuration annotation (what you applied last time), (2) the live object\'s current state (which may include changes from other sources — a controller, another operator, a manual kubectl edit), and (3) the new manifest you\'re applying now.',
        'A field present in (1) but absent from (3) — present in what you applied before, but no longer in your new manifest — is treated as an INTENTIONAL removal, and apply patches it out of the live object. A field that was NEVER in (1) at all, but happens to be missing from (3) too, is invisible to apply entirely — it was never something apply was managing, so apply leaves it alone regardless of what it currently is on the live object.',
        'This directly explains a subtlety the main page\'s own drift-warning bullet gestures at but never fully unpacks: "a manually kubectl edit-ed object no longer matches its source-controlled manifest, and the next kubectl apply may silently overwrite the manual change (or vice versa) depending on which fields changed" — specifically, WHICH fields get overwritten and which survive depends entirely on whether THOSE SPECIFIC fields are present in the last-applied annotation, not just on whether they differ from the new manifest.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Watching the three-way merge decide what to remove and what to leave alone',
      language: 'bash',
      code: `# Apply #1 -- initial manifest
# deployment.yaml:
#   spec:
#     template:
#       spec:
#         containers:
#         - name: api
#           image: myapp:1.0
#           env:
#           - name: LOG_LEVEL
#             value: info

kubectl apply -f deployment.yaml
kubectl get deployment api -o jsonpath='{.metadata.annotations.kubectl\\.kubernetes\\.io/last-applied-configuration}'
# {"spec":{"template":{"spec":{"containers":[{"name":"api",
#   "image":"myapp:1.0","env":[{"name":"LOG_LEVEL","value":"info"}]}]}}}}
# -- the FULL manifest, snapshotted, right after apply #1.

# ── Apply #2 -- LOG_LEVEL removed from the manifest entirely ─────────────
# deployment.yaml (env: block deleted):
#   spec:
#     template:
#       spec:
#         containers:
#         - name: api
#           image: myapp:1.0

kubectl apply -f deployment.yaml
kubectl get deployment api -o jsonpath='{.spec.template.spec.containers[0].env}'
# null  -- LOG_LEVEL was REMOVED from the live object.
#
# WHY: LOG_LEVEL was present in last-applied-configuration (from
# apply #1) but absent from the new manifest -- apply correctly
# read this as "you want it gone" and patched it out.`,
    },
    {
      label: 'A field apply was never managing survives, even with the same-looking diff',
      language: 'bash',
      code: `# A separate controller (or a human) adds an annotation directly
# to the SAME Deployment, OUTSIDE of any kubectl apply:
kubectl annotate deployment api monitoring.example.com/scrape=true

# That annotation was NEVER part of any manifest you've applied --
# it does not appear in last-applied-configuration at all.

# Now re-run the EXACT SAME apply #2 manifest again (still missing
# LOG_LEVEL, still never mentioning the monitoring annotation):
kubectl apply -f deployment.yaml

kubectl get deployment api -o jsonpath='{.metadata.annotations}'
# monitoring.example.com/scrape: "true"   <- STILL THERE, untouched

# Even though the new manifest doesn't mention this annotation --
# exactly the same situation, on paper, as the LOG_LEVEL removal --
# apply leaves it alone, because it was never present in
# last-applied-configuration in the first place. Apply only ever
# acts on fields IT has previously managed; it never claims
# ownership of a field it never applied, no matter how the current
# manifest compares to the live state.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team removes a resource-limits block from their Deployment manifest, intending to let the workload use unlimited resources going forward, and runs kubectl apply. Separately, another engineer had earlier run kubectl edit deployment api to manually add a toleration for a specific taint, directly on the live cluster, never captured in any manifest. After the apply, the team is surprised the resource-limits block is gone from the live object (as they wanted) but the manually-added toleration is untouched. Using this subtopic\'s theory, explain why apply treated these two fields so differently, given neither appears in the new manifest.',
    hint: 'Per this subtopic\'s theory, does apply\'s decision to remove or preserve a field depend on whether that field is missing from the NEW manifest, or on whether it was present in the LAST-APPLIED annotation from a previous apply?',
    solution: 'Per this subtopic\'s theory, the two fields behave differently because of what was ever in the last-applied-configuration annotation, not because of anything about the new manifest itself — both fields are equally absent from it. The resource-limits block WAS part of a previous manifest the team applied, so it exists in the last-applied annotation from that earlier apply; being absent from the new manifest, apply correctly reads this as an intentional removal and patches it out. The manually-added toleration, by contrast, was added directly via kubectl edit, completely outside any apply — it was never captured in any manifest, so it never entered the last-applied annotation at all. From apply\'s own three-way comparison, this field simply isn\'t something it has ever managed, so its absence from the new manifest carries no meaning — apply leaves it exactly as it found it. The practical lesson: kubectl apply only ever "owns" and reconciles fields that have appeared in a manifest it has actually applied before; anything set outside that path survives indefinitely, until either it\'s explicitly added to a manifest and then later removed, or something else (like kubectl edit or a separate controller) changes it directly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'kubectl apply computes what to change by comparing the new manifest directly against the live object\'s current state — a straightforward two-way diff.',
      reality: 'Per this subtopic\'s theory, apply performs a three-way comparison, also consulting the kubectl.kubernetes.io/last-applied-configuration annotation stored from the previous apply — this is specifically what lets it distinguish "a field I\'m intentionally removing" from "a field I never managed in the first place."'
    },
    {
      thought: 'If a field is missing from your new manifest and also missing from what you last applied, kubectl apply will still remove it from the live object if it currently has some value there.',
      reality: 'Per this subtopic\'s exercise, apply only removes fields that WERE present in the last-applied-configuration annotation — a field it never previously managed (set by another tool, a controller, or a manual kubectl edit) is left completely untouched, no matter what the new manifest does or doesn\'t mention.'
    },
    {
      thought: 'Removing a field from a manifest and re-applying is the same, in terms of what ends up on the live object, as never having included that field in any manifest at all.',
      reality: 'Per this subtopic\'s theory, these produce different outcomes specifically because of the last-applied-configuration annotation\'s own history — a field that was previously applied and then removed from the manifest gets actively patched out; a field that was simply never applied at all was never apply\'s responsibility to manage in the first place.'
    }
  ];
}
