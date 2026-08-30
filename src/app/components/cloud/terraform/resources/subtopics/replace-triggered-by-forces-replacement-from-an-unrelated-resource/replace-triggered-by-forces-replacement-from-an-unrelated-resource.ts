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
  templateUrl: './replace-triggered-by-forces-replacement-from-an-unrelated-resource.html',
  styleUrl: './replace-triggered-by-forces-replacement-from-an-unrelated-resource.scss'
})
export class ReplaceTriggeredByForcesReplacementFromAnUnrelatedResourceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists replace_triggered_by as a single bullet, never demonstrated',
      points: [
        'The main page\'s lifecycle theory says: "replace_triggered_by (1.2+): force replacement of a resource when specified references change." That single sentence is the entire treatment — no codeTab, no mistake entry, no example of the actual syntax anywhere on the page.',
      ]
    },
    {
      heading: 'What it does: link one resource\'s replacement to a completely different resource\'s planned change',
      points: [
        '<code>replace_triggered_by</code> lives inside a resource\'s own <code>lifecycle</code> block and accepts a list of references to OTHER resources or resource attributes — when Terraform\'s plan for any of those referenced things includes a change (an update OR a replacement), the resource declaring <code>replace_triggered_by</code> is ALSO forced to replace, even though nothing about its own arguments changed at all.',
        'This solves a real problem the main page\'s own implicit-dependency model cannot: an ordinary attribute reference only creates an ordering dependency (do this after that) — it does not force replacement of the referencing resource just because the referenced one changed. <code>replace_triggered_by</code> is specifically for the case where a resource\'s validity is tied to another resource\'s IDENTITY, not just its existence.',
      ]
    },
    {
      heading: 'Only resource addresses are valid — plain values need terraform_data as a workaround',
      points: [
        '<code>replace_triggered_by</code> only accepts references to resources or their attributes, specifically because the decision is based on the PLANNED ACTION for each given resource (is it being updated or replaced this run) — it cannot evaluate a plain value like a local or a variable the same way.',
        'To trigger a replacement from a plain value change (not an actual resource), the documented workaround is wrapping that value in a <code>terraform_data</code> resource (a resource type that exists purely to hold and track a value) and referencing THAT in <code>replace_triggered_by</code> — indirectly turning a plain value into something with its own planned-action state.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The syntax the main page never shows',
      language: 'bash',
      code: `# Official HashiCorp example: replacing an ECS service's
# autoscaling target whenever the service itself is replaced
resource "aws_ecs_service" "svc" {
  # ...
}

resource "aws_appautoscaling_target" "ecs_target" {
  # ...
  lifecycle {
    replace_triggered_by = [aws_ecs_service.svc.id]
  }
}
# Even though nothing about the autoscaling target's OWN
# arguments changed, if aws_ecs_service.svc is replaced this
# run, aws_appautoscaling_target.ecs_target is forced to
# replace too -- because a stale autoscaling target pointed
# at a since-replaced service would be broken.`,
    },
    {
      label: 'A whole resource reference, and the terraform_data workaround for plain values',
      language: 'bash',
      code: `# Referencing a whole resource -- replace whenever the
# subnet has ANY planned change (update or replacement):
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.public.id

  lifecycle {
    replace_triggered_by = [aws_subnet.public]
  }
}

# Plain values (locals, variables) are NOT valid directly --
# they have no "planned action" for replace_triggered_by to
# evaluate. Workaround: wrap the value in terraform_data first.
resource "terraform_data" "deploy_trigger" {
  input = var.app_version   # a plain string, not a real resource
}

resource "aws_instance" "app" {
  ami = var.ami_id
  lifecycle {
    # Now references terraform_data's own planned action,
    # which changes whenever var.app_version changes:
    replace_triggered_by = [terraform_data.deploy_trigger]
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An autoscaling target resource (aws_appautoscaling_target) has no lifecycle block at all. Whenever the ECS service it scales (aws_ecs_service.svc) gets replaced — a new service with a new ID — the autoscaling target silently keeps pointing at the OLD, now-gone service ID, since nothing about the autoscaling target\'s own arguments changed and Terraform sees no reason to touch it. What lifecycle addition fixes this, and why can\'t a plain attribute reference alone (e.g. using aws_ecs_service.svc.id somewhere in the target\'s own arguments) achieve the same result?',
    hint: 'An attribute reference creates an ORDERING dependency, not a forced-replacement one. What lifecycle meta-argument specifically ties one resource\'s replacement to another\'s planned action?',
    solution: 'The fix is adding `lifecycle { replace_triggered_by = [aws_ecs_service.svc.id] }` to the aws_appautoscaling_target resource — this forces the target to replace whenever the ECS service it references has a planned change (update or replacement), even though nothing about the target\'s own arguments changed. A plain attribute reference alone would not achieve this: referencing `aws_ecs_service.svc.id` in the target\'s own configuration only creates an ORDERING dependency (create/update the target after the service), it does not force the target itself to be replaced just because the service was replaced — replace_triggered_by is specifically the mechanism for tying one resource\'s replacement to another resource\'s planned action, which an ordinary reference cannot express.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An ordinary attribute reference to another resource (like using aws_ecs_service.svc.id in a resource\'s own arguments) already forces that resource to replace whenever the referenced resource is replaced.',
      reality: 'Per this subtopic\'s theory, a plain attribute reference only creates an ORDERING dependency — it does not force replacement. replace_triggered_by is the specific, separate mechanism needed to tie one resource\'s replacement to another\'s planned action.'
    },
    {
      thought: 'replace_triggered_by can reference any value, including local values and variables, the same way it references resources.',
      reality: 'Per this subtopic\'s theory, replace_triggered_by only accepts resource or resource-attribute references, since it evaluates the referenced thing\'s PLANNED ACTION — plain values have no planned action, and need to be wrapped in a terraform_data resource as a workaround.'
    },
    {
      thought: 'replace_triggered_by only fires when the referenced resource is itself replaced, not for an ordinary in-place update.',
      reality: 'Per this subtopic\'s theory, it fires for either kind of planned change to the referenced resource — an update OR a replacement — not exclusively a replacement of the referenced resource.'
    }
  ];
}
