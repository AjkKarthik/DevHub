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
  templateUrl: './destroy-runs-in-reverse-order-a-referenced-runs-state-is-already-gone.html',
  styleUrl: './destroy-runs-in-reverse-order-a-referenced-runs-state-is-already-gone.scss'
})
export class DestroyRunsInReverseOrderAReferencedRunsStateIsAlreadyGoneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states cleanup happens, without saying in what order or how dependent run blocks are handled',
      points: [
        'The QnA on the main page says: "terraform test automatically destroys all resources created by apply runs in .tftest.hcl files after all run blocks complete. If a test fails mid-run, it still attempts cleanup." True as a summary — but for a test file with multiple run blocks that depend on each other (via a <code>run.NAME.output</code> reference), the ORDER cleanup happens in, and what that means for each individual run block, is left unstated.',
      ]
    },
    {
      heading: 'The actual order: reverse of the run blocks\' own creation order',
      points: [
        'Terraform destroys resources in REVERSE run block order — the LAST run block to apply is the FIRST one destroyed, working backward. This mirrors ordinary Terraform dependency-respecting destroy behavior (destroy dependents before their dependencies) but applied at the granularity of whole run blocks rather than individual resources within one configuration.',
      ]
    },
    {
      heading: 'The nuance: an earlier run block whose output a later one used shows as doing nothing during ITS OWN destroy step',
      points: [
        'When a later run block references an earlier one via <code>run.NAME.output</code>, both run blocks end up sharing (or depending on) the same underlying state. Because destroy proceeds in reverse order, the LATER run block\'s own destroy step is what actually tears down the resources both blocks are tied to — by the time the EARLIER run block\'s own destroy step executes, there is nothing left for it to do, since its state was already destroyed as part of the later block\'s cleanup.',
        'This is not a bug or a silently-skipped step — it is the correct, expected behavior of respecting the dependency the <code>run.NAME.output</code> reference created — but watching <code>terraform test -verbose</code> output, an earlier run block showing zero resources destroyed during its own cleanup phase can look alarming if this mechanic isn\'t known in advance.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two dependent run blocks',
      language: 'bash',
      code: `# tests/vpc_and_subnet.tftest.hcl

run "create_vpc" {
  command = apply
  variables { cidr_block = "10.0.0.0/16" }
}

run "create_subnet" {
  command = apply
  variables {
    vpc_id     = run.create_vpc.vpc_id   # dependency: waits for create_vpc
    cidr_block = "10.0.1.0/24"
  }
}

# Apply order:  create_vpc, then create_subnet.
# Destroy order (REVERSE): create_subnet is destroyed FIRST,
# then create_vpc's destroy step runs -- but by then, create_vpc's
# own resources may already be gone as part of tearing down the
# shared/dependent state create_subnet relied on.`,
    },
    {
      label: 'terraform test -verbose output (illustrative)',
      language: 'bash',
      code: `$ terraform test -verbose

run "create_vpc"... pass
run "create_subnet"... pass

# --- cleanup phase, reverse order ---
create_subnet: Destroying...  aws_subnet.this: Destruction complete
create_subnet: state cleanup complete

create_vpc: Destroying...
# Nothing listed here -- create_vpc's own state was already
# destroyed as part of create_subnet's cleanup step above,
# because create_subnet's resources depended on create_vpc's.
create_vpc: state cleanup complete (nothing to destroy)

# This is CORRECT, expected output -- not a sign that create_vpc's
# resources were leaked or silently skipped.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test file has run "setup_network" (creates a VPC) followed by run "test_instance" (creates an EC2 instance inside that VPC, referencing run.setup_network.vpc_id). After the test finishes, terraform test -verbose shows test_instance destroying real resources, but setup_network\'s own destroy step shows nothing being destroyed. Is this a resource leak, and why or why not?',
    hint: 'Destroy runs in the REVERSE of the run blocks\' apply order. Which run block\'s destroy step actually tears down the shared/dependent state?',
    solution: 'This is not a leak — it is the expected, correct behavior of reverse-order destroy. Since test_instance depends on setup_network (via the run.setup_network.vpc_id reference), and destroy proceeds in reverse of the apply order, test_instance is destroyed first — and because its resources were tied to the same state setup_network created, that destroy step is what actually tears down everything, including setup_network\'s own VPC. By the time setup_network\'s own destroy step runs, there is nothing left to destroy, so it correctly shows zero resources destroyed rather than performing a redundant (and likely failing, since the resources are already gone) second destroy attempt.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'terraform test destroys each run block\'s resources independently and separately, in the same order the run blocks originally applied.',
      reality: 'Per this subtopic\'s theory, cleanup happens in REVERSE run block order — the last run block to apply is destroyed first, mirroring how Terraform respects dependencies when tearing down resources.'
    },
    {
      thought: 'If terraform test -verbose shows an earlier run block\'s own destroy step doing nothing, that means its resources were silently left behind (a leak) rather than being cleaned up.',
      reality: 'Per this subtopic\'s theory, when a later run block depends on an earlier one via run.NAME.output, the LATER block\'s own destroy step is what tears down the shared/dependent state — the earlier block\'s destroy step correctly shows nothing to do, since its resources are already gone by that point.'
    },
    {
      thought: 'The main page\'s "terraform test automatically destroys all resources... after all run blocks complete" description means destruction happens all at once, in a single unordered batch, once the whole test file finishes.',
      reality: 'Per this subtopic\'s theory, destruction happens in a specific, deliberate REVERSE order relative to how the run blocks applied — not as one unordered batch — precisely so that a later run block\'s resources (which may depend on an earlier one\'s) are torn down before the resources they depend on.'
    }
  ];
}
