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
  templateUrl: './mock-resource-values-apply-to-every-instance-not-per-instance.html',
  styleUrl: './mock-resource-values-apply-to-every-instance-not-per-instance.scss'
})
export class MockResourceValuesApplyToEveryInstanceNotPerInstanceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own phrasing can be read as more granular than mock_resource actually is',
      points: [
        'The main page\'s quick reference describes <code>mock_resource {}</code> as: "overrides what a specific resource returns — e.g. fake VPC id, fake subnet ids." Read casually, "a specific resource" sounds like it could mean one particular resource INSTANCE — but that is not what a mock_resource block actually controls.',
      ]
    },
    {
      heading: 'What mock_resource actually scopes: an entire resource TYPE, applied identically to every instance',
      points: [
        'A <code>mock_resource</code> block\'s <code>defaults</code> apply to EVERY instance of that resource type created anywhere in the module under test — if the module uses <code>for_each</code> or <code>count</code> to create several <code>aws_subnet</code> resources, every single one of them receives the exact same mocked <code>id</code> and <code>availability_zone</code> values from one shared <code>defaults</code> block. There is no way to specify different mocked values for different instances within a <code>mock_resource</code> block itself.',
        'This matters immediately for any assertion that expects instances to be DISTINGUISHABLE from each other — e.g. asserting that two subnets end up in different availability zones, or that a list of generated IDs contains no duplicates — since a plain mock_resource block will make every instance identical, which can make such an assertion trivially fail (or worse, trivially and misleadingly pass) regardless of what the module\'s actual logic does.',
      ]
    },
    {
      heading: 'The tool for the per-instance case: override_resource, not mock_resource',
      points: [
        '<code>override_resource</code> (and the corresponding <code>override_data</code>/<code>override_module</code>) blocks are the mechanism for substituting a value on a SPECIFIC resource instance rather than an entire type — they work with either a real provider or a mocked one, and Terraform never calls the underlying provider for the overridden instance specifically.',
        'The practical rule this produces: reach for <code>mock_provider</code>/<code>mock_resource</code> when the goal is "no real API calls, uniform fake data is fine" (typical for testing conditional logic or basic wiring), and reach for <code>override_resource</code> specifically when a test needs two or more instances of the same resource type to carry genuinely different values.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'mock_resource: every instance gets the SAME values',
      language: 'bash',
      code: `# tests/subnets_mocked.tftest.hcl
mock_provider "aws" {
  mock_resource "aws_subnet" {
    defaults = {
      id                = "subnet-mock-generic"
      availability_zone = "us-east-1a"
    }
  }
}

run "creates_three_subnets" {
  command = apply
  variables {
    subnet_count = 3   # module creates 3 aws_subnet resources via count/for_each
  }

  # This assertion FAILS -- not because the module's logic is wrong,
  # but because mock_resource gave all 3 subnets the IDENTICAL id and
  # availability_zone. A mocked test can't distinguish instances at all.
  assert {
    condition     = length(distinct(output.subnet_azs)) == 3
    error_message = "Expected 3 distinct AZs, but mock_resource returns the same AZ for every instance"
  }
}`,
    },
    {
      label: 'override_resource: distinct values per instance',
      language: 'bash',
      code: `# tests/subnets_overridden.tftest.hcl
run "creates_three_subnets" {
  command = apply
  variables {
    subnet_count = 3
  }

  # Target each instance by its own resource address (including its
  # count/for_each index) -- override_resource replaces exactly that
  # instance's values, real provider is never called for it:
  override_resource {
    target = aws_subnet.this[0]
    values = { id = "subnet-a", availability_zone = "us-east-1a" }
  }
  override_resource {
    target = aws_subnet.this[1]
    values = { id = "subnet-b", availability_zone = "us-east-1b" }
  }
  override_resource {
    target = aws_subnet.this[2]
    values = { id = "subnet-c", availability_zone = "us-east-1c" }
  }

  assert {
    condition     = length(distinct(output.subnet_azs)) == 3
    error_message = "Expected 3 distinct AZs"
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A module creates 4 aws_instance resources via for_each. A test uses mock_provider with a mock_resource "aws_instance" block to avoid real AWS calls, then asserts that all 4 instances\' public_ip outputs are distinct from each other. Will this assertion pass or fail, and why?',
    hint: 'Does a mock_resource block\'s defaults apply per-instance, or to the whole resource type at once?',
    solution: 'The assertion will fail. A mock_resource block\'s defaults apply to every instance of that resource type uniformly — all 4 aws_instance resources created by the for_each will receive the exact same mocked public_ip value from the one shared defaults block, since mocks have no concept of per-instance values. The assertion expecting 4 distinct IPs is really testing something mock_resource cannot produce at all. To get genuinely distinct values per instance, each of the 4 specific resource instances (aws_instance.this["a"], aws_instance.this["b"], etc.) would need its own override_resource block targeting that exact instance address with its own values — mock_resource and override_resource solve different problems (type-wide fake data vs. instance-specific substitution).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s description of mock_resource as overriding "what a specific resource returns" means each resource instance created by a for_each or count can be mocked with its own distinct values.',
      reality: 'Per this subtopic\'s theory, a mock_resource block\'s defaults apply to every instance of that resource TYPE uniformly — there is no per-instance mocking mechanism within mock_resource itself; override_resource is the tool for genuinely distinct per-instance values.'
    },
    {
      thought: 'Since mock_provider avoids real API calls entirely, any assertion that would normally depend on real provider-computed values (like unique generated IDs) works the same way under a mock as it would against real infrastructure.',
      reality: 'Per this subtopic\'s theory, mocked values are static and identical across every instance of a type — an assertion checking that multiple instances have distinct provider-computed values will behave completely differently (and likely fail) under a mock than it would against real infrastructure, unless override_resource is used instead.'
    },
    {
      thought: 'override_resource and mock_resource are interchangeable ways to fake a resource\'s values, so either one works for any test scenario needing fake data.',
      reality: 'Per this subtopic\'s theory, mock_resource sets one shared set of defaults for an entire resource type (good for "any fake data is fine" scenarios), while override_resource targets one specific resource instance by its exact address (needed whenever a test requires different instances to carry different values).'
    }
  ];
}
