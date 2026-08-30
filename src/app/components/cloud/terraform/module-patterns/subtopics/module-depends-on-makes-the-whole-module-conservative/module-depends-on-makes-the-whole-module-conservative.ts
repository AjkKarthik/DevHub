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
  templateUrl: './module-depends-on-makes-the-whole-module-conservative.html',
  styleUrl: './module-depends-on-makes-the-whole-module-conservative.scss'
})
export class ModuleDependsOnMakesTheWholeModuleConservativeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Resources topic mentions module-level depends_on as a one-line capability',
      points: [
        'The main Resources topic\'s own depends_on codeTab ends with: "Module-level depends_on — <code>module "compute" { source = "./modules/compute"; depends_on = [module.network] }</code> — wait for entire network module." Accurate, and it reads as a natural scaling-up of resource-level <code>depends_on</code>. What neither that topic nor this one covers is that the module-level form has a distinctly larger and less obvious cost.',
      ]
    },
    {
      heading: 'depends_on forces Terraform into a more conservative plan — and a module multiplies that',
      points: [
        'Any <code>depends_on</code> tells Terraform that something may be affected by an upstream object in ways it cannot see through references. Terraform responds by planning conservatively: values that would normally be resolved during plan get deferred, showing as "(known after apply)" instead.',
        'On a single resource, that conservatism is contained. On a MODULE, it applies to everything the module contains — every resource, every data source, every output. HashiCorp\'s own documentation calls out module <code>depends_on</code> specifically as the case most likely to produce large swaths of unknown values.',
        'The sharpest sub-case is data sources inside the module. Normally a data source resolves during plan; under a module-level <code>depends_on</code> whose target has pending changes, Terraform cannot be sure the dependency will not affect the query result, so it defers reading that data source to APPLY time — which cascades, since anything computed from it becomes unknown at plan time too.',
      ]
    },
    {
      heading: 'Why this matters beyond noisy plan output, and the preferred alternative',
      points: [
        'A plan full of "(known after apply)" is not merely ugly — it is less reviewable. The whole value of examining a plan before applying is seeing concretely what will change; a conservative plan hides exactly that detail, and in the worst case can lead to more replacement than a precise plan would have shown.',
        'The preferred alternative is the same one the main Resources topic already advocates in its "Overusing depends_on" mistake entry: express the dependency through an actual reference wherever one exists. Passing <code>module.network.vpc_id</code> into the compute module as an input creates a genuine, precise dependency edge — Terraform then knows exactly what depends on what, rather than being told "assume everything might."',
        'Module-level <code>depends_on</code> remains legitimately necessary for true side-effect dependencies with nothing to reference (the IAM-propagation shape covered in the Fundamentals topic\'s own depends_on subtopic) — the point is that it should be a considered last resort with a comment explaining why, not the default way to sequence two modules that could simply pass a value between them.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The blunt version, and what it costs',
      language: 'bash',
      code: `module "network" {
  source = "./modules/network"
}

module "compute" {
  source     = "./modules/compute"
  depends_on = [module.network]    # blunt: "wait for all of it"
}

# Terraform now plans compute conservatively -- it cannot see
# WHAT in network might affect WHAT in compute, so it assumes
# anything might:
#
#   # module.compute.aws_instance.app will be created
#   + subnet_id  = (known after apply)
#   + ami        = (known after apply)   <- from a data source
#                                            inside the module
#   + vpc_sg_ids = (known after apply)
#
# Data sources inside the module that would normally resolve
# at plan time are deferred to APPLY, and everything computed
# from them becomes unknown too.`,
    },
    {
      label: 'The precise version: depend through a reference',
      language: 'bash',
      code: `module "network" {
  source = "./modules/network"
}

module "compute" {
  source = "./modules/compute"

  # A real reference -- Terraform now knows EXACTLY what
  # compute depends on, and can resolve everything else
  # normally at plan time:
  vpc_id     = module.network.vpc_id
  subnet_ids = module.network.private_subnet_ids
}

# The plan stays concrete and reviewable:
#   # module.compute.aws_instance.app will be created
#   + subnet_id  = "subnet-0abc123"
#   + ami        = "ami-0c02fb55956c7d316"

# --- When module depends_on IS still warranted ---
module "app" {
  source = "./modules/app"

  # The app's boot script calls an API that needs these IAM
  # policies attached first. Nothing in app's inputs references
  # the iam module, so there is no reference to depend through.
  depends_on = [module.iam]
}
# Legitimate -- a genuine side-effect dependency, commented
# so a future reader knows it is deliberate rather than a
# leftover sequencing hack.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds `depends_on = [module.network]` to their compute module to guarantee ordering, following the module-level depends_on pattern shown in the Resources topic. Ordering is now correct, but their plans have become much harder to review — large sections that previously showed concrete values now read "(known after apply)", including an AMI ID that comes from a data source inside the compute module. Why does a module-level depends_on cause this specifically, and what change would restore a precise plan while keeping the ordering guarantee?',
    hint: 'What does depends_on tell Terraform about what it can and cannot predict — and how does that scope differ between one resource and an entire module full of them?',
    solution: 'depends_on tells Terraform that something may be affected by an upstream object in ways it cannot see through references, so Terraform plans conservatively and defers values it would otherwise resolve. On a module, that conservatism applies to everything inside — every resource, data source, and output — which is why HashiCorp specifically calls out module depends_on as the case most likely to produce large swaths of unknown values. The AMI is the sharpest example: a data source inside the module would normally resolve at plan time, but since the depends_on target has pending changes Terraform cannot be sure the dependency will not affect the query result, so it defers reading it to apply time and everything computed from it becomes unknown too. The fix is expressing the dependency through an actual reference — passing `module.network.vpc_id` and `module.network.private_subnet_ids` as inputs to the compute module. That creates a genuine, precise dependency edge that guarantees the same ordering while letting Terraform resolve everything else normally, keeping the plan concrete and reviewable.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Module-level depends_on is simply resource-level depends_on applied at a larger scope, with the same modest cost.',
      reality: 'Per this subtopic\'s theory, the conservatism depends_on introduces applies to everything the module contains — HashiCorp specifically identifies module depends_on as the case most likely to produce large swaths of "(known after apply)" values.'
    },
    {
      thought: 'A plan showing many "(known after apply)" values is a cosmetic annoyance with no real consequence, since apply will resolve them correctly anyway.',
      reality: 'Per this subtopic\'s theory, it undermines the main purpose of reviewing a plan — seeing concretely what will change — and in the worst case a conservative plan can lead to more replacement than a precise plan would have shown.'
    },
    {
      thought: 'Passing outputs between modules and adding depends_on between them are two equivalent ways to express the same ordering, so using both is harmlessly thorough.',
      reality: 'Per this subtopic\'s theory, a reference creates a precise dependency edge Terraform can reason about, while depends_on tells it to assume anything might be affected — adding depends_on on top of an existing reference gains no ordering and forfeits plan precision.'
    }
  ];
}
