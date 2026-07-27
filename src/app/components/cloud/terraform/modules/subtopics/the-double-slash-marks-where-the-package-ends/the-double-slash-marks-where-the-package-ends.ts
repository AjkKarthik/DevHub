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
  templateUrl: './the-double-slash-marks-where-the-package-ends.html',
  styleUrl: './the-double-slash-marks-where-the-package-ends.scss'
})
export class TheDoubleSlashMarksWhereThePackageEndsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page uses the double slash in two examples and never explains it',
      points: [
        'The main page\'s Module Sources theory shows <code>git::https://github.com/org/repo.git//modules/vpc?ref=v3.0</code> and <code>github.com/org/repo//modules/vpc</code> — both containing a <code>//</code> in the middle. It reads naturally enough to skim past as a typo or a URL quirk, and the page never says what it does.',
      ]
    },
    {
      heading: 'It marks the boundary between the PACKAGE Terraform fetches and the SUBDIRECTORY inside it',
      points: [
        'Terraform treats a remote module source as two distinct parts: the package to retrieve (the whole Git repository, archive, or bucket object), and an optional path to a subdirectory WITHIN that package where the module actually lives. The <code>//</code> is the separator between those two parts.',
        'So in <code>git::https://github.com/org/repo.git//modules/vpc</code>, Terraform clones the entire <code>org/repo</code> repository, then uses the <code>modules/vpc</code> directory inside it as the module. Without the double slash, the whole string would be interpreted as the repository address itself — with the subdirectory path mistakenly treated as part of the URL.',
        'This is what makes a monorepo of modules practical: one repository holding <code>modules/vpc</code>, <code>modules/eks</code>, and <code>modules/rds</code> can serve all three via three source addresses that share a package and differ only after the <code>//</code>.',
      ]
    },
    {
      heading: 'Two ordering details worth getting right',
      points: [
        'When the source also carries arguments like <code>?ref=</code>, the subdirectory portion must come BEFORE them — <code>...repo.git//modules/vpc?ref=v1.2.0</code>, not <code>...repo.git?ref=v1.2.0//modules/vpc</code>. The query arguments belong to the package address as a whole, so they sit at the end.',
        'Because the whole package is fetched regardless of which subdirectory is used, a large monorepo is cloned in full even when only one small module inside it is needed — worth knowing when a repository is big enough for that to matter in CI timing, though it is rarely the deciding factor.',
        'The convention works identically across source types that have a package concept — HTTPS and SSH Git URLs, and other package-shaped sources — so the same mental model applies wherever <code>//</code> appears in a source address.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the two halves actually mean',
      language: 'bash',
      code: `module "vpc" {
  source = "git::https://github.com/org/repo.git//modules/vpc?ref=v3.0"
}
#           |_____________________________|  |________|  |_______|
#                    PACKAGE                 SUBDIRECTORY  ARGUMENTS
#           (the whole repo to clone)        (inside it)   (belong to
#                                                           the package)

# Terraform: clones org/repo, then uses modules/vpc inside it.

# Without the //, the entire string would be read as the
# repository address, with modules/vpc mistakenly treated as
# part of the URL itself:
module "vpc_broken" {
  source = "git::https://github.com/org/repo.git/modules/vpc"
  # single slash -- Terraform tries to fetch a repository at
  # ".../repo.git/modules/vpc", which is not a repo at all.
}`,
    },
    {
      label: 'A module monorepo, and the argument-ordering rule',
      language: 'bash',
      code: `# One repository, three modules -- same package, differing
# only after the //:
module "vpc" {
  source = "git::https://github.com/org/tf-modules.git//modules/vpc?ref=v2.1.0"
}
module "eks" {
  source = "git::https://github.com/org/tf-modules.git//modules/eks?ref=v2.1.0"
}
module "rds" {
  source = "git::https://github.com/org/tf-modules.git//modules/rds?ref=v2.1.0"
}

# ORDER MATTERS -- the subdirectory comes BEFORE the arguments:
# correct:
#   ...tf-modules.git//modules/vpc?ref=v2.1.0
# wrong:
#   ...tf-modules.git?ref=v2.1.0//modules/vpc

# The GitHub shorthand form works the same way (the main
# page's own second example):
module "vpc_shorthand" {
  source = "github.com/org/tf-modules//modules/vpc"
}

# Note: the WHOLE package is fetched regardless of which
# subdirectory is used -- a large monorepo is cloned in full
# even for one small module inside it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team keeps all their Terraform modules in one repository under a `modules/` directory. A developer writes `source = "git::https://github.com/org/tf-modules.git/modules/vpc?ref=v2.1.0"` (single slash) and terraform init fails to find the module. A colleague suggests moving the ref: `...tf-modules.git?ref=v2.1.0//modules/vpc`. Neither works. What do the two halves of a module source address actually represent, and what is the one correct form?',
    hint: 'Terraform fetches a package, then looks inside it. What separates "what to fetch" from "where to look inside what was fetched" — and where do query arguments belong relative to that?',
    solution: 'A remote module source has two distinct parts: the PACKAGE Terraform retrieves (here the whole `org/tf-modules` Git repository) and an optional SUBDIRECTORY within that package where the module actually lives (`modules/vpc`). The `//` is the separator between them. With a single slash, the entire string is read as the repository address, so Terraform tries to fetch a repo at `.../tf-modules.git/modules/vpc`, which does not exist. The colleague\'s version fails because query arguments like `?ref=` belong to the package address as a whole and must come last — the subdirectory portion goes BEFORE them. The one correct form is `source = "git::https://github.com/org/tf-modules.git//modules/vpc?ref=v2.1.0"`.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The double slash in a module source address is a typo, a URL-escaping artifact, or a stylistic convention with no functional meaning.',
      reality: 'Per this subtopic\'s theory, it is a functional separator marking where the package Terraform fetches ends and the subdirectory within that package begins — with a single slash instead, Terraform reads the whole string as the repository address and fails to find it.'
    },
    {
      thought: 'Because a source address specifies a subdirectory, Terraform fetches only that subdirectory rather than the whole repository.',
      reality: 'Per this subtopic\'s theory, the entire package is fetched regardless — a large monorepo is cloned in full even when only one small module inside it is used, which is worth knowing for CI timing on big repositories.'
    },
    {
      thought: 'Query arguments like ?ref= and the subdirectory path can appear in either order, since Terraform parses the whole address as one unit anyway.',
      reality: 'Per this subtopic\'s theory, the ordering is fixed: the subdirectory portion must come before the arguments, because query arguments belong to the package address as a whole and therefore sit at the end.'
    }
  ];
}
