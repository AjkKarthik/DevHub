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
  templateUrl: './cli-credential-chain-order-container-before-instance-profile.html',
  styleUrl: './cli-credential-chain-order-container-before-instance-profile.scss'
})
export class CliCredentialChainOrderContainerBeforeInstanceProfileSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own credential-chain order was corrected as part of this batch',
      points: [
        'The main page\'s own theory bullet originally stated the CLI reads credentials "in order: env vars → ~/.aws/credentials → instance profile → ECS task role" — placing the EC2 instance profile BEFORE the ECS task role. As part of verifying this content batch, that ordering was checked against AWS\'s own documented credential provider chain and found to have the last two links backwards; the theory text has been corrected as part of this batch.',
        'The main page\'s own code tab shows both mechanisms in isolation — reading EC2 instance metadata directly (`curl http://169.254.169.254/...`) and assuming a role via `aws sts assume-role` — but never actually orders them relative to each other, or mentions the config file (`~/.aws/config`) as a separate step from the credentials file at all.',
      ]
    },
    {
      heading: 'What the real chain is: container credentials are checked BEFORE the EC2 instance profile, and the config file is its own step',
      points: [
        'Per AWS\'s own documented standardized credential provider chain, the full, correctly-ordered sequence is: command-line options (highest priority) → environment variables → the credentials file (`~/.aws/credentials`) → the config file (`~/.aws/config`) → container credentials (ECS task role, if running inside an ECS task) → EC2 instance profile credentials (lowest priority, via the instance metadata service). The search stops at the first source that successfully provides valid credentials.',
        'This means, contrary to the main page\'s original wording, a process running as an ECS task ALWAYS gets its container\'s own task role credentials checked before ANY EC2 instance profile lookup is even attempted — the two are not interchangeable "whichever is on this node" fallbacks; ECS container credentials specifically take priority in the chain, mechanically, regardless of what\'s configured on the underlying EC2 host.',
        'This ordering matters in practice for a subtle but real class of bug: an application running in an ECS task on an EC2-backed cluster (as opposed to Fargate) could, in principle, be influenced by an instance-level IAM role attached to the underlying EC2 host — but because container credentials are checked FIRST in the chain, a correctly-configured ECS task role always wins, insulating the task\'s own permissions from whatever role (if any) the underlying EC2 instance happens to have.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The corrected order, demonstrated with each source present',
      language: 'bash',
      code: `# A process with ALL of the following present simultaneously --
# which one actually wins?
#   1. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars set
#   2. [default] profile in ~/.aws/credentials
#   3. region/output config in ~/.aws/config
#   4. Running inside an ECS task with a task role attached
#   5. The underlying EC2 host ALSO has its own instance profile

# Per the corrected, real precedence order:
env | grep AWS_ACCESS_KEY_ID
# AWS_ACCESS_KEY_ID=AKIAENVEXAMPLE

aws sts get-caller-identity
# {
#   "UserId": "AIDAENVEXAMPLE",
#   "Arn": "arn:aws:iam::123456789012:user/env-var-user"
# }
# -- the ENV VAR credentials win, exactly as the main page's own
#    original bullet correctly had first in the list -- this part
#    was never wrong.

# Remove the env vars, leaving credentials file + config file +
# ECS task role + EC2 instance profile all still present:
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
aws sts get-caller-identity
# {
#   "UserId": "AIDAFILEEXAMPLE",
#   "Arn": "arn:aws:iam::123456789012:user/credentials-file-user"
# }
# -- ~/.aws/credentials wins next, also matching the main page's
#    original ordering -- the FIX only concerns what happens after
#    this point.`,
    },
    {
      label: 'Container credentials beat the instance profile, not the other way around',
      language: 'bash',
      code: `# Remove the credentials file entry too, leaving ONLY the ECS task
# role and the underlying EC2 instance's own instance profile:
mv ~/.aws/credentials ~/.aws/credentials.bak

aws sts get-caller-identity
# {
#   "UserId": "AROAECSTASKEXAMPLE:task-id",
#   "Arn": "arn:aws:sts::123456789012:assumed-role/ecs-task-role/task-id"
# }
# -- the ECS TASK ROLE wins -- confirmed by the "assumed-role/ecs-task-role"
#    portion of the ARN -- NOT the EC2 instance's own instance profile,
#    even though the main page's own ORIGINAL wording listed
#    "instance profile" before "ECS task role" in its chain.

# Direct proof of the mechanism: the CLI/SDK checks the ECS container
# credentials endpoint (via AWS_CONTAINER_CREDENTIALS_RELATIVE_URI,
# automatically set inside ECS tasks) BEFORE it ever queries the EC2
# instance metadata service at 169.254.169.254 at all:
echo $AWS_CONTAINER_CREDENTIALS_RELATIVE_URI
# /v2/credentials/12345678-1234-1234-1234-123456789012
# -- this environment variable's mere PRESENCE is what routes the
#    credential lookup to the container endpoint first -- the EC2
#    instance profile is only ever consulted as the final fallback,
#    if this variable (and every earlier source) is absent entirely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An application runs as an ECS task on an EC2-backed cluster (not Fargate). The ECS task definition has its own task role attached, but the underlying EC2 instance ALSO has a separate, more permissive instance profile attached (perhaps left over from before the task role was configured correctly). A security reviewer worries the application might be picking up the EC2 instance\'s broader permissions instead of its own scoped-down task role. Using this subtopic\'s theory, is that concern justified?',
    hint: 'In the corrected credential chain, which is checked first — container (ECS task role) credentials, or EC2 instance profile credentials?',
    solution: 'No — per this subtopic\'s theory, that concern is not justified, assuming no earlier-priority credential source (env vars, credentials file, config file) is also present and interfering. Container credentials — the ECS task role — are checked BEFORE the EC2 instance profile in AWS\'s own documented credential provider chain, and the SDK stops searching at the first source that provides valid credentials. As long as the ECS task role is correctly attached and functioning, the application will always authenticate using that task role\'s own scoped-down permissions, never falling through to the broader EC2 instance profile — the instance profile is only ever consulted if the task role lookup itself fails or is entirely absent. The security reviewer\'s underlying instinct (that a leftover, overly-permissive EC2 instance profile is worth cleaning up) is still reasonable defense-in-depth practice, but the specific mechanism they\'re worried about — the application actually USING the broader instance-level permissions in normal operation — does not happen, precisely because of this priority ordering.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The AWS CLI and SDK credential chain checks the EC2 instance profile before container (ECS task role) credentials, matching the main page\'s own original, since-corrected wording.',
      reality: 'Per this subtopic\'s theory, container credentials are checked BEFORE the EC2 instance profile in AWS\'s own documented chain — the main page\'s own original bullet had these two sources in the wrong order, and has been corrected as part of this batch.'
    },
    {
      thought: 'The credentials file (~/.aws/credentials) and the config file (~/.aws/config) are effectively the same step in the credential chain, since they\'re both local files checked around the same point in the sequence.',
      reality: 'Per this subtopic\'s theory, they are two distinct, separately-ordered steps in the official chain — the credentials file is checked before the config file, not simultaneously or interchangeably.'
    },
    {
      thought: 'An ECS task running on an EC2-backed cluster could pick up broader permissions from the underlying EC2 instance\'s own instance profile if that profile happens to be more permissive than the task\'s own role.',
      reality: 'Per this subtopic\'s exercise, this cannot happen under normal operation — since container credentials are checked first in the chain and the search stops at the first valid source found, a correctly-functioning ECS task role is always used instead of ever falling through to the EC2 instance profile.'
    }
  ];
}
