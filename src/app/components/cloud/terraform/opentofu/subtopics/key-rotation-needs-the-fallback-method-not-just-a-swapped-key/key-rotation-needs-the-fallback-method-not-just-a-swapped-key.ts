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
  templateUrl: './key-rotation-needs-the-fallback-method-not-just-a-swapped-key.html',
  styleUrl: './key-rotation-needs-the-fallback-method-not-just-a-swapped-key.scss'
})
export class KeyRotationNeedsTheFallbackMethodNotJustASwappedKeySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows a single, static encryption key with no rotation story at all',
      points: [
        'The main page\'s own encryption example configures exactly one <code>key_provider</code> and one <code>method</code>, used for both state and plan. It never addresses what happens later — how do you actually change that key once it\'s in production, without breaking every existing OpenTofu operation that needs to read the ALREADY-encrypted state?',
      ]
    },
    {
      heading: 'Why a naive key swap breaks: the state on disk is encrypted with the OLD key, not the new one',
      points: [
        'Simply replacing the <code>key_provider</code>\'s value (a new passphrase, a new KMS key ID) and running <code>tofu plan</code> fails — the existing state file was encrypted with the OLD key, and OpenTofu has no way to decrypt it using only the new one. This isn\'t a corner case; it is what happens EVERY time a key is swapped without a transition step.',
      ]
    },
    {
      heading: 'The actual mechanism: a fallback method, used for a three-phase rotation',
      points: [
        'OpenTofu\'s encryption configuration supports a <code>fallback</code> method specifically for this: if the PRIMARY method fails to decrypt state or a plan file, OpenTofu automatically retries with the fallback method — but writes (encrypts) always use the primary method only, never the fallback.',
        'The safe rotation sequence is three phases: (1) configure the NEW key as primary, with the OLD key\'s method set as <code>fallback</code> — a <code>tofu plan</code>/<code>apply</code> at this point can still READ the old-key-encrypted state via fallback, while any WRITE re-encrypts using the new key; (2) run <code>tofu apply -refresh-only</code> to force a state write, which re-encrypts everything with the new key; (3) once re-encryption is confirmed, remove the fallback method entirely — the old key is no longer needed or referenced.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Phase 1 — new key primary, old key as fallback',
      language: 'bash',
      code: `terraform {
  encryption {
    key_provider "pbkdf2" "new_key" {
      passphrase = var.new_state_passphrase
    }
    key_provider "pbkdf2" "old_key" {
      passphrase = var.old_state_passphrase
    }

    method "aes_gcm" "new_method" {
      keys = key_provider.pbkdf2.new_key
    }
    method "aes_gcm" "old_method" {
      keys = key_provider.pbkdf2.old_key
    }

    state {
      method   = method.aes_gcm.new_method   # used for WRITES
      fallback { method = method.aes_gcm.old_method }  # used to READ old state
    }
  }
}

# At this point: reads succeed via fallback against existing
# old-key-encrypted state. Any WRITE re-encrypts with the new key.`,
    },
    {
      label: 'Phase 2 — force re-encryption, Phase 3 — drop the old key',
      language: 'bash',
      code: `# Phase 2: force a state WRITE so everything gets re-encrypted
# with the new key (a plain read-only plan does NOT rewrite state)
tofu apply -refresh-only -auto-approve

# Confirm: state is now encrypted with new_key only. Verify by
# temporarily removing the fallback block and running:
tofu plan
# If this succeeds with fallback removed, re-encryption is complete.

# Phase 3: remove the old key/fallback entirely -- clean final config
terraform {
  encryption {
    key_provider "pbkdf2" "new_key" {
      passphrase = var.new_state_passphrase
    }
    method "aes_gcm" "new_method" {
      keys = key_provider.pbkdf2.new_key
    }
    state {
      method = method.aes_gcm.new_method
      # no fallback -- old key is fully retired
    }
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team using OpenTofu\'s state encryption needs to rotate their pbkdf2 passphrase after a suspected leak. They update the passphrase value in their existing single key_provider block and run tofu plan. It fails immediately with a decryption error. What went wrong, and what should the encryption configuration have looked like instead?',
    hint: 'Is the existing state file on disk encrypted with the OLD passphrase or the NEW one? Can a single key_provider block with only the new value decrypt data encrypted under the old one?',
    solution: 'The plan fails because the existing state file on disk was encrypted with the OLD passphrase — simply swapping the value in the single key_provider block gives OpenTofu no way to decrypt data that was encrypted under a completely different key. The correct approach is the three-phase fallback rotation: configure the NEW passphrase as the primary key_provider/method, and add the OLD passphrase\'s method as a fallback specifically for the state block — this lets OpenTofu decrypt the existing old-key state via fallback while any subsequent write uses the new key. Running tofu apply -refresh-only forces a write, re-encrypting the state under the new key. Only once that\'s confirmed should the fallback (and the old key) be removed from configuration entirely.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Rotating an OpenTofu state encryption key is as simple as changing the passphrase or KMS key ID value in the existing key_provider block and running tofu plan or apply.',
      reality: 'Per this subtopic\'s theory, a naive key swap fails immediately — the existing state file was encrypted under the OLD key, and OpenTofu needs an explicit fallback method configured to decrypt it while transitioning to the new key.'
    },
    {
      thought: 'Once a fallback method is configured alongside a new primary key, both keys remain usable for reads and writes indefinitely, so there\'s no urgency to complete the rotation.',
      reality: 'Per this subtopic\'s theory, WRITES always use the primary method only, never the fallback — a plain tofu plan (which doesn\'t necessarily force a state write) may leave state still encrypted under the old key; an explicit tofu apply -refresh-only is needed to force re-encryption, and the fallback/old key should then be removed once confirmed.'
    },
    {
      thought: 'The fallback method in an OpenTofu encryption block is used for both reading AND writing state during a rotation, splitting the load between old and new keys.',
      reality: 'Per this subtopic\'s theory, fallback is read-only — OpenTofu tries the primary method first for both read and write, and only falls back to the fallback method when a READ (decrypt) with the primary method fails; writes never use the fallback method under any circumstance.'
    }
  ];
}
