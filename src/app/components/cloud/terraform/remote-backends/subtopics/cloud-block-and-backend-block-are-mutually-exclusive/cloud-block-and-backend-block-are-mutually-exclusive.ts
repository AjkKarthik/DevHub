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
  templateUrl: './cloud-block-and-backend-block-are-mutually-exclusive.html',
  styleUrl: './cloud-block-and-backend-block-are-mutually-exclusive.scss'
})
export class CloudBlockAndBackendBlockAreMutuallyExclusiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s only mention of the cloud block is a single QnA sentence',
      points: [
        'The main page\'s QnA states: "Terraform Cloud uses a cloud block instead of a backend block (since TF 1.1). It provides remote plan/apply execution, state storage, and locking all in one." That single sentence is the entire treatment — no example syntax, and no mention of the constraint that follows directly from "instead of."',
      ]
    },
    {
      heading: '"Instead of" is a hard constraint, not just a stylistic preference',
      points: [
        'A Terraform configuration cannot contain BOTH a <code>cloud</code> block and a <code>backend</code> block at the same time — they are mutually exclusive by design, not just two equally-valid syntax styles for the same underlying concept. Including both produces a configuration error at init time.',
        'This matters in practice specifically when a team maintains SEPARATE configurations for different environments and wants one to use HCP Terraform (via <code>cloud</code>) while another continues using a plain backend like S3 — that split has to happen at the level of separate root configurations entirely, since a single configuration file cannot straddle both mechanisms.',
      ]
    },
    {
      heading: 'A related, easy-to-miss detail: execution mode is not configured in either block',
      points: [
        'The main page\'s own QnA phrase — "remote plan/apply execution... all in one" — could be read as implying the <code>cloud</code> block itself has a setting to choose remote vs local execution. It does not: execution mode (whether <code>plan</code>/<code>apply</code> runs on HCP Terraform\'s own infrastructure or locally on the machine invoking the CLI) is a property of the HCP Terraform WORKSPACE itself, configured in the HCP Terraform UI or API — not a setting inside the <code>cloud</code> block\'s own HCL syntax at all.',
        'This is a genuinely different model from the <code>backend</code> block\'s own S3/Azure/GCS examples on the main page, where every relevant setting (bucket, region, locking table) lives directly in the HCL block itself — the <code>cloud</code> block\'s own HCL is comparatively minimal (organization and workspace identifiers), with the operationally significant execution-mode choice living outside the configuration entirely.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mutual-exclusivity error',
      language: 'bash',
      code: `# Attempting both -- invalid, produces a configuration error:
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "app-prod"
    }
  }

  backend "s3" {
    bucket = "my-company-tf-state"
    key    = "prod/app/terraform.tfstate"
    region = "us-east-1"
  }
}
# Error: Both a nested "cloud" block and a top-level provider
#   "backend" configuration were found. Only one of these is
#   allowed at once.
# "instead of" (per the main page's own QnA wording) is a hard
# constraint, not two interchangeable styles.`,
    },
    {
      label: 'The cloud block\'s own minimal HCL — execution mode lives elsewhere',
      language: 'bash',
      code: `terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "app-prod"
    }
  }
}
# That's the entire cloud block -- no bucket, no region, no
# locking table to configure, unlike the S3/Azure/GCS backend
# examples elsewhere on the main page.

# Execution mode (remote execution on HCP Terraform's own
# infrastructure, vs. local execution on the machine running
# the CLI) is NOT a setting anywhere in this HCL block -- it is
# configured on the "app-prod" WORKSPACE itself, in the HCP
# Terraform UI/API, entirely outside this configuration file.

# A team wanting HCP Terraform for prod but S3 for dev cannot
# mix cloud/backend blocks within one configuration -- this
# split requires genuinely separate root configurations, one
# per environment, each with its own terraform {} block.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own QnA description ("Terraform Cloud uses a cloud block instead of a backend block... provides remote plan/apply execution, state storage, and locking all in one"), a developer expects to find a setting inside the cloud block itself to choose between remote and local execution mode, similar to how the backend "s3" block configures its own bucket and region directly. Where does this configuration actually live, and what happens if a configuration tries to include both a cloud block and a backend block at once?',
    hint: 'The main page\'s own backend examples (S3, Azure, GCS) put every relevant setting directly in the HCL block. Does the cloud block follow that same pattern for every operational setting, or does something live outside the HCL entirely?',
    solution: 'Execution mode is NOT configured inside the cloud block\'s own HCL — it is a property of the HCP Terraform WORKSPACE itself, set in the HCP Terraform UI or API, entirely outside the configuration file. The cloud block\'s own HCL is comparatively minimal (just organization and workspace identifiers), unlike the backend "s3" block\'s bucket/region/locking settings that live directly in the HCL. Separately, including both a cloud block and a backend block in the same configuration produces a hard configuration error at init time — they are mutually exclusive by design, not two interchangeable styles for the same underlying mechanism, so a team wanting HCP Terraform for one environment and a plain backend for another needs genuinely separate root configurations, not a single one straddling both.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The cloud block and backend block are two equally-valid, interchangeable syntax styles for configuring remote state, and a configuration could reasonably include both for extra clarity.',
      reality: 'Per this subtopic\'s theory, they are mutually exclusive by design — a configuration containing both produces a hard configuration error at init time, not a warning or a stylistic redundancy.'
    },
    {
      thought: 'The cloud block\'s "remote plan/apply execution... all in one" phrasing means execution mode (remote vs local) is a setting configured directly inside the cloud block\'s own HCL syntax.',
      reality: 'Per this subtopic\'s theory, execution mode is a property of the HCP Terraform WORKSPACE itself, configured in the HCP Terraform UI or API — not a setting anywhere inside the cloud block\'s own HCL, which stays comparatively minimal.'
    },
    {
      thought: 'A single Terraform configuration can use HCP Terraform for one environment and a plain S3 backend for another simply by switching which block is active via a variable or conditional.',
      reality: 'Per this subtopic\'s theory, since cloud and backend blocks are mutually exclusive and neither supports variables (backend configuration is resolved before variable evaluation), mixing them across environments requires genuinely separate root configurations, not a conditional switch within one.'
    }
  ];
}
