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
  templateUrl: './gcs-backend-supports-a-customer-managed-kms-key.html',
  styleUrl: './gcs-backend-supports-a-customer-managed-kms-key.scss'
})
export class GcsBackendSupportsACustomerManagedKmsKeySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats GCS/Azure encryption as a fixed, default-only setting',
      points: [
        'The main page\'s Azure & GCS Backends theory says: "Both support encryption at rest via their default cloud storage encryption" — presented as the complete story, with no <code>kms_encryption_key</code>-style argument shown in the GCS codeTab at all, unlike the S3 example\'s explicit <code>encrypt = true</code>.',
      ]
    },
    {
      heading: 'The GCS backend accepts a customer-managed KMS key as a direct backend argument',
      points: [
        'Beyond Google\'s own default (Google-managed) encryption, the <code>gcs</code> backend block supports a <code>kms_encryption_key</code> argument — a Cloud KMS key resource name (in the form <code>projects/PROJECT/locations/LOCATION/keyRings/RING/cryptoKeys/KEY</code>) — that encrypts the state object using a key the account itself controls and can rotate/revoke, rather than relying solely on Google\'s own default-managed key.',
        'This requires a one-time setup step outside the Terraform backend configuration itself: creating the KMS key, and granting the project\'s own GCS service agent the "Cloud KMS CryptoKey Encrypter/Decrypter" IAM role so GCS can actually use that key to encrypt/decrypt objects on the account\'s behalf.',
      ]
    },
    {
      heading: 'Two practical details worth knowing before adopting it',
      points: [
        'Changing FROM a customer-managed key back to the default, or switching to a DIFFERENT customer-managed key, is something Terraform can migrate automatically — GCP keeps the customer-managed key metadata accessible during the migration, so this is a normal backend-configuration change, not a manual re-encryption process.',
        'Reading state via <code>terraform_remote_state</code> from a KMS-encrypted GCS backend needs no special handling on the READER\'s side — decryption happens automatically on GCS\'s own end, so the data source\'s own configuration never needs to reference the KMS key at all.',
        'The customer-managed KMS approach is documented as conflicting with GCS\'s OLDER customer-SUPPLIED encryption key feature (a different, older mechanism) — the two are not meant to be combined, and switching from one to the other requires explicitly removing the old method first.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern: default encryption only',
      language: 'bash',
      code: `# Matches the main page's own GCS backend example exactly --
# no encryption-related argument at all, relying entirely on
# Google's own default-managed encryption:
terraform {
  backend "gcs" {
    bucket = "my-company-tf-state"
    prefix = "prod/app"
  }
}
# Fine for many teams -- but the account itself has no control
# over the encryption key's lifecycle (rotation, revocation)
# with this default.`,
    },
    {
      label: 'Customer-managed KMS key: account-controlled encryption',
      language: 'bash',
      code: `terraform {
  backend "gcs" {
    bucket            = "my-company-tf-state"
    prefix            = "prod/app"
    kms_encryption_key = "projects/my-project/locations/us-central1/keyRings/terraform/cryptoKeys/state-key"
  }
}
# State is now encrypted with a KEY THE ACCOUNT CONTROLS,
# rather than relying solely on Google's own default-managed
# key -- the account can rotate or revoke it independently.

# One-time setup required OUTSIDE this backend block:
# 1. Create the KMS key (in Cloud KMS, via gcloud or Terraform
#    itself, using a resource like google_kms_crypto_key)
# 2. Grant the project's own GCS service agent the
#    "Cloud KMS CryptoKey Encrypter/Decrypter" role on that key
#    -- without this, GCS cannot actually use the key.

# Reading this state via terraform_remote_state needs NO
# special handling -- decryption happens automatically on
# GCS's own end:
data "terraform_remote_state" "network" {
  backend = "gcs"
  config = {
    bucket = "my-company-tf-state"
    prefix = "prod/network"
    # no kms_encryption_key needed here at all
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own GCS backend example exactly (bucket and prefix only, relying on default encryption), a security review asks for the state bucket\'s encryption key to be one the team itself controls and can rotate independently, rather than Google\'s default-managed key. What single backend argument achieves this, what one-time setup step outside the Terraform configuration is required for it to actually work, and does a separate configuration reading this state via terraform_remote_state need any special handling to decrypt it?',
    hint: 'The GCS backend accepts a KMS key resource name directly as a backend argument — but GCS itself needs explicit permission to use that key on the account\'s behalf.',
    solution: 'The `kms_encryption_key` argument, set to the Cloud KMS key\'s full resource name, achieves this: `backend "gcs" { bucket = "...", prefix = "...", kms_encryption_key = "projects/.../cryptoKeys/state-key" }`. The required one-time setup step outside the Terraform configuration is granting the project\'s own GCS service agent the "Cloud KMS CryptoKey Encrypter/Decrypter" IAM role on that key — without it, GCS cannot actually use the key to encrypt or decrypt objects. A separate configuration reading this state via terraform_remote_state needs NO special handling at all — decryption happens automatically on GCS\'s own end, so the data source\'s own backend config never references the KMS key.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The GCS backend, like the main page\'s own example shows, only supports Google\'s default-managed encryption with no way to use an account-controlled key.',
      reality: 'Per this subtopic\'s theory, the gcs backend block accepts a kms_encryption_key argument directly, encrypting state with a Cloud KMS key the account itself creates and controls, beyond the default the main page\'s own example relies on.'
    },
    {
      thought: 'Once a GCS backend uses a customer-managed KMS key, any configuration reading that state via terraform_remote_state must also specify the same KMS key to successfully decrypt it.',
      reality: 'Per this subtopic\'s theory, decryption happens automatically on GCS\'s own end — a reader\'s terraform_remote_state configuration needs no special handling or KMS key reference at all, regardless of how the source state is encrypted.'
    },
    {
      thought: 'Setting kms_encryption_key in the backend block alone is sufficient — no other setup is needed for GCS to actually use the specified key.',
      reality: 'Per this subtopic\'s theory, a one-time setup step outside the Terraform configuration is required first: granting the project\'s own GCS service agent the Cloud KMS CryptoKey Encrypter/Decrypter role on that key, or GCS cannot use it at all.'
    }
  ];
}
