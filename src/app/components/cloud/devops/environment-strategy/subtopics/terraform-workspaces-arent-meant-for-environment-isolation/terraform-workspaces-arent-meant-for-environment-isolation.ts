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
  templateUrl: './terraform-workspaces-arent-meant-for-environment-isolation.html',
  styleUrl: './terraform-workspaces-arent-meant-for-environment-isolation.scss'
})
export class TerraformWorkspacesArentMeantForEnvironmentIsolationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents Terraform workspaces as THE per-environment pattern — Terraform\'s own docs warn against exactly that use',
      points: [
        'The main page\'s own Terraform Workspace per Env code tab creates dev/staging/prod as three workspaces of the SAME configuration, switched with terraform workspace select, and its comment reads: "The same Terraform code provisions both environments; only the variable values change — enforcing parity in structure." No caveat is attached — workspaces are presented as a clean, complete solution for dev/staging/prod separation.',
        'Terraform\'s own official documentation states the opposite recommendation directly: "Workspaces are not appropriate for system decomposition or deployments requiring separate credentials and access controls." Dev, staging, and prod are exactly this kind of deployment — they typically need separate cloud credentials and access controls, precisely the case the docs call out as unsuitable for workspaces.',
        'The mechanism behind the warning is also documented precisely: "The configuration still has only one backend, but you can deploy multiple distinct instances of that configuration without configuring a new backend or changing authentication credentials." All workspaces of one configuration share ONE backend and ONE set of credentials — switching workspaces changes which STATE FILE is active, not which cloud account, IAM role, or backend Terraform talks to.',
      ]
    },
    {
      heading: 'What this means in practice for the main page\'s own dev/staging/prod example',
      points: [
        'In the main page\'s own workflow (terraform workspace select prod; terraform apply -var-file=envs/prod.tfvars), the SAME AWS/Azure credentials Terraform is authenticated with for dev and staging are also used for prod — there is no credential boundary workspaces enforce between them. A misconfigured CI pipeline, a leaked token, or a bug in automation that touches Terraform has the SAME blast radius across all three "environments," because they are not actually isolated at the credentials/backend level — only at the state-file level.',
        'This is exactly the "the higher the risk of a non-prod action affecting prod, the stronger the isolation needed" principle the main page\'s own QnA already states for AWS-accounts-vs-namespaces — but the main page\'s own Terraform code tab does not apply that same principle to itself, since workspaces provide weaker isolation than the "separate AWS accounts for prod vs non-prod" pattern the QnA recommends elsewhere on the very same page.',
        'The safer pattern for genuinely separate environments — separate root Terraform configurations (or directories) per environment, each with its OWN backend configuration block pointing at environment-specific state storage and credentials — achieves the credential/backend isolation workspaces cannot, at the cost of some code duplication between environment directories (often mitigated with shared Terraform modules each environment\'s own root config calls).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own workspace pattern -- what it does NOT isolate',
      language: 'bash',
      code: `# Matches the main page's own Terraform Workspace per Env tab exactly.

terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

terraform workspace select prod
terraform apply -var-file=envs/prod.tfvars

# All three workspaces above share the SAME backend block --
# defined once, in the SAME .tf files, for the whole configuration:
terraform {
  backend "s3" {
    bucket = "my-terraform-state"   # ONE bucket for dev+staging+prod
    key    = "app/terraform.tfstate"
    region = "us-east-1"
  }
}
# (Terraform automatically namespaces state per-workspace within
# this single backend/bucket -- but it is still the SAME bucket,
# reached with the SAME AWS credentials, for every workspace.)

# Whatever AWS credentials "terraform apply" uses right now --
# whether the developer meant to target dev, staging, or prod --
# are the SAME credentials for all three. A "terraform workspace
# select prod" typo (selecting the wrong workspace) still applies
# using those same credentials -- it changes which STATE is
# affected, not which AWS ACCOUNT is reached.`,
    },
    {
      label: 'The pattern Terraform\'s own docs point toward instead',
      language: 'bash',
      code: `# Separate root configurations per environment -- each with its
# OWN backend block, and typically its own AWS credentials/role:

# environments/dev/main.tf
terraform {
  backend "s3" {
    bucket = "myapp-dev-terraform-state"     # dev's own bucket
    key    = "app/terraform.tfstate"
    region = "us-east-1"
  }
}
module "app" {
  source        = "../../modules/app"   # SHARED module -- same code
  instance_type = "t3.micro"
  min_instances = 1
}

# environments/prod/main.tf
terraform {
  backend "s3" {
    bucket = "myapp-prod-terraform-state"    # prod's own SEPARATE bucket,
    key    = "app/terraform.tfstate"          # typically in a SEPARATE
    region = "us-east-1"                       # AWS account entirely
  }
}
module "app" {
  source        = "../../modules/app"   # same SHARED module
  instance_type = "m5.large"
  min_instances = 3
}

# Applying prod now REQUIRES being authenticated against prod's own
# AWS account/credentials -- there is no single "terraform apply"
# invocation that can accidentally touch the wrong environment's
# infrastructure just by having the wrong workspace selected, since
# there is no shared workspace selection step at all. The module
# reuse ("../../modules/app") still gives structural parity, per
# this hub's own environment-parity principle -- just without
# workspaces' shared-backend risk.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own Terraform workspace pattern exactly — one configuration, three workspaces (dev/staging/prod), one shared S3 backend. A junior engineer, debugging a dev issue, runs a sequence of terraform apply commands but forgets to run terraform workspace select dev first — the CLI is still on the "prod" workspace from an earlier session. Using this subtopic\'s theory, explain precisely what protects (or fails to protect) the team here, and why switching to Terraform\'s own recommended separate-configuration pattern would have prevented this specific mistake entirely, not just made it less likely.',
    hint: 'Per this subtopic\'s theory, does forgetting to switch workspaces change WHICH cloud credentials or backend Terraform authenticates against — or only which state file it reads and writes? Would a separate-configuration-per-environment setup even have a "wrong workspace" state to forget to switch in the first place?',
    solution: 'Nothing structurally protects the team here — per this subtopic\'s theory, workspaces "deploy multiple distinct instances of that configuration without configuring a new backend or changing authentication credentials," meaning the engineer\'s terraform apply runs against PROD\'s actual state and PROD\'s actual infrastructure, using whatever credentials were already active, the moment they forget the workspace switch. The only thing standing between the engineer and a real production change is remembering a manual step — there is no credential boundary, no separate backend, and no separate cloud account forcing an explicit re-authentication that would surface the mistake. Terraform\'s own recommended separate-configuration pattern would have prevented this ENTIRELY, not just reduced the odds, because per this subtopic\'s theory each environment has its own root configuration with its own backend block and (typically) its own credentials — there is no shared "current workspace" state to forget to switch at all. The engineer would need to be working inside the dev/ directory (or explicitly authenticated against dev\'s own account) to touch dev in the first place; there is no single Terraform invocation from which a forgotten step alone can reach prod.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Terraform workspaces (dev/staging/prod as three workspaces of one configuration) provide genuine isolation between environments, similar to using separate cloud accounts or separate backends.',
      reality: 'This subtopic\'s theory quotes Terraform\'s own documentation directly: "Workspaces are not appropriate for system decomposition or deployments requiring separate credentials and access controls." All workspaces of one configuration share one backend and one set of credentials — the isolation is at the state-file level only, not the credentials/backend level.'
    },
    {
      thought: 'Since terraform apply -var-file=envs/prod.tfvars only applies prod-specific VALUES, running it against the wrong workspace is a low-risk mistake — the variable file still controls what gets deployed.',
      reality: 'This subtopic\'s exercise shows the opposite: the -var-file only controls the VALUES passed into the configuration, not which backend/state/credentials Terraform uses — a var-file mismatch and a workspace mismatch are two independent things that can each go wrong. Forgetting to switch workspaces means whatever workspace is currently selected gets applied, regardless of which -var-file was intended.'
    },
    {
      thought: 'The "separate configurations per environment" alternative to workspaces just duplicates all the Terraform code three times, trading a maintenance burden for isolation with no way to avoid the duplication.',
      reality: 'This subtopic\'s second code example shows the actual recommended pattern reuses a SHARED module ("../../modules/app") from each environment\'s own separate root configuration — the environment-specific files are thin (just a backend block and variable values), not a full duplication of the underlying infrastructure code.'
    }
  ];
}
