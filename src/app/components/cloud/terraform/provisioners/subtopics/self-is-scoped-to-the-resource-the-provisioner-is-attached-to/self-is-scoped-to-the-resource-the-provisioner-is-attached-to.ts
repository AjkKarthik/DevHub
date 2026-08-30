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
  templateUrl: './self-is-scoped-to-the-resource-the-provisioner-is-attached-to.html',
  styleUrl: './self-is-scoped-to-the-resource-the-provisioner-is-attached-to.scss'
})
export class SelfIsScopedToTheResourceTheProvisionerIsAttachedToSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own two examples quietly use two different reference styles, without ever explaining why',
      points: [
        'The main page\'s local-exec codeTab uses <code>self.public_ip</code> and <code>self.id</code> inside provisioners attached directly to <code>aws_instance.web</code>. Its very next example, a <code>null_resource</code> notifying Slack, uses <code>aws_instance.web.id</code> — the full resource reference, not <code>self.id</code> — with no comment marking the switch as deliberate rather than inconsistent style.',
      ]
    },
    {
      heading: '<code>self</code> refers to the resource the provisioner block is physically attached to — nothing else',
      points: [
        '<code>self</code> is a special expression valid only inside a <code>provisioner</code> or <code>connection</code> block, and it always resolves to attributes of the SPECIFIC resource that provisioner block is nested inside — never to some other resource, however closely related.',
        'This is exactly why the main page\'s two examples differ: the provisioners inside <code>aws_instance.web</code> can use <code>self.public_ip</code> because they are attached to that instance directly. The <code>null_resource.notify_slack</code>\'s own provisioner is attached to the null_resource itself, not to <code>aws_instance.web</code> — so <code>self</code> there would resolve to the null_resource\'s own (essentially empty) attributes, not the instance\'s. The full reference <code>aws_instance.web.id</code> is not a style choice; it is the only way to reach that value from inside a different resource\'s provisioner.',
      ]
    },
    {
      heading: 'The corollary for null_resource: dynamic values need triggers, not a hoped-for self',
      points: [
        'A <code>null_resource</code>\'s own provisioner can reference OTHER resources\' attributes directly by their full address (as the main page\'s own example does) at CREATE time — but a destroy-time provisioner is different: by the time a resource is being destroyed, direct references to other (possibly already-destroyed) resources are not reliably available.',
        'The documented pattern for carrying a value into a destroy-time provisioner is the null_resource\'s own <code>triggers</code> map — values placed there become reachable as <code>self.triggers.NAME</code> even during destroy, since they are copied into the null_resource\'s own state rather than looked up live from another resource.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why the main page\'s two examples differ',
      language: 'bash',
      code: `resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  # This provisioner is attached DIRECTLY to aws_instance.web --
  # self resolves to THIS instance's own attributes:
  provisioner "local-exec" {
    command = "echo \${self.public_ip} >> inventory.txt"
  }
}

# This provisioner is attached to null_resource.notify_slack,
# NOT to aws_instance.web -- self here would resolve to the
# null_resource's own (essentially empty) attributes, so the
# main page's own example correctly uses the FULL reference
# instead:
resource "null_resource" "notify_slack" {
  triggers = {
    instance_id = aws_instance.web.id
  }
  provisioner "local-exec" {
    command = "curl -X POST \${var.slack_webhook} -d '{\\"text\\":\\"Instance \${aws_instance.web.id} created\\"}'"
    # aws_instance.web.id -- NOT self.id -- self would be wrong here
  }
}`,
    },
    {
      label: 'Destroy-time: why triggers exist',
      language: 'bash',
      code: `resource "null_resource" "cleanup" {
  triggers = {
    # Values copied INTO this null_resource's own state --
    # reachable via self.triggers even during destroy, when a
    # live reference to another resource may no longer resolve:
    bucket_name = aws_s3_bucket.data.bucket
  }

  provisioner "local-exec" {
    when    = destroy
    command = "aws s3 rm s3://\${self.triggers.bucket_name} --recursive"
    # self.triggers.bucket_name -- NOT aws_s3_bucket.data.bucket
    # directly -- by destroy time, a live cross-resource
    # reference is not a reliable source for this value.
  }
}

# Contrast: a CREATE-time provisioner on null_resource CAN
# reference another resource directly (main page's own
# example) -- the destroy-time case is what specifically
# needs triggers instead.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own null_resource pattern, a developer adds a destroy-time provisioner to a null_resource that needs to reference an S3 bucket name from a separate aws_s3_bucket resource: `command = "aws s3 rm s3://${aws_s3_bucket.data.bucket} --recursive"`, `when = destroy`. During terraform destroy, this consistently fails or behaves unexpectedly, unlike an equivalent create-time provisioner that worked fine with the same style of reference. What is different about the destroy-time case, and what is the documented fix?',
    hint: 'By the time a destroy-time provisioner runs, is a live reference to a different resource\'s current attribute value something Terraform can still reliably resolve?',
    solution: 'By destroy time, a live reference to another resource\'s attribute (like `aws_s3_bucket.data.bucket`) is not a reliable source for a destroy-time provisioner — the referenced resource may already be gone or mid-destruction itself. The documented fix is the null_resource\'s own `triggers` map: placing the bucket name there (`triggers = { bucket_name = aws_s3_bucket.data.bucket }`) copies the value INTO the null_resource\'s own state at creation time, making it reachable as `self.triggers.bucket_name` even during destroy — `self` resolving to the null_resource\'s own attributes, which now include a stable copy of the value, rather than depending on a live cross-resource lookup that destroy time cannot guarantee.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'self inside a provisioner refers to whatever resource the provisioner logically relates to, based on context — like the instance a null_resource\'s notification is actually about.',
      reality: 'Per this subtopic\'s theory, self always resolves to the specific resource the provisioner BLOCK IS PHYSICALLY ATTACHED TO — a null_resource\'s own provisioner can never reach another resource\'s attributes through self, regardless of logical intent.'
    },
    {
      thought: 'The main page\'s null_resource example using aws_instance.web.id instead of self.id is just a stylistic inconsistency, interchangeable with self.id in that context.',
      reality: 'Per this subtopic\'s theory, this is not stylistic — self.id inside that null_resource\'s provisioner would resolve to the null_resource\'s own attributes, not the instance\'s, so the full reference is the only correct form there.'
    },
    {
      thought: 'A destroy-time provisioner can reference another resource\'s current attribute directly, the same way a create-time provisioner on a null_resource can.',
      reality: 'Per this subtopic\'s theory, a destroy-time provisioner cannot reliably do this — the documented pattern is capturing the value in the null_resource\'s own triggers map at creation time so it remains reachable via self.triggers during destroy.'
    }
  ];
}
