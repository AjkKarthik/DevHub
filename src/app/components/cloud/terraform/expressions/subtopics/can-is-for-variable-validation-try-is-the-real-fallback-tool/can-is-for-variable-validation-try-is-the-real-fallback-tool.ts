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
  templateUrl: './can-is-for-variable-validation-try-is-the-real-fallback-tool.html',
  styleUrl: './can-is-for-variable-validation-try-is-the-real-fallback-tool.scss'
})
export class CanIsForVariableValidationTryIsTheRealFallbackToolSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows can() as a general safe-access tool, with no mention of try() at all',
      points: [
        'The main page\'s own example comment says: "Safe access — returns false if expression errors (e.g. null reference)" for <code>can(aws_instance.web.public_ip)</code>, and its QnA describes <code>can()</code> the same general way. <code>try()</code> — a distinct, closely related function — is never mentioned anywhere on the page at all.',
      ]
    },
    {
      heading: 'can() is specifically designed for variable validation — a yes/no question, not a fallback mechanism',
      points: [
        '<code>can(expr)</code> returns a plain boolean: true if the expression evaluates successfully, false if it errors. HashiCorp\'s own guidance is that <code>can()</code> is intended primarily for <code>validation</code> blocks on variables, where a simple pass/fail check is exactly what\'s needed — the main page\'s own Variables topic already shows this exact pattern with functions like <code>contains()</code>.',
        'Because <code>can()</code> technically accepts ANY expression, it is tempting to sprinkle it throughout a configuration as a general "did this work?" check — but doing so means a genuine typo or configuration bug inside that expression is swallowed the same way an "expected" missing-attribute case is, silently returning false with no indication of WHICH kind of failure actually happened.',
      ]
    },
    {
      heading: 'try() is the actual fallback-VALUE tool — and HashiCorp\'s own recommendation for where to put it',
      points: [
        '<code>try(expr1, expr2, ...)</code> evaluates a series of expressions in order and returns the result of the FIRST one that does not error — unlike <code>can()</code>, it produces an actual usable value, not just a boolean, making it the natural tool when the goal is "use this value, or fall back to that one" rather than "check whether this would work."',
        'HashiCorp\'s own guidance is to confine <code>try()</code> usage to a small number of dedicated <code>locals</code> whose specific job is normalizing potentially-missing data — keeping error-handling logic concentrated in one visible place, rather than scattered as inline <code>try()</code> calls throughout resource arguments where a real bug could just as easily be hiding behind a fallback.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'can(): the intended use — variable validation',
      language: 'bash',
      code: `variable "cidr_block" {
  type = string
  validation {
    # can() here is exactly the intended use case: a simple
    # yes/no check of whether cidrhost() would succeed on
    # this input, used purely to decide pass/fail.
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "cidr_block must be a valid CIDR notation string."
  }
}

# The main page's own example, technically valid but outside
# can()'s intended use -- a boolean check standing in for what
# should probably be a fallback VALUE:
locals {
  has_public_ip = can(aws_instance.web.public_ip)
  # This only tells you TRUE/FALSE -- it doesn't give you a
  # usable IP value or a documented fallback if there isn't one.
}`,
    },
    {
      label: 'try(): the actual fallback-value tool, confined to one local',
      language: 'bash',
      code: `locals {
  # try() confined to a single, dedicated local -- exactly
  # HashiCorp's own recommended pattern -- normalizing a
  # value that might not exist, with a clear, visible fallback:
  public_ip = try(aws_instance.web.public_ip, "no-public-ip")
}

resource "aws_route53_record" "app" {
  # Every OTHER reference in the module uses local.public_ip
  # directly -- straightforward, with the error-handling logic
  # concentrated in ONE place instead of scattered can() checks:
  records = [local.public_ip]
}

# A real risk of overusing can()/try() outside this pattern:
locals {
  # If "config.region" is misspelled here (a genuine bug), this
  # silently falls back to "us-east-1" instead of surfacing the
  # typo -- can()/try() swallow expected AND unexpected failures
  # identically, with no way to tell them apart from the result.
  region = try(var.confg.region, "us-east-1")   # typo: confg
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own has_public_ip example, a team scatters `can(...)` and `try(..., fallback)` calls throughout many resource blocks as a general "just in case" safety habit. Months later, a genuine typo in one of these expressions (a misspelled attribute name) goes completely unnoticed for weeks — the fallback value silently satisfied the configuration instead of erroring. What does HashiCorp\'s own guidance say about where try() usage should be concentrated, and why does that specifically help catch this kind of bug sooner?',
    hint: 'Think about what happens to a genuine typo/bug inside an expression that both can() and try() are designed to make error-tolerant.',
    solution: 'HashiCorp\'s own recommendation is to confine try() usage to a small number of dedicated locals whose specific job is normalizing potentially-missing data — not scattering it inline throughout resource arguments. Concentrating error-handling logic in one visible place means a genuine typo inside a try() expression is far more likely to be spotted during review (since that one local is the obvious place to look when something related misbehaves), rather than being buried among dozens of scattered try() calls where a real bug and an intentionally-tolerated missing value look identical from the outside — both just silently produce the fallback with no distinguishing signal.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'can() and try() are two names for the same underlying behavior, interchangeable depending on personal preference.',
      reality: 'Per this subtopic\'s theory, they serve different purposes: can() returns a boolean (a yes/no check, intended for variable validation), while try() returns an actual fallback VALUE from the first expression that succeeds — genuinely different return types and use cases.'
    },
    {
      thought: 'Sprinkling can() or try() throughout a configuration as a general safety habit is always a good, low-risk practice with no real downside.',
      reality: 'Per this subtopic\'s theory, both functions swallow ANY error the wrapped expression produces — a genuine bug (like a typo) is silently treated the same as an "expected" missing value, which is why HashiCorp specifically recommends confining try() to dedicated, visible locals rather than scattering it broadly.'
    },
    {
      thought: 'can() is a general-purpose safe-access tool appropriate anywhere in a Terraform configuration, as the main page\'s own has_public_ip example seems to suggest.',
      reality: 'Per this subtopic\'s theory, can() is specifically intended for variable validation blocks, where a simple pass/fail check is exactly what\'s needed — HashiCorp\'s own guidance recommends try() instead for general fallback-value use elsewhere in a configuration.'
    }
  ];
}
