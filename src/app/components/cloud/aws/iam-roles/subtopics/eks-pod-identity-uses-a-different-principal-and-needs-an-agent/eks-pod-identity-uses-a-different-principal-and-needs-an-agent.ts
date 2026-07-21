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
  templateUrl: './eks-pod-identity-uses-a-different-principal-and-needs-an-agent.html',
  styleUrl: './eks-pod-identity-uses-a-different-principal-and-needs-an-agent.scss'
})
export class EksPodIdentityUsesADifferentPrincipalAndNeedsAnAgentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes Pod Identity as IRSA with one part removed',
      points: [
        'The main page\'s own "IRSA" theory bullet states: "EKS Pod Identity (newer) simplifies IRSA by removing the OIDC URL from the trust policy — managed by EKS associations instead." Read at face value, this suggests Pod Identity is IRSA with a single field deleted — the same underlying mechanism, minus the OIDC provider registration step.',
        'The main page\'s own QnA answer on IRSA vs. Pod Identity adds a little more ("no IAM OIDC provider registration needed; associations are managed on the EKS cluster side") but still frames it as essentially the same flow with different plumbing.',
      ]
    },
    {
      heading: 'Pod Identity uses a genuinely different trust principal and requires its own cluster-side agent — not just a config simplification',
      points: [
        'Per AWS\'s own documentation, "EKS Pod Identity is a simpler method than IAM roles for service accounts, as this method doesn\'t use OIDC identity providers" at all — it isn\'t IRSA with the OIDC step removed, it\'s a structurally different mechanism. The IAM trust policy principal for Pod Identity is a fixed AWS service principal, "Service": "pods.eks.amazonaws.com" — the same single principal works for every cluster, unlike IRSA\'s own per-cluster OIDC provider ARN.',
        'AWS\'s own documentation states plainly: "The Pod Identity Agent is required to use EKS Pod Identity." This is a specific, separate piece of cluster-side infrastructure — the Amazon EKS Pod Identity Agent, which "runs as a Kubernetes DaemonSet on cluster nodes" and "uses the node\'s hostNetwork, occupying ports 80 and 2703 on the link-local address" — nothing in the main page\'s own bullet mentions this component needs to be installed and running at all before Pod Identity can work.',
        'AWS\'s own documented version requirements add a real compatibility constraint the main page never raises: Pod Identity requires "a platform version that is the same or later than... eks.4" for Kubernetes 1.28, and is explicitly NOT available on AWS Outposts, Amazon EKS Anywhere, self-managed Kubernetes on EC2, or for Pods running on Fargate or Windows EC2 instances — meaning an existing cluster or workload type can rule out Pod Identity as an option entirely, something IRSA (via a standard EKS OIDC provider) does not have the same restrictions around.',
        'AWS\'s own documentation also notes Pod Identity associations are "eventually consistent, with potential delays of several seconds after API calls" and specifically advises against "creating or updating associations in critical, high-availability code paths" — a real operational timing consideration with no IRSA equivalent mentioned anywhere on the main page.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own IRSA trust policy vs. Pod Identity\'s actual principal',
      language: 'bash',
      code: `# The main page's own IRSA trust policy -- notice the Federated
# principal is a PER-CLUSTER OIDC provider ARN:
cat > irsa-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/OIDC_ISSUER"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "OIDC_ISSUER:sub": "system:serviceaccount:my-namespace:my-service-account"
      }
    }
  }]
}
EOF
# -- a DIFFERENT cluster means a DIFFERENT OIDC_ISSUER value here.

# Pod Identity's own trust policy -- a FIXED service principal,
# identical across every cluster, no per-cluster OIDC ARN at all:
cat > pod-identity-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "pods.eks.amazonaws.com" },
    "Action": ["sts:AssumeRole", "sts:TagSession"]
  }]
}
EOF
aws iam create-role --role-name EksPodIdentityS3Role \\
  --assume-role-policy-document file://pod-identity-trust.json

# This exact same trust policy JSON works for ANY EKS cluster in
# this account -- the same role can be reused across clusters
# without ever touching the trust policy again, per AWS's own
# documented "Reusability" benefit.`,
    },
    {
      label: 'The required cluster-side Pod Identity Agent — not a config toggle',
      language: 'bash',
      code: `# Unlike IRSA (which needs only an IAM OIDC provider registration),
# Pod Identity needs an actual running cluster-side component --
# confirm it's installed before anything else will work:
aws eks list-addons --cluster-name my-cluster \\
  --query "addons[?contains(@, 'pod-identity')]"
# []   <- NOT installed yet -- Pod Identity associations will exist
# in EKS's own configuration, but pods will get NO credentials at
# all until this agent is actually running.

# Install it -- per AWS's own docs, this is a required, one-time
# per-cluster setup step (matching IRSA's own one-time OIDC provider
# registration in spirit, but a genuinely different kind of
# infrastructure):
aws eks create-addon --cluster-name my-cluster \\
  --addon-name eks-pod-identity-agent

# Now create the association -- mapping a role to a namespace +
# service account, EKS-side (no IAM trust-policy edits needed per
# association, unlike IRSA's per-namespace/per-SA OIDC condition):
aws eks create-pod-identity-association \\
  --cluster-name my-cluster \\
  --namespace my-namespace \\
  --service-account my-service-account \\
  --role-arn arn:aws:iam::123456789012:role/EksPodIdentityS3Role

# Per AWS's own documented "eventual consistency" caveat, avoid
# immediately deploying a pod that depends on this association --
# a brief delay (seconds) is expected before it's fully active.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team migrates an EKS cluster from IRSA to Pod Identity, following the main page\'s own "simplifies IRSA by removing the OIDC URL" framing — they create Pod Identity associations for each service account and update the IAM roles\' trust policies to the pods.eks.amazonaws.com principal. Pods still fail to get credentials. Investigating, they realize they never explicitly installed anything new — they assumed Pod Identity, like IRSA\'s own OIDC provider registration, was a one-time IAM-side setup they\'d already completed by updating the trust policies. Using this subtopic\'s theory, what\'s missing?',
    hint: 'IRSA needs an IAM-side OIDC provider registration as its one "extra setup" step. Does Pod Identity have an equivalent one-time setup step, and if so, is it on the IAM side or somewhere else entirely?',
    solution: 'Per this subtopic\'s theory, the missing piece is the Amazon EKS Pod Identity Agent — a required, cluster-side component that must be installed and running as a Kubernetes DaemonSet before Pod Identity can issue credentials to any pod at all. The team\'s mistake was assuming Pod Identity\'s one-time setup step is analogous to IRSA\'s (an IAM-side OIDC provider registration) — but per this subtopic\'s theory, Pod Identity doesn\'t use OIDC providers at all, so there is no equivalent IAM-side step; instead, the equivalent one-time setup lives entirely on the EKS/cluster side, as the Pod Identity Agent add-on. Updating the IAM trust policies to trust pods.eks.amazonaws.com and creating the EKS Pod Identity associations were both necessary but not sufficient — without the agent actually running on the cluster\'s nodes, there is no component to actually vend credentials to the pods, regardless of how correctly the IAM and association-level configuration is set up. The fix is installing the eks-pod-identity-agent add-on (aws eks create-addon) on the cluster, after which the already-correctly-configured trust policies and associations should start working without further changes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'EKS Pod Identity is the exact same underlying mechanism as IRSA, just with the OIDC provider registration step removed — the main page\'s own "simplifies IRSA" framing describes the complete picture.',
      reality: 'Per this subtopic\'s theory, Pod Identity doesn\'t use OIDC identity providers at all — it uses a fixed AWS service principal (pods.eks.amazonaws.com) shared across every cluster, and requires its own separate infrastructure (the Pod Identity Agent) that IRSA has no equivalent of.'
    },
    {
      thought: 'Since Pod Identity is described as "simpler" than IRSA, it should be a drop-in replacement usable on any existing EKS cluster or workload without checking for compatibility.',
      reality: 'Per this subtopic\'s theory, AWS documents real restrictions — a minimum Kubernetes/platform version, and explicit unavailability on Fargate, Windows EC2 pods, Outposts, and EKS Anywhere — that can rule out Pod Identity for a given cluster or workload entirely, unlike IRSA.'
    },
    {
      thought: 'Once an IAM role\'s trust policy is updated to trust pods.eks.amazonaws.com and a Pod Identity association is created, credentials should be available to the pod immediately.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation notes Pod Identity associations are eventually consistent with potential delays of several seconds, and specifically advises against relying on immediate availability in critical, high-availability code paths.'
    }
  ];
}
