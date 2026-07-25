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
  templateUrl: './module-provider-alias-needs-configuration-aliases-declared.html',
  styleUrl: './module-provider-alias-needs-configuration-aliases-declared.scss'
})
export class ModuleProviderAliasNeedsConfigurationAliasesDeclaredSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s challenge shows the caller side of passing an aliased provider, never the module side',
      points: [
        'The main page\'s Multi-Account AWS example shows <code>providers = { aws = aws.prod }</code> inside a module block, and states "Child modules receive providers from the parent." What it never shows is what the module itself needs to declare to legally accept that aliased provider — the caller-side syntax alone is not the whole story.',
      ]
    },
    {
      heading: 'Default (unaliased) provider inheritance is automatic — aliased inheritance is not',
      points: [
        'A child module automatically inherits the root module\'s DEFAULT (unaliased) provider configuration with no extra declaration needed — this is why most simple modules work with zero provider-related boilerplate at all.',
        'Passing an ALIASED provider into a module explicitly (the main page\'s own <code>providers = { aws = aws.prod }</code> pattern) is different: the module itself must explicitly declare that it accepts an aliased provider configuration, or Terraform rejects the module as an incomplete configuration.',
      ]
    },
    {
      heading: 'The missing piece: configuration_aliases inside the module\'s own required_providers',
      points: [
        'Inside the CHILD module\'s own <code>required_providers</code> block, the provider entry needs a <code>configuration_aliases</code> argument listing every alias name the module is prepared to receive — e.g. <code>aws = { source = "hashicorp/aws", configuration_aliases = [aws.prod, aws.staging] }</code>.',
        'Without this declaration, passing an aliased provider into the module produces an error (concretely: the module does not validate as a complete configuration on its own, or the alias silently fails to route as expected) — the caller-side <code>providers = { aws = aws.prod }</code> syntax the main page shows is necessary but not sufficient by itself.',
        'This declaration only names WHICH alias identifiers the module is willing to accept — it does not configure them; the actual region/credentials for each alias are still defined by aliased <code>provider</code> blocks in the ROOT module, exactly as the main page\'s own example already shows.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The caller side (matches the main page\'s own example)',
      language: 'bash',
      code: `# Root module
provider "aws" {
  alias  = "prod"
  region = "us-east-1"

  assume_role {
    role_arn = "arn:aws:iam::123456789012:role/TerraformRole"
  }
}

module "prod_network" {
  source = "./modules/network"

  providers = {
    aws = aws.prod   # pass the aliased provider into the module
  }
}
# This alone is NOT enough -- the module itself must opt in.`,
    },
    {
      label: 'The missing module-side declaration',
      language: 'bash',
      code: `# modules/network/versions.tf -- inside the CHILD module
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      # This is what the main page's example never shows:
      # the module must explicitly declare it accepts an
      # aliased "aws" provider configuration under this name.
      configuration_aliases = [aws.prod]
    }
  }
}

# modules/network/main.tf -- resources inside the module now
# correctly resolve "aws" to whichever aliased provider the
# ROOT module passed in via the providers = { ... } map:
resource "aws_vpc" "this" {
  provider   = aws   # resolves to aws.prod, passed in from root
  cidr_block = "10.0.0.0/16"
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following exactly the main page\'s own example, a root module defines `provider "aws" { alias = "prod" ... }` and a module block with `providers = { aws = aws.prod }`. The module itself was written with a plain `required_providers { aws = { source = "hashicorp/aws" } }` block — no configuration_aliases. What is missing, and what needs to be added to the module\'s own required_providers block to make the aliased provider actually usable inside it?',
    hint: 'The main page shows the caller (root module) side of passing an aliased provider into a module. What does the module itself need to declare to legally accept it?',
    solution: 'The module\'s own required_providers block is missing a configuration_aliases entry for the aws provider. Without it, the module does not declare that it is prepared to receive an aliased provider configuration, so passing one in via the root module\'s `providers = { aws = aws.prod }` is not enough on its own. The fix is adding `configuration_aliases = [aws.prod]` to the module\'s own aws entry in required_providers: `aws = { source = "hashicorp/aws", configuration_aliases = [aws.prod] }`. This only names which alias identifiers the module accepts — the actual region/credentials for aws.prod remain defined by the aliased provider block in the root module, exactly as already shown there.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A module automatically works with any aliased provider passed into it via the providers = { ... } map, the same way it automatically inherits the default provider configuration.',
      reality: 'Per this subtopic\'s theory, default (unaliased) provider inheritance is automatic, but an ALIASED provider requires the module to explicitly opt in via configuration_aliases in its own required_providers block — without it, the module is not a valid, complete configuration for accepting one.'
    },
    {
      thought: 'configuration_aliases inside a module configures the actual region/credentials for that provider alias.',
      reality: 'Per this subtopic\'s theory, configuration_aliases only DECLARES which alias names the module is willing to accept — the actual configuration (region, credentials, etc.) for each alias still lives in the root module\'s own aliased provider blocks, exactly as the main page\'s example already shows.'
    },
    {
      thought: 'The providers = { aws = aws.prod } syntax shown on the main page is by itself a complete, working way to pass a specific regional/account provider into any module.',
      reality: 'Per this subtopic\'s theory, that syntax is necessary but not sufficient — it only works if the module being called has ALSO declared configuration_aliases for that provider, which the main page\'s own example never shows on the module side.'
    }
  ];
}
