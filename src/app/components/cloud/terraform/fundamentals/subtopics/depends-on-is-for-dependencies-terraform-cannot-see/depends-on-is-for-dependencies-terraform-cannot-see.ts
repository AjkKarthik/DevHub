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
  templateUrl: './depends-on-is-for-dependencies-terraform-cannot-see.html',
  styleUrl: './depends-on-is-for-dependencies-terraform-cannot-see.scss'
})
export class DependsOnIsForDependenciesTerraformCannotSeeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the rule in one line, without showing a case where it actually applies',
      points: [
        'The main page\'s Resource Addressing section says: "Implicit dependencies are created automatically from attribute references. Use depends_on for explicit dependencies when Terraform cannot detect them automatically" — true, but every example on the main page uses an attribute reference (like <code>aws_instance.web.public_ip</code>), so the "cannot detect them automatically" case is never actually demonstrated.',
      ]
    },
    {
      heading: 'Terraform\'s dependency graph is built entirely from attribute references — nothing else',
      points: [
        'When one resource block references another resource\'s attribute (<code>aws_eip.ip.instance = aws_instance.web.id</code>, matching the main page\'s own example), Terraform can see that reference in the configuration and automatically orders provisioning so the referenced resource is created first.',
        'This detection is purely syntactic — it only sees references that literally appear in the HCL. It has no way to know about a dependency that exists at runtime but leaves no trace in any attribute a later resource actually reads.',
      ]
    },
    {
      heading: 'A concrete case where the graph is blind: IAM permission propagation',
      points: [
        'A classic case: an EC2 instance whose boot-time user-data script calls the AWS API (to read from S3, for example) needs the attached IAM role\'s permissions to already exist and have propagated — but if nothing in the <code>aws_instance</code> block actually references an attribute of the <code>aws_iam_role_policy</code> resource, Terraform has no way to know the instance depends on that policy being in place first.',
        'Without an explicit hint, Terraform may create the EC2 instance and the IAM policy attachment in parallel (or in the wrong order) — the instance boots, its user-data script runs and calls the API before the IAM permissions have finished propagating, and the boot-time API call fails intermittently, in a way that looks unrelated to Terraform at all.',
        '<code>depends_on = [aws_iam_role_policy.instance_policy]</code> added to the <code>aws_instance</code> block makes this invisible runtime dependency explicit, forcing Terraform to provision the policy first even though no attribute of it is ever read.',
      ]
    },
    {
      heading: 'depends_on is a fallback, not a default — prefer a reference when one exists',
      points: [
        'If a genuine attribute reference is available, using it instead of <code>depends_on</code> is preferred: a reference both establishes the ordering AND makes the actual data relationship visible in the configuration, while <code>depends_on</code> only establishes ordering with no data connection.',
        'A resource block should not combine an attribute reference to something with a redundant <code>depends_on</code> pointing at that same resource — the reference already creates the dependency; adding <code>depends_on</code> on top adds noise without adding information.',
        'Because <code>depends_on</code> carries no explanation on its own, leaving a comment stating WHY the explicit dependency is needed (the specific invisible runtime relationship) is worth doing every time — otherwise a future reader (or a future you) has no way to know the dependency is intentional rather than leftover cruft.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The invisible dependency, and the intermittent failure it causes',
      language: 'bash',
      code: `resource "aws_iam_role" "ec2_role" {
  name               = "ec2-s3-reader"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy" "s3_read" {
  role   = aws_iam_role.ec2_role.id
  policy = data.aws_iam_policy_document.s3_read.json
}

resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  # user_data calls the S3 API on boot -- but nothing here
  # references an attribute of aws_iam_role_policy.s3_read,
  # so Terraform's graph has NO idea this instance depends on
  # that policy actually being attached and propagated first.
  user_data = <<-EOF
    #!/bin/bash
    aws s3 cp s3://config-bucket/app.conf /etc/app.conf
  EOF
}
# Result: intermittent boot-time failures when the instance
# is created before (or at the same time as) the IAM policy,
# or before IAM's eventual-consistency propagation finishes.`,
    },
    {
      label: 'The fix: an explicit, commented depends_on',
      language: 'bash',
      code: `resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
    #!/bin/bash
    aws s3 cp s3://config-bucket/app.conf /etc/app.conf
  EOF

  # Explicit dependency: user_data calls S3 on boot and needs
  # this policy attached (and propagated) first. No attribute
  # of aws_iam_role_policy.s3_read is referenced above, so
  # Terraform's automatic graph can't see this on its own.
  depends_on = [aws_iam_role_policy.s3_read]
}

# Redundant depends_on -- avoid this. The reference to
# aws_s3_bucket.data.id already establishes the dependency;
# adding depends_on on top of it adds nothing.
resource "aws_s3_bucket_policy" "data" {
  bucket     = aws_s3_bucket.data.id   # <- already a real dependency
  policy     = data.aws_iam_policy_document.data.json
  depends_on = [aws_s3_bucket.data]    # <- redundant, remove
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A user_data script on an aws_instance calls the S3 API to download a config file at boot. The instance has an aws_iam_instance_profile attached, and a separate aws_iam_role_policy resource grants the needed S3 permissions to that role. Deployments succeed most of the time, but occasionally the instance\'s boot log shows an S3 "access denied" error that resolves itself if you just re-run the boot script manually a minute later. Nothing in the instance block references an attribute of the role-policy resource. What is happening, and what one meta-argument fixes it?',
    hint: 'Ask whether Terraform\'s dependency graph — built purely from attribute references in the HCL — has any way to know about a relationship that only exists at boot-time, inside a script it never parses.',
    solution: 'Terraform\'s dependency graph is built entirely from attribute references it can see in the configuration — since the aws_instance block never reads any attribute of the aws_iam_role_policy resource, Terraform has no way to know the instance depends on that policy being attached (and propagated) first. Without that ordering guarantee, the instance and the policy attachment can be created in parallel, or the instance can boot and run its user-data script before IAM\'s permissions have finished propagating — producing the intermittent "access denied" that resolves on a manual retry once propagation catches up. The fix is adding `depends_on = [aws_iam_role_policy.s3_read]` to the aws_instance block, along with a comment explaining why — this forces Terraform to provision the policy first even though no attribute of it is ever referenced, making the invisible runtime dependency explicit.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Terraform\'s automatic dependency detection understands the actual runtime behavior of resources — it knows an EC2 instance running a boot script needs IAM permissions to be ready first.',
      reality: 'Per this subtopic\'s theory, Terraform\'s dependency graph is purely syntactic — it only sees attribute references that literally appear in the HCL configuration. It has no awareness of what a user-data script does at runtime or what permissions it needs.'
    },
    {
      thought: 'Adding depends_on is always safe extra insurance, so it is fine to add it defensively even when a resource already references the thing it depends on.',
      reality: 'Per this subtopic\'s theory, depends_on is a fallback for dependencies Terraform genuinely cannot see — adding it redundantly alongside an existing attribute reference adds noise without adding information, since the reference already establishes the same ordering.'
    },
    {
      thought: 'depends_on is mainly a niche feature for advanced provisioner scripts, not something that comes up in ordinary resource configuration.',
      reality: 'Per this subtopic\'s theory, depends_on is needed any time a real dependency exists outside of what attribute references can express — IAM propagation delays being one common, ordinary example, not an edge case limited to provisioners.'
    }
  ];
}
