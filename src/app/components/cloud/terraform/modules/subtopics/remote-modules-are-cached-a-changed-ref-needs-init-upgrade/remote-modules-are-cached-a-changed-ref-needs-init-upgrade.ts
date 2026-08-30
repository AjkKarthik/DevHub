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
  templateUrl: './remote-modules-are-cached-a-changed-ref-needs-init-upgrade.html',
  styleUrl: './remote-modules-are-cached-a-changed-ref-needs-init-upgrade.scss'
})
export class RemoteModulesAreCachedAChangedRefNeedsInitUpgradeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions both commands but not the caching behavior that makes them necessary',
      points: [
        'The main page\'s Module Versioning theory says "Run terraform init to download new module versions after updating version constraints" and "Run terraform get to only download modules without reinitializing the backend." Both true — but neither explains that remote modules are CACHED on disk after their first download, which is what makes a plain re-run of these commands insufficient in the case that actually bites people.',
      ]
    },
    {
      heading: 'Remote modules are copied into .terraform/modules and reused from there',
      points: [
        'When <code>terraform init</code> first encounters a registry or Git module, it downloads the module\'s content into the working directory\'s <code>.terraform/modules</code> directory. Every subsequent plan/apply reads the module from that local cache — Terraform does not re-fetch from the registry or Git remote on every run.',
        'This is what makes plans fast and CI runs reproducible, and it is the same caching that makes a committed lock file meaningful for providers. The catch is that a cached copy can become stale relative to what the configuration now asks for.',
      ]
    },
    {
      heading: 'The stale case: changing a ref or constraint without forcing a re-fetch',
      points: [
        'Changing a Git source\'s <code>?ref=</code> (say from <code>v1.2.0</code> to <code>v1.3.0</code>), or moving a mutable branch ref like <code>?ref=main</code> forward, does not by itself guarantee the cached copy is replaced — a plain <code>terraform init</code> can reuse what is already in <code>.terraform/modules</code>, leaving plans running against the OLD module content while the configuration file clearly says otherwise. This has been a recurring, well-reported source of confusion across Terraform versions.',
        'The reliable fix is <code>terraform init -upgrade</code>, which explicitly re-resolves and re-fetches modules (and providers) rather than accepting the cache. In CI specifically, <code>-upgrade</code> is preferable to <code>terraform get -update</code> because it handles modules and providers together in one step rather than leaving provider resolution to a separate concern.',
        'A mutable branch ref makes this sharper still: with <code>?ref=main</code>, the configuration text never changes at all when the module updates, so there is no diff to prompt anyone to re-init — which is a concrete reason to prefer an immutable tag or commit SHA, beyond the general "pins should be pins" argument.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The stale-cache scenario',
      language: 'bash',
      code: `# Configuration updated to a newer module tag:
module "vpc" {
  source = "git::https://github.com/myorg/modules.git//vpc?ref=v1.3.0"
  # was: ?ref=v1.2.0
}

terraform init
# "Initializing modules..." -- but the module may be served
# from the existing .terraform/modules cache rather than
# re-fetched, so plan can still run against v1.2.0's content
# while the config file plainly says v1.3.0.

terraform plan
# Shows no changes (or the wrong changes) -- the confusing
# symptom, since the configuration and the plan disagree with
# no error to explain why.

# Inspecting what is actually cached:
cat .terraform/modules/modules.json`,
    },
    {
      label: 'Forcing a genuine re-fetch',
      language: 'bash',
      code: `# The reliable fix -- explicitly re-resolve and re-fetch
# modules (and providers) instead of trusting the cache:
terraform init -upgrade

# In CI, prefer -upgrade over 'terraform get -update' -- it
# handles modules AND providers in one step, rather than
# leaving provider resolution as a separate concern:
terraform init -upgrade

# Last-resort manual equivalent (occasionally used when
# debugging a genuinely stuck cache):
rm -rf .terraform/modules
terraform init

# --- Why immutable refs matter beyond "pins should be pins" ---
# With a MUTABLE branch ref, the config text never changes at
# all when the module updates upstream:
module "vpc" {
  source = "git::https://github.com/myorg/modules.git//vpc?ref=main"
}
# There is no diff in the .tf file to prompt anyone to re-init,
# so a stale cache can persist indefinitely without any visible
# signal that it is stale.

# An immutable tag or SHA at least makes the intended version
# visible in version control:
module "vpc" {
  source = "git::https://github.com/myorg/modules.git//vpc?ref=v1.3.0"
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer updates a Git-sourced module from `?ref=v1.2.0` to `?ref=v1.3.0`, runs `terraform init` (which reports success), then `terraform plan` — which shows none of the changes v1.3.0 was supposed to introduce. The configuration file clearly says v1.3.0 and no error appears anywhere. What is most likely happening, what command reliably resolves it, and why would this same situation be even harder to notice if the module had used `?ref=main` instead?',
    hint: 'Where does Terraform read a remote module from after its first download, and does a plain init guarantee that copy is replaced?',
    solution: 'Terraform caches remote modules in the working directory\'s `.terraform/modules` directory after first download and reads from there on subsequent runs — a plain `terraform init` can reuse the existing cached copy, so plans keep running against v1.2.0\'s content even though the configuration says v1.3.0, with no error to explain the mismatch. The reliable fix is `terraform init -upgrade`, which explicitly re-resolves and re-fetches modules (and providers) rather than accepting the cache; in CI it is also preferable to `terraform get -update` since it handles both in one step. With `?ref=main` this would be harder to notice because the configuration text never changes at all when the module updates upstream — there is no diff in the .tf file to prompt anyone to re-init, so a stale cache can persist indefinitely with no visible signal, which is a concrete argument for immutable tags or commit SHAs beyond the general pinning principle.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Terraform re-fetches remote modules from the registry or Git remote on every plan and apply, so the module content always matches what the source address currently specifies.',
      reality: 'Per this subtopic\'s theory, remote modules are downloaded once into .terraform/modules and read from that local cache on subsequent runs — which is what makes plans fast, but also what allows a cached copy to go stale relative to the configuration.'
    },
    {
      thought: 'Changing a module\'s ?ref= in the source address is enough on its own — the next terraform init will necessarily pick up the new version because the configuration changed.',
      reality: 'Per this subtopic\'s theory, a plain terraform init can still reuse the cached copy, leaving plans running against the old module content with no error — terraform init -upgrade is what explicitly forces re-resolution and re-fetch.'
    },
    {
      thought: 'Using a mutable branch ref like ?ref=main is only a problem because the version is unpinned — the caching behavior affects tags and branches equally.',
      reality: 'Per this subtopic\'s theory, a mutable branch ref makes the caching problem specifically harder to detect: the configuration text never changes when the module updates upstream, so there is no diff to prompt a re-init and no visible signal that the cache has gone stale.'
    }
  ];
}
