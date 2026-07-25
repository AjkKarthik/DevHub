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
  templateUrl: './for-each-requires-a-map-or-set-not-a-bare-list.html',
  styleUrl: './for-each-requires-a-map-or-set-not-a-bare-list.scss'
})
export class ForEachRequiresAMapOrSetNotABareListSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s mistake block shows for_each fixing the count/index problem, but glosses over what for_each actually accepts',
      points: [
        'The main page\'s "Using count instead of for_each for maps" mistake entry shows <code>for_each = var.buckets</code> where <code>buckets</code> is already a map — a correct, working example. It never shows the far more common first attempt: passing a plain list straight into <code>for_each</code>.',
      ]
    },
    {
      heading: 'for_each only accepts a map or a set of strings — never a bare list',
      points: [
        'Terraform\'s own documented type constraint for <code>for_each</code> is a map or a set of strings — a plain list (even a list of strings) is rejected outright with a type-mismatch error at plan time, before anything is provisioned.',
        'The reason is uniqueness: <code>for_each</code> needs a stable, unique key per instance to track in state. A list is ordered and can contain duplicates — <code>["a", "b", "a"]</code> would produce two instances both keyed "a", which is ambiguous. A set enforces uniqueness by construction, which is why the type system requires one.',
        'The standard fix is wrapping the list in <code>toset(...)</code> — <code>for_each = toset(var.bucket_names)</code> — which converts it to a set of strings, satisfying the type constraint and giving each instance a unique, stable key.',
      ]
    },
    {
      heading: 'toset() has its own tradeoff: it discards order and silently drops duplicates',
      points: [
        'Because a set is unordered, <code>toset()</code> means you can no longer rely on list index/order anywhere downstream — code that assumed <code>var.bucket_names[0]</code> corresponds to a specific instance no longer has that guarantee once the same list is fed through <code>toset()</code> for <code>for_each</code>.',
        'A set also silently drops duplicate values — <code>toset(["a", "b", "a"])</code> produces a two-element set, not an error, which can quietly under-provision if the original list\'s duplicates were not actually intentional.',
        'When keys need to carry more meaning than a plain string (or the list already has natural key-like structure), converting the list to a map keyed by that natural identifier — instead of reaching for <code>toset()</code> — is usually the better fix, since it avoids the ordering/duplicate tradeoff entirely.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The type error, and the toset() fix',
      language: 'bash',
      code: `# Straight list -- rejected at plan time
variable "bucket_names" {
  default = ["logs", "backups", "assets"]
}

resource "aws_s3_bucket" "b" {
  for_each = var.bucket_names   # Error: Invalid for_each argument
  bucket   = each.value          # for_each supports maps and sets
                                  # of strings, but you have provided
                                  # a value of type list of string.
}

# Fix: wrap the list in toset()
resource "aws_s3_bucket" "b" {
  for_each = toset(var.bucket_names)
  bucket   = each.value
  # for a set, each.key == each.value -- both are the string itself
}`,
    },
    {
      label: 'What toset() gives up: order and duplicate detection',
      language: 'bash',
      code: `variable "bucket_names" {
  default = ["logs", "backups", "logs"]   # accidental duplicate
}

resource "aws_s3_bucket" "b" {
  for_each = toset(var.bucket_names)
  bucket   = each.value
}
# toset() silently collapses this to {"logs", "backups"} --
# only 2 buckets get created, no warning about the dropped
# duplicate "logs" entry.

# If the list has natural key-like structure, a map avoids
# both the ordering loss AND the silent-duplicate-drop risk:
variable "buckets" {
  default = {
    logs    = { versioning = false }
    backups = { versioning = true }
  }
}

resource "aws_s3_bucket" "b" {
  for_each = var.buckets   # already a map -- no toset() needed
  bucket   = each.key
}

resource "aws_s3_bucket_versioning" "b" {
  for_each = var.buckets
  bucket   = aws_s3_bucket.b[each.key].id
  versioning_configuration {
    status = each.value.versioning ? "Enabled" : "Suspended"
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes `for_each = var.environments` where `environments` is declared as `variable "environments" { default = ["dev", "staging", "prod"] }` — a plain list of strings. `terraform plan` immediately fails with a type-mismatch error before touching any provider. What is the minimal one-word-function fix, and what specific guarantee does that fix NOT give you that a hand-written map would?',
    hint: 'Think about what type for_each actually requires, and what happens to duplicate values and ordering once a list passes through that conversion.',
    solution: 'The minimal fix is wrapping the list in `toset(...)`: `for_each = toset(var.environments)`. This satisfies for_each\'s map-or-set-of-strings type requirement and gives each instance a unique key (each.key and each.value both equal the string itself, e.g. "dev"). What it does NOT give you: any guarantee about order (sets are unordered, so nothing downstream can rely on `environments[0]` meaning "dev" specifically), and it silently collapses duplicate values instead of erroring — `toset(["dev", "dev", "prod"])` quietly produces only 2 entries with no warning. A hand-written map like `{ dev = {...}, staging = {...}, prod = {...} }` avoids both gaps at the cost of being more verbose to define.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'for_each works with any collection type — lists, maps, or sets — you just pick whichever is most convenient to write.',
      reality: 'Per this subtopic\'s theory, for_each has a strict type constraint: only a map or a set of strings is accepted. A plain list is rejected outright at plan time with a type-mismatch error, regardless of how convenient it would be to write.'
    },
    {
      thought: 'toset() is a pure, lossless conversion — it just changes the type without changing the data.',
      reality: 'Per this subtopic\'s theory, toset() is lossy in two specific ways: it discards the list\'s original order (sets are unordered), and it silently collapses duplicate values into one entry with no error or warning.'
    },
    {
      thought: 'Once for_each is used instead of count, the count-vs-for_each index-shift problem from the main page\'s own mistake entry is fully solved no matter how the for_each value was constructed.',
      reality: 'Per this subtopic\'s theory, for_each does solve the index-shift problem specifically because map/set keys are stable strings rather than numeric indices — but a toset()-derived key is still just the value itself, so if the underlying list\'s VALUES change (not just their order), the derived keys change too, which is a different but related pitfall worth being aware of.'
    }
  ];
}
