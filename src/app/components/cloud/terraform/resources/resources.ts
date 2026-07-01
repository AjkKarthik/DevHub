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
  selector: 'app-tf-resources',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './resources.html',
  styleUrl: './resources.scss',
})
export class TfResources {
  quickRef: QuickRefItem[] = [
    { name: 'count',                    type: 'keyword', desc: 'Create N copies of a resource — accessed by count.index.' },
    { name: 'for_each',                 type: 'keyword', desc: 'Create one resource per map/set entry — accessed by each.key/value.' },
    { name: 'depends_on',               type: 'keyword', desc: 'Explicit dependency — use when Terraform cannot infer ordering.' },
    { name: 'lifecycle {}',             type: 'syntax',  desc: 'Control resource replacement: create_before_destroy, prevent_destroy, ignore_changes.' },
    { name: 'create_before_destroy',    type: 'keyword', desc: 'New resource created before old one is deleted (zero-downtime).' },
    { name: 'prevent_destroy = true',   type: 'keyword', desc: 'Protects resource from destroy — apply fails if destruction is planned.' },
    { name: 'ignore_changes = [tags]',  type: 'syntax',  desc: 'Tell Terraform to ignore drift on specified attributes.' },
    { name: 'replace_triggered_by',     type: 'keyword', desc: 'Force replacement when specified references change (TF 1.2+).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Resource Block Anatomy',
      points: [
        'resource "TYPE" "NAME" {} declares a managed infrastructure object.',
        'TYPE is provider-specific: aws_instance, azurerm_resource_group, google_storage_bucket.',
        'NAME is local identifier within your configuration — referenced as TYPE.NAME.attribute.',
        'Arguments inside the block are resource-specific settings — check the provider docs for each resource type.',
        'Terraform maps each resource block to exactly one real-world object in the state file.',
      ],
    },
    {
      heading: 'count vs for_each',
      points: [
        'count = N creates N instances indexed 0..N-1. Access individual with resource.name[0].',
        'for_each = map_or_set creates one instance per entry. Access with resource.name["key"].',
        'count is simple for identical resources; for_each is safer for resources that differ by key.',
        'Removing an element from the middle of a count list shifts indices and destroys downstream resources.',
        'for_each with stable string keys: removing one entry only removes that specific resource.',
      ],
    },
    {
      heading: 'lifecycle Meta-Argument',
      points: [
        'create_before_destroy: create the replacement before destroying the old one. Use for resources that cannot have downtime (certificates, load balancer targets).',
        'prevent_destroy: terraform apply fails if a plan would destroy this resource. Protects critical data stores.',
        'ignore_changes: list of attributes Terraform should not track for drift. Useful for auto-scaling groups that change their instance count externally.',
        'replace_triggered_by (1.2+): force replacement of a resource when specified references change.',
        'precondition / postcondition (1.2+): custom assertions run before and after resource creation.',
      ],
    },
    {
      heading: 'depends_on and Ordering',
      points: [
        'Terraform infers dependencies from attribute references — if resource B uses resource A\'s id, B waits for A.',
        'depends_on forces explicit ordering for hidden dependencies (e.g. IAM policy must exist before an EC2 with that role, but the EC2 block does not reference the policy directly).',
        'Overusing depends_on slows the apply — only use it when Terraform truly cannot detect the dependency.',
        'Module blocks also support depends_on to force the entire module to run after another resource.',
      ],
    },
    {
      heading: 'Resource Lifecycle Meta-Argument Controls',
      points: [
        'create_before_destroy = true (within a lifecycle block) changes the default replace behavior — instead of destroying the old resource before creating its replacement, Terraform creates the new resource first, then destroys the old one, avoiding downtime for resources where a brief overlap is acceptable but a gap is not.',
        'prevent_destroy = true causes Terraform to error out and refuse to destroy a specific resource, even if a configuration change or terraform destroy would otherwise remove it — a safety guardrail for genuinely critical, hard-to-recreate resources like a production database.',
        'ignore_changes lets specific resource attributes be excluded from drift detection — useful when an attribute is legitimately managed outside Terraform (like an autoscaling group\'s desired_capacity being adjusted by the autoscaler itself) and should not trigger a plan diff every time it naturally changes.',
        'These lifecycle controls should be used deliberately and sparingly — overusing ignore_changes in particular can hide genuine configuration drift that you actually want visibility into, defeating one of Terraform\'s core value propositions of accurate drift detection.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'count & for_each',
      language: 'bash',
      code: `# count — identical resources
resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  tags = { Name = "web-\${count.index}" }
}
# Reference: aws_instance.web[0].id

# for_each — named resources
resource "aws_iam_user" "dev" {
  for_each = toset(["alice", "bob", "carol"])
  name     = each.key
}
# Reference: aws_iam_user.dev["alice"].arn

# for_each with a map
resource "aws_s3_bucket" "region_buckets" {
  for_each = {
    us-east = "myapp-us-east-data"
    eu-west = "myapp-eu-west-data"
  }
  bucket = each.value
  tags   = { Region = each.key }
}`,
    },
    {
      label: 'lifecycle',
      language: 'bash',
      code: `resource "aws_lb" "main" {
  name               = "main-lb"
  internal           = false
  load_balancer_type = "application"
  subnets            = module.network.public_subnet_ids

  lifecycle {
    create_before_destroy = true  # zero-downtime replacement
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier = "prod-db"
  engine             = "aurora-postgresql"

  lifecycle {
    prevent_destroy = true  # fails apply if plan includes destroy

    # Ignore externally managed tags (cost allocation tools)
    ignore_changes = [tags["LastModified"]]
  }
}

resource "aws_autoscaling_group" "app" {
  lifecycle {
    ignore_changes = [desired_capacity]  # auto-scaler manages this
  }
}`,
    },
    {
      label: 'depends_on',
      language: 'bash',
      code: `resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_read.arn
}

resource "aws_instance" "app" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  iam_instance_profile = aws_iam_instance_profile.ec2.name

  # EC2 doesn't reference the policy attachment directly,
  # but must wait for it to exist before the role is assumed
  depends_on = [aws_iam_role_policy_attachment.s3_access]
}

# Module-level depends_on
module "compute" {
  source     = "./modules/compute"
  depends_on = [module.network]   # wait for entire network module
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using count for resources that need stable identity',
      wrong: `variable "envs" { default = ["dev", "staging", "prod"] }
resource "aws_s3_bucket" "env" {
  count  = length(var.envs)
  bucket = var.envs[count.index]
}
# Removing "staging" → destroys "prod" (index shifts from 2 to 1)`,
      right: `variable "envs" { default = { dev = "dev", staging = "staging", prod = "prod" } }
resource "aws_s3_bucket" "env" {
  for_each = var.envs
  bucket   = each.value
}
# Removing "staging" only removes that bucket`,
      explanation: 'Use for_each with string keys for resources that need stable identity. count index shifts when items are added or removed from the middle.',
    },
    {
      title: 'Forgetting prevent_destroy on critical resources',
      wrong: `resource "aws_rds_cluster" "main" {
  cluster_identifier = "prod-db"
  # No lifecycle — terraform destroy or accidental plan change deletes DB!
}`,
      right: `resource "aws_rds_cluster" "main" {
  cluster_identifier = "prod-db"
  lifecycle {
    prevent_destroy = true
  }
}`,
      explanation: 'Always add prevent_destroy to stateful resources like databases, S3 buckets, and key stores in production.',
    },
    {
      title: 'Overusing depends_on',
      wrong: `resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  subnet_id     = aws_subnet.main.id   # already an implicit dependency
  depends_on    = [aws_subnet.main]    # redundant — already inferred
}`,
      right: `resource "aws_instance" "web" {
  ami       = data.aws_ami.ubuntu.id
  subnet_id = aws_subnet.main.id  # implicit dependency — no depends_on needed
}`,
      explanation: 'Terraform creates implicit dependencies from attribute references. Redundant depends_on adds no value but makes configs harder to read.',
    },
    {
      title: 'Missing lifecycle create_before_destroy for zero-downtime',
      wrong: `resource "aws_acm_certificate" "main" {
  domain_name = var.domain
  # Default: old cert deleted before new one created
  # TLS handshake fails during the gap
}`,
      right: `resource "aws_acm_certificate" "main" {
  domain_name       = var.domain
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true  # new cert available before old is removed
  }
}`,
      explanation: 'Without create_before_destroy, Terraform destroys the old resource first, creating a downtime window. This is critical for certificates, target groups, and load balancers.',
    },
  ];

  challenge: Challenge = {
    title: 'Multi-AZ EC2 with for_each',
    language: 'typescript',
    description: 'Create a map variable defining three environments with their subnet IDs. Use for_each to create one EC2 instance per environment. Add a lifecycle block preventing accidental destruction, and output a map of environment → instance IDs.',
    hints: [
      'Variable type: map(object({ subnet_id = string, instance_type = string }))',
      'for_each = var.environments iterates the map',
      'each.key is the env name, each.value.subnet_id is the subnet',
      'Output: { for k, v in aws_instance.app : k => v.id }',
    ],
    starterCode: `variable "environments" {
  type = map(object({
    subnet_id     = string
    instance_type = string
  }))
  default = {
    dev  = { subnet_id = "subnet-111", instance_type = "t3.micro" }
    stg  = { subnet_id = "subnet-222", instance_type = "t3.small" }
    prod = { subnet_id = "subnet-333", instance_type = "t3.medium" }
  }
}

# TODO: EC2 resource with for_each, lifecycle, and output`,
    solution: `variable "environments" {
  type = map(object({
    subnet_id     = string
    instance_type = string
  }))
  default = {
    dev  = { subnet_id = "subnet-111", instance_type = "t3.micro" }
    stg  = { subnet_id = "subnet-222", instance_type = "t3.small" }
    prod = { subnet_id = "subnet-333", instance_type = "t3.medium" }
  }
}

resource "aws_instance" "app" {
  for_each      = var.environments
  ami           = "ami-0c02fb55956c7d316"
  instance_type = each.value.instance_type
  subnet_id     = each.value.subnet_id
  tags = { Name = "app-\${each.key}", Environment = each.key }

  lifecycle {
    prevent_destroy       = false  # set to true for prod
    create_before_destroy = true
  }
}

output "instance_ids" {
  value = { for k, v in aws_instance.app : k => v.id }
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the main advantage of for_each over count?', options: ['for_each is faster to apply', 'for_each uses stable string keys preventing index-shift recreation', 'for_each supports more resource types', 'for_each generates less state'], answer: 1, explanation: 'for_each keys are strings — removing one entry does not shift others. count uses numeric indices that shift when items are added/removed from the middle.' },
    { q: 'What does prevent_destroy = true in a lifecycle block do?', options: ['Prevents terraform plan from running', 'Makes terraform apply fail if the plan would destroy this resource', 'Encrypts the resource in state', 'Creates a backup before destroying'], answer: 1, explanation: 'prevent_destroy causes terraform apply to error if the execution plan includes destruction of that resource. It does not prevent manual deletion via cloud console.' },
    { q: 'When should you use depends_on explicitly?', options: ['Always, for every resource', 'When two resources reference each other', 'When Terraform cannot infer a dependency from attribute references', 'For all module blocks'], answer: 2, explanation: 'depends_on is needed only for hidden dependencies that Terraform cannot detect — e.g. an IAM policy attachment that must exist before an EC2 role is assumed, but the EC2 block has no direct attribute reference to the attachment.' },
    { q: 'How do you access the key in a for_each resource?', options: ['count.index', 'self.key', 'each.key', 'item.key'], answer: 2, explanation: 'Inside a for_each resource, each.key holds the current map key (or set element) and each.value holds the value.' },
  { q: 'What is the meta-argument depends_on used for in Terraform resources?', options: ['It sets the order of variable evaluation within a resource block', 'It creates an explicit dependency between resources when Terraform cannot infer one from attribute references', 'It requires a specific provider version for the resource', 'It marks a resource as dependent on an external system outside Terraform'], answer: 1, explanation: 'depends_on explicitly declares a dependency when Terraform cannot detect it automatically. Terraform infers dependencies from references between resource attributes. But for side effects not reflected in attributes such as an IAM policy attachment before an EC2 instance needs it, depends_on ensures correct ordering. Use depends_on sparingly because it reduces parallelism and hides the reason for the dependency. Always add a comment explaining why the explicit dependency is needed.' },
  { q: 'What is the count meta-argument and what is its main limitation?', options: ['count controls how many providers are downloaded', 'count creates multiple instances indexed by integers; removing a middle element reindexes and may destroy and recreate resources', 'count is an alias for for_each and they work identically', 'count is deprecated and should be replaced with for_each in all cases'], answer: 1, explanation: 'count creates multiple instances of a resource addressed by integer index. The main limitation: if you remove an element from the middle of the list, all higher-indexed resources are reindexed and Terraform destroys and recreates them. Use count only when instances are truly interchangeable. Use for_each with a map or set keyed by meaningful identifiers when instances are distinguishable, as removing one key does not affect others.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can I mix count and for_each in the same resource?', a: 'No. A resource can use count OR for_each, not both. If you need both dimensions, nest them in separate resources or use module composition.' },
    { q: 'What is the difference between ignore_changes and prevent_destroy?', a: 'ignore_changes tells Terraform to not track drift on specific attributes (they can change outside Terraform). prevent_destroy stops Terraform from deleting the resource during apply.' },
    { q: 'Can lifecycle rules be applied at the module level?', a: 'No. lifecycle is a resource-level meta-argument. You cannot set lifecycle on an entire module block — it must be on individual resource blocks within the module.' },
    { q: 'What happens when I change a resource argument that requires replacement?', a: 'Terraform marks it with -/+ in the plan (destroy and re-create). With create_before_destroy, it creates the new one first. Without it, the old one is deleted first. Some attributes force replacement (immutable); others can be updated in-place.' },
  { q: 'What is the difference between terraform taint and using -replace in modern Terraform?', a: 'terraform taint resource.name marks a resource in state as tainted, causing it to be destroyed and recreated on the next apply. This is a manual imperative operation. The terraform taint command is deprecated in Terraform 1.0 and later in favor of terraform apply -replace=resource.name which does the same thing in a single step and shows the replacement plan before applying it. The -replace flag is safer because you see the full plan including downstream changes before committing. Use -replace for one-off manual replacements when a resource is in a bad state and needs to be recreated.' },
  { q: 'How do Terraform resource timeouts work?', a: 'The timeouts block in a resource specifies how long Terraform waits for each operation before failing. You can set timeouts for create, update, and delete operations independently. Not all resources support all timeout types; check the provider documentation for each resource. Default timeouts vary by resource type and are set by the provider. When a timeout is exceeded, Terraform marks the resource as tainted. Timeouts are particularly useful for slow operations like RDS instance creation that can take 15 or more minutes, and for large cluster updates. Increase timeouts in CI/CD pipelines where operations may be slower than interactive use.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Resources are declared infrastructure — meta-arguments (count, for_each, lifecycle, depends_on) control how Terraform creates and manages them.',
    mustKnow: [
      'resource "TYPE" "NAME" {} maps to one real-world infrastructure object',
      'for_each with stable string keys > count with numeric indices for named resources',
      'lifecycle: create_before_destroy (zero downtime), prevent_destroy (safety), ignore_changes (drift)',
      'depends_on for hidden dependencies Terraform cannot infer from attribute references',
      'count.index and each.key/each.value for accessing instance context',
      'Changing immutable attributes forces destroy/re-create (-/+ in plan)',
    ],
    interviewFocus: [
      'When to use count vs for_each — what breaks with count when removing middle items?',
      'Explain lifecycle meta-arguments and a real-world use case for each',
      'How does Terraform infer dependencies, and when do you need depends_on?',
    ],
  };
}
