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
  selector: 'app-tf-expressions',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './expressions.html',
  styleUrl: './expressions.scss',
})
export class TfExpressions {
  quickRef: QuickRefItem[] = [
    { name: 'cond ? true : false',      type: 'operator', desc: 'Ternary conditional expression.' },
    { name: 'for x in list : expr',     type: 'syntax',   desc: 'For expression — transforms a list or map.' },
    { name: '[for x in list : x.attr]', type: 'syntax',   desc: 'For expression producing a list.' },
    { name: '{for k, v in map : k => v}',type: 'syntax',  desc: 'For expression producing a map.' },
    { name: 'resource[*].attr',         type: 'operator', desc: 'Splat expression — extracts an attribute from all instances.' },
    { name: 'dynamic "block" {}',       type: 'syntax',   desc: 'Dynamically generate repeated nested blocks.' },
    { name: 'templatefile(path, vars)', type: 'function', desc: 'Render a template file with variable substitution.' },
    { name: 'can(expr)',                type: 'function', desc: 'Return true if expression evaluates without error.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Conditional Expressions',
      points: [
        'condition ? true_val : false_val — evaluates to true_val if condition is true, false_val otherwise.',
        'Both branches must be the same type (or convertible to the same type).',
        'Used for environment-based sizing: instance_type = var.env == "prod" ? "t3.medium" : "t3.micro".',
        'Can be nested but deep nesting hurts readability — use locals to name intermediate conditions.',
      ],
    },
    {
      heading: 'For Expressions',
      points: [
        'Transform lists: [for s in var.names : upper(s)] — applies upper() to each element.',
        'Transform maps: {for k, v in var.tags : k => lower(v)} — transforms values.',
        'Filter: [for s in var.names : s if length(s) > 3] — include only matching elements.',
        'Produce a map from a list: {for s in var.names : s => length(s)} — keys from values.',
        'for expressions produce new values — they do not create resources (that is what for_each does).',
      ],
    },
    {
      heading: 'Splat Expressions',
      points: [
        'resource.name[*].attribute extracts an attribute from all instances of a count-based resource.',
        'Returns a list: aws_instance.web[*].id gives all instance IDs.',
        'Works with count resources. For for_each, use values(resource.name)[*].attribute or a for expression.',
        'Shorthand for [for o in resource.name : o.attribute].',
      ],
    },
    {
      heading: 'Dynamic Blocks',
      points: [
        'dynamic "block_type" { for_each = ...; content { ... } } generates repeated nested blocks.',
        'Used when a resource has a variable number of nested blocks (ingress rules, tags, disks).',
        'Inside content {}, use block_type.key and block_type.value to access iteration context.',
        'Avoid dynamic blocks when count or for_each on the resource itself would suffice.',
        'templatefile() renders a file template with HCL variable substitution for user_data scripts.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Conditionals & For',
      language: 'bash',
      code: `# Conditional expression
locals {
  instance_type = var.environment == "prod" ? "t3.medium" : "t3.micro"
  enable_deletion_protection = var.environment == "prod"
}

# For expression — list transformation
locals {
  upper_names = [for name in var.team_members : upper(name)]
  long_names  = [for name in var.team_members : name if length(name) > 5]
}

# For expression — map transformation
variable "subnet_config" {
  default = { web = "10.0.1.0/24", app = "10.0.2.0/24", db = "10.0.3.0/24" }
}

resource "aws_subnet" "tier" {
  for_each   = var.subnet_config
  vpc_id     = aws_vpc.main.id
  cidr_block = each.value
  tags       = { Name = each.key, Tier = each.key }
}

# For expression producing a map from for_each results
output "subnet_ids_by_tier" {
  value = { for k, v in aws_subnet.tier : k => v.id }
}`,
    },
    {
      label: 'Splat & Dynamic',
      language: 'bash',
      code: `# Splat expression with count
resource "aws_instance" "web" {
  count         = 3
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
}

output "all_instance_ids" {
  value = aws_instance.web[*].id    # splat: ["i-111", "i-222", "i-333"]
}

# Dynamic block — variable security group rules
variable "ingress_rules" {
  type = list(object({ port = number, cidr = string }))
  default = [
    { port = 80,  cidr = "0.0.0.0/0" },
    { port = 443, cidr = "0.0.0.0/0" },
  ]
}

resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = "tcp"
      cidr_blocks = [ingress.value.cidr]
    }
  }
}`,
    },
    {
      label: 'templatefile',
      language: 'bash',
      code: `# templates/user_data.sh.tpl
#!/bin/bash
hostnamectl set-hostname "\${hostname}"
apt-get update -y
apt-get install -y nginx
echo "Deployed to \${environment}" > /var/www/html/index.html

# main.tf
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  user_data = templatefile("\${path.module}/templates/user_data.sh.tpl", {
    hostname    = "web-\${var.environment}-01"
    environment = var.environment
  })
}

# can() for safe attribute access
locals {
  # Safe access — returns false if expression errors (e.g. null reference)
  has_public_ip = can(aws_instance.web.public_ip)
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using for expression to create resources (use for_each instead)',
      wrong: `# for expressions cannot create resources
[for env in ["dev","prod"] : resource "aws_s3_bucket" "b" { bucket = env }]
# This is invalid HCL syntax`,
      right: `variable "envs" { default = ["dev", "prod"] }
resource "aws_s3_bucket" "b" {
  for_each = toset(var.envs)
  bucket   = each.key
}`,
      explanation: 'for expressions produce values (lists, maps). To create multiple resources, use for_each on the resource block itself.',
    },
    {
      title: 'Splat on for_each resources (use for expression)',
      wrong: `resource "aws_instance" "web" {
  for_each = var.envs
  # ...
}
output "ids" {
  value = aws_instance.web[*].id   # ERROR: splat only works with count
}`,
      right: `output "ids" {
  value = values(aws_instance.web)[*].id
  # or:
  # value = { for k, v in aws_instance.web : k => v.id }
}`,
      explanation: 'Splat [*] only works with count-based resources. For for_each resources, use values() to get a list, or a for expression to build the output.',
    },
    {
      title: 'Deep nesting conditionals instead of using locals',
      wrong: `instance_type = var.env == "prod" ? (var.region == "us-east-1" ? "t3.large" : "t3.medium") : "t3.micro"`,
      right: `locals {
  is_prod      = var.env == "prod"
  is_us_east   = var.region == "us-east-1"
  instance_type = local.is_prod && local.is_us_east ? "t3.large" : local.is_prod ? "t3.medium" : "t3.micro"
}`,
      explanation: 'Named locals make complex conditionals readable and testable. Deep nesting in a single expression is hard to read and debug.',
    },
  ];

  challenge: Challenge = {
    title: 'Dynamic Security Group Rules',
    language: 'typescript',
    description: 'Create a variable defining a map of port-to-cidr rules. Use a dynamic block to generate ingress rules on a security group. Add a conditional that adds port 22 only in non-production environments. Output all open ports as a list.',
    hints: [
      'Variable type: map(string) mapping port → cidr',
      'dynamic "ingress" { for_each = var.ingress_rules }',
      'Conditional: merge the rules with an optional SSH rule using var.env != "prod"',
      'Output: [for rule in var.ingress_rules : rule] or keys()',
    ],
    starterCode: `variable "environment" { type = string; default = "dev" }
variable "ingress_rules" {
  type    = map(string)
  default = { "80" = "0.0.0.0/0", "443" = "0.0.0.0/0" }
}

locals {
  # TODO: merge SSH rule when not prod
}

resource "aws_security_group" "app" {
  name = "app-sg"
  # TODO: dynamic ingress block
}

output "open_ports" { value = keys(local.all_rules) }`,
    solution: `variable "environment" { type = string; default = "dev" }
variable "ingress_rules" {
  type    = map(string)
  default = { "80" = "0.0.0.0/0", "443" = "0.0.0.0/0" }
}

locals {
  ssh_rule  = var.environment != "prod" ? { "22" = "10.0.0.0/8" } : {}
  all_rules = merge(var.ingress_rules, local.ssh_rule)
}

resource "aws_security_group" "app" {
  name = "app-sg"
  dynamic "ingress" {
    for_each = local.all_rules
    content {
      from_port   = tonumber(ingress.key)
      to_port     = tonumber(ingress.key)
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }
}

output "open_ports" { value = keys(local.all_rules) }`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does [for s in var.names : s if length(s) > 3] produce?', options: ['A map of names to lengths', 'A filtered list of names longer than 3 characters', 'A boolean list', 'An error — if is not valid in for expressions'], answer: 1, explanation: 'For expressions support an if filter clause. This produces a new list containing only elements where the condition is true.' },
    { q: 'What is the splat expression aws_instance.web[*].id equivalent to?', options: ['aws_instance.web.id', '[for o in aws_instance.web : o.id]', 'values(aws_instance.web)', 'aws_instance.web.ids'], answer: 1, explanation: 'Splat [*] is shorthand for a for expression over all count instances, extracting the specified attribute into a list.' },
    { q: 'What does a dynamic block generate?', options: ['Multiple resource blocks', 'Repeated nested configuration blocks within a single resource', 'Multiple providers', 'A list of output values'], answer: 1, explanation: 'dynamic generates repeated nested blocks inside a single resource — like multiple ingress rules in a security group, based on a for_each collection.' },
    { q: 'When should you prefer locals over inline conditional expressions?', options: ['Always', 'When the expression is complex or reused in multiple places', 'Never — locals are slower', 'Only for string values'], answer: 1, explanation: 'Locals make complex or repeated expressions readable and maintainable. They also prevent duplication when the same value is needed in multiple arguments.' },
  { q: 'What does the splat expression do in Terraform?', options: ['It deletes all resources matching a pattern', 'It iterates over a list or set and extracts a specific attribute from each element, returning a new list', 'It concatenates strings in a list', 'It is the wildcard for provider version constraints'], answer: 1, explanation: 'The splat expression like var.list[*].attribute extracts the named attribute from every element in a list or set, returning a new list of those values. For example, aws_instance.web[*].id returns all instance IDs when count is used. For maps created with for_each, use a for expression instead since map keys are strings not integer indices.' },
  { q: 'What is the difference between a for expression and the for_each meta-argument in Terraform?', options: ['They are interchangeable and produce identical results', 'for expression transforms collections in expressions; for_each creates multiple resource instances from a map or set', 'for_each is for lists; for expression is for maps only', 'for expression runs at plan time; for_each runs only at apply time'], answer: 1, explanation: 'A for expression is used inside other expressions to transform collections, running at plan time and producing a new value like a list or map. for_each is a meta-argument on resource and module blocks that creates multiple instances identified by a map key. Use for_each to manage multiple similar resources; use for expressions to shape data passed to resources or locals.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can for expressions produce objects?', a: 'Yes: {for k, v in map : k => transform(v)} produces a map. You can also produce objects with specific keys.' },
    { q: 'What is the difference between for_each on a resource and a for expression?', a: 'for_each on a resource creates multiple infrastructure objects. A for expression transforms a collection into a new value (list or map) — it does not create anything.' },
    { q: 'When would you use templatefile() over heredoc?', a: 'templatefile() is better for complex scripts (>10 lines) stored in separate .sh.tpl or .yaml.tpl files, keeping main.tf clean. Heredoc works for short inline scripts.' },
    { q: 'What does can() do in Terraform?', a: 'can(expr) evaluates the expression and returns true if it succeeds, false if it produces an error (like indexing an empty list or accessing a null attribute). Useful for optional object attributes.' },
  { q: 'How do you use conditional expressions in Terraform?', a: 'Terraform supports ternary conditional expressions with the form: condition ? true_value : false_value. For example, setting instance_type to a large value when the environment variable is prod and a small value otherwise. Conditions can reference variables, locals, or data source attributes. You cannot use if/else blocks in HCL; only ternary expressions work in expression context. For complex conditionals, compute the value in a local block and reference the local in the resource argument.' },
  { q: 'What are dynamic blocks in Terraform and when should you use them?', a: 'Dynamic blocks generate repeated nested blocks inside a resource based on a collection variable. You specify the collection to iterate over and a content block defining the nested block attributes using the iterator value. Use dynamic blocks when a resource requires multiple identical nested blocks that vary only in their values, such as security group rules, IAM policy statements, or load balancer listener rules. Avoid overusing dynamic blocks as they can reduce configuration readability. Prefer flatter resource designs when possible and use dynamic blocks only when the number of nested blocks varies at runtime.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Expressions transform data — conditionals, for expressions, splat, and dynamic blocks make HCL DRY and flexible.',
    mustKnow: [
      'Ternary: cond ? true_val : false_val — both branches must be same type',
      'For list: [for x in coll : expr if cond]',
      'For map: {for k, v in map : k => transform(v)}',
      'Splat [*] works on count resources; use for expression for for_each resources',
      'dynamic block generates variable-count nested blocks inside a resource',
      'templatefile(path, vars) renders external template files for user_data etc.',
    ],
    interviewFocus: [
      'How do for expressions differ from for_each on a resource?',
      'When would you use a dynamic block vs a separate resource?',
      'What is splat notation and what are its limitations?',
    ],
  };
}
