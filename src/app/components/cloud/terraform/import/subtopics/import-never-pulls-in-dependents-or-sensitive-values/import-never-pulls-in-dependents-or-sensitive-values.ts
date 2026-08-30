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
  templateUrl: './import-never-pulls-in-dependents-or-sensitive-values.html',
  styleUrl: './import-never-pulls-in-dependents-or-sensitive-values.scss'
})
export class ImportNeverPullsInDependentsOrSensitiveValuesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "bulk import" advice focuses on process, not scope',
      points: [
        'The main page\'s theory says importing in bulk "benefits from careful planning — importing incrementally and verifying each terraform plan shows no unexpected changes." Good process advice — but it frames the risk as PACING, not SCOPE. It never states outright that importing one resource never automatically brings along anything it depends on, or any value the provider API will not hand back.',
      ]
    },
    {
      heading: 'Import operates on exactly one resource address — nothing connected to it comes along',
      points: [
        'Importing an EC2 instance does not import its security groups, its subnet, its IAM instance profile, or the VPC it lives in — every one of those is a SEPARATE resource requiring its own separate import (or its own separate <code>import</code> block, potentially part of the same bulk <code>for_each</code> import covered in the companion subtopic on this same topic).',
        'This means a realistic "bring legacy infrastructure under management" project is really many individual imports, not one — the main page\'s own incremental, plan-and-verify approach is the right process specifically because of this, though the page never explains WHY the process needs to be that careful in the first place.',
      ]
    },
    {
      heading: 'Sensitive values are not always readable back through the provider API at all',
      points: [
        'A resource\'s SENSITIVE attribute — a generated password, a private key, a secret token — is often something the cloud provider\'s own API never returns after initial creation, by design, for security reasons. Import reads whatever the provider API is willing to expose; if the value was never re-readable in the first place, import cannot pull it in no matter how the import is performed.',
        'The practical consequence: after importing a resource with such an attribute, the generated (or manually written) configuration typically needs that value supplied by hand — from wherever it was originally recorded (a secrets manager, a password vault) — rather than expecting <code>-generate-config-out</code> or the import process itself to populate it automatically.',
        'This is a distinct concern from the main page\'s own generated-config caution ("always review generated config carefully... it may expose secrets") — that warning is about values the API DOES return being written into a plaintext .tf file; this is about values the API never returns being silently ABSENT from the generated config at all, which is easy to miss precisely because nothing looks obviously wrong.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'One resource, several unimported dependents',
      language: 'bash',
      code: `# Importing the instance brings in ONLY the instance:
import {
  to = aws_instance.web
  id = "i-0abc123def456"
}
# Its security group, subnet, and IAM instance profile are
# NOT imported by this -- they remain unmanaged unless each
# is imported separately:

import {
  to = aws_security_group.web_sg
  id = "sg-0abc123def456"
}
import {
  to = aws_subnet.web_subnet
  id = "subnet-0abc123def456"
}
import {
  to = aws_iam_instance_profile.web_profile
  id = "web-instance-profile"
}
# A realistic "bring this EC2 instance under management"
# project is really FOUR separate imports, not one -- exactly
# why the main page's own "import incrementally, verify each
# plan" advice matters as much as it does.`,
    },
    {
      label: 'Sensitive values the API never returns',
      language: 'bash',
      code: `# Importing a resource with an attribute the provider API
# does not expose after creation, by design:
import {
  to = aws_db_instance.legacy_db
  id = "legacy-db-instance-id"
}

# terraform plan -generate-config-out=generated.tf
# The generated config includes engine, instance_class,
# allocated_storage, etc. -- but the master password is
# simply ABSENT from the output. Not blank, not a placeholder
# -- just missing, because the RDS API never returns it after
# initial creation. Nothing in the generated file flags this
# as a gap.

# Required manual step: supply it from wherever it was
# originally recorded (secrets manager, password vault):
resource "aws_db_instance" "legacy_db" {
  # ...generated attributes...
  password = var.legacy_db_password   # from a secrets source,
                                        # NOT from import itself
}

# Distinct from the main page's own generated-config warning:
# that one is about REAL values the API DOES return ending up
# in a plaintext .tf file -- this is about values the API never
# returns being silently absent, which looks like nothing is
# wrong at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team imports an existing RDS database instance using an import block, then runs `terraform plan -generate-config-out=generated.tf`, following the main page\'s own generated-config workflow exactly. The generated file looks complete and terraform plan shows no unexpected changes. When they later try to reference the database\'s password in another resource, they discover it was never actually captured anywhere. Why did the generated config look complete with nothing flagging this gap, and what does the team need to do to close it?',
    hint: 'Does the provider API always return every attribute a resource has, including ones set at creation time for security reasons?',
    solution: 'Certain sensitive attributes — like an RDS instance\'s master password — are often never returned by the provider API after the resource is first created, by design, for security reasons. Import (and the config generation built on top of it) can only read back whatever the provider API is willing to expose; a value the API never returns is simply absent from the generated configuration, with nothing in the file or the plan output flagging it as a gap, since the plan genuinely has nothing to diff against for an attribute Terraform never learned about at all. The team needs to supply that value by hand — from wherever it was originally recorded (a secrets manager, a password vault, or wherever it was set when the database was first created) — added directly into the configuration (typically via a variable) rather than expecting the import or generate-config process to have captured it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Importing a resource like an EC2 instance automatically brings its directly related resources (security groups, subnets, IAM roles) under management too, since they are all part of "the same infrastructure."',
      reality: 'Per this subtopic\'s theory, import operates on exactly one resource address — every related resource needs its own separate import, which is exactly why a realistic legacy-infrastructure project is many individual imports rather than one.'
    },
    {
      thought: 'If a generated configuration from -generate-config-out looks complete and terraform plan shows no unexpected changes, every attribute of the imported resource has been correctly captured.',
      reality: 'Per this subtopic\'s theory, an attribute the provider API never returns (like certain sensitive values) is simply absent from the generated config with nothing flagging the gap — a clean plan does not guarantee every real attribute was captured, only that everything the API exposed matches.'
    },
    {
      thought: 'The main page\'s own generated-config caution ("it may expose secrets") already covers the sensitive-value risk in import completely.',
      reality: 'Per this subtopic\'s theory, that warning is about a DIFFERENT risk — values the API DOES return ending up written in plaintext — while this is the opposite case: values the API never returns at all, silently missing rather than exposed.'
    }
  ];
}
