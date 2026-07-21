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
  templateUrl: './bound-serviceaccount-tokens-expire-in-1-hour-legacy-tokens-never-did.html',
  styleUrl: './bound-serviceaccount-tokens-expire-in-1-hour-legacy-tokens-never-did.scss'
})
export class BoundServiceaccountTokensExpireIn1HourLegacyTokensNeverDidSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory mentions the token\'s mount path, never its lifetime',
      points: [
        'The main page\'s own quickRef says ServiceAccount tokens are "mounted as a token at /var/run/secrets" and the theory repeats the exact mount path — "automatically mounted at /var/run/secrets/kubernetes.io/serviceaccount/token." Both treat the token purely as a location detail.',
        'Nothing on the main page discusses how long that token remains VALID once mounted, or that this has changed significantly — a fact that directly affects how a compromised token should be reasoned about, and is a genuinely different security property than any RBAC permission scoping the rest of the page covers.',
      ]
    },
    {
      heading: 'What actually changed: modern tokens expire in 1 hour by default; the old ones never did',
      points: [
        'Per Kubernetes\' own documented TokenRequest API behavior, the token every Pod gets mounted today (since Kubernetes 1.24 stopped auto-generating the older kind by default) is a "bound" token — obtained via TokenRequest, it expires either when the Pod it belongs to is deleted, OR after a default lifetime of 1 hour, whichever comes first. Kubelet automatically refreshes/rotates this token in the background before it expires, so the application never has to handle rotation itself.',
        'This is a fundamentally different security property from the OLDER, pre-1.24-default token mechanism (a token stored in a long-lived Kubernetes Secret, auto-created per ServiceAccount) — those legacy tokens had NO expiration at all; a token extracted from a compromised Pod years ago would remain valid indefinitely, until someone manually deleted the Secret or the ServiceAccount itself.',
        'Bound tokens also carry an additional binding the legacy ones never had: each token is cryptographically tied to the specific Pod object\'s own UID it was issued for — even within its 1-hour window, the token becomes invalid immediately if that exact Pod is deleted, rather than remaining a general-purpose credential usable from anywhere until its (nonexistent) expiration.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Inspecting a modern bound token\'s own expiration claim',
      language: 'bash',
      code: `# The main page's own mount path -- read directly from a running
# Pod on a current Kubernetes cluster (1.24+):
kubectl exec api-7d9f8-x2k4p -- cat /var/run/secrets/kubernetes.io/serviceaccount/token \\
  | cut -d. -f2 | base64 -d 2>/dev/null | jq .

# {
#   "aud": ["https://kubernetes.default.svc"],
#   "exp": 1721567890,        <- Unix timestamp ~1 hour from issue
#   "iat": 1721564290,
#   "kubernetes.io": {
#     "namespace": "production",
#     "pod": {
#       "name": "api-7d9f8-x2k4p",
#       "uid": "3f2a9c1e-..."  <- bound to THIS exact Pod object
#     },
#     "serviceaccount": { "name": "api-sa", "uid": "..." }
#   },
#   "sub": "system:serviceaccount:production:api-sa"
# }
# -- "exp" is roughly 3600 seconds (1 hour) after "iat". Kubelet
#    silently refreshes the mounted file with a fresh token well
#    before this expiration, so the app never sees an interruption.

# Deleting the Pod invalidates the token IMMEDIATELY, regardless of
# how much of the 1-hour window remains:
kubectl delete pod api-7d9f8-x2k4p
# any copy of that exact token, even if exfiltrated moments earlier,
# is rejected by the API server from this point on`,
    },
    {
      label: 'The legacy pattern, still available but no longer the default',
      language: 'bash',
      code: `# Before Kubernetes 1.24, every ServiceAccount automatically got a
# long-lived token stored as a Secret -- this behavior can still be
# explicitly opted BACK into for cases needing a truly non-expiring
# token (rare; generally discouraged now):
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: api-sa-legacy-token
  namespace: production
  annotations:
    kubernetes.io/service-account.name: api-sa
type: kubernetes.io/service-account-token
EOF

kubectl get secret api-sa-legacy-token -n production -o jsonpath='{.data.token}' \\
  | base64 -d | cut -d. -f2 | base64 -d 2>/dev/null | jq .
# {
#   "sub": "system:serviceaccount:production:api-sa"
#   # NOTE: no "exp" claim at all in the legacy token format --
#   # it remains valid until the Secret itself is deleted or the
#   # ServiceAccount is deleted, with no automatic expiration ever.
# }

# The practical implication for incident response: a legacy token
# leaked from ANY source (logs, a compromised backup, an old CI
# artifact) remains a valid, usable credential indefinitely, unlike
# a bound token which self-invalidates within an hour even if never
# explicitly revoked.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An incident responder finds a ServiceAccount token in a leaked CI build log from eight months ago. Before investigating further, they need to know whether that token could still be used right now to authenticate against the cluster. Using this subtopic\'s theory, what determines the answer — and why isn\'t "check the ServiceAccount\'s current RBAC permissions" enough on its own to assess the risk?',
    hint: 'What TWO different things does the main page\'s own theory group together under "ServiceAccount" — the permissions it has, and something else entirely about the credential itself?',
    solution: 'Per this subtopic\'s theory, whether the leaked token still works depends entirely on WHICH KIND of token it is, a property completely separate from the ServiceAccount\'s current RBAC permissions. If it is a modern, bound token (the default since Kubernetes 1.24), it expired within an hour of being issued and would additionally have been invalidated the moment the specific Pod it was bound to was deleted — an eight-month-old bound token is certainly unusable today, regardless of what permissions the ServiceAccount currently has. If it is a legacy, Secret-backed token (either from a pre-1.24 cluster, or explicitly re-opted-into on a newer one), it carries no expiration claim at all and remains valid indefinitely until the backing Secret or the ServiceAccount itself is deleted — an eight-month-old leak of this kind is still a live, usable credential today. Checking only the ServiceAccount\'s current RBAC permissions answers "what could this token do if it still works" but says nothing about whether it still works at all — that requires knowing the token\'s own type and, for a legacy token, confirming whether the Secret has since been rotated or deleted.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every ServiceAccount token mounted into a Pod, regardless of Kubernetes version, remains valid indefinitely until the ServiceAccount itself is deleted — the main page\'s own mount-path description implies a simple, static file with no time-based concern.',
      reality: 'Per this subtopic\'s theory, this is only true for the older, legacy Secret-backed token mechanism. Since Kubernetes 1.24 changed the default, the token mounted into a Pod today is a bound token that expires within 1 hour by default and is additionally invalidated the instant its specific Pod is deleted.'
    },
    {
      thought: 'A leaked ServiceAccount token\'s risk is fully determined by that ServiceAccount\'s current RBAC permissions — how long ago the leak happened is irrelevant to the assessment.',
      reality: 'Per this subtopic\'s exercise, a leaked token\'s risk depends first on whether the token is EVEN STILL VALID, which depends on its type (bound vs. legacy) and age — a bound token older than about an hour (and whose Pod no longer exists) is not a usable credential at all, regardless of the ServiceAccount\'s permissions.'
    },
    {
      thought: 'Kubelet\'s automatic rotation of a bound token means the application itself needs to implement token-refresh logic to keep working past the 1-hour default expiration.',
      reality: 'Per this subtopic\'s theory, kubelet handles the refresh transparently, replacing the mounted token file with a fresh one before the current one expires — an application that simply re-reads the token file (or uses a client library that already does so) needs no custom rotation logic of its own.'
    }
  ];
}
