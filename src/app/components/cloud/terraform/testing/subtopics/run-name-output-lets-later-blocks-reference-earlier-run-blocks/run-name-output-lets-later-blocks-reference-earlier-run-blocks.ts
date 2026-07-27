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
  templateUrl: './run-name-output-lets-later-blocks-reference-earlier-run-blocks.html',
  styleUrl: './run-name-output-lets-later-blocks-reference-earlier-run-blocks.scss'
})
export class RunNameOutputLetsLaterBlocksReferenceEarlierRunBlocksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states state carries forward between run blocks, without showing the syntax that makes it usable',
      points: [
        'The main page\'s theory says: "Multiple run blocks execute sequentially — state from a previous apply run carries into the next." True, but it never shows how a LATER run block actually reads a value the earlier one produced — the sentence describes the state effect, not the reference mechanism a test author would actually type.',
      ]
    },
    {
      heading: 'The actual mechanism: run.NAME.OUTPUT, referencing a previous run block by its own label',
      points: [
        'A run block can reference an output from any earlier run block in the same test file using <code>run.&lt;run_block_name&gt;.&lt;output_name&gt;</code> — for example, a run block named <code>create_vpc</code> exposing an output <code>vpc_id</code> is read in a later block as <code>run.create_vpc.vpc_id</code>, usable anywhere a variable value is needed (including inside that later block\'s own <code>variables</code> block or directly inside an <code>assert</code> condition).',
        'This is what actually lets a multi-stage test build on itself — a "setup" run block creating a VPC, followed by a "creates_subnet" run block that needs that VPC\'s real id as an input, without hardcoding or re-deriving it.',
      ]
    },
    {
      heading: 'The constraint this reference creates: dependent run blocks cannot execute in parallel',
      points: [
        'Terraform can run independent run blocks in parallel to speed up a test file — but only when they do not reference each other\'s outputs and do not share a state file. The moment one run block uses <code>run.other_block.output</code>, Terraform must wait for <code>other_block</code> to finish (and produce that output) before starting — the reference itself is what forces sequential execution between those two blocks specifically, not a blanket rule about the whole file.',
        'This means a test file\'s run blocks are not uniformly parallel OR uniformly sequential — the actual execution order/concurrency is determined by which blocks reference which other blocks\' outputs, something the main page\'s flat "execute sequentially" description doesn\'t capture.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Referencing an earlier run block\'s output',
      language: 'bash',
      code: `# tests/vpc_and_subnet.tftest.hcl

run "create_vpc" {
  command = apply
  variables {
    cidr_block = "10.0.0.0/16"
  }
  assert {
    condition     = output.vpc_id != ""
    error_message = "VPC ID should be non-empty after apply"
  }
}

run "creates_subnet" {
  command = apply
  variables {
    # Reads the earlier run block's OWN output by its run-block name --
    # not a hardcoded value, not re-querying the provider:
    vpc_id     = run.create_vpc.vpc_id
    cidr_block = "10.0.1.0/24"
  }
  assert {
    condition     = output.subnet_vpc_id == run.create_vpc.vpc_id
    error_message = "Subnet should belong to the VPC created in the previous run block"
  }
}

# "creates_subnet" cannot start until "create_vpc" has produced vpc_id --
# Terraform will NOT run these two run blocks in parallel, because of
# the run.create_vpc.vpc_id reference.`,
    },
    {
      label: 'Independent run blocks CAN run in parallel',
      language: 'bash',
      code: `# tests/independent.tftest.hcl

run "test_east_region" {
  command = plan
  variables {
    region = "us-east-1"
  }
  assert {
    condition     = var.region == "us-east-1"
    error_message = "Expected us-east-1"
  }
}

run "test_west_region" {
  command = plan
  variables {
    region = "us-west-2"
  }
  assert {
    condition     = var.region == "us-west-2"
    error_message = "Expected us-west-2"
  }
}

# Neither run block references the other's outputs, and neither
# shares a state_key with the other -- Terraform is free to execute
# these two concurrently, unlike the create_vpc / creates_subnet
# pair above.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test file has a run block named "provision_db" that outputs db_endpoint, and a later run block named "test_connection" that needs to assert a connection string contains that exact endpoint value. What expression does "test_connection" use to read it, and why can\'t Terraform run these two run blocks in parallel to speed up the test?',
    hint: 'The syntax follows run.<the other block\'s own name>.<its output name>. Does using that reference create a dependency Terraform has to respect?',
    solution: 'The expression is run.provision_db.db_endpoint, referencing the earlier run block by its own label ("provision_db") and reading its declared output ("db_endpoint") — usable directly inside test_connection\'s variables block or an assert condition. Terraform cannot run these two run blocks in parallel because test_connection\'s reference to run.provision_db.db_endpoint creates an explicit dependency: the value literally does not exist until provision_db has finished applying and produced that output, so test_connection must wait. Terraform only parallelizes run blocks that reference no other block\'s outputs and share no state file — the reference itself is what forces the sequencing here, not a blanket "everything runs in order" rule.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s "state from a previous apply run carries into the next" description means every later run block automatically sees everything an earlier one created, with no explicit syntax needed to use a specific value.',
      reality: 'Per this subtopic\'s theory, using a value from an earlier run block requires an explicit run.<name>.<output> reference — the state carrying forward means the resources still EXIST, but reading a specific value into a later run block\'s variables or assertions needs this specific syntax.'
    },
    {
      thought: 'Since the main page says run blocks "execute sequentially," every run block in a test file always waits for every earlier one to finish before starting, with no exceptions.',
      reality: 'Per this subtopic\'s theory, Terraform runs independent run blocks (ones that reference no other block\'s outputs and share no state file) in parallel — only run blocks connected by an explicit run.<name>.<output> reference are forced to run in sequence relative to each other.'
    },
    {
      thought: 'A run.<name>.<output> reference works the same as referencing a Terraform module\'s output — it is resolved at plan time from static configuration, with no runtime dependency implied.',
      reality: 'Per this subtopic\'s theory, a run.<name>.<output> reference is a genuine execution-order dependency: the referenced run block must actually complete its apply and produce that output before the referencing run block can start, which is exactly why Terraform cannot parallelize the two.'
    }
  ];
}
