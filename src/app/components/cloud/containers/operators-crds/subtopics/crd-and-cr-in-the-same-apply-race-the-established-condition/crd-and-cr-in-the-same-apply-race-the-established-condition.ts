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
  templateUrl: './crd-and-cr-in-the-same-apply-race-the-established-condition.html',
  styleUrl: './crd-and-cr-in-the-same-apply-race-the-established-condition.scss'
})
export class CrdAndCrInTheSameApplyRaceTheEstablishedConditionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own CRD code tab puts the CRD and its own CR in ONE file, separated only by ---',
      points: [
        'The main page\'s own "CRD definition" code tab defines the `Database` CustomResourceDefinition, then — separated by a single `---` YAML document boundary in the SAME code block — immediately defines a `Database` custom resource (`prod-db`) using that CRD.',
        'Nothing on the page addresses what happens if these two documents are applied together, in one `kubectl apply -f` call, exactly as the single code tab visually presents them. The theory bullet just above it states plainly: "After installing a CRD, you can create, get, list, watch, and delete custom resources like any built-in resource" — with no caveat about timing.',
        'Installing a CRD is not instantaneous from the API server\'s own perspective — there is a real, if usually brief, window between "the CRD object was created" and "the API server is actually ready to accept custom resources of that new type."',
      ]
    },
    {
      heading: 'What "Established" actually means, and why applying both together is a genuine race',
      points: [
        'A newly-created CRD goes through an internal API-server-side process before it can serve custom resources — this state is tracked as a documented `Established` condition on the CRD object itself, which only flips to True once that process finishes.',
        'Per a real, confirmed issue against kubectl\'s own tooling: "when CRDs and CRs are deployed in the same apply, the apply will fail due to race condition... between the Kubernetes cluster applying the new CRD types and tools sending requests that use the new types" — the CR creation request can be sent (and rejected) before the API server has finished registering the type, even though the CRD object itself was already accepted moments earlier.',
        'The documented, reliable fix is an explicit wait step BETWEEN the two applies: apply the CRD, wait for its `Established` condition to become true, THEN apply the custom resource — never assume that "the CRD apply command returned successfully" is the same signal as "the API server is ready to serve this type," and never rely on a single combined apply (or a tight script with no wait) to sequence the two reliably.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own two documents, applied together -- the failure mode',
      language: 'bash',
      code: `# The main page's own code tab, saved as one file and applied
# exactly as shown, in one command:

kubectl apply -f database-crd-and-cr.yaml
# customresourcedefinition.apiextensions.k8s.io/databases.myapp.example.com created
# error: unable to recognize "database-crd-and-cr.yaml": no matches
#   for kind "Database" in version "myapp.example.com/v1"

# What happened: kubectl applies documents in the file roughly in
# order, but the CRD's own "created" response does not mean the
# API server's discovery cache and REST mapping for the new
# "Database" kind are ready YET -- that registration happens
# slightly after the CRD object itself is accepted. The very next
# document in the same apply call (the Database CR) can hit the
# API server before that registration finishes.

# Confirm the CRD's own establishment state directly:
kubectl get crd databases.myapp.example.com -o jsonpath='{.status.conditions[?(@.type=="Established")].status}'
# False   <- right after the CRD apply returns "created", this can
#            still read False for a brief window`,
    },
    {
      label: 'The documented, reliable fix -- an explicit wait between the two applies',
      language: 'bash',
      code: `# Split into two separate apply calls, with an explicit wait for
# the CRD's own Established condition in between:

kubectl apply -f database-crd.yaml
kubectl wait --for=condition=established --timeout=60s \\
  crd/databases.myapp.example.com

kubectl apply -f prod-db-cr.yaml
# database.myapp.example.com/prod-db created   <- reliably succeeds
# now, since the CRD is confirmed ready first

# For GitOps tools that handle this ordering automatically, rather
# than relying on a hand-written wait step:
#
# ArgoCD: sync waves let you assign an explicit ordering number to
# each resource -- CRDs in an earlier wave, CRs that depend on them
# in a later wave, with ArgoCD waiting for the earlier wave to
# report healthy before starting the next one.
#
# Flux: Kustomization resources support healthChecks and
# dependsOn, which can be used the same way -- gate a
# Kustomization containing CRs on an earlier Kustomization
# containing the CRDs actually reporting Established/healthy first.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s CI pipeline runs `kubectl apply -f ./k8s/` against a directory containing both a CRD and several custom resources of that type, copied directly from the main page\'s own combined example. The pipeline fails intermittently — sometimes it succeeds, sometimes it reports "no matches for kind." Using this subtopic\'s theory, why does this fail only sometimes rather than consistently, and what is the one change that would make it reliable?',
    hint: 'Per this subtopic\'s theory, is the CRD-establishment window a fixed, predictable duration, or does its timing vary run to run — and does that match an intermittent, not-always-reproducing failure?',
    solution: 'Per this subtopic\'s theory, the intermittent nature is exactly what a genuine race condition looks like — the CRD-establishment window (the API server registering the new type\'s discovery info and REST mapping) is not a fixed, predictable duration; it can complete before the next document in the same apply call is processed, or it can still be in progress, depending on API server load, timing, and other factors outside the pipeline\'s control. On faster runs, the CR document happens to be processed after establishment completes, and the pipeline succeeds; on slower runs, it\'s processed first, and the "no matches for kind" error appears. The one reliable change, per this subtopic\'s theory, is inserting an explicit `kubectl wait --for=condition=established` step for the CRD between applying it and applying anything that depends on it — this removes the race entirely by making the CI pipeline actually confirm the CRD is ready before proceeding, rather than assuming a successful "created" response for the CRD apply is the same signal as "ready to accept custom resources of this type," which per this subtopic\'s theory it is not.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once kubectl apply reports a CustomResourceDefinition as "created," the API server is immediately ready to accept custom resources of that new type.',
      reality: 'Per this subtopic\'s theory, "created" only confirms the CRD object itself was accepted — the API server needs additional time to register the new type\'s discovery info and REST mapping, tracked as the CRD\'s own Established condition, which can still read False for a brief window right after the CRD apply succeeds.'
    },
    {
      thought: 'Placing a CRD and a custom resource of that type in the same YAML file, separated by ---, and applying them together in one kubectl apply call is a safe, standard pattern, since kubectl processes documents in order.',
      reality: 'Per this subtopic\'s exercise, this is a documented, real race condition — processing documents "in order" doesn\'t guarantee the CRD has finished becoming Established before the very next document (the CR) is sent to the API server, and the failure is intermittent rather than consistent, depending on exact timing.'
    },
    {
      thought: 'If a CI pipeline applying a CRD and its own custom resources together fails intermittently, the issue is likely a flaky test environment or an unrelated infrastructure problem, not something in the manifests themselves.',
      reality: 'Per this subtopic\'s theory, this exact intermittent-failure pattern is the well-documented signature of the CRD-establishment race — the fix is a targeted one (an explicit kubectl wait --for=condition=established step, or GitOps-tool-native ordering like ArgoCD sync waves), not infrastructure debugging.'
    }
  ];
}
