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
  templateUrl: './target-pulls-in-dependencies-automatically-but-never-dependents.html',
  styleUrl: './target-pulls-in-dependencies-automatically-but-never-dependents.scss'
})
export class TargetPullsInDependenciesAutomaticallyButNeverDependentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats -target as "apply just this one resource," which understates its real scope',
      points: [
        'The main page\'s mistake block frames the problem with <code>-target</code> as: "Apply just one resource... state is out of sync with config → unpredictable future plans." True as a consequence, but the setup — "apply just one resource" — undersells how much <code>-target</code> can actually touch in a single run.',
      ]
    },
    {
      heading: 'The real scope: -target automatically walks UP the dependency graph and includes everything the target needs',
      points: [
        '<code>-target</code> does not apply ONLY the named resource — Terraform automatically includes every resource the target DEPENDS ON (both implicit references and explicit <code>depends_on</code> entries), walking up the dependency graph as far as needed to produce a valid plan. Targeting an EC2 instance that references a VPC and subnet that don\'t exist yet will create the VPC and subnet too, not just the instance — because applying the instance alone without them would be invalid.',
        'This means the actual blast radius of a single <code>-target</code> invocation is often much larger than "just this one resource," even though the CLI\'s framing (naming one address) suggests otherwise.',
      ]
    },
    {
      heading: 'What -target never includes: the target\'s DEPENDENTS — resources that depend ON it',
      points: [
        'The one direction <code>-target</code> deliberately does NOT walk is downstream — resources that reference or depend on the targeted resource are left completely untouched, even if the targeted change would logically require updating them too. This is the actual source of the main page\'s "state out of sync" warning: it isn\'t that -target touches too little in general, it\'s specifically that it never propagates to DEPENDENTS, leaving them stale until a full, untargeted apply catches up.',
        'Put together, this makes <code>-target</code>\'s real behavior "everything upstream that\'s needed, nothing downstream that might also need updating" — a genuinely asymmetric scope that "apply just one resource" doesn\'t capture at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: '-target pulls in upstream dependencies automatically',
      language: 'bash',
      code: `# main.tf
resource "aws_vpc" "main" { cidr_block = "10.0.0.0/16" }
resource "aws_subnet" "web" { vpc_id = aws_vpc.main.id; cidr_block = "10.0.1.0/24" }
resource "aws_instance" "app" { subnet_id = aws_subnet.web.id; ami = "ami-xyz" }

# Neither the VPC nor the subnet exist yet. Targeting ONLY the instance:
$ terraform apply -target=aws_instance.app

# Terraform will perform the following actions:
#   # aws_vpc.main will be created       <- pulled in automatically
#   # aws_subnet.web will be created     <- pulled in automatically
#   # aws_instance.app will be created   <- the one actually named
#
# "Just one resource" actually created THREE -- every upstream
# dependency the target needed was included automatically.`,
    },
    {
      label: '-target never touches downstream dependents',
      language: 'bash',
      code: `# Same config, but this time aws_vpc.main ALREADY EXISTS and its
# cidr_block is being changed -- and aws_security_group.app_sg
# (not shown above) references aws_vpc.main.id and needs its own
# rules recalculated as a result.

$ terraform apply -target=aws_vpc.main
# Terraform will perform the following actions:
#   # aws_vpc.main will be updated in-place
#
# aws_security_group.app_sg is NOT included in this plan at all --
# even though it depends on aws_vpc.main and its own configuration
# may now be inconsistent with the VPC's new state.

# The security group's own drift/inconsistency is invisible until
# a full, untargeted plan/apply runs later:
$ terraform plan
# NOW shows changes to aws_security_group.app_sg that -target
# left unaddressed in the prior run -- this delayed discovery is
# exactly the "unpredictable future plans" the main page warns about.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team believes -target=aws_vpc.main will touch "just the VPC" and nothing else, since that\'s the only address they named. In practice, running it both created two resources they didn\'t name (the VPC\'s dependencies) AND left a security group that depends on the VPC completely unaddressed. Explain both halves of this observation using how -target actually scopes its changes.',
    hint: 'Does -target walk the dependency graph in one direction only, or does it stay strictly limited to the named address either way?',
    solution: 'Both halves come from the same asymmetric rule: -target automatically walks UP the dependency graph, including every resource the target depends on (which is why unnamed upstream resources got created too — Terraform needed them to produce a valid plan for the named target), but it never walks DOWN to resources that depend ON the target. The security group referencing aws_vpc.main is a dependent, not a dependency, so -target intentionally leaves it out of scope entirely — even though a VPC change could mean the security group\'s own configuration is now inconsistent with reality. That inconsistency stays invisible until a full, untargeted plan or apply is run later, which is exactly the delayed-discovery problem the main page\'s "state out of sync with config" warning describes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'terraform apply -target=some_resource applies changes to exactly that one resource and nothing else, since that is the only address named on the command line.',
      reality: 'Per this subtopic\'s theory, -target automatically walks up the dependency graph and includes every resource the target depends on — the actual set of resources touched is often larger than just the one named address.'
    },
    {
      thought: 'Since -target pulls in a target\'s dependencies automatically to keep the plan valid, it must also pull in the target\'s dependents for the same reason — to keep everything consistent.',
      reality: 'Per this subtopic\'s theory, -target only ever walks UPSTREAM (dependencies) — it deliberately never includes DOWNSTREAM dependents, which is precisely why resources referencing the targeted one can be left silently out of sync until a later, full apply.'
    },
    {
      thought: 'If a -target apply doesn\'t show a dependent resource in its plan output, that means the dependent resource genuinely has no pending changes as a result of the targeted change.',
      reality: 'Per this subtopic\'s theory, a dependent resource\'s absence from a -target plan doesn\'t mean it has no pending changes — it means -target never even checked, since dependents are outside its scope entirely; a subsequent full plan can reveal changes that were invisible during the targeted run.'
    }
  ];
}
