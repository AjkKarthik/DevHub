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
  templateUrl: './irsa-oidc-token-exchange-exact-service-account-match-required.html',
  styleUrl: './irsa-oidc-token-exchange-exact-service-account-match-required.scss'
})
export class IrsaOidcTokenExchangeExactServiceAccountMatchRequiredSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names IRSA twice but never explains the mechanism behind it',
      points: [
        'The main page\'s own Quick Reference defines IRSA as "IAM Roles for Service Accounts — scoped IAM credentials for EKS pods via OIDC (no access keys)," and its own interview-focus list even flags "how projected service account tokens replace access keys" as something worth understanding — but nowhere in the main page\'s own theory sections is the actual OIDC token-exchange mechanism explained.',
        'This is exactly the kind of gap this hub\'s subtopics exist to fill: a term used and referenced as important, but never actually walked through.',
      ]
    },
    {
      heading: 'How IRSA actually works: a signed OIDC token, exchanged via AssumeRoleWithWebIdentity',
      points: [
        'Per AWS\'s own documentation, each EKS cluster hosts a public OIDC discovery endpoint. When a Pod is configured to use a Kubernetes service account associated with an IAM role, Kubernetes automatically mounts a "projected service account token" into that Pod — a signed OIDC JSON Web Token containing the service account\'s identity, distinct from the older, non-expiring, non-OIDC service account tokens Kubernetes has always had.',
        'The AWS SDK inside the Pod\'s container reads this projected token and passes it to the AWS STS AssumeRoleWithWebIdentity API. STS validates the token\'s signature against the cluster\'s own OIDC provider (the signing key pair rotates every 7 days) and, if the IAM role\'s trust policy allows it, returns temporary IAM credentials scoped to that role — no long-lived AWS access keys are ever created, stored, or distributed to the Pod.',
        'The trust policy on the IAM role is where the actual authorization decision lives, and it works via a condition on the OIDC provider\'s own audience/subject claims — specifically requiring the token\'s "sub" claim to equal the exact string "system:serviceaccount:<namespace>:<service-account-name>". If this string doesn\'t match EXACTLY — wrong namespace, wrong service account name, even a typo — AssumeRoleWithWebIdentity is denied and the Pod gets no credentials, with no indication anywhere in the Pod\'s own manifest that this is the actual point of failure.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trust policy condition — the exact-match requirement',
      language: 'bash',
      code: `# The IAM role's own trust policy is where IRSA's authorization
# actually happens -- this is the part the main page's own IRSA
# mention never shows:
aws iam get-role --role-name eks-s3-reader-role \\
  --query 'Role.AssumeRolePolicyDocument'

# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Allow",
#     "Principal": {
#       "Federated": "arn:aws:iam::123456789012:oidc-provider/oidc.eks.eu-west-1.amazonaws.com/id/ABCDEF1234567890"
#     },
#     "Action": "sts:AssumeRoleWithWebIdentity",
#     "Condition": {
#       "StringEquals": {
#         "oidc.eks.eu-west-1.amazonaws.com/id/ABCDEF1234567890:sub":
#           "system:serviceaccount:production:s3-reader-sa",
#         "oidc.eks.eu-west-1.amazonaws.com/id/ABCDEF1234567890:aud":
#           "sts.amazonaws.com"
#       }
#     }
#   }]
# }
#
# The "sub" condition value is a single, exact string:
# system:serviceaccount:<namespace>:<service-account-name>
# -- namespace AND service account name both have to match
# PRECISELY what the Pod's own manifest actually uses.`,
    },
    {
      label: 'What actually happens inside the Pod at credential-fetch time',
      language: 'bash',
      code: `# The service account itself carries the IAM role annotation --
# this is the piece the main page's own bullet DOES mention:
kubectl get serviceaccount s3-reader-sa -n production -o yaml
# apiVersion: v1
# kind: ServiceAccount
# metadata:
#   name: s3-reader-sa
#   namespace: production
#   annotations:
#     eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/eks-s3-reader-role

# When a Pod uses this service account, the EKS Pod Identity Webhook
# automatically injects a projected volume and two env vars -- no
# manual configuration needed on the Pod spec itself:
kubectl exec -it my-pod -n production -- env | grep AWS
# AWS_ROLE_ARN=arn:aws:iam::123456789012:role/eks-s3-reader-role
# AWS_WEB_IDENTITY_TOKEN_FILE=/var/run/secrets/eks.amazonaws.com/serviceaccount/token

# The AWS SDK reads that token file and calls AssumeRoleWithWebIdentity
# under the hood -- this succeeds ONLY if the token's own "sub" claim
# (derived automatically from the Pod's namespace + service account
# name) matches the trust policy's condition exactly:
aws sts assume-role-with-web-identity \\
  --role-arn arn:aws:iam::123456789012:role/eks-s3-reader-role \\
  --role-session-name irsa-session \\
  --web-identity-token "$(cat /var/run/secrets/eks.amazonaws.com/serviceaccount/token)"

# If the Pod were instead using a service account named
# "s3-reader" (missing "-sa") or deployed to a "staging" namespace,
# the token's own "sub" claim would be
# "system:serviceaccount:staging:s3-reader" or similar -- which does
# NOT match the trust policy's condition -- AssumeRoleWithWebIdentity
# returns AccessDenied, and the SDK inside the Pod falls through to
# whatever the NEXT credential source in its own default chain is
# (often nothing, resulting in a confusing "unable to locate
# credentials" error with no mention of IRSA or OIDC at all).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team creates an IAM role\'s trust policy with the sub condition "system:serviceaccount:production:s3-reader-sa". They then deploy their Pod using a service account named "s3-reader-sa" — but in the "prod" namespace, not "production" (a naming inconsistency left over from an earlier migration). The Pod starts successfully, and the AWS SDK inside it does not throw an obvious IRSA-specific error — it just reports it cannot find valid AWS credentials. Using this subtopic\'s theory, explain exactly why this fails, and why the error doesn\'t mention IRSA, OIDC, or the trust policy at all.',
    hint: 'What exact string does the trust policy\'s sub condition require, and what string does the projected token\'s own sub claim actually contain when the Pod runs in a differently-named namespace?',
    solution: 'The projected service account token\'s "sub" claim is derived automatically from the Pod\'s actual namespace and service account name — since the Pod is deployed in the "prod" namespace, the token\'s sub claim is "system:serviceaccount:prod:s3-reader-sa", not "system:serviceaccount:production:s3-reader-sa" as the trust policy\'s condition requires. Per this subtopic\'s theory, this condition requires an EXACT string match — "prod" and "production" are different strings, so STS\'s AssumeRoleWithWebIdentity call is denied, even though the service account NAME itself ("s3-reader-sa") is identical and even though the role-arn annotation on the service account is entirely correct. The reason the failure doesn\'t surface as an obvious IRSA-specific error is that the whole exchange happens inside the AWS SDK\'s own default credential chain, several layers below the application code — the SDK simply tries AssumeRoleWithWebIdentity, gets an AccessDenied response, and (per the standard credential provider chain behavior) falls through silently to the next possible credential source, which in a Pod with no other configured source is nothing at all — producing a generic "unable to locate credentials" message with no reference to the namespace mismatch that actually caused it. The fix is either updating the trust policy\'s sub condition to match the Pod\'s real namespace ("prod") or moving the Pod to the "production" namespace the trust policy already expects — either resolves the mismatch, but neither is discoverable from the SDK\'s own error message alone.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IRSA works by distributing a long-lived AWS access key to the Pod, scoped to the IAM role\'s permissions.',
      reality: 'Per this subtopic\'s theory, no AWS access keys are ever created or distributed at all — the Pod receives temporary credentials from AssumeRoleWithWebIdentity, obtained by exchanging a short-lived, signed OIDC token for STS-issued temporary credentials.'
    },
    {
      thought: 'As long as the service account annotation (eks.amazonaws.com/role-arn) points to the correct role ARN, IRSA will work regardless of which namespace the Pod actually runs in.',
      reality: 'Per this subtopic\'s exercise, the role\'s own trust policy independently requires an exact namespace-plus-service-account-name match via its sub condition — a correct role-arn annotation is necessary but not sufficient if the Pod\'s actual namespace doesn\'t match what the trust policy expects.'
    },
    {
      thought: 'If IRSA credential resolution fails inside a Pod, the AWS SDK\'s error message will clearly point at OIDC, IRSA, or the trust policy as the cause.',
      reality: 'Per this subtopic\'s exercise, an IRSA trust-policy mismatch typically surfaces only as a generic "unable to locate credentials" error, since the SDK\'s own default credential chain silently falls through to the next source after AssumeRoleWithWebIdentity is denied, with no direct reference to the actual OIDC subject mismatch.'
    }
  ];
}
