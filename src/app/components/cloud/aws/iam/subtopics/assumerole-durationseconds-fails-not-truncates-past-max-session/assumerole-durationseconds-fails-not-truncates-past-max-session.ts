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
  templateUrl: './assumerole-durationseconds-fails-not-truncates-past-max-session.html',
  styleUrl: './assumerole-durationseconds-fails-not-truncates-past-max-session.scss'
})
export class AssumeroleDurationsecondsFailsNotTruncatesPastMaxSessionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page compresses session duration into a single, ambiguous phrase',
      points: [
        'The main page\'s own "IAM Identities" theory bullet states: "IAM Roles have NO long-term credentials — they issue temporary STS tokens (1h default, up to 12h)." Its own AssumeRole code example doesn\'t pass a --duration-seconds value at all, and nothing in the main page discusses what actually happens if a caller REQUESTS a duration outside the allowed range.',
        'A plausible, common assumption from that wording alone: requesting more than a role allows just gets silently capped at whatever the maximum is — "up to 12h" reads like a ceiling that clamps, not a hard boundary that rejects.',
      ]
    },
    {
      heading: 'Requesting a duration beyond the role\'s own maximum FAILS the call outright — it does not silently truncate',
      points: [
        'Per AWS\'s own AssumeRole API reference: "The value specified can range from 900 seconds (15 minutes) up to the maximum session duration set for the role... If you specify a value higher than this setting or the administrator setting (whichever is lower), the operation fails. For example, if you specify a session duration of 12 hours, but your administrator set the maximum session duration to 6 hours, your operation fails."',
        'This is a hard behavioral distinction the main page\'s "up to 12h" phrasing doesn\'t make clear: there is no clamping, no silent adjustment to the maximum allowed value — a DurationSeconds request exceeding the role\'s configured MaxSessionDuration simply fails the entire AssumeRole call with a validation error, returning no credentials at all.',
        'AWS\'s own documentation also confirms a related fact this hub\'s own AWS Fundamentals subtopic on role chaining already established from a different angle: "Role chaining limits your AWS CLI or AWS API role session to a maximum of one hour... if you assume a role using role chaining and provide a DurationSeconds parameter value greater than one hour, the operation fails." The same fail-not-truncate behavior applies to the 1-hour role-chaining cap, not just a role\'s own configured MaxSessionDuration.',
        'The default, if DurationSeconds is omitted entirely (as the main page\'s own code example does), is 3600 seconds (1 hour) — matching the main page\'s own "1h default" — but that default is unrelated to whether an explicitly-requested LONGER value would succeed; omitting the parameter and requesting a too-long value are two entirely different code paths with different outcomes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A role with a 6-hour MaxSessionDuration — matching AWS\'s own worked example',
      language: 'bash',
      code: `# Check (or set) the role's own configured maximum session duration
aws iam get-role --role-name CrossAccountRole \\
  --query 'Role.MaxSessionDuration'
# 21600   <- 6 hours, in seconds

# Request a session WITHIN that maximum -- succeeds normally,
# matching the main page's own AssumeRole example pattern:
aws sts assume-role \\
  --role-arn arn:aws:iam::123456789012:role/CrossAccountRole \\
  --role-session-name deploy-session \\
  --duration-seconds 18000
# {
#   "Credentials": { "AccessKeyId": "ASIAEXAMPLE...", "Expiration": "..." }
# }
# -- 5 hours (18000s), under the 6-hour cap -- works fine.`,
    },
    {
      label: 'Requesting past the maximum fails outright — no credentials at all',
      language: 'bash',
      code: `# Requesting the main page's own stated "up to 12h" ceiling on a
# role whose OWN MaxSessionDuration is only 6 hours:
aws sts assume-role \\
  --role-arn arn:aws:iam::123456789012:role/CrossAccountRole \\
  --role-session-name deploy-session \\
  --duration-seconds 43200
# An error occurred (ValidationError) when calling the AssumeRole
# operation: The requested DurationSeconds exceeds the MaxSessionDuration
# set for this role.
# -- NO credentials are returned at all -- this is a hard failure,
# not a silent clamp to 21600 (6 hours). A script that assumed
# "worst case, I just get a shorter session than requested" and
# doesn't handle this error will simply have no working credentials.

# The correct fix: request a value AT OR BELOW the role's own
# configured maximum -- there is no way to request "as much as
# possible" and have AWS figure out the right number for you:
aws sts assume-role \\
  --role-arn arn:aws:iam::123456789012:role/CrossAccountRole \\
  --role-session-name deploy-session \\
  --duration-seconds 21600
# succeeds -- exactly at the 6-hour cap.

# The SAME fail-not-truncate behavior applies to role chaining's
# separate, fixed 1-hour cap -- covered from the credentials-chain
# angle in this hub's own AWS Fundamentals subtopic:
export AWS_ACCESS_KEY_ID=... ; export AWS_SECRET_ACCESS_KEY=... ; export AWS_SESSION_TOKEN=...
# (using an ALREADY-ASSUMED role's own temporary credentials)
aws sts assume-role \\
  --role-arn arn:aws:iam::123456789012:role/AnotherRole \\
  --role-session-name chained-session \\
  --duration-seconds 3600
# An error occurred (ValidationError): The requested DurationSeconds
# exceeds the 1 hour session limit for roles assumed by role chaining.
# -- fails outright here too, even though 3600s (1h) is normally a
# perfectly ordinary, unremarkable request.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI/CD pipeline script calls AssumeRole requesting --duration-seconds 43200 (12 hours) for a long deploy job, following the main page\'s own "up to 12h" description as the maximum possible session length. The script assumes that even if the target role\'s own MaxSessionDuration is configured lower, AWS will just grant whatever the role\'s actual maximum allows. The pipeline starts failing with no credentials at all, and the failure is intermittent — it fails on some roles but not others. Using this subtopic\'s theory, explain the actual behavior, and why it only fails on SOME roles.',
    hint: 'Does AssumeRole silently clamp an over-large DurationSeconds request down to the role\'s own maximum, or does it reject the whole call? And would that explain why some target roles succeed while others don\'t?',
    solution: 'Per this subtopic\'s theory, AssumeRole does not silently clamp an over-large DurationSeconds request — it fails the ENTIRE call outright, returning no credentials at all, if the requested duration exceeds the target role\'s own configured MaxSessionDuration (which can be set anywhere from 1 to 12 hours per role). This explains the intermittent pattern exactly: for any target role whose own MaxSessionDuration happens to already be set to the full 12 hours, requesting 43200 seconds succeeds normally, since the request exactly matches (or is under) that role\'s own maximum. But for any target role configured with a SHORTER MaxSessionDuration — say, 4 or 6 hours, which is a very common, deliberate security practice for sensitive deploy roles — the identical 43200-second request fails outright with a validation error, since it exceeds that specific role\'s own cap. The pipeline script\'s underlying assumption (that AWS will "figure out" the right duration for whichever role is being assumed) is exactly the misconception this subtopic corrects — the fix is for the script to either request a duration it KNOWS is safely within every target role\'s own configured maximum (e.g. a conservative default like 3600 seconds, unless the actual per-role maximum is known and used explicitly), or to look up each role\'s own MaxSessionDuration via get-role beforehand and request no more than that value.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Requesting a longer session duration than a role\'s configured MaxSessionDuration in an AssumeRole call, matching the main page\'s own "up to 12h" phrasing, results in AWS granting the role\'s own actual maximum instead.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states this fails the ENTIRE AssumeRole call outright with a validation error — no credentials are returned at all; there is no silent clamping or truncation to the role\'s actual maximum.'
    },
    {
      thought: 'Since every IAM role can be configured with a MaxSessionDuration up to 12 hours, requesting a 12-hour session should work consistently across any role in an account.',
      reality: 'Per this subtopic\'s exercise, MaxSessionDuration is configured PER ROLE (defaulting to 1 hour but adjustable up to 12), so the same 12-hour request can succeed for one role and fail outright for another, depending entirely on each individual role\'s own configured setting.'
    },
    {
      thought: 'The 1-hour session cap for role chaining (covered in this hub\'s own AWS Fundamentals subtopic) behaves differently from a role\'s own MaxSessionDuration limit — perhaps it truncates rather than fails.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation confirms the identical fail-not-truncate behavior applies to the role-chaining 1-hour cap as well — requesting more than 1 hour via role chaining fails the call outright, exactly like exceeding a role\'s own configured MaxSessionDuration.'
    }
  ];
}
