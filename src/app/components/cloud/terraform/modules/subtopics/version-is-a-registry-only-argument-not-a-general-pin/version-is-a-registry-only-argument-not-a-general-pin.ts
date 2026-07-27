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
  templateUrl: './version-is-a-registry-only-argument-not-a-general-pin.html',
  styleUrl: './version-is-a-registry-only-argument-not-a-general-pin.scss'
})
export class VersionIsARegistryOnlyArgumentNotAGeneralPinSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the rule in one clause, then spends a whole mistake entry teaching the opposite habit',
      points: [
        'The main page\'s Module Sources theory ends with: "version constraint only applies to registry modules — use ?ref= for Git sources." Correct. But its "Not pinning registry module versions" mistake entry then drills in the general lesson "always pin with version" without re-flagging the source-type restriction — an easy combination to internalize as "version is how you pin a module," full stop.',
      ]
    },
    {
      heading: 'version is not a general-purpose pin — it only exists for registry sources',
      points: [
        'The <code>version</code> argument is only valid when <code>source</code> points at a module in a registry (the public Terraform Registry, or a private/HCP registry). For every other source type — Git, local paths, S3, GCS, HTTP — the argument is not applicable at all, and Terraform reports an error rather than accepting it as a no-op.',
        'The reason is structural rather than arbitrary: a registry is a versioned catalog Terraform can query to resolve a constraint like <code>~> 5.0</code> into a concrete release. A raw Git URL or filesystem path has no such catalog to consult — there is nothing for a constraint expression to be resolved against, so version selection has to be expressed inside the source address itself.',
      ]
    },
    {
      heading: 'Each non-registry source pins differently — and a local path cannot pin at all',
      points: [
        'For Git sources, the pin goes in the URL as a <code>?ref=</code> argument — <code>?ref=v3.0.1</code> for a tag, or a commit SHA for an exact, immutable pin. A branch name (<code>?ref=main</code>) is technically valid but is not really a pin: the branch moves, so the module content can change underneath an unchanged configuration.',
        'A local path source (<code>./modules/network</code>) has no version concept at all — it is whatever is on disk right now. That is usually fine, since local modules live in the same repository and move with it under the same commit, but it does mean "pinning" a local module is really just a property of the repository\'s own version control, not of Terraform.',
        'This is also why <code>.terraform.lock.hcl</code> is not the answer here: that file locks PROVIDER versions, not module versions — a point easy to conflate given the main page\'s own Module Versioning theory mentions committing it directly alongside its module-pinning advice.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mistake: version on a non-registry source',
      language: 'bash',
      code: `# Applying the "always pin with version" habit to a Git source:
module "vpc" {
  source  = "git::https://github.com/myorg/modules.git//vpc"
  version = "~> 3.0"     # NOT valid for a Git source
}
# Error: Invalid combination of arguments
#   The "version" argument may only be used with modules from
#   a registry. Git sources must specify a version by adding a
#   ref argument to the source address.

# Terraform rejects it rather than silently ignoring it -- so
# this is caught at init, not left as a false sense of pinning.`,
    },
    {
      label: 'How each source type actually pins',
      language: 'bash',
      code: `# Registry source -- version IS the mechanism:
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
}

# Git source -- the pin lives inside the source address:
module "vpc" {
  source = "git::https://github.com/myorg/modules.git//vpc?ref=v3.0.1"
}

# Git source pinned to an exact commit (strongest -- immutable):
module "vpc" {
  source = "git::https://github.com/myorg/modules.git//vpc?ref=a1b2c3d4"
}

# Git source on a BRANCH -- valid, but not really a pin:
module "vpc" {
  source = "git::https://github.com/myorg/modules.git//vpc?ref=main"
}
# "main" moves. The module's content can change underneath an
# unchanged configuration.

# Local path -- no version concept at all; it is whatever is
# on disk, versioned by the repository itself:
module "network" {
  source = "./modules/network"
}

# Note: .terraform.lock.hcl locks PROVIDER versions, not
# module versions -- it is not a fallback pin for modules.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s "always pin with version" advice consistently. Their registry modules all pin cleanly, but when they add `version = "~> 3.0"` to a module sourced from `git::https://github.com/myorg/modules.git//vpc`, terraform init fails. They wonder whether they should just drop the version argument and accept the module being unpinned. What is the actual reason version is rejected here, and what is the correct pin for a Git source — including which form is a genuine pin versus one that only looks like one?',
    hint: 'What does a registry provide that a raw Git URL does not, and where does version selection have to live for a source Terraform cannot query a catalog for?',
    solution: 'The `version` argument only works for registry sources because a registry is a versioned catalog Terraform can query to resolve a constraint like `~> 3.0` into a concrete release — a raw Git URL has no such catalog, so there is nothing for the constraint to be resolved against. Dropping the argument and leaving it unpinned is not necessary: for Git sources the pin lives inside the source address as a `?ref=` argument, e.g. `source = "git::https://github.com/myorg/modules.git//vpc?ref=v3.0.1"`. On which forms are genuine pins: a tag (`?ref=v3.0.1`) or a commit SHA (`?ref=a1b2c3d4`) are real pins, with the SHA being strongest since it is immutable; a branch name (`?ref=main`) is technically valid but only looks like a pin — the branch moves, so the module content can change underneath an unchanged configuration.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The version argument is the general way to pin any Terraform module, and applies to Git and local sources the same way it applies to registry modules.',
      reality: 'Per this subtopic\'s theory, version is only valid for registry sources — Terraform errors on it for Git, local, S3, and other source types, because only a registry provides a versioned catalog a constraint can be resolved against.'
    },
    {
      thought: 'Adding version to a Git-sourced module is harmlessly ignored, so the worst case is simply that the module is unpinned.',
      reality: 'Per this subtopic\'s theory, Terraform reports an error rather than silently ignoring it — which is actually the safer behavior, since it surfaces the problem at init instead of leaving a false sense of pinning in place.'
    },
    {
      thought: 'Committing .terraform.lock.hcl locks module versions, providing a safety net even when a module source is not otherwise pinned.',
      reality: 'Per this subtopic\'s theory, .terraform.lock.hcl locks PROVIDER versions, not module versions — it is not a fallback pin for modules, a point easy to conflate since the main page mentions it directly alongside its module-versioning advice.'
    }
  ];
}
