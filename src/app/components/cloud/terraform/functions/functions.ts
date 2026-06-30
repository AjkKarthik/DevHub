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
  selector: 'app-tf-functions',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './functions.html',
  styleUrl: './functions.scss',
})
export class TfFunctions {
  quickRef: QuickRefItem[] = [
    { name: 'toset(list)',           type: 'function', desc: 'Convert list to set (deduplicates).' },
    { name: 'tolist(set)',           type: 'function', desc: 'Convert set/tuple to list.' },
    { name: 'tomap(object)',         type: 'function', desc: 'Convert object to map.' },
    { name: 'merge(a, b)',           type: 'function', desc: 'Merge maps — b overrides duplicate keys from a.' },
    { name: 'flatten(list)',         type: 'function', desc: 'Flatten nested lists into a single list.' },
    { name: 'lookup(map, key, def)', type: 'function', desc: 'Safe map access with a fallback default.' },
    { name: 'cidrsubnet(cidr, n, i)',type: 'function', desc: 'Calculate a subnet CIDR from a parent block.' },
    { name: 'jsonencode(val)',        type: 'function', desc: 'Encode a value as JSON string.' },
    { name: 'jsondecode(str)',        type: 'function', desc: 'Parse a JSON string into HCL value.' },
    { name: 'format(fmt, ...)',       type: 'function', desc: 'Printf-style string formatting.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'String Functions',
      points: [
        'format("%s-%s", var.project, var.env) — printf-style formatting.',
        'formatlist("%s.domain.com", var.hosts) — apply format to each list element.',
        'join(", ", list) — concatenate list items with a delimiter.',
        'split(",", "a,b,c") — split string into a list.',
        'trimspace(), upper(), lower(), replace() for string manipulation.',
        'startswith() / endswith() — string prefix/suffix checks (Terraform 1.3+).',
      ],
    },
    {
      heading: 'Collection Functions',
      points: [
        'merge(map1, map2) — combine maps, later maps win on duplicate keys.',
        'flatten([[1,2],[3,4]]) → [1,2,3,4] — removes nesting.',
        'distinct(list) — remove duplicate elements while preserving order.',
        'concat(list1, list2) — join lists.',
        'length(collection) — count of elements in list, map, or string.',
        'keys(map) / values(map) — extract map keys or values as lists.',
        'contains(list, val) — check if list includes a value.',
        'index(list, val) — find the index of a value in a list.',
      ],
    },
    {
      heading: 'Type Conversion',
      points: [
        'tostring(), tonumber(), tobool() — convert between primitive types.',
        'toset(list) — convert to set, removing duplicates (required for for_each).',
        'tolist(set) — convert set to list (ordering is not guaranteed).',
        'tomap(object) — convert object with string values to map.',
        'Type conversions happen automatically in many contexts but explicit conversion avoids surprises.',
      ],
    },
    {
      heading: 'IP Network & Encoding',
      points: [
        'cidrsubnet("10.0.0.0/16", 8, 0) → "10.0.0.0/24" — carve /24 subnets from a /16.',
        'cidrhost("10.0.0.0/24", 5) → "10.0.0.5" — calculate a specific host IP.',
        'jsonencode(val) — serialize to JSON string (for IAM policies, user_data, etc.).',
        'jsondecode(str) — parse JSON string (for secrets from Secrets Manager).',
        'yamldecode(str) — parse YAML string.',
        'base64encode() / base64decode() for encoding data.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'String & Collection',
      language: 'bash',
      code: `locals {
  # String functions
  name_prefix  = format("%s-%s", var.project, var.env)
  host_names   = formatlist("%s.internal", var.instance_names)
  tag_string   = join(", ", keys(local.common_tags))
  parts        = split("-", var.resource_name)

  # Collection functions
  all_tags     = merge(local.common_tags, { Extra = "value" })
  flat_subnets = flatten([module.network_a.subnet_ids, module.network_b.subnet_ids])
  unique_azs   = distinct(concat(var.primary_azs, var.secondary_azs))
  env_set      = toset(["dev", "staging", "prod"])  # for for_each
}

# Safe map lookup with default
resource "aws_instance" "web" {
  instance_type = lookup(var.instance_sizes, var.environment, "t3.micro")
}`,
    },
    {
      label: 'IP & Encoding',
      language: 'bash',
      code: `# Subnet CIDR calculation
resource "aws_subnet" "private" {
  count      = 3
  vpc_id     = aws_vpc.main.id
  cidr_block = cidrsubnet("10.0.0.0/16", 8, count.index)
  # index 0 → 10.0.0.0/24, index 1 → 10.0.1.0/24, ...
}

# IAM policy as JSON — jsonencode avoids heredoc escaping issues
resource "aws_iam_policy" "s3_read" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = ["arn:aws:s3:::\${var.bucket_name}/*"]
    }]
  })
}

# Parse secret JSON from Secrets Manager
data "aws_secretsmanager_secret_version" "db" {
  secret_id = "prod/db-creds"
}
locals {
  db = jsondecode(data.aws_secretsmanager_secret_version.db.secret_string)
  # db.username, db.password
}`,
    },
    {
      label: 'Practical Examples',
      language: 'bash',
      code: `# Flatten module outputs across multiple modules
locals {
  all_subnet_ids = flatten([
    module.az1.subnet_ids,
    module.az2.subnet_ids,
    module.az3.subnet_ids,
  ])

  # Build map from list using for + index
  name_to_index = { for i, name in var.names : name => i }

  # Conditional merge — add extra tag in production
  final_tags = merge(
    local.common_tags,
    var.environment == "prod" ? { CostCenter = "Engineering" } : {}
  )
}

# keys() and values()
output "tag_keys"   { value = keys(local.final_tags) }
output "tag_values" { value = values(local.final_tags) }

# contains() for validation
locals {
  valid_sizes = ["small", "medium", "large"]
  size_valid  = contains(local.valid_sizes, var.size)
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using list instead of toset for for_each',
      wrong: `variable "buckets" { default = ["data", "logs"] }
resource "aws_s3_bucket" "b" {
  for_each = var.buckets   # ERROR: for_each requires set or map, not list
}`,
      right: `resource "aws_s3_bucket" "b" {
  for_each = toset(var.buckets)   # convert list to set first
  bucket   = each.key
}`,
      explanation: 'for_each requires a map or set, not a list. toset() deduplicates and converts a list to the required type.',
    },
    {
      title: 'Hardcoding IAM policies as strings instead of jsonencode',
      wrong: `resource "aws_iam_policy" "p" {
  policy = <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:*","Resource":"*"}]}
EOF
}`,
      right: `resource "aws_iam_policy" "p" {
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "s3:*", Resource = "*" }]
  })
}`,
      explanation: 'jsonencode() produces valid JSON, enables syntax highlighting, and supports HCL variable references inside the structure.',
    },
    {
      title: 'Using merge() incorrectly — later args win',
      wrong: `locals {
  # Expecting defaults to win over user input — WRONG
  tags = merge(var.user_tags, local.required_tags)
}`,
      right: `locals {
  # Required tags should win — put them last
  tags = merge(var.user_tags, local.required_tags)
}
# merge(a, b) — b WINS on duplicate keys`,
      explanation: 'In merge(a, b), b values override a values for duplicate keys. Put the higher-priority map last to ensure it wins.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Subnet Layout',
    language: 'typescript',
    description: 'Use cidrsubnet() to carve private and public subnets from "10.0.0.0/16". Create 3 public /24 subnets (new bits=8, indices 0-2) and 3 private /24 subnets (indices 10-12). Use flatten() to combine them for an output. Use jsonencode() to build an IAM policy that allows s3:GetObject on a bucket ARN variable.',
    hints: [
      'cidrsubnet("10.0.0.0/16", 8, index) for each subnet',
      'Use count = 3 and count.index for the index',
      'flatten([public_cidrs, private_cidrs]) combines lists',
      'jsonencode({ Version = "2012-10-17", Statement = [...] })',
    ],
    starterCode: `variable "bucket_arn" { type = string; default = "arn:aws:s3:::my-bucket/*" }

resource "aws_vpc" "main" { cidr_block = "10.0.0.0/16" }

# TODO: 3 public subnets (indices 0-2)
# TODO: 3 private subnets (indices 10-12)

output "all_cidrs" {
  # TODO: flatten public and private cidr_blocks
}

resource "aws_iam_policy" "s3_read" {
  # TODO: jsonencode policy allowing s3:GetObject on var.bucket_arn
}`,
    solution: `variable "bucket_arn" { type = string; default = "arn:aws:s3:::my-bucket/*" }

resource "aws_vpc" "main" { cidr_block = "10.0.0.0/16" }

resource "aws_subnet" "public" {
  count      = 3
  vpc_id     = aws_vpc.main.id
  cidr_block = cidrsubnet("10.0.0.0/16", 8, count.index)
}

resource "aws_subnet" "private" {
  count      = 3
  vpc_id     = aws_vpc.main.id
  cidr_block = cidrsubnet("10.0.0.0/16", 8, count.index + 10)
}

output "all_cidrs" {
  value = flatten([aws_subnet.public[*].cidr_block, aws_subnet.private[*].cidr_block])
}

resource "aws_iam_policy" "s3_read" {
  name = "s3-read-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject"]
      Resource = [var.bucket_arn]
    }]
  })
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does cidrsubnet("10.0.0.0/16", 8, 2) return?', options: ['10.0.0.2/24', '10.0.2.0/24', '10.2.0.0/24', '10.0.0.0/8'], answer: 1, explanation: 'cidrsubnet adds 8 bits to the prefix (16+8=24) and uses index 2 to produce the third /24 subnet: 10.0.2.0/24.' },
    { q: 'What does merge({a=1},{a=2,b=3}) return?', options: ['{a=1,b=3}', '{a=2,b=3}', '{a=1,a=2,b=3}', 'Error'], answer: 1, explanation: 'merge() combines maps with the rightmost map winning on duplicate keys. {a=1} is overridden by {a=2}, so the result is {a=2,b=3}.' },
    { q: 'Why must you call toset() before using a list with for_each?', options: ['Lists are deprecated in Terraform', 'for_each requires a map or set — lists have numeric indices which could cause ordering issues', 'toset() is faster than lists', 'Sets automatically sort by name'], answer: 1, explanation: 'for_each requires a map (string keys) or set. Lists have numeric indices that can shift. toset() converts and deduplicates, providing stable string keys.' },
    { q: 'What function flattens [[1,2],[3,4]] into [1,2,3,4]?', options: ['concat()', 'merge()', 'flatten()', 'tolist()'], answer: 2, explanation: 'flatten() takes a nested list and produces a single-level list. It is commonly used after module outputs that each return lists.' },
  { q: 'What does the zipmap() function do in Terraform?', options: ['It compresses module source files before downloading', 'It creates a map from two equal-length lists: one of keys and one of values', 'It merges two maps by combining their key-value pairs', 'It converts a map to a list of tuples'], answer: 1, explanation: 'zipmap(keys, values) creates a map from two lists of equal length. The first list provides the map keys and the second provides the corresponding values. To convert a list of objects to a map keyed by an attribute, use a for expression: { for obj in var.list : obj.name => obj }. There is no single built-in function for this transformation; the for expression is the idiomatic Terraform approach.' },
  { q: 'What does the templatefile() function do in Terraform?', options: ['It downloads a remote template file from a URL', 'It reads a file and renders it as a template substituting variable references', 'It validates that a file exists at the given path', 'It converts a JSON file to HCL format'], answer: 1, explanation: 'templatefile(path, vars) reads a file at the given path and renders it as a template, substituting variable references with the provided variable map values. Useful for generating user_data scripts, cloud-init configs, or policy documents with dynamic values. The template file uses the same interpolation syntax as HCL strings but in a separate file. Prefer templatefile over the deprecated template_file data source.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can I call custom functions in Terraform?', a: 'No — Terraform HCL only supports built-in functions. You can work around this with external data sources (running a script) or provider-defined functions (OpenTofu 1.x feature).' },
    { q: 'What is the difference between lookup() and direct map access?', a: 'map[key] throws an error if the key does not exist. lookup(map, key, default) returns the default value instead. Use lookup() when a key may be absent.' },
    { q: 'How do I use jsonencode for complex nested IAM policies?', a: 'jsonencode() accepts any HCL value (objects, lists, booleans) and serializes it to valid JSON. You can reference variables and locals inside the structure — it is much cleaner than heredoc JSON strings.' },
    { q: 'What does flatten() do with triple-nested lists?', a: 'flatten() removes all levels of nesting — it fully flattens regardless of depth. [[[1],2],[3]] becomes [1,2,3].' },
  { q: 'What are the most commonly used string functions in Terraform?', a: 'Key string functions: format() for printf-style string formatting with named or positional arguments. join() concatenates list elements with a separator. split() divides a string into a list on a delimiter. replace() substitutes substrings. trimspace() removes leading and trailing whitespace. lower() and upper() change case. substr() extracts a substring by offset and length. regex() matches regular expressions and can extract capture groups. These functions are evaluated at plan time and work in locals, variable defaults, and resource arguments.' },
  { q: 'How do you use the try() function in Terraform for safe attribute access?', a: 'try() evaluates expressions in order and returns the result of the first one that succeeds without error. Most commonly used to safely access attributes that may not exist, providing a default as the final fallback argument. This is especially useful when working with optional object attributes before Terraform 1.3 introduced the optional() keyword in type constraints. try() catches errors at plan time; it does not handle runtime failures during apply. Use it sparingly as it can hide type mismatches between expected and actual data shapes.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Terraform built-in functions transform strings, collections, types, and network CIDRs — no custom functions allowed.',
    mustKnow: [
      'merge(a, b) — b wins on duplicate keys; use for tag composition',
      'flatten() removes all nesting from nested lists',
      'toset(list) required for for_each — converts list to set',
      'cidrsubnet(cidr, bits, index) — carves subnets from CIDR blocks',
      'jsonencode() for IAM policies and structured data (avoids heredoc pitfalls)',
      'lookup(map, key, default) — safe access with fallback',
    ],
    interviewFocus: [
      'How do you build dynamic IAM policies in Terraform?',
      'Explain cidrsubnet() and a real use case',
      'Why do you need toset() before for_each on a list variable?',
    ],
  };
}
