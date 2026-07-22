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
  templateUrl: './imds-hop-limit-of-1-breaks-container-metadata-access.html',
  styleUrl: './imds-hop-limit-of-1-breaks-container-metadata-access.scss'
})
export class ImdsHopLimitOf1BreaksContainerMetadataAccessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own IMDSv2 mistake entry never mentions the hop limit at all',
      points: [
        'The main page has an entire "Common Mistakes" entry titled "Not enabling IMDSv2 — leaving metadata endpoint open to SSRF," and its own code example demonstrates requesting a token via PUT and reading metadata via GET with that token. What it never mentions is a THIRD IMDS setting, separate from the token requirement, that controls something else entirely: how many network hops the token-request PUT response is allowed to traverse before being dropped.',
        'This matters because enabling IMDSv2 correctly (the main page\'s own fix) is not, by itself, enough to guarantee metadata access keeps working once a container runtime is introduced on that same instance.',
      ]
    },
    {
      heading: 'HttpPutResponseHopLimit defaults to 1 — and Docker/containerd networking adds an extra hop',
      points: [
        'Per AWS\'s own documentation, the "Metadata response hop limit" setting (HttpPutResponseHopLimit) controls the number of network hops the IMDSv2 token-request PUT response is allowed to make, with a configurable range of 1 to 64. The account-level and instance-level default is 1.',
        'A request made directly from the EC2 instance\'s own host network namespace only needs 1 hop, so a hop limit of 1 works fine there — this is exactly the scenario the main page\'s own code example demonstrates. But a request made from INSIDE a container (Docker, containerd, or similar) crosses an additional network layer — typically a bridge or NAT hop between the container\'s own network namespace and the host — meaning the response needs 2 hops to make it all the way back, not 1.',
        'With the default hop limit of 1, a containerized process\'s IMDSv2 token request PUT succeeds in reaching the metadata service, but the response never makes it back across that second hop — the request silently times out or fails, with no explicit "hop limit exceeded" error pointing at the actual cause. AWS\'s own documentation specifically calls out this exact container scenario as one where the default hop limit "can cause issues."',
        'The fix is to raise HttpPutResponseHopLimit to at least 2 (AWS-registered AMIs with imds-support set to v2.0 set it to exactly 2 automatically) — this can be set at the account level, on the AMI, or per-instance at launch or afterward via ModifyInstanceMetadataOptions, following the same instance-overrides-account-overrides-AMI order of precedence as every other IMDS setting.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the failure: token request from inside a container',
      language: 'bash',
      code: `# On the EC2 host itself -- this works fine, matching the main
# page's own code example exactly (1 hop, default hop limit of 1):
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \\
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
echo "$TOKEN"
# AQAEAB3fake-token-value-abc123...

# Now run the SAME curl command from INSIDE a Docker container on
# that same host, using the default bridge network:
docker run --rm curlimages/curl -s -X PUT \\
  "http://169.254.169.254/latest/api/token" \\
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"
# (empty response -- the PUT times out, no token returned)
#
# The request itself reaches the metadata service (1 hop: container
# -> bridge -> host -> IMDS), but the RESPONSE needs to travel back
# the same number of hops, and the default HttpPutResponseHopLimit
# of 1 only allows a single hop -- the response is dropped partway
# back, and the container never receives its token.`,
    },
    {
      label: 'The fix: raise the hop limit to 2',
      language: 'bash',
      code: `# Check the CURRENT hop limit on a running instance:
aws ec2 describe-instances \\
  --instance-ids i-0abc123456789 \\
  --query "Reservations[].Instances[].MetadataOptions.HttpPutResponseHopLimit"
# [1]   <- the default; will break container IMDS access

# Raise it to 2 -- enough for one extra network hop (container
# bridge/NAT), without opening it further than actually needed:
aws ec2 modify-instance-metadata-options \\
  --instance-id i-0abc123456789 \\
  --http-tokens required \\
  --http-put-response-hop-limit 2

# Re-run the exact same container test from before:
docker run --rm curlimages/curl -s -X PUT \\
  "http://169.254.169.254/latest/api/token" \\
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"
# AQAEAB3fake-token-value-xyz789...
# -- succeeds now that the response is allowed 2 hops instead of 1.

# Set this at LAUNCH time instead, so every future instance from
# this Launch Template already has the correct hop limit and never
# hits the container-breaks-IMDS issue in the first place:
aws ec2 create-launch-template \\
  --launch-template-name container-host-lt \\
  --launch-template-data '{
    "MetadataOptions": {
      "HttpTokens": "required",
      "HttpPutResponseHopLimit": 2
    }
  }'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An engineer enforces IMDSv2 on all EC2 instances following the main page\'s own recommended fix (HttpTokens: required), closing the SSRF risk. A few weeks later, the team migrates a Node.js application from running directly on the instance to running inside a Docker container on that same instance. After the migration, the application starts throwing errors trying to fetch its IAM credentials from the metadata endpoint — even though the exact same code worked before the container migration, and IMDSv2 is still correctly enforced. What is the most likely cause, and what setting fixes it?',
    hint: 'IMDSv2 enforcement (HttpTokens: required) is a separate setting from the hop limit (HttpPutResponseHopLimit) — did the migration change how many network hops the token request response needs to cross?',
    solution: 'The most likely cause is the default HttpPutResponseHopLimit of 1, which is unrelated to IMDSv2 enforcement itself. Before the container migration, the Node.js application ran directly on the instance\'s own host network namespace, so its IMDSv2 token request only needed 1 hop — well within the default limit, and everything worked correctly. After migrating into a Docker container, the same token request now crosses an additional network hop (the container\'s bridge/NAT layer to the host) before reaching the metadata service, meaning the response needs 2 hops to make it all the way back to the container — but the hop limit is still set to its default of 1, so the response is silently dropped partway back and the token request fails. IMDSv2 enforcement itself is working exactly as intended (that\'s why the credentials fetch didn\'t simply succeed insecurely) — it\'s the separate, independently-configured hop limit that\'s the actual blocker. The fix is to raise HttpPutResponseHopLimit to at least 2 via ModifyInstanceMetadataOptions (or bake it into the Launch Template so all future container-host instances have it set correctly from launch), which is unrelated to relaxing IMDSv2 enforcement in any way — both settings can and should stay strict simultaneously.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Enforcing IMDSv2 (HttpTokens: required), following the main page\'s own recommended SSRF fix, is the only IMDS setting that matters for a secure, working metadata configuration.',
      reality: 'Per this subtopic\'s theory, HttpPutResponseHopLimit is a separate, independently-configured setting — correctly enforcing IMDSv2 does not guarantee metadata access keeps working once an extra network hop (like a container bridge) is introduced.'
    },
    {
      thought: 'If a containerized application can\'t reach the instance metadata service, the problem must be a Docker networking misconfiguration, not an EC2-level setting.',
      reality: 'Per this subtopic\'s exercise, the actual cause is frequently the instance\'s own HttpPutResponseHopLimit still being set to its default of 1 — an EC2-level metadata option, not a Docker networking bug — even though the symptom (a failed request from inside the container) looks like a container networking issue.'
    },
    {
      thought: 'Raising the metadata hop limit to accommodate containers means giving up some of the security benefit IMDSv2 enforcement provides.',
      reality: 'Per this subtopic\'s theory, the hop limit and IMDSv2 token enforcement are independent settings — raising the hop limit to 2 to support container access does not relax the token requirement at all; both can (and should) remain strict at the same time.'
    }
  ];
}
