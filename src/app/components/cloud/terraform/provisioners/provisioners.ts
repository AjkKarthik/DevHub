import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-tf-provisioners',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './provisioners.html',
  styleUrl: './provisioners.scss',
})
export class TfProvisioners {
  quickRef: QuickRefItem[] = [
    { name: 'local-exec',            type: 'keyword', desc: 'Run a command on the machine running Terraform.' },
    { name: 'remote-exec',           type: 'keyword', desc: 'Run commands on the newly created remote resource.' },
    { name: 'file',                  type: 'keyword', desc: 'Copy a file or directory to a remote resource.' },
    { name: 'connection {}',         type: 'syntax',  desc: 'SSH/WinRM connection settings for remote provisioners.' },
    { name: 'when = destroy',        type: 'keyword', desc: 'Run provisioner on resource destroy, not create.' },
    { name: 'on_failure = continue', type: 'keyword', desc: 'Ignore provisioner failure (default: fail).' },
    { name: 'user_data',             type: 'keyword', desc: 'Preferred alternative — cloud-init scripts on EC2/VM.' },
    { name: 'null_resource',         type: 'keyword', desc: 'Dummy resource used only to run provisioners.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are Provisioners?',
      points: [
        'Provisioners execute scripts or commands as part of resource creation or destruction.',
        'They are a Terraform escape hatch for tasks cloud APIs cannot perform natively.',
        'HashiCorp recommends treating provisioners as a last resort — they break the declarative model.',
        'Three types: local-exec (local commands), remote-exec (remote commands), file (file copy).',
        'Provisioner failures by default fail the entire apply — use on_failure = continue to override.',
      ],
    },
    {
      heading: 'local-exec',
      points: [
        'Runs a command on the machine executing Terraform — useful for calling scripts, triggering CI, or notifying external systems.',
        'Has access to all resource attributes via interpolation.',
        'Common use: invoke aws CLI, trigger a deployment webhook, update a DNS record via script.',
        'local-exec does not require SSH — it runs locally regardless of the resource\'s location.',
        'Output is shown in apply output but not captured in state.',
      ],
    },
    {
      heading: 'remote-exec and file',
      points: [
        'remote-exec requires a connection block with SSH (Linux) or WinRM (Windows) settings.',
        'Use inline for short command lists, script for a single script file, scripts for multiple.',
        'file copies a local file or directory to the remote host over SSH/SCP.',
        'Both require the resource to be reachable from the Terraform operator\'s machine — a problem in private networks.',
        'Better alternatives: user_data/cloud-init for boot scripts, AWS Systems Manager Run Command, Ansible after provisioning.',
      ],
    },
    {
      heading: 'When to Avoid Provisioners',
      points: [
        'user_data/cloud-init: runs on boot, no SSH required, idempotent with proper scripting.',
        'AWS Systems Manager: run scripts on instances without SSH, with audit logs.',
        'Packer: build AMIs with software pre-installed — no runtime provisioning needed.',
        'Configuration management: Ansible, Chef, Puppet after Terraform creates the resource.',
        'Provisioners are not idempotent — re-running terraform apply after a change does not re-run them.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'local-exec',
      language: 'bash',
      code: `resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  # Run local command after instance is created
  provisioner "local-exec" {
    command = "echo \${self.public_ip} >> inventory.txt"
  }

  # Destroy-time provisioner (cleanup)
  provisioner "local-exec" {
    when    = destroy
    command = "echo 'Destroying \${self.id}' >> audit.log"
  }
}

# null_resource — provisioner without a real resource
resource "null_resource" "notify_slack" {
  triggers = {
    instance_id = aws_instance.web.id
  }
  provisioner "local-exec" {
    command = "curl -X POST \${var.slack_webhook} -d '{\"text\":\"Instance \${aws_instance.web.id} created\"}'"
  }
}`,
    },
    {
      label: 'remote-exec',
      language: 'bash',
      code: `resource "aws_instance" "app" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  key_name      = aws_key_pair.deployer.key_name

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("~/.ssh/id_rsa")
    host        = self.public_ip
  }

  provisioner "file" {
    source      = "scripts/setup.sh"
    destination = "/tmp/setup.sh"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/setup.sh",
      "sudo /tmp/setup.sh",
    ]
  }
}`,
    },
    {
      label: 'Better: user_data',
      language: 'bash',
      code: `# Preferred: cloud-init instead of remote-exec
resource "aws_instance" "app" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  # Runs at boot — no SSH required
  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "OK" > /var/www/html/health.txt
  EOF

  # Or use templatefile for complex scripts:
  # user_data = templatefile("\${path.module}/cloud-init.sh.tpl", {
  #   app_version = var.app_version
  # })
}

# Even better: pre-baked AMI with Packer
# resource "aws_instance" "app" {
#   ami           = var.app_ami_id   # built by Packer with nginx pre-installed
#   instance_type = "t3.micro"
# }`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using remote-exec for post-boot configuration',
      wrong: `resource "aws_instance" "app" {
  # ...
  provisioner "remote-exec" {
    inline = ["apt-get install -y nginx"]
  }
  # Requires SSH access from Terraform runner — breaks in private subnets
}`,
      right: `resource "aws_instance" "app" {
  # ...
  user_data = "#!/bin/bash\\napt-get install -y nginx"
  # Runs at boot without SSH — works in any network
}`,
      explanation: 'remote-exec requires SSH access from the Terraform runner to the instance. user_data/cloud-init runs at boot time without any network dependency from Terraform.',
    },
    {
      title: 'Assuming provisioners re-run on changes',
      wrong: `resource "aws_instance" "app" {
  provisioner "remote-exec" {
    inline = ["./deploy.sh \${var.app_version}"]
  }
}
# Updating var.app_version does NOT re-run the provisioner!`,
      right: `# Use triggers on null_resource to force re-run
resource "null_resource" "deploy" {
  triggers = { app_version = var.app_version }
  provisioner "local-exec" {
    command = "./deploy.sh \${var.app_version} \${aws_instance.app.public_ip}"
  }
  depends_on = [aws_instance.app]
}`,
      explanation: 'Provisioners only run on resource creation (or destruction). Changing a variable does not re-run them. Use null_resource with triggers if you need re-run on input changes.',
    },
    {
      title: 'Not using on_failure = continue for non-critical provisioners',
      wrong: `provisioner "local-exec" {
  command = "curl \${var.notification_url}"
  # If the notification URL is down, the entire apply fails!
}`,
      right: `provisioner "local-exec" {
  command    = "curl \${var.notification_url} || true"
  on_failure = continue  # apply continues even if provisioner fails
}`,
      explanation: 'By default, a provisioner failure fails the apply and marks the resource as tainted (will be replaced next apply). Use on_failure = continue for non-critical side effects.',
    },
  ];

  challenge: Challenge = {
    title: 'Post-Deploy Notification',
    language: 'typescript',
    description: 'Create an EC2 instance using user_data to install nginx. Use a null_resource with a local-exec provisioner to log the instance IP to a file and trigger a webhook notification. Add a trigger so the notification re-runs when the app_version variable changes. Use on_failure = continue on the webhook call.',
    hints: [
      'user_data for nginx install — no SSH needed',
      'null_resource with triggers = { version = var.app_version }',
      'local-exec: echo and curl commands',
      'on_failure = continue on the webhook provisioner',
    ],
    starterCode: `variable "app_version" { type = string; default = "1.0.0" }
variable "webhook_url"  { type = string; default = "https://hooks.example.com/notify" }

resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  # TODO: user_data to install nginx
}

# TODO: null_resource with triggers and local-exec provisioners`,
    solution: `variable "app_version" { type = string; default = "1.0.0" }
variable "webhook_url"  { type = string; default = "https://hooks.example.com/notify" }

resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
  EOF
  tags = { Name = "web-v\${var.app_version}" }
}

resource "null_resource" "notify" {
  triggers = {
    instance_id = aws_instance.web.id
    app_version = var.app_version
  }
  depends_on = [aws_instance.web]

  provisioner "local-exec" {
    command = "echo '\${aws_instance.web.public_ip} v\${var.app_version}' >> deploy.log"
  }

  provisioner "local-exec" {
    command    = "curl -s -X POST \${var.webhook_url} -d '{\"version\":\"\${var.app_version}\",\"ip\":\"\${aws_instance.web.public_ip}\"}'"
    on_failure = continue
  }
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the main drawback of remote-exec provisioners?', options: ['They are slower than local-exec', 'They require SSH/WinRM access from the Terraform runner to the instance', 'They cannot pass variables', 'They only work on Linux'], answer: 1, explanation: 'remote-exec requires SSH (Linux) or WinRM (Windows) connectivity from wherever Terraform runs to the target instance. This breaks in private subnets or secure networks.' },
    { q: 'When does a provisioner run?', options: ['Every terraform plan', 'Only on resource creation (or destruction with when = destroy)', 'When its variables change', 'On every terraform apply'], answer: 1, explanation: 'Provisioners run only on resource creation by default. They do not re-run on subsequent applies unless the resource is tainted/recreated.' },
    { q: 'What happens when a provisioner fails by default?', options: ['The apply continues', 'The resource is created but tainted, and the apply fails', 'The provisioner is retried 3 times', 'The failure is ignored'], answer: 1, explanation: 'A provisioner failure marks the resource as tainted (next apply will destroy and recreate it) and fails the apply. Use on_failure = continue to override.' },
    { q: 'What is the preferred alternative to remote-exec for boot configuration?', options: ['local-exec', 'file provisioner', 'user_data / cloud-init', 'null_resource'], answer: 2, explanation: 'user_data (AWS) / custom_data (Azure) runs scripts at boot via cloud-init without requiring SSH. Pre-baked AMIs (Packer) are even better for complex setups.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is a null_resource?', a: 'null_resource is a resource that does nothing itself — it has no real infrastructure. Its purpose is to attach provisioners or create a dependency point. It is triggered by changes to its triggers map.' },
    { q: 'Are provisioners idempotent?', a: 'Not by nature — they run arbitrary commands which may or may not be idempotent. If the resource is recreated (tainted), the provisioner runs again. Design provisioner commands to be safe to run multiple times.' },
    { q: 'Why does HashiCorp call provisioners a "last resort"?', a: 'Provisioners are imperative operations in a declarative system. They run at creation time only, are not idempotent, require connectivity, and break the stateful model. Use cloud-native mechanisms (user_data, SSM, Packer) whenever possible.' },
    { q: 'What is the terraform_data resource (TF 1.4+)?', a: 'terraform_data is the successor to null_resource. It provides input/output, triggers_replace, and provisioner support. Use terraform_data over null_resource in new Terraform >= 1.4 configurations.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Provisioners run commands at resource creation/destruction — use them as a last resort; prefer user_data, cloud-native agents, or Packer.',
    mustKnow: [
      'local-exec: runs locally on the Terraform operator machine',
      'remote-exec/file: requires SSH/WinRM from operator to the resource',
      'Provisioners only run on creation (or with when = destroy)',
      'on_failure = continue to prevent provisioner failures from aborting apply',
      'null_resource / terraform_data (1.4+): dummy resource for provisioner-only triggers',
      'Prefer user_data, SSM Run Command, or Packer AMIs over provisioners',
    ],
    interviewFocus: [
      'Why are provisioners considered a last resort in Terraform?',
      'Difference between local-exec and remote-exec',
      'How do you trigger a provisioner re-run without recreating the resource?',
    ],
  };
}
