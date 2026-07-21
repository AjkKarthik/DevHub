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
  templateUrl: './guardduty-eks-runtime-monitoring-needs-a-security-agent.html',
  styleUrl: './guardduty-eks-runtime-monitoring-needs-a-security-agent.scss'
})
export class GuarddutyEksRuntimeMonitoringNeedsASecurityAgentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "no agents to install" claim is presented as blanket — it isn\'t',
      points: [
        'The main page\'s own theory bullet states: "Continuously analyses VPC Flow Logs, CloudTrail management events, DNS query logs, and S3 data events without agents to install." This reads as an unqualified property of GuardDuty as a whole, not just its base log-analysis capability.',
        'The main page\'s own mistake entry ("Using GuardDuty to find unpatched software vulnerabilities") carefully distinguishes GuardDuty from Inspector by data source and purpose, but never mentions that GuardDuty itself has an agent-based sub-feature for deeper, in-workload visibility — a real exception to its own "agentless" framing.',
      ]
    },
    {
      heading: 'EKS Runtime Monitoring deploys a real security agent — an EKS add-on, not a log-analysis feed',
      points: [
        'Per AWS\'s own documentation: "Runtime Monitoring uses an EKS add-on aws-guardduty-agent, also called as GuardDuty security agent. After GuardDuty security agent gets deployed on your EKS clusters, GuardDuty is able to receive runtime events for these EKS clusters." This is a deployed workload-level agent, not a passive analysis of logs GuardDuty already had access to.',
        'Coverage has real, documented limits: "Runtime Monitoring supports Amazon EKS clusters running on Amazon EC2 instances and Amazon EKS Auto Mode. Runtime Monitoring doesn\'t support Amazon EKS clusters with Amazon EKS Hybrid Nodes, and those running on AWS Fargate." Fargate-based EKS workloads — a common, popular EKS deployment model — get NO in-container runtime visibility from this feature at all.',
        'AWS documents two management modes with real operational differences: automated (GuardDuty deploys and updates the agent itself, and automatically creates a VPC endpoint plus a security group with inbound rules that adapt to the VPC CIDR range) versus manual (you deploy and update the agent yourself, and creating the required VPC endpoint is explicitly YOUR prerequisite responsibility — "to manage the agent manually, creating a Amazon VPC endpoint for your AWS account is a prerequisite").',
        'This means the main page\'s own "GuardDuty answers \'am I being attacked right now?\'" framing is itself layered for EKS: the BASE service answers that question agentlessly at the network/API/DNS-log level, but detecting genuinely in-container activity — file access, process execution, privilege escalation — the things an actual compromised pod would do, requires this separate, agent-based Runtime Monitoring layer on top.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Enabling EKS Runtime Monitoring — automated agent management',
      language: 'bash',
      code: `# Matching the main page's own detector-enablement style, but for
# the EKS-specific feature:
aws guardduty update-detector \\
  --detector-id <detector-id> \\
  --features '[{
    "Name": "EKS_RUNTIME_MONITORING",
    "Status": "ENABLED",
    "AdditionalConfiguration": [{
      "Name": "EKS_ADDON_MANAGEMENT",
      "Status": "ENABLED"
    }]
  }]'
# -- unlike enabling GuardDuty's own base detector, this is a real
# deployment operation, not just a data-source toggle. Per AWS's
# own docs, GuardDuty will now:
#   1. Create a VPC endpoint for the "guardduty-data" service, so
#      the agent has a network path to deliver events.
#   2. Create a security group with inbound rules matching your
#      VPC's own CIDR range (auto-adapting if that range changes).
#   3. Deploy the aws-guardduty-agent EKS add-on onto every EKS
#      cluster in the account running on EC2 or EKS Auto Mode.

# Confirm the agent is actually running on a given cluster:
kubectl get pods -n amazon-guardduty
# NAME                          READY   STATUS    RESTARTS
# amazon-guardduty-agent-xxxxx  1/1     Running   0

# A cluster running entirely on AWS Fargate will show NO such pods
# -- per AWS's own documented limitation, Fargate-based EKS clusters
# are simply not supported by this feature at all.`,
    },
    {
      label: 'Manual agent management — the operational burden the automated path hides',
      language: 'bash',
      code: `# Manual management requires the VPC endpoint as YOUR OWN
# prerequisite -- GuardDuty will not create it for you in this mode:
aws ec2 create-vpc-endpoint \\
  --vpc-id vpc-0abc123 \\
  --service-name com.amazonaws.us-east-1.guardduty-data \\
  --vpc-endpoint-type Interface \\
  --subnet-ids subnet-111 subnet-222 \\
  --security-group-ids sg-guardduty-agent

# THEN install the EKS add-on yourself, on every cluster you want
# monitored, in every account and region:
aws eks create-addon \\
  --cluster-name my-cluster \\
  --addon-name aws-guardduty-agent \\
  --addon-version v1.x.x

# Per AWS's own docs, manual management also hands back ongoing
# responsibility that the automated path absorbs: "You will need to
# coordinate the deployment of the GuardDuty security agent within
# your EKS clusters across all accounts and AWS Regions... You will
# also need to update the agent version when GuardDuty releases it."
# -- unlike the base, genuinely-agentless GuardDuty service, this
# feature has real version-drift and coverage-gap risk if managed
# manually across a large multi-account estate.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security team enables GuardDuty across their organization, reads the main page\'s own theory bullet describing GuardDuty as analysing logs "without agents to install," and concludes their existing EKS workloads (running on Fargate, for cost reasons) are now automatically covered for in-container threat detection — the same way their EC2-based VPC traffic is covered by the base service. During a red-team exercise, a simulated reverse shell spawned inside a Fargate-hosted pod produces zero GuardDuty findings, even though the same technique against an EC2-hosted pod in a different cluster is correctly detected. Using this subtopic\'s theory, explain the gap.',
    hint: 'What does AWS\'s own documentation say EKS Runtime Monitoring actually supports — and does it apply uniformly to every EKS compute option?',
    solution: 'Per this subtopic\'s theory, this is exactly the documented Fargate limitation, not a misconfiguration. AWS\'s own EKS Runtime Monitoring documentation states directly: "Runtime Monitoring supports Amazon EKS clusters running on Amazon EC2 instances and Amazon EKS Auto Mode. Runtime Monitoring doesn\'t support Amazon EKS clusters with Amazon EKS Hybrid Nodes, and those running on AWS Fargate." The feature relies on deploying the aws-guardduty-agent EKS add-on onto worker nodes to observe in-container file access, process execution, and network activity — Fargate\'s own execution model has no persistent, GuardDuty-manageable worker node for that agent to run on, so the deployment simply isn\'t possible there. The EC2-hosted cluster\'s detection worked correctly because the agent WAS deployed and running on its worker nodes; the Fargate-hosted cluster produced no finding because no agent ever ran there at all — not because the attack technique was somehow invisible, but because the monitoring layer capable of seeing it doesn\'t extend to that compute option. The main page\'s own "no agents to install" framing correctly describes GuardDuty\'s base network/API/DNS-log analysis (which DOES cover Fargate workloads\' network traffic), but doesn\'t extend to this specific in-container Runtime Monitoring capability.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'GuardDuty\'s "no agents to install" framing applies uniformly to every GuardDuty feature, including EKS Runtime Monitoring.',
      reality: 'Per this subtopic\'s theory, EKS Runtime Monitoring is a documented exception — it deploys a real security agent (the aws-guardduty-agent EKS add-on) onto cluster worker nodes to observe in-container activity, unlike the base service\'s passive log analysis.'
    },
    {
      thought: 'Enabling GuardDuty account-wide automatically extends to detecting in-container process- and file-level activity on every EKS cluster in the account.',
      reality: 'Per this subtopic\'s theory, EKS Runtime Monitoring must be separately enabled and its agent separately deployed (automated or manual) — and even then, it only covers EKS clusters running on EC2 or EKS Auto Mode, not Fargate or Hybrid Nodes.'
    },
    {
      thought: 'EKS Runtime Monitoring works identically regardless of whether EKS workloads run on EC2 or Fargate — both just need the feature "turned on."',
      reality: 'Per this subtopic\'s exercise, AWS\'s own documentation explicitly excludes Fargate-based EKS clusters from Runtime Monitoring support entirely — no agent can be deployed there, so no in-container visibility exists for that compute option regardless of configuration.'
    }
  ];
}
