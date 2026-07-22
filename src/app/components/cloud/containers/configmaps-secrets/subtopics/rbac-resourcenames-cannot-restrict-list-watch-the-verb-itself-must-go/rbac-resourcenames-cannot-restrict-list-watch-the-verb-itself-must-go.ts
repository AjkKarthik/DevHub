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
  templateUrl: './rbac-resourcenames-cannot-restrict-list-watch-the-verb-itself-must-go.html',
  styleUrl: './rbac-resourcenames-cannot-restrict-list-watch-the-verb-itself-must-go.scss'
})
export class RbacResourcenamesCannotRestrictListWatchTheVerbItselfMustGoSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake fix pairs resourceNames with a "get" verb only — but never says why not list/watch',
      points: [
        'The main page\'s own "Granting broad Secret RBAC" mistake entry fixes the wrong example (`verbs: [get, list, watch]` with no resourceNames) by switching to `verbs: [get]` WITH `resourceNames: [db-secret, api-key]` — but every phrase describing the fix talks about restricting access to "specific secrets," never explaining why the fix also had to DROP list and watch rather than simply adding resourceNames to them too.',
        'The main page\'s own separate quiz question repeats this as "Never grant list/watch unless explicitly required" — correct advice, but presented as a policy choice (a security best practice you could choose to ignore) rather than as a mechanical fact about how Kubernetes\' own RBAC authorizer evaluates these specific verbs.',
      ]
    },
    {
      heading: 'What\'s actually true: resourceNames cannot restrict list, watch, deletecollection, or create at all — mechanically, not as a policy choice',
      points: [
        'Per Kubernetes\' own RBAC documentation, resourceNames CANNOT be used to restrict list, watch, deletecollection, or top-level create requests — for create, because the API server doesn\'t yet know the new object\'s name at authorization time; for list/watch/deletecollection, because a bare "give me everything matching this label selector" request simply has no single object name in its URL for resourceNames to check against.',
        'This means a Role written as `verbs: [list, watch], resourceNames: [db-secret]` — which reads as "let this ServiceAccount list/watch only db-secret" — does NOT do what its author likely intended: since resourceNames has no effect on list/watch requests at all, granting list on Secrets with a resourceNames restriction still authorizes listing EVERY Secret in scope, silently ignoring the resourceNames field entirely for that verb.',
        'The one narrow exception, per the same documentation: if a Role restricts list or watch by resourceNames, a CLIENT can still be authorized for that specific object IF their own list/watch request includes a matching `metadata.name` field selector — but this depends entirely on the CALLING client choosing to add that field selector; the RBAC rule itself provides no enforcement that forces every caller to do so. This is precisely why the main page\'s own "right" fix must drop list/watch from the verbs list entirely rather than simply adding resourceNames to them — resourceNames genuinely cannot do the restricting job for those two verbs on its own.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A resourceNames-restricted list/watch grant does not actually restrict anything',
      language: 'bash',
      code: `# A Role that LOOKS like it restricts list/watch to one Secret:
# apiVersion: rbac.authorization.k8s.io/v1
# kind: Role
# metadata:
#   name: looks-restricted
# rules:
#   - apiGroups: [""]
#     resources: [secrets]
#     resourceNames: [db-secret]   # <- author's intent: ONLY this one
#     verbs: [list, watch]         # <- but resourceNames has NO
#                                  #    effect on these two verbs

# Bound to a ServiceAccount and tested from inside a Pod using it:
kubectl get secrets --as=system:serviceaccount:production:app-sa
# NAME          TYPE     DATA   AGE
# db-secret     Opaque   2      4h
# api-key       Opaque   1      12h
# stripe-key    Opaque   1      3d
# ^ EVERY Secret in the namespace is listed, not just db-secret --
#   the resourceNames restriction was silently ignored for "list",
#   exactly as Kubernetes' own RBAC documentation states it must be.

# This is a genuine, common false sense of security: the manifest
# LOOKS like a tightly-scoped Role, and would pass a casual review,
# but grants full enumeration of every Secret's metadata (and, via
# "watch", every future change to every Secret) regardless.`,
    },
    {
      label: 'The main page\'s own fix, and why it works',
      language: 'bash',
      code: `# The main page's own actual "right" fix -- get ONLY, no list/watch
# at all, WITH resourceNames (which DOES work for get):
# apiVersion: rbac.authorization.k8s.io/v1
# kind: Role
# metadata:
#   name: genuinely-restricted
# rules:
#   - apiGroups: [""]
#     resources: [secrets]
#     resourceNames: [db-secret, api-key]  # <- works correctly here
#     verbs: [get]                          # <- get DOES respect
#                                            #    resourceNames

kubectl get secret db-secret --as=system:serviceaccount:production:app-sa
# NAME        TYPE     DATA   AGE
# db-secret   Opaque   2      4h
# -- succeeds, this Secret is explicitly named

kubectl get secret stripe-key --as=system:serviceaccount:production:app-sa
# Error from server (Forbidden): secrets "stripe-key" is forbidden
# -- correctly denied; "get" DOES check resourceNames against the
#    specific object name in the request URL, unlike list/watch

# The Pod's application code must therefore be written to fetch each
# needed Secret BY NAME individually (kubectl get secret <name>, or
# the equivalent client-go Get call) -- it structurally CANNOT list
# or enumerate Secrets at all under this Role, which is the entire
# point: enumeration capability is what's actually being removed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security-conscious engineer writes a Role granting <code>verbs: [list, watch]</code> on Secrets, combined with <code>resourceNames: [db-secret]</code>, believing this lets a ServiceAccount watch for changes to exactly one Secret without being able to see any others. Using this subtopic\'s theory, does this Role actually provide that restriction?',
    hint: 'Does a <code>list</code> or <code>watch</code> API request include a specific object name anywhere in its own URL for Kubernetes\' RBAC authorizer to compare against a Role\'s <code>resourceNames</code> field?',
    solution: 'No — per this subtopic\'s theory, this Role does not provide the intended restriction at all. Per Kubernetes\' own RBAC documentation, resourceNames has no effect on list, watch, deletecollection, or top-level create requests, because those requests have no single object name in their own URL for the authorizer to check against a resourceNames list. Binding this Role to a ServiceAccount grants list and watch access to EVERY Secret in scope, completely ignoring the resourceNames: [db-secret] restriction the engineer intended — a ServiceAccount with this Role can run kubectl get secrets and see every Secret\'s name, type, and metadata, and watch for changes to all of them, not just db-secret. The fix is exactly the pattern the main page\'s own separate mistake entry already lands on: drop list and watch from the verbs list entirely, and grant only get with resourceNames — which DOES work, since a get request always includes the specific object name being requested, giving the authorizer something to actually compare against the resourceNames list.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding <code>resourceNames</code> to a Role rule restricts whichever verbs are listed alongside it to just those named objects, regardless of which verbs those are.',
      reality: 'Per this subtopic\'s theory, resourceNames only works for verbs whose API request includes a specific object name in the URL (like get, update, delete) — it has NO effect at all on list, watch, deletecollection, or top-level create, silently granting unrestricted access for those verbs even when resourceNames is present in the same rule.'
    },
    {
      thought: 'The main page\'s own advice to avoid granting list/watch on Secrets is a security best-practice recommendation — a defense-in-depth choice you could reasonably skip if you trust resourceNames to handle the restriction instead.',
      reality: 'Per this subtopic\'s theory, this is not an optional best practice layered on top of resourceNames — it is a mechanical necessity, because resourceNames provides zero actual restriction for list/watch verbs. Combining list/watch with resourceNames, expecting it to restrict enumeration, silently fails to do so.'
    },
    {
      thought: 'A Role combining list/watch with resourceNames is at least SLIGHTLY more restrictive than one with no resourceNames at all, even if it isn\'t perfectly scoped.',
      reality: 'Per this subtopic\'s exercise, there is no partial restriction here — since resourceNames is entirely ignored for list/watch requests, a Role with resourceNames: [db-secret] and one WITHOUT any resourceNames field at all grant IDENTICAL list/watch access; the field simply has no effect for these two verbs, not a smaller effect.'
    }
  ];
}
