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
  templateUrl: './init-upgrade-upgrades-every-provider-not-just-one.html',
  styleUrl: './init-upgrade-upgrades-every-provider-not-just-one.scss'
})
export class InitUpgradeUpgradesEveryProviderNotJustOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions -upgrade\'s effect, but not its blast radius',
      points: [
        'The main page\'s QnA states: "terraform init -upgrade... re-selects providers ignoring the lock file constraints and chooses the newest version matching your version constraints... Use carefully — upgrades may include breaking changes." True, but it never clarifies WHICH providers get re-selected — the natural reading, especially coming right after a section about ONE specific provider, is that -upgrade is scoped to whatever you\'re currently working on.',
      ]
    },
    {
      heading: '-upgrade is global — it touches every provider in the configuration, not one',
      points: [
        'Running <code>terraform init -upgrade</code> upgrades ALL previously-selected providers to the newest version that satisfies each one\'s own constraint — not just a provider you happen to be thinking about at the time. If a configuration declares five providers, all five are candidates for a version bump in the same command.',
        'This means running <code>-upgrade</code> to pick up a genuinely wanted new feature in ONE provider (say, a new resource type in a recent <code>hashicorp/aws</code> release) can simultaneously and silently bump every OTHER provider too, including ones nobody intended to touch that day — each governed only by its own, possibly loose, version constraint.',
        '<code>-upgrade</code> also affects MODULES, not just providers: it updates all already-installed module sources to their latest available version, not only newly-added ones — another scope expansion beyond what the command name alone suggests.',
      ]
    },
    {
      heading: 'The safer, targeted alternative: narrow the constraint, then plain init',
      points: [
        'To move ONLY one specific provider forward, the more scoped approach is editing that provider\'s own version constraint directly in <code>required_providers</code> (for example, widening <code>"~> 5.0"</code> to <code>"~> 5.3"</code> to allow a specific newer release), then running plain <code>terraform init</code> with no <code>-upgrade</code> flag at all — the changed constraint no longer matches the version pinned in <code>.terraform.lock.hcl</code>, so Terraform naturally re-resolves just that provider to satisfy the new constraint, without touching any other provider\'s already-locked version.',
        'This targeted approach keeps every other provider exactly as pinned in the lock file, giving a reviewable, single-provider diff in <code>.terraform.lock.hcl</code> instead of an unpredictable, multi-provider diff from a blanket <code>-upgrade</code>.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The blanket upgrade -- more than intended',
      language: 'bash',
      code: `# Configuration has three providers:
# aws     = "~> 5.0"   (currently locked at 5.10.0)
# random  = "~> 3.5"   (currently locked at 3.5.1)
# archive = "~> 2.4"   (currently locked at 2.4.0)

# Goal: just want the newest aws release for a new resource type
terraform init -upgrade

# Actual result: Terraform re-resolves ALL THREE providers to
# their newest version satisfying each constraint -- random and
# archive may silently bump too, even though nobody intended to
# touch them today. .terraform.lock.hcl now shows changes across
# all three providers, not just aws.`,
    },
    {
      label: 'Targeted alternative: narrow the constraint, plain init',
      language: 'bash',
      code: `# Only touch aws: widen its own constraint to allow the
# specific newer release actually wanted
required_providers {
  aws = {
    source  = "hashicorp/aws"
    version = "~> 5.10"   # was "~> 5.0" -- now allows 5.10.x-5.x
  }
  random = {
    source  = "hashicorp/random"
    version = "~> 3.5"    # untouched
  }
  archive = {
    source  = "hashicorp/archive"
    version = "~> 2.4"    # untouched
  }
}

# Plain init (no -upgrade) -- the changed aws constraint no
# longer matches the lock file's pinned 5.10.0, so Terraform
# re-resolves ONLY aws. random and archive stay exactly as
# pinned in .terraform.lock.hcl.
terraform init
# .terraform.lock.hcl diff now shows ONLY the aws entry changed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A configuration declares five providers, each with its own version constraint. A developer wants to pick up a new resource type recently added to the aws provider, so they run `terraform init -upgrade`, expecting only the aws entry in .terraform.lock.hcl to change. Reviewing the resulting lock-file diff, they are surprised to see three OTHER providers also changed versions. What caused this, and what command sequence would have upgraded only the aws provider?',
    hint: 'Ask what "all previously-selected providers" actually means when -upgrade runs, versus what the developer assumed it meant.',
    solution: '`terraform init -upgrade` re-selects EVERY provider in the configuration to its newest version satisfying its own constraint — it is not scoped to any single provider, so the other three providers were upgraded simply because their own constraints also permitted a newer version, even though nobody intended to touch them. The targeted alternative is: edit ONLY the aws provider\'s own version constraint in required_providers to allow the specific newer release wanted (e.g. widening `~> 5.0` to `~> 5.10`), then run plain `terraform init` with no `-upgrade` flag — since the changed constraint no longer matches the version already pinned in `.terraform.lock.hcl`, Terraform re-resolves only that one provider, leaving every other provider\'s pinned version untouched.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'terraform init -upgrade only re-evaluates the specific provider you are currently working with or thinking about, leaving other providers pinned at their lock-file versions.',
      reality: 'Per this subtopic\'s theory, -upgrade is global — it re-selects every provider in the configuration to the newest version satisfying its own constraint, not just one, and can silently bump providers nobody intended to touch.'
    },
    {
      thought: 'The only way to move a single provider to a newer version is running -upgrade and accepting that other providers might also change.',
      reality: 'Per this subtopic\'s theory, a more targeted approach exists: narrowing or widening just that provider\'s own version constraint and running plain terraform init (no -upgrade) — the changed constraint alone forces Terraform to re-resolve that provider without touching any other provider\'s locked version.'
    },
    {
      thought: '-upgrade only affects providers — module sources already installed are left alone unless newly added to the configuration.',
      reality: 'Per this subtopic\'s theory, -upgrade also updates ALL already-installed module sources to their latest available version, not just newly-added ones — another scope expansion beyond providers alone that the flag name does not make obvious.'
    }
  ];
}
