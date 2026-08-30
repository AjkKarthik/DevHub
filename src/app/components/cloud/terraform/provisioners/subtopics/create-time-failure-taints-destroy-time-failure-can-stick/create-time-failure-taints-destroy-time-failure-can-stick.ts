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
  templateUrl: './create-time-failure-taints-destroy-time-failure-can-stick.html',
  styleUrl: './create-time-failure-taints-destroy-time-failure-can-stick.scss'
})
export class CreateTimeFailureTaintsDestroyTimeFailureCanStickSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states one rule that covers only half of the picture',
      points: [
        'The main page\'s theory says: "Provisioner failures by default fail the entire apply — use <code>on_failure = continue</code> to override." True for the immediate apply, but it treats create-time and destroy-time failures as if they behave the same way afterward. They do not, and the destroy-time case has a genuinely stuck-infrastructure failure mode the main page never mentions.',
      ]
    },
    {
      heading: 'A failed create-time provisioner taints the resource — recoverable on the next apply',
      points: [
        'When a provisioner attached to a resource fails during CREATION, Terraform marks that resource as tainted. A failed provisioner can leave a resource in a semi-configured state Terraform has no way to inspect or repair directly, so tainting is the mechanism that says "this needs to be destroyed and recreated, not trusted as-is."',
        'The practical consequence is generally survivable: the NEXT <code>terraform apply</code> sees the taint and destroys-then-recreates the resource, running the provisioner again on the fresh copy. Annoying and possibly slow, but self-healing without manual intervention.',
      ]
    },
    {
      heading: 'A failed destroy-time provisioner can leave destroy permanently stuck',
      points: [
        'A destroy-time provisioner (<code>when = destroy</code>) failing is different in a way that matters: Terraform returns an error and the resource is NOT removed from state, since the destroy did not complete. The next <code>terraform destroy</code> attempt reruns the same provisioner — which, if the underlying cause has not changed, fails again, forever, with no automatic recovery.',
        'The situation compounds specifically for a TAINTED resource: a destroy-time provisioner on a resource that is tainted — whether tainted from an earlier failed create-time provisioner, or tainted manually — does NOT run at all. This means a resource that failed to create AND has a destroy-time cleanup provisioner can end up in a state where neither the create-time provisioner\'s taint-triggered recreation NOR the destroy-time provisioner\'s own cleanup logic ever fires as expected.',
        'This asymmetry is exactly why HashiCorp\'s own guidance is to default destroy-time provisioners specifically to <code>on_failure = continue</code> — the main page\'s single generic mention of the flag does not distinguish this from the create-time case, where the default <code>fail</code> behavior (taint-and-recreate) is usually the more appropriate choice.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create-time failure: self-healing via taint',
      language: 'bash',
      code: `resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  provisioner "remote-exec" {
    inline = ["sudo /tmp/setup.sh"]   # fails -- script errors out
  }
}
# terraform apply
# Error: remote-exec provisioner error
# aws_instance.web: Creation complete... (tainted)

# The instance now EXISTS in AWS but is marked tainted in
# state. The next apply destroys and recreates it, running
# the provisioner again on the fresh instance:
terraform apply
# aws_instance.web: Destroying... (because tainted)
# aws_instance.web: Creating...
# aws_instance.web: Provisioning with 'remote-exec'...
# Self-healing, without manual intervention.`,
    },
    {
      label: 'Destroy-time failure: no automatic recovery',
      language: 'bash',
      code: `resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  provisioner "local-exec" {
    when    = destroy
    command = "curl -f https://deregister.internal/\${self.id}"
    # fails if the deregister endpoint is unreachable
  }
}

terraform destroy
# Error: local-exec provisioner (destroy-time) error
# The resource is NOT removed from state -- destroy did not
# complete. Re-running destroy hits the SAME failure again,
# with no automatic recovery:
terraform destroy   # fails again, same reason

# The recommended default for destroy-time provisioners
# specifically -- swallow the failure rather than block:
resource "aws_instance" "web" {
  provisioner "local-exec" {
    when       = destroy
    command    = "curl -f https://deregister.internal/\${self.id}"
    on_failure = continue   # don't let cleanup block the destroy
  }
}

# Worse combination: a TAINTED resource's own destroy-time
# provisioner does not run AT ALL -- neither the create-time
# taint-recreate cycle nor the destroy-time cleanup fires:
# (no direct HCL for this -- it is a runtime interaction
#  between taint state and destroy-time provisioner execution)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A resource has both a create-time remote-exec provisioner and a destroy-time local-exec provisioner (using the default on_failure = fail for both). The create-time provisioner fails during an apply, tainting the resource. A teammate then runs terraform destroy to clean up and start over — but the destroy-time provisioner never appears to run at all, and terraform apply afterward creates a brand new resource rather than reusing anything. What actually happened to the destroy-time provisioner, and what change to it would have been the safer default?',
    hint: 'The resource was already tainted before destroy ran. Does a tainted resource\'s destroy-time provisioner behave the same as an untainted one\'s?',
    solution: 'A destroy-time provisioner on a resource that is already tainted does not run at all — this applies whether the taint came from an earlier failed create-time provisioner or from manual tainting. So the destroy-time cleanup logic was silently skipped, not merely failing quietly; destroy proceeded to remove the resource from state without ever attempting that provisioner. The safer default, per HashiCorp\'s own guidance, is setting `on_failure = continue` specifically on destroy-time provisioners — not because it fixes the tainted-resource-skips-destroy-provisioner behavior directly, but because it prevents the OTHER failure mode (a destroy-time provisioner that runs but fails leaving the resource permanently stuck in state) from ever compounding with taint-related edge cases in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A failed create-time provisioner and a failed destroy-time provisioner produce the same outcome — the resource is tainted either way, recoverable on the next apply.',
      reality: 'Per this subtopic\'s theory, they differ sharply: a failed create-time provisioner taints the resource for self-healing recreation, while a failed destroy-time provisioner leaves the resource stuck in state, with the same failure recurring on every subsequent destroy attempt.'
    },
    {
      thought: 'on_failure = continue is a generic setting whose recommended use is the same regardless of whether it is applied to a create-time or destroy-time provisioner.',
      reality: 'Per this subtopic\'s theory, HashiCorp specifically recommends defaulting destroy-time provisioners to on_failure = continue, since the alternative (a stuck, permanently-failing destroy) is worse than the alternative for create-time provisioners, where the default fail-and-taint behavior is usually appropriate.'
    },
    {
      thought: 'A tainted resource\'s destroy-time provisioner runs normally when the resource is eventually destroyed, since tainting only affects whether the resource gets recreated.',
      reality: 'Per this subtopic\'s theory, a destroy-time provisioner on a tainted resource does not run at all — a real, documented interaction between taint state and destroy-time provisioner execution that can silently skip cleanup logic.'
    }
  ];
}
