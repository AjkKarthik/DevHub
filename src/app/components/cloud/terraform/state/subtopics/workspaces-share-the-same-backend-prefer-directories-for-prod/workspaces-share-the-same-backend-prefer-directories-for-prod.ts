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
  templateUrl: './workspaces-share-the-same-backend-prefer-directories-for-prod.html',
  styleUrl: './workspaces-share-the-same-backend-prefer-directories-for-prod.scss'
})
export class WorkspacesShareTheSameBackendPreferDirectoriesForProdSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s QnA mentions workspaces as an option, with no tradeoff discussion at all',
      points: [
        'The main page\'s QnA answers "Can I have multiple state files for one project?" with: "Yes — using workspaces or separate directory-based configurations. Each workspace or directory has its own state file, allowing environment isolation (dev vs prod)." Both options are presented as roughly equivalent ways to isolate dev from prod — the page never explains a real, important difference between them.',
      ]
    },
    {
      heading: 'Workspaces are a state-file partition within ONE shared backend configuration — not a full isolation boundary',
      points: [
        'CLI workspaces partition multiple named state files under a SINGLE backend configuration and a single working directory — switching workspaces changes which state file Terraform reads/writes, but the backend itself (the S3 bucket, the credentials Terraform authenticates with, the access controls protecting it) stays exactly the same across every workspace.',
        'This means dev and prod workspaces of the same configuration share the same backend-level access boundary — anyone with permission to run Terraform against that backend at all can reach EVERY workspace\'s state, including prod\'s, by simply switching workspace. There is no separate credential or access-control layer between workspaces the way there naturally is between two entirely separate backend configurations.',
      ]
    },
    {
      heading: 'Separate directories give each environment its own backend, credentials, and — critically — an obvious blast radius',
      points: [
        'A directory-per-environment structure (each with its OWN <code>backend</code> block, potentially different provider versions, and separate credentials) means dev and prod genuinely do not share an access boundary — a mistake or compromised credential scoped to the dev directory\'s backend has no path to touch prod\'s state at all.',
        'HashiCorp\'s own current guidance is that CLI workspaces fit short-lived, genuinely IDENTICAL environments built from the exact same configuration (like ephemeral per-PR preview environments) — not meaningfully different, long-lived environments like dev vs prod, where separate credentials and access controls actually matter and workspaces provide no mechanism for enforcing that separation.',
        'A practical, often-cited advantage of directory separation beyond access control: which environment a command affects is obvious from which directory you are physically standing in when you run it, rather than depending on remembering which workspace happens to be currently selected — a real, human-error-reducing property workspaces do not share.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Workspaces: one backend, shared access boundary',
      language: 'bash',
      code: `# Same backend configuration, same directory, same Terraform
# credentials -- ONLY the selected workspace differs:
terraform {
  backend "s3" {
    bucket = "my-tf-state"
    key    = "app/terraform.tfstate"   # workspace name is
    region = "us-east-1"               # appended automatically
  }
}

terraform workspace new dev
terraform workspace new prod

terraform workspace select dev
terraform apply   # affects the "dev" state

terraform workspace select prod
terraform apply   # affects the "prod" state
# SAME backend, SAME AWS credentials either way -- anyone able
# to run terraform here at all can reach prod's state simply
# by switching workspace. No separate access boundary exists
# between "dev" and "prod" at the backend level.`,
    },
    {
      label: 'Directory separation: genuinely separate backends and credentials',
      language: 'bash',
      code: `# environments/dev/backend.tf
terraform {
  backend "s3" {
    bucket = "my-tf-state-dev"      # different bucket
    key    = "app/terraform.tfstate"
    region = "us-east-1"
    # can use dev-scoped AWS credentials / role entirely
  }
}

# environments/prod/backend.tf
terraform {
  backend "s3" {
    bucket = "my-tf-state-prod"     # different bucket
    key    = "app/terraform.tfstate"
    region = "us-east-1"
    # separate, more restrictive prod-scoped credentials / role
  }
}

# cd environments/dev && terraform apply    -- only reaches dev
# cd environments/prod && terraform apply   -- only reaches prod
# A credential compromised or a mistake scoped to the dev
# directory's own backend has NO path to prod's state at all --
# genuinely separate access boundaries, not just separate keys
# within the same one. Which environment you're affecting is
# also obvious from the directory you're standing in.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own QnA and uses Terraform workspaces (dev and prod) within a single configuration and backend to isolate their two environments, reasoning that "each workspace has its own state file" is sufficient separation. A security review flags this setup as a risk for the prod environment specifically. What access-boundary gap does this setup actually have that separate directories would not, and what does HashiCorp\'s own current guidance say workspaces are actually well-suited for instead?',
    hint: 'Workspaces share ONE backend configuration. What does that mean for who/what can reach each workspace\'s state, regardless of which workspace they usually work in?',
    solution: 'Workspaces partition state files within a SINGLE shared backend configuration — the same bucket, same credentials, same access controls apply regardless of which workspace is selected. This means anyone (or any compromised credential) with permission to run Terraform against that backend at all can reach the prod workspace\'s state simply by switching to it — there is no separate access boundary between dev and prod the way genuinely separate backend configurations would provide. HashiCorp\'s own current guidance is that CLI workspaces fit short-lived, genuinely IDENTICAL environments (like ephemeral per-PR preview environments), not meaningfully different, long-lived environments like dev vs prod where separate credentials and access controls actually matter — for that case, separate directories (each with its own backend block and credentials) is the recommended structure instead.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Terraform workspaces and separate directory-based configurations provide equivalent environment isolation, as the main page\'s own QnA phrasing ("workspaces or separate directory-based configurations") seems to suggest by listing them side by side.',
      reality: 'Per this subtopic\'s theory, they differ significantly at the access-control level — workspaces share one backend configuration and its credentials/access controls, while separate directories can have genuinely independent backends, credentials, and access boundaries per environment.'
    },
    {
      thought: 'Because each workspace has its own separate state file, dev and prod workspaces are effectively isolated from each other, similar to having entirely separate backends.',
      reality: 'Per this subtopic\'s theory, having a separate state FILE is not the same as having a separate access BOUNDARY — anyone able to run Terraform against the shared backend at all can reach any workspace\'s state simply by switching to it, with no additional credential barrier in between.'
    },
    {
      thought: 'Workspaces are a deprecated or lesser tool that should never be used, now that separate directories are understood to be safer for prod vs dev.',
      reality: 'Per this subtopic\'s theory, HashiCorp\'s own guidance still recommends workspaces for their actual fit — short-lived, genuinely identical environments like ephemeral per-PR previews — the caution is specifically about using them for meaningfully different, long-lived environments like production, not a blanket rejection of the feature.'
    }
  ];
}
