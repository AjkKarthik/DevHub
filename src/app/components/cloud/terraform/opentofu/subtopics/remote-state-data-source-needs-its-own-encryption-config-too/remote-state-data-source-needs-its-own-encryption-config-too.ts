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
  templateUrl: './remote-state-data-source-needs-its-own-encryption-config-too.html',
  styleUrl: './remote-state-data-source-needs-its-own-encryption-config-too.scss'
})
export class RemoteStateDataSourceNeedsItsOwnEncryptionConfigTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s encryption example only shows a single project reading its own state',
      points: [
        'The main page\'s state-encryption code sample configures one <code>terraform {}</code> block\'s <code>encryption {}</code> sub-block for a single project\'s own state and plan files. It never addresses the common cross-project pattern the Refactoring & State Ops page\'s own <code>terraform_remote_state</code> data source enables — reading a DIFFERENT project\'s state as an input.',
      ]
    },
    {
      heading: 'The gap: encryption is not transparent to a consuming project — it needs its own explicit configuration',
      points: [
        'If the SOURCE project\'s state is encrypted, a separate CONSUMING project reading it via <code>terraform_remote_state</code> does not automatically inherit or apply that encryption configuration just because the source used it. Decrypting that remote state requires the consuming project to independently configure appropriate encryption settings of its own.',
        'OpenTofu supports this via a <code>remote_state_data_source</code> block, named to match the local data source reference, inside the consuming project\'s own <code>encryption {}</code> configuration — either reusing the exact same key/method as the source project, or defining an entirely separate set of keys specifically for reading that one remote state reference.',
      ]
    },
    {
      heading: 'The practical consequence: a working local encryption setup does not guarantee a working cross-project read',
      points: [
        'A team can have their OWN project\'s state encryption fully working (writes and reads succeed locally) while a SEPARATE project\'s <code>terraform_remote_state</code> reference to that state fails outright, simply because the consuming project never configured its own encryption settings for that specific remote state read.',
        'This is a real coordination point between teams: whoever owns the consuming project needs to know the source state IS encrypted, and needs the correct key material (or access to it) configured on their own side — encryption doesn\'t travel with the state reference automatically the way an unencrypted remote state read always has.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Source project: state is encrypted',
      language: 'bash',
      code: `# networking/main.tf -- the SOURCE project
terraform {
  encryption {
    key_provider "pbkdf2" "net_key" {
      passphrase = var.net_state_passphrase
    }
    method "aes_gcm" "net_method" {
      keys = key_provider.pbkdf2.net_key
    }
    state { method = method.aes_gcm.net_method }
  }
  backend "s3" {
    bucket = "shared-tofu-state"
    key    = "networking/terraform.tfstate"
  }
}

output "vpc_id" { value = aws_vpc.main.id }`,
    },
    {
      label: 'Consuming project: needs ITS OWN encryption config to read it',
      language: 'bash',
      code: `# compute/main.tf -- a SEPARATE project reading the above state
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "shared-tofu-state"
    key    = "networking/terraform.tfstate"
  }
}

# WITHOUT its own encryption config, this data source read FAILS --
# the compute project has no way to decrypt networking's state.
# It must configure its own matching decryption settings:

terraform {
  encryption {
    key_provider "pbkdf2" "net_key" {
      # Same passphrase the networking project used -- must be
      # shared/known to this consuming project independently
      passphrase = var.net_state_passphrase
    }
    method "aes_gcm" "net_method" {
      keys = key_provider.pbkdf2.net_key
    }
    remote_state_data_source "networking" {
      method = method.aes_gcm.net_method
    }
  }
}

resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.networking.outputs.vpc_id
  # ... now resolves correctly, decryption succeeds
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Team A\'s "networking" project has working OpenTofu state encryption — their own plans and applies succeed without issue. Team B\'s separate "compute" project adds a terraform_remote_state data source pointing at Team A\'s state, following the exact same pattern the main page\'s own refactoring guidance shows for unencrypted remote state. Team B\'s tofu plan fails to read the networking outputs. What\'s the most likely cause, and what does Team B need to do?',
    hint: 'Does a consuming project automatically inherit the source project\'s encryption configuration just by referencing its state?',
    solution: 'The most likely cause is that Team A\'s networking state is encrypted, and Team B\'s compute project never configured any encryption settings of its own for that remote_state data source — encryption does not travel automatically with a terraform_remote_state reference the way an unencrypted state read would. Team B needs to add their own encryption { } block containing a remote_state_data_source entry for the "networking" reference, configured with a key_provider and method that can decrypt Team A\'s state (either the exact same key material Team A used, obtained securely, or whatever key-sharing arrangement the two teams have set up) — only then will the data source successfully decrypt and expose networking\'s outputs to the compute project.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a source project\'s state is encrypted with OpenTofu, any other project reading it via terraform_remote_state automatically inherits that encryption configuration and can decrypt it without any extra setup.',
      reality: 'Per this subtopic\'s theory, encryption configuration does not travel with a terraform_remote_state reference — the consuming project must independently configure its own matching decryption settings via a remote_state_data_source block, or the read fails.'
    },
    {
      thought: 'Since the main page\'s own encryption example shows working state encryption for a single project, the same configuration automatically covers every other project that might ever reference that state.',
      reality: 'Per this subtopic\'s theory, the main page\'s example only covers a project reading its OWN state — a separate, consuming project reading that state via terraform_remote_state is a distinct scenario requiring its own explicit encryption configuration, not something the source project\'s setup extends to automatically.'
    },
    {
      thought: 'A terraform_remote_state data source failing to read an encrypted state file indicates a problem with the SOURCE project\'s encryption setup, since that\'s where the state was actually encrypted.',
      reality: 'Per this subtopic\'s theory, the source project\'s encryption can be working perfectly (its own plans and applies succeed) while a separate consuming project\'s remote_state read still fails — the failure point is specifically the consuming project\'s missing encryption configuration, not the source\'s.'
    }
  ];
}
